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

    function normalize(value) {
        return (value || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
    }

    // ============================================================
    // ПОЛУЧЕНИЕ СПИСКА БАЛАНСЕРОВ ИЗ LAMPA
    // ============================================================

    function getBalansersFromLampa() {
        var sources = [];
        var activeBalanser = Lampa.Storage.get('active_balanser', '');
        var onlineBalanser = Lampa.Storage.get('online_balanser', '');

        if (activeBalanser) sources.push(activeBalanser);
        if (onlineBalanser && onlineBalanser !== activeBalanser) sources.push(onlineBalanser);

        // Если источников нет - добавляем приоритетные
        if (sources.length === 0) {
            sources = ['phantom', 'fxapi', 'alloha', 'kinopub'];
        }

        // Убираем дубликаты
        var unique = [];
        sources.forEach(function(s) {
            var lower = s.toLowerCase();
            if (!unique.some(function(u) { return u.toLowerCase() === lower; })) {
                unique.push(s);
            }
        });

        return unique;
    }

    // ============================================================
    // ОСНОВНАЯ ФУНКЦИЯ: ПОИСК ЛУЧШЕГО ПОТОКА (ЧЕРЕЗ LAMPA)
    // ============================================================

    function findBestStream(movie, callback) {
        var balansers = getBalansersFromLampa();
        var logLines = [];
        var allVideos = [];
        var total = balansers.length;
        var completed = 0;

        logLines.push('═══════════════════════════════════════════════════════════');
        logLines.push('🔍 АНАЛИЗ ПОТОКОВ ДЛЯ: ' + (movie.title || movie.name));
        logLines.push('📋 Балансеров: ' + balansers.length + ' (' + balansers.join(', ') + ')');
        logLines.push('═══════════════════════════════════════════════════════════');

        if (total === 0) {
            callback(null, logLines);
            return;
        }

        balansers.forEach(function(sourceName) {
            // Используем встроенный запрос Lampac
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
                    $html.find('.videos__item').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            if (data.method === 'play' || data.method === 'call') {
                                data.text = text;
                                data.sourceName = sourceName;
                                allVideos.push(data);
                            }
                        } catch (e) {}
                    });
                } catch (e) {}

                if (completed === total) {
                    processResults(allVideos, logLines, callback);
                }
            }, function() {
                completed++;
                if (completed === total) {
                    processResults(allVideos, logLines, callback);
                }
            }, false, { dataType: 'text' });
        });
    }

    function processResults(allVideos, logLines, callback) {
        if (allVideos.length === 0) {
            logLines.push('❌ Видео не найдены');
            logLines.push('═══════════════════════════════════════════════════════════');
            callback(null, logLines);
            return;
        }

        var bestItem = null;
        var bestScore = -1;

        allVideos.forEach(function(item) {
            var quality = getItemQuality(item);
            var voice = item.voice_name || item.text || '';
            var isDub = isTargetVoice(voice);
            var score = 0;

            // Качество
            if (quality >= 2160) score += 90;
            else if (quality >= 1080) score += 50;
            else if (quality >= 720) score += 20;
            else if (quality >= 480) score += 5;

            // Дубляж - главный приоритет
            if (isDub) score += 1000;

            // Источник
            var source = item.sourceName || '';
            if (/phantom/.test(source)) score += 10;
            else if (/fxapi|filmix/.test(source)) score += 8;
            else if (/alloha/.test(source)) score += 6;
            else if (/kinopub/.test(source)) score += 4;

            // Формат
            var urlHint = normalize(item.url || item.stream || '');
            if (/m3u8/.test(urlHint)) score += 4;
            if (/mp4/.test(urlHint)) score += 2;
            if (/iframe|embed/.test(urlHint)) score -= 4;

            var voiceLabel = voice.substring(0, 25) + (voice.length > 25 ? '...' : '');
            var qualityLabel = quality > 0 ? quality + 'p' : '---';
            var sourceLabel = source.padEnd(12);

            logLines.push(
                '  📊 ' + sourceLabel +
                ' | ' + voiceLabel.padEnd(18) +
                ' | ' + qualityLabel.padEnd(6) +
                ' | вес: ' + String(score).padStart(4) +
                (isDub ? ' ✅ ДУБЛЯЖ' : '')
            );

            if (score > bestScore) {
                bestScore = score;
                bestItem = item;
            }
        });

        if (bestItem) {
            var bestQuality = getItemQuality(bestItem);
            var bestVoice = bestItem.voice_name || bestItem.text || '';
            logLines.push('═══════════════════════════════════════════════════════════');
            logLines.push('🏆 ЛУЧШИЙ ПОТОК:');
            logLines.push('  📦 Источник: ' + bestItem.sourceName);
            logLines.push('  🎤 Озвучка: ' + bestVoice);
            logLines.push('  📐 Качество: ' + (bestQuality > 0 ? bestQuality + 'p' : 'неизвестно'));
            logLines.push('  ⚖️ Вес: ' + bestScore);
            logLines.push('═══════════════════════════════════════════════════════════');
        } else {
            logLines.push('❌ Подходящий поток не найден');
            logLines.push('═══════════════════════════════════════════════════════════');
        }

        callback(bestItem, logLines);
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ НА ИСТОЧНИК С ОТКРЫТИЕМ
    // ============================================================

    function switchToSourceAndOpen(sourceName, movie) {
        if (!sourceName) return;

        Lampa.Storage.set('active_balanser', sourceName);
        Lampa.Storage.set('online_balanser', sourceName);

        if (movie && movie.id) {
            var lastSelect = Lampa.Storage.cache('online_last_balanser', 3000, {});
            lastSelect[movie.id] = sourceName;
            Lampa.Storage.set('online_last_balanser', lastSelect);
        }

        // ОТКРЫВАЕМ ОНЛАЙН С НОВЫМ БАЛАНСЕРОМ
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

                var label = '🎬 Лучший поток';

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>' + label + '</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    findBestStream(movie, function(bestItem, logLines) {
                        if (logLines) {
                            console.log(logLines.join('\n'));
                        }

                        if (!bestItem) {
                            Lampa.Noty.show('❌ Подходящий поток не найден');
                            return;
                        }

                        var source = bestItem.sourceName || 'unknown';
                        switchToSourceAndOpen(source, movie);
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