/**
 * Online Source Manager
 * Версия: 10.2.0
 * Однократная сортировка при открытии балансера или смене источника
 */

(function() {
    'use strict';

    if (window.online_source_manager_loaded) return;
    window.online_source_manager_loaded = true;

    var DEBUG = true;
    var sortTimer = null;
    var isSorting = false;
    var currentTitle = '';
    var initialSortDone = false;
    var lastBalanser = '';

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
    log('Online Source Manager v10.2.0');
    log('Приоритет: hdrezka -> Дубляж -> LostFilm -> Кубик -> Остальные');
    log('Однократная сортировка при открытии или смене источника');
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

    function getCurrentMovieTitle() {
        try {
            var active = Lampa.Activity.active();
            if (active && active.movie) {
                return active.movie.title || active.movie.name || 'Неизвестно';
            }
        } catch(e) {}
        return 'Неизвестно';
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

    function getCurrentBalanser() {
        try {
            return Lampa.Storage.get('active_balanser', '') || Lampa.Storage.get('online_balanser', '');
        } catch(e) {}
        return '';
    }

    // ============================================================
    // 2. Сортировка элементов
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

        var beforeTexts = data.map(function(d) { return d.text + (d.active ? ' (Активный)' : ''); });
        log('[' + contextName + '] До сортировки: ' + JSON.stringify(beforeTexts));

        data.sort(function(a, b) {
            if (preserveActive !== false) {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
            }

            if (a.score !== b.score) return b.score - a.score;
            return a.text.localeCompare(b.text);
        });

        var afterTexts = data.map(function(d) { return d.text + (d.active ? ' (Активный)' : ''); });
        log('[' + contextName + '] После сортировки: ' + JSON.stringify(afterTexts));

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
                        log('[' + contextName + '] Восстановлен активный элемент: "' + activeText + '"');
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
    // 3. Сортировка сезонов
    // ============================================================
    function sortSeasonsInFilter() {
        var items = $('.selectbox-item');
        if (items.length < 2) return false;

        var parentContainer = items.parent().parent();
        var title = parentContainer.find('.selectbox__title').text().trim();

        if (title.indexOf('Сезон') === -1 && title.indexOf('Season') === -1) {
            return false;
        }

        var movieTitle = getCurrentMovieTitle();
        log('--- Сортировка сезонов для: ' + movieTitle + ' ---');

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

        var beforeSeasons = data.map(function(d) { return d.num + ' (' + d.text + ')' + (d.active ? ' Активный' : ''); });
        log('Сезоны до сортировки: ' + JSON.stringify(beforeSeasons));

        data.sort(function(a, b) {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            return b.num - a.num;
        });

        var afterSeasons = data.map(function(d) { return d.num + ' (' + d.text + ')' + (d.active ? ' Активный' : ''); });
        log('Сезоны после сортировки: ' + JSON.stringify(afterSeasons));

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
                        log('Сезоны: восстановлен активный сезон: "' + activeText + '"');
                        break;
                    }
                }
            }

            log('Сезоны отсортированы: ' + data.map(function(d) { return d.num; }).join(' -> '));
            return true;
        }

        return false;
    }

    // ============================================================
    // 4. Сортировка переводов
    // ============================================================
    function sortVoicesInFilter() {
        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Перевод') !== -1 || 
                title.indexOf('Voice') !== -1 || 
                title.indexOf('Озвучка') !== -1) {
                var movieTitle = getCurrentMovieTitle();
                log('--- Сортировка переводов для: ' + movieTitle + ' ---');
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
        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Источник') !== -1 || 
                title.indexOf('Source') !== -1 || 
                title.indexOf('Сортировать') !== -1) {
                var movieTitle = getCurrentMovieTitle();
                log('--- Сортировка источников для: ' + movieTitle + ' ---');
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
    // 6. Сортировка фильмов
    // ============================================================
    function sortMovies() {
        var videos = $('.online-prestige--full');
        if (videos.length < 2) return false;

        var movieTitle = getCurrentMovieTitle();
        log('--- Сортировка фильма: ' + movieTitle + ' ---');

        var hasVariants = false;
        var videoTexts = [];
        videos.each(function() {
            var text = $(this).find('.online-prestige__title').text().trim();
            videoTexts.push(text);
            if (voiceWeight(text) !== 0) {
                hasVariants = true;
            }
        });

        log('Найдено видео: ' + JSON.stringify(videoTexts));
        log('Есть разные переводы: ' + hasVariants);

        if (!hasVariants) {
            log('Фильмы: разные переводы не найдены, пропускаем');
            return false;
        }

        var data = [];
        videos.each(function() {
            var $el = $(this);
            var title = $el.find('.online-prestige__title').text().trim();
            var voice = voiceWeight(title);
            var quality = qualityScore(title);
            var score = voice * 100 + quality;
            data.push({ 
                $el: $el, 
                text: title, 
                voice: voice, 
                quality: quality, 
                score: score 
            });
        });

        var beforeData = data.map(function(d) { 
            return d.text + ' (голос=' + d.voice + ', качество=' + d.quality + ')'; 
        });
        log('До сортировки: ' + JSON.stringify(beforeData));

        data.sort(function(a, b) {
            if (a.score !== b.score) return b.score - a.score;
            return a.text.localeCompare(b.text);
        });

        var afterData = data.map(function(d) { 
            return d.text + ' (оценка=' + d.score + ')'; 
        });
        log('После сортировки: ' + JSON.stringify(afterData));

        var parent = videos.first().parent();
        if (parent && parent.length) {
            var container = $('<div>');
            for (var i = 0; i < data.length; i++) {
                container.append(data[i].$el);
            }
            parent.html(container.html());
            log('Фильм "' + movieTitle + '" отсортирован');
            return true;
        }

        return false;
    }

    // ============================================================
    // 7. ГЛАВНАЯ СОРТИРОВКА (однократная)
    // ============================================================
    function sortAll() {
        if (isSorting) return;
        isSorting = true;

        var movieTitle = getCurrentMovieTitle();
        var isSerialContent = isSerial();
        var currentBalanser = getCurrentBalanser();

        // Проверяем, не было ли уже сортировки для этого балансера
        if (lastBalanser === currentBalanser && initialSortDone) {
            log('Сортировка уже была для "' + movieTitle + '" и балансера "' + currentBalanser + '", пропускаем');
            isSorting = false;
            return;
        }

        log('========================================');
        log('СОРТИРОВКА ДЛЯ: ' + movieTitle);
        log('Балансер: ' + currentBalanser);
        log('Тип контента: ' + (isSerialContent ? 'СЕРИАЛ' : 'ФИЛЬМ'));
        log('========================================');

        try {
            if (isSerialContent) {
                log('Сериал: сортируем сезоны и переводы');
                sortSeasonsInFilter();
                sortVoicesInFilter();
            } else {
                log('Фильм: сортируем видео');
                sortMovies();
            }

            sortSourcesInFilter();

            // Запоминаем, что сортировка выполнена
            initialSortDone = true;
            lastBalanser = currentBalanser;

            log('========================================');
            log('СОРТИРОВКА ЗАВЕРШЕНА ДЛЯ: ' + movieTitle);
            log('========================================');

        } catch(e) {
            logError('Ошибка сортировки для ' + movieTitle + ':', e);
        }

        isSorting = false;
    }

    // ============================================================
    // 8. ПЕРЕХВАТ КОМПОНЕНТА
    // ============================================================
    function hookComponent() {
        log('Перехват компонента lampac...');

        var originalAdd = Lampa.Component.add;
        if (originalAdd._osm_hooked) return;
        originalAdd._osm_hooked = true;

        Lampa.Component.add = function(name, component) {
            log('Добавлен компонент: ' + name);
            var result = originalAdd.call(this, name, component);

            if (name === 'lampac') {
                log('Компонент lampac добавлен, патчим...');
                setTimeout(function() {
                    patchLampacComponent();
                }, 100);
            }

            return result;
        };

        if (Lampa.Component.get('lampac')) {
            log('Компонент lampac уже существует, патчим...');
            patchLampacComponent();
        }
    }

    // ============================================================
    // 9. ПАТЧ КОМПОНЕНТА
    // ============================================================
    function patchLampacComponent() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac || !Lampac.prototype) {
            log('Компонент lampac не найден');
            return;
        }

        var proto = Lampac.prototype;
        var patched = 0;

        // Сбрасываем флаг при смене фильма/сериала
        if (typeof proto.initialize === 'function' && !proto._osm_init_patched) {
            proto._osm_init_patched = true;
            var originalInit = proto.initialize;

            proto.initialize = function() {
                var movieTitle = getCurrentMovieTitle();
                log('ОТКРЫТИЕ БАЛАНСЕРА для "' + movieTitle + '"');
                // Сбрасываем флаги при открытии нового контента
                initialSortDone = false;
                lastBalanser = '';
                var result = originalInit.call(this);
                setTimeout(sortAll, 1000);
                setTimeout(sortAll, 2000);
                return result;
            };
            log('initialize пропатчен');
            patched++;
        }

        if (typeof proto.changeBalanser === 'function' && !proto._osm_change_patched) {
            proto._osm_change_patched = true;
            var originalChange = proto.changeBalanser;

            proto.changeBalanser = function(balanser_name) {
                var movieTitle = getCurrentMovieTitle();
                log('СМЕНА БАЛАНСЕРА: ' + balanser_name + ' для "' + movieTitle + '"');
                // Сбрасываем флаг при смене балансера
                initialSortDone = false;
                lastBalanser = '';
                var result = originalChange.call(this, balanser_name);
                setTimeout(sortAll, 500);
                return result;
            };
            log('changeBalanser пропатчен');
            patched++;
        }

        if (typeof proto.startSource === 'function' && !proto._osm_source_patched) {
            proto._osm_source_patched = true;
            var originalStart = proto.startSource;

            proto.startSource = function(json) {
                var movieTitle = getCurrentMovieTitle();
                log('ЗАГРУЗКА ИСТОЧНИКА для "' + movieTitle + '"');
                var result = originalStart.call(this, json);
                setTimeout(sortAll, 800);
                return result;
            };
            log('startSource пропатчен');
            patched++;
        }

        if (typeof proto.parse === 'function' && !proto._osm_parse_patched) {
            proto._osm_parse_patched = true;
            var originalParse = proto.parse;

            proto.parse = function(str) {
                var movieTitle = getCurrentMovieTitle();
                var isSerialContent = isSerial();
                log('ПОЛУЧЕН ОТВЕТ ОТ СЕРВЕРА для "' + movieTitle + '" (' + (isSerialContent ? 'сериал' : 'фильм') + ')');
                var result = originalParse.call(this, str);
                setTimeout(sortAll, 300);
                return result;
            };
            log('parse пропатчен');
            patched++;
        }

        if (patched > 0) {
            log('Компонент lampac пропатчен: ' + patched + ' методов');
        } else {
            log('Новые методы не найдены, возможно уже пропатчены');
        }
    }

    // ============================================================
    // 10. ЗАПУСК
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        log('Lampa готова');

        hookComponent();

        if (Lampa.Component.get('lampac')) {
            patchLampacComponent();
        }

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