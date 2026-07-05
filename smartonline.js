/**
 * Online Source Manager
 * Версия: 10.5.0
 * Фильмы: сортировка при каждом открытии
 * Сериалы: сортировка 1 раз (не мешать выбору)
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    var DEBUG = true;
    var sortTimer = null;
    var serialSorted = false;
    var currentSerialId = '';

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
    log('Online Source Manager v10.5.0');
    log('Фильмы: сортировка при каждом открытии');
    log('Сериалы: сортировка 1 раз');
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

    function getSerialId() {
        try {
            var active = Lampa.Activity.active();
            if (active && active.movie) {
                return active.movie.id || active.movie.title || '';
            }
        } catch(e) {}
        return '';
    }

    function isSerial() {
        try {
            var active = Lampa.Activity.active();
            if (active && active.movie) {
                return !!(active.movie.name || active.movie.number_of_seasons);
            }
        } catch(e) {}
        return false;
    }

    // ============================================================
    // 2. Сортировка элементов (без изменения DOM если уже отсортировано)
    // ============================================================
    function sortItems(selector, scoreFn, preserveActive, contextName) {
        var items = $(selector);
        var count = items.length;

        if (count < 2) return false;

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

        // Проверяем, нужно ли сортировать
        var isSorted = true;
        for (var i = 0; i < data.length - 1; i++) {
            if (data[i].score < data[i + 1].score) {
                isSorted = false;
                break;
            }
        }

        if (isSorted) {
            log('[' + contextName + '] Уже отсортировано, пропускаем');
            return false;
        }

        log('[' + contextName + '] Сортируем ' + count + ' элементов');

        data.sort(function(a, b) {
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

            log('[' + contextName + '] Отсортировано');
            return true;
        }

        return false;
    }

    // ============================================================
    // 3. Сортировка фильмов (всегда)
    // ============================================================
    function sortMovies() {
        log('--- Сортировка фильмов ---');

        var videos = $('.online-prestige--full');
        if (videos.length < 2) {
            log('Фильмы: меньше 2 видео');
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
            log('Фильмы: разные переводы не найдены');
            return false;
        }

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
            log('Фильмы: отсортированы');
            return true;
        }

        return false;
    }

    // ============================================================
    // 4. Сортировка сериалов (1 раз)
    // ============================================================
    function sortSerialFilters() {
        var serialId = getSerialId();

        // Проверяем, нужно ли сортировать
        if (serialSorted && currentSerialId === serialId) {
            log('Сериал уже отсортирован, пропускаем');
            return;
        }

        log('--- Сортировка сериалов (1 раз) ---');
        log('ID: ' + serialId);

        var sorted = false;

        // 4.1 Сортировка сезонов
        var containers = $('.selectbox');
        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Сезон') !== -1 || title.indexOf('Season') !== -1) {
                log('Найден фильтр: "' + title + '"');

                var items = $container.find('.selectbox-item');
                if (items.length < 2) return;

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

                // Проверяем, отсортированы ли уже
                var needSort = false;
                for (var i = 0; i < data.length - 1; i++) {
                    if (data[i].num < data[i + 1].num) {
                        needSort = true;
                        break;
                    }
                }

                if (!needSort) {
                    log('Сезоны уже отсортированы');
                    return;
                }

                data.sort(function(a, b) {
                    if (a.active && !b.active) return -1;
                    if (!a.active && b.active) return 1;
                    return b.num - a.num;
                });

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
                    sorted = true;
                }
            }
        });

        // 4.2 Сортировка переводов
        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Перевод') !== -1 || 
                title.indexOf('Voice') !== -1 || 
                title.indexOf('Озвучка') !== -1) {
                log('Найден фильтр: "' + title + '"');

                var items = $container.find('.selectbox-item');
                if (items.length < 2) return;

                var data = [];
                var activeText = '';

                items.each(function() {
                    var $el = $(this);
                    var text = getElementText($el);
                    var active = isActive($el);
                    var score = voiceWeight(text);

                    if (active) activeText = text;

                    data.push({ $el: $el, text: text, active: active, score: score });
                });

                // Проверяем, отсортированы ли уже
                var needSort = false;
                for (var i = 0; i < data.length - 1; i++) {
                    if (data[i].score < data[i + 1].score) {
                        needSort = true;
                        break;
                    }
                }

                if (!needSort) {
                    log('Переводы уже отсортированы');
                    return;
                }

                data.sort(function(a, b) {
                    if (a.active && !b.active) return -1;
                    if (!a.active && b.active) return 1;
                    if (a.score !== b.score) return b.score - a.score;
                    return a.text.localeCompare(b.text);
                });

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

                    log('Переводы отсортированы');
                    sorted = true;
                }
            }
        });

        if (sorted) {
            serialSorted = true;
            currentSerialId = serialId;
            log('Сериал отсортирован, ID: ' + serialId);
        } else {
            log('Сортировка не потребовалась');
        }
    }

    // ============================================================
    // 5. ГЛАВНАЯ СОРТИРОВКА
    // ============================================================
    function sortAll() {
        try {
            if (isSerial()) {
                log('>>> СЕРИАЛ <<<');
                sortSerialFilters();
            } else {
                log('>>> ФИЛЬМ <<<');
                sortMovies();
            }
        } catch(e) {
            logError('Ошибка:', e);
        }
    }

    // ============================================================
    // 6. СБРОС ФЛАГА ПРИ СМЕНЕ СЕРИАЛА
    // ============================================================
    function resetSerialFlag() {
        var currentId = getSerialId();
        if (currentId !== currentSerialId) {
            log('Смена сериала: ' + currentSerialId + ' -> ' + currentId);
            serialSorted = false;
            currentSerialId = '';
        }
    }

    // ============================================================
    // 7. ПЕРЕХВАТ
    // ============================================================
    function hookEvents() {
        log('Перехват событий...');

        // Перехватываем открытие фильтра
        var observer = new MutationObserver(function() {
            if ($('.selectbox').length > 0 || $('.online-prestige--full').length > 0) {
                clearTimeout(sortTimer);
                sortTimer = setTimeout(function() {
                    resetSerialFlag();
                    sortAll();
                }, 300);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Перехватываем смену источника
        var lastBalanser = Lampa.Storage.get('active_balanser', '');
        setInterval(function() {
            var currentBalanser = Lampa.Storage.get('active_balanser', '');
            if (currentBalanser !== lastBalanser) {
                log('Смена источника: ' + lastBalanser + ' -> ' + currentBalanser);
                lastBalanser = currentBalanser;
                serialSorted = false;
                currentSerialId = '';
                setTimeout(sortAll, 500);
                setTimeout(sortAll, 1000);
            }
        }, 1000);
    }

    // ============================================================
    // 8. ЗАПУСК
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa) {
            setTimeout(init, 500);
            return;
        }

        log('Lampa готова');

        setTimeout(sortAll, 1000);
        setTimeout(sortAll, 3000);
        setTimeout(sortAll, 5000);

        hookEvents();

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