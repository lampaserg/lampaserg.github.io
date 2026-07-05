(function () {
    'use strict';

    if (window.smartonline_plugin_v2) return;
    window.smartonline_plugin_v2 = true;

    // ============================================================
    // ПРИОРИТЕТЫ
    // ============================================================

    var TARGET_VOICE = 'dub';

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

    function isTargetVoice(name) {
        var text = String(name || '').toLowerCase();
        return text.indexOf('dub') !== -1 || text.indexOf('дубляж') !== -1;
    }

    // ============================================================
    // ПОЛУЧЕНИЕ СПИСКА БАЛАНСЕРОВ
    // ============================================================

    function getBalansers(callback) {
        var network = new Lampa.Reguest();
        network.timeout(10000);
        network.silent('https://ab2024.ru/lite/withsearch', function(json) {
            if (json && Array.isArray(json) && json.length > 0) {
                callback(json);
            } else {
                callback(['phantom', 'fxapi', 'alloha', 'kinopub']);
            }
        }, function() {
            callback(['phantom', 'fxapi', 'alloha', 'kinopub']);
        }, false, { dataType: 'json' });
    }

    // ============================================================
    // ОСНОВНАЯ ЛОГИКА: ПОИСК ЛУЧШЕГО БАЛАНСЕРА
    // ============================================================

    function findBestBalanser(movie, callback) {
        getBalansers(function(balansers) {
            var logLines = [];
            logLines.push('═══════════════════════════════════════════════════════════');
            logLines.push('🔍 ПОИСК ЛУЧШЕГО БАЛАНСЕРА ДЛЯ: ' + (movie.title || movie.name));
            logLines.push('📋 Балансеров: ' + balansers.length);
            logLines.push('═══════════════════════════════════════════════════════════');

            var allResults = [];
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

                var url = 'https://ab2024.ru/lite/' + sourceName + '?' + query.join('&');

                var network = new Lampa.Reguest();
                network.timeout(10000);
                network["native"](url, function(str) {
                    completed++;
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
                                    data.sourceName = sourceName;
                                    videos.push(data);
                                }
                            } catch (e) {}
                        });

                        if (videos.length > 0) {
                            // Анализируем качество в этом балансере
                            var bestQuality = 0;
                            var bestVoice = '';
                            var hasDub = false;

                            videos.forEach(function(item) {
                                var quality = getItemQuality(item);
                                var voice = item.voice_name || item.text || '';
                                if (quality > bestQuality) bestQuality = quality;
                                if (isTargetVoice(voice)) hasDub = true;
                                if (isTargetVoice(voice) && quality > 0) {
                                    bestVoice = voice;
                                }
                            });

                            allResults.push({
                                source: sourceName,
                                videos: videos.length,
                                quality: bestQuality,
                                hasDub: hasDub,
                                voice: bestVoice
                            });

                            logLines.push('  ✅ ' + sourceName + ': ' + videos.length + ' видео, ' + bestQuality + 'p' + (hasDub ? ', ДУБЛЯЖ' : ''));
                        } else {
                            logLines.push('  ⚠️ ' + sourceName + ': видео не найдены');
                        }
                    } catch (e) {
                        logLines.push('  ❌ ' + sourceName + ': ошибка парсинга');
                    }

                    if (completed === total) {
                        // Выбираем лучший балансер
                        var best = null;
                        var bestScore = -1;

                        allResults.forEach(function(result) {
                            var score = 0;
                            if (result.hasDub) score += 1000;
                            if (result.quality >= 2160) score += 90;
                            else if (result.quality >= 1080) score += 50;
                            else if (result.quality >= 720) score += 20;

                            // Приоритет источников
                            var source = result.source;
                            if (/phantom/.test(source)) score += 10;
                            else if (/fxapi|filmix/.test(source)) score += 8;
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
                }, function() {
                    completed++;
                    logLines.push('  ❌ ' + sourceName + ': ошибка запроса');
                    if (completed === total) {
                        if (allResults.length === 0) {
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

    function switchToBalanser(sourceName, movie) {
        if (!sourceName) return;

        Lampa.Storage.set('active_balanser', sourceName);
        Lampa.Storage.set('online_balanser', sourceName);

        if (movie && movie.id) {
            var lastSelect = Lampa.Storage.cache('online_last_balanser', 3000, {});
            lastSelect[movie.id] = sourceName;
            Lampa.Storage.set('online_last_balanser', lastSelect);
        }

        // Открываем онлайн с новым балансером
        Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_online'),
            component: 'lampac',
            search: movie.title,
            search_one: movie.title,
            search_two: movie.original_title,
            movie: movie,
            page: 1,
            balanser: sourceName
        });

        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('🔊 ' + sourceName);
        }
    }

    // ============================================================
    // КНОПКА В КАРТОЧКЕ
    // ============================================================

    function addSmartButton() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-smart-button').length > 0) return;

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>🔍 Лучший балансер</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    findBestBalanser(movie, function(best, logLines) {
                        if (logLines) {
                            console.log(logLines.join('\n'));
                        }

                        if (best) {
                            switchToBalanser(best.source, movie);
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
        console.log('🚀 SmartOnline загружен');
        addSmartButton();
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