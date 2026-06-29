(function () {
    'use strict';

    // ============================================================
    // ОТЛАДКА В САМОМ НАЧАЛЕ
    // ============================================================

    console.log('========================================');
    console.log('🔍 SmartOnline v4 - ЗАПУСК');
    console.log('========================================');
    console.log('📋 Будет выполнено:');
    console.log('  1. Сбор данных со всех источников (Phantom, Filmix, Alloha, Kinopub)');
    console.log('  2. Анализ качества ВО ВСЕХ ПОЛЯХ');
    console.log('  3. Выбор лучшего качества');
    console.log('  4. Запуск видео с лучшим качеством');
    console.log('========================================');

    if (window.smartonline_plugin_v4) {
        console.log('⚠️ Плагин уже запущен, пропускаем');
        return;
    }
    window.smartonline_plugin_v4 = true;

    // ============================================================
    // ПРИОРИТЕТЫ ИСТОЧНИКОВ
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

        // Если есть цифры с p (например "720p", "1080p")
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

        // 1. Проверяем text
        if (item.text) {
            var q = detectQuality(item.text);
            if (q > quality) {
                quality = q;
                sources.push('text: "' + item.text + '" → ' + q + 'p');
            }
        }

        // 2. Проверяем title
        if (item.title) {
            var q = detectQuality(item.title);
            if (q > quality) {
                quality = q;
                sources.push('title: "' + item.title + '" → ' + q + 'p');
            }
        }

        // 3. Проверяем name
        if (item.name) {
            var q = detectQuality(item.name);
            if (q > quality) {
                quality = q;
                sources.push('name: "' + item.name + '" → ' + q + 'p');
            }
        }

        // 4. Проверяем URL
        if (item.url) {
            var q = detectQuality(item.url);
            if (q > quality) {
                quality = q;
                sources.push('url: "' + item.url.substring(0, 50) + '..." → ' + q + 'p');
            }
        }

        // 5. Проверяем stream
        if (item.stream) {
            var q = detectQuality(item.stream);
            if (q > quality) {
                quality = q;
                sources.push('stream: "' + item.stream.substring(0, 50) + '..." → ' + q + 'p');
            }
        }

        // 6. Проверяем quality объект
        if (item.quality && typeof item.quality === 'object') {
            for (var key in item.quality) {
                var q = detectQuality(key);
                if (q > quality) {
                    quality = q;
                    sources.push('quality key: "' + key + '" → ' + q + 'p');
                }
                var q2 = detectQuality(item.quality[key]);
                if (q2 > quality) {
                    quality = q2;
                    sources.push('quality value: "' + item.quality[key] + '" → ' + q2 + 'p');
                }
            }
        }

        // 7. Проверяем qualitys
        if (item.qualitys && typeof item.qualitys === 'object') {
            for (var key2 in item.qualitys) {
                var q = detectQuality(key2);
                if (q > quality) {
                    quality = q;
                    sources.push('qualitys key: "' + key2 + '" → ' + q + 'p');
                }
                var q2 = detectQuality(item.qualitys[key2]);
                if (q2 > quality) {
                    quality = q2;
                    sources.push('qualitys value: "' + item.qualitys[key2] + '" → ' + q2 + 'p');
                }
            }
        }

        // 8. Проверяем label
        if (item.label) {
            var q = detectQuality(item.label);
            if (q > quality) {
                quality = q;
                sources.push('label: "' + item.label + '" → ' + q + 'p');
            }
        }

        return {
            quality: quality,
            sources: sources
        };
    }

    // ============================================================
    // СБОР СО ВСЕХ ИСТОЧНИКОВ
    // ============================================================

    function collectAllSources(movie, callback) {
        var allVideos = [];
        var allButtons = [];
        var sources = ['phantom', 'filmix', 'alloha', 'kinopub'];
        var totalSources = sources.length;
        var completed = 0;

        console.log('🔎 Начинаем сбор со всех источников...');

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
                    var found = 0;

                    // Парсим элементы видео
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
                                allVideos.push(data);
                                found++;
                            }
                        } catch (e) {}
                    });

                    // Парсим кнопки (озвучки) - здесь тоже может быть качество
                    $html.find('.videos__button').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            data.text = text;
                            data.sourceName = sourceName;
                            data.isButton = true;
                            allButtons.push(data);
                        } catch (e) {}
                    });

                    console.log('    📹 Найдено видео: ' + found + ', кнопок: ' + allButtons.length);
                } catch (e) {
                    console.log('    ❌ Ошибка парсинга: ' + e.message);
                }

                if (completed === totalSources) {
                    // Объединяем видео и кнопки для анализа качества
                    var allItems = allVideos.concat(allButtons);
                    console.log('📊 Всего элементов для анализа: ' + allItems.length + ' (видео: ' + allVideos.length + ', кнопки: ' + allButtons.length + ')');
                    callback(allItems);
                }
            }, function(err) {
                completed++;
                console.log('  ❌ Ошибка запроса к ' + sourceName + ': ' + (err.status || 'unknown'));
                if (completed === totalSources) {
                    var allItems = allVideos.concat(allButtons);
                    console.log('📊 Всего элементов для анализа: ' + allItems.length);
                    callback(allItems);
                }
            }, false, { dataType: 'text' });
        });
    }

    // ============================================================
    // ВЫБОР ЛУЧШЕГО ВИДЕО
    // ============================================================

    function selectBestVideo(items) {
        console.log('🎯 Анализ ' + items.length + ' элементов для выбора лучшего качества');

        if (!items || items.length === 0) {
            console.log('❌ Нет элементов для анализа');
            return null;
        }

        // Анализируем каждый элемент
        var analyzed = [];

        items.forEach(function(item, index) {
            var result = getVideoQuality(item);
            console.log('  Элемент #' + (index + 1) + ' [' + (item.sourceName || 'unknown') + ']:');
            console.log('    Текст: ' + (item.text || 'Нет'));
            console.log('    Качество: ' + result.quality + 'p');
            if (result.sources.length > 0) {
                console.log('    Найдено в:');
                result.sources.forEach(function(s) {
                    console.log('      - ' + s);
                });
            } else {
                console.log('    ⚠️ Качество не найдено');
            }

            analyzed.push({
                item: item,
                quality: result.quality,
                sources: result.sources,
                index: index
            });
        });

        // Сортируем по качеству
        analyzed.sort(function(a, b) {
            return b.quality - a.quality;
        });

        // Оставляем только самое высокое качество
        var maxQuality = analyzed.length > 0 ? analyzed[0].quality : 0;

        if (maxQuality === 0) {
            console.log('⚠️ Качество не найдено ни в одном элементе');
            return null;
        }

        var bestCandidates = analyzed.filter(function(a) {
            return a.quality === maxQuality;
        });

        console.log('🏆 ЛУЧШЕЕ КАЧЕСТВО: ' + maxQuality + 'p');
        console.log('📋 Кандидатов с лучшим качеством: ' + bestCandidates.length);

        // Сортируем по приоритету источника
        bestCandidates.sort(function(a, b) {
            var aPrio = SOURCE_PRIORITY.find(function(s) {
                return a.item.sourceName && a.item.sourceName.indexOf(s.name) !== -1;
            });
            var bPrio = SOURCE_PRIORITY.find(function(s) {
                return b.item.sourceName && b.item.sourceName.indexOf(s.name) !== -1;
            });
            return (bPrio ? bPrio.weight : 0) - (aPrio ? aPrio.weight : 0);
        });

        var best = bestCandidates[0];
        console.log('🎯 ВЫБРАННЫЙ ЭЛЕМЕНТ:');
        console.log('  Качество: ' + best.quality + 'p');
        console.log('  Источник: ' + (best.item.sourceName || 'unknown'));
        console.log('  Текст: ' + (best.item.text || 'Нет'));
        console.log('  Найдено в:');
        best.sources.forEach(function(s) {
            console.log('    - ' + s);
        });

        return best.item;
    }

    // ============================================================
    // ЗАПУСК ВИДЕО
    // ============================================================

    function playVideo(item, movie) {
        if (!item) {
            console.log('❌ Нет элемента для воспроизведения');
            return;
        }

        var url = item.url || item.stream;
        if (!url) {
            console.log('❌ Нет URL для воспроизведения');
            return;
        }

        console.log('▶️ ЗАПУСК ВИДЕО:');
        console.log('  URL: ' + url.substring(0, 80) + '...');
        console.log('  Источник: ' + (item.sourceName || 'unknown'));
        console.log('  Качество: ' + getVideoQuality(item).quality + 'p');
        console.log('  Текст: ' + (item.text || ''));

        var playData = {
            url: url,
            title: item.title || item.text || '',
            quality: item.qualitys || item.quality,
            isonline: true,
            _sourceName: item.sourceName || 'unknown',
            _bestQuality: true,
            movie: movie,
            card: movie
        };

        if (item.segments) playData.segments = item.segments;
        if (item.subtitles) playData.subtitles = item.subtitles;
        if (item.timeline) playData.timeline = item.timeline;
        if (item.season) playData.season = item.season;
        if (item.episode) playData.episode = item.episode;
        if (item.voice_name) playData.voice_name = item.voice_name;
        if (item.thumbnail) playData.thumbnail = item.thumbnail;

        if (Lampa.Player && Lampa.Player.play) {
            console.log('🚀 Запуск плеера...');
            Lampa.Player.play(playData);
        } else {
            console.log('❌ Плеер не доступен');
        }
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
            var allItems = [];

            BaseLampac.call(this, object);

            var originalParse = this.parse;

            this.parse = function(str) {
                console.log('📥 parse() вызван для: ' + (object.balanser || 'unknown'));

                try {
                    var $html = $('<div>' + str + '</div>');
                    var items = [];

                    // Собираем видео
                    $html.find('.videos__item').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            if (data.method === 'play' || data.method === 'call') {
                                data.text = text;
                                data.sourceName = object.balanser || 'unknown';
                                items.push(data);
                            }
                        } catch (e) {}
                    });

                    // Собираем кнопки (озвучки)
                    $html.find('.videos__button').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            data.text = text;
                            data.sourceName = object.balanser || 'unknown';
                            data.isButton = true;
                            items.push(data);
                        } catch (e) {}
                    });

                    if (items.length > 0) {
                        allItems = allItems.concat(items);
                        console.log('  📦 Добавлено элементов из ' + (object.balanser || 'unknown') + ': ' + items.length);
                    }

                    if (!isCollecting) {
                        isCollecting = true;
                        console.log('🔄 Начинаем сбор со всех источников...');

                        collectAllSources(movie, function(allCollectedItems) {
                            console.log('📊 Собрано со всех источников: ' + allCollectedItems.length);

                            var combined = allItems.concat(allCollectedItems);
                            console.log('📊 Всего элементов после объединения: ' + combined.length);

                            if (combined.length === 0) {
                                console.log('❌ Нет элементов для воспроизведения');
                                return;
                            }

                            var bestItem = selectBestVideo(combined);
                            if (bestItem) {
                                playVideo(bestItem, movie);
                            } else {
                                console.log('❌ Не удалось выбрать лучшее видео');
                            }
                        });
                    }

                } catch (e) {
                    console.log('❌ Ошибка парсинга: ' + e.message);
                }

                return originalParse.call(this, str);
            };
        }

        SmartLampac.prototype = Object.create(BaseLampac.prototype);
        SmartLampac.prototype.constructor = SmartLampac;

        Lampa.Component.add('lampac', SmartLampac);
        console.log('✅ Компонент Lampac успешно пропатчен!');
    }

    // ============================================================
    // ДОБАВЛЕНИЕ КНОПКИ
    // ============================================================

    function addSmartButton() {
        console.log('🔘 Добавляем кнопку Smart Online...');

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-smart-button-v4').length > 0) return;

                console.log('  Кнопка для: ' + (movie.title || movie.name));

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button-v4" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>Smart Online</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    console.log('🔘 Кнопка Smart Online нажата');
                    console.log('  Фильм: ' + (movie.title || movie.name));

                    collectAllSources(movie, function(allItems) {
                        console.log('📊 Собрано элементов: ' + allItems.length);

                        if (allItems.length === 0) {
                            if (Lampa.Noty && Lampa.Noty.show) {
                                Lampa.Noty.show('Не найдено видео для просмотра');
                            }
                            return;
                        }

                        var bestItem = selectBestVideo(allItems);
                        if (bestItem) {
                            playVideo(bestItem, movie);
                        }
                    });
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
        console.log('🚀 Инициализация SmartOnline v4');
        console.log('  Патчим компонент Lampac...');

        patchLampacComponent();
        addSmartButton();

        console.log('✅ SmartOnline v4 готов к работе!');
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
