/**
 * Online Source Manager - Data Hook
 * Версия: 11.7.0
 * Сортировка фильтров "Переводы" и "Сезон" при каждом открытии
 */

(function() {
    'use strict';

    if (window.osm_data_hook_loaded) return;
    window.osm_data_hook_loaded = true;

    var DEBUG = true;

    function log() {
        if (!DEBUG) return;
        var args = Array.prototype.slice.call(arguments);
        console.log.apply(console, ['[OSM]'].concat(args));
    }

    function logError() {
        var args = Array.prototype.slice.call(arguments);
        console.error.apply(console, ['[OSM ERROR]'].concat(args));
    }

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
    // 2. Сортировка элементов в фильтре
    // ============================================================
    function sortFilterItems(container, sortFn, preserveActive, contextName) {
        var items = container.find('.selectbox-item');
        if (items.length < 2) return false;

        var data = [];
        var activeText = '';

        items.each(function() {
            var $el = $(this);
            var text = getElementText($el);
            var active = isActive($el);
            var score = sortFn ? sortFn(text) : 0;

            if (active) activeText = text;

            data.push({ $el: $el, text: text, active: active, score: score });
        });

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

            log('[' + contextName + '] Отсортировано ' + data.length + ' элементов');
            return true;
        }

        return false;
    }

    // ============================================================
    // 3. Сортировка фильтра "Переводы"
    // ============================================================
    function sortVoicesFilter() {
        log('--- Сортировка переводов ---');

        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Перевод') !== -1 || 
                title.indexOf('Voice') !== -1 || 
                title.indexOf('Озвучка') !== -1) {
                log('Найден фильтр: "' + title + '"');
                var result = sortFilterItems($container, voiceWeight, true, 'Переводы');
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
        log('--- Сортировка сезонов ---');

        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Сезон') !== -1 || title.indexOf('Season') !== -1) {
                log('Найден фильтр: "' + title + '"');

                var items = $container.find('.selectbox-item');
                if (items.length < 2) {
                    log('Сезонов меньше 2, пропускаем');
                    return;
                }

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

                    log('Сезоны отсортированы: ' + data.map(function(d) { return d.num; }).join(' -> '));
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
    // 5. ГЛАВНАЯ ФУНКЦИЯ СОРТИРОВКИ
    // ============================================================
    function sortAllFilters() {
        log('>>> СОРТИРОВКА ФИЛЬТРОВ <<<');

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
        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (mutation.type === 'childList') {
                    var nodes = mutation.addedNodes;
                    for (var j = 0; j < nodes.length; j++) {
                        var node = nodes[j];
                        if (node.nodeType === 1) {
                            var $node = $(node);
                            if ($node.is('.selectbox') || $node.find('.selectbox').length) {
                                log('🔄 Появился фильтр, сортируем...');
                                clearTimeout(window._sortTimer);
                                window._sortTimer = setTimeout(sortAllFilters, 200);
                                return;
                            }
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Перехватываем клик по кнопкам фильтра
        $(document).on('hover:enter', '.filter--sort, .filter--filter, .filter--search', function() {
            log('🔄 Открыт фильтр, сортируем...');
            clearTimeout(window._sortTimer);
            window._sortTimer = setTimeout(sortAllFilters, 300);
        });

        log('✅ Перехват фильтров запущен');
    }

    // ============================================================
    // 7. ПЕРЕХВАТ СМЕНЫ ИСТОЧНИКА
    // ============================================================
    function hookSourceChange() {
        log('Перехват смены источника...');

        var lastSource = Lampa.Storage.get('active_balanser', '');
        setInterval(function() {
            var currentSource = Lampa.Storage.get('active_balanser', '');
            if (currentSource !== lastSource) {
                log('🔄 Смена источника: ' + lastSource + ' -> ' + currentSource);
                lastSource = currentSource;
                setTimeout(sortAllFilters, 500);
                setTimeout(sortAllFilters, 1000);
            }
        }, 1000);

        // Перехватываем клик по источникам
        $(document).on('hover:enter', '.selectbox-item', function() {
            var parentContainer = $(this).closest('.selectbox');
            var title = parentContainer.find('.selectbox__title').text().trim();

            if (title.indexOf('Источник') !== -1 || 
                title.indexOf('Source') !== -1 || 
                title.indexOf('Сортировать') !== -1) {
                log('🔄 Выбран источник, сортируем...');
                clearTimeout(window._sortTimer);
                window._sortTimer = setTimeout(sortAllFilters, 500);
            }
        });
    }

    // ============================================================
    // 8. ПЕРЕХВАТ МЕТОДОВ КОМПОНЕНТА
    // ============================================================
    function hookComponentMethods() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            log('Компонент lampac не найден');
            return;
        }

        var proto = Lampac.prototype;

        // Перехват changeBalanser
        if (typeof proto.changeBalanser === 'function' && !proto._osm_change_hooked) {
            proto._osm_change_hooked = true;
            var originalChange = proto.changeBalanser;

            proto.changeBalanser = function(balanser_name) {
                log('🔄 Смена балансера: ' + balanser_name);
                var result = originalChange.call(this, balanser_name);
                setTimeout(sortAllFilters, 500);
                setTimeout(sortAllFilters, 1000);
                return result;
            };
            log('✅ changeBalanser перехвачен');
        }

        // Перехват initialize
        if (typeof proto.initialize === 'function' && !proto._osm_init_hooked) {
            proto._osm_init_hooked = true;
            var originalInit = proto.initialize;

            proto.initialize = function() {
                log('🚀 Открытие балансера');
                var result = originalInit.call(this);
                setTimeout(sortAllFilters, 1000);
                setTimeout(sortAllFilters, 2000);
                return result;
            };
            log('✅ initialize перехвачен');
        }

        // Перехват parse
        if (typeof proto.parse === 'function' && !proto._osm_parse_hooked) {
            proto._osm_parse_hooked = true;
            var originalParse = proto.parse;

            proto.parse = function(str) {
                var result = originalParse.call(this, str);
                setTimeout(sortAllFilters, 300);
                return result;
            };
            log('✅ parse перехвачен');
        }
    }

    // ============================================================
    // 9. ЗАПУСК
    // ============================================================
    function init() {
        log('========================================');
        log('Online Source Manager v11.7.0');
        log('Сортировка фильтров "Переводы" и "Сезон"');
        log('========================================');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        log('Lampa готова');

        // Перехватываем методы компонента
        hookComponentMethods();

        // Перехватываем открытие фильтра
        hookFilterOpen();

        // Перехватываем смену источника
        hookSourceChange();

        // Первичная сортировка
        setTimeout(sortAllFilters, 1000);
        setTimeout(sortAllFilters, 3000);
        setTimeout(sortAllFilters, 5000);

        log('========================================');
        log('✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА');
        log('========================================');
        log('Ручная сортировка: sortAllFilters()');
        log('========================================');
    }

    window.sortAllFilters = sortAllFilters;

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