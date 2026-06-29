(function () {
    'use strict';

    // ============================================================
    // ОТЛАДКА В САМОМ НАЧАЛЕ
    // ============================================================

    console.log('========================================');
    console.log('🔍 SmartOnline v6 - ЗАПУСК');
    console.log('========================================');

    if (window.smartonline_plugin_v6) {
        console.log('⚠️ Плагин уже запущен, пропускаем');
        return;
    }
    window.smartonline_plugin_v6 = true;

    // ============================================================
    // ПРИОРИТЕТЫ ИСТОЧНИКОВ
    // ============================================================

    var SOURCE_PRIORITY = [
        { name: 'phantom', weight: 10, label: 'Phantom' },
        { name: 'filmix', weight: 8, label: 'Filmix' },
        { name: 'alloha', weight: 6, label: 'Alloha' },
        { name: 'kinopub', weight: 4, label: 'Kinopub' }
    ];

    // ============================================================
    // РАСШИРЕННОЕ ОПРЕДЕЛЕНИЕ КАЧЕСТВА
    // ============================================================

    function detectQuality(value) {
        if (!value) return 0;
        var text = String(value).toLowerCase().replace(/\s+/g, ' ').trim();
        if (!text) return 0;

        // 4K / 2160p
        if (/(2160|4k|uhd|ultra[\s-]?hd|3840|ultrahd|4[\s-]?k|2160p)/i.test(text)) return 2160;

        // 1080p / Full HD
        if (/(1080|full[\s-]?hd|fhd|1920|fullhd|1080p)/i.test(text)) return 1080;

        // 720p / HD
        if (/(720|hd[\s-]?ready|1280|720p)/i.test(text)) return 720;

        // 480p / SD
        if (/(480|sd|dvd|640|854|480p)/i.test(text)) return 480;

        // Число с p (например "720p", "1080p")
        var match = text.match(/(\d{3,4})[pP]/);
        if (match) {
            var num = parseInt(match[1], 10);
            if (num >= 480) return num;
        }

        return 0;
    }

    // ============================================================
    // ГЛУБОКИЙ АНАЛИЗ КАЧЕСТВА ЭЛЕМЕНТА
    // ============================================================

    function getItemQuality(item) {
        var quality = 0;
        var sources = [];

        // 1. Проверяем все текстовые поля
        var textFields = ['text', 'title', 'name', 'label', 'voice_name', 'quality_text'];
        textFields.forEach(function(field) {
            if (item[field]) {
                var q = detectQuality(item[field]);
                if (q > quality) {
                    quality = q;
                    sources.push(field + ': "' + String(item[field]).substring(0, 40) + '" → ' + q + 'p');
                }
            }
        });

        // 2. Проверяем URL и stream
        var urlFields = ['url', 'stream'];
        urlFields.forEach(function(field) {
            if (item[field]) {
                var q = detectQuality(item[field]);
                if (q > quality) {
                    quality = q;
                    sources.push(field + ': "' + String(item[field]).substring(0, 40) + '" → ' + q + 'p');
                }
            }
        });

        // 3. Проверяем quality объект
        var qualityObj = item.quality || item.qualitys;
        if (qualityObj && typeof qualityObj === 'object') {
            for (var key in qualityObj) {
                var q1 = detectQuality(key);
                if (q1 > quality) {
                    quality = q1;
                    sources.push('quality key: "' + key + '" → ' + q1 + 'p');
                }
                var q2 = detectQuality(qualityObj[key]);
                if (q2 > quality) {
                    quality = q2;
                    sources.push('quality value: "' + qualityObj[key] + '" → ' + q2 + 'p');
                }
            }
        }

        return { quality: quality, sources: sources };
    }

    // ============================================================
    // ПОЛУЧЕНИЕ СПИСКА ИСТОЧНИКОВ ИЗ BALANSERS_WITH_SEARCH
    // ============================================================

    function getBalansersList() {
        var sources = [];

        // Пытаемся получить из balansers_with_search (устанавливается в компоненте)
        if (window.balansers_with_search && Array.isArray(window.balansers_with_search)) {
            console.log('📋 balansers_with_search:', window.balansers_with_search);
            sources = window.balansers_with_search.slice();
        }

        // Если пусто, используем приоритетные
        if (sources.length === 0) {
            console.log('⚠️ balansers_with_search пуст, используем приоритетные');
            sources = SOURCE_PRIORITY.map(function(p) { return p.name; });
        }

        // Удаляем дубликаты
        var unique = [];
        sources.forEach(function(s) {
            var lower = String(s).toLowerCase();
            if (!unique.some(function(u) { return String(u).toLowerCase() === lower; })) {
                unique.push(s);
            }
        });

        console.log('📋 Итоговый список источников:', unique);
        return unique;
    }

    // ============================================================
    // СБОР СО ВСЕХ ИСТОЧНИКОВ
    // ============================================================

    function collectAllSources(movie, callback) {
        var allItems = [];
        var sources = getBalansersList();
        var totalSources = sources.length;
        var completed = 0;

        console.log('🔎 Начинаем сбор со всех источников (' + totalSources + ')...');

        if (!movie) {
            console.log('❌ Нет объекта movie');
            callback([]);
            return;
        }

        sources.forEach(function(sourceName) {
            var query = [];
            query.push('id=' + encodeURIComponent(movie.id));
            if (movie.imdb_id) query.push('imdb_id=' + (movie.imdb_id || ''));
            if (movie.kinopoisk_id) query.push('kinopoisk_id=' + (movie.kinopoisk_id || ''));
            if (movie.tmdb_id) query.push('tmdb_id=' + (movie.tmdb_id || ''));
            query.push('title=' + encodeURIComponent(movie.title || movie.name));
            query.push('original_title=' + encodeURIComponent(movie.original_title || movie.original_name));
            query.push('serial=' + (movie.name ? 1 : 0));
            query.push('original_language=' + (movie.original_language || ''));
            query.push('year=' + ((movie.release_date || movie.first_air_date || '0000') + '').slice(0, 4));
            query.push('source=' + (movie.source || 'tmdb'));

            var host = 'https://ab2024.ru';
            var url = host + '/lite/' + sourceName + '?' + query.join('&');

            console.log('  📡 Запрос к ' + sourceName);

            var network = new Lampa.Reguest();
            network.timeout(10000);
            network["native"](url, function(str) {
                completed++;
                console.log('  ✅ Ответ от ' + sourceName + ' получен (длина: ' + (str ? str.length : 0) + ')');

                try {
                    var $html = $('<div>' + str + '</div>');
                    var count = 0;

                    // Парсим .videos__item
                    $html.find('.videos__item').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            var season = $item.attr('s');
                            var episode = $item.attr('e');

                            if (data.method === 'play' || data.method === 'call') {
                                data.text = text;
                                data.sourceName = sourceName;
                                if (season) data.season = parseInt(season);
                                if (episode) data.episode = parseInt(episode);
                                allItems.push(data);
                                count++;
                            }
                        } catch (e) {}
                    });

                    // Парсим .videos__button (озвучки)
                    $html.find('.videos__button').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            data.text = text;
                            data.sourceName = sourceName;
                            data.isButton = true;
                            allItems.push(data);
                            count++;
                        } catch (e) {}
                    });

                    console.log('    📦 Найдено элементов: ' + count);
                } catch (e) {
                    console.log('    ❌ Ошибка парсинга: ' + e.message);
                }

                if (completed === totalSources) {
                    console.log('📊 Всего элементов: ' + allItems.length);
                    callback(allItems);
                }
            }, function(err) {
                completed++;
                console.log('  ❌ Ошибка запроса к ' + sourceName + ': ' + (err.status || 'unknown'));
                if (completed === totalSources) {
                    console.log('📊 Всего элементов: ' + allItems.length);
                    callback(allItems);
                }
            }, false, { dataType: 'text' });
        });
    }

    // ============================================================
    // АНАЛИЗ КАЧЕСТВА ПО ИСТОЧНИКАМ
    // ============================================================

    function analyzeSourcesQuality(items) {
        var results = {};

        items.forEach(function(item) {
            var source = item.sourceName || 'unknown';
            if (!results[source]) {
                results[source] = {
                    items: [],
                    maxQuality: 0,
                    maxQualityItem: null,
                    allQualities: []
                };
            }

            var qualityResult = getItemQuality(item);
            results[source].items.push(item);
            results[source].allQualities.push(qualityResult.quality);

            if (qualityResult.quality > results[source].maxQuality) {
                results[source].maxQuality = qualityResult.quality;
                results[source].maxQualityItem = item;
            }
        });

        return results;
    }

    // ============================================================
    // ВЫБОР ЛУЧШЕГО ИСТОЧНИКА
    // ============================================================

    function selectBestSource(analyzedResults) {
        var bestSource = null;
        var bestQuality = 0;
        var bestWeight = -1;
        var bestCount = 0;

        for (var source in analyzedResults) {
            var data = analyzedResults[source];
            var quality = data.maxQuality;
            var count = data.items.length;

            // Если качество 0 - пропускаем (но если элементов нет, тоже пропускаем)
            if (quality === 0 || count === 0) {
                console.log('  ⚠️ ' + source + ': качество ' + quality + 'p, элементов ' + count + ' (пропускаем)');
                continue;
            }

            var priority = SOURCE_PRIORITY.find(function(p) {
                return source.toLowerCase().indexOf(p.name) !== -1;
            });
            var weight = priority ? priority.weight : 0;

            console.log('  📊 ' + source + ': качество ' + quality + 'p, вес ' + weight + ', элементов ' + count);

            // Выбираем: качество > вес > количество элементов
            if (quality > bestQuality || 
                (quality === bestQuality && weight > bestWeight) ||
                (quality === bestQuality && weight === bestWeight && count > bestCount)) {
                bestQuality = quality;
                bestWeight = weight;
                bestCount = count;
                bestSource = source;
            }
        }

        return bestSource;
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ НА ИСТОЧНИК
    // ============================================================

    function switchToSource(sourceName, movie) {
        console.log('🔄 ПЕРЕКЛЮЧЕНИЕ НА ИСТОЧНИК: ' + sourceName);

        if (!sourceName) {
            console.log('❌ Нет источника для переключения');
            return;
        }

        // Сохраняем выбранный источник
        Lampa.Storage.set('active_balanser', sourceName);
        Lampa.Storage.set('online_balanser', sourceName);

        // Обновляем last_select_balanser
        var lastSelect = Lampa.Storage.cache('online_last_balanser', 3000, {});
        if (movie && movie.id) {
            lastSelect[movie.id] = sourceName;
            Lampa.Storage.set('online_last_balanser', lastSelect);
        }

        // Перезагружаем активность
        var active = Lampa.Activity.active();
        if (active) {
            console.log('  🔄 Перезагрузка активности...');
            Lampa.Activity.replace(active);
        }

        console.log('✅ Переключено на: ' + sourceName);
        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('🔊 Выбран источник: ' + sourceName);
        }
    }

    // ============================================================
    // ОСНОВНАЯ ЛОГИКА
    // ============================================================

    function findBestSourceAndSwitch(movie) {
        console.log('🎯 ПОИСК ЛУЧШЕГО ИСТОЧНИКА ДЛЯ: ' + (movie ? movie.title : 'unknown'));

        collectAllSources(movie, function(allItems) {
            if (allItems.length === 0) {
                console.log('❌ Нет элементов для анализа');
                if (Lampa.Noty && Lampa.Noty.show) {
                    Lampa.Noty.show('Не найдено видео для просмотра');
                }
                return;
            }

            var analyzed = analyzeSourcesQuality(allItems);

            console.log('📊 АНАЛИЗ ИСТОЧНИКОВ:');
            var bestSource = selectBestSource(analyzed);

            if (!bestSource) {
                console.log('❌ Не удалось определить лучший источник');
                return;
            }

            var bestData = analyzed[bestSource];
            console.log('🏆 ЛУЧШИЙ ИСТОЧНИК: ' + bestSource + ' (качество ' + bestData.maxQuality + 'p, элементов ' + bestData.items.length + ')');

            if (bestData.maxQualityItem) {
                var item = bestData.maxQualityItem;
                console.log('  Лучший элемент: ' + (item.text || item.title || ''));
                console.log('  Качество найдено в:');
                var qualityResult = getItemQuality(item);
                qualityResult.sources.forEach(function(s) {
                    console.log('    - ' + s);
                });
            }

            switchToSource(bestSource, movie);
        });
    }

    // ============================================================
    // ПЕРЕХВАТ КОМПОНЕНТА
    // ============================================================

    var isPatched = false;

    function patchLampacComponent() {
        if (isPatched) return;
        if (!Lampa.Component || !Lampa.Component.get) {
            setTimeout(patchLampacComponent, 500);
            return;
        }

        var BaseLampac = Lampa.Component.get('lampac');
        if (!BaseLampac) {
            setTimeout(patchLampacComponent, 500);
            return;
        }

        isPatched = true;
        console.log('✅ Компонент Lampac найден, патчим...');

        function SmartLampac(object) {
            console.log('📦 Создание SmartLampac для: ' + (object.movie ? object.movie.title : 'unknown'));

            var movie = object.movie || {};
            var isCollecting = false;

            BaseLampac.call(this, object);

            var originalInitialize = this.initialize;
            var originalParse = this.parse;

            // Перехватываем initialize, чтобы получить список балансеров
            this.initialize = function() {
                console.log('📥 initialize() вызван');

                // Сохраняем оригинальный метод
                var self = this;

                // Вызываем оригинальный initialize
                var result = originalInitialize.call(this);

                // После инициализации запускаем поиск лучшего источника
                if (!isCollecting) {
                    isCollecting = true;

                    // Получаем список источников из balansers_with_search
                    var network = new Lampa.Reguest();
                    network.timeout(10000);
                    network.silent('https://ab2024.ru/lite/withsearch', function(json) {
                        if (json && Array.isArray(json)) {
                            window.balansers_with_search = json;
                            console.log('📋 Получен список источников:', json);
                        }
                        findBestSourceAndSwitch(movie);
                    }, function() {
                        console.log('⚠️ Не удалось получить список источников, используем приоритетные');
                        findBestSourceAndSwitch(movie);
                    }, false, { dataType: 'json' });
                }

                return result;
            };

            this.parse = function(str) {
                return originalParse.call(this, str);
            };
        }

        SmartLampac.prototype = Object.create(BaseLampac.prototype);
        SmartLampac.prototype.constructor = SmartLampac;

        Lampa.Component.add('lampac', SmartLampac);
        console.log('✅ Компонент Lampac успешно пропатчен!');
    }

    // ============================================================
    // КНОПКА
    // ============================================================

    function addSmartButton() {
        console.log('🔘 Добавляем кнопку "Лучший источник"...');

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-smart-button-v6').length > 0) return;

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button-v6" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>Лучший источник</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    console.log('🔘 Кнопка "Лучший источник" нажата');
                    // Получаем список источников перед поиском
                    var network = new Lampa.Reguest();
                    network.timeout(10000);
                    network.silent('https://ab2024.ru/lite/withsearch', function(json) {
                        if (json && Array.isArray(json)) {
                            window.balansers_with_search = json;
                            console.log('📋 Получен список источников:', json);
                        }
                        findBestSourceAndSwitch(movie);
                    }, function() {
                        console.log('⚠️ Не удалось получить список источников, используем приоритетные');
                        findBestSourceAndSwitch(movie);
                    }, false, { dataType: 'json' });
                });

                var container = render.find('.full-start__buttons, .full-start-new__buttons, .buttons--container').eq(0);
                if (container.length) {
                    container.append(btn);
                } else {
                    render.append(btn);
                }
            }
        });
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    function init() {
        console.log('🚀 Инициализация SmartOnline v6');

        patchLampacComponent();
        addSmartButton();

        console.log('✅ SmartOnline v6 готов к работе!');
        console.log('========================================');
    }

    // ============================================================
    // ЗАПУСК
    // ============================================================

    if (window.appready) {
        console.log('📌 appready = true, запускаем немедленно');
        init();
    } else {
        console.log('⏳ Ожидаем appready...');
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                console.log('📌 appready получен, запускаем');
                init();
            }
        });
    }

})();
