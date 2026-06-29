(function () {
    'use strict';

    if (window.smartonline_plugin_v3) return;
    window.smartonline_plugin_v3 = true;

    // ============================================================
    // НАСТРОЙКИ
    // ============================================================

    var DEBUG = {
        enabled: true,
        console: true
    };

    function debugLog(message, data) {
        if (!DEBUG.enabled || !DEBUG.console) return;
        if (data !== undefined) {
            console.log('🔍 [SmartOnline]', message, data);
        } else {
            console.log('🔍 [SmartOnline]', message);
        }
    }

    // ============================================================
    // ПРИОРИТЕТЫ ИСТОЧНИКОВ
    // ============================================================

    var SOURCE_PRIORITY = [
        { name: 'phantom', weight: 10, label: 'Phantom' },
        { name: 'filmix', weight: 8, label: 'Filmix' },
        { name: 'alloha', weight: 6, label: 'Alloha' },
        { name: 'kinopub', weight: 4, label: 'Kinopub' }
    ];

    function getSourcePriority(source) {
        var text = (source || '').toLowerCase();
        for (var i = 0; i < SOURCE_PRIORITY.length; i++) {
            if (text.indexOf(SOURCE_PRIORITY[i].name) !== -1) {
                return SOURCE_PRIORITY[i];
            }
        }
        return null;
    }

    // ============================================================
    // ОПРЕДЕЛЕНИЕ КАЧЕСТВА
    // ============================================================

    var streamQualityCache = {};

    function detectQualityFromText(value) {
        var text = (value || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
        if (!text) return 0;

        if (/(2160|4k|uhd|ultra[\s-]?hd|3840|ultrahd|4[\s-]?k)/i.test(text)) return 2160;
        if (/(1080|full[\s-]?hd|fhd|1920|fullhd)/i.test(text)) return 1080;
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 720;
        if (/(480|sd|dvd|640|854)/i.test(text)) return 480;

        return 0;
    }

    function analyzeStreamQuality(url, callback) {
        if (!url) { callback(0); return; }

        var cacheKey = Lampa.Utils.hash(url);
        if (streamQualityCache[cacheKey]) {
            callback(streamQualityCache[cacheKey]);
            return;
        }

        try {
            var video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.style.display = 'none';
            document.body.appendChild(video);

            var timeout = setTimeout(function() {
                video.remove();
                var qualityFromUrl = detectQualityFromText(url);
                if (qualityFromUrl > 0) streamQualityCache[cacheKey] = qualityFromUrl;
                callback(qualityFromUrl || 0);
            }, 3000);

            video.addEventListener('loadedmetadata', function() {
                clearTimeout(timeout);
                var height = video.videoHeight || 0;
                var quality = 0;
                if (height >= 2160) quality = 2160;
                else if (height >= 1080) quality = 1080;
                else if (height >= 720) quality = 720;
                else if (height >= 480) quality = 480;

                if (quality > 0) streamQualityCache[cacheKey] = quality;
                video.remove();
                callback(quality);
            });

            video.addEventListener('error', function() {
                clearTimeout(timeout);
                video.remove();
                var qualityFromUrl = detectQualityFromText(url);
                if (qualityFromUrl > 0) streamQualityCache[cacheKey] = qualityFromUrl;
                callback(qualityFromUrl || 0);
            });

            video.src = url;
            video.load();

        } catch (e) {
            var qualityFromUrl = detectQualityFromText(url);
            if (qualityFromUrl > 0) streamQualityCache[cacheKey] = qualityFromUrl;
            callback(qualityFromUrl || 0);
        }
    }

    function getItemQuality(item, callback) {
        var url = item.url || item.stream || '';

        // Проверяем текст
        var textQuality = 0;
        var textFields = [item.text, item.title, item.name, item.label];
        textFields.forEach(function(field) {
            if (field) {
                var q = detectQualityFromText(field);
                if (q > textQuality) textQuality = q;
            }
        });

        var urlQuality = detectQualityFromText(url);
        var maxFromText = Math.max(textQuality, urlQuality);

        // Проверяем quality объект
        if (item && item.quality && typeof item.quality === 'object') {
            for (var q in item.quality) {
                var detected = detectQualityFromText(q + ' ' + item.quality[q]);
                if (detected > maxFromText) maxFromText = detected;
            }
        }

        // Анализируем поток
        if (url && url.indexOf('http') === 0) {
            analyzeStreamQuality(url, function(streamQuality) {
                callback(Math.max(maxFromText, streamQuality));
            });
            return;
        }

        callback(maxFromText);
    }

    // ============================================================
    // СБОР ВСЕХ ВИДЕО СО ВСЕХ ИСТОЧНИКОВ
    // ============================================================

    function collectAllVideosFromSources(sources, movie, callback) {
        var allVideos = [];
        var totalSources = sources.length;
        var completed = 0;

        debugLog('📊 Начинаем сбор со всех источников: ' + sources.join(', '));

        if (totalSources === 0) {
            callback([]);
            return;
        }

        sources.forEach(function(sourceName) {
            debugLog('🔎 Запрос к источнику: ' + sourceName);

            // Формируем URL для запроса к источнику
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

            // Получаем URL источника
            var sourceUrl = 'https://ab2024.ru/lite/' + sourceName + '?' + query.join('&');

            debugLog('  📡 Запрос: ' + sourceUrl);

            var network = new Lampa.Reguest();
            network.timeout(10000);
            network["native"](sourceUrl, function(str) {
                completed++;
                debugLog('  ✅ Ответ от ' + sourceName + ' получен');

                try {
                    // Парсим ответ
                    var videos = [];
                    var $html = $('<div>' + str + '</div>');
                    $html.find('.videos__item').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            if (data.method === 'play' || data.method === 'call') {
                                data.text = text;
                                data.sourceName = sourceName;
                                videos.push(data);
                            }
                        } catch (e) {}
                    });

                    if (videos.length > 0) {
                        debugLog('  📹 Найдено видео: ' + videos.length + ' в ' + sourceName);
                        allVideos = allVideos.concat(videos);
                    } else {
                        debugLog('  ⚠️ Видео не найдены в ' + sourceName);
                    }
                } catch (e) {
                    debugLog('  ❌ Ошибка парсинга ' + sourceName + ': ' + e.message);
                }

                // Проверяем, все ли источники обработаны
                if (completed === totalSources) {
                    debugLog('📊 Все источники обработаны. Всего видео: ' + allVideos.length);
                    callback(allVideos);
                }
            }, function(err) {
                completed++;
                debugLog('  ❌ Ошибка запроса к ' + sourceName + ': ' + (err.status || 'unknown'));
                if (completed === totalSources) {
                    debugLog('📊 Все источники обработаны. Всего видео: ' + allVideos.length);
                    callback(allVideos);
                }
            }, false, {
                dataType: 'text'
            });
        });
    }

    // ============================================================
    // ВЫБОР ЛУЧШЕГО ВИДЕО
    // ============================================================

    function selectBestVideo(videos, callback) {
        if (!videos || videos.length === 0) {
            debugLog('❌ Нет видео для выбора');
            callback(null);
            return;
        }

        debugLog('🎯 Анализ ' + videos.length + ' видео для выбора лучшего');

        var pendingCount = 0;
        var analyzed = [];

        videos.forEach(function(item, index) {
            getItemQuality(item, function(quality) {
                pendingCount++;
                analyzed.push({
                    item: item,
                    quality: quality,
                    index: index
                });

                if (pendingCount === videos.length) {
                    // Сортируем по качеству (от высшего к низшему)
                    analyzed.sort(function(a, b) {
                        return b.quality - a.quality;
                    });

                    // Оставляем только самое высокое качество
                    var maxQuality = analyzed.length > 0 ? analyzed[0].quality : 0;
                    var bestCandidates = analyzed.filter(function(a) {
                        return a.quality === maxQuality;
                    });

                    // Сортируем по приоритету источника
                    bestCandidates.sort(function(a, b) {
                        var aPrio = getSourcePriority(a.item.sourceName);
                        var bPrio = getSourcePriority(b.item.sourceName);
                        var aWeight = aPrio ? aPrio.weight : 0;
                        var bWeight = bPrio ? bPrio.weight : 0;
                        return bWeight - aWeight;
                    });

                    var best = bestCandidates[0];
                    debugLog('🏆 ЛУЧШЕЕ ВИДЕО:');
                    debugLog('  Качество: ' + best.quality + 'p');
                    debugLog('  Источник: ' + (best.item.sourceName || 'unknown'));
                    debugLog('  Текст: ' + (best.item.text || ''));
                    callback(best.item);
                }
            });
        });
    }

    // ============================================================
    // ПЕРЕХВАТ ПЛЕЕРА
    // ============================================================

    var originalPlayerPlay = null;
    var isPatched = false;

    function patchPlayer() {
        if (isPatched) return;
        if (!Lampa.Player || !Lampa.Player.play) return;
        isPatched = true;

        originalPlayerPlay = Lampa.Player.play;

        Lampa.Player.play = function(data) {
            debugLog('🎬 Перехват плеера');

            // Проверяем, что это онлайн-плеер
            if (!data || !data.isonline) {
                return originalPlayerPlay.call(this, data);
            }

            // Получаем список источников
            var sources = [];
            var movie = data.movie || data.card || {};

            // Определяем источники для поиска
            var activeBalanser = Lampa.Storage.get('active_balanser', '');
            var onlineBalanser = Lampa.Storage.get('online_balanser', '');

            if (activeBalanser) {
                sources.push(activeBalanser);
            }
            if (onlineBalanser && onlineBalanser !== activeBalanser) {
                sources.push(onlineBalanser);
            }

            // Если источники не определены, используем все приоритетные
            if (sources.length === 0) {
                sources = ['phantom', 'filmix', 'alloha', 'kinopub'];
            }

            debugLog('📋 Источники для поиска: ' + sources.join(', '));

            // Если видео уже содержит информацию об источнике
            if (data._sourceName) {
                debugLog('📌 Видео уже имеет источник: ' + data._sourceName);
                return originalPlayerPlay.call(this, data);
            }

            // Сохраняем оригинальные данные
            var originalData = data;

            // Показываем загрузку
            if (Lampa.Loading && Lampa.Loading.start) {
                Lampa.Loading.start();
            }

            // Собираем видео со всех источников
            collectAllVideosFromSources(sources, movie, function(allVideos) {
                if (Lampa.Loading && Lampa.Loading.stop) {
                    Lampa.Loading.stop();
                }

                if (allVideos.length === 0) {
                    debugLog('❌ Видео не найдены ни в одном источнике');
                    if (Lampa.Noty && Lampa.Noty.show) {
                        Lampa.Noty.show('Не найдено видео для просмотра');
                    }
                    return;
                }

                // Выбираем лучшее видео
                selectBestVideo(allVideos, function(bestItem) {
                    if (!bestItem) {
                        debugLog('❌ Не удалось выбрать лучшее видео');
                        return;
                    }

                    debugLog('🎯 ВЫБРАНО ЛУЧШЕЕ ВИДЕО:');
                    debugLog('  Источник: ' + bestItem.sourceName);
                    debugLog('  Качество: ' + (bestItem.quality || detectQualityFromText(bestItem.text)) + 'p');
                    debugLog('  Текст: ' + bestItem.text);

                    // Создаем новый объект для плеера
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

                    // Копируем остальные поля
                    if (bestItem.segments) playData.segments = bestItem.segments;
                    if (bestItem.subtitles) playData.subtitles = bestItem.subtitles;
                    if (bestItem.timeline) playData.timeline = bestItem.timeline;
                    if (bestItem.season) playData.season = bestItem.season;
                    if (bestItem.episode) playData.episode = bestItem.episode;
                    if (bestItem.voice_name) playData.voice_name = bestItem.voice_name;
                    if (bestItem.thumbnail) playData.thumbnail = bestItem.thumbnail;

                    debugLog('▶️ Запуск плеера с выбранным видео');
                    originalPlayerPlay.call(Lampa.Player, playData);
                });
            });
        };

        debugLog('✅ Плеер успешно пропатчен');
    }

    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================================

    function init() {
        debugLog('🚀 Инициализация SmartOnline v3');

        // Патчим плеер
        patchPlayer();

        // Добавляем кнопку в карточку
        addSmartButton();

        debugLog('✅ SmartOnline v3 готов к работе');
    }

    function addSmartButton() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;

                // Проверяем, есть ли уже кнопка
                if (render.find('.lampac-smart-button-v3').length > 0) return;

                // Создаем кнопку
                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button-v3" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>Smart Online</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    debugLog('🔘 Нажата кнопка Smart Online для: ' + (movie.title || movie.name));

                    // Получаем список источников
                    var sources = [];
                    var activeBalanser = Lampa.Storage.get('active_balanser', '');
                    var onlineBalanser = Lampa.Storage.get('online_balanser', '');

                    if (activeBalanser) sources.push(activeBalanser);
                    if (onlineBalanser && onlineBalanser !== activeBalanser) sources.push(onlineBalanser);
                    if (sources.length === 0) sources = ['phantom', 'filmix', 'alloha', 'kinopub'];

                    // Показываем загрузку
                    if (Lampa.Loading && Lampa.Loading.start) {
                        Lampa.Loading.start();
                    }

                    // Собираем видео со всех источников
                    collectAllVideosFromSources(sources, movie, function(allVideos) {
                        if (Lampa.Loading && Lampa.Loading.stop) {
                            Lampa.Loading.stop();
                        }

                        if (allVideos.length === 0) {
                            if (Lampa.Noty && Lampa.Noty.show) {
                                Lampa.Noty.show('Не найдено видео для просмотра');
                            }
                            return;
                        }

                        // Выбираем лучшее видео
                        selectBestVideo(allVideos, function(bestItem) {
                            if (!bestItem) {
                                return;
                            }

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

                            debugLog('▶️ Запуск плеера с выбранным видео');
                            Lampa.Player.play(playData);
                        });
                    });
                });

                // Вставляем кнопку рядом с другими
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
    // ЗАПУСК
    // ============================================================

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                init();
            }
        });
    }

})();
