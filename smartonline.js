/**
 * Online Source Manager
 * Версия: 3.1.0
 * Полное управление источниками с логированием
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    // ============================================================
    // 1. Логирование (включено по умолчанию)
    // ============================================================
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
    log('Online Source Manager v3.1.0');
    log('Приоритет: hdrezka → Дубляж → LostFilm → Кубик → Остальные');
    log('Минимальное качество: 1080p');
    log('========================================');

    // ============================================================
    // 2. Хранилище настроек
    // ============================================================
    var STORAGE = {
        SORT_TYPE: 'osm_sort_type',
        HIDE_UNAVAILABLE: 'osm_hide_unavailable',
        MIN_QUALITY: 'osm_min_quality',
        PREFER_DUB: 'osm_prefer_dub',
        SHOW_LABEL: 'osm_show_label'
    };

    var DEFAULTS = {
        SORT_TYPE: 'quality',
        HIDE_UNAVAILABLE: false,
        MIN_QUALITY: '1080',
        PREFER_DUB: true,
        SHOW_LABEL: true
    };

    var SORT_TYPES = {
        DEFAULT: 'default',
        ALPHABET: 'alphabet',
        QUALITY: 'quality'
    };

    // ============================================================
    // 3. Приоритет озвучек (как в Smart Online)
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
        if (!buttons || !buttons.length) {
            log('sortVoices: нет кнопок для сортировки');
            return buttons;
        }

        log('sortVoices: сортируем ' + buttons.length + ' озвучек');
        log('  До сортировки:', buttons.map(function(v) { return v.text || v.title || 'unknown'; }));

        var sorted = buttons.slice().sort(function(a, b) {
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

        log('  После сортировки:', sorted.map(function(v) { return v.text || v.title || 'unknown'; }));

        return sorted;
    }

    // ============================================================
    // 4. Функции качества
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

    function getQuality(source) {
        var name = source.name || source.title || source.text || '';
        var quality = extractQuality(name);
        if (source.quality) {
            var q = extractQuality(source.quality);
            if (q > quality) quality = q;
        }
        return quality;
    }

    function isDub(name) {
        return /дубляж|дублированный|дубликация|dub/i.test(name);
    }

    function addQualityLabel(source) {
        var q = getQuality(source);
        if (!q) return source.name || source.title || source.text || '';
        var name = (source.name || source.title || source.text || '').replace(/\s*\(\d{3,4}p\)\s*/g, '').trim();
        return name + ' (' + q + 'p)';
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

    // ============================================================
    // 5. Сортировка видео (для фильмов)
    // ============================================================
    function sortVideos(videos) {
        if (!videos || !videos.length) {
            log('sortVideos: нет видео для сортировки');
            return videos;
        }

        log('sortVideos: сортируем ' + videos.length + ' видео');
        log('  До сортировки:', videos.map(function(v) { return v.text || v.title || 'unknown'; }));

        var preferDub = Lampa.Storage.get(STORAGE.PREFER_DUB, DEFAULTS.PREFER_DUB);

        var sorted = videos.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            var weightA = voiceWeight(nameA);
            var weightB = voiceWeight(nameB);
            if (weightA !== weightB) return weightB - weightA;

            var qualityA = getItemQuality(a);
            var qualityB = getItemQuality(b);
            if (qualityA !== qualityB) return qualityB - qualityA;

            if (preferDub) {
                var dubA = isDub(nameA) ? 1 : 0;
                var dubB = isDub(nameB) ? 1 : 0;
                if (dubA !== dubB) return dubB - dubA;
            }

            return 0;
        });

        log('  После сортировки:', sorted.map(function(v) { return v.text || v.title || 'unknown'; }));

        return sorted;
    }

    // ============================================================
    // 6. Сортировка источников
    // ============================================================
    function sortByAlphabet(sources) {
        var available = [];
        var unavailable = [];
        for (var i = 0; i < sources.length; i++) {
            if (sources[i].ghost) unavailable.push(sources[i]);
            else available.push(sources[i]);
        }
        available.sort(function(a, b) {
            var nameA = (a.title || a.name || '').toLowerCase();
            var nameB = (b.title || b.name || '').toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        return available.concat(unavailable);
    }

    function sortByQuality(sources) {
        var available = [];
        var unavailable = [];
        for (var i = 0; i < sources.length; i++) {
            if (sources[i].ghost) unavailable.push(sources[i]);
            else available.push(sources[i]);
        }

        var preferDub = Lampa.Storage.get(STORAGE.PREFER_DUB, DEFAULTS.PREFER_DUB);
        var showLabel = Lampa.Storage.get(STORAGE.SHOW_LABEL, DEFAULTS.SHOW_LABEL);

        for (var j = 0; j < available.length; j++) {
            available[j]._idx = j;
        }

        available.sort(function(a, b) {
            var qA = getQuality(a);
            var qB = getQuality(b);
            if (qB !== qA) return qB - qA;

            if (preferDub) {
                var dA = isDub(a.name || a.title || '') ? 1 : 0;
                var dB = isDub(b.name || b.title || '') ? 1 : 0;
                if (dA !== dB) return dB - dA;
            }

            return a._idx - b._idx;
        });

        for (var k = 0; k < available.length; k++) {
            delete available[k]._idx;
        }

        if (showLabel) {
            available.forEach(function(s) {
                if (s.name) s.name = addQualityLabel(s);
                else if (s.title) s.title = addQualityLabel(s);
            });
            unavailable.forEach(function(s) {
                if (s.name) s.name = addQualityLabel(s);
                else if (s.title) s.title = addQualityLabel(s);
            });
        }

        return available.concat(unavailable);
    }

    function applySorting(sources) {
        if (!sources || !sources.length) return sources;
        var sortType = Lampa.Storage.get(STORAGE.SORT_TYPE, DEFAULTS.SORT_TYPE);
        var sorted = sources.slice();

        if (sortType === SORT_TYPES.ALPHABET) return sortByAlphabet(sorted);
        if (sortType === SORT_TYPES.QUALITY) return sortByQuality(sorted);

        var available = [];
        var unavailable = [];
        for (var i = 0; i < sorted.length; i++) {
            if (sorted[i].ghost) unavailable.push(sorted[i]);
            else available.push(sorted[i]);
        }
        return available.concat(unavailable);
    }

    function filterByMinQuality(sources) {
        var minQuality = parseInt(Lampa.Storage.get(STORAGE.MIN_QUALITY, DEFAULTS.MIN_QUALITY), 10);
        if (minQuality <= 0) return sources;
        return sources.filter(function(s) {
            return getQuality(s) >= minQuality;
        });
    }

    function filterUnavailable(sources) {
        if (!Lampa.Storage.get(STORAGE.HIDE_UNAVAILABLE, DEFAULTS.HIDE_UNAVAILABLE)) return sources;
        return sources.filter(function(s) { return !s.ghost; });
    }

    window.processSources = function(sources) {
        if (!sources || !sources.length) return sources;
        log('processSources: обрабатываем ' + sources.length + ' источников');
        var result = sources.slice();
        result = applySorting(result);
        result = filterByMinQuality(result);
        result = filterUnavailable(result);
        log('processSources: после обработки ' + result.length + ' источников');
        return result;
    };

    // ============================================================
    // 7. UI: Меню в фильтре
    // ============================================================
    var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" fill="currentColor"/></svg>';

    function showSourceMenu(onUpdate) {
        var sortType = Lampa.Storage.get(STORAGE.SORT_TYPE, DEFAULTS.SORT_TYPE);
        var hideEnabled = Lampa.Storage.get(STORAGE.HIDE_UNAVAILABLE, DEFAULTS.HIDE_UNAVAILABLE);
        var minQuality = parseInt(Lampa.Storage.get(STORAGE.MIN_QUALITY, DEFAULTS.MIN_QUALITY), 10);
        var preferDub = Lampa.Storage.get(STORAGE.PREFER_DUB, DEFAULTS.PREFER_DUB);
        var showLabel = Lampa.Storage.get(STORAGE.SHOW_LABEL, DEFAULTS.SHOW_LABEL);

        var qualityLabels = {
            '0': 'Все',
            '480': '≥480p',
            '720': '≥720p',
            '1080': '≥1080p'
        };

        var sortTitle = sortType === SORT_TYPES.ALPHABET ? 'По алфавиту' :
                       sortType === SORT_TYPES.QUALITY ? 'По качеству' :
                       'Стандартная';

        var hideTitle = hideEnabled ? 'Да' : 'Нет';
        var qualityTitle = qualityLabels[String(minQuality)] || 'Все';
        var dubTitle = preferDub ? 'Да' : 'Нет';
        var labelTitle = showLabel ? 'Да' : 'Нет';

        Lampa.Select.show({
            title: 'Управление источниками',
            items: [
                {title: 'Сортировка', subtitle: sortTitle, value: 'sorting'},
                {title: 'Минимальное качество', subtitle: qualityTitle, value: 'min_quality'},
                {title: 'Скрывать недоступные', subtitle: hideTitle, value: 'hide'},
                {title: 'Предпочитать дубляж', subtitle: dubTitle, value: 'dub'},
                {title: 'Показывать качество в названии', subtitle: labelTitle, value: 'label'}
            ],
            onSelect: function(item) {
                if (item.value === 'sorting') {
                    Lampa.Select.close();
                    setTimeout(function() { showSortingMenu(onUpdate); }, 50);
                } else if (item.value === 'hide') {
                    Lampa.Storage.set(STORAGE.HIDE_UNAVAILABLE, !Lampa.Storage.get(STORAGE.HIDE_UNAVAILABLE, DEFAULTS.HIDE_UNAVAILABLE));
                    if (onUpdate) onUpdate();
                    Lampa.Select.close();
                } else if (item.value === 'min_quality') {
                    Lampa.Select.close();
                    setTimeout(function() { showQualityMenu(onUpdate); }, 50);
                } else if (item.value === 'dub') {
                    Lampa.Storage.set(STORAGE.PREFER_DUB, !Lampa.Storage.get(STORAGE.PREFER_DUB, DEFAULTS.PREFER_DUB));
                    if (onUpdate) onUpdate();
                    Lampa.Select.close();
                } else if (item.value === 'label') {
                    Lampa.Storage.set(STORAGE.SHOW_LABEL, !Lampa.Storage.get(STORAGE.SHOW_LABEL, DEFAULTS.SHOW_LABEL));
                    if (onUpdate) onUpdate();
                    Lampa.Select.close();
                }
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function showSortingMenu(onUpdate) {
        var current = Lampa.Storage.get(STORAGE.SORT_TYPE, DEFAULTS.SORT_TYPE);

        Lampa.Select.show({
            title: 'Сортировка',
            items: [
                {title: 'Стандартная', subtitle: 'Порядок от сервера', value: SORT_TYPES.DEFAULT, selected: current === SORT_TYPES.DEFAULT},
                {title: 'По алфавиту', subtitle: 'От А до Я', value: SORT_TYPES.ALPHABET, selected: current === SORT_TYPES.ALPHABET},
                {title: 'По качеству', subtitle: 'От лучшего к худшему', value: SORT_TYPES.QUALITY, selected: current === SORT_TYPES.QUALITY}
            ],
            onSelect: function(item) {
                Lampa.Storage.set(STORAGE.SORT_TYPE, item.value);
                if (onUpdate) onUpdate();
                Lampa.Select.close();
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function showQualityMenu(onUpdate) {
        var current = Lampa.Storage.get(STORAGE.MIN_QUALITY, DEFAULTS.MIN_QUALITY);

        Lampa.Select.show({
            title: 'Минимальное качество',
            items: [
                {title: 'Все', value: '0', selected: current === '0'},
                {title: '≥480p', value: '480', selected: current === '480'},
                {title: '≥720p', value: '720', selected: current === '720'},
                {title: '≥1080p', value: '1080', selected: current === '1080'}
            ],
            onSelect: function(item) {
                Lampa.Storage.set(STORAGE.MIN_QUALITY, item.value);
                if (onUpdate) onUpdate();
                Lampa.Select.close();
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    }

    // ============================================================
    // 8. Патч фильтра (добавление кнопки)
    // ============================================================
    function addButton(filterElement, onUpdate) {
        if (!filterElement || !filterElement.length) return;
        var sortBtn = filterElement.find('.filter--sort');
        if (!sortBtn.length) return;
        if (filterElement.find('.source-sort-button').length) return;

        var btn = $('<div class="simple-button selector source-sort-button" style="padding:0;width:3em;display:flex;align-items:center;justify-content:center">' + ICON + '</div>');

        btn.on('hover:enter', function() { showSourceMenu(onUpdate); });
        btn.on('hover:focus', function() { btn.addClass('focus'); });
        btn.on('hover:blur', function() { btn.removeClass('focus'); });

        sortBtn.after(btn);
        log('addButton: кнопка добавлена');
    }

    function patchFilter() {
        var Original = Lampa.Filter;
        if (!Original) {
            logError('Lampa.Filter не найден');
            return;
        }

        log('patchFilter: патчим Lampa.Filter');

        Lampa.Filter = function(object) {
            var filter = new Original(object);
            var originalSet = filter.set;
            var originalRender = filter.render;
            var filterEl = null;
            var originalSrc = null;
            var lastLen = 0;

            filter.render = function() {
                filterEl = originalRender.apply(this, arguments);
                return filterEl;
            };

            filter.set = function(type, items) {
                if (type === 'sort' && items && items.length) {
                    if (!originalSrc || items.length !== lastLen) {
                        originalSrc = items.slice();
                        lastLen = items.length;
                    }

                    var processed = window.processSources(items.slice());
                    originalSet.call(this, type, processed);

                    var self = this;
                    setTimeout(function() {
                        if (filterEl) {
                            addButton(filterEl, function() {
                                var current = originalSrc.slice();
                                var processedNew = window.processSources(current);
                                originalSet.call(self, type, processedNew);
                            });
                        }
                    }, 100);
                } else {
                    originalSet.apply(this, arguments);
                }
            };

            return filter;
        };

        for (var key in Original) {
            if (Original.hasOwnProperty(key)) {
                Lampa.Filter[key] = Original[key];
            }
        }

        Lampa.Filter.prototype = Original.prototype;
        log('patchFilter: готово');
    }

    // ============================================================
    // 9. Патч для сортировки озвучек в сериалах
    // ============================================================
    function patchVoiceSorting() {
        log('patchVoiceSorting: начало');

        // Патчим Lampa.Filter для сортировки озвучек
        if (Lampa.Filter && Lampa.Filter.prototype) {
            var filterProto = Lampa.Filter.prototype;

            // Патчим set
            if (typeof filterProto.set === 'function' && !filterProto._voiceSetPatched) {
                filterProto._voiceSetPatched = true;
                var originalSet = filterProto.set;
                log('patchVoiceSorting: патчим Filter.set');

                filterProto.set = function(type, items) {
                    if (type === 'filter' && items && items.length) {
                        for (var i = 0; i < items.length; i++) {
                            var item = items[i];
                            if (item && item.stype === 'voice' && item.items && item.items.length > 1) {
                                log('Filter.set: найдены озвучки:', item.items.map(function(x) { return x.title; }));
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
                                log('Filter.set: после сортировки:', sorted.map(function(x) { return x.title; }));
                            }
                        }
                    }
                    return originalSet.call(this, type, items);
                };
            }

            // Патчим onSelect
            if (typeof filterProto.onSelect === 'function' && !filterProto._voiceSelectPatched) {
                filterProto._voiceSelectPatched = true;
                var originalOnSelect = filterProto.onSelect;
                log('patchVoiceSorting: патчим Filter.onSelect');

                filterProto.onSelect = function(type, a, b) {
                    if (type === 'filter' && a && a.stype === 'voice' && a.items && a.items.length > 1) {
                        log('Filter.onSelect: найдены озвучки:', a.items.map(function(x) { return x.title; }));
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
                        log('Filter.onSelect: после сортировки:', sorted.map(function(x) { return x.title; }));
                    }
                    return originalOnSelect.call(this, type, a, b);
                };
            }
        }

        // Патчим компоненты
        if (Lampa.Component && Lampa.Component._components) {
            var comps = Lampa.Component._components;
            var targetComponents = ['lampac', 'lampacskaz', 'online', 'lampac_online', 'bwa'];
            var patchedCount = 0;

            for (var name in comps) {
                var isTarget = false;
                for (var t = 0; t < targetComponents.length; t++) {
                    if (name.toLowerCase().indexOf(targetComponents[t]) === 0) {
                        isTarget = true;
                        break;
                    }
                }
                if (!isTarget) continue;

                var comp = comps[name];
                if (!comp || !comp.prototype) continue;
                var proto = comp.prototype;

                // Патчим parse для озвучек
                if (typeof proto.parse === 'function' && !proto._voiceParsePatched) {
                    proto._voiceParsePatched = true;
                    var originalParse = proto.parse;
                    patchedCount++;
                    log('patchVoiceSorting: патчим parse для ' + name);

                    proto.parse = function(str) {
                        var result = originalParse.call(this, str);

                        try {
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
                                    } catch(e) {
                                        logError('parse: ошибка парсинга кнопки', e);
                                    }
                                });

                                if (voiceButtons.length > 1) {
                                    log('parse: найдено ' + voiceButtons.length + ' озвучек в ' + name);
                                    var sorted = sortVoices(voiceButtons);
                                }
                            }
                        } catch(e) {
                            logError('parse: ошибка', e);
                        }

                        return result;
                    };
                }

                // Патчим display для видео в фильмах
                if (typeof proto.display === 'function' && !proto._voiceDisplayPatched) {
                    proto._voiceDisplayPatched = true;
                    var originalDisplay = proto.display;
                    patchedCount++;
                    log('patchVoiceSorting: патчим display для ' + name);

                    proto.display = function(videos) {
                        log('display: вызван для ' + name + ', видео: ' + (videos ? videos.length : 0));
                        var sorted = sortVideos(videos);
                        return originalDisplay.call(this, sorted);
                    };
                }

                // Патчим startSource для источников
                if (typeof proto.startSource === 'function' && !comp._osm_patched) {
                    comp._osm_patched = true;
                    var originalStart = proto.startSource;
                    patchedCount++;
                    log('patchVoiceSorting: патчим startSource для ' + name);

                    proto.startSource = function(json) {
                        log('startSource: вызван для ' + name + ', источников: ' + (json ? json.length : 0));
                        var processed = window.processSources(json);
                        return originalStart.call(this, processed);
                    };
                }
            }

            log('patchVoiceSorting: пропатчено ' + patchedCount + ' компонентов');
        } else {
            logError('patchVoiceSorting: Lampa.Component не найден');
        }
    }

    // ============================================================
    // 10. Перехват новых компонентов
    // ============================================================
    function overrideComponentAdd() {
        if (typeof Lampa.Component.add !== 'function') {
            logError('Lampa.Component.add не найден');
            return;
        }

        var originalAdd = Lampa.Component.add;
        log('overrideComponentAdd: перехватываем Lampa.Component.add');

        Lampa.Component.add = function(name, comp) {
            log('Component.add: добавлен компонент ' + name);
            originalAdd.call(this, name, comp);

            var targetComponents = ['lampac', 'lampacskaz', 'online', 'lampac_online', 'bwa'];
            var isTarget = false;
            for (var t = 0; t < targetComponents.length; t++) {
                if (name.toLowerCase().indexOf(targetComponents[t]) === 0) {
                    isTarget = true;
                    break;
                }
            }
            if (!isTarget) {
                log('Component.add: ' + name + ' не в списке целевых');
                return;
            }

            log('Component.add: патчим ' + name);

            var instance = Lampa.Component.get(name);
            if (instance && instance.prototype) {
                var proto = instance.prototype;

                if (typeof proto.parse === 'function' && !proto._voiceParsePatched) {
                    proto._voiceParsePatched = true;
                    var originalParse = proto.parse;
                    proto.parse = function(str) {
                        var result = originalParse.call(this, str);
                        try {
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
                                    log('Component.add: сортируем озвучки в ' + name);
                                    sortVoices(voiceButtons);
                                }
                            }
                        } catch(e) {}
                        return result;
                    };
                }

                if (typeof proto.display === 'function' && !proto._voiceDisplayPatched) {
                    proto._voiceDisplayPatched = true;
                    var originalDisplay = proto.display;
                    proto.display = function(videos) {
                        var sorted = sortVideos(videos);
                        return originalDisplay.call(this, sorted);
                    };
                }

                if (typeof proto.startSource === 'function' && !instance._osm_patched) {
                    instance._osm_patched = true;
                    var originalStart = proto.startSource;
                    proto.startSource = function(json) {
                        var processed = window.processSources(json);
                        return originalStart.call(this, processed);
                    };
                }
            }
        };
    }

    // ============================================================
    // 11. Запуск
    // ============================================================
    function init() {
        log('========================================');
        log('ИНИЦИАЛИЗАЦИЯ');
        log('========================================');

        try {
            patchFilter();
            log('patchFilter: OK');
        } catch(e) {
            logError('patchFilter:', e);
        }

        try {
            patchVoiceSorting();
            log('patchVoiceSorting: OK');
        } catch(e) {
            logError('patchVoiceSorting:', e);
        }

        try {
            overrideComponentAdd();
            log('overrideComponentAdd: OK');
        } catch(e) {
            logError('overrideComponentAdd:', e);
        }

        // Периодическая проверка
        var checkCount = 0;
        setInterval(function() {
            checkCount++;
            if (checkCount % 10 === 0) {
                log('Периодическая проверка #' + checkCount);
            }
            try {
                patchVoiceSorting();
            } catch(e) {
                logError('Периодическая проверка:', e);
            }
        }, 5000);

        log('========================================');
        log('ГОТОВО!');
        log('========================================');
        log('Если сортировка не работает:');
        log('1. Откройте фильм/сериал через "Онлайн"');
        log('2. Посмотрите логи выше');
        log('3. Напишите название компонента, который открывается');
        log('========================================');
    }

    if (window.Lampa) {
        if (Lampa.Component) {
            init();
        } else {
            log('Ждём загрузки Lampa...');
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') {
                    log('Lampa загружена');
                    init();
                }
            });
        }
    } else {
        logError('Lampa не найдена');
    }

})();