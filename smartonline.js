(function () {
    'use strict';

    // ============================================================
    // ПЛАГИН-ЛОГГЕР: Анализ источников и качества
    // Версия: 1.0.0
    // ============================================================

    if (window.source_analyzer_loaded) {
        console.log('⚠️ Плагин-логгер уже запущен');
        return;
    }
    window.source_analyzer_loaded = true;

    // ============================================================
    // ПРИОРИТЕТЫ
    // ============================================================

    var SOURCE_PRIORITY = [
        { name: 'phantom', weight: 10, label: 'Phantom' },
        { name: 'filmix', weight: 8, label: 'Filmix' },
        { name: 'alloha', weight: 6, label: 'Alloha' },
        { name: 'kinopub', weight: 4, label: 'Kinopub' }
    ];

    var VOICE_PRIORITY = [
        { name: 'hdrezka', weight: 20, label: 'HDRezka' },
        { name: 'dub', weight: 15, label: 'Дубляж' },
        { name: 'cube', weight: 13, label: 'Кубик в Кубе' },
        { name: 'lostfilm', weight: 10, label: 'LostFilm' }
    ];

    // ============================================================
    // ОПРЕДЕЛЕНИЕ КАЧЕСТВА
    // ============================================================

    function detectQuality(value) {
        if (!value) return 0;
        var text = String(value).toLowerCase().replace(/\s+/g, ' ').trim();
        if (!text) return 0;

        if (/(2160|4k|uhd|ultra[\s-]?hd|3840|ultrahd|4[\s-]?k)/i.test(text)) return 2160;
        if (/(1080|full[\s-]?hd|fhd|1920|fullhd)/i.test(text)) return 1080;
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 720;
        if (/(480|sd|dvd|640|854)/i.test(text)) return 480;

        var match = text.match(/(\d{3,4})[pP]/);
        if (match) {
            var num = parseInt(match[1], 10);
            if (num >= 480) return num;
        }

        return 0;
    }

    function getItemQuality(item) {
        var quality = 0;
        var source = [];

        var textFields = ['text', 'title', 'name', 'label', 'voice_name'];
        textFields.forEach(function(field) {
            if (item[field]) {
                var q = detectQuality(item[field]);
                if (q > quality) {
                    quality = q;
                    source.push(field + ': "' + String(item[field]).substring(0, 30) + '" → ' + q + 'p');
                }
            }
        });

        var urlFields = ['url', 'stream'];
        urlFields.forEach(function(field) {
            if (item[field]) {
                var q = detectQuality(item[field]);
                if (q > quality) {
                    quality = q;
                    source.push(field + ': "' + String(item[field]).substring(0, 30) + '" → ' + q + 'p');
                }
            }
        });

        var qualityObj = item.quality || item.qualitys;
        if (qualityObj && typeof qualityObj === 'object') {
            for (var key in qualityObj) {
                var q1 = detectQuality(key);
                if (q1 > quality) {
                    quality = q1;
                    source.push('quality key: "' + key + '" → ' + q1 + 'p');
                }
                var q2 = detectQuality(qualityObj[key]);
                if (q2 > quality) {
                    quality = q2;
                    source.push('quality value: "' + qualityObj[key] + '" → ' + q2 + 'p');
                }
            }
        }

        return { quality: quality, source: source };
    }

    function getVoiceWeight(name) {
        var text = (name || '').toLowerCase();
        for (var i = 0; i < VOICE_PRIORITY.length; i++) {
            if (text.indexOf(VOICE_PRIORITY[i].name) !== -1) {
                return VOICE_PRIORITY[i].weight;
            }
        }
        return 0;
    }

    function getSourceWeight(source) {
        var text = (source || '').toLowerCase();
        for (var i = 0; i < SOURCE_PRIORITY.length; i++) {
            if (text.indexOf(SOURCE_PRIORITY[i].name) !== -1) {
                return SOURCE_PRIORITY[i].weight;
            }
        }
        return 0;
    }

    // ============================================================
    // СБОР ДАННЫХ
    // ============================================================

    function getBalansersList(callback) {
        var network = new Lampa.Reguest();
        network.timeout(10000);
        network.silent('https://ab2024.ru/lite/withsearch', function(json) {
            if (json && Array.isArray(json)) {
                callback(json);
            } else {
                callback(['phantom', 'filmix', 'alloha', 'kinopub']);
            }
        }, function() {
            callback(['phantom', 'filmix', 'alloha', 'kinopub']);
        }, false, { dataType: 'json' });
    }

    function collectAllSources(movie, balansers, callback) {
        var allItems = [];
        var total = balansers.length;
        var completed = 0;

        if (!movie) {
            callback([]);
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
                                allItems.push(data);
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
                        } catch (e) {}
                    });
                } catch (e) {}

                if (completed === total) {
                    callback(allItems);
                }
            }, function() {
                completed++;
                if (completed === total) {
                    callback(allItems);
                }
            }, false, { dataType: 'text' });
        });
    }

    // ============================================================
    // АНАЛИЗ И ВЫВОД В КОНСОЛЬ
    // ============================================================

    function analyzeAndLog(movie) {
        console.log('');
        console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7; font-weight: bold; font-size: 14px;');
        console.log('%c🔍 АНАЛИЗ ИСТОЧНИКОВ И КАЧЕСТВА', 'color: #4fc3f7; font-weight: bold; font-size: 16px;');
        console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7; font-weight: bold; font-size: 14px;');
        console.log('');

        getBalansersList(function(balansers) {
            console.log('%c📋 СПИСОК ИСТОЧНИКОВ (' + balansers.length + '):', 'color: #4fc3f7; font-weight: bold;');
            balansers.forEach(function(s, i) {
                console.log('  ' + (i + 1) + '. ' + s);
            });
            console.log('');

            collectAllSources(movie, balansers, function(allItems) {
                if (allItems.length === 0) {
                    console.log('%c❌ Нет данных для анализа', 'color: #ff5252; font-weight: bold;');
                    return;
                }

                console.log('%c📊 ВСЕГО ЭЛЕМЕНТОВ: ' + allItems.length, 'color: #4fc3f7; font-weight: bold;');
                console.log('');

                // === ГРУППИРУЕМ ПО ИСТОЧНИКАМ ===
                var grouped = {};
                allItems.forEach(function(item) {
                    var source = item.sourceName || 'unknown';
                    if (!grouped[source]) {
                        grouped[source] = { items: [], maxQuality: 0, bestItem: null, totalScore: 0 };
                    }
                    grouped[source].items.push(item);

                    var qualityResult = getItemQuality(item);
                    if (qualityResult.quality > grouped[source].maxQuality) {
                        grouped[source].maxQuality = qualityResult.quality;
                        grouped[source].bestItem = item;
                        grouped[source].bestQualitySource = qualityResult.source;
                    }

                    var voiceW = getVoiceWeight(item.voice_name || item.text || '');
                    var sourceW = getSourceWeight(source);
                    grouped[source].totalScore += qualityResult.quality + voiceW + sourceW;
                });

                // === ВЫВОД ПО КАЖДОМУ ИСТОЧНИКУ ===
                console.log('%c📊 АНАЛИЗ ПО ИСТОЧНИКАМ:', 'color: #ff9800; font-weight: bold; font-size: 14px;');
                console.log('');

                var sortedSources = Object.keys(grouped).sort(function(a, b) {
                    return grouped[b].maxQuality - grouped[a].maxQuality;
                });

                sortedSources.forEach(function(source, index) {
                    var data = grouped[source];
                    var sourceW = getSourceWeight(source);
                    var voiceW = data.bestItem ? getVoiceWeight(data.bestItem.voice_name || data.bestItem.text || '') : 0;
                    var totalW = data.maxQuality + sourceW + voiceW;

                    var qualityLabel = data.maxQuality > 0 ? data.maxQuality + 'p' : '❌ не найдено';

                    console.log('%c  ' + (index + 1) + '. ' + source.toUpperCase(), 'color: #4fc3f7; font-weight: bold;');
                    console.log('     📦 Элементов: ' + data.items.length);
                    console.log('     📐 Макс. качество: ' + qualityLabel);
                    console.log('     ⚖️ Вес источника: ' + sourceW + ' (' + (SOURCE_PRIORITY.find(function(p) { return source.toLowerCase().indexOf(p.name) !== -1; }) ? 'приоритетный' : 'обычный') + ')');

                    if (data.bestItem) {
                        var bestVoice = data.bestItem.voice_name || data.bestItem.text || 'неизвестно';
                        var bestVoiceW = getVoiceWeight(bestVoice);
                        console.log('     🎤 Лучшая озвучка: "' + bestVoice + '" (вес ' + bestVoiceW + ')');
                        console.log('     📝 Текст: "' + (data.bestItem.text || '') + '"');

                        if (data.bestQualitySource && data.bestQualitySource.length > 0) {
                            console.log('     🔍 Качество найдено в:');
                            data.bestQualitySource.forEach(function(s) {
                                console.log('        - ' + s);
                            });
                        }
                    }

                    console.log('     🏆 ИТОГОВЫЙ ВЕС: ' + totalW + ' (качество ' + data.maxQuality + ' + источник ' + sourceW + ' + озвучка ' + voiceW + ')');
                    console.log('');
                });

                // === ВЫБОР ЛУЧШЕГО ===
                console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7;');
                console.log('%c🏆 ВЫБОР ЛУЧШЕГО ИСТОЧНИКА', 'color: #76ff03; font-weight: bold; font-size: 14px;');
                console.log('');

                var bestSource = null;
                var bestTotalWeight = -1;
                var bestQuality = 0;

                sortedSources.forEach(function(source) {
                    var data = grouped[source];
                    var sourceW = getSourceWeight(source);
                    var voiceW = data.bestItem ? getVoiceWeight(data.bestItem.voice_name || data.bestItem.text || '') : 0;
                    var totalW = data.maxQuality + sourceW + voiceW;

                    if (data.maxQuality > 0 && totalW > bestTotalWeight) {
                        bestTotalWeight = totalW;
                        bestSource = source;
                        bestQuality = data.maxQuality;
                    }
                });

                if (bestSource) {
                    console.log('  ✅ ЛУЧШИЙ ИСТОЧНИК: ' + bestSource.toUpperCase());
                    console.log('  📐 Качество: ' + bestQuality + 'p');
                    console.log('  ⚖️ Общий вес: ' + bestTotalWeight);
                    console.log('');

                    var bestData = grouped[bestSource];
                    if (bestData.bestItem) {
                        console.log('  📝 Пример лучшего элемента:');
                        console.log('     Текст: "' + (bestData.bestItem.text || '') + '"');
                        console.log('     Озвучка: "' + (bestData.bestItem.voice_name || 'неизвестно') + '"');
                        console.log('     Источник: ' + bestSource);
                    }
                } else {
                    console.log('  ❌ Лучший источник не найден');
                }

                console.log('');
                console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7;');
                console.log('%c✅ АНАЛИЗ ЗАВЕРШЕН', 'color: #76ff03; font-weight: bold;');
                console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7;');
            });
        });
    }

    // ============================================================
    // КНОПКА В КАРТОЧКЕ
    // ============================================================

    function addAnalyzerButton() {
        console.log('🔘 Добавляем кнопку "Анализ источников"...');

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.source-analyzer-button').length > 0) return;

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online source-analyzer-button" style="display:flex !important; opacity:1 !important; visibility:visible !important; background: rgba(79, 195, 247, 0.2) !important; border: 1px solid #4fc3f7 !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' +
                    '</svg>' +
                    '<span style="color: #4fc3f7;">Анализ источников</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    console.log('🔘 Кнопка "Анализ источников" нажата для:', movie.title || movie.name);
                    analyzeAndLog(movie);
                    if (Lampa.Noty && Lampa.Noty.show) {
                        Lampa.Noty.show('📊 Анализ запущен, смотри консоль');
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
        console.log('%c✅ Плагин-логгер инициализирован', 'color: #76ff03; font-weight: bold;');
        console.log('📌 Нажмите кнопку "Анализ источников" в карточке фильма');
        addAnalyzerButton();
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
