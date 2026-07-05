/**
 * Online Source Manager - Data Hook
 * Версия: 11.6.0
 * Перехват фильтров "Переводы" и "Сезон"
 */

(function() {
    'use strict';

    if (window.osm_data_hook_loaded) return;
    window.osm_data_hook_loaded = true;

    var DEBUG = true;
    var isProcessing = false;
    var dataCaptured = false;

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
    // 2. Обновление данных с выводом в консоль
    // ============================================================
    function updateOsmData(data) {
        var updated = false;
        
        if (data.seasons !== undefined) { 
            window._osm_data.seasons = data.seasons; 
            updated = true; 
        }
        if (data.voices !== undefined) { 
            window._osm_data.voices = data.voices; 
            updated = true; 
        }
        if (data.videos !== undefined) { 
            window._osm_data.videos = data.videos; 
            updated = true; 
        }
        if (data.sources !== undefined) { 
            window._osm_data.sources = data.sources; 
            updated = true; 
        }
        if (data.currentSeason !== undefined) { 
            window._osm_data.currentSeason = data.currentSeason; 
            updated = true; 
        }
        if (data.currentVoice !== undefined) { 
            window._osm_data.currentVoice = data.currentVoice; 
            updated = true; 
        }
        if (data.currentSource !== undefined) { 
            window._osm_data.currentSource = data.currentSource; 
            updated = true; 
        }
        if (data.movieTitle !== undefined) { 
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
            dataCaptured = true;
            
            log('✅ Данные обновлены:');
            log('  📺 ' + window._osm_data.movieTitle + (window._osm_data.isSerial ? ' (сериал)' : ' (фильм)'));
            log('  📡 Источник: ' + window._osm_data.currentSource);
            log('  📅 Сезоны: ' + window._osm_data.seasons.length + ' шт. ' + JSON.stringify(window._osm_data.seasons.map(function(s) { return s.num + (s.active ? ' [A]' : ''); })));
            log('  🎤 Переводы: ' + window._osm_data.voices.length + ' шт. ' + JSON.stringify(window._osm_data.voices.map(function(v) { return v.text + (v.active ? ' [A]' : ''); })));
            log('  🎬 Видео: ' + window._osm_data.videos.length + ' шт.');
            if (window._osm_data.currentSeason) {
                log('  📌 Текущий сезон: ' + window._osm_data.currentSeason);
            }
            if (window._osm_data.currentVoice) {
                log('  📌 Текущий перевод: ' + window._osm_data.currentVoice);
            }
        }
        
        return updated;
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
        if ($('.online-prestige__episode-number').length > 0) {
            return true;
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
    // 3. Сбор данных из DOM
    // ============================================================
    function captureDataFromDOM() {
        if (isProcessing || dataCaptured) return false;
        isProcessing = true;

        log('🔍 Сбор данных из DOM...');

        try {
            var data = {
                seasons: [],
                voices: [],
                videos: [],
                sources: [],
                currentSeason: 0,
                currentVoice: '',
                movieTitle: getCurrentMovieTitle(),
                isSerial: isSerial(),
                currentSource: getCurrentSource()
            };

            // ============================================================
            // 3.1 Сбор сезонов
            // ============================================================
            var seasonSet = new Set();
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
                        var active = $item.hasClass('focus') || $item.hasClass('active') || $item.hasClass('selected');
                        if (num > 0 && !seasonSet.has(num)) {
                            seasonSet.add(num);
                            data.seasons.push({
                                num: num,
                                text: text,
                                active: active
                            });
                            if (active) data.currentSeason = num;
                        }
                    });
                }
            });

            if (data.seasons.length === 0) {
                var seasonItems = $('.videos__item[method="link"]');
                seasonItems.each(function() {
                    var $item = $(this);
                    try {
                        var text = $item.text().trim();
                        var seasonNum = parseInt($item.attr('s')) || 0;
                        if (seasonNum > 0 && !seasonSet.has(seasonNum)) {
                            seasonSet.add(seasonNum);
                            data.seasons.push({
                                num: seasonNum,
                                text: text,
                                active: false
                            });
                        }
                    } catch(e) {}
                });
            }

            if (data.seasons.length > 0) {
                data.seasons.sort(function(a, b) { return a.num - b.num; });
            }

            // ============================================================
            // 3.2 Сбор переводов
            // ============================================================
            var voiceSet = new Set();
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
                        var active = $item.hasClass('focus') || $item.hasClass('active') || $item.hasClass('selected');
                        if (text && !voiceSet.has(text)) {
                            voiceSet.add(text);
                            data.voices.push({
                                text: text,
                                active: active
                            });
                            if (active) data.currentVoice = text;
                        }
                    });
                }
            });

            if (data.voices.length === 0) {
                var voiceButtons = $('.videos__button');
                voiceButtons.each(function() {
                    var $item = $(this);
                    try {
                        var text = $item.text().trim();
                        var active = $item.hasClass('active');
                        if (text && !voiceSet.has(text)) {
                            voiceSet.add(text);
                            data.voices.push({
                                text: text,
                                active: active
                            });
                            if (active) data.currentVoice = text;
                        }
                    } catch(e) {}
                });
            }

            // ============================================================
            // 3.3 Сбор видео
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
                            episode: 0
                        });
                    }
                });
            }

            // ============================================================
            // 3.4 Сбор источников
            // ============================================================
            var sourceSelect = $('.selectbox');
            sourceSelect.each(function() {
                var $container = $(this);
                var title = $container.find('.selectbox__title').text().trim();
                
                if (title.indexOf('Источник') !== -1 || 
                    title.indexOf('Source') !== -1 || 
                    title.indexOf('Сортировать') !== -1) {
                    var items = $container.find('.selectbox-item');
                    items.each(function() {
                        var $item = $(this);
                        var text = $item.text().trim();
                        var active = $item.hasClass('focus') || $item.hasClass('active');
                        data.sources.push({
                            name: text,
                            active: active
                        });
                    });
                }
            });

            // ============================================================
            // 3.5 Определяем текущие значения
            // ============================================================
            if (data.seasons.length > 0 && !data.currentSeason) {
                var activeSeason = data.seasons.filter(function(s) { return s.active; });
                if (activeSeason.length > 0) {
                    data.currentSeason = activeSeason[0].num;
                } else {
                    data.currentSeason = data.seasons[data.seasons.length - 1]?.num || 0;
                }
            }

            if (data.voices.length > 0 && !data.currentVoice) {
                var activeVoice = data.voices.filter(function(v) { return v.active; });
                if (activeVoice.length > 0) {
                    data.currentVoice = activeVoice[0].text;
                } else if (data.voices.length > 0) {
                    data.currentVoice = data.voices[0].text;
                }
            }

            if (data.seasons.length > 0) {
                data.isSerial = true;
            }

            var hasData = data.seasons.length > 0 || data.voices.length > 0 || data.videos.length > 0;
            if (hasData) {
                updateOsmData(data);
                log('✅ Сбор данных завершён');
            } else {
                log('⏳ Данные не найдены');
            }

        } catch(e) {
            logError('Ошибка сбора данных:', e);
        }

        isProcessing = false;
        return true;
    }

    // ============================================================
    // 4. ПЕРЕХВАТ ФИЛЬТРОВ "Переводы" и "Сезон"
    // ============================================================
    function hookFilters() {
        if (!Lampa.Filter || !Lampa.Filter.prototype) {
            log('Lampa.Filter не найден');
            return false;
        }

        var proto = Lampa.Filter.prototype;
        var hooked = 0;

        // ============================================================
        // 4.1 Перехват filter.set - создание фильтров
        // ============================================================
        if (typeof proto.set === 'function' && !proto._osm_filter_set_hooked) {
            proto._osm_filter_set_hooked = true;
            var originalSet = proto.set;

            proto.set = function(type, items) {
                var result = originalSet.call(this, type, items);

                // Если это фильтр (не сортировка)
                if (type === 'filter' && items && items.length > 0) {
                    log('📋 Создан фильтр');
                    
                    // Ищем среди элементов фильтры "Переводы" и "Сезон"
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        if (item && item.title) {
                            var title = item.title.toLowerCase();
                            
                            if (title.indexOf('перевод') !== -1 || 
                                title.indexOf('voice') !== -1 || 
                                title.indexOf('озвучка') !== -1) {
                                log('  🎤 Найден фильтр: "' + item.title + '"');
                                
                                // Сортируем озвучки
                                if (item.items && item.items.length > 1) {
                                    var sorted = item.items.slice().sort(function(a, b) {
                                        var scoreA = voiceWeight(a.title);
                                        var scoreB = voiceWeight(b.title);
                                        if (scoreA !== scoreB) return scoreB - scoreA;
                                        return a.title.localeCompare(b.title);
                                    });
                                    item.items = sorted;
                                    if (sorted.length > 0) {
                                        item.subtitle = sorted[0].title;
                                    }
                                    log('  ✅ Переводы отсортированы');
                                }
                            }
                            
                            if (title.indexOf('сезон') !== -1 || 
                                title.indexOf('season') !== -1) {
                                log('  📅 Найден фильтр: "' + item.title + '"');
                                
                                // Сортируем сезоны от большего к меньшему
                                if (item.items && item.items.length > 1) {
                                    var sorted = item.items.slice().sort(function(a, b) {
                                        var numA = parseInt(a.title.match(/(\d+)/) || [0, 0], 10);
                                        var numB = parseInt(b.title.match(/(\d+)/) || [0, 0], 10);
                                        return numB - numA;
                                    });
                                    item.items = sorted;
                                    if (sorted.length > 0) {
                                        item.subtitle = sorted[0].title;
                                    }
                                    log('  ✅ Сезоны отсортированы');
                                }
                            }
                        }
                    }
                    
                    // После сортировки обновляем данные
                    setTimeout(function() {
                        captureDataFromDOM();
                    }, 200);
                }

                return result;
            };
            log('✅ filter.set перехвачен');
            hooked++;
        }

        // ============================================================
        // 4.2 Перехват filter.onSelect - выбор в фильтре
        // ============================================================
        if (typeof proto.onSelect === 'function' && !proto._osm_filter_select_hooked) {
            proto._osm_filter_select_hooked = true;
            var originalOnSelect = proto.onSelect;

            proto.onSelect = function(type, a, b) {
                var result = originalOnSelect.call(this, type, a, b);

                // Если выбрали что-то в фильтре
                if (type === 'filter' && a) {
                    var filterName = a.title || a.stype || 'unknown';
                    log('🔄 Выбор в фильтре: ' + filterName);
                    
                    // Обновляем данные
                    setTimeout(function() {
                        captureDataFromDOM();
                    }, 300);
                }

                return result;
            };
            log('✅ filter.onSelect перехвачен');
            hooked++;
        }

        return hooked > 0;
    }

    // ============================================================
    // 5. Приоритет озвучек (для сортировки)
    // ============================================================
    function voiceWeight(name) {
        if (!name) return 0;
        var text = name.toLowerCase();
        if (/hdrezka|hd\.rezka|rezka/.test(text)) return 20;
        if (/дубляж|дублированный|дубликация|dub\b/.test(text)) return 15;
        if (/кубик|cube|куб|kubik/.test(text)) return 13;
        if (/lostfilm|lost\.film/.test(text)) return 10;
        if (/субтитры|sub\b|subtitles|original|оригинал|orig/.test(text)) return -10;
        if (/english|eng|en\b/.test(text) && !/russian|rus/.test(text)) return -100;
        return 0;
    }

    // ============================================================
    // 6. Перехват методов компонента
    // ============================================================
    function hookComponentMethods() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            log('Компонент lampac не найден');
            return false;
        }

        var proto = Lampac.prototype;
        var hooked = 0;

        // Перехват parse
        if (typeof proto.parse === 'function' && !proto._osm_parse_hooked) {
            proto._osm_parse_hooked = true;
            var originalParse = proto.parse;

            proto.parse = function(str) {
                var result = originalParse.call(this, str);
                log('📥 Получен ответ от сервера');
                if (!dataCaptured) {
                    setTimeout(function() { captureDataFromDOM(); }, 300);
                }
                return result;
            };
            log('✅ parse перехвачен');
            hooked++;
        }

        // Перехват changeBalanser
        if (typeof proto.changeBalanser === 'function' && !proto._osm_change_hooked) {
            proto._osm_change_hooked = true;
            var originalChange = proto.changeBalanser;

            proto.changeBalanser = function(balanser_name) {
                log('🔄 Смена источника: ' + balanser_name);
                dataCaptured = false;
                window._osm_data.isReady = false;
                var result = originalChange.call(this, balanser_name);
                setTimeout(function() { captureDataFromDOM(); }, 500);
                return result;
            };
            log('✅ changeBalanser перехвачен');
            hooked++;
        }

        // Перехват initialize
        if (typeof proto.initialize === 'function' && !proto._osm_init_hooked) {
            proto._osm_init_hooked = true;
            var originalInit = proto.initialize;

            proto.initialize = function() {
                log('🚀 Открытие балансера');
                dataCaptured = false;
                window._osm_data.isReady = false;
                var result = originalInit.call(this);
                setTimeout(function() { captureDataFromDOM(); }, 1000);
                return result;
            };
            log('✅ initialize перехвачен');
            hooked++;
        }

        // Перехват display
        if (typeof proto.display === 'function' && !proto._osm_display_hooked) {
            proto._osm_display_hooked = true;
            var originalDisplay = proto.display;

            proto.display = function(videos) {
                var result = originalDisplay.call(this, videos);
                if (!dataCaptured) {
                    setTimeout(function() { captureDataFromDOM(); }, 200);
                }
                return result;
            };
            log('✅ display перехвачен');
            hooked++;
        }

        log('✅ Перехвачено методов: ' + hooked);
        return hooked > 0;
    }

    // ============================================================
    // 7. Мониторинг DOM
    // ============================================================
    function startDOMWatcher() {
        log('Запуск мониторинга DOM...');

        var observer = new MutationObserver(function(mutations) {
            if (dataCaptured) return;
            
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
                                $node.find('.online-prestige--full').length) {
                                shouldCapture = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldCapture) break;
            }

            if (shouldCapture) {
                log('🔄 DOM изменился');
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
        log('✅ DOM Watcher запущен');
    }

    // ============================================================
    // 8. ЗАПУСК
    // ============================================================
    function init() {
        log('========================================');
        log('Инициализация Data Hook v11.6.0...');
        log('========================================');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        log('Lampa готова');

        // Перехватываем компонент
        hookComponentMethods();
        
        // Перехватываем фильтры
        hookFilters();

        // Запускаем мониторинг DOM
        startDOMWatcher();

        // Первичный сбор
        setTimeout(function() { captureDataFromDOM(); }, 1000);
        setTimeout(function() { captureDataFromDOM(); }, 3000);
        setTimeout(function() { captureDataFromDOM(); }, 5000);

        log('========================================');
        log('✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА');
        log('========================================');
        log('📊 Данные: window._osm_data');
        log('🔄 Принудительный сбор: forceOsmCapture()');
        log('========================================');
    }

    window.forceOsmCapture = function() {
        log('🔧 Принудительный сбор данных');
        dataCaptured = false;
        return captureDataFromDOM();
    };

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