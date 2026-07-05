/**
 * Online Source Manager - Data Hook
 * Версия: 11.1.0
 * Автоматический перехват данных при открытии балансера или смене источника
 */

(function() {
    'use strict';

    if (window.osm_data_hook_loaded) return;
    window.osm_data_hook_loaded = true;

    var DEBUG = true;
    var isProcessing = false;

    function log() {
        if (!DEBUG) return;
        var args = Array.prototype.slice.call(arguments);
        console.log.apply(console, ['[OSM Hook]'].concat(args));
    }

    function logError() {
        var args = Array.prototype.slice.call(arguments);
        console.error.apply(console, ['[OSM Hook ERROR]'].concat(args));
    }

    // ============================================================
    // 1. Глобальное хранилище данных (доступно напрямую)
    // ============================================================
    window._osm_data = {
        // Данные
        seasons: [],
        voices: [],
        videos: [],
        sources: [],
        
        // Текущие значения
        currentSeason: 0,
        currentVoice: '',
        currentSource: '',
        movieTitle: '',
        isSerial: false,
        
        // Служебное
        lastUpdate: 0,
        isReady: false
    };

    // ============================================================
    // 2. Функции для работы с данными
    // ============================================================
    function updateOsmData(data) {
        var updated = false;
        
        if (data.seasons) {
            window._osm_data.seasons = data.seasons;
            updated = true;
        }
        if (data.voices) {
            window._osm_data.voices = data.voices;
            updated = true;
        }
        if (data.videos) {
            window._osm_data.videos = data.videos;
            updated = true;
        }
        if (data.sources) {
            window._osm_data.sources = data.sources;
            updated = true;
        }
        if (data.currentSeason !== undefined) {
            window._osm_data.currentSeason = data.currentSeason;
            updated = true;
        }
        if (data.currentVoice) {
            window._osm_data.currentVoice = data.currentVoice;
            updated = true;
        }
        if (data.currentSource) {
            window._osm_data.currentSource = data.currentSource;
            updated = true;
        }
        if (data.movieTitle) {
            window._osm_data.movieTitle = data.movieTitle;
            updated = true;
        }
        if (data.isSerial !== undefined) {
            window._osm_data.isSerial = data.isSerial;
            updated = true;
        }
        
        if (updated) {
            window._osm_data.lastUpdate = Date.now();
            window._osm_data.isReady = true;
            
            log('✅ Данные обновлены:');
            log('  📺 ' + window._osm_data.movieTitle + (window._osm_data.isSerial ? ' (сериал)' : ' (фильм)'));
            log('  📡 Источник: ' + window._osm_data.currentSource);
            log('  📅 Сезоны: ' + window._osm_data.seasons.length + ' шт.');
            log('  🎤 Переводы: ' + window._osm_data.voices.length + ' шт.');
            log('  🎬 Видео: ' + window._osm_data.videos.length + ' шт.');
            if (window._osm_data.currentSeason) {
                log('  📌 Текущий сезон: ' + window._osm_data.currentSeason);
            }
            if (window._osm_data.currentVoice) {
                log('  📌 Текущий перевод: ' + window._osm_data.currentVoice);
            }
        }
    }

    function getCurrentMovieTitle() {
        try {
            var active = Lampa.Activity.active();
            if (active && active.movie) {
                return active.movie.title || active.movie.name || '';
            }
        } catch(e) {}
        return '';
    }

    function isSerial() {
        try {
            var active = Lampa.Activity.active();
            if (active && active.movie) {
                return !!(active.movie.name || active.movie.number_of_seasons);
            }
        } catch(e) {}
        return false;
    }

    function getCurrentSource() {
        try {
            return Lampa.Storage.get('active_balanser', '') || Lampa.Storage.get('online_balanser', '');
        } catch(e) {}
        return '';
    }

    // ============================================================
    // 3. Перехват parse (основной)
    // ============================================================
    function hookParse() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            log('Компонент lampac не найден');
            return false;
        }

        var proto = Lampac.prototype;
        if (typeof proto.parse !== 'function') {
            log('Метод parse не найден');
            return false;
        }

        if (proto._osm_parse_hooked) {
            log('parse уже перехвачен');
            return true;
        }

        proto._osm_parse_hooked = true;
        var originalParse = proto.parse;

        proto.parse = function(str) {
            var result = originalParse.call(this, str);

            if (isProcessing) return result;
            isProcessing = true;

            try {
                var $html = $('<div>' + str + '</div>');
                var data = {
                    seasons: [],
                    voices: [],
                    videos: [],
                    currentSeason: 0,
                    currentVoice: '',
                    movieTitle: getCurrentMovieTitle(),
                    isSerial: isSerial(),
                    currentSource: getCurrentSource()
                };

                // === Перехват сезонов ===
                var seasonItems = $html.find('.videos__item[method="link"]');
                if (seasonItems.length > 0) {
                    seasonItems.each(function() {
                        var $item = $(this);
                        try {
                            var itemData = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            var seasonNum = parseInt($item.attr('s')) || 0;
                            data.seasons.push({
                                num: seasonNum,
                                text: text,
                                url: itemData.url
                            });
                        } catch(e) {}
                    });
                    if (data.seasons.length > 0) {
                        log('  📅 Перехвачены сезоны: ' + data.seasons.map(function(s) { return s.num; }).join(', '));
                    }
                }

                // === Перехват переводов ===
                var voiceButtons = $html.find('.videos__button');
                if (voiceButtons.length > 0) {
                    voiceButtons.each(function() {
                        var $item = $(this);
                        try {
                            var itemData = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            var isActive = $item.hasClass('active');
                            data.voices.push({
                                text: text,
                                url: itemData.url,
                                active: isActive
                            });
                            if (isActive) {
                                data.currentVoice = text;
                            }
                        } catch(e) {}
                    });
                    if (data.voices.length > 0) {
                        log('  🎤 Перехвачены переводы: ' + data.voices.map(function(v) { return v.text + (v.active ? ' [A]' : ''); }).join(', '));
                    }
                }

                // === Перехват видео ===
                var videoItems = $html.find('.videos__item[method="play"]');
                if (videoItems.length > 0) {
                    videoItems.each(function() {
                        var $item = $(this);
                        try {
                            var itemData = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            var season = parseInt($item.attr('s')) || 0;
                            var episode = parseInt($item.attr('e')) || 0;
                            data.videos.push({
                                text: text,
                                url: itemData.url,
                                season: season,
                                episode: episode,
                                voice_name: itemData.voice_name || ''
                            });
                        } catch(e) {}
                    });
                    log('  🎬 Перехвачено видео: ' + data.videos.length + ' шт.');
                }

                // === Перехват текущего сезона ===
                var choice = this.getChoice ? this.getChoice() : {};
                if (choice && typeof choice.season !== 'undefined') {
                    var seasonIdx = choice.season || 0;
                    if (data.seasons[seasonIdx]) {
                        data.currentSeason = data.seasons[seasonIdx].num;
                        log('  📌 Текущий сезон: ' + data.currentSeason);
                    }
                }

                // === Перехват источников ===
                if (window._osm_sources) {
                    data.sources = window._osm_sources;
                }

                updateOsmData(data);

            } catch(e) {
                logError('Ошибка перехвата:', e);
            }

            isProcessing = false;
            return result;
        };

        log('✅ parse перехвачен');
        return true;
    }

    // ============================================================
    // 4. Перехват changeBalanser (смена источника)
    // ============================================================
    function hookChangeBalanser() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) return false;

        var proto = Lampac.prototype;
        if (typeof proto.changeBalanser !== 'function') return false;

        if (proto._osm_change_hooked) {
            log('changeBalanser уже перехвачен');
            return true;
        }

        proto._osm_change_hooked = true;
        var originalChange = proto.changeBalanser;

        proto.changeBalanser = function(balanser_name) {
            log('🔄 Смена источника: ' + balanser_name);
            
            window._osm_data.seasons = [];
            window._osm_data.voices = [];
            window._osm_data.videos = [];
            window._osm_data.currentSource = balanser_name;
            window._osm_data.isReady = false;
            window._osm_data.lastUpdate = Date.now();
            
            var result = originalChange.call(this, balanser_name);
            
            setTimeout(function() {
                log('⏳ Ожидание загрузки данных...');
                forceDataCapture();
            }, 500);
            
            return result;
        };

        log('✅ changeBalanser перехвачен');
        return true;
    }

    // ============================================================
    // 5. Перехват startSource (загрузка источника)
    // ============================================================
    function hookStartSource() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) return false;

        var proto = Lampac.prototype;
        if (typeof proto.startSource !== 'function') return false;

        if (proto._osm_start_hooked) {
            return true;
        }

        proto._osm_start_hooked = true;
        var originalStart = proto.startSource;

        proto.startSource = function(json) {
            log('📥 Загрузка источника...');
            
            if (json && json.length > 0) {
                window._osm_sources = json.map(function(j) {
                    return {
                        name: j.name,
                        url: j.url,
                        show: j.show
                    };
                });
                window._osm_data.sources = window._osm_sources;
                log('  📡 Сохранены источники: ' + window._osm_sources.length + ' шт.');
            }
            
            var result = originalStart.call(this, json);
            return result;
        };

        log('✅ startSource перехвачен');
        return true;
    }

    // ============================================================
    // 6. Перехват initialize (открытие балансера)
    // ============================================================
    function hookInitialize() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) return false;

        var proto = Lampac.prototype;
        if (typeof proto.initialize !== 'function') return false;

        if (proto._osm_init_hooked) {
            return true;
        }

        proto._osm_init_hooked = true;
        var originalInit = proto.initialize;

        proto.initialize = function() {
            log('🚀 Открытие балансера...');
            
            window._osm_data.seasons = [];
            window._osm_data.voices = [];
            window._osm_data.videos = [];
            window._osm_data.movieTitle = getCurrentMovieTitle();
            window._osm_data.isSerial = isSerial();
            window._osm_data.currentSource = getCurrentSource();
            window._osm_data.isReady = false;
            
            log('  📺 ' + window._osm_data.movieTitle + (window._osm_data.isSerial ? ' (сериал)' : ' (фильм)'));
            
            var result = originalInit.call(this);
            
            setTimeout(function() {
                log('⏳ Ожидание загрузки данных...');
                forceDataCapture();
            }, 1000);
            
            setTimeout(function() {
                forceDataCapture();
            }, 2000);
            
            return result;
        };

        log('✅ initialize перехвачен');
        return true;
    }

    // ============================================================
    // 7. Принудительный перехват данных
    // ============================================================
    function forceDataCapture() {
        if (isProcessing) return;
        isProcessing = true;

        try {
            var data = {
                seasons: [],
                voices: [],
                videos: [],
                currentSeason: 0,
                currentVoice: '',
                movieTitle: getCurrentMovieTitle(),
                isSerial: isSerial(),
                currentSource: getCurrentSource()
            };

            // === Ищем сезоны в DOM ===
            var seasonSelect = $('.selectbox');
            seasonSelect.each(function() {
                var $container = $(this);
                var title = $container.find('.selectbox__title').text().trim();
                if (title.indexOf('Сезон') !== -1 || title.indexOf('Season') !== -1) {
                    var items = $container.find('.selectbox-item');
                    items.each(function() {
                        var $item = $(this);
                        var text = $item.text().trim();
                        var num = parseInt(text.match(/(\d+)/) || [0, 0], 10);
                        var active = $item.hasClass('focus') || $item.hasClass('active');
                        if (num > 0) {
                            data.seasons.push({
                                num: num,
                                text: text,
                                url: '',
                                active: active
                            });
                        }
                    });
                }
            });

            // === Ищем переводы в DOM ===
            var voiceSelect = $('.selectbox');
            voiceSelect.each(function() {
                var $container = $(this);
                var title = $container.find('.selectbox__title').text().trim();
                if (title.indexOf('Перевод') !== -1 || 
                    title.indexOf('Voice') !== -1 || 
                    title.indexOf('Озвучка') !== -1) {
                    var items = $container.find('.selectbox-item');
                    items.each(function() {
                        var $item = $(this);
                        var text = $item.text().trim();
                        var active = $item.hasClass('focus') || $item.hasClass('active');
                        data.voices.push({
                            text: text,
                            url: '',
                            active: active
                        });
                        if (active) data.currentVoice = text;
                    });
                }
            });

            // === Ищем видео в DOM ===
            var videoItems = $('.online-prestige--full');
            videoItems.each(function() {
                var $item = $(this);
                var text = $item.find('.online-prestige__title').text().trim();
                if (text) {
                    data.videos.push({
                        text: text,
                        url: '',
                        season: 0,
                        episode: 0,
                        voice_name: ''
                    });
                }
            });

            // === Определяем текущий сезон ===
            if (data.seasons.length > 0) {
                var activeSeason = data.seasons.filter(function(s) { return s.active; });
                if (activeSeason.length > 0) {
                    data.currentSeason = activeSeason[0].num;
                } else {
                    data.currentSeason = data.seasons[data.seasons.length - 1]?.num || 0;
                }
            }

            if (data.seasons.length > 0 || data.voices.length > 0 || data.videos.length > 0) {
                updateOsmData(data);
                log('✅ Принудительный перехват выполнен');
            } else {
                log('⏳ Данные ещё не загружены');
            }

        } catch(e) {
            logError('Ошибка принудительного перехвата:', e);
        }

        isProcessing = false;
    }

    // ============================================================
    // 8. Мониторинг смены источника через Storage
    // ============================================================
    function watchSourceChange() {
        log('Запуск мониторинга смены источника...');
        
        var lastSource = Lampa.Storage.get('active_balanser', '');
        setInterval(function() {
            var currentSource = Lampa.Storage.get('active_balanser', '');
            if (currentSource !== lastSource) {
                log('🔄 Обнаружена смена источника: ' + lastSource + ' -> ' + currentSource);
                lastSource = currentSource;
                
                window._osm_data.seasons = [];
                window._osm_data.voices = [];
                window._osm_data.videos = [];
                window._osm_data.currentSource = currentSource;
                window._osm_data.isReady = false;
                
                setTimeout(function() {
                    forceDataCapture();
                }, 500);
            }
        }, 1000);
    }

    // ============================================================
    // 9. ЗАПУСК
    // ============================================================
    function init() {
        log('========================================');
        log('Инициализация Data Hook...');
        log('========================================');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        log('Lampa готова');

        var hooked = 0;
        if (hookParse()) hooked++;
        if (hookChangeBalanser()) hooked++;
        if (hookStartSource()) hooked++;
        if (hookInitialize()) hooked++;

        watchSourceChange();

        setInterval(function() {
            if (!window._osm_data.isReady && 
                (window._osm_data.seasons.length === 0 && 
                 window._osm_data.voices.length === 0 && 
                 window._osm_data.videos.length === 0)) {
                forceDataCapture();
            }
        }, 5000);

        log('========================================');
        log('✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА');
        log('Перехвачено методов: ' + hooked);
        log('========================================');
        log('📊 Данные доступны через: window._osm_data');
        log('  - seasons: ' + window._osm_data.seasons.length + ' шт.');
        log('  - voices: ' + window._osm_data.voices.length + ' шт.');
        log('  - videos: ' + window._osm_data.videos.length + ' шт.');
        log('  - currentSeason: ' + window._osm_data.currentSeason);
        log('  - currentVoice: ' + window._osm_data.currentVoice);
        log('========================================');
    }

    window.forceDataCapture = forceDataCapture;

    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                log('app:ready получено');
                init();
            }
        });
    } else {
        setTimeout(init, 1000);
    }

})();