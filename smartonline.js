/**
 * Online Source Manager
 * Version: 9.7.0
 * Intercept balancer change via Lampa API
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
        console.error.apply(console, ['[OSM ERROR]'].concat(args));
    }

    log('========================================');
    log('Online Source Manager v9.7.0');
    log('Priority: hdrezka -> Dub -> LostFilm -> Cube -> Others');
    log('========================================');

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

            log('[' + contextName + '] Sorted ' + data.length + ' items');
            return true;
        }

        return false;
    }

    function sortSeasonsInFilter() {
        var items = $('.selectbox-item');
        if (items.length < 2) return false;

        var parentContainer = items.parent().parent();
        var title = parentContainer.find('.selectbox__title').text().trim();

        if (title.indexOf('Сезон') === -1 && title.indexOf('Season') === -1) {
            return false;
        }

        log('Seasons: sorting ' + items.length + ' seasons');

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

            log('Seasons: sorted: ' + data.map(function(d) { return d.num; }).join(' -> '));
            return true;
        }

        return false;
    }

    function sortVoicesInFilter() {
        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Перевод') !== -1 || 
                title.indexOf('Voice') !== -1 || 
                title.indexOf('Озвучка') !== -1) {
                log('Voices: sorting');
                var result = sortItems('.selectbox-item', voiceWeight, true, 'Voices');
                if (result) found = true;
            }
        });

        return found;
    }

    function sortSourcesInFilter() {
        var containers = $('.selectbox');
        var found = false;

        containers.each(function() {
            var $container = $(this);
            var title = $container.find('.selectbox__title').text().trim();

            if (title.indexOf('Источник') !== -1 || 
                title.indexOf('Source') !== -1 || 
                title.indexOf('Сортировать') !== -1) {
                log('Sources: sorting by quality');
                var result = sortItems('.selectbox-item', qualityScore, true, 'Sources');
                if (result) found = true;
            }
        });

        return found;
    }

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

        log('Movies: sorting ' + videos.length + ' videos');

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
            log('Movies: sorted');
            return true;
        }

        return false;
    }

    function sortAll() {
        log('>>> SORT <<<');

        try {
            sortSeasonsInFilter();
            sortVoicesInFilter();
            sortSourcesInFilter();
            sortMovies();

            log('SORT COMPLETE');

        } catch(e) {
            logError('Error:', e);
        }
    }

    function hookBalancerChange() {
        log('Hooking balancer change...');

        var Lampac = Lampa.Component.get('lampac');
        if (Lampac && Lampac.prototype) {
            var proto = Lampac.prototype;

            if (typeof proto.changeBalanser === 'function' && !proto._osm_hooked) {
                proto._osm_hooked = true;
                var originalChange = proto.changeBalanser;

                proto.changeBalanser = function(balanser_name) {
                    log('Balancer changed to: ' + balanser_name);
                    var result = originalChange.call(this, balanser_name);
                    setTimeout(sortAll, 500);
                    return result;
                };
                log('changeBalanser hooked');
            }

            if (typeof proto.startSource === 'function' && !proto._osm_start_hooked) {
                proto._osm_start_hooked = true;
                var originalStart = proto.startSource;

                proto.startSource = function(json) {
                    log('Loading new source');
                    var result = originalStart.call(this, json);
                    setTimeout(sortAll, 800);
                    return result;
                };
                log('startSource hooked');
            }

            if (typeof proto.initialize === 'function' && !proto._osm_init_hooked) {
                proto._osm_init_hooked = true;
                var originalInit = proto.initialize;

                proto.initialize = function() {
                    log('Opening balancer');
                    var result = originalInit.call(this);
                    setTimeout(sortAll, 1000);
                    setTimeout(sortAll, 2000);
                    return result;
                };
                log('initialize hooked');
            }
        }
    }

    function init() {
        log('Initializing...');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa not ready, waiting...');
            setTimeout(init, 500);
            return;
        }

        log('Lampa ready');

        hookBalancerChange();

        setTimeout(sortAll, 1000);
        setTimeout(sortAll, 3000);

        log('========================================');
        log('INIT COMPLETE');
        log('========================================');
        log('Manual sort: sortAll()');
        log('========================================');
    }

    window.sortAll = sortAll;

    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                log('app:ready received');
                init();
            }
        });
    } else {
        setTimeout(init, 1000);
    }

})();