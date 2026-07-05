(function() {
    'use strict';

    if (window.quality_sorter_plugin_loaded) return;
    window.quality_sorter_plugin_loaded = true;

    // ===== Функции определения качества =====
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

    function sortSourcesByQuality(sources) {
        if (!sources || !sources.length) return sources;
        var sorted = sources.slice();
        sorted.sort(function(a, b) {
            // Активные выше
            var aShow = a.show !== undefined ? a.show : true;
            var bShow = b.show !== undefined ? b.show : true;
            if (aShow && !bShow) return -1;
            if (!aShow && bShow) return 1;
            // По качеству (убывание)
            var aQuality = getQualityFromSource(a);
            var bQuality = getQualityFromSource(b);
            if (aQuality !== bQuality) return bQuality - aQuality;
            // По имени (алфавит)
            var aName = (a.name || a.title || '').toLowerCase();
            var bName = (b.name || b.title || '').toLowerCase();
            return aName.localeCompare(bName);
        });
        return sorted;
    }

    // ===== Патч компонента =====
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

        var originalStartSource = Lampac.prototype.startSource;
        Lampac.prototype.startSource = function(json) {
            var sorted = sortSourcesByQuality(json);
            return originalStartSource.call(this, sorted);
        };
        console.log('[Quality Sorter] Компонент "lampac" пропатчен');
    }

    // ===== Запуск =====
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