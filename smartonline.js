/**
 * Voice Sorter for Lampac
 * Версия: 1.0.0
 * Сортировка озвучек для компонента lampac
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
    function getVoiceScore(name) {
        if (!name) return 0;
        var text = name.toLowerCase();

        if (/hdrezka|hd\.rezka|rezka/.test(text)) return 1000;
        if (/дубляж|дублированный|дубликация|dub\b/.test(text)) return 900;
        if (/кубик|cube|куб|kubik/.test(text)) return 800;
        if (/lostfilm|lost\.film/.test(text)) return 700;
        if (/профессиональный|многоголосый|двухголосый/.test(text)) return 500;
        if (/любительский|одноголосый/.test(text)) return 300;
        if (/субтитры|sub|subtitles|оригинал|original/.test(text)) return 100;
        return 200;
    }

    function sortVoiceButtons(buttons) {
        if (!buttons || buttons.length < 2) return buttons;

        return buttons.slice().sort(function(a, b) {
            var nameA = a.text || a.title || a.name || '';
            var nameB = b.text || b.title || b.name || '';

            // Активная озвучка — наверх
            var aActive = a.active || a.selected ? 1 : 0;
            var bActive = b.active || b.selected ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;

            // Приоритет
            var scoreA = getVoiceScore(nameA);
            var scoreB = getVoiceScore(nameB);
            if (scoreA !== scoreB) return scoreB - scoreA;

            return nameA.localeCompare(nameB);
        });
    }

    // ============================================================
    // Главный патч
    // ============================================================
    function patchLampac() {
        log('Патчим компонент lampac...');

        // Получаем компонент lampac
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            log('Компонент lampac не найден, ждём...');
            setTimeout(patchLampac, 1000);
            return;
        }

        var proto = Lampac.prototype;

        // Патчим метод parse — здесь приходят кнопки озвучек
        if (typeof proto.parse === 'function' && !proto._voicePatched) {
            proto._voicePatched = true;
            var originalParse = proto.parse;

            proto.parse = function(str) {
                var result = originalParse.call(this, str);

                try {
                    // Ищем кнопки озвучек в ответе
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
                            log('Озвучки отсортированы:', sorted.map(function(v) { return v.text; }));
                        }
                    }
                } catch(e) {}

                return result;
            };

            log('✅ parse пропатчен');
        }

        // Патчим display — здесь отображаются видео (для фильмов)
        if (typeof proto.display === 'function' && !proto._displayPatched) {
            proto._displayPatched = true;
            var originalDisplay = proto.display;

            proto.display = function(videos) {
                if (videos && videos.length > 1) {
                    // Проверяем, есть ли видео с разными переводами
                    var hasVoices = videos.some(function(v) {
                        return v.text || v.voice_name || v.title;
                    });

                    if (hasVoices) {
                        var sorted = videos.slice().sort(function(a, b) {
                            var nameA = a.text || a.voice_name || a.title || '';
                            var nameB = b.text || b.voice_name || b.title || '';

                            var scoreA = getVoiceScore(nameA);
                            var scoreB = getVoiceScore(nameB);
                            if (scoreA !== scoreB) return scoreB - scoreA;

                            // По качеству
                            var qualityA = extractQuality(nameA);
                            var qualityB = extractQuality(nameB);
                            if (qualityA !== qualityB) return qualityB - qualityA;

                            return 0;
                        });

                        log('Видео отсортированы');
                        return originalDisplay.call(this, sorted);
                    }
                }

                return originalDisplay.call(this, videos);
            };

            log('✅ display пропатчен');
        }

        log('Патчинг lampac завершён');
    }

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

    // ============================================================
    // Запуск
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa) {
            log('Lampa не найдена, ждём...');
            setTimeout(init, 500);
            return;
        }

        patchLampac();

        // Патчим при добавлении нового компонента
        if (Lampa.Component && Lampa.Component.add) {
            var originalAdd = Lampa.Component.add;
            Lampa.Component.add = function(name, comp) {
                originalAdd.call(this, name, comp);
                if (name === 'lampac') {
                    log('Компонент lampac добавлен, патчим...');
                    setTimeout(patchLampac, 100);
                }
            };
        }

        log('Готово!');
    }

    // Ждём app:ready
    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                log('app:ready получено');
                init();
            }
        });
    }

    // Пробуем сразу
    init();

})();