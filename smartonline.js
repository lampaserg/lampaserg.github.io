(function () {
    'use strict';

    // ============================================================
    // ОТЛАДКА В САМОМ НАЧАЛЕ
    // ============================================================

    console.log('========================================');
    console.log('🔍 SmartOnline v5 - ЗАПУСК');
    console.log('========================================');

    if (window.smartonline_plugin_v5) {
        console.log('⚠️ Плагин уже запущен, пропускаем');
        return;
    }
    window.smartonline_plugin_v5 = true;

    // ============================================================
    // ПРИОРИТЕТЫ ИСТОЧНИКОВ (из настроек Lampa)
    // ============================================================

    var SOURCE_PRIORITY = [
        { name: 'phantom', weight: 10, label: 'Phantom' },
        { name: 'filmix', weight: 8, label: 'Filmix' },
        { name: 'alloha', weight: 6, label: 'Alloha' },
        { name: 'kinopub', weight: 4, label: 'Kinopub' }
    ];

    console.log('📊 Приоритеты источников:');
    SOURCE_PRIORITY.forEach(function(s) {
        console.log('  ' + s.label + ' (вес ' + s.weight + ')');
    });

    // ============================================================
    // РАСШИРЕННОЕ ОПРЕДЕЛЕНИЕ КАЧЕСТВА
    // ============================================================

    function detectQuality(value) {
        if (!value) return 0;
        var text = String(value).toLowerCase().replace(/\s+/g, ' ').trim();
        if (!text) return 0;

        // 4K / 2160p
        if (/(2160|4k|uhd|ultra[\s-]?hd|3840|ultrahd|4[\s-]?k)/i.test(text)) return 2160;

        // 1080p / Full HD
        if (/(1080|full[\s-]?hd|fhd|1920|fullhd)/i.test(text)) return 1080;

        // 720p / HD
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 720;

        // 480p / SD
        if (/(480|sd|dvd|640|854)/i.test(text)) return 480;

        var match = text.match(/(\d{3,4})[pP]/);
        if (match) {
            var num = parseInt(match[1], 10);
            if (num >= 480) return num;
        }

        return 0;
    }

    console.log('📐 Определение качества по: тексту, URL, quality объекту, названию');

    // ============================================================
    // ГЛУБОКИЙ АНАЛИЗ КАЧЕСТВА
    // ============================================================

    function getVideoQuality(item) {
        var quality = 0;
        var sources = [];

        var fields = ['text', 'title', 'name', 'label', 'url', 'stream'];
        fields.forEach(function(field) {
            if (item[field]) {
                var q = detectQuality(item[field]);
                if (q > quality) {
                    quality = q;
                    sources.push(field + ': "' + (String(item[field]).substring(0, 50)) + '" → ' + q + 'p');
                }
            }
        });

        // Проверяем quality объект
        var qualityObj = item.quality || item.qualitys;
        if (qualityObj && typeof qualityObj === 'object') {
            for (var key in qualityObj) {
                var q = detectQuality(key);
                if (q > quality) {
                    quality = q;
                    sources.push('quality key: "' + key + '" → ' + q + 'p');
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
    // ПОЛУЧЕНИЕ СПИСКА ИСТОЧНИКОВ ИЗ LAMPA
    // ============================================================

    function getBalansersFromLampa(movie) {
        var sources = [];

        // 1. Получаем активный балансер
        var activeBalanser = Lampa.Storage.get('active_balanser', '');
        if (activeBalanser) {
            sources.push(activeBalanser);
        }

        // 2. Получаем online_balanser
        var onlineBalanser = Lampa.Storage.get('online_balanser', '');
        if (onlineBalanser && onlineBalanser !== activeBalanser) {
            sources.push(onlineBalanser);
        }

        // 3. Добавляем приоритетные источники, если их нет в списке
        SOURCE_PRIORITY.forEach(function(prio) {
            var alreadyExists = sources.some(function(s) {
                return s.toLowerCase().indexOf(prio.name) !== -1;
            });
            if (!alreadyExists) {
                sources.push(prio.name);
            }
        });

        // 4. Удаляем дубликаты
        var unique = [];
        sources.forEach(function(s) {
            var lower = s.toLowerCase();
            if (!unique.some(function(u) { return u.toLowerCase() === lower; })) {
                unique.push(s);
            }
        });

        console.log('📋 Источники для проверки:', unique);
        return unique;
    }

    // ============================================================
    // СБОР СО ВСЕХ ИСТОЧНИКОВ
    // ============================================================

    function collectAllSources(movie, callback) {
        var allItems = [];
        var sources = getBalansersFromLampa(movie);
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
                console.log('  ✅ Ответ от ' + sourceName + ' получен');

                try {
                    var $html = $('<div>' + str + '</div>');
                    var count = 0;

                    $html.find('.videos__item').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            if (data.method === 'play' || data.method === 'call') {
                                data.text = text;
                                data.sourceName = sourceName;
                                allItems.push(data);
                                count++;
                            }
                        } catch (e) {}
                    });

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
                    bestItem: null
                };
            }

            var qualityResult = getVideoQuality(item);
            results[source].items.push({
                item: item,
                quality: qualityResult.quality,
                sources: qualityResult.sources
            });

            if (qualityResult.quality > results[source].maxQuality) {
                results[source].maxQuality = qualityResult.quality;
                results[source].bestItem = item;
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

        for (var source in analyzedResults) {
            var data = analyzedResults[source];
            var quality = data.maxQuality;

            // Если качество 0 - пропускаем
            if (quality === 0) continue;

            // Определяем вес источника
            var priority = SOURCE_PRIORITY.find(function(p) {
                return source.toLowerCase().indexOf(p.name) !== -1;
            });
            var weight = priority ? priority.weight : 0;

            console.log('  📊 ' + source + ': качество ' + quality + 'p, вес ' + weight + ', элементов ' + data.items.length);

            // Выбираем по: качество > вес
            if (quality > bestQuality || (quality === bestQuality && weight > bestWeight)) {
                bestQuality = quality;
                bestWeight = weight;
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

        // Сохраняем выбранный источник
        Lampa.Storage.set('active_balanser', sourceName);
        Lampa.Storage.set('online_balanser', sourceName);

        // Обновляем last_select_balanser
        var lastSelect = Lampa.Storage.cache('online_last_balanser', 3000, {});
        if (movie && movie.id) {
            lastSelect[movie.id] = sourceName;
            Lampa.Storage.set('online_last_balanser', lastSelect);
        }

        // Перезагружаем активность, чтобы применить источник
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
    // ОСНОВНАЯ ЛОГИКА - НАЙТИ ЛУЧШИЙ ИСТОЧНИК
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

            // Анализируем качество по источникам
            var analyzed = analyzeSourcesQuality(allItems);

            console.log('📊 АНАЛИЗ ИСТОЧНИКОВ:');
            var bestSource = selectBestSource(analyzed);

            if (!bestSource) {
                console.log('❌ Не удалось определить лучший источник');
                return;
            }

            console.log('🏆 ЛУЧШИЙ ИСТОЧНИК: ' + bestSource + ' (качество ' + analyzed[bestSource].maxQuality + 'p)');

            // Переключаемся на лучший источник
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

            var originalParse = this.parse;

            this.parse = function(str) {
                console.log('📥 parse() вызван для: ' + (object.balanser || 'unknown'));

                // Если еще не собирали все источники
                if (!isCollecting) {
                    isCollecting = true;
                    // Запускаем поиск лучшего источника
                    findBestSourceAndSwitch(movie);
                }

                // Вызываем оригинальный parse
                return originalParse.call(this, str);
            };
        }

        SmartLampac.prototype = Object.create(BaseLampac.prototype);
        SmartLampac.prototype.constructor = SmartLampac;

        Lampa.Component.add('lampac', SmartLampac);
        console.log('✅ Компонент Lampac успешно пропатчен!');
    }

    // ============================================================
    // КНОПКА "НАЙТИ ЛУЧШИЙ ИСТОЧНИК"
    // ============================================================

    function addSmartButton() {
        console.log('🔘 Добавляем кнопку "Найти лучший источник"...');

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-smart-button-v5').length > 0) return;

                console.log('  Кнопка для: ' + (movie.title || movie.name));

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button-v5" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>Лучший источник</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    console.log('🔘 Кнопка "Лучший источник" нажата');
                    findBestSourceAndSwitch(movie);
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
        console.log('🚀 Инициализация SmartOnline v5');
        console.log('  Патчим компонент Lampac...');

        patchLampacComponent();
        addSmartButton();

        console.log('✅ SmartOnline v5 готов к работе!');
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
