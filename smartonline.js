/**
 * Online Source Manager
 * Версия: 9.4.0
 * Автоматическая сортировка фильтров при открытии балансера
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    var DEBUG = true;

    function log() {
        if (!DEBUG) return;
        var args = Array.prototype.slice.call(arguments);
        console.log.apply(console, ['[OSM]'].concat(args));
    }

    function logError() {
        var args = Array.prototype.slice.call(arguments);
        console.error.apply(console, ['[OSM ОШИБКА]'].concat(args));
    }

    log('========================================');
    log('Online Source Manager v9.4.0');
    log('Приоритет: hdrezka -> Дубляж -> LostFilm -> Кубик -> Остальные');
    log('Автосортировка фильтров при открытии балансера');
    log('========================================');

    // ============================================================
    // 1. Приоритет озвучек
    // ============================================================
    function voiceWeight(name) {
        if (!name) return 0;
        var text = name.toLowerCase();
        if (/hdrezka|hd\.rezka|rezka/.test(text)) return 20;
        if (/дубляж|дублированный|дубликация|dub\b/.test(text)) return 15;
        if (/кубик|cube|куб|kubik/.test(text)) return 13;
        if (/lostfilm|lost\.film/.test(text)) return 10;
        if (/субтитры|sub\b|subtitles|original|оригинал|orig/.test(text)) return -10;
        if (/english|eng|en\b/.test(text) && !/russian|rus/.test(text)) return -100;
        return 0;
    }

    function qualityScore(name) {
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

    function isHdrezka(name) {
        if (!name) return false;
        return /hdrezka|hd\.rezka|rezka/i.test(name);
    }

    function getElementText($el) {
        if (!$el || !$el.length) return '';
        return $el.text().trim();
    }

    function isActive($el) {
        if (!$el || !$el.length) return false;
        return $el.hasClass('focus') || $el.hasClass('active') || $el.hasClass('selected');
    }

    function getSeasonNumber(text) {
        var match = text.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    // ============================================================
    // 2. Сортировка элементов
    // ============================================================
    function sortItems(selector, scoreFn, preserveActive, contextName) {
        var items = $(selector);
        var count = items.length;

        if (count < 2) return false;

        log('[' + contextName + '] Найдено ' + count + ' элементов');

        var data = [];
        var activeText = '';
        var hasHdrezka = false;

        items.each(function(index) {
            var $el = $(this);
            var text = getElementText($el);
            var active = isActive($el);
            var score = scoreFn ? scoreFn(text) : 0;

            if (active) activeText = text;
            if (isHdrezka(text)) hasHdrezka = true;

            data.push({ $el: $el, text: text, active: active, score: score, index: index });
        });

        log('[' + contextName + '] Активная: "' + activeText + '"');

        data.sort(function(a, b) {
            if (hasHdrezka) {
                var aIsHdrezka = isHdrezka(a.text);
                var bIsHdrezka = isHdrezka(b.text);
                if (aIsHdrezka && !bIsHdrezka) return -1;
                if (!aIsHdrezka && bIsHdrezka) return 1;
            }

            if (preserveActive !== false) {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
            }

            if (a.score !== b.score) return b.score - a.score;
            return a.text.localeCompare(b.text);
        });

        var parent = items.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < data.length; i++) {
                container.append(data[i].$el);
            }
            parent.html(container.html());

            if (activeText) {
                var newItems = parent.find(selector);
                for (var i = 0; i < newItems.length; i++) {
                    if (getElementText($(newItems[i])) === activeText) {
                        $(newItems[i]).addClass('focus');
                        break;
                    }
                }
            }

            log('[' + contextName + '] Успешно отсортировано ' + data.length + ' элементов');
            return true;
        }

        return false;
    }

    // ============================================================
    // 3. Сортировка сезонов (от последнего к первому)
    // ============================================================
    function sortSeasonsInFilter() {
        log('--- Сортировка сезонов ---');

        var items = $('.selectbox-item');
        if (items.length < 2) {
            log('Сезоны: меньше 2 элементов, пропускаем');
            return false;
        }

        var parentContainer = items.parent().parent();
        var title = parentContainer.find('.selectbox__title').text().trim();

        if (title.indexOf('Сезон') === -1 && title.indexOf('Season') === -1) {
            log('Сезоны: это не фильтр сезонов, пропускаем');
            return false;
        }

        log('Сезоны: сортируем ' + items.length + ' сезонов от большего к меньшему');

        var data = [];
        var activeText = '';

        items.each(function() {
            var $el = $(this);
            var text = getElementText($el);
            var active = isActive($el);
            var num = getSeasonNumber(text);

            if (active) activeText = text;

            data.push({ $el: $el, text: text, active: active, num: num });
        });

        data.sort(function(a, b) {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            return b.num - a.num;
        });

        var parent = items.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < data.length; i++) {
                container.append(data[i].$el);
            }
            parent.html(container.html());

            if (activeText) {
                var newItems = parent.find('.selectbox-item');
                for (var i = 0; i < newItems.length; i++) {
                    if (getElementText($(newItems[i])) === activeText) {
                        $(newItems[i]).addClass('focus');
                        break;
                    }
                }
            }

            log('Сезоны: отсортированы: ' + data.map(function(d) { return d.num; }).join(' -> '));
            return true;
        }

        return false;
    }

    // ============================================================
    // 4. Сортировка переводов в фильтре
    // ============================================================
    function sortVoicesInFilter() {
        log('--- Сортировка переводов ---');

        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Перевод') !== -1 || 
                title.indexOf('Voice') !== -1 || 
                title.indexOf('Озвучка') !== -1) {
                log('Найден фильтр переводов: "' + title + '"');
                var result = sortItems('.selectbox-item', voiceWeight, true, 'Переводы');
                if (result) found = true;
            }
        });

        if (!found) {
            log('Переводы: фильтр не найден');
        }

        return found;
    }

    // ============================================================
    // 5. Сортировка источников
    // ============================================================
    function sortSourcesInFilter() {
        log('--- Сортировка источников ---');

        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Источник') !== -1 || 
                title.indexOf('Source') !== -1 || 
                title.indexOf('Сортировать') !== -1) {
                log('Найден фильтр источников: "' + title + '"');
                var result = sortItems('.selectbox-item', qualityScore, true, 'Источники');
                if (result) found = true;
            }
        });

        if (!found) {
            log('Источники: фильтр не найден');
        }

        return found;
    }

    // ============================================================
    // 6. Сортировка видео в фильмах
    // ============================================================
    function sortMovies() {
        log('--- Сортировка фильмов ---');

        var videos = $('.online-prestige--full');
        if (videos.length < 2) {
            log('Фильмы: меньше 2 видео, пропускаем');
            return false;
        }

        var hasVariants = false;
        videos.each(function() {
            var text = $(this).find('.online-prestige__title').text().trim();
            if (voiceWeight(text) !== 0) {
                hasVariants = true;
            }
        });

        if (!hasVariants) {
            log('Фильмы: разные переводы не найдены, пропускаем');
            return false;
        }

        log('Фильмы: сортируем ' + videos.length + ' видео');

        var data = [];
        videos.each(function() {
            var $el = $(this);
            var title = $el.find('.online-prestige__title').text().trim();
            var score = voiceWeight(title) * 100 + qualityScore(title);
            data.push({ $el: $el, text: title, score: score });
        });

        data.sort(function(a, b) {
            if (a.score !== b.score) return b.score - a.score;
            return a.text.localeCompare(b.text);
        });

        var parent = videos.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < data.length; i++) {
                container.append(data[i].$el);
            }
            parent.html(container.html());
            log('Фильмы: успешно отсортированы');
            return true;
        }

        return false;
    }

    // ============================================================
    // 7. ГЛАВНАЯ ФУНКЦИЯ
    // ============================================================
    function sortAll() {
        log('========================================');
        log('>>> СОРТИРОВКА <<<');
        log('========================================');

        try {
            sortSeasonsInFilter();
            sortVoicesInFilter();
            sortSourcesInFilter();
            sortMovies();

            log('========================================');
            log('СОРТИРОВКА ЗАВЕРШЕНА');
            log('========================================');

        } catch(e) {
            logError('Ошибка:', e);
        }
    }

    // ============================================================
    // 8. АКТИВНОЕ СЛЕЖЕНИЕ
    // ============================================================
    function startWatching() {
        log('Запуск активного слежения...');

        var checkInterval = setInterval(function() {
            var hasSelectbox = $('.selectbox').length > 0;
            var hasPrestige = $('.online-prestige--full').length > 1;

            if (hasSelectbox || hasPrestige) {
                log('Обнаружены фильтры или видео, сортируем...');
                sortAll();
            }
        }, 1000);

        var observer = new MutationObserver(function(mutations) {
            var shouldSort = false;

            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.type === 'childList') {
                    var nodes = mutation.addedNodes;
                    for (var j = 0; j < nodes.length; j++) {
                        var node = nodes[j];
                        if (node.nodeType === 1) {
                            var $node = $(node);
                            if ($node.is('.selectbox') || 
                                $node.is('.selectbox-item') ||
                                $node.is('.online-prestige--full') ||
                                $node.find('.selectbox').length ||
                                $node.find('.online-prestige--full').length) {
                                shouldSort = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldSort) break;
            }

            if (shouldSort) {
                log('DOM изменился, сортируем...');
                clearTimeout(window._sortTimer);
                window._sortTimer = setTimeout(sortAll, 200);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('Активное слежение запущено');
    }

    // ============================================================
    // 9. Инициализация
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        log('Lampa готова');

        setTimeout(sortAll, 500);
        setTimeout(sortAll, 1500);
        setTimeout(sortAll, 3000);
        setTimeout(sortAll, 5000);

        startWatching();

        log('========================================');
        log('ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА');
        log('========================================');
        log('Ручная сортировка: sortAll()');
        log('========================================');
    }

    window.sortAll = sortAll;

    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                log('app:ready получено');
                init();
            }
        });
    } else {
        setTimeout(init, 1000);
    }

})();