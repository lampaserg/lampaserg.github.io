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
    // ОСНОВНАЯ ФУНКЦИЯ: ПОИСК ЛУЧШЕГО ПОТОКА
    // ============================================================

    function findBestStream(movie, callback) {
        // Получаем список доступных балансеров
        var balansers = [];
        var activeBalanser = Lampa.Storage.get('active_balanser', '');
        var onlineBalanser = Lampa.Storage.get('online_balanser', '');

        if (activeBalanser) balansers.push(activeBalanser);
        if (onlineBalanser && onlineBalanser !== activeBalanser) balansers.push(onlineBalanser);

        var priority = ['phantom', 'filmix', 'alloha', 'kinopub'];
        priority.forEach(function(name) {
            if (!balansers.some(function(s) { return s.toLowerCase() === name; })) {
                balansers.push(name);
            }
        });

        var allVideos = [];
        var total = balansers.length;
        var completed = 0;

        if (total === 0) {
            callback(null);
            return;
        }

        // === СОБИРАЕМ ЛОГ В ОДИН БЛОК ===
        var logLines = [];
        logLines.push('═══════════════════════════════════════════════════════════');
        logLines.push('🔍 АНАЛИЗ ПОТОКОВ ДЛЯ: ' + (movie.title || movie.name));
        logLines.push('📋 Балансеры: ' + balansers.join(', '));
        logLines.push('═══════════════════════════════════════════════════════════');

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
            network.timeout(8000);
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
                    // === АНАЛИЗ ВСЕХ ВИДЕО ===
                    var bestItem = null;
                    var bestScore = -1;

                    allVideos.forEach(function(item) {
                        var quality = getItemQuality(item);
                        var voice = item.voice_name || item.text || '';
                        var isDub = isTargetVoice(voice);
                        var score = 0;

                        if (quality >= 2160) score += 90;
                        else if (quality >= 1080) score += 50;
                        else if (quality >= 720) score += 20;
                        else if (quality >= 480) score += 5;

                        if (isDub) score += 1000;

                        var source = item.sourceName || '';
                        if (/phantom/.test(source)) score += 10;
                        else if (/filmix/.test(source)) score += 8;
                        else if (/alloha/.test(source)) score += 6;
                        else if (/kinopub/.test(source)) score += 4;

                        var urlHint = normalize(item.url || item.stream || '');
                        if (/m3u8/.test(urlHint)) score += 4;
                        if (/mp4/.test(urlHint)) score += 2;
                        if (/iframe|embed/.test(urlHint)) score -= 4;

                        // Добавляем строку в лог
                        var voiceLabel = voice.substring(0, 30) + (voice.length > 30 ? '...' : '');
                        logLines.push(
                            '  📊 ' + source.padEnd(10) + 
                            ' | ' + voiceLabel.padEnd(20) + 
                            ' | ' + (quality > 0 ? quality + 'p' : '---').padEnd(6) + 
                            ' | вес: ' + String(score).padStart(4) + 
                            (isDub ? ' ✅ ДУБЛЯЖ' : '')
                        );

                        if (score > bestScore) {
                            bestScore = score;
                            bestItem = item;
                        }
                    });

                    // === ВЫВОД ЛУЧШЕГО ===
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
                    }

                    // === ВЫВОД ОДНОГО ЛОГА ===
                    console.log(logLines.join('\n'));

                    callback(bestItem);
                }
            }, function() {
                completed++;
                if (completed === total) {
                    // Если ошибка - выводим то что есть
                    console.log(logLines.join('\n'));
                    callback(null);
                }
            }, false, { dataType: 'text' });
        });
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ НА ИСТОЧНИК
    // ============================================================

    function switchToSource(sourceName, movie) {
        if (!sourceName) return;

        Lampa.Storage.set('active_balanser', sourceName);
        Lampa.Storage.set('online_balanser', sourceName);

        if (movie && movie.id) {
            var lastSelect = Lampa.Storage.cache('online_last_balanser', 3000, {});
            lastSelect[movie.id] = sourceName;
            Lampa.Storage.set('online_last_balanser', lastSelect);
        }

        var active = Lampa.Activity.active();
        if (active) {
            Lampa.Activity.replace({
                url: active.url || '',
                title: active.title || '',
                component: active.component || 'lampac',
                search: active.search || (movie ? movie.title : ''),
                search_one: active.search_one || (movie ? movie.title : ''),
                search_two: active.search_two || (movie ? movie.original_title : ''),
                movie: movie,
                page: active.page || 1,
                balanser: sourceName,
                clarification: active.clarification || false
            });
        }

        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('🔊 ' + sourceName);
        }
    }

    // ============================================================
    // ПОКАЗ СПИСКА БАЛАНСЕРОВ
    // ============================================================

    function showBalansersMenu(movie) {
        var balansers = [];
        var activeBalanser = Lampa.Storage.get('active_balanser', '');
        var onlineBalanser = Lampa.Storage.get('online_balanser', '');

        if (activeBalanser) balansers.push(activeBalanser);
        if (onlineBalanser && onlineBalanser !== activeBalanser) balansers.push(onlineBalanser);

        var priority = ['phantom', 'filmix', 'alloha', 'kinopub'];
        priority.forEach(function(name) {
            if (!balansers.some(function(s) { return s.toLowerCase() === name; })) {
                balansers.push(name);
            }
        });

        if (balansers.length === 0) {
            Lampa.Noty.show('❌ Нет доступных балансеров');
            return;
        }

        var items = balansers.map(function(b) {
            return {
                title: b.charAt(0).toUpperCase() + b.slice(1),
                value: b
            };
        });

        Lampa.Select.show({
            title: 'Выберите балансер',
            items: items,
            onSelect: function(item) {
                switchToSource(item.value, movie);
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
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

                var isSerial = !!(movie && movie.name);
                var label = isSerial ? '📺 Выбрать балансер' : '🎬 Дубляж + 4K';

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>' + label + '</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    if (isSerial) {
                        // Сериал - показываем список балансеров
                        showBalansersMenu(movie);
                    } else {
                        // Фильм - ищем дубляж + лучшее качество
                        findBestStream(movie, function(bestItem) {
                            if (!bestItem) {
                                Lampa.Noty.show('❌ Дубляж не найден');
                                return;
                            }

                            var source = bestItem.sourceName || 'unknown';
                            var quality = getItemQuality(bestItem);
                            var voice = bestItem.voice_name || bestItem.text || '';

                            switchToSource(source, movie);
                        });
                    }
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