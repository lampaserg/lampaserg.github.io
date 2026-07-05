/**
 * Online Source Manager для lampac
 * Версия: 4.0.0
 * Полная сортировка: источники, озвучки, видео
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    var DEBUG = true;

    function log() {
        if (!DEBUG) return;
        console.log.apply(console, ['[OSM]'].concat(Array.prototype.slice.call(arguments)));
    }

    function logError() {
        console.error.apply(console, ['[OSM ERROR]'].concat(Array.prototype.slice.call(arguments)));
    }

    log('========================================');
    log('Online Source Manager v4.0.0');
    log('Приоритет: hdrezka → Дубляж → LostFilm → Кубик → Остальные');
    log('Минимальное качество: 1080p');
    log('========================================');

    // ============================================================
    // 1. Приоритет озвучек (как в Smart Online)
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

    // ============================================================
    // 2. Определение качества
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

    function getSourceQuality(source) {
        var name = source.name || source.title || '';
        var quality = extractQuality(name);
        if (source.quality) {
            var q = extractQuality(source.quality);
            if (q > quality) quality = q;
        }
        return quality;
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

    function addQualityLabel(source) {
        var q = getSourceQuality(source);
        if (!q) return source.name || source.title || '';
        var name = (source.name || source.title || '').replace(/\s*\(\d{3,4}p\)\s*/g, '').trim();
        return name + ' (' + q + 'p)';
    }

    // ============================================================
    // 3. Сортировка источников (startSource)
    // ============================================================
    function sortSources(sources) {
        if (!sources || !sources.length) return sources;

        var preferDub = Lampa.Storage.get('osm_prefer_dub', true);
        var showLabel = Lampa.Storage.get('osm_show_label', true);
        var minQuality = parseInt(Lampa.Storage.get('osm_min_quality', '1080'), 10);

        // Фильтр по качеству
        var filtered = sources.filter(function(s) {
            if (minQuality > 0) {
                return getSourceQuality(s) >= minQuality;
            }
            return true;
        });

        // Сортируем
        var available = [];
        var unavailable = [];
        for (var i = 0; i < filtered.length; i++) {
            if (filtered[i].ghost) unavailable.push(filtered[i]);
            else available.push(filtered[i]);
        }

        available.sort(function(a, b) {
            var qA = getSourceQuality(a);
            var qB = getSourceQuality(b);
            if (qA !== qB) return qB - qA;

            if (preferDub) {
                var dA = isDub(a.name || a.title || '') ? 1 : 0;
                var dB = isDub(b.name || b.title || '') ? 1 : 0;
                if (dA !== dB) return dB - dA;
            }

            return 0;
        });

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

    // ============================================================
    // 4. Сортировка озвучек (parse + filter)
    // ============================================================
    function sortVoiceButtons(buttons) {
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

    function sortVoiceArray(voiceArray) {
        if (!voiceArray || voiceArray.length < 2) return voiceArray;

        return voiceArray.slice().sort(function(a, b) {
            var scoreA = voiceWeight(a);
            var scoreB = voiceWeight(b);
            if (scoreA !== scoreB) return scoreB - scoreA;
            return a.localeCompare(b);
        });
    }

    // ============================================================
    // 5. Сортировка видео (display)
    // ============================================================
    function sortVideos(videos) {
        if (!videos || videos.length < 2) return videos;

        var preferDub = Lampa.Storage.get('osm_prefer_dub', true);

        return videos.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            // 1. По приоритету перевода
            var scoreA = voiceWeight(nameA);
            var scoreB = voiceWeight(nameB);
            if (scoreA !== scoreB) return scoreB - scoreA;

            // 2. По качеству
            var qualityA = getItemQuality(a);
            var qualityB = getItemQuality(b);
            if (qualityA !== qualityB) return qualityB - qualityA;

            // 3. При равном качестве - дубляж выше
            if (preferDub) {
                var dubA = isDub(nameA) ? 1 : 0;
                var dubB = isDub(nameB) ? 1 : 0;
                if (dubA !== dubB) return dubB - dubA;
            }

            return 0;
        });
    }

    // ============================================================
    // 6. ПАТЧИМ КОМПОНЕНТ LAMPAC
    // ============================================================
    function patchLampac() {
        log('Поиск компонента lampac...');

        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            log('Компонент lampac не найден, ждём...');
            setTimeout(patchLampac, 1000);
            return;
        }

        log('Компонент lampac найден!');

        var proto = Lampac.prototype;
        var patched = 0;

        // ============================================================
        // 6.1 Патчим startSource - сортировка источников
        // ============================================================
        if (typeof proto.startSource === 'function' && !proto._osm_startSource_patched) {
            proto._osm_startSource_patched = true;
            var originalStartSource = proto.startSource;

            proto.startSource = function(json) {
                log('startSource: было ' + (json ? json.length : 0) + ' источников');
                var sorted = sortSources(json);
                log('startSource: стало ' + (sorted ? sorted.length : 0) + ' источников');
                return originalStartSource.call(this, sorted);
            };

            log('✅ startSource пропатчен');
            patched++;
        }

        // ============================================================
        // 6.2 Патчим parse - сортировка озвучек в сериалах
        // ============================================================
        if (typeof proto.parse === 'function' && !proto._osm_parse_patched) {
            proto._osm_parse_patched = true;
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
                            var sorted = sortVoiceButtons(voiceButtons);
                            log('parse: озвучки отсортированы:', sorted.map(function(v) { return v.text; }));
                        }
                    }
                } catch(e) {}

                return result;
            };

            log('✅ parse пропатчен');
            patched++;
        }

        // ============================================================
        // 6.3 Патчим filter - сортировка озвучек в фильтре
        // ============================================================
        if (typeof proto.filter === 'function' && !proto._osm_filter_patched) {
            proto._osm_filter_patched = true;
            var originalFilter = proto.filter;

            proto.filter = function(filter_items, choice) {
                if (filter_items && filter_items.voice && filter_items.voice.length > 1) {
                    var sorted = sortVoiceArray(filter_items.voice);
                    filter_items.voice = sorted;
                    log('filter: озвучки в фильтре отсортированы:', sorted);
                }
                return originalFilter.call(this, filter_items, choice);
            };

            log('✅ filter пропатчен');
            patched++;
        }

        // ============================================================
        // 6.4 Патчим display - сортировка видео в фильмах
        // ============================================================
        if (typeof proto.display === 'function' && !proto._osm_display_patched) {
            proto._osm_display_patched = true;
            var originalDisplay = proto.display;

            proto.display = function(videos) {
                log('display: было ' + (videos ? videos.length : 0) + ' видео');
                if (videos && videos.length > 1) {
                    var hasVoices = videos.some(function(v) {
                        return v.text || v.voice_name || v.title;
                    });
                    if (hasVoices) {
                        var sorted = sortVideos(videos);
                        log('display: видео отсортированы');
                        return originalDisplay.call(this, sorted);
                    }
                }
                return originalDisplay.call(this, videos);
            };

            log('✅ display пропатчен');
            patched++;
        }

        log('Патчинг завершён, пропатчено ' + patched + ' методов');
    }

    // ============================================================
    // 7. Перехват добавления компонента
    // ============================================================
    function overrideComponentAdd() {
        if (typeof Lampa.Component.add !== 'function') return;

        var originalAdd = Lampa.Component.add;
        Lampa.Component.add = function(name, comp) {
            originalAdd.call(this, name, comp);
            if (name === 'lampac') {
                log('Компонент lampac добавлен, патчим...');
                setTimeout(patchLampac, 100);
            }
        };
        log('✅ Component.add перехвачен');
    }

    // ============================================================
    // 8. Настройки
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
            param: { name: 'osm_prefer_dub', type: 'trigger', default: true },
            field: { name: 'Предпочитать дубляж' }
        });

        Lampa.SettingsApi.addParam({
            component: 'online_source_manager',
            param: { name: 'osm_show_label', type: 'trigger', default: true },
            field: { name: 'Показывать качество в названии' }
        });

        Lampa.SettingsApi.addParam({
            component: 'online_source_manager',
            param: {
                name: 'osm_min_quality',
                type: 'select',
                values: { '0': 'Все', '480': '≥480p', '720': '≥720p', '1080': '≥1080p' },
                default: '1080'
            },
            field: { name: 'Минимальное качество' }
        });
    }

    // ============================================================
    // 9. ЗАПУСК
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        registerSettings();
        patchLampac();
        overrideComponentAdd();
        setInterval(patchLampac, 5000);

        log('Готово!');
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