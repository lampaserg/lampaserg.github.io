/**
 * Online Source Manager
 * Версия: 10.4.0
 * Сортировка фильтров "Переводы" и "Сезон"
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    var DEBUG = true;
    var sortTimer = null;

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
    log('Online Source Manager v10.4.0');
    log('Сортировка: Переводы (hdrezka -> Дубляж) и Сезоны (от последнего к первому)');
    log('========================================');

    // ============================================================
    // 1. Приоритет озвучек (для переводов)
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
    // 2. Сортировка элементов внутри контейнера
    // ============================================================
    function sortItemsInContainer(container, scoreFn, preserveActive, contextName) {
        var items = container.find('.selectbox-item');
        var count = items.length;

        if (count < 2) return false;

        log('[' + contextName + '] Найдено ' + count + ' элементов');

        var data = [];
        var activeText = '';

        items.each(function(index) {
            var $el = $(this);
            var text = getElementText($el);
            var active = isActive($el);
            var score = scoreFn ? scoreFn(text) : 0;

            if (active) activeText = text;

            data.push({ $el: $el, text: text, active: active, score: score, index: index });
        });

        log('[' + contextName + '] До: ' + JSON.stringify(data.map(function(d) { return d.text + (d.active ? ' [A]' : ''); })));

        data.sort(function(a, b) {
            if (preserveActive !== false) {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
            }

            if (a.score !== b.score) return b.score - a.score;
            return a.text.localeCompare(b.text);
        });

        log('[' + contextName + '] После: ' + JSON.stringify(data.map(function(d) { return d.text + (d.active ? ' [A]' : ''); })));

        var parent = items.first().parent();
        if (parent && parent.length) {
            var containerEl = $('<div>');
            for (var i = 0; i < data.length; i++) {
                containerEl.append(data[i].$el);
            }
            parent.html(containerEl.html());

            if (activeText) {
                var newItems = parent.find('.selectbox-item');
                for (var i = 0; i < newItems.length; i++) {
                    if (getElementText($(newItems[i])) === activeText) {
                        $(newItems[i]).addClass('focus');
                        break;
                    }
                }
            }

            log('[' + contextName + '] Отсортировано');
            return true;
        }

        return false;
    }

    // ============================================================
    // 3. Сортировка фильтра "Переводы"
    // ============================================================
    function sortVoicesFilter() {
        log('--- Поиск фильтра "Переводы" ---');

        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            // Проверяем, что это фильтр переводов
            if (title.indexOf('Перевод') !== -1 || 
                title.indexOf('Voice') !== -1 || 
                title.indexOf('Озвучка') !== -1) {
                log('Найден фильтр: "' + title + '"');
                var result = sortItemsInContainer($container, voiceWeight, true, 'Переводы');
                if (result) found = true;
            }
        });

        if (!found) {
            log('Фильтр "Переводы" не найден');
        }

        return found;
    }

    // ============================================================
    // 4. Сортировка фильтра "Сезон"
    // ============================================================
    function sortSeasonsFilter() {
        log('--- Поиск фильтра "Сезон" ---');

        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            // Проверяем, что это фильтр сезонов
            if (title.indexOf('Сезон') !== -1 || 
                title.indexOf('Season') !== -1) {
                log('Найден фильтр: "' + title + '"');

                var items = $container.find('.selectbox-item');
                if (items.length < 2) {
                    log('Сезонов меньше 2, пропускаем');
                    return;
                }

                log('Сезонов: ' + items.length);

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

                log('До: ' + JSON.stringify(data.map(function(d) { return d.num + (d.active ? ' [A]' : ''); })));

                // Сортируем от большего к меньшему
                data.sort(function(a, b) {
                    if (a.active && !b.active) return -1;
                    if (!a.active && b.active) return 1;
                    return b.num - a.num;
                });

                log('После: ' + JSON.stringify(data.map(function(d) { return d.num + (d.active ? ' [A]' : ''); })));

                var parent = items.first().parent();
                if (parent && parent.length) {
                    var containerEl = $('<div>');
                    for (var i = 0; i < data.length; i++) {
                        containerEl.append(data[i].$el);
                    }
                    parent.html(containerEl.html());

                    if (activeText) {
                        var newItems = parent.find('.selectbox-item');
                        for (var i = 0; i < newItems.length; i++) {
                            if (getElementText($(newItems[i])) === activeText) {
                                $(newItems[i]).addClass('focus');
                                break;
                            }
                        }
                    }

                    log('Сезоны отсортированы');
                    found = true;
                }
            }
        });

        if (!found) {
            log('Фильтр "Сезон" не найден');
        }

        return found;
    }

    // ============================================================
    // 5. ГЛАВНАЯ СОРТИРОВКА
    // ============================================================
    function sortAll() {
        log('>>> СОРТИРОВКА <<<');

        try {
            sortSeasonsFilter();
            sortVoicesFilter();

            log('СОРТИРОВКА ЗАВЕРШЕНА');

        } catch(e) {
            logError('Ошибка:', e);
        }
    }

    // ============================================================
    // 6. ПЕРЕХВАТ ОТКРЫТИЯ ФИЛЬТРА
    // ============================================================
    function hookFilterOpen() {
        log('Перехват открытия фильтра...');

        // Перехватываем появление selectbox
        var observer = new MutationObserver(function() {
            if ($('.selectbox').length > 0) {
                log('Появился фильтр, сортируем...');
                clearTimeout(sortTimer);
                sortTimer = setTimeout(sortAll, 200);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Перехватываем клик по кнопкам фильтра
        $(document).on('hover:enter', '.filter--sort, .filter--filter, .filter--search', function() {
            log('Открыт фильтр, сортируем...');
            clearTimeout(sortTimer);
            sortTimer = setTimeout(sortAll, 300);
        });
    }

    // ============================================================
    // 7. ПЕРЕХВАТ СМЕНЫ ИСТОЧНИКА
    // ============================================================
    function hookSourceChange() {
        log('Перехват смены источника...');

        // Следим за изменением балансера
        var lastBalanser = Lampa.Storage.get('active_balanser', '');
        setInterval(function() {
            var currentBalanser = Lampa.Storage.get('active_balanser', '');
            if (currentBalanser !== lastBalanser) {
                log('Смена источника: ' + lastBalanser + ' -> ' + currentBalanser);
                lastBalanser = currentBalanser;
                setTimeout(sortAll, 500);
                setTimeout(sortAll, 1000);
            }
        }, 1000);

        // Перехватываем клик по источникам
        $(document).on('hover:enter', '.selectbox-item', function() {
            var parentContainer = $(this).closest('.selectbox');
            var title = parentContainer.find('.selectbox__title').text().trim();

            if (title.indexOf('Источник') !== -1 || 
                title.indexOf('Source') !== -1 || 
                title.indexOf('Сортировать') !== -1) {
                log('Выбран источник, сортируем...');
                clearTimeout(sortTimer);
                sortTimer = setTimeout(sortAll, 500);
            }
        });
    }

    // ============================================================
    // 8. ЗАПУСК
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        log('Lampa готова');

        // Первичная сортировка
        setTimeout(sortAll, 1000);
        setTimeout(sortAll, 3000);
        setTimeout(sortAll, 5000);

        // Перехватываем открытие фильтра
        hookFilterOpen();

        // Перехватываем смену источника
        hookSourceChange();

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