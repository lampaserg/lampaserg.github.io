/**
 * Online Source Manager
 * Версия: 2.0.0
 * 
 * Объединяет:
 * - Сортировку источников по качеству, алфавиту или стандартную
 * - Фильтрацию недоступных источников
 * - Удобную кнопку управления в интерфейсе
 * - Настройки в меню Lampa
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
        BUTTON_ENABLED: 'osm_button_enabled',
        MIN_QUALITY: 'osm_min_quality',
        PREFER_DUB: 'osm_prefer_dub',
        SHOW_LABEL: 'osm_show_label'
    };

    var DEFAULTS = {
        SORT_TYPE: 'default',
        HIDE_UNAVAILABLE: false,
        BUTTON_ENABLED: true,
        MIN_QUALITY: '0',
        PREFER_DUB: false,
        SHOW_LABEL: true
    };

    var SORT_TYPES = {
        DEFAULT: 'default',
        ALPHABET: 'alphabet',
        QUALITY: 'quality'
    };

    // ============================================================
    // 2. Функции качества и дубляжа
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
        var name = source.name || source.title || '';
        var quality = extractQuality(name);
        if (source.quality) {
            var q = extractQuality(source.quality);
            if (q > quality) quality = q;
        }
        return quality;
    }

    function isDub(name) {
        return /дубляж|dub/i.test(name);
    }

    function addQualityLabel(source) {
        var q = getQuality(source);
        if (!q) return source.name || source.title || '';
        var name = (source.name || source.title || '').replace(/\s*\(\d{3,4}p\)\s*/g, '').trim();
        return name + ' (' + q + 'p)';
    }

    // ============================================================
    // 3. Сортировка и фильтрация
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

        // Добавляем метки качества
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

        // Стандартная: активные сначала
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

    function processSources(sources) {
        if (!sources || !sources.length) return sources;
        var result = sources.slice();
        result = applySorting(result);
        result = filterByMinQuality(result);
        result = filterUnavailable(result);
        return result;
    }

    // ============================================================
    // 4. UI: Кнопка управления
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

        var sortTitle = sortType === SORT_TYPES.ALPHABET ? Lampa.Lang.translate('source_sort_alphabet') :
                       sortType === SORT_TYPES.QUALITY ? Lampa.Lang.translate('source_sort_quality') :
                       Lampa.Lang.translate('source_sort_default');

        var hideTitle = hideEnabled ? Lampa.Lang.translate('source_sort_yes') : Lampa.Lang.translate('source_sort_no');
        var qualityTitle = qualityLabels[String(minQuality)] || 'Все';
        var dubTitle = preferDub ? Lampa.Lang.translate('source_sort_yes') : Lampa.Lang.translate('source_sort_no');
        var labelTitle = showLabel ? Lampa.Lang.translate('source_sort_yes') : Lampa.Lang.translate('source_sort_no');

        Lampa.Select.show({
            title: Lampa.Lang.translate('source_sort_title') || 'Управление источниками',
            items: [
                {title: Lampa.Lang.translate('source_sort_sorting') || 'Сортировка', subtitle: sortTitle, value: 'sorting'},
                {title: 'Минимальное качество', subtitle: qualityTitle, value: 'min_quality'},
                {title: Lampa.Lang.translate('source_sort_hide_unavailable') || 'Скрывать недоступные', subtitle: hideTitle, value: 'hide'},
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
            title: Lampa.Lang.translate('source_sort_sorting') || 'Сортировка',
            items: [
                {title: Lampa.Lang.translate('source_sort_default') || 'Стандартная', subtitle: Lampa.Lang.translate('source_sort_default_desc') || 'Порядок от сервера', value: SORT_TYPES.DEFAULT, selected: current === SORT_TYPES.DEFAULT},
                {title: Lampa.Lang.translate('source_sort_alphabet') || 'По алфавиту', subtitle: Lampa.Lang.translate('source_sort_alphabet_desc') || 'От А до Я', value: SORT_TYPES.ALPHABET, selected: current === SORT_TYPES.ALPHABET},
                {title: Lampa.Lang.translate('source_sort_quality') || 'По качеству', subtitle: Lampa.Lang.translate('source_sort_quality_desc') || 'От лучшего к худшему', value: SORT_TYPES.QUALITY, selected: current === SORT_TYPES.QUALITY}
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
    // 5. Патч компонентов
    // ============================================================
    function addButton(filterElement, onUpdate) {
        if (!filterElement || !filterElement.length) return;
        var sortBtn = filterElement.find('.filter--sort');
        if (!sortBtn.length || !Lampa.Storage.get(STORAGE.BUTTON_ENABLED, DEFAULTS.BUTTON_ENABLED)) return;
        if (filterElement.find('.source-sort-button').length) return;

        var btn = $('<div class="simple-button selector source-sort-button" style="padding:0;width:3em;display:flex;align-items:center;justify-content:center">' + ICON + '</div>');

        btn.on('hover:enter', function() { showSourceMenu(onUpdate); });
        btn.on('hover:focus', function() { btn.addClass('focus'); });
        btn.on('hover:blur', function() { btn.removeClass('focus'); });

        sortBtn.after(btn);

        setTimeout(function() {
            try { Lampa.Controller.toggle('content'); } catch(e) {}
        }, 100);
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

                    var processed = processSources(items.slice());

                    originalSet.call(this, type, processed);

                    var self = this;
                    setTimeout(function() {
                        if (filterEl) {
                            addButton(filterEl, function() {
                                var current = originalSrc.slice();
                                var processedNew = processSources(current);
                                originalSet.call(self, type, processedNew);

                                setTimeout(function() {
                                    try { Lampa.Controller.toggle('content'); } catch(e) {}
                                }, 100);
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
    // 6. Патч компонентов lampac
    // ============================================================
    function patchLampacComponents() {
        if (!Lampa.Component || !Lampa.Component._components) return;

        var comps = Lampa.Component._components;
        for (var name in comps) {
            var comp = comps[name];
            if (comp && comp.prototype && typeof comp.prototype.startSource === 'function') {
                if (comp._osm_patched) continue;
                comp._osm_patched = true;

                var original = comp.prototype.startSource;
                comp.prototype.startSource = function(json) {
                    var processed = processSources(json);
                    return original.call(this, processed);
                };
                console.log('[OSM] Patched component:', name);
            }
        }
    }

    function overrideComponentAdd() {
        if (typeof Lampa.Component.add !== 'function') return;
        var originalAdd = Lampa.Component.add;

        Lampa.Component.add = function(name, comp) {
            originalAdd.call(this, name, comp);

            var instance = Lampa.Component.get(name);
            if (instance && instance.prototype && typeof instance.prototype.startSource === 'function') {
                if (!instance._osm_patched) {
                    instance._osm_patched = true;
                    var original = instance.prototype.startSource;
                    instance.prototype.startSource = function(json) {
                        var processed = processSources(json);
                        return original.call(this, processed);
                    };
                    console.log('[OSM] Patched component on add:', name);
                }
            }
        };
    }

    // ============================================================
    // 7. Настройки
    // ============================================================
    function registerSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: 'online_source_manager',
            name: 'Управление источниками',
            icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" fill="white"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'online_source_manager',
            param: {
                name: STORAGE.BUTTON_ENABLED,
                type: 'trigger',
                default: DEFAULTS.BUTTON_ENABLED
            },
            field: {
                name: 'Кнопка управления источниками'
            },
            onChange: function() {
                var enabled = Lampa.Storage.get(STORAGE.BUTTON_ENABLED, DEFAULTS.BUTTON_ENABLED);
                if (enabled) {
                    $('.source-sort-button').show();
                    Lampa.Noty.show('Кнопка показана');
                } else {
                    $('.source-sort-button').hide();
                    Lampa.Noty.show('Кнопка скрыта');
                }
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'online_source_manager',
            param: {
                name: STORAGE.SHOW_LABEL,
                type: 'trigger',
                default: DEFAULTS.SHOW_LABEL
            },
            field: {
                name: 'Показывать качество в названии источника'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'online_source_manager',
            param: {
                name: STORAGE.PREFER_DUB,
                type: 'trigger',
                default: DEFAULTS.PREFER_DUB
            },
            field: {
                name: 'Предпочитать дубляж'
            }
        });
    }

    // ============================================================
    // 8. Локализация
    // ============================================================
    function addLang() {
        Lampa.Lang.add({
            source_sort_title: {ru: 'Управление источниками', uk: 'Керування джерелами', en: 'Source management'},
            source_sort_sorting: {ru: 'Сортировка', uk: 'Сортування', en: 'Sorting'},
            source_sort_hide_unavailable: {ru: 'Скрывать недоступные', uk: 'Приховувати недоступні', en: 'Hide unavailable'},
            source_sort_default: {ru: 'Стандартная', uk: 'Стандартна', en: 'Default'},
            source_sort_default_desc: {ru: 'Порядок от сервера', uk: 'Порядок від сервера', en: 'Server order'},
            source_sort_alphabet: {ru: 'По алфавиту', uk: 'За алфавітом', en: 'Alphabetical'},
            source_sort_alphabet_desc: {ru: 'От А до Я', uk: 'Від А до Я', en: 'A to Z'},
            source_sort_quality: {ru: 'По качеству', uk: 'За якістю', en: 'By quality'},
            source_sort_quality_desc: {ru: 'От лучшего к худшему', uk: 'Від кращого до гіршого', en: 'Best to worst'},
            source_sort_yes: {ru: 'Да', uk: 'Так', en: 'Yes'},
            source_sort_no: {ru: 'Нет', uk: 'Ні', en: 'No'}
        });
    }

    // ============================================================
    // 9. Запуск
    // ============================================================
    function init() {
        addLang();
        registerSettings();
        patchFilter();
        overrideComponentAdd();
        patchLampacComponents();

        // Периодическая проверка новых компонентов
        setInterval(patchLampacComponents, 5000);
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