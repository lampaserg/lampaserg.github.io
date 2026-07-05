(function() {
    'use strict';

    if (window.smart_online_sorter_loaded) return;
    window.smart_online_sorter_loaded = true;

    // ============================================================
    // 1. Функции определения качества и дубляжа
    // ============================================================
    function qualityWeight(label) {
        if (label === undefined || label === null) return 0;
        var s = ('' + label).toLowerCase();
        if (s.indexOf('4k') !== -1 || s.indexOf('uhd') !== -1 || /2160/.test(s)) return 2160;
        if (s.indexOf('fullhd') !== -1 || s.indexOf('full hd') !== -1 || s.indexOf('fhd') !== -1 || /1080/.test(s)) return 1080;
        if (s.indexOf('hd') !== -1 && s.indexOf('full') === -1 || /720/.test(s)) return 720;
        if (s.indexOf('sd') !== -1 || /480/.test(s)) return 480;
        var m = s.match(/(\d{3,4})\s*[pр]?/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n >= 480) return n;
        }
        return 0;
    }

    function getQualityFromSource(source) {
        var name = source.name || source.title || '';
        var quality = qualityWeight(name);
        if (source.quality) {
            var q = qualityWeight(source.quality);
            if (q > quality) quality = q;
        }
        return quality;
    }

    function isDub(name) {
        return /дубляж|dub/i.test(name);
    }

    function addQualityLabel(source) {
        var q = getQualityFromSource(source);
        if (!q) return source.name;
        var name = source.name.replace(/\s*\(\d{3,4}p\)\s*/g, '').trim();
        return name + ' (' + q + 'p)';
    }

    function sortAndFilterSources(sources) {
        if (!sources || !sources.length) return sources;

        // Чтение настроек
        var enabled = Lampa.Storage.get('qs_enabled', true);
        if (!enabled) return sources;

        var minQuality = parseInt(Lampa.Storage.get('qs_min_quality', '0'), 10);
        var preferDub = Lampa.Storage.get('qs_prefer_dub', false);
        var showLabel = Lampa.Storage.get('qs_show_label', true);

        // 1. Фильтр по минимальному качеству
        var filtered = sources.filter(function(s) {
            if (minQuality > 0) {
                var q = getQualityFromSource(s);
                return q >= minQuality;
            }
            return true;
        });

        // 2. Сортировка: активные → качество → дубляж → алфавит
        filtered.sort(function(a, b) {
            var aShow = a.show !== undefined ? a.show : true;
            var bShow = b.show !== undefined ? b.show : true;
            if (aShow && !bShow) return -1;
            if (!aShow && bShow) return 1;

            var aQ = getQualityFromSource(a);
            var bQ = getQualityFromSource(b);
            if (aQ !== bQ) return bQ - aQ;

            if (preferDub) {
                var aDub = isDub(a.name) ? 1 : 0;
                var bDub = isDub(b.name) ? 1 : 0;
                if (aDub !== bDub) return bDub - aDub;
            }

            var aName = (a.name || a.title || '').toLowerCase();
            var bName = (b.name || b.title || '').toLowerCase();
            return aName.localeCompare(bName);
        });

        // 3. Добавление меток качества
        if (showLabel) {
            filtered.forEach(function(s) {
                if (s.name) s.name = addQualityLabel(s);
            });
        }

        return filtered;
    }

    // ============================================================
    // 2. Настройки
    // ============================================================
    function registerSettings() {
        if (!Lampa.SettingsApi) return;
        Lampa.SettingsApi.addComponent({
            component: 'smart_online_sorter',
            name: 'Умная сортировка',
            icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z" fill="white"/></svg>'
        });
        Lampa.SettingsApi.addParam({
            component: 'smart_online_sorter',
            param: { name: 'qs_enabled', type: 'trigger', default: true },
            field: { name: 'Включить сортировку' }
        });
        Lampa.SettingsApi.addParam({
            component: 'smart_online_sorter',
            param: {
                name: 'qs_min_quality',
                type: 'select',
                values: { '0': 'Все', '480': '≥480p', '720': '≥720p', '1080': '≥1080p' },
                default: '0'
            },
            field: { name: 'Минимальное качество' }
        });
        Lampa.SettingsApi.addParam({
            component: 'smart_online_sorter',
            param: { name: 'qs_prefer_dub', type: 'trigger', default: false },
            field: { name: 'Предпочитать дубляж' }
        });
        Lampa.SettingsApi.addParam({
            component: 'smart_online_sorter',
            param: { name: 'qs_show_label', type: 'trigger', default: true },
            field: { name: 'Показывать качество в названии' }
        });
    }

    // ============================================================
    // 3. Патч компонентов (универсальный)
    // ============================================================
    var patchedComponents = {};

    function patchComponent(ComponentConstructor, componentName) {
        if (!ComponentConstructor || !ComponentConstructor.prototype) return;
        if (patchedComponents[componentName]) return;
        if (typeof ComponentConstructor.prototype.startSource !== 'function') return;

        var originalStartSource = ComponentConstructor.prototype.startSource;

        ComponentConstructor.prototype.startSource = function(json) {
            // Применяем сортировку и фильтрацию
            var sorted = sortAndFilterSources(json);
            return originalStartSource.call(this, sorted);
        };

        patchedComponents[componentName] = true;
        console.log('[Sorter] Patched component:', componentName);
    }

    // Список имён компонентов, которые нужно патчить (можно дополнять)
    var TARGET_COMPONENTS = ['lampac', 'lampacskaz', 'online', 'lampac_online'];

    // Патчим уже зарегистрированные компоненты
    function patchExistingComponents() {
        if (!Lampa.Component || !Lampa.Component._components) return;
        var components = Lampa.Component._components;
        for (var name in components) {
            if (TARGET_COMPONENTS.indexOf(name) !== -1) {
                patchComponent(components[name], name);
            }
        }
    }

    // Переопределяем Lampa.Component.add для перехвата новых компонентов
    function overrideComponentAdd() {
        if (typeof Lampa.Component.add !== 'function') return;
        var originalAdd = Lampa.Component.add;

        Lampa.Component.add = function(name, component) {
            // Вызываем оригинальный метод
            originalAdd.call(this, name, component);
            // Если компонент в списке — патчим его
            if (TARGET_COMPONENTS.indexOf(name) !== -1) {
                // Получаем добавленный компонент (он уже зарегистрирован)
                var comp = Lampa.Component.get(name);
                if (comp) {
                    patchComponent(comp, name);
                }
            }
        };
        console.log('[Sorter] Lampa.Component.add переопределён');
    }

    // ============================================================
    // 4. Запуск
    // ============================================================
    registerSettings();

    if (window.Lampa && Lampa.Component) {
        overrideComponentAdd();
        patchExistingComponents();
        // Дополнительная проверка через таймер (компоненты могут добавиться позже)
        setInterval(function() {
            patchExistingComponents();
        }, 3000);
    } else {
        (function wait() {
            if (window.Lampa && Lampa.Component) {
                overrideComponentAdd();
                patchExistingComponents();
                setInterval(patchExistingComponents, 3000);
            } else {
                setTimeout(wait, 500);
            }
        })();
    }
})();