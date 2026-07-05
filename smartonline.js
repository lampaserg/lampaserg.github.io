/**
 * Online Source Manager
 * Версия: 9.0.0
 * Исправлена сортировка озвучек с сохранением активной
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
    log('Online Source Manager v9.0.0');
    log('Приоритет: hdrezka → Дубляж → LostFilm → Кубик → Остальные');
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

    // ============================================================
    // 2. Сортировка элементов (с сохранением активного)
    // ============================================================
    function sortItems(selector, scoreFn, preserveActive) {
        var items = $(selector);
        if (items.length < 2) return false;

        log('Сортировка ' + items.length + ' элементов по селектору: ' + selector);

        var data = [];
        var activeText = '';
        var hasHdrezka = false;

        items.each(function() {
            var $el = $(this);
            var text = $el.text().trim();
            var isActive = $el.hasClass('focus') || $el.hasClass('active') || $el.hasClass('selected');
            var score = scoreFn ? scoreFn(text) : 0;

            if (isActive) activeText = text;
            if (isHdrezka(text)) hasHdrezka = true;

            data.push({ $el: $el, text: text, active: isActive, score: score });
        });

        log('  Активная: "' + activeText + '"');
        log('  Есть HDrezka: ' + hasHdrezka);

        // Сортируем
        data.sort(function(a, b) {
            // Если есть HDrezka и она не активна — ставим её первой
            if (hasHdrezka) {
                var aIsHdrezka = isHdrezka(a.text);
                var bIsHdrezka = isHdrezka(b.text);
                if (aIsHdrezka && !bIsHdrezka) return -1;
                if (!aIsHdrezka && bIsHdrezka) return 1;
            }

            // Активная — наверх (если preserveActive = true)
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
        var parent = items.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < data.length; i++) {
                container.append(data[i].$el);
            }
            parent.html(container.html());

            // Восстанавливаем активный элемент
            if (activeText) {
                var newItems = parent.find(selector);
                for (var i = 0; i < newItems.length; i++) {
                    if ($(newItems[i]).text().trim() === activeText) {
                        $(newItems[i]).addClass('focus');
                        log('  Восстановлен активный: "' + activeText + '"');
                        break;
                    }
                }
            }

            log('  Переупорядочено ' + data.length + ' элементов');
            return true;
        }

        return false;
    }

    // ============================================================
    // 3. Сортировка сезонов (от последнего к первому)
    // ============================================================
    function sortSeasons() {
        var items = $('.selectbox-item');
        if (items.length < 2) return false;

        var parentContainer = items.parent().parent();
        var title = parentContainer.find('.selectbox__title').text().trim();

        if (title.indexOf('Сезон') === -1 && title.indexOf('Season') === -1) return false;

        log('Сортировка сезонов: от последнего к первому');

        var data = [];
        var activeText = '';

        items.each(function() {
            var $el = $(this);
            var text = $el.text().trim();
            var isActive = $el.hasClass('focus') || $el.hasClass('active') || $el.hasClass('selected');
            var num = parseInt(text.match(/(\d+)/) || [0, 0], 10);

            if (isActive) activeText = text;

            data.push({ $el: $el, text: text, active: isActive, num: num });
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
                    if ($(newItems[i]).text().trim() === activeText) {
                        $(newItems[i]).addClass('focus');
                        break;
                    }
                }
            }

            log('  Сезоны отсортированы: ' + data.map(function(i) { return i.num; }).join(' → '));
            return true;
        }

        return false;
    }

    // ============================================================
    // 4. Сортировка видео в фильмах
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

        log('Сортировка видео в фильме');

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
            log('  Видео отсортированы');
            return true;
        }

        return false;
    }

    // ============================================================
    // 5. Основная функция
    // ============================================================
    function sortAll() {
        try {
            log('--- Сортировка ---');

            var sorted = false;

            // 5.1 Сезоны
            if (sortSeasons()) sorted = true;

            // 5.2 Переводы в сериалах (ищем по заголовку)
            var containers = $('.selectbox');
            containers.each(function() {
                var $container = $(this);
                var title = $container.find('.selectbox__title').text().trim();

                if (title.indexOf('Перевод') !== -1 || 
                    title.indexOf('Voice') !== -1 || 
                    title.indexOf('Озвучка') !== -1) {
                    log('Найден фильтр переводов: "' + title + '"');
                    if (sortItems('.selectbox-item', voiceWeight, true)) sorted = true;
                }

                if (title.indexOf('Источник') !== -1 || 
                    title.indexOf('Source') !== -1 || 
                    title.indexOf('Сортировать') !== -1) {
                    log('Найден фильтр источников: "' + title + '"');
                    if (sortItems('.selectbox-item', qualityScore, true)) sorted = true;
                }
            });

            // 5.3 Кнопки озвучек (videos__button)
            var voiceBtns = $('.videos__button');
            if (voiceBtns.length > 1) {
                var hasVoice = false;
                voiceBtns.each(function() {
                    var text = $(this).text().trim();
                    if (/дубляж|hdrezka|lostfilm|кубик/i.test(text)) {
                        hasVoice = true;
                    }
                });
                if (hasVoice) {
                    log('Найдены кнопки озвучек');
                    if (sortItems('.videos__button', voiceWeight, true)) sorted = true;
                }
            }

            // 5.4 Видео в фильмах
            if (sortMovies()) sorted = true;

            if (!sorted) {
                log('  Изменений не было');
            }

        } catch(e) {
            log('Ошибка:', e);
        }
    }

    // ============================================================
    // 6. Запуск
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa) {
            setTimeout(init, 500);
            return;
        }

        // Первичная сортировка
        setTimeout(sortAll, 1000);
        setTimeout(sortAll, 3000);
        setTimeout(sortAll, 5000);

        // Следим за изменениями в DOM
        var observer = new MutationObserver(function() {
            clearTimeout(window._sortTimer);
            window._sortTimer = setTimeout(sortAll, 300);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Периодическая проверка (каждые 3 секунды)
        setInterval(sortAll, 3000);

        log('========================================');
        log('ГОТОВО!');
        log('Для ручной сортировки вызовите: sortAll()');
        log('========================================');
    }

    // Делаем функцию доступной в консоли
    window.sortAll = sortAll;

    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                init();
            }
        });
    } else {
        setTimeout(init, 1000);
    }

})();