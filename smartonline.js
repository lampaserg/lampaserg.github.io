/**
 * Online Source Manager - DOM Version
 * Версия: 5.1.0
 * Исправлена сортировка переводов в сериалах
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    var DEBUG = true;
    var sortTimeout = null;

    function log() {
        if (!DEBUG) return;
        console.log.apply(console, ['[OSM]'].concat(Array.prototype.slice.call(arguments)));
    }

    log('========================================');
    log('Online Source Manager v5.1.0');
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
    // 2. Сортировка DOM-элементов (улучшенная)
    // ============================================================
    function sortElements(selector, getScoreFn, preserveActive) {
        var elements = $(selector);
        if (elements.length < 2) return false;

        log('Найдено ' + elements.length + ' элементов для сортировки по селектору: ' + selector);

        var items = [];
        var activeIndex = -1;

        elements.each(function(index) {
            var $el = $(this);
            var text = $el.text().trim();
            var isActive = $el.hasClass('focus') || $el.hasClass('active') || $el.hasClass('selected');
            var data = $el.data();
            var score = getScoreFn ? getScoreFn(text, data, $el) : voiceWeight(text);

            if (isActive) activeIndex = index;

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
            if (preserveActive !== false) {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
            }
            // По скору
            if (a.score !== b.score) return b.score - a.score;
            // По тексту
            return a.text.localeCompare(b.text);
        });

        // Переставляем в DOM
        var parent = elements.first().parent();
        if (parent && parent.length) {
            // Сохраняем активный элемент
            var activeEl = null;
            if (activeIndex >= 0 && activeIndex < items.length) {
                activeEl = items[activeIndex].$el;
            }

            var container = $('<div>');
            for (var i = 0; i < items.length; i++) {
                container.append(items[i].$el);
            }
            parent.html(container.html());

            // Восстанавливаем фокус
            if (activeEl) {
                var newItems = parent.find(selector);
                for (var i = 0; i < newItems.length; i++) {
                    if ($(newItems[i]).text().trim() === activeEl.text().trim()) {
                        $(newItems[i]).addClass('focus');
                        break;
                    }
                }
            }

            log('Переупорядочено ' + items.length + ' элементов');
            return true;
        }

        return false;
    }

    // ============================================================
    // 3. Основная функция сортировки
    // ============================================================
    function sortDom() {
        log('--- Сортировка DOM ---');

        var sorted = false;

        // ============================================================
        // 3.1 Сортировка озвучек в фильтре "Переводы" (сериалы)
        // ============================================================
        // Ищем элементы в фильтре
        var filterItems = $('.selectbox-item');
        if (filterItems.length > 1) {
            // Проверяем контекст - ищем заголовок "Переводы"
            var parentContainer = filterItems.parent().parent();
            var titleElement = parentContainer.find('.selectbox__title');
            var titleText = titleElement.text().trim();

            log('Фильтр: заголовок = "' + titleText + '"');

            // Если это переводы или озвучки
            if (titleText.indexOf('Перевод') !== -1 || 
                titleText.indexOf('Voice') !== -1 ||
                titleText.indexOf('Озвучка') !== -1) {
                log('Найден фильтр переводов, сортируем...');
                var result = sortElements('.selectbox-item', function(text) {
                    return voiceWeight(text);
                }, true);
                if (result) sorted = true;
            }
        }

        // ============================================================
        // 3.2 Сортировка кнопок озвучек (videos__button) - для сериалов
        // ============================================================
        var voiceButtons = $('.videos__button');
        if (voiceButtons.length > 1) {
            // Проверяем, что это действительно кнопки озвучек
            var hasVoiceText = false;
            voiceButtons.each(function() {
                var text = $(this).text().trim();
                if (text && (text.indexOf('дубляж') !== -1 || 
                    text.indexOf('HDrezka') !== -1 || 
                    text.indexOf('LostFilm') !== -1 ||
                    text.indexOf('Кубик') !== -1)) {
                    hasVoiceText = true;
                }
            });

            if (hasVoiceText) {
                log('Найдены кнопки озвучек, сортируем...');
                var result = sortElements('.videos__button', function(text) {
                    return voiceWeight(text);
                }, true);
                if (result) sorted = true;
            }
        }

        // ============================================================
        // 3.3 Сортировка видео в фильмах
        // ============================================================
        var videoItems = $('.online-prestige--full');
        if (videoItems.length > 1) {
            // Проверяем, есть ли разные переводы
            var hasVariants = false;
            var titles = [];
            videoItems.each(function() {
                var text = $(this).find('.online-prestige__title').text().trim();
                if (text) titles.push(text);
            });

            // Если есть разные названия с разными переводами
            if (titles.length > 1) {
                var uniqueTitles = {};
                for (var i = 0; i < titles.length; i++) {
                    var weight = voiceWeight(titles[i]);
                    if (weight !== 0) {
                        hasVariants = true;
                        break;
                    }
                }
            }

            if (hasVariants || titles.length > 1) {
                log('Найдены видео с переводами, сортируем...');
                var result = sortElements('.online-prestige--full', function(text, data, $el) {
                    var title = $el.find('.online-prestige__title').text().trim();
                    return voiceWeight(title) * 100 + extractQuality(title);
                }, false);
                if (result) sorted = true;
            }
        }

        // ============================================================
        // 3.4 Сортировка источников в меню "Сортировать"
        // ============================================================
        var sourceItems = $('.selectbox-item');
        if (sourceItems.length > 1) {
            var parentContainer = sourceItems.parent().parent();
            var titleElement = parentContainer.find('.selectbox__title');
            var titleText = titleElement.text().trim();

            if (titleText.indexOf('Источник') !== -1 || 
                titleText.indexOf('Source') !== -1 ||
                titleText.indexOf('Сортировать') !== -1) {
                log('Найдены источники, сортируем...');
                var result = sortElements('.selectbox-item', function(text) {
                    return extractQuality(text);
                }, true);
                if (result) sorted = true;
            }
        }

        if (sorted) {
            log('--- Сортировка DOM завершена (были изменения) ---');
        } else {
            log('--- Сортировка DOM завершена (изменений не было) ---');
        }

        return sorted;
    }

    // ============================================================
    // 4. Наблюдение за DOM (оптимизированное)
    // ============================================================
    var observer = null;
    var isSorting = false;

    function startObserver() {
        if (observer) {
            observer.disconnect();
        }

        log('Запуск MutationObserver...');

        observer = new MutationObserver(function(mutations) {
            if (isSorting) return;

            var shouldSort = false;
            var checkSelectors = ['.selectbox-item', '.videos__button', '.online-prestige--full'];

            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.type === 'childList') {
                    var addedNodes = mutation.addedNodes;
                    for (var j = 0; j < addedNodes.length; j++) {
                        var node = addedNodes[j];
                        if (node.nodeType === 1) {
                            var $node = $(node);
                            for (var s = 0; s < checkSelectors.length; s++) {
                                if ($node.is(checkSelectors[s]) || $node.find(checkSelectors[s]).length) {
                                    shouldSort = true;
                                    break;
                                }
                            }
                            if (shouldSort) break;
                        }
                    }
                }
                if (shouldSort) break;
            }

            if (shouldSort) {
                log('Обнаружены изменения в DOM, планируем сортировку...');
                clearTimeout(sortTimeout);
                sortTimeout = setTimeout(function() {
                    isSorting = true;
                    sortDom();
                    isSorting = false;
                }, 300);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('MutationObserver запущен');
    }

    // ============================================================
    // 5. Периодическая проверка (реже)
    // ============================================================
    function startPeriodicCheck() {
        log('Запуск периодической проверки...');

        var checkCount = 0;
        setInterval(function() {
            checkCount++;
            if (checkCount % 5 === 0) { // Каждые 5 секунд
                var hasItems = $('.selectbox-item').length > 1 || 
                              $('.online-prestige--full').length > 1 ||
                              $('.videos__button').length > 1;

                if (hasItems && !isSorting) {
                    log('Периодическая проверка #' + checkCount);
                    isSorting = true;
                    sortDom();
                    isSorting = false;
                }
            }
        }, 1000);

        log('Периодическая проверка запущена (каждые 5 сек)');
    }

    // ============================================================
    // 6. Ручная сортировка
    // ============================================================
    window.sortOnlineSources = function() {
        log('Ручная сортировка');
        isSorting = true;
        sortDom();
        isSorting = false;
    };

    // ============================================================
    // 7. Запуск
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa) {
            log('Lampa не найдена, ждём...');
            setTimeout(init, 500);
            return;
        }

        // Первая сортировка с задержками
        setTimeout(function() { sortDom(); }, 1000);
        setTimeout(function() { sortDom(); }, 3000);
        setTimeout(function() { sortDom(); }, 5000);

        // Запускаем наблюдатель
        startObserver();

        // Запускаем периодическую проверку
        startPeriodicCheck();

        log('========================================');
        log('ГОТОВО!');
        log('Для ручной сортировки вызовите: sortOnlineSources()');
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