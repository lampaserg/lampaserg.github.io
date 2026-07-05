/**
 * Online Source Manager
 * Версия: 8.0.0
 * Максимально простая и надёжная версия
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

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

    // ============================================================
    // 2. Сортировка элементов
    // ============================================================
    function sortItems(selector, scoreFn) {
        var items = $(selector);
        if (items.length < 2) return;

        var data = [];
        var activeText = '';

        items.each(function() {
            var $el = $(this);
            var text = $el.text().trim();
            var isActive = $el.hasClass('focus') || $el.hasClass('active') || $el.hasClass('selected');
            var score = scoreFn ? scoreFn(text) : 0;

            if (isActive) activeText = text;

            data.push({ $el: $el, text: text, active: isActive, score: score });
        });

        data.sort(function(a, b) {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
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
                    if ($(newItems[i]).text().trim() === activeText) {
                        $(newItems[i]).addClass('focus');
                        break;
                    }
                }
            }
        }
    }

    // ============================================================
    // 3. Сортировка сезонов (от последнего к первому)
    // ============================================================
    function sortSeasons() {
        var items = $('.selectbox-item');
        if (items.length < 2) return;

        var parentContainer = items.parent().parent();
        var title = parentContainer.find('.selectbox__title').text().trim();

        if (title.indexOf('Сезон') === -1 && title.indexOf('Season') === -1) return;

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
        }
    }

    // ============================================================
    // 4. Основная функция
    // ============================================================
    function sortAll() {
        try {
            // 4.1 Сезоны
            sortSeasons();

            // 4.2 Переводы в сериалах (ищем по заголовку)
            var containers = $('.selectbox');
            containers.each(function() {
                var $container = $(this);
                var title = $container.find('.selectbox__title').text().trim();

                if (title.indexOf('Перевод') !== -1 || 
                    title.indexOf('Voice') !== -1 || 
                    title.indexOf('Озвучка') !== -1) {
                    sortItems('.selectbox-item', voiceWeight);
                }

                if (title.indexOf('Источник') !== -1 || 
                    title.indexOf('Source') !== -1 || 
                    title.indexOf('Сортировать') !== -1) {
                    sortItems('.selectbox-item', qualityScore);
                }
            });

            // 4.3 Кнопки озвучек
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
                    sortItems('.videos__button', voiceWeight);
                }
            }

            // 4.4 Видео в фильмах
            var videos = $('.online-prestige--full');
            if (videos.length > 1) {
                var hasVariants = false;
                videos.each(function() {
                    var text = $(this).find('.online-prestige__title').text().trim();
                    if (voiceWeight(text) !== 0) {
                        hasVariants = true;
                    }
                });
                if (hasVariants) {
                    sortItems('.online-prestige--full', function(text) {
                        var $el = $(text);
                        var title = $el.find ? $el.find('.online-prestige__title').text().trim() : '';
                        return voiceWeight(title) * 100 + qualityScore(title);
                    });
                }
            }
        } catch(e) {
            // Игнорируем ошибки
        }
    }

    // ============================================================
    // 5. Запуск
    // ============================================================
    function init() {
        // Первая сортировка
        setTimeout(sortAll, 1000);
        setTimeout(sortAll, 3000);
        setTimeout(sortAll, 5000);

        // Следим за изменениями
        var observer = new MutationObserver(function() {
            clearTimeout(window._sortTimer);
            window._sortTimer = setTimeout(sortAll, 300);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Периодическая проверка
        setInterval(sortAll, 3000);
    }

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