(function () {
    'use strict';

    if (window.best_balanser_plugin_loaded) return;
    window.best_balanser_plugin_loaded = true;

    var AB_HOST = 'https://ab2024.ru';

    // ============================================================
    // ПРИОРИТЕТЫ ОЗВУЧЕК
    // ============================================================

    var VOICE_PRIORITY = {
        'dub': 1000,
        'дубляж': 1000,
        'дублированный': 1000,
        'hdrezka': 100,
        'lostfilm': 80,
        'cube': 70,
        'кубик': 70
    };

    function getVoiceScore(name) {
        var text = String(name || '').toLowerCase();
        for (var key in VOICE_PRIORITY) {
            if (text.indexOf(key) !== -1) {
                return VOICE_PRIORITY[key];
            }
        }
        if (text.indexOf('sub') !== -1 || text.indexOf('subtitles') !== -1) return -50;
        return 0;
    }

    function isDubVoice(name) {
        var text = String(name || '').toLowerCase();
        return text.indexOf('dub') !== -1 || text.indexOf('дубляж') !== -1 || text.indexOf('дублированный') !== -1;
    }

    // ============================================================
    // ОПРЕДЕЛЕНИЕ КАЧЕСТВА
    // ============================================================

    function detectQuality(value) {
        var text = String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (!text) return 0;

        if (/(2160|4k|uhd|ultra[\s-]?hd|3840)/i.test(text)) return 2160;
        if (/(1080|full[\s-]?hd|fhd|1920)/i.test(text)) return 1080;
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 720;
        if (/(480|sd|640|854)/i.test(text)) return 480;

        return 0;
    }

    function getItemQuality(item) {
        var quality = 0;
        var fields = ['text', 'title', 'name', 'label', 'voice_name', 'url', 'stream'];
        fields.forEach(function(field) {
            if (item[field]) {
                var q = detectQuality(item[field]);
                if (q > quality) quality = q;
            }
        });
        var qualityObj = item.quality || item.qualitys;
        if (qualityObj && typeof qualityObj === 'object') {
            for (var key in qualityObj) {
                var q1 = detectQuality(key);
                if (q1 > quality) quality = q1;
                var q2 = detectQuality(qualityObj[key]);
                if (q2 > quality) quality = q2;
            }
        }
        return quality;
    }

    // ============================================================
    // СОРТИРОВКА ОЗВУЧЕК (ДЛЯ ФИЛЬМОВ)
    // ============================================================

    function sortVoicesByPriority(buttons) {
        if (!buttons || !buttons.length) return buttons;
        return buttons.slice().sort(function(a, b) {
            return getVoiceScore(b.text || '') - getVoiceScore(a.text || '');
        });
    }

    // ============================================================
    // ПОЛУЧЕНИЕ ВСЕХ БАЛАНСЕРОВ
    // ============================================================

    function getAllBalansers(callback) {
        var allBalansers = [];

        var activeBalanser = Lampa.Storage.get('active_balanser', '');
        var onlineBalanser = Lampa.Storage.get('online_balanser', '');

        if (activeBalanser) allBalansers.push(activeBalanser);
        if (onlineBalanser && onlineBalanser !== activeBalanser) allBalansers.push(onlineBalanser);

        // БЕЗ filmix - используем fxapi
        var mainBalansers = ['phantom', 'fxapi', 'alloha', 'kinopub', 'rezka', 'kodik'];
        mainBalansers.forEach(function(name) {
            if (!allBalansers.some(function(s) { return s.toLowerCase() === name; })) {
                allBalansers.push(name);
            }
        });

        var unique = [];
        allBalansers.forEach(function(s) {
            var lower = s.toLowerCase();
            if (!unique.some(function(u) { return u.toLowerCase() === lower; })) {
                unique.push(s);
            }
        });

        callback(unique);
    }

    // ============================================================
    // ПОИСК ЛУЧШЕГО БАЛАНСЕРА
    // ============================================================

    function findBestBalanser(movie, callback) {
        getAllBalansers(function(balansers) {
            var logLines = [];
            logLines.push('═══════════════════════════════════════════════════════════');
            logLines.push('🔍 ПОИСК ЛУЧШЕГО БАЛАНСЕРА');
            logLines.push('  📺 ' + (movie.title || movie.name));
            logLines.push('  🎬 Тип: ' + (movie.name ? 'СЕРИАЛ' : 'ФИЛЬМ'));
            logLines.push('  🆔 ID: ' + movie.id);
            if (movie.imdb_id) logLines.push('  🆔 IMDB: ' + movie.imdb_id);
            if (movie.kinopoisk_id) logLines.push('  🆔 Кинопоиск: ' + movie.kinopoisk_id);
            logLines.push('📋 Балансеров: ' + balansers.length + ' (' + balansers.join(', ') + ')');
            logLines.push('═══════════════════════════════════════════════════════════');

            var results = [];
            var total = balansers.length;
            var completed = 0;

            if (total === 0) {
                callback(null, logLines);
                return;
            }

            balansers.forEach(function(sourceName) {
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

                var url = AB_HOST + '/lite/' + sourceName + '?' + query.join('&');

                // Логируем запрос
                console.log('📡 [' + sourceName + '] Запрос');

                var network = new Lampa.Reguest();
                network.timeout(10000);
                network["native"](url, function(str) {
                    completed++;
                    try {
                        var $html = $('<div>' + str + '</div>');
                        var videos = [];
                        var buttons = [];

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

                        $html.find('.videos__button').each(function() {
                            var $item = $(this);
                            try {
                                var data = JSON.parse($item.attr('data-json'));
                                var text = $item.text().trim();
                                data.text = text;
                                data.sourceName = sourceName;
                                buttons.push(data);
                            } catch (e) {}
                        });

                        if (videos.length > 0) {
                            var bestQuality = 0;
                            var hasDub = false;
                            var bestVoice = '';
                            var bestItem = null;

                            videos.forEach(function(item) {
                                var quality = getItemQuality(item);
                                var voice = item.voice_name || item.text || '';
                                if (quality > bestQuality) {
                                    bestQuality = quality;
                                    bestItem = item;
                                }
                                if (isDubVoice(voice)) {
                                    hasDub = true;
                                    if (!bestVoice) bestVoice = voice;
                                }
                            });

                            // Для фильмов сортируем озвучки
                            if (!movie.name && buttons.length > 0) {
                                buttons = sortVoicesByPriority(buttons);
                            }

                            results.push({
                                source: sourceName,
                                videos: videos.length,
                                quality: bestQuality,
                                hasDub: hasDub,
                                voice: bestVoice,
                                bestItem: bestItem,
                                buttons: buttons
                            });

                            logLines.push('  ✅ ' + sourceName + ': ' + videos.length + ' видео, ' + bestQuality + 'p' + (hasDub ? ', ДУБЛЯЖ' : ''));
                        } else {
                            logLines.push('  ⚠️ ' + sourceName + ': видео не найдены');
                        }
                    } catch (e) {
                        logLines.push('  ❌ ' + sourceName + ': ошибка парсинга');
                    }

                    if (completed === total) {
                        var best = null;
                        var bestScore = -1;

                        results.forEach(function(result) {
                            var score = 0;
                            if (result.hasDub) score += 1000;
                            if (result.quality >= 2160) score += 90;
                            else if (result.quality >= 1080) score += 50;
                            else if (result.quality >= 720) score += 20;
                            else if (result.quality >= 480) score += 5;

                            var source = result.source;
                            if (/phantom/.test(source)) score += 10;
                            else if (/fxapi/.test(source)) score += 8;
                            else if (/alloha/.test(source)) score += 6;
                            else if (/kinopub/.test(source)) score += 4;

                            if (score > bestScore) {
                                bestScore = score;
                                best = result;
                            }
                        });

                        if (best) {
                            logLines.push('═══════════════════════════════════════════════════════════');
                            logLines.push('🏆 ЛУЧШИЙ БАЛАНСЕР: ' + best.source);
                            logLines.push('  📹 Видео: ' + best.videos);
                            logLines.push('  📐 Качество: ' + best.quality + 'p');
                            logLines.push('  🎤 Дубляж: ' + (best.hasDub ? '✅ есть' : '❌ нет'));
                            logLines.push('  ⚖️ Вес: ' + bestScore);
                            logLines.push('═══════════════════════════════════════════════════════════');
                        } else {
                            logLines.push('❌ Подходящий балансер не найден');
                            logLines.push('═══════════════════════════════════════════════════════════');
                        }

                        callback(best, logLines);
                    }
                }, function(err) {
                    completed++;
                    logLines.push('  ❌ ' + sourceName + ': ошибка (' + (err.status || 'таймаут') + ')');
                    if (completed === total) {
                        if (results.length === 0) {
                            logLines.push('❌ Ни один балансер не ответил');
                            logLines.push('═══════════════════════════════════════════════════════════');
                        }
                        callback(null, logLines);
                    }
                }, false, { dataType: 'text' });
            });
        });
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ НА БАЛАНСЕР
    // ============================================================

    function switchToBalanserAndOpen(sourceName, movie) {
        if (!sourceName) return;

        Lampa.Storage.set('active_balanser', sourceName);
        Lampa.Storage.set('online_balanser', sourceName);

        if (movie && movie.id) {
            var lastSelect = Lampa.Storage.cache('online_last_balanser', 3000, {});
            lastSelect[movie.id] = sourceName;
            Lampa.Storage.set('online_last_balanser', lastSelect);
        }

        var id = Lampa.Utils.hash(movie.number_of_seasons ? movie.original_name : movie.original_title);
        var all = Lampa.Storage.get('clarification_search', {});

        Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_online'),
            component: 'lampac',
            search: all[id] ? all[id] : movie.title,
            search_one: movie.title,
            search_two: movie.original_title,
            movie: movie,
            page: 1,
            balanser: sourceName,
            clarification: all[id] ? true : false
        });

        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('🔊 ' + sourceName + ' (' + (movie.name ? 'сериал' : 'фильм') + ')');
        }
    }

    // ============================================================
    // ДОБАВЛЕНИЕ КНОПКИ
    // ============================================================

    function addBestButton() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-best-button').length > 0) return;

                var isSerial = !!(movie && movie.name);
                var label = isSerial ? '📺 Лучший сериал' : '🎬 Лучший фильм';

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-best-button" style="display:flex !important; opacity:1 !important; visibility:visible !important; background: rgba(76, 175, 80, 0.12) !important; border: 1px solid #4CAF50 !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4CAF50" style="width:24px;height:24px;">' +
                    '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' +
                    '</svg>' +
                    '<span style="color: #4CAF50;">' + label + '</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    findBestBalanser(movie, function(best, logLines) {
                        if (logLines) {
                            console.log(logLines.join('\n'));
                        }

                        if (best) {
                            switchToBalanserAndOpen(best.source, movie);
                        } else {
                            Lampa.Noty.show('❌ Подходящий балансер не найден');
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
    // ЗАПУСК
    // ============================================================

    function init() {
        console.log('🚀 Плагин "Лучший поток" загружен');
        addBestButton();
    }

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