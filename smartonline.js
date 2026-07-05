/**
 * Online Source Manager - Data Hook
 * Версия: 11.2.0
 * Надёжный перехват сезонов и переводов через DOM и фильтры
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
    // 1. Глобальное хранилище данных
    // ============================================================
    window._osm_data = {
        seasons: [],
        voices: [],
        videos: [],
        sources: [],
        currentSeason: 0,
        currentVoice: '',
        currentSource: '',
        movieTitle: '',
        isSerial: false,
        isReady: false,
        lastUpdate: 0
    };

    // ============================================================
    // 2. Обновление данных
    // ============================================================
    function updateOsmData(data) {
        var updated = false;
        
        if (data.seasons) { window._osm_data.seasons = data.seasons; updated = true; }
        if (data.voices) { window._osm_data.voices = data.voices; updated = true; }
        if (data.videos) { window._osm_data.videos = data.videos; updated = true; }
        if (data.sources) { window._osm_data.sources = data.sources; updated = true; }
        if (data.currentSeason !== undefined) { window._osm_data.currentSeason = data.currentSeason; updated = true; }
        if (data.currentVoice) { window._osm_data.currentVoice = data.currentVoice; updated = true; }
        if (data.currentSource) { window._osm_data.currentSource = data.currentSource; updated = true; }
        if (data.movieTitle) { window._osm_data.movieTitle = data.movieTitle; updated = true; }
        if (data.isSerial !== undefined) { window._osm_data.isSerial = data.isSerial; updated = true; }
        
        if (updated) {
            window._osm_data.lastUpdate = Date.now();
            window._osm_data.isReady = true;
            
            log('✅ Данные обновлены:');
            log('  📺 ' + window._osm_data.movieTitle + (window._osm_data.isSerial ? ' (сериал)' : ' (фильм)'));
            log('  📡 Источник: ' + window._osm_data.currentSource);
            log('  📅 Сезоны: ' + window._osm_data.seasons.length + ' шт. ' + JSON.stringify(window._osm_data.seasons.map(function(s) { return s.num; })));
            log('  🎤 Переводы: ' + window._osm_data.voices.length + ' шт. ' + JSON.stringify(window._osm_data.voices.map(function(v) { return v.text + (v.active ? ' [A]' : ''); })));
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
        // Проверяем по DOM
        if ($('.selectbox').length > 0) {
            var hasSeason = false;
            $('.selectbox').each(function() {
                var title = $(this).find('.selectbox__title').text().trim();
                if (title.indexOf('Сезон') !== -1 || title.indexOf('Season') !== -1) {
                    hasSeason = true;
                }
            });
            if (hasSeason) return true;
        }
        return false;
    }

    function getCurrentSource() {
        try {
            return Lampa.Storage.get('active_balanser', '') || Lampa.Storage.get('online_balanser', '');
        } catch(e) {}
        return '';
    }

    // ============================================================
    // 3. Сбор данных из DOM (основной метод)
    // ============================================================
    function captureDataFromDOM() {
        log('🔍 Сбор данных из DOM...');

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

        // ============================================================
        // 3.1 Сбор сезонов
        // ============================================================
        var seasonFound = false;
        var seasonSelect = $('.selectbox');
        seasonSelect.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();
            
            if (title.indexOf('Сезон') !== -1 || title.indexOf('Season') !== -1) {
                log('  📅 Найден фильтр сезонов: "' + title + '"');
                var items = $container.find('.selectbox-item');
                items.each(function() {
                    var $item = $(this);
                    var text = $item.text().trim();
                    var num = parseInt(text.match(/(\d+)/) || [0, 0], 10);
                    var active = $item.hasClass('focus') || $item.hasClass('active') || $item.hasClass('selected');
                    if (num > 0) {
                        data.seasons.push({
                            num: num,
                            text: text,
                            active: active
                        });
                        if (active) data.currentSeason = num;
                        seasonFound = true;
                    }
                });
            }
        });

        // Если не нашли через selectbox, ищем через videos__item
        if (!seasonFound) {
            var seasonItems = $('.videos__item[method="link"]');
            seasonItems.each(function() {
                var $item = $(this);
                try {
                    var text = $item.text().trim();
                    var seasonNum = parseInt($item.attr('s')) || 0;
                    if (seasonNum > 0) {
                        data.seasons.push({
                            num: seasonNum,
                            text: text,
                            active: false
                        });
                        seasonFound = true;
                    }
                } catch(e) {}
            });
        }

        if (seasonFound) {
            // Сортируем сезоны по номеру
            data.seasons.sort(function(a, b) { return a.num - b.num; });
            log('  📅 Сезоны: ' + data.seasons.map(function(s) { return s.num + (s.active ? ' [A]' : ''); }).join(', '));
        }

        // ============================================================
        // 3.2 Сбор переводов
        // ============================================================
        var voiceFound = false;
        var voiceSelect = $('.selectbox');
        voiceSelect.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();
            
            if (title.indexOf('Перевод') !== -1 || 
                title.indexOf('Voice') !== -1 || 
                title.indexOf('Озвучка') !== -1) {
                log('  🎤 Найден фильтр переводов: "' + title + '"');
                var items = $container.find('.selectbox-item');
                items.each(function() {
                    var $item = $(this);
                    var text = $item.text().trim();
                    var active = $item.hasClass('focus') || $item.hasClass('active') || $item.hasClass('selected');
                    data.voices.push({
                        text: text,
                        active: active
                    });
                    if (active) data.currentVoice = text;
                    voiceFound = true;
                });
            }
        });

        // Если не нашли через selectbox, ищем через videos__button
        if (!voiceFound) {
            var voiceButtons = $('.videos__button');
            voiceButtons.each(function() {
                var $item = $(this);
                try {
                    var text = $item.text().trim();
                    var active = $item.hasClass('active');
                    if (text) {
                        data.voices.push({
                            text: text,
                            active: active
                        });
                        if (active) data.currentVoice = text;
                        voiceFound = true;
                    }
                } catch(e) {}
            });
        }

        if (voiceFound) {
            log('  🎤 Переводы: ' + data.voices.map(function(v) { return v.text + (v.active ? ' [A]' : ''); }).join(', '));
        }

        // ============================================================
        // 3.3 Сбор видео (для фильмов)
        // ============================================================
        var videoItems = $('.online-prestige--full');
        if (videoItems.length > 0) {
            videoItems.each(function() {
                var $item = $(this);
                var text = $item.find('.online-prestige__title').text().trim();
                if (text) {
                    data.videos.push({
                        text: text,
                        season: 0,
                        episode: 0,
                        voice_name: ''
                    });
                }
            });
            log('  🎬 Видео: ' + data.videos.length + ' шт.');
        }

        // ============================================================
        // 3.4 Определяем текущий сезон (если не найден)
        // ============================================================
        if (data.seasons.length > 0 && !data.currentSeason) {
            // Пробуем найти активный
            var activeSeason = data.seasons.filter(function(s) { return s.active; });
            if (activeSeason.length > 0) {
                data.currentSeason = activeSeason[0].num;
            } else {
                data.currentSeason = data.seasons[data.seasons.length - 1]?.num || 0;
            }
        }

        // ============================================================
        // 3.5 Определяем текущий перевод (если не найден)
        // ============================================================
        if (data.voices.length > 0 && !data.currentVoice) {
            var activeVoice = data.voices.filter(function(v) { return v.active; });
            if (activeVoice.length > 0) {
                data.currentVoice = activeVoice[0].text;
            } else if (data.voices.length > 0) {
                data.currentVoice = data.voices[0].text;
            }
        }

        // ============================================================
        // 3.6 Проверяем, что это сериал (если есть сезоны)
        // ============================================================
        if (data.seasons.length > 0) {
            data.isSerial = true;
        }

        // Обновляем глобальные данные
        if (data.seasons.length > 0 || data.voices.length > 0 || data.videos.length > 0) {
            updateOsmData(data);
            log('✅ Данные собраны из DOM');
            return true;
        } else {
            log('⏳ Данные в DOM не найдены');
            return false;
        }
    }

    // ============================================================
    // 4. Перехват filter.set (создание фильтров)
    // ============================================================
    function hookFilterSet() {
        if (!Lampa.Filter || !Lampa.Filter.prototype) {
            log('Lampa.Filter не найден');
            return false;
        }

        var proto = Lampa.Filter.prototype;
        if (proto._osm_filter_set_hooked) {
            log('filter.set уже перехвачен');
            return true;
        }

        proto._osm_filter_set_hooked = true;
        var originalSet = proto.set;

        proto.set = function(type, items) {
            var result = originalSet.call(this, type, items);

            // Если это фильтр, собираем данные
            if (type === 'filter' && items && items.length > 0) {
                log('📋 Фильтр создан, собираем данные...');
                setTimeout(function() {
                    captureDataFromDOM();
                }, 100);
            }

            return result;
        };

        log('✅ filter.set перехвачен');
        return true;
    }

    // ============================================================
    // 5. Перехват filter.onSelect (выбор в фильтре)
    // ============================================================
    function hookFilterOnSelect() {
        if (!Lampa.Filter || !Lampa.Filter.prototype) {
            return false;
        }

        var proto = Lampa.Filter.prototype;
        if (proto._osm_filter_select_hooked) {
            return true;
        }

        proto._osm_filter_select_hooked = true;
        var originalOnSelect = proto.onSelect;

        proto.onSelect = function(type, a, b) {
            var result = originalOnSelect.call(this, type, a, b);

            // Если выбрали что-то в фильтре, обновляем данные
            if (type === 'filter' && a) {
                log('🔄 Выбор в фильтре: ' + (a.stype || 'unknown'));
                setTimeout(function() {
                    captureDataFromDOM();
                }, 200);
            }

            return result;
        };

        log('✅ filter.onSelect перехвачен');
        return true;
    }

    // ============================================================
    // 6. Перехват parse
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
            
            log('📥 Получен ответ от сервера, собираем данные...');
            setTimeout(function() {
                captureDataFromDOM();
            }, 200);
            setTimeout(function() {
                captureDataFromDOM();
            }, 500);
            setTimeout(function() {
                captureDataFromDOM();
            }, 1000);

            return result;
        };

        log('✅ parse перехвачен');
        return true;
    }

    // ============================================================
    // 7. Перехват смены балансера
    // ============================================================
    function hookChangeBalanser() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) return false;

        var proto = Lampac.prototype;
        if (typeof proto.changeBalanser !== 'function') return false;

        if (proto._osm_change_hooked) {
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
            
            var result = originalChange.call(this, balanser_name);
            
            setTimeout(function() {
                captureDataFromDOM();
            }, 500);
            setTimeout(function() {
                captureDataFromDOM();
            }, 1000);
            setTimeout(function() {
                captureDataFromDOM();
            }, 2000);
            
            return result;
        };

        log('✅ changeBalanser перехвачен');
        return true;
    }

    // ============================================================
    // 8. Перехват initialize
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
            log('🚀 Открытие балансера');
            
            window._osm_data.seasons = [];
            window._osm_data.voices = [];
            window._osm_data.videos = [];
            window._osm_data.movieTitle = getCurrentMovieTitle();
            window._osm_data.isSerial = isSerial();
            window._osm_data.currentSource = getCurrentSource();
            window._osm_data.isReady = false;
            
            var result = originalInit.call(this);
            
            setTimeout(function() {
                captureDataFromDOM();
            }, 1000);
            setTimeout(function() {
                captureDataFromDOM();
            }, 2000);
            setTimeout(function() {
                captureDataFromDOM();
            }, 3000);
            
            return result;
        };

        log('✅ initialize перехвачен');
        return true;
    }

    // ============================================================
    // 9. Мониторинг DOM
    // ============================================================
    function startDOMWatcher() {
        log('Запуск мониторинга DOM...');

        var observer = new MutationObserver(function(mutations) {
            var shouldCapture = false;
            
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.type === 'childList') {
                    var nodes = mutation.addedNodes;
                    for (var j = 0; j < nodes.length; j++) {
                        var node = nodes[j];
                        if (node.nodeType === 1) {
                            var $node = $(node);
                            if ($node.is('.selectbox') || 
                                $node.is('.selectbox-item') ||
                                $node.is('.online-prestige--full') ||
                                $node.find('.selectbox').length ||
                                $node.find('.online-prestige--full').length ||
                                $node.is('.videos__button') ||
                                $node.find('.videos__button').length) {
                                shouldCapture = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldCapture) break;
            }

            if (shouldCapture) {
                log('🔄 Обнаружены изменения в DOM, собираем данные...');
                clearTimeout(window._captureTimer);
                window._captureTimer = setTimeout(function() {
                    captureDataFromDOM();
                }, 300);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('✅ Мониторинг DOM запущен');
    }

    // ============================================================
    // 10. ЗАПУСК
    // ============================================================
    function init() {
        log('========================================');
        log('Инициализация Data Hook v11.2.0...');
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
        if (hookInitialize()) hooked++;
        if (hookFilterSet()) hooked++;
        if (hookFilterOnSelect()) hooked++;

        startDOMWatcher();

        // Первичный сбор данных
        setTimeout(function() {
            log('⏳ Первичный сбор данных...');
            captureDataFromDOM();
        }, 1000);
        setTimeout(function() {
            captureDataFromDOM();
        }, 3000);
        setTimeout(function() {
            captureDataFromDOM();
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
        log('  - isReady: ' + window._osm_data.isReady);
        log('========================================');
    }

    window.captureDataFromDOM = captureDataFromDOM;

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