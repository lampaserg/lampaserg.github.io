/**
 * Online Source Manager - DOM Version
 * Версия: 5.0.0
 * Прямое вмешательство в DOM для сортировки
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

    log('========================================');
    log('Online Source Manager v5.0.0 (DOM Version)');
    log('Приоритет: hdrezka → Дубляж → LostFilm → Кубик → Остальные');
    log('========================================');

    // ============================================================
    // 1. Приоритет озвучек
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

    function getVoiceScore(title) {
        if (!title) return 0;
        // Проверяем все возможные поля
        var text = title.text || title.title || title.name || title;
        if (typeof text === 'string') {
            return voiceWeight(text);
        }
        return 0;
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

    function getItemQuality(item) {
        var text = item.text || item.title || item.name || '';
        return extractQuality(text);
    }

    // ============================================================
    // 3. Сортировка DOM-элементов
    // ============================================================
    function sortDomElements(selector, getScoreFn, sortFn) {
        var elements = $(selector);
        if (elements.length < 2) return;

        log('Найдено ' + elements.length + ' элементов для сортировки по селектору: ' + selector);

        // Получаем данные каждого элемента
        var items = [];
        elements.each(function(index) {
            var $el = $(this);
            var text = $el.text().trim();
            var isActive = $el.hasClass('focus') || $el.hasClass('active') || $el.hasClass('selected');
            var data = $el.data();
            var score = getScoreFn(text, data, $el);
            items.push({
                $el: $el,
                text: text,
                active: isActive,
                score: score,
                index: index,
                data: data
            });
        });

        // Сортируем
        items.sort(function(a, b) {
            // Активные элементы — наверх
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            // По скору
            if (a.score !== b.score) return b.score - a.score;
            // По тексту
            return a.text.localeCompare(b.text);
        });

        // Переставляем в DOM
        var parent = elements.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < items.length; i++) {
                container.append(items[i].$el);
            }
            parent.html(container.html());

            // Восстанавливаем фокус на активном элементе
            for (var i = 0; i < items.length; i++) {
                if (items[i].active) {
                    var newItems = parent.find(selector);
                    if (newItems.length > i) {
                        newItems.eq(i).addClass('focus');
                    }
                }
            }

            log('Переупорядочено ' + items.length + ' элементов');
        }
    }

    // ============================================================
    // 4. Основная функция сортировки DOM
    // ============================================================
    function sortDom() {
        log('--- Сортировка DOM ---');

        // ============================================================
        // 4.1 Сортировка озвучек в фильтре (сериалы)
        // ============================================================
        // Ищем элементы озвучек в фильтре
        var voiceItems = $('.selectbox-item');
        if (voiceItems.length > 1) {
            // Проверяем, что это озвучки (по контексту)
            var parentText = voiceItems.parent().parent().find('.selectbox__title').text();
            if (parentText.indexOf('Перевод') !== -1 || parentText.indexOf('Voice') !== -1) {
                sortDomElements('.selectbox-item', function(text, data, $el) {
                    return voiceWeight(text);
                });
            }
        }

        // ============================================================
        // 4.2 Сортировка видео (фильмы и сериалы)
        // ============================================================
        var videoItems = $('.online-prestige--full');
        if (videoItems.length > 1) {
            var hasVoices = false;
            videoItems.each(function() {
                var text = $(this).find('.online-prestige__title').text().trim();
                if (text && (text.indexOf('дубляж') !== -1 || text.indexOf('HDrezka') !== -1 || text.indexOf('Dragon') !== -1)) {
                    hasVoices = true;
                }
            });

            if (hasVoices) {
                sortDomElements('.online-prestige--full', function(text, data, $el) {
                    var title = $el.find('.online-prestige__title').text().trim();
                    return voiceWeight(title) * 10 + extractQuality(title);
                });
            }
        }

        // ============================================================
        // 4.3 Сортировка источников в меню "Сортировать"
        // ============================================================
        var sourceItems = $('.selectbox-item');
        if (sourceItems.length > 1) {
            var parentText = sourceItems.parent().parent().find('.selectbox__title').text();
            if (parentText.indexOf('Источник') !== -1 || parentText.indexOf('Source') !== -1) {
                sortDomElements('.selectbox-item', function(text, data, $el) {
                    return extractQuality(text);
                });
            }
        }

        // ============================================================
        // 4.4 Кнопки озвучек в интерфейсе (videos__button)
        // ============================================================
        var voiceButtons = $('.videos__button');
        if (voiceButtons.length > 1) {
            // Проверяем, что это кнопки озвучек (а не что-то другое)
            var hasVoiceText = false;
            voiceButtons.each(function() {
                var text = $(this).text().trim();
                if (text && (text.indexOf('дубляж') !== -1 || text.indexOf('HDrezka') !== -1 || text.indexOf('LostFilm') !== -1)) {
                    hasVoiceText = true;
                }
            });

            if (hasVoiceText) {
                sortDomElements('.videos__button', function(text, data, $el) {
                    return voiceWeight(text);
                });
            }
        }

        log('--- Сортировка DOM завершена ---');
    }

    // ============================================================
    // 5. Наблюдение за DOM (MutationObserver)
    // ============================================================
    function startObserver() {
        log('Запуск MutationObserver...');

        var target = document.body;
        var observer = new MutationObserver(function(mutations) {
            var shouldSort = false;

            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.type === 'childList') {
                    // Проверяем, не появились ли новые элементы
                    var addedNodes = mutation.addedNodes;
                    for (var j = 0; j < addedNodes.length; j++) {
                        var node = addedNodes[j];
                        if (node.nodeType === 1) { // Element
                            var $node = $(node);
                            if ($node.find('.selectbox-item').length || 
                                $node.find('.online-prestige--full').length ||
                                $node.find('.videos__button').length ||
                                $node.hasClass('selectbox-item') ||
                                $node.hasClass('online-prestige--full') ||
                                $node.hasClass('videos__button')) {
                                shouldSort = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldSort) break;
            }

            if (shouldSort) {
                log('Обнаружены изменения в DOM, сортируем...');
                setTimeout(sortDom, 100);
                setTimeout(sortDom, 500);
                setTimeout(sortDom, 1000);
            }
        });

        observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });

        log('MutationObserver запущен');
        return observer;
    }

    // ============================================================
    // 6. Периодическая проверка
    // ============================================================
    function startPeriodicCheck() {
        log('Запуск периодической проверки...');

        var checkCount = 0;
        setInterval(function() {
            checkCount++;
            // Проверяем каждые 3 секунды, но не чаще чем раз в 10 циклов для экономии
            if (checkCount % 3 === 0) {
                // Проверяем, есть ли элементы для сортировки
                var hasItems = $('.selectbox-item').length > 1 || 
                              $('.online-prestige--full').length > 1 ||
                              $('.videos__button').length > 1;

                if (hasItems) {
                    log('Периодическая проверка #' + checkCount + ': найдены элементы');
                    sortDom();
                }
            }
        }, 1000);

        log('Периодическая проверка запущена');
    }

    // ============================================================
    // 7. Ручная сортировка (для вызова из консоли)
    // ============================================================
    window.sortOnlineSources = function() {
        log('Ручная сортировка');
        sortDom();
    };

    // ============================================================
    // 8. Запуск
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa) {
            log('Lampa не найдена, ждём...');
            setTimeout(init, 500);
            return;
        }

        // Первая сортировка через 1 секунду
        setTimeout(sortDom, 1000);
        setTimeout(sortDom, 3000);
        setTimeout(sortDom, 5000);

        // Запускаем наблюдатель
        startObserver();

        // Запускаем периодическую проверку
        startPeriodicCheck();

        log('========================================');
        log('ГОТОВО!');
        log('Для ручной сортировки вызовите: sortOnlineSources()');
        log('========================================');
    }

    // Ждём готовности Lampa
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