/**
 * Online Source Manager
 * Версия: 10.3.0
 * Сортировка при открытии фильтра и смене источника
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
    log('Online Source Manager v10.3.0');
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

            log('[' + contextName + '] Отсортировано');
            return true;
        }

        return false;
    }

    // ============================================================
    // 3. Сортировка сезонов
    // ============================================================
    function sortSeasons() {
        var items = $('.selectbox-item');
        if (items.length < 2) return false;

        var parentContainer = items.parent().parent();
        var title = parentContainer.find('.selectbox__title').text().trim();

        if (title.indexOf('Сезон') === -1 && title.indexOf('Season') === -1) {
            return false;
        }

        log('--- Сортировка сезонов ---');

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

        data.sort(function(a, b) {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            return b.num - a.num;
        });

        log('После: ' + JSON.stringify(data.map(function(d) { return d.num + (d.active ? ' [A]' : ''); })));

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

            log('Сезоны отсортированы');
            return true;
        }

        return false;
    }

    // ============================================================
    // 4. Сортировка переводов
    // ============================================================
    function sortVoices() {
        var containers = $('.selectbox');

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Перевод') !== -1 || 
                title.indexOf('Voice') !== -1 || 
                title.indexOf('Озвучка') !== -1) {
                log('--- Сортировка переводов ---');
                sortItems('.selectbox-item', voiceWeight, true, 'Переводы');
            }
        });
    }

    // ============================================================
    // 5. Сортировка источников
    // ============================================================
    function sortSources() {
        var containers = $('.selectbox');

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Источник') !== -1 || 
                title.indexOf('Source') !== -1 || 
                title.indexOf('Сортировать') !== -1) {
                log('--- Сортировка источников ---');
                sortItems('.selectbox-item', qualityScore, true, 'Источники');
            }
        });
    }

    // ============================================================
    // 6. Сортировка фильмов
    // ============================================================
    function sortMovies() {
        var videos = $('.online-prestige--full');
        if (videos.length < 2) return false;

        var hasVariants = false;
        videos.each(function() {
            var text = $(this).find('.online-prestige__title').text().trim();
            if (voiceWeight(text) !== 0) {
                hasVariants = true;
            }
        });

        if (!hasVariants) return false;

        log('--- Сортировка фильмов ---');

        var data = [];
        videos.each(function() {
            var $el = $(this);
            var title = $el.find('.online-prestige__title').text().trim();
            var score = voiceWeight(title) * 100 + qualityScore(title);
            data.push({ $el: $el, text: title, score: score });
        });

        log('До: ' + JSON.stringify(data.map(function(d) { return d.text; })));

        data.sort(function(a, b) {
            if (a.score !== b.score) return b.score - a.score;
            return a.text.localeCompare(b.text);
        });

        log('После: ' + JSON.stringify(data.map(function(d) { return d.text; })));

        var parent = videos.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < data.length; i++) {
                container.append(data[i].$el);
            }
            parent.html(container.html());
            log('Фильмы отсортированы');
            return true;
        }

        return false;
    }

    // ============================================================
    // 7. ГЛАВНАЯ СОРТИРОВКА
    // ============================================================
    function sortAll() {
        log('>>> СОРТИРОВКА <<<');

        try {
            sortSeasons();
            sortVoices();
            sortSources();
            sortMovies();

            log('СОРТИРОВКА ЗАВЕРШЕНА');

        } catch(e) {
            logError('Ошибка:', e);
        }
    }

    // ============================================================
    // 8. ПЕРЕХВАТ ОТКРЫТИЯ ФИЛЬТРА
    // ============================================================
    function hookFilterOpen() {
        log('Перехват открытия фильтра...');

        // Перехватываем клик по кнопке фильтра
        $(document).on('hover:enter', '.filter--sort, .filter--filter', function() {
            log('Открыт фильтр, сортируем...');
            clearTimeout(sortTimer);
            sortTimer = setTimeout(sortAll, 300);
        });

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
    }

    // ============================================================
    // 9. ПЕРЕХВАТ СМЕНЫ ИСТОЧНИКА
    // ============================================================
    function hookSourceChange() {
        log('Перехват смены источника...');

        // Следим за изменением балансера в Storage
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

        // Перехватываем клик по источникам в меню
        $(document).on('hover:enter', '.selectbox-item', function() {
            var parentContainer = $(this).parent().parent();
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
    // 10. ЗАПУСК
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