/**
 * Online Source Manager
 * Версия: 2.7.0
 * Сортировка видео для фильмов (по переводу и качеству)
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

    // ============================================================
    // 2. Приоритет перевода (озвучки)
    // ============================================================
    function getVoicePriority(name) {
        if (!name) return 0;
        var text = name.toLowerCase();
        
        // hdrezka - наивысший приоритет
        if (/hdrezka|hd\.rezka|rezka/i.test(text)) return 1000;
        
        // Дубляж / дублированный / дубликация
        if (/дубляж|дублированный|дубликация|dub/i.test(text)) return 900;
        
        // LostFilm
        if (/lostfilm|lost\.film/i.test(text)) return 800;
        
        // Кубик в Кубе
        if (/кубик|cube|куб|kubik/i.test(text)) return 700;
        
        // Профессиональный (многоголосый)
        if (/профессиональный|многоголосый|двухголосый|проф/i.test(text)) return 500;
        
        // Любительский (одноголосый)
        if (/любительский|одноголосый|люб/i.test(text)) return 300;
        
        // Субтитры / оригинал
        if (/субтитры|sub|subtitles|оригинал|original/i.test(text)) return 100;
        
        return 200;
    }

    function extractQualityFromText(text) {
        if (!text) return 0;
        var upper = text.toUpperCase();
        if (upper.indexOf('4K') !== -1 || upper.indexOf('UHD') !== -1 || upper.indexOf('2160') !== -1) return 2160;
        if (upper.indexOf('FULLHD') !== -1 || upper.indexOf('FHD') !== -1 || upper.indexOf('1080') !== -1) return 1080;
        if (upper.indexOf('HD') !== -1 && upper.indexOf('FULL') === -1 || upper.indexOf('720') !== -1) return 720;
        if (upper.indexOf('SD') !== -1 || upper.indexOf('480') !== -1) return 480;
        var match = text.match(/(\d{3,4})\s*[pP]?/);
        if (match) return parseInt(match[1], 10);
        return 0;
    }

    function getQuality(item) {
        var text = item.text || item.title || item.name || '';
        var quality = extractQualityFromText(text);
        if (item.quality) {
            var q = extractQualityFromText(item.quality);
            if (q > quality) quality = q;
        }
        return quality;
    }

    function isDub(text) {
        return /дубляж|дублированный|дубликация|dub/i.test(text);
    }

    // ============================================================
    // 3. Сортировка видео (для фильмов и сериалов)
    // ============================================================
    function sortVideos(videos) {
        if (!videos || !videos.length) return videos;

        var preferDub = Lampa.Storage.get(STORAGE.PREFER_DUB, DEFAULTS.PREFER_DUB);

        return videos.slice().sort(function(a, b) {
            var textA = a.text || a.title || a.name || '';
            var textB = b.text || b.title || b.name || '';

            // 1. Сначала по приоритету перевода (hdrezka → дубляж → остальные)
            var priorityA = getVoicePriority(textA);
            var priorityB = getVoicePriority(textB);
            if (priorityA !== priorityB) return priorityB - priorityA;

            // 2. Затем по качеству (от большего к меньшему)
            var qualityA = getQuality(a);
            var qualityB = getQuality(b);
            if (qualityA !== qualityB) return qualityB - qualityA;

            // 3. При равном качестве и приоритете - дубляж выше (если включено)
            if (preferDub) {
                var dubA = isDub(textA) ? 1 : 0;
                var dubB = isDub(textB) ? 1 : 0;
                if (dubA !== dubB) return dubB - dubA;
            }

            return 0;
        });
    }

    // ============================================================
    // 4. Сортировка источников (балансеров)
    // ============================================================
    function extractQualityFromSource(name) {
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

    function getSourceQuality(source) {
        var name = source.name || source.title || '';
        var quality = extractQualityFromSource(name);
        if (source.quality) {
            var q = extractQualityFromSource(source.quality);
            if (q > quality) quality = q;
        }
        return quality;
    }

    function isSourceDub(name) {
        return /дубляж|дублированный|дубликация|dub/i.test(name);
    }

    function sortSourcesByQuality(sources) {
        if (!sources || !sources.length) return sources;

        var preferDub = Lampa.Storage.get(STORAGE.PREFER_DUB, DEFAULTS.PREFER_DUB);
        var showLabel = Lampa.Storage.get(STORAGE.SHOW_LABEL, DEFAULTS.SHOW_LABEL);

        var available = [];
        var unavailable = [];
        for (var i = 0; i < sources.length; i++) {
            if (sources[i].ghost) unavailable.push(sources[i]);
            else available.push(sources[i]);
        }

        available.sort(function(a, b) {
            var qA = getSourceQuality(a);
            var qB = getSourceQuality(b);
            if (qA !== qB) return qB - qA;

            if (preferDub) {
                var dA = isSourceDub(a.name || a.title || '') ? 1 : 0;
                var dB = isSourceDub(b.name || b.title || '') ? 1 : 0;
                if (dA !== dB) return dB - dA;
            }

            return 0;
        });

        if (showLabel) {
            available.forEach(function(s) {
                var q = getSourceQuality(s);
                if (q && s.name) {
                    s.name = s.name.replace(/\s*\(\d{3,4}p\)\s*/g, '').trim() + ' (' + q + 'p)';
                }
            });
        }

        return available.concat(unavailable);
    }

    function filterSourcesByMinQuality(sources) {
        var minQuality = parseInt(Lampa.Storage.get(STORAGE.MIN_QUALITY, DEFAULTS.MIN_QUALITY), 10);
        if (minQuality <= 0) return sources;
        return sources.filter(function(s) {
            return getSourceQuality(s) >= minQuality;
        });
    }

    function filterUnavailable(sources) {
        if (!Lampa.Storage.get(STORAGE.HIDE_UNAVAILABLE, DEFAULTS.HIDE_UNAVAILABLE)) return sources;
        return sources.filter(function(s) { return !s.ghost; });
    }

    window.processSources = function(sources) {
        if (!sources || !sources.length) return sources;
        var result = sources.slice();
        result = sortSourcesByQuality(result);
        result = filterSourcesByMinQuality(result);
        result = filterUnavailable(result);
        return result;
    };

    // ============================================================
    // 5. UI: Меню в фильтре
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

        var sortTitle = sortType === 'alphabet' ? 'По алфавиту' :
                       sortType === 'quality' ? 'По качеству' :
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
                {title: 'Стандартная', subtitle: 'Порядок от сервера', value: 'default', selected: current === 'default'},
                {title: 'По алфавиту', subtitle: 'От А до Я', value: 'alphabet', selected: current === 'alphabet'},
                {title: 'По качеству', subtitle: 'От лучшего к худшему', value: 'quality', selected: current === 'quality'}
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
    // 6. ГЛАВНЫЙ ПАТЧ - сортировка видео
    // ============================================================
    function patchVideoSorting() {
        // Патчим display для сортировки видео
        function patchComponentDisplay(comp, name) {
            if (!comp || !comp.prototype) return;
            var proto = comp.prototype;
            if (typeof proto.display !== 'function') return;
            if (proto._osm_video_patched) return;
            proto._osm_video_patched = true;

            var originalDisplay = proto.display;
            proto.display = function(videos) {
                // Сортируем видео перед отображением
                var sorted = sortVideos(videos);
                return originalDisplay.call(this, sorted);
            };
            console.log('[OSM] Patched display for:', name);
        }

        // Патчим существующие компоненты
        if (Lampa.Component && Lampa.Component._components) {
            var comps = Lampa.Component._components;
            for (var name in comps) {
                var comp = comps[name];
                if (comp && name.toLowerCase().indexOf('lampac') !== -1) {
                    patchComponentDisplay(comp, name);
                }
            }
        }

        // Перехватываем добавление новых компонентов
        if (typeof Lampa.Component.add === 'function') {
            var originalAdd = Lampa.Component.add;
            Lampa.Component.add = function(name, comp) {
                originalAdd.call(this, name, comp);
                if (name.toLowerCase().indexOf('lampac') !== -1) {
                    var instance = Lampa.Component.get(name);
                    if (instance) {
                        patchComponentDisplay(instance, name);
                    }
                }
            };
        }
    }

    // ============================================================
    // 7. Патч фильтра для сортировки источников
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
    // 8. Патч startSource для источников
    // ============================================================
    function patchStartSource() {
        if (!Lampa.Component || !Lampa.Component._components) return;

        var comps = Lampa.Component._components;
        for (var name in comps) {
            var comp = comps[name];
            if (!comp || !comp.prototype) continue;
            if (typeof comp.prototype.startSource !== 'function') continue;
            if (comp._osm_source_patched) continue;
            comp._osm_source_patched = true;

            var original = comp.prototype.startSource;
            comp.prototype.startSource = function(json) {
                var processed = window.processSources(json);
                return original.call(this, processed);
            };
            console.log('[OSM] Patched startSource:', name);
        }
    }

    // ============================================================
    // 9. Запуск
    // ============================================================
    function init() {
        console.log('[OSM] Инициализация...');
        console.log('[OSM] Приоритет: hdrezka → Дубляж → LostFilm → Кубик → Остальные');
        console.log('[OSM] Минимальное качество: 1080p');

        patchFilter();
        patchStartSource();
        patchVideoSorting();

        // Перехватываем добавление компонентов
        if (typeof Lampa.Component.add === 'function') {
            var originalAdd = Lampa.Component.add;
            Lampa.Component.add = function(name, comp) {
                originalAdd.call(this, name, comp);
                setTimeout(function() {
                    patchStartSource();
                    patchVideoSorting();
                }, 100);
            };
        }

        // Периодическая проверка
        setInterval(function() {
            patchStartSource();
            patchVideoSorting();
        }, 5000);

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