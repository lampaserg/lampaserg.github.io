/**
 * Online Source Manager
 * Версия: 2.5.0
 * Исправлена сортировка озвучек в сериалах
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    // ============================================================
    // 1. Хранилище настроек
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
    // 2. Функции качества
    // ============================================================
    function extractQuality(name) {
        if (!name) return 0;
        var upper = name.toUpperCase();
        if (upper.indexOf('4K') !== -1 || upper.indexOf('UHD') !== -1 || upper.indexOf('2160') !== -1) return 2160;
        if (upper.indexOf('FULLHD') !== -1 || upper.indexOf('FHD') !== -1 || upper.indexOf('1080') !== -1) return 1080;
        if (upper.indexOf('HD') !== -1 && upper.indexOf('FULL') === -1 || upper.indexOf('720') !== -1) return 720;
        if (upper.indexOf('SD') !== -1 || upper.indexOf('480') !== -1) return 480;
        var match = name.match(/(\d{3,4})[pP]?/);
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
        return /дубляж|дублированный|dub/i.test(name);
    }

    function addQualityLabel(source) {
        var q = getQuality(source);
        if (!q) return source.name || source.title || source.text || '';
        var name = (source.name || source.title || source.text || '').replace(/\s*\(\d{3,4}p\)\s*/g, '').trim();
        return name + ' (' + q + 'p)';
    }

    // ============================================================
    // 3. Приоритет озвучек (голосов)
    // ============================================================
    function getVoicePriority(name) {
        if (!name) return 0;
        var text = name.toLowerCase();
        if (/hdrezka|hd\.rezka|rezka/i.test(text)) return 1000;
        if (/дубляж|дублированный|dub/i.test(text)) return 900;
        if (/lostfilm|lost\.film/i.test(text)) return 800;
        if (/кубик|cube|куб|kubik/i.test(text)) return 700;
        if (/профессиональный|многоголосый|двухголосый/i.test(text)) return 500;
        if (/любительский|одноголосый/i.test(text)) return 300;
        if (/субтитры|sub|subtitles|оригинал|original/i.test(text)) return 100;
        return 200;
    }

    function sortVoices(buttons) {
        if (!buttons || !buttons.length) return buttons;
        return buttons.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';
            var aActive = a.active || a.selected ? 1 : 0;
            var bActive = b.active || b.selected ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;
            var aPriority = getVoicePriority(nameA);
            var bPriority = getVoicePriority(nameB);
            if (aPriority !== bPriority) return bPriority - aPriority;
            return nameA.localeCompare(nameB);
        });
    }

    // ============================================================
    // 4. Сортировка видео (для сериалов)
    // ============================================================
    function sortVideosByQuality(videos) {
        if (!videos || !videos.length) return videos;

        var preferDub = Lampa.Storage.get(STORAGE.PREFER_DUB, DEFAULTS.PREFER_DUB);

        return videos.slice().sort(function(a, b) {
            var qA = getQuality(a);
            var qB = getQuality(b);
            if (qB !== qA) return qB - qA;

            if (preferDub) {
                var dA = isDub(a.text || a.voice_name || '') ? 1 : 0;
                var dB = isDub(b.text || b.voice_name || '') ? 1 : 0;
                if (dA !== dB) return dB - dA;
            }

            return 0;
        });
    }

    // ============================================================
    // 5. Сортировка источников
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
        var result = sources.slice();
        result = applySorting(result);
        result = filterByMinQuality(result);
        result = filterUnavailable(result);
        return result;
    };

    // ============================================================
    // 6. UI: Меню в фильтре
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
    // 7. Патч фильтра
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
    }

    function patchFilter() {
        var Original = Lampa.Filter;
        if (!Original) return;

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
    }

    // ============================================================
    // 8. ГЛАВНЫЙ ПАТЧ - перехватываем отрисовку озвучек
    // ============================================================
    function patchVoiceDisplay() {
        // Перехватываем метод, который отображает кнопки озвучек
        var originalFilter = Lampa.Filter.prototype.onSelect;

        if (originalFilter) {
            Lampa.Filter.prototype.onSelect = function(type, a, b) {
                // Если это выбор озвучки (voice)
                if (type === 'filter' && a && a.stype === 'voice') {
                    var items = a.items || [];
                    if (items.length > 1) {
                        // Сортируем элементы озвучек перед отображением
                        var sortedItems = items.slice().sort(function(x, y) {
                            var nameX = x.title || '';
                            var nameY = y.title || '';
                            var priorityX = getVoicePriority(nameX);
                            var priorityY = getVoicePriority(nameY);
                            if (priorityX !== priorityY) return priorityY - priorityX;
                            return nameX.localeCompare(nameY);
                        });

                        // Обновляем элементы
                        a.items = sortedItems;
                        // Обновляем subtitle
                        if (sortedItems.length > 0) {
                            a.subtitle = sortedItems[0].title || '';
                        }
                    }
                }

                // Вызываем оригинальный метод
                if (originalFilter) {
                    return originalFilter.call(this, type, a, b);
                }
            };
        }

        // Перехватываем создание фильтра
        var OriginalFilter = Lampa.Filter;
        if (OriginalFilter && OriginalFilter.prototype && OriginalFilter.prototype.set) {
            var originalSet = OriginalFilter.prototype.set;

            OriginalFilter.prototype.set = function(type, items) {
                if (type === 'filter' && items && items.length) {
                    // Ищем пункт с озвучками
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        if (item && item.stype === 'voice' && item.items && item.items.length > 1) {
                            // Сортируем озвучки
                            var sorted = item.items.slice().sort(function(a, b) {
                                var nameA = a.title || '';
                                var nameB = b.title || '';
                                var priorityA = getVoicePriority(nameA);
                                var priorityB = getVoicePriority(nameB);
                                if (priorityA !== priorityB) return priorityB - priorityA;
                                return nameA.localeCompare(nameB);
                            });
                            item.items = sorted;
                            if (sorted.length > 0) {
                                item.subtitle = sorted[0].title || '';
                            }
                        }
                    }
                }
                return originalSet.call(this, type, items);
            };
        }
    }

    // ============================================================
    // 9. Патч компонентов
    // ============================================================
    function patchLampacComponents() {
        if (!Lampa.Component || !Lampa.Component._components) return;

        var comps = Lampa.Component._components;
        for (var name in comps) {
            var comp = comps[name];
            if (!comp || !comp.prototype) continue;

            var proto = comp.prototype;

            // Патчим startSource
            if (typeof proto.startSource === 'function' && !comp._osm_patched) {
                comp._osm_patched = true;
                var originalStart = proto.startSource;
                proto.startSource = function(json) {
                    var processed = window.processSources(json);
                    return originalStart.call(this, processed);
                };
                console.log('[OSM] Patched startSource:', name);
            }

            // Патчим parse для сортировки видео
            if (typeof proto.parse === 'function' && !comp._osm_parse_patched) {
                comp._osm_parse_patched = true;
                var originalParse = proto.parse;

                proto.parse = function(str) {
                    var result = originalParse.call(this, str);

                    try {
                        // Сортировка видео (серии) по качеству
                        var $html = $('<div>' + str + '</div>');
                        var videos = $html.find('.videos__item');
                        if (videos.length > 1) {
                            var videoItems = [];
                            var isSerial = false;
                            videos.each(function() {
                                var $item = $(this);
                                try {
                                    var data = JSON.parse($item.attr('data-json'));
                                    var season = $item.attr('s');
                                    var episode = $item.attr('e');
                                    var text = $item.text().trim();
                                    if (season || episode) isSerial = true;
                                    data.text = text;
                                    if (season) data.season = parseInt(season);
                                    if (episode) data.episode = parseInt(episode);
                                    data.active = $item.hasClass('active');
                                    videoItems.push(data);
                                } catch(e) {}
                            });

                            if (isSerial && videoItems.length > 1) {
                                var sortedVideos = sortVideosByQuality(videoItems);
                            }
                        }
                    } catch(e) {}

                    return result;
                };
                console.log('[OSM] Patched parse:', name);
            }
        }
    }

    function overrideComponentAdd() {
        if (typeof Lampa.Component.add !== 'function') return;
        var originalAdd = Lampa.Component.add;

        Lampa.Component.add = function(name, comp) {
            originalAdd.call(this, name, comp);

            var instance = Lampa.Component.get(name);
            if (instance && instance.prototype) {
                var proto = instance.prototype;

                if (typeof proto.startSource === 'function' && !instance._osm_patched) {
                    instance._osm_patched = true;
                    var originalStart = proto.startSource;
                    proto.startSource = function(json) {
                        var processed = window.processSources(json);
                        return originalStart.call(this, processed);
                    };
                }

                if (typeof proto.parse === 'function' && !instance._osm_parse_patched) {
                    instance._osm_parse_patched = true;
                    var originalParse = proto.parse;
                    proto.parse = function(str) {
                        var result = originalParse.call(this, str);
                        return result;
                    };
                }
            }
        };
    }

    // ============================================================
    // 10. Запуск
    // ============================================================
    function init() {
        console.log('[OSM] Инициализация...');
        patchFilter();
        patchVoiceDisplay();
        overrideComponentAdd();
        patchLampacComponents();
        setInterval(patchLampacComponents, 5000);
        console.log('[OSM] Готово!');
    }

    if (window.Lampa) {
        if (Lampa.Component) {
            init();
        } else {
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') init();
            });
        }
    }

})();