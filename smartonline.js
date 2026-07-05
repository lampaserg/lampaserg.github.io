/**
 * Online Source Manager - Агрессивная версия
 * Версия: 4.0.0
 * Максимальное вмешательство для сортировки
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    var DEBUG = true;

    function log() {
        if (!DEBUG) return;
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[OSM]');
        console.log.apply(console, args);
    }

    function logError() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[OSM ERROR]');
        console.error.apply(console, args);
    }

    log('========================================');
    log('Online Source Manager v4.0.0 (Агрессивный)');
    log('========================================');

    // ============================================================
    // 1. Приоритет озвучек
    // ============================================================
    function voiceWeight(name) {
        if (!name) return 0;
        var text = name.toLowerCase();
        var score = 0;

        if (/hdrezka|hd\.rezka|rezka/.test(text)) score += 20;
        if (/дубляж|дублированный|дубликация|dub\b/.test(text)) score += 15;
        if (/кубик|cube|куб|kubik/.test(text)) score += 13;
        if (/lostfilm|lost\.film/.test(text)) score += 10;
        if (/субтитры|sub\b|subtitles|original|оригинал|orig/.test(text)) score -= 10;
        if (/english|eng|en\b/.test(text) && !/russian|rus/.test(text)) score -= 100;

        return score;
    }

    function sortVoices(buttons) {
        if (!buttons || !buttons.length) return buttons;

        return buttons.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            var aActive = a.active || a.selected ? 1 : 0;
            var bActive = b.active || b.selected ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;

            var weightA = voiceWeight(nameA);
            var weightB = voiceWeight(nameB);
            if (weightA !== weightB) return weightB - weightA;

            return nameA.localeCompare(nameB);
        });
    }

    // ============================================================
    // 2. Качество
    // ============================================================
    function extractQuality(name) {
        if (!name) return 0;
        var upper = name.toUpperCase();
        if (upper.indexOf('4K') !== -1 || upper.indexOf('UHD') !== -1 || upper.indexOf('2160') !== -1) return 2160;
        if (upper.indexOf('FULLHD') !== -1 || upper.indexOf('FHD') !== -1 || upper.indexOf('1080') !== -1) return 1080;
        if (upper.indexOf('HD') !== -1 && upper.indexOf('FULL') === -1 || upper.indexOf('720') !== -1) return 720;
        if (upper.indexOf('SD') !== -1 || upper.indexOf('480') !== -1) return 480;
        var match = name.match(/(\d{3,4})\s*[pP]?/);
        if (match) return parseInt(match[1], 10);
        return 0;
    }

    function getItemQuality(item) {
        var text = item.text || item.title || item.name || '';
        var quality = extractQuality(text);
        if (item.quality) {
            var q = extractQuality(item.quality);
            if (q > quality) quality = q;
        }
        return quality;
    }

    function isDub(name) {
        return /дубляж|дублированный|дубликация|dub/i.test(name);
    }

    function sortVideos(videos) {
        if (!videos || !videos.length) return videos;

        return videos.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            var weightA = voiceWeight(nameA);
            var weightB = voiceWeight(nameB);
            if (weightA !== weightB) return weightB - weightA;

            var qualityA = getItemQuality(a);
            var qualityB = getItemQuality(b);
            if (qualityA !== qualityB) return qualityB - qualityA;

            return 0;
        });
    }

    // ============================================================
    // 3. ГЛАВНАЯ ФУНКЦИЯ - АГРЕССИВНЫЙ ПАТЧ
    // ============================================================
    function aggressivePatch() {
        log('АГРЕССИВНЫЙ ПАТЧ: начало');

        // ============================================================
        // 3.1 Патчим все компоненты через Lampa.Component.get
        // ============================================================
        var componentNames = ['lampac', 'lampacskaz', 'online', 'lampac_online', 'bwa', 'lampac_smart'];

        for (var n = 0; n < componentNames.length; n++) {
            var name = componentNames[n];
            try {
                var comp = Lampa.Component.get(name);
                if (!comp || !comp.prototype) continue;

                var proto = comp.prototype;
                log('Патчим компонент: ' + name);

                // ===== ПАТЧИМ DISPLAY (главный метод отображения) =====
                if (typeof proto.display === 'function' && !proto._osm_display_patched) {
                    proto._osm_display_patched = true;
                    var origDisplay = proto.display;

                    proto.display = function(videos) {
                        log('display: ' + name + ' (' + (videos ? videos.length : 0) + ' видео)');

                        if (videos && videos.length > 1) {
                            // Проверяем, есть ли в видео информация о переводах
                            var hasVoices = videos.some(function(v) {
                                return v.text || v.voice_name || v.title;
                            });

                            if (hasVoices) {
                                var sorted = sortVideos(videos);
                                log('display: отсортировано ' + sorted.length + ' видео');
                                return origDisplay.call(this, sorted);
                            }
                        }

                        return origDisplay.call(this, videos);
                    };
                    log('  ✅ display пропатчен');
                }

                // ===== ПАТЧИМ PARSE =====
                if (typeof proto.parse === 'function' && !proto._osm_parse_patched) {
                    proto._osm_parse_patched = true;
                    var origParse = proto.parse;

                    proto.parse = function(str) {
                        var result = origParse.call(this, str);

                        try {
                            // Ищем кнопки озвучек
                            var $html = $('<div>' + str + '</div>');
                            var buttons = $html.find('.videos__button');

                            if (buttons.length > 1) {
                                var voiceButtons = [];
                                buttons.each(function() {
                                    var $item = $(this);
                                    try {
                                        var data = JSON.parse($item.attr('data-json'));
                                        data.text = $item.text().trim();
                                        data.active = $item.hasClass('active');
                                        voiceButtons.push(data);
                                    } catch(e) {}
                                });

                                if (voiceButtons.length > 1) {
                                    var sorted = sortVoices(voiceButtons);
                                    log('parse: отсортировано ' + sorted.length + ' озвучек в ' + name);
                                }
                            }
                        } catch(e) {}

                        return result;
                    };
                    log('  ✅ parse пропатчен');
                }

                // ===== ПАТЧИМ START_SOURCE =====
                if (typeof proto.startSource === 'function' && !comp._osm_source_patched) {
                    comp._osm_source_patched = true;
                    var origStart = proto.startSource;

                    proto.startSource = function(json) {
                        log('startSource: ' + name + ' (' + (json ? json.length : 0) + ' источников)');
                        return origStart.call(this, json);
                    };
                    log('  ✅ startSource пропатчен');
                }

            } catch(e) {
                logError('Ошибка патча ' + name + ':', e);
            }
        }

        // ============================================================
        // 3.2 Патчим Lampa.Filter (для сортировки озвучек в фильтре)
        // ============================================================
        if (Lampa.Filter && Lampa.Filter.prototype) {
            var filterProto = Lampa.Filter.prototype;

            // Патчим set
            if (typeof filterProto.set === 'function' && !filterProto._osm_filter_set) {
                filterProto._osm_filter_set = true;
                var origSet = filterProto.set;

                filterProto.set = function(type, items) {
                    if (type === 'filter' && items && items.length) {
                        for (var i = 0; i < items.length; i++) {
                            var item = items[i];
                            if (item && item.stype === 'voice' && item.items && item.items.length > 1) {
                                var sorted = item.items.slice().sort(function(x, y) {
                                    var nameX = x.title || '';
                                    var nameY = y.title || '';
                                    var weightX = voiceWeight(nameX);
                                    var weightY = voiceWeight(nameY);
                                    if (weightX !== weightY) return weightY - weightX;
                                    return nameX.localeCompare(nameY);
                                });
                                item.items = sorted;
                                if (sorted.length > 0) {
                                    item.subtitle = sorted[0].title || '';
                                }
                                log('Filter.set: отсортировано ' + sorted.length + ' озвучек');
                            }
                        }
                    }
                    return origSet.call(this, type, items);
                };
                log('  ✅ Filter.set пропатчен');
            }

            // Патчим onSelect
            if (typeof filterProto.onSelect === 'function' && !filterProto._osm_filter_select) {
                filterProto._osm_filter_select = true;
                var origSelect = filterProto.onSelect;

                filterProto.onSelect = function(type, a, b) {
                    if (type === 'filter' && a && a.stype === 'voice' && a.items && a.items.length > 1) {
                        var sorted = a.items.slice().sort(function(x, y) {
                            var nameX = x.title || '';
                            var nameY = y.title || '';
                            var weightX = voiceWeight(nameX);
                            var weightY = voiceWeight(nameY);
                            if (weightX !== weightY) return weightY - weightX;
                            return nameX.localeCompare(nameY);
                        });
                        a.items = sorted;
                        if (sorted.length > 0) {
                            a.subtitle = sorted[0].title || '';
                        }
                        log('Filter.onSelect: отсортировано ' + sorted.length + ' озвучек');
                    }
                    return origSelect.call(this, type, a, b);
                };
                log('  ✅ Filter.onSelect пропатчен');
            }
        }

        // ============================================================
        // 3.3 Перехватываем добавление новых компонентов
        // ============================================================
        if (typeof Lampa.Component.add === 'function' && !Lampa.Component._osm_add_patched) {
            Lampa.Component._osm_add_patched = true;
            var origAdd = Lampa.Component.add;

            Lampa.Component.add = function(name, comp) {
                log('Component.add: ' + name);
                origAdd.call(this, name, comp);

                // Патчим добавленный компонент через 100мс
                setTimeout(function() {
                    aggressivePatch();
                }, 100);
            };
            log('  ✅ Component.add перехвачен');
        }

        // ============================================================
        // 3.4 Прямое вмешательство в DOM (на случай, если патчи не работают)
        // ============================================================
        function directDomIntervention() {
            try {
                // Ищем все элементы с озвучками в фильтре
                var voiceItems = $('.selectbox-item');
                if (voiceItems.length > 1) {
                    var items = [];
                    voiceItems.each(function() {
                        var $item = $(this);
                        var title = $item.text().trim();
                        var isActive = $item.hasClass('focus');
                        items.push({ $el: $item, title: title, active: isActive });
                    });

                    // Сортируем
                    items.sort(function(a, b) {
                        var weightA = voiceWeight(a.title);
                        var weightB = voiceWeight(b.title);
                        if (weightA !== weightB) return weightB - weightA;
                        return a.title.localeCompare(b.title);
                    });

                    // Переставляем в DOM
                    var parent = voiceItems.first().parent();
                    if (parent && parent.length) {
                        var container = $('<div>');
                        for (var i = 0; i < items.length; i++) {
                            container.append(items[i].$el);
                        }
                        parent.html(container.html());

                        // Восстанавливаем активный элемент
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].active) {
                                var newItems = parent.find('.selectbox-item');
                                if (newItems.length > i) {
                                    newItems.eq(i).addClass('focus');
                                }
                            }
                        }
                        log('DOM: переупорядочены озвучки');
                    }
                }
            } catch(e) {}
        }

        // Запускаем DOM-вмешательство с задержкой
        setTimeout(directDomIntervention, 500);
        setTimeout(directDomIntervention, 1000);
        setTimeout(directDomIntervention, 2000);

        log('АГРЕССИВНЫЙ ПАТЧ: завершён');
    }

    // ============================================================
    // 4. ЗАПУСК
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa || !Lampa.Component) {
            logError('Lampa не готова, ждём...');
            setTimeout(init, 1000);
            return;
        }

        aggressivePatch();

        // Повторяем патч каждые 3 секунды
        setInterval(aggressivePatch, 3000);

        log('Готово!');
    }

    // Ждём Lampa
    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                log('app:ready получено');
                init();
            }
        });
    }

    // Пробуем сразу
    init();

})();