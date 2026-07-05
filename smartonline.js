/**
 * Online Source Manager - DOM Version
 * Версия: 6.0.0
 * Фильмы: сортировка 1 раз | Сериалы: сортировка переводов + сезонов
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    var DEBUG = true;
    var sortTimeout = null;
    var moviesSorted = false;
    var isSorting = false;

    function log() {
        if (!DEBUG) return;
        console.log.apply(console, ['[OSM]'].concat(Array.prototype.slice.call(arguments)));
    }

    log('========================================');
    log('Online Source Manager v6.0.0');
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
    // 2. Проверка: фильм или сериал
    // ============================================================
    function isSerial() {
        var active = Lampa.Activity.active();
        if (active && active.movie && active.movie.name) {
            return true;
        }

        var episodeNumbers = $('.online-prestige__episode-number');
        if (episodeNumbers.length > 0) {
            return true;
        }

        var seasonItems = $('.selectbox-item');
        if (seasonItems.length > 0) {
            var parentContainer = seasonItems.parent().parent();
            var titleElement = parentContainer.find('.selectbox__title');
            var titleText = titleElement.text().trim();
            if (titleText.indexOf('Сезон') !== -1 || titleText.indexOf('Season') !== -1) {
                return true;
            }
        }

        return false;
    }

    // ============================================================
    // 3. Сортировка DOM-элементов
    // ============================================================
    function sortElements(selector, getScoreFn, preserveActive) {
        var elements = $(selector);
        if (elements.length < 2) return false;

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

        items.sort(function(a, b) {
            if (preserveActive !== false) {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
            }
            if (a.score !== b.score) return b.score - a.score;
            return a.text.localeCompare(b.text);
        });

        var parent = elements.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < items.length; i++) {
                container.append(items[i].$el);
            }
            parent.html(container.html());

            if (activeIndex >= 0) {
                var newItems = parent.find(selector);
                for (var i = 0; i < newItems.length && i < items.length; i++) {
                    if ($(newItems[i]).text().trim() === items[i].text.trim()) {
                        $(newItems[i]).addClass('focus');
                        break;
                    }
                }
            }

            return true;
        }

        return false;
    }

    // ============================================================
    // 4. Сортировка сезонов (от последнего к первому)
    // ============================================================
    function sortSeasons() {
        var seasonItems = $('.selectbox-item');
        if (seasonItems.length < 2) return false;

        var parentContainer = seasonItems.parent().parent();
        var titleElement = parentContainer.find('.selectbox__title');
        var titleText = titleElement.text().trim();

        if (titleText.indexOf('Сезон') === -1 && titleText.indexOf('Season') === -1) {
            return false;
        }

        log('Сортировка сезонов: от последнего к первому');

        var items = [];
        var activeIndex = -1;

        seasonItems.each(function(index) {
            var $el = $(this);
            var text = $el.text().trim();
            var isActive = $el.hasClass('focus') || $el.hasClass('active') || $el.hasClass('selected');

            // Извлекаем номер сезона
            var seasonMatch = text.match(/(\d+)/);
            var seasonNum = seasonMatch ? parseInt(seasonMatch[1], 10) : 0;

            if (isActive) activeIndex = index;

            items.push({
                $el: $el,
                text: text,
                season: seasonNum,
                active: isActive,
                index: index
            });
        });

        // Сортируем от большего к меньшему
        items.sort(function(a, b) {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            return b.season - a.season;
        });

        var parent = seasonItems.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < items.length; i++) {
                container.append(items[i].$el);
            }
            parent.html(container.html());

            if (activeIndex >= 0) {
                var newItems = parent.find('.selectbox-item');
                for (var i = 0; i < newItems.length && i < items.length; i++) {
                    if ($(newItems[i]).text().trim() === items[i].text.trim()) {
                        $(newItems[i]).addClass('focus');
                        break;
                    }
                }
            }

            log('Сезоны отсортированы: ' + items.map(function(i) { return i.season; }).join(' → '));
            return true;
        }

        return false;
    }

    // ============================================================
    // 5. Основная функция сортировки
    // ============================================================
    function sortDom(force) {
        var isSerialContent = isSerial();

        if (isSerialContent) {
            // ============================================================
            // СЕРИАЛЫ: сортируем переводы и сезоны
            // ============================================================
            log('Сериал: сортируем переводы и сезоны...');

            // 5.1 Сортировка сезонов (от последнего к первому)
            sortSeasons();

            // 5.2 Сортировка фильтра "Переводы"
            var filterItems = $('.selectbox-item');
            if (filterItems.length > 1) {
                var parentContainer = filterItems.parent().parent();
                var titleElement = parentContainer.find('.selectbox__title');
                var titleText = titleElement.text().trim();

                // Ищем фильтр "Переводы" или "Voice"
                if (titleText.indexOf('Перевод') !== -1 || 
                    titleText.indexOf('Voice') !== -1 ||
                    titleText.indexOf('Озвучка') !== -1) {
                    log('Найден фильтр переводов, сортируем...');
                    sortElements('.selectbox-item', function(text) {
                        return voiceWeight(text);
                    }, true);
                }
            }

            // 5.3 Сортировка кнопок озвучек
            var voiceButtons = $('.videos__button');
            if (voiceButtons.length > 1) {
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
                    sortElements('.videos__button', function(text) {
                        return voiceWeight(text);
                    }, true);
                }
            }
        } else {
            // ============================================================
            // ФИЛЬМЫ: сортируем видео 1 раз
            // ============================================================
            if (moviesSorted && !force) {
                return;
            }

            log('Фильм: сортируем видео (1 раз)...');

            var videoItems = $('.online-prestige--full');
            if (videoItems.length > 1) {
                var hasVariants = false;
                videoItems.each(function() {
                    var text = $(this).find('.online-prestige__title').text().trim();
                    if (text && voiceWeight(text) !== 0) {
                        hasVariants = true;
                    }
                });

                if (hasVariants) {
                    log('Найдены видео с переводами, сортируем...');
                    sortElements('.online-prestige--full', function(text, data, $el) {
                        var title = $el.find('.online-prestige__title').text().trim();
                        return voiceWeight(title) * 100 + extractQuality(title);
                    }, false);
                    moviesSorted = true;
                }
            }
        }

        // ============================================================
        // ОБЩЕЕ: сортировка источников
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
                sortElements('.selectbox-item', function(text) {
                    return extractQuality(text);
                }, true);
            }
        }
    }

    // ============================================================
    // 6. Наблюдение за DOM
    // ============================================================
    var observer = null;

    function startObserver() {
        if (observer) {
            observer.disconnect();
        }

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
                clearTimeout(sortTimeout);
                sortTimeout = setTimeout(function() {
                    isSorting = true;
                    sortDom();
                    isSorting = false;
                }, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ============================================================
    // 7. Периодическая проверка
    // ============================================================
    function startPeriodicCheck() {
        var checkCount = 0;
        setInterval(function() {
            checkCount++;
            if (checkCount % 5 === 0) {
                var hasItems = $('.selectbox-item').length > 1 || 
                              $('.online-prestige--full').length > 1 ||
                              $('.videos__button').length > 1;

                if (hasItems && !isSorting) {
                    sortDom();
                }
            }
        }, 1000);
    }

    // ============================================================
    // 8. Ручная сортировка
    // ============================================================
    window.sortOnlineSources = function(force) {
        log('Ручная сортировка' + (force ? ' (принудительная)' : ''));
        isSorting = true;
        sortDom(force);
        isSorting = false;
    };

    // ============================================================
    // 9. Запуск
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa) {
            setTimeout(init, 500);
            return;
        }

        setTimeout(function() { sortDom(); }, 1000);
        setTimeout(function() { sortDom(); }, 3000);

        startObserver();
        startPeriodicCheck();

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