/**
 * Voice Sorter for Lampac
 * Версия: 1.0.0
 * Сортировка озвучек в компоненте lampac
 */

(function() {
    'use strict';

    if (window.lampac_voice_sorter_loaded) return;
    window.lampac_voice_sorter_loaded = true;

    var DEBUG = true;

    function log() {
        if (!DEBUG) return;
        console.log.apply(console, ['[VoiceSorter]'].concat(Array.prototype.slice.call(arguments)));
    }

    // ============================================================
    // Приоритет озвучек (как в Smart Online)
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
        if (!buttons || buttons.length < 2) return buttons;

        return buttons.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            var aActive = a.active || a.selected ? 1 : 0;
            var bActive = b.active || b.selected ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;

            var scoreA = voiceWeight(nameA);
            var scoreB = voiceWeight(nameB);
            if (scoreA !== scoreB) return scoreB - scoreA;

            return nameA.localeCompare(nameB);
        });
    }

    // ============================================================
    // Сортировка видео для фильмов
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

    function sortVideos(videos) {
        if (!videos || videos.length < 2) return videos;

        return videos.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            var scoreA = voiceWeight(nameA);
            var scoreB = voiceWeight(nameB);
            if (scoreA !== scoreB) return scoreB - scoreA;

            var qualityA = extractQuality(nameA);
            var qualityB = extractQuality(nameB);
            if (qualityA !== qualityB) return qualityB - qualityA;

            return 0;
        });
    }

    // ============================================================
    // ПАТЧИМ КОМПОНЕНТ LAMPAC
    // ============================================================
    function patchLampacComponent() {
        log('Поиск компонента lampac...');

        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            log('Компонент lampac не найден, ждём...');
            setTimeout(patchLampacComponent, 1000);
            return;
        }

        log('Компонент lampac найден!');

        var proto = Lampac.prototype;
        var patched = false;

        // Патчим parse
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
                            var sorted = sortVoices(voiceButtons);
                            log('Озвучки отсортированы:', sorted.map(function(v) { return v.text; }));
                        }
                    }
                } catch(e) {}

                return result;
            };

            log('✅ parse пропатчен');
            patched = true;
        }

        // Патчим display
        if (typeof proto.display === 'function' && !proto._voiceDisplayPatched) {
            proto._voiceDisplayPatched = true;
            var originalDisplay = proto.display;

            proto.display = function(videos) {
                if (videos && videos.length > 1) {
                    var hasVoices = videos.some(function(v) {
                        return v.text || v.voice_name || v.title;
                    });

                    if (hasVoices) {
                        var sorted = sortVideos(videos);
                        log('Видео отсортированы');
                        return originalDisplay.call(this, sorted);
                    }
                }

                return originalDisplay.call(this, videos);
            };

            log('✅ display пропатчен');
            patched = true;
        }

        // Патчим filter
        if (typeof proto.filter === 'function' && !proto._voiceFilterPatched) {
            proto._voiceFilterPatched = true;
            var originalFilter = proto.filter;

            proto.filter = function(filter_items, choice) {
                if (filter_items && filter_items.voice && filter_items.voice.length > 1) {
                    var voiceItems = filter_items.voice.slice();
                    var voiceScores = voiceItems.map(function(name, index) {
                        return { name: name, index: index, score: voiceWeight(name) };
                    });
                    voiceScores.sort(function(a, b) {
                        if (a.score !== b.score) return b.score - a.score;
                        return a.name.localeCompare(b.name);
                    });
                    filter_items.voice = voiceScores.map(function(item) { return item.name; });
                    log('Фильтр озвучек отсортирован:', filter_items.voice);
                }

                return originalFilter.call(this, filter_items, choice);
            };

            log('✅ filter пропатчен');
            patched = true;
        }

        if (patched) {
            log('Патчинг lampac завершён!');
        }
    }

    // ============================================================
    // Перехват добавления компонента
    // ============================================================
    function overrideComponentAdd() {
        if (typeof Lampa.Component.add !== 'function') return;

        var originalAdd = Lampa.Component.add;
        Lampa.Component.add = function(name, comp) {
            originalAdd.call(this, name, comp);
            if (name === 'lampac') {
                log('Компонент lampac добавлен, патчим...');
                setTimeout(patchLampacComponent, 100);
            }
        };
        log('✅ Component.add перехвачен');
    }

    // ============================================================
    // ЗАПУСК
    // ============================================================
    function init() {
        log('========================================');
        log('Voice Sorter для lampac');
        log('Приоритет: hdrezka → Дубляж → LostFilm → Кубик → Остальные');
        log('========================================');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        patchLampacComponent();
        overrideComponentAdd();
        setInterval(patchLampacComponent, 5000);

        log('========================================');
        log('ГОТОВО!');
        log('========================================');
    }

    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                log('app:ready получено');
                init();
            }
        });
    }

    init();

})();