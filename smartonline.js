/**
 * Online Source Manager - Data Hook
 * Версия: 11.3.0
 * Максимально надёжный перехват сезонов и переводов
 */

(function() {
    'use strict';

    if (window.osm_data_hook_loaded) return;
    window.osm_data_hook_loaded = true;

    var DEBUG = true;
    var isProcessing = false;
    var captureAttempts = 0;
    var maxAttempts = 10;

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
        lastUpdate: 0,
        _raw: null // для хранения сырых данных
    };

    // ============================================================
    // 2. Обновление данных
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
        if (data._raw !== undefined) { 
            window._osm_data._raw = data._raw; 
            updated = true; 
        }
        
        if (updated) {
            window._osm_data.lastUpdate = Date.now();
            window._osm_data.isReady = true;
            
            log('✅ Данные обновлены:');
            log('  📺 ' + window._osm_data.movieTitle + (window._osm_data.isSerial ? ' (сериал)' : ' (фильм)'));
            log('  📡 Источник: ' + window._osm_data.currentSource);
            log('  📅 Сезоны: ' + window._osm_data.seasons.length + ' шт.');
            if (window._osm_data.seasons.length > 0) {
                log('    ' + JSON.stringify(window._osm_data.seasons.map(function(s) { return s.num + (s.active ? ' [A]' : ''); })));
            }
            log('  🎤 Переводы: ' + window._osm_data.voices.length + ' шт.');
            if (window._osm_data.voices.length > 0) {
                log('    ' + JSON.stringify(window._osm_data.voices.map(function(v) { return v.text + (v.active ? ' [A]' : ''); })));
            }
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
        // Проверяем наличие номеров эпизодов
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
    // 3. Сбор данных из DOM (улучшенный)
    // ============================================================
    function captureDataFromDOM() {
        if (isProcessing) return false;
        isProcessing = true;
        captureAttempts++;

        log('🔍 Сбор данных из DOM (попытка #' + captureAttempts + ')...');

        try {
            var data = {
                seasons: [],
                voices: [],
                videos: [],
                sources: window._osm_data.sources || [],
                currentSeason: 0,
                currentVoice: '',
                movieTitle: getCurrentMovieTitle(),
                isSerial: isSerial(),
                currentSource: getCurrentSource(),
                _raw: {}
            };

            // ============================================================
            // 3.1 Сбор сезонов (несколько способов)
            // ============================================================
            var seasonFound = false;
            var seasonSet = new Set();

            // Способ 1: через selectbox
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
                        if (num > 0 && !seasonSet.has(num)) {
                            seasonSet.add(num);
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

            // Способ 2: через videos__item
            if (!seasonFound) {
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
                            seasonFound = true;
                        }
                    } catch(e) {}
                });
            }

            // Способ 3: через choice
            if (!seasonFound) {
                try {
                    var Lampac = Lampa.Component.get('lampac');
                    if (Lampac && Lampac.prototype) {
                        var choice = Lampac.prototype.getChoice ? Lampac.prototype.getChoice() : {};
                        if (choice && choice.season !== undefined) {
                            var seasonIdx = choice.season || 0;
                            // Пробуем получить из storage
                            var balanser = getCurrentSource();
                            var storageKey = 'online_choice_' + balanser;
                            var stored = Lampa.Storage.get(storageKey, {});
                            if (stored && stored[choice.id]) {
                                var seasonNum = stored[choice.id].season || 0;
                                if (seasonNum > 0) {
                                    data.currentSeason = seasonNum + 1;
                                    seasonFound = true;
                                }
                            }
                        }
                    }
                } catch(e) {}
            }

            if (seasonFound) {
                data.seasons.sort(function(a, b) { return a.num - b.num; });
                log('  📅 Сезоны: ' + data.seasons.map(function(s) { return s.num + (s.active ? ' [A]' : ''); }).join(', '));
            } else {
                log('  📅 Сезоны не найдены');
            }

            // ============================================================
            // 3.2 Сбор переводов (несколько способов)
            // ============================================================
            var voiceFound = false;
            var voiceSet = new Set();

            // Способ 1: через selectbox
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
                        if (text && !voiceSet.has(text)) {
                            voiceSet.add(text);
                            data.voices.push({
                                text: text,
                                active: active
                            });
                            if (active) data.currentVoice = text;
                            voiceFound = true;
                        }
                    });
                }
            });

            // Способ 2: через videos__button
            if (!voiceFound) {
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
                            voiceFound = true;
                        }
                    } catch(e) {}
                });
            }

            // Способ 3: через choice
            if (!voiceFound) {
                try {
                    var balanser = getCurrentSource();
                    var storageKey = 'online_choice_' + balanser;
                    var stored = Lampa.Storage.get(storageKey, {});
                    if (stored) {
                        var movieId = Lampa.Utils.hash(getCurrentMovieTitle());
                        if (stored[movieId] && stored[movieId].voice_name) {
                            data.currentVoice = stored[movieId].voice_name;
                            voiceFound = true;
                        }
                    }
                } catch(e) {}
            }

            if (voiceFound) {
                log('  🎤 Переводы: ' + data.voices.map(function(v) { return v.text + (v.active ? ' [A]' : ''); }).join(', '));
            } else {
                log('  🎤 Переводы не найдены');
            }

            // ============================================================
            // 3.3 Сбор видео (для фильмов)
            // ============================================================
            var videoItems = $('.online-prestige--full');
            if (videoItems.length > 0) {
                videoItems.each(function() {
                    var $item = $(this);
                    var text = $item.find('.online-prestige__title').text().trim();
                    var voice = $item.find('.online-prestige__info').text().trim();
                    if (text) {
                        data.videos.push({
                            text: text,
                            voice: voice,
                            season: 0,
                            episode: 0
                        });
                    }
                });
                log('  🎬 Видео: ' + data.videos.length + ' шт.');
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
                    var sources = [];
                    items.each(function() {
                        var $item = $(this);
                        var text = $item.text().trim();
                        var active = $item.hasClass('focus') || $item.hasClass('active');
                        sources.push({
                            name: text,
                            active: active
                        });
                    });
                    if (sources.length > 0) {
                        data.sources = sources;
                        log('  📡 Источники: ' + sources.length + ' шт.');
                    }
                }
            });

            // ============================================================
            // 3.5 Определяем текущий сезон
            // ============================================================
            if (data.seasons.length > 0 && !data.currentSeason) {
                var activeSeason = data.seasons.filter(function(s) { return s.active; });
                if (activeSeason.length > 0) {
                    data.currentSeason = activeSeason[0].num;
                } else {
                    data.currentSeason = data.seasons[data.seasons.length - 1]?.num || 0;
                }
            }

            // ============================================================
            // 3.6 Определяем текущий перевод
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
            // 3.7 Определяем сериал
            // ============================================================
            if (data.seasons.length > 0) {
                data.isSerial = true;
            }

            // Сохраняем сырые данные
            data._raw = {
                html: $('body').html().substring(0, 500),
                selectboxCount: $('.selectbox').length,
                videoCount: $('.online-prestige--full').length,
                buttonCount: $('.videos__button').length
            };

            // Обновляем глобальные данные
            var hasData = data.seasons.length > 0 || data.voices.length > 0 || data.videos.length > 0;
            if (hasData) {
                updateOsmData(data);
                log('✅ Данные собраны из DOM');
                isProcessing = false;
                captureAttempts = 0;
                return true;
            } else {
                if (captureAttempts < maxAttempts) {
                    log('⏳ Данные ещё не загружены, будет повтор...');
                } else {
                    log('⚠️ Достигнут лимит попыток (' + maxAttempts + '), данные не найдены');
                    captureAttempts = 0;
                }
                isProcessing = false;
                return false;
            }

        } catch(e) {
            logError('Ошибка сбора данных:', e);
            isProcessing = false;
            return false;
        }
    }

    // ============================================================
    // 4. Перехват методов компонента
    // ============================================================
    function hookComponentMethods() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            log('Компонент lampac не найден');
            return false;
        }

        var proto = Lampac.prototype;
        var hooked = 0;

        // ============================================================
        // 4.1 Перехват parse
        // ============================================================
        if (typeof proto.parse === 'function' && !proto._osm_parse_hooked) {
            proto._osm_parse_hooked = true;
            var originalParse = proto.parse;

            proto.parse = function(str) {
                var result = originalParse.call(this, str);
                log('📥 Получен ответ от сервера');
                captureAttempts = 0;
                setTimeout(function() { captureDataFromDOM(); }, 200);
                setTimeout(function() { captureDataFromDOM(); }, 500);
                setTimeout(function() { captureDataFromDOM(); }, 1000);
                return result;
            };
            log('✅ parse перехвачен');
            hooked++;
        }

        // ============================================================
        // 4.2 Перехват display
        // ============================================================
        if (typeof proto.display === 'function' && !proto._osm_display_hooked) {
            proto._osm_display_hooked = true;
            var originalDisplay = proto.display;

            proto.display = function(videos) {
                var result = originalDisplay.call(this, videos);
                log('🖥️ display вызван');
                setTimeout(function() { captureDataFromDOM(); }, 300);
                return result;
            };
            log('✅ display перехвачен');
            hooked++;
        }

        // ============================================================
        // 4.3 Перехват draw
        // ============================================================
        if (typeof proto.draw === 'function' && !proto._osm_draw_hooked) {
            proto._osm_draw_hooked = true;
            var originalDraw = proto.draw;

            proto.draw = function(items, params) {
                var result = originalDraw.call(this, items, params);
                log('🎨 draw вызван');
                setTimeout(function() { captureDataFromDOM(); }, 200);
                return result;
            };
            log('✅ draw перехвачен');
            hooked++;
        }

        // ============================================================
        // 4.4 Перехват changeBalanser
        // ============================================================
        if (typeof proto.changeBalanser === 'function' && !proto._osm_change_hooked) {
            proto._osm_change_hooked = true;
            var originalChange = proto.changeBalanser;

            proto.changeBalanser = function(balanser_name) {
                log('🔄 Смена источника: ' + balanser_name);
                window._osm_data.seasons = [];
                window._osm_data.voices = [];
                window._osm_data.videos = [];
                window._osm_data.currentSource = balanser_name;
                window._osm_data.isReady = false;
                captureAttempts = 0;
                var result = originalChange.call(this, balanser_name);
                setTimeout(function() { captureDataFromDOM(); }, 500);
                setTimeout(function() { captureDataFromDOM(); }, 1000);
                setTimeout(function() { captureDataFromDOM(); }, 2000);
                return result;
            };
            log('✅ changeBalanser перехвачен');
            hooked++;
        }

        // ============================================================
        // 4.5 Перехват initialize
        // ============================================================
        if (typeof proto.initialize === 'function' && !proto._osm_init_hooked) {
            proto._osm_init_hooked = true;
            var originalInit = proto.initialize;

            proto.initialize = function() {
                log('🚀 Открытие балансера');
                window._osm_data.movieTitle = getCurrentMovieTitle();
                window._osm_data.isSerial = isSerial();
                window._osm_data.currentSource = getCurrentSource();
                window._osm_data.isReady = false;
                captureAttempts = 0;
                var result = originalInit.call(this);
                setTimeout(function() { captureDataFromDOM(); }, 1000);
                setTimeout(function() { captureDataFromDOM(); }, 2000);
                setTimeout(function() { captureDataFromDOM(); }, 3000);
                return result;
            };
            log('✅ initialize перехвачен');
            hooked++;
        }

        // ============================================================
        // 4.6 Перехват filter
        // ============================================================
        if (typeof proto.filter === 'function' && !proto._osm_filter_hooked) {
            proto._osm_filter_hooked = true;
            var originalFilter = proto.filter;

            proto.filter = function(filter_items, choice) {
                var result = originalFilter.call(this, filter_items, choice);
                log('📋 filter вызван');
                setTimeout(function() { captureDataFromDOM(); }, 200);
                return result;
            };
            log('✅ filter перехвачен');
            hooked++;
        }

        log('✅ Перехвачено методов: ' + hooked);
        return hooked > 0;
    }

    // ============================================================
    // 5. Перехват Lampa.Filter
    // ============================================================
    function hookFilter() {
        if (!Lampa.Filter || !Lampa.Filter.prototype) {
            log('Lampa.Filter не найден');
            return false;
        }

        var proto = Lampa.Filter.prototype;
        var hooked = 0;

        // set
        if (typeof proto.set === 'function' && !proto._osm_filter_set_hooked) {
            proto._osm_filter_set_hooked = true;
            var originalSet = proto.set;

            proto.set = function(type, items) {
                var result = originalSet.call(this, type, items);
                if (type === 'filter' || type === 'sort') {
                    log('📋 Filter.set: ' + type);
                    setTimeout(function() { captureDataFromDOM(); }, 100);
                }
                return result;
            };
            log('✅ Filter.set перехвачен');
            hooked++;
        }

        // onSelect
        if (typeof proto.onSelect === 'function' && !proto._osm_filter_select_hooked) {
            proto._osm_filter_select_hooked = true;
            var originalOnSelect = proto.onSelect;

            proto.onSelect = function(type, a, b) {
                var result = originalOnSelect.call(this, type, a, b);
                log('🔄 Filter.onSelect: ' + type);
                setTimeout(function() { captureDataFromDOM(); }, 200);
                return result;
            };
            log('✅ Filter.onSelect перехвачен');
            hooked++;
        }

        return hooked > 0;
    }

    // ============================================================
    // 6. Мониторинг
    // ============================================================
    function startMonitoring() {
        log('Запуск мониторинга...');

        // 6.1 DOM Watcher
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
                                $node.is('.videos__item') ||
                                $node.is('.videos__button') ||
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

        // 6.2 Storage Watcher
        var lastSource = getCurrentSource();
        setInterval(function() {
            var currentSource = getCurrentSource();
            if (currentSource !== lastSource) {
                log('🔄 Источник изменился (Storage): ' + lastSource + ' -> ' + currentSource);
                lastSource = currentSource;
                setTimeout(function() { captureDataFromDOM(); }, 500);
            }
        }, 1000);
        log('✅ Storage Watcher запущен');

        // 6.3 Periodic check (каждые 5 секунд, если данных нет)
        setInterval(function() {
            if (!window._osm_data.isReady || window._osm_data.seasons.length === 0) {
                log('⏳ Периодическая проверка...');
                captureDataFromDOM();
            }
        }, 5000);
        log('✅ Periodic check запущен');
    }

    // ============================================================
    // 7. Принудительный вызов
    // ============================================================
    window.forceOsmCapture = function() {
        log('🔧 Принудительный сбор данных');
        captureAttempts = 0;
        return captureDataFromDOM();
    };

    // ============================================================
    // 8. Получение данных
    // ============================================================
    window.getOsmData = function() {
        console.log('=== OSM Data ===');
        console.log('📺 Название:', window._osm_data.movieTitle);
        console.log('📡 Источник:', window._osm_data.currentSource);
        console.log('📅 Сериал:', window._osm_data.isSerial);
        console.log('📅 Сезоны:', window._osm_data.seasons);
        console.log('🎤 Переводы:', window._osm_data.voices);
        console.log('🎬 Видео:', window._osm_data.videos);
        console.log('📌 Текущий сезон:', window._osm_data.currentSeason);
        console.log('📌 Текущий перевод:', window._osm_data.currentVoice);
        console.log('🔄 Готово:', window._osm_data.isReady);
        console.log('⏱️ Обновлено:', new Date(window._osm_data.lastUpdate).toLocaleTimeString());
        return window._osm_data;
    };

    // ============================================================
    // 9. ЗАПУСК
    // ============================================================
    function init() {
        log('========================================');
        log('Инициализация Data Hook v11.3.0...');
        log('========================================');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        log('Lampa готова');

        // Перехватываем методы компонента
        hookComponentMethods();
        hookFilter();

        // Запускаем мониторинг
        startMonitoring();

        // Первичный сбор
        setTimeout(function() { captureDataFromDOM(); }, 1000);
        setTimeout(function() { captureDataFromDOM(); }, 3000);
        setTimeout(function() { captureDataFromDOM(); }, 5000);

        log('========================================');
        log('✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА');
        log('========================================');
        log('📊 Данные: window._osm_data');
        log('🔧 Принудительный сбор: forceOsmCapture()');
        log('📋 Детальный вывод: getOsmData()');
        log('========================================');
    }

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