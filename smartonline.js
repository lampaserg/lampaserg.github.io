(function() {
    'use strict';

    if (window.quality_sorter_plugin_loaded) return;
    window.quality_sorter_plugin_loaded = true;

    // ============================================================
    // 1. Определение качества
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

    function sortSourcesByQuality(sources) {
        if (!sources || !sources.length) return sources;
        var sorted = sources.slice();
        sorted.sort(function(a, b) {
            // 1. Активные (show: true) выше
            var aShow = a.show !== undefined ? a.show : true;
            var bShow = b.show !== undefined ? b.show : true;
            if (aShow && !bShow) return -1;
            if (!aShow && bShow) return 1;
            // 2. Качество (от большего к меньшему)
            var aQuality = getQualityFromSource(a);
            var bQuality = getQualityFromSource(b);
            if (aQuality !== bQuality) return bQuality - aQuality;
            // 3. Приоритет дубляжа (если включено в настройках – будет применено отдельно)
            // 4. Алфавит
            var aName = (a.name || a.title || '').toLowerCase();
            var bName = (b.name || b.title || '').toLowerCase();
            return aName.localeCompare(bName);
        });
        return sorted;
    }

    // ============================================================
    // 2. Настройки
    // ============================================================
    function registerSettings() {
        if (!Lampa.SettingsApi) return;
        Lampa.SettingsApi.addComponent({
            component: 'quality_sorter',
            name: 'Сортировка Онлайн',
            icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z" fill="white"/></svg>'
        });
        Lampa.SettingsApi.addParam({
            component: 'quality_sorter',
            param: { name: 'qs_enabled', type: 'trigger', default: true },
            field: { name: 'Сортировать источники по качеству' }
        });
        Lampa.SettingsApi.addParam({
            component: 'quality_sorter',
            param: {
                name: 'qs_min_quality',
                type: 'select',
                values: { '0': 'Все', '480': '≥480p', '720': '≥720p', '1080': '≥1080p' },
                default: '0'
            },
            field: { name: 'Минимальное качество' }
        });
        Lampa.SettingsApi.addParam({
            component: 'quality_sorter',
            param: { name: 'qs_prefer_dub', type: 'trigger', default: false },
            field: { name: 'Предпочитать дубляж' }
        });
        Lampa.SettingsApi.addParam({
            component: 'quality_sorter',
            param: { name: 'qs_show_label', type: 'trigger', default: true },
            field: { name: 'Показывать качество в названии источника' }
        });
    }

    // ============================================================
    // 3. Патч компонента lampac
    // ============================================================
    function patchLampac() {
        if (!Lampa.Component || !Lampa.Component.get) {
            setTimeout(patchLampac, 1000);
            return;
        }
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            setTimeout(patchLampac, 1000);
            return;
        }
        if (Lampac._qualitySorterPatched) return;
        Lampac._qualitySorterPatched = true;

        var origStartSource = Lampac.prototype.startSource;

        Lampac.prototype.startSource = function(json) {
            var enabled = Lampa.Storage.get('qs_enabled', true);
            if (!enabled) {
                return origStartSource.call(this, json);
            }
            var minQuality = parseInt(Lampa.Storage.get('qs_min_quality', '0'), 10);
            var preferDub = Lampa.Storage.get('qs_prefer_dub', false);
            var showLabel = Lampa.Storage.get('qs_show_label', true);

            // Фильтр по минимальному качеству
            var filtered = json.filter(function(s) {
                if (minQuality > 0) {
                    var q = getQualityFromSource(s);
                    return q >= minQuality;
                }
                return true;
            });

            // Сортировка
            var sorted = sortSourcesByQuality(filtered);

            // Дополнительный приоритет дубляжа (если включено)
            if (preferDub) {
                sorted.sort(function(a, b) {
                    var aDub = isDub(a.name) ? 1 : 0;
                    var bDub = isDub(b.name) ? 1 : 0;
                    if (aDub !== bDub) return bDub - aDub;
                    return 0;
                });
            }

            // Добавление меток качества
            if (showLabel) {
                sorted.forEach(function(s) {
                    if (s.name) s.name = addQualityLabel(s);
                });
            }

            return origStartSource.call(this, sorted);
        };
        console.log('[Quality Sorter] Компонент "lampac" пропатчен');
    }

    // ============================================================
    // 4. Запуск
    // ============================================================
    registerSettings();
    if (window.Lampa && Lampa.Component) {
        patchLampac();
    } else {
        (function wait() {
            if (window.Lampa && Lampa.Component) {
                patchLampac();
            } else {
                setTimeout(wait, 500);
            }
        })();
    }
})();