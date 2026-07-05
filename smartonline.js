/**
 * Online Voice Sorter
 * Версия: 1.0.0
 * Сортировка переводов (озвучек) для сериалов и фильмов
 * Приоритет: hdrezka → Дубляж → LostFilm → Кубик → Остальные
 */

(function() {
    'use strict';

    if (window.online_voice_sorter_loaded) return;
    window.online_voice_sorter_loaded = true;

    // ============================================================
    // 1. Приоритет озвучек (как в Smart Online)
    // ============================================================
    function voiceWeight(name) {
        if (!name) return 0;
        var text = name.toLowerCase();
        var score = 0;

        // hdrezka - наивысший приоритет (как в Smart Online: +20)
        if (/hdrezka|hd\.rezka|rezka/.test(text)) score += 20;

        // Дубляж (как в Smart Online: +15)
        if (/дубляж|дублированный|дубликация|dub\b/.test(text)) score += 15;

        // Кубик в Кубе (как в Smart Online: +13)
        if (/кубик|cube|куб|kubik/.test(text)) score += 13;

        // LostFilm (как в Smart Online: +10)
        if (/lostfilm|lost\.film/.test(text)) score += 10;

        // Субтитры и оригинал - низкий приоритет (как в Smart Online: -10)
        if (/субтитры|sub\b|subtitles|original|оригинал|orig/.test(text)) score -= 10;

        // Английская озвучка - исключаем (как в Smart Online: -100)
        if (/english|eng|en\b/.test(text) && !/russian|rus/.test(text)) score -= 100;

        return score;
    }

    function sortVoices(buttons) {
        if (!buttons || !buttons.length) return buttons;

        return buttons.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            // Активная озвучка - наверх
            var aActive = a.active || a.selected ? 1 : 0;
            var bActive = b.active || b.selected ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;

            // Вес озвучки (как в Smart Online)
            var weightA = voiceWeight(nameA);
            var weightB = voiceWeight(nameB);
            if (weightA !== weightB) return weightB - weightA;

            return nameA.localeCompare(nameB);
        });
    }

    // ============================================================
    // 2. Качество для видео (фильмы)
    // ============================================================
    function detectQuality(value) {
        if (!value) return 0;
        var text = value.toLowerCase();
        if (/(2160|4k|uhd|ultra[\s-]?hd|3840)/i.test(text)) return 2160;
        if (/(1080|full[\s-]?hd|fhd|1920)/i.test(text)) return 1080;
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 720;
        if (/(480|sd|640|854)/i.test(text)) return 480;
        return 0;
    }

    function getItemQuality(item) {
        var text = item.text || item.title || item.name || '';
        var quality = detectQuality(text);
        if (item.quality) {
            var q = detectQuality(item.quality);
            if (q > quality) quality = q;
        }
        return quality;
    }

    function sortVideos(videos) {
        if (!videos || !videos.length) return videos;

        return videos.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            // 1. Сначала по весу озвучки (hdrezka → наверх)
            var weightA = voiceWeight(nameA);
            var weightB = voiceWeight(nameB);
            if (weightA !== weightB) return weightB - weightA;

            // 2. Затем по качеству (2160p → 1080p → ...)
            var qualityA = getItemQuality(a);
            var qualityB = getItemQuality(b);
            if (qualityA !== qualityB) return qualityB - qualityA;

            return 0;
        });
    }

    // ============================================================
    // 3. Патч компонентов
    // ============================================================
    function patchComponent(ComponentConstructor, name) {
        if (!ComponentConstructor || !ComponentConstructor.prototype) return;
        if (ComponentConstructor._voiceSorterPatched) return;

        var proto = ComponentConstructor.prototype;
        var patched = false;

        // Патчим parse для сортировки озвучек (сериалы)
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
                            // Сохраняем для отладки
                            if (window._voice_debug) {
                                console.log('[VoiceSorter] Sorted voices:', sorted.map(function(v) { return v.text; }));
                            }
                        }
                    }
                } catch(e) {}

                return result;
            };
            patched = true;
        }

        // Патчим display для сортировки видео (фильмы)
        if (typeof proto.display === 'function' && !proto._voiceDisplayPatched) {
            proto._voiceDisplayPatched = true;
            var originalDisplay = proto.display;

            proto.display = function(videos) {
                var sorted = sortVideos(videos);
                return originalDisplay.call(this, sorted);
            };
            patched = true;
        }

        if (patched) {
            ComponentConstructor._voiceSorterPatched = true;
            console.log('[VoiceSorter] Patched component:', name);
        }
    }

    // ============================================================
    // 4. Перехват компонентов
    // ============================================================
    function patchExistingComponents() {
        if (!Lampa.Component || !Lampa.Component._components) return;

        var comps = Lampa.Component._components;
        for (var name in comps) {
            var comp = comps[name];
            if (!comp) continue;
            // Патчим только компоненты, связанные с онлайн-просмотром
            var nameLower = name.toLowerCase();
            if (nameLower.indexOf('lampac') !== -1 || 
                nameLower.indexOf('online') !== -1 ||
                nameLower.indexOf('bwa') === 0) {
                patchComponent(comp, name);
            }
        }
    }

    function overrideComponentAdd() {
        if (typeof Lampa.Component.add !== 'function') return;
        var originalAdd = Lampa.Component.add;

        Lampa.Component.add = function(name, comp) {
            originalAdd.call(this, name, comp);

            var nameLower = name.toLowerCase();
            if (nameLower.indexOf('lampac') !== -1 || 
                nameLower.indexOf('online') !== -1 ||
                nameLower.indexOf('bwa') === 0) {
                var instance = Lampa.Component.get(name);
                if (instance) {
                    patchComponent(instance, name);
                }
            }
        };
    }

    // ============================================================
    // 5. Патч фильтра "Переводы" в сериалах
    // ============================================================
    function patchFilterVoices() {
        if (!Lampa.Filter || !Lampa.Filter.prototype) return;

        var proto = Lampa.Filter.prototype;

        // Патчим onSelect для сортировки озвучек при открытии фильтра
        if (typeof proto.onSelect === 'function' && !proto._voiceFilterPatched) {
            proto._voiceFilterPatched = true;
            var originalOnSelect = proto.onSelect;

            proto.onSelect = function(type, a, b) {
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
                }
                return originalOnSelect.call(this, type, a, b);
            };
            console.log('[VoiceSorter] Patched Filter.onSelect');
        }

        // Патчим set для сортировки озвучек при создании фильтра
        if (typeof proto.set === 'function' && !proto._voiceSetPatched) {
            proto._voiceSetPatched = true;
            var originalSet = proto.set;

            proto.set = function(type, items) {
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
                        }
                    }
                }
                return originalSet.call(this, type, items);
            };
            console.log('[VoiceSorter] Patched Filter.set');
        }
    }

    // ============================================================
    // 6. Запуск
    // ============================================================
    function init() {
        console.log('[VoiceSorter] Инициализация...');
        console.log('[VoiceSorter] Приоритет: hdrezka → Дубляж → LostFilm → Кубик → Остальные');

        patchFilterVoices();
        overrideComponentAdd();
        patchExistingComponents();

        // Периодическая проверка для новых компонентов
        setInterval(patchExistingComponents, 5000);

        console.log('[VoiceSorter] Готово!');
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