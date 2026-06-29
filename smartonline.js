(function () {
    'use strict';

    // ============================================================
    // ОТЛАДКА В САМОМ НАЧАЛЕ
    // ============================================================

    console.log('========================================');
    console.log('🔍 SmartOnline v3 - ЗАПУСК');
    console.log('========================================');
    console.log('📋 Будет выполнено:');
    console.log('  1. Сбор данных со всех источников (Phantom, Filmix, Alloha, Kinopub)');
    console.log('  2. Анализ качества в каждом источнике');
    console.log('  3. Выбор лучшего качества');
    console.log('  4. Запуск видео с лучшим качеством');
    console.log('========================================');

    if (window.smartonline_plugin_v3) {
        console.log('⚠️ Плагин уже запущен, пропускаем');
        return;
    }
    window.smartonline_plugin_v3 = true;

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
    // ОПРЕДЕЛЕНИЕ КАЧЕСТВА
    // ============================================================

    function detectQuality(value) {
        var text = (value || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
        if (!text) return 0;

        if (/(2160|4k|uhd|ultra[\s-]?hd|3840|ultrahd|4[\s-]?k)/i.test(text)) return 2160;
        if (/(1080|full[\s-]?hd|fhd|1920|fullhd)/i.test(text)) return 1080;
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 720;
        if (/(480|sd|dvd|640|854)/i.test(text)) return 480;

        return 0;
    }

    console.log('📐 Определение качества по ключевым словам: 2160p, 4K, 1080p, Full HD, 720p, 480p');

    // ============================================================
    // СБОР СО ВСЕХ ИСТОЧНИКОВ
    // ============================================================

    function collectAllSources(movie, callback) {
        var allVideos = [];
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

            console.log('  📡 Запрос к ' + sourceName + ': ' + url);

            var network = new Lampa.Reguest();
            network.timeout(10000);
            network["native"](url, function(str) {
                completed++;
                console.log('  ✅ Ответ от ' + sourceName + ' получен');

                try {
                    var $html = $('<div>' + str + '</div>');
                    var found = 0;
                    $html.find('.videos__item').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            if (data.method === 'play' || data.method === 'call') {
                                data.text = text;
                                data.sourceName = sourceName;
                                allVideos.push(data);
                                found++;
                            }
                        } catch (e) {}
                    });
                    console.log('    📹 Найдено видео: ' + found);
                } catch (e) {
                    console.log('    ❌ Ошибка парсинга: ' + e.message);
                }

                if (completed === totalSources) {
                    console.log('📊 Все источники обработаны. Всего видео: ' + allVideos.length);
                    callback(allVideos);
                }
            }, function(err) {
                completed++;
                console.log('  ❌ Ошибка запроса к ' + sourceName + ': ' + (err.status || 'unknown'));
                if (completed === totalSources) {
                    console.log('📊 Все источники обработаны. Всего видео: ' + allVideos.length);
                    callback(allVideos);
                }
            }, false, { dataType: 'text' });
        });
    }

    // ============================================================
    // АНАЛИЗ КАЧЕСТВА ВИДЕО
    // ============================================================

    function analyzeVideoQuality(item, callback) {
        var url = item.url || item.stream || '';

        // Проверяем текст
        var textQuality = 0;
        var textFields = [item && item.text, item && item.title, item && item.name, item && item.label];
        textFields.forEach(function(field) {
            if (field) {
                var q = detectQuality(field);
                if (q > textQuality) textQuality = q;
            }
        });

        var urlQuality = detectQuality(url);
        var result = Math.max(textQuality, urlQuality);

        // Проверяем quality объект
        if (item && item.quality && typeof item.quality === 'object') {
            for (var q in item.quality) {
                var detected = detectQuality(q + ' ' + item.quality[q]);
                if (detected > result) result = detected;
            }
        }

        callback(result);
    }

    // ============================================================
    // ВЫБОР ЛУЧШЕГО ВИДЕО
    // ============================================================

    function selectBestVideo(videos) {
        console.log('🎯 Анализ ' + videos.length + ' видео для выбора лучшего');

        if (!videos || videos.length === 0) {
            console.log('❌ Нет видео для анализа');
            return null;
        }

        // Анализируем каждое видео
        var analyzed = [];
        var pending = videos.length;

        return new Promise(function(resolve) {
            videos.forEach(function(item, index) {
                analyzeVideoQuality(item, function(quality) {
                    console.log('  Видео #' + (index + 1) + ' [' + (item.sourceName || 'unknown') + ']: качество ' + quality + 'p, текст: ' + (item.text || ''));
                    analyzed.push({
                        item: item,
                        quality: quality,
                        index: index
                    });

                    pending--;
                    if (pending === 0) {
                        // Сортируем по качеству (от высшего к низшему)
                        analyzed.sort(function(a, b) {
                            return b.quality - a.quality;
                        });

                        // Оставляем только самое высокое качество
                        var maxQuality = analyzed[0].quality;
                        var bestCandidates = analyzed.filter(function(a) {
                            return a.quality === maxQuality;
                        });

                        console.log('🏆 ЛУЧШЕЕ КАЧЕСТВО: ' + maxQuality + 'p');
                        console.log('📋 Кандидатов с лучшим качеством: ' + bestCandidates.length);

                        // Сортируем по приоритету источника
                        bestCandidates.sort(function(a, b) {
                            var aPrio = SOURCE_PRIORITY.find(function(s) { return a.item.sourceName && a.item.sourceName.indexOf(s.name) !== -1; });
                            var bPrio = SOURCE_PRIORITY.find(function(s) { return b.item.sourceName && b.item.sourceName.indexOf(s.name) !== -1; });
                            return (bPrio ? bPrio.weight : 0) - (aPrio ? aPrio.weight : 0);
                        });

                        var best = bestCandidates[0];
                        console.log('🎯 ВЫБРАННОЕ ВИДЕО:');
                        console.log('  Качество: ' + best.quality + 'p');
                        console.log('  Источник: ' + (best.item.sourceName || 'unknown'));
                        console.log('  Текст: ' + (best.item.text || ''));
                        console.log('  URL: ' + (best.item.url || best.item.stream || '').substring(0, 80) + '...');

                        resolve(best.item);
                    }
                });
            });
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

            // Сохраняем оригинальный объект
            var movie = object.movie || {};
            var isCollecting = false;
            var allVideos = [];

            // Вызываем оригинальный конструктор
            BaseLampac.call(this, object);

            // Сохраняем оригинальный метод parse
            var originalParse = this.parse;

            // Переопределяем parse
            this.parse = function(str) {
                console.log('📥 parse() вызван для: ' + (object.balanser || 'unknown'));

                // Парсим текущий ответ
                try {
                    var $html = $('<div>' + str + '</div>');
                    var videos = [];

                    $html.find('.videos__item').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            if (data.method === 'play' || data.method === 'call') {
                                data.text = text;
                                data.sourceName = object.balanser || 'unknown';
                                videos.push(data);
                            }
                        } catch (e) {}
                    });

                    if (videos.length > 0) {
                        allVideos = allVideos.concat(videos);
                        console.log('  📹 Добавлено видео из ' + (object.balanser || 'unknown') + ': ' + videos.length);
                    }

                    // Если еще не собирали все источники
                    if (!isCollecting) {
                        isCollecting = true;
                        console.log('🔄 Начинаем сбор со всех источников...');

                        collectAllSources(movie, function(allCollectedVideos) {
                            console.log('📊 Собрано со всех источников: ' + allCollectedVideos.length);

                            // Объединяем с уже собранными
                            var combined = allVideos.concat(allCollectedVideos);
                            console.log('📊 Всего видео после объединения: ' + combined.length);

                            if (combined.length === 0) {
                                console.log('❌ Нет видео для воспроизведения');
                                return;
                            }

                            // Выбираем лучшее видео
                            selectBestVideo(combined).then(function(bestItem) {
                                if (!bestItem) {
                                    console.log('❌ Не удалось выбрать лучшее видео');
                                    return;
                                }

                                console.log('▶️ ЗАПУСК ЛУЧШЕГО ВИДЕО:');
                                console.log('  Качество: ' + (bestItem.quality || detectQuality(bestItem.text)) + 'p');
                                console.log('  Источник: ' + bestItem.sourceName);
                                console.log('  Текст: ' + bestItem.text);

                                // Создаем данные для плеера
                                var playData = {
                                    url: bestItem.url || bestItem.stream,
                                    title: bestItem.title || bestItem.text || '',
                                    quality: bestItem.qualitys || bestItem.quality,
                                    isonline: true,
                                    _sourceName: bestItem.sourceName,
                                    _bestQuality: true,
                                    movie: movie,
                                    card: movie
                                };

                                if (bestItem.segments) playData.segments = bestItem.segments;
                                if (bestItem.subtitles) playData.subtitles = bestItem.subtitles;
                                if (bestItem.timeline) playData.timeline = bestItem.timeline;
                                if (bestItem.season) playData.season = bestItem.season;
                                if (bestItem.episode) playData.episode = bestItem.episode;
                                if (bestItem.voice_name) playData.voice_name = bestItem.voice_name;
                                if (bestItem.thumbnail) playData.thumbnail = bestItem.thumbnail;

                                // Запускаем плеер
                                if (Lampa.Player && Lampa.Player.play) {
                                    console.log('🚀 Запуск плеера...');
                                    Lampa.Player.play(playData);
                                } else {
                                    console.log('❌ Плеер не доступен');
                                }
                            });
                        });
                    }

                } catch (e) {
                    console.log('❌ Ошибка парсинга: ' + e.message);
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
    // ДОБАВЛЕНИЕ КНОПКИ
    // ============================================================

    function addSmartButton() {
        console.log('🔘 Добавляем кнопку Smart Online...');

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-smart-button-v3').length > 0) return;

                console.log('  Кнопка для: ' + (movie.title || movie.name));

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button-v3" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>Smart Online</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    console.log('🔘 Кнопка Smart Online нажата');
                    console.log('  Фильм: ' + (movie.title || movie.name));

                    collectAllSources(movie, function(allVideos) {
                        console.log('📊 Собрано видео: ' + allVideos.length);

                        if (allVideos.length === 0) {
                            if (Lampa.Noty && Lampa.Noty.show) {
                                Lampa.Noty.show('Не найдено видео для просмотра');
                            }
                            return;
                        }

                        selectBestVideo(allVideos).then(function(bestItem) {
                            if (!bestItem) return;

                            console.log('▶️ ЗАПУСК ЛУЧШЕГО ВИДЕО (по кнопке)');

                            var playData = {
                                url: bestItem.url || bestItem.stream,
                                title: bestItem.title || bestItem.text || '',
                                quality: bestItem.qualitys || bestItem.quality,
                                isonline: true,
                                _sourceName: bestItem.sourceName,
                                _bestQuality: true,
                                movie: movie,
                                card: movie
                            };

                            if (bestItem.segments) playData.segments = bestItem.segments;
                            if (bestItem.subtitles) playData.subtitles = bestItem.subtitles;
                            if (bestItem.timeline) playData.timeline = bestItem.timeline;
                            if (bestItem.season) playData.season = bestItem.season;
                            if (bestItem.episode) playData.episode = bestItem.episode;
                            if (bestItem.voice_name) playData.voice_name = bestItem.voice_name;
                            if (bestItem.thumbnail) playData.thumbnail = bestItem.thumbnail;

                            Lampa.Player.play(playData);
                        });
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
        console.log('🚀 Инициализация SmartOnline v3');
        console.log('  Патчим компонент Lampac...');

        // Патчим компонент
        patchLampacComponent();

        // Добавляем кнопку
        addSmartButton();

        console.log('✅ SmartOnline v3 готов к работе!');
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
