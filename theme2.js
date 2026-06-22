// @name AppleTV+
// @version 3.7.0
// @author Your Name
// @description Расширенная карточка фильма в стиле Apple TV+
// @lampa-check Lampa.

(function() {
    'use strict';

    // =================================================================
    // CONFIGURATION
    // =================================================================

    var PLUGIN_VERSION = '3.7.0';
    var CACHE_TTL = 24 * 60 * 60 * 1000;
    var PROXY_TIMEOUT = 15000;

    var PROXY_LIST = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ];

    var LANG = (Lampa.Storage.get('language', 'uk') || 'uk').toLowerCase();
    if (LANG === 'ua') LANG = 'uk';
    if (['uk', 'ru', 'en', 'pl'].indexOf(LANG) === -1) LANG = 'en';

    // Кэши
    var _jacredCache = {};
    var _logoCache = {};
    var _lampaRatingCache = {};
    var workingProxy = null;

    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================

    function getTmdbKey() {
        try {
            var custom = (Lampa.Storage.get('applecation_tmdb_apikey') || '').trim();
            return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
        } catch (e) {
            return '';
        }
    }

    function getRatingColor(value) {
        var v = parseFloat(String(value).replace(',', '.'));
        if (isNaN(v) || v <= 0) return '#ffffff';
        if (v <= 3) return '#e74c3c';
        if (v < 6) return '#f39c12';
        if (v < 8) return '#3498db';
        return '#2ecc71';
    }

    function getRatingBackgroundColor(value) {
        var v = parseFloat(String(value).replace(',', '.'));
        if (isNaN(v) || v <= 0) return 'rgba(0,0,0,0.6)';
        if (v <= 3) return 'rgba(231,76,60,0.85)';
        if (v < 6) return 'rgba(243,156,18,0.85)';
        if (v < 8) return 'rgba(52,152,219,0.85)';
        return 'rgba(46,204,113,0.85)';
    }

    function getAgeColor(pg) {
        if (!pg) return '#ffffff';
        var num = parseInt(pg);
        if (isNaN(num)) return '#ffffff';
        if (num <= 0) return '#4caf50';
        if (num <= 6) return '#8bc34a';
        if (num <= 12) return '#ffeb3b';
        if (num <= 16) return '#ff9800';
        return '#e74c3c';
    }

    function getStatusText(status) {
        var map = {
            'Ended': 'Завершён',
            'Canceled': 'Отменён',
            'Returning Series': 'Онгоинг',
            'In Production': 'В производстве',
            'Planned': 'Запланирован',
            'Pilot': 'Пилотный'
        };
        return map[status] || status || 'Неизвестно';
    }

    function getStatusColor(status) {
        var map = {
            'Ended': 'rgba(46,204,113,0.85)',
            'Canceled': 'rgba(231,76,60,0.85)',
            'Returning Series': 'rgba(243,156,18,0.85)',
            'In Production': 'rgba(52,152,219,0.85)',
            'Planned': 'rgba(155,89,182,0.85)',
            'Pilot': 'rgba(230,126,34,0.85)'
        };
        return map[status] || 'rgba(0,0,0,0.6)';
    }

    function getPosterQuality() {
        var quality = Lampa.Storage.get('applecation_poster_quality', '4k');
        var map = {
            '720p': 'w780',
            '1080p': 'w1280',
            '4k': 'original',
            '8k': 'original'
        };
        return map[quality] || 'original';
    }

    function getLogoQuality() {
        var quality = Lampa.Storage.get('applecation_poster_quality', '4k');
        var map = {
            '720p': 'w300',
            '1080p': 'w500',
            '4k': 'original',
            '8k': 'original'
        };
        return map[quality] || 'original';
    }

    function escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // =================================================================
    // PARSE PG (возрастной рейтинг)
    // =================================================================

    function parsePG(movie) {
        try {
            if (!movie) return null;
            
            var pg = null;
            var lang = LANG.toUpperCase();
            
            if (movie.content_ratings && movie.content_ratings.results) {
                var find = movie.content_ratings.results.find(function(a) {
                    return a.iso_3166_1 === lang;
                });
                if (!find) {
                    find = movie.content_ratings.results.find(function(a) {
                        return a.iso_3166_1 === 'US';
                    });
                }
                if (find && find.rating) {
                    pg = decodePG(find.rating);
                }
            }
            
            if (!pg && movie.release_dates && movie.release_dates.results) {
                var find = movie.release_dates.results.find(function(a) {
                    return a.iso_3166_1 === lang;
                });
                if (!find) {
                    find = movie.release_dates.results.find(function(a) {
                        return a.iso_3166_1 === 'US';
                    });
                }
                if (find && find.release_dates && find.release_dates.length) {
                    pg = decodePG(find.release_dates[0].certification);
                }
            }
            
            if (!pg && movie.restrict) {
                pg = movie.restrict + '+';
            }
            
            return pg;
            
        } catch (e) {
            console.warn('[AppleTV+] Error parsing PG:', e);
            return null;
        }
    }

    function decodePG(rating) {
        if (!rating) return null;
        
        var map = {
            'G': '0+',
            'PG': '6+',
            'PG-13': '13+',
            'R': '17+',
            'NC-17': '18+',
            'TV-Y': '0+',
            'TV-Y7': '7+',
            'TV-G': '3+',
            'TV-PG': '6+',
            'TV-14': '14+',
            'TV-MA': '17+',
            '0': '0+', '1': '1+', '2': '2+', '3': '3+',
            '4': '4+', '5': '5+', '6': '6+', '7': '7+',
            '8': '8+', '9': '9+', '10': '10+', '11': '11+',
            '12': '12+', '13': '13+', '14': '14+', '15': '15+',
            '16': '16+', '17': '17+', '18': '18+'
        };
        
        return map[rating] || rating;
    }

    // =================================================================
    // LAMPA RATINGS (реакции) - как в Интерфейс Мод
    // =================================================================

    function getLampaRating(movie, callback) {
        try {
            if (!movie || !movie.id) {
                callback(null);
                return;
            }

            var type = movie.name ? 'tv' : 'movie';
            var key = type + '_' + movie.id;
            var cacheKey = 'lampa_rating_' + key;

            var cached = Lampa.Storage.get(cacheKey, null);
            if (cached && cached._ts && (Date.now() - cached._ts < CACHE_TTL)) {
                _lampaRatingCache[cacheKey] = cached;
                callback(cached);
                return;
            }

            var network = new Lampa.Reguest();
            network.timeout(PROXY_TIMEOUT);
            
            var url = 'https://cubnotrip.top/api/reactions/get/' + key;
            
            network.silent(url, function(data) {
                try {
                    if (data && data.result && Array.isArray(data.result)) {
                        var rating = calculateLampaRating(data.result);
                        var result = {
                            rating: rating.rating,
                            medianReaction: rating.medianReaction,
                            reactions: data.result,
                            _ts: Date.now()
                        };
                        _lampaRatingCache[cacheKey] = result;
                        Lampa.Storage.set(cacheKey, result);
                        callback(result);
                    } else {
                        callback(null);
                    }
                } catch (e) {
                    callback(null);
                }
            }, function() {
                callback(null);
            }, false, { timeout: PROXY_TIMEOUT });

        } catch (e) {
            console.error('[AppleTV+] getLampaRating error:', e);
            callback(null);
        }
    }

    function calculateLampaRating(reactions) {
        try {
            var weightedSum = 0;
            var totalCount = 0;
            var reactionCnt = {};
            var reactionCoef = { fire: 5, nice: 4, think: 3, bore: 2, shit: 1 };

            for (var i = 0; i < reactions.length; i++) {
                var item = reactions[i];
                var count = parseInt(item.counter, 10) || 0;
                var coef = reactionCoef[item.type] || 0;
                weightedSum += count * coef;
                totalCount += count;
                reactionCnt[item.type] = (reactionCnt[item.type] || 0) + count;
            }

            if (totalCount === 0) {
                return { rating: 0, medianReaction: '' };
            }

            var avgRating = weightedSum / totalCount;
            var rating10 = (avgRating - 1) * 2.5;
            var finalRating = rating10 >= 0 ? parseFloat(rating10.toFixed(1)) : 0;

            var medianReaction = '';
            var medianIndex = Math.ceil(totalCount / 2.0);
            var keys = Object.keys(reactionCoef);
            var sortedReactions = keys.sort(function(a, b) {
                return reactionCoef[a] - reactionCoef[b];
            });
            var cumulativeCount = 0;
            
            while (sortedReactions.length && cumulativeCount < medianIndex) {
                medianReaction = sortedReactions.pop();
                cumulativeCount += (reactionCnt[medianReaction] || 0);
            }

            return { rating: finalRating, medianReaction: medianReaction };

        } catch (e) {
            return { rating: 0, medianReaction: '' };
        }
    }

    // =================================================================
    // JACRED QUALITY - как в Ліхтар Studios2
    // =================================================================

    function fetchWithProxy(url, callback) {
        var network = new Lampa.Reguest();
        network.timeout(PROXY_TIMEOUT);

        network.silent(url, function(data) {
            workingProxy = 'direct';
            callback(null, data);
        }, function() {
            tryProxies(url, callback);
        });
    }

    function tryProxies(url, callback) {
        var proxyList = (workingProxy && workingProxy !== 'direct') ? [workingProxy] : PROXY_LIST;

        function tryProxy(index) {
            if (index >= proxyList.length) {
                callback(new Error('No proxy worked'));
                return;
            }
            var p = proxyList[index];
            var target = p.indexOf('url=') > -1 ? p + encodeURIComponent(url) : p + url;

            var xhr = new XMLHttpRequest();
            xhr.open('GET', target, true);
            xhr.timeout = PROXY_TIMEOUT;

            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    workingProxy = p;
                    callback(null, xhr.responseText);
                } else {
                    tryProxy(index + 1);
                }
            };
            xhr.onerror = function() { tryProxy(index + 1); };
            xhr.ontimeout = function() { tryProxy(index + 1); };
            xhr.send();
        }
        tryProxy(0);
    }

    function getBestJacred(card, callback) {
        try {
            if (!card || !card.id) {
                callback(null);
                return;
            }

            var cacheKey = 'jacred_' + card.id;
            var now = Date.now();

            var cached = Lampa.Storage.get(cacheKey, null);
            if (cached && cached._ts && (now - cached._ts < CACHE_TTL) && cached.resolution) {
                _jacredCache[cacheKey] = cached;
                callback(cached);
                return;
            }

            var title = (card.original_title || card.title || card.name || '').toLowerCase().trim();
            var year = (card.release_date || card.first_air_date || '').substr(0, 4);

            if (!title || !year) {
                callback(null);
                return;
            }

            // Формируем запрос как в Ліхтар Studios2
            var searchQuery = encodeURIComponent(title + ' ' + year);
            var apiUrl = 'https://jr.maxvol.pro/api/v1.0/torrents?search=' + searchQuery;

            console.log('[AppleTV+] Jacred: Fetching quality for:', title, year);

            fetchWithProxy(apiUrl, function(err, data) {
                if (err || !data) {
                    callback(null);
                    return;
                }

                try {
                    var parsed = typeof data === 'string' ? JSON.parse(data) : data;
                    
                    if (parsed.contents) {
                        try {
                            parsed = JSON.parse(parsed.contents);
                        } catch (e) {}
                    }

                    var results = Array.isArray(parsed) ? parsed : (parsed.Results || []);
                    
                    if (!results || !results.length) {
                        var emptyData = { empty: true, _ts: now };
                        _jacredCache[cacheKey] = emptyData;
                        Lampa.Storage.set(cacheKey, emptyData);
                        callback(null);
                        return;
                    }

                    var best = {
                        resolution: 'SD',
                        hdr: false,
                        dolbyVision: false,
                        sound: null,
                        dub: false,
                        _ts: now
                    };

                    var resOrder = ['SD', 'HD', 'FHD', '2K', '4K'];

                    results.forEach(function(item) {
                        var titleLower = (item.title || '').toLowerCase();
                        var info = item.info || item.Info || {};
                        var videotype = (info.videotype || '').toLowerCase();
                        var quality = info.quality || 0;

                        var currentRes = 'SD';
                        
                        // Определяем качество как в Ліхтар Studios2
                        if (quality >= 2160) currentRes = '4K';
                        else if (quality >= 1440) currentRes = '2K';
                        else if (quality >= 1080) currentRes = 'FHD';
                        else if (quality >= 720) currentRes = 'HD';
                        
                        if (currentRes === 'SD') {
                            if (titleLower.indexOf('2160') >= 0 || titleLower.indexOf('4k') >= 0) {
                                currentRes = '4K';
                            } else if (titleLower.indexOf('1440') >= 0 || titleLower.indexOf('2k') >= 0) {
                                currentRes = '2K';
                            } else if (titleLower.indexOf('1080') >= 0 || titleLower.indexOf('fhd') >= 0) {
                                currentRes = 'FHD';
                            } else if (titleLower.indexOf('720') >= 0 || titleLower.indexOf('hd') >= 0) {
                                currentRes = 'HD';
                            } else if (titleLower.indexOf('cam') >= 0 || titleLower.indexOf('ts') >= 0 || titleLower.indexOf('tc') >= 0) {
                                currentRes = 'TS';
                            }
                        }

                        if (resOrder.indexOf(currentRes) > resOrder.indexOf(best.resolution)) {
                            best.resolution = currentRes;
                        }

                        // HDR / Dolby Vision
                        if (titleLower.indexOf('dolby vision') >= 0 || titleLower.indexOf('dovi') >= 0) {
                            best.dolbyVision = true;
                            best.hdr = true;
                        } else if (titleLower.indexOf('hdr10+') >= 0) {
                            best.hdr = true;
                        } else if (titleLower.indexOf('hdr10') >= 0 || titleLower.indexOf('hdr') >= 0) {
                            best.hdr = true;
                        }

                        // Звук
                        if (titleLower.indexOf('7.1') >= 0) best.sound = '7.1';
                        else if (titleLower.indexOf('5.1') >= 0) best.sound = '5.1';
                        else if (titleLower.indexOf('2.0') >= 0) best.sound = '2.0';

                        // DUB
                        if (titleLower.indexOf('dub') >= 0 || titleLower.indexOf('дубляж') >= 0) {
                            best.dub = true;
                        }
                    });

                    // Если качество не определилось, но есть результаты - ставим HD
                    if (best.resolution === 'SD' && results.length > 0) {
                        best.resolution = 'HD';
                    }

                    _jacredCache[cacheKey] = best;
                    Lampa.Storage.set(cacheKey, best);
                    
                    console.log('[AppleTV+] Jacred result:', best);
                    callback(best);

                } catch (e) {
                    console.error('[AppleTV+] Jacred parse error:', e);
                    callback(null);
                }
            });

        } catch (e) {
            console.error('[AppleTV+] getBestJacred error:', e);
            callback(null);
        }
    }

    // =================================================================
    // TMDB LOGO
    // =================================================================

    function fetchLogo(movie, callback) {
        try {
            if (!movie || !movie.id) {
                callback(null);
                return;
            }

            var type = movie.name ? 'tv' : 'movie';
            var cacheKey = type + '_' + movie.id + '_logo';
            var now = Date.now();

            var cached = Lampa.Storage.get(cacheKey, null);
            if (cached && cached._ts && (now - cached._ts < CACHE_TTL)) {
                _logoCache[cacheKey] = cached;
                callback(cached);
                return;
            }

            var lang = LANG;
            var url = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey() + '&language=' + lang);
            var urlAll = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey());

            var network = new Lampa.Reguest();
            network.timeout(PROXY_TIMEOUT);

            network.silent(url, function(data) {
                if (data && data.logos && data.logos.length) {
                    var logo = data.logos.find(function(l) { return l.iso_639_1 === lang; }) ||
                              data.logos.find(function(l) { return l.iso_639_1 === 'en'; }) ||
                              data.logos[0];

                    if (logo) {
                        var result = { file_path: logo.file_path, _ts: now };
                        _logoCache[cacheKey] = result;
                        Lampa.Storage.set(cacheKey, result);
                        callback(result);
                        return;
                    }
                }

                network.silent(urlAll, function(dataAll) {
                    if (dataAll && dataAll.logos && dataAll.logos.length) {
                        var logo = dataAll.logos.find(function(l) { return l.iso_639_1 === 'en'; }) || dataAll.logos[0];
                        if (logo) {
                            var result = { file_path: logo.file_path, _ts: now };
                            _logoCache[cacheKey] = result;
                            Lampa.Storage.set(cacheKey, result);
                            callback(result);
                            return;
                        }
                    }
                    callback(null);
                }, function() {
                    callback(null);
                });

            }, function() {
                callback(null);
            });
        } catch (e) {
            console.error('[AppleTV+] fetchLogo error:', e);
            callback(null);
        }
    }

    function getLogoUrl(logo) {
        if (!logo || !logo.file_path) return null;
        var quality = getLogoQuality();
        return Lampa.TMDB.image('/t/p/' + quality + logo.file_path);
    }

    // =================================================================
    // MAIN PLUGIN
    // =================================================================

    function initPlugin() {
        if (window._applecation_plus_initialized) return;
        window._applecation_plus_initialized = true;

        console.log('[AppleTV+] Initializing v' + PLUGIN_VERSION);

        injectStyles();
        injectAdditionalStyles();

        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;

            try {
                var activity = e.object && e.object.activity;
                if (!activity || !activity.render) return;

                var render = activity.render();
                if (!render || !render.length) return;

                if (render.data('applecation_plus_processed')) return;
                render.data('applecation_plus_processed', true);

                var movie = e.data && e.data.movie;
                if (!movie) return;

                console.log('[AppleTV+] Processing card for:', movie.title || movie.name);

                render.addClass('applecation');
                modifyCardDOM(render, movie);

                // Получаем данные
                var pending = 3;
                var lampaData = null;
                var qualityData = null;

                function checkComplete() {
                    pending--;
                    if (pending === 0) {
                        // Рейтинги берем из существующих данных
                        var ratings = {
                            tmdb: movie.vote_average || 0,
                            imdb: movie.imdb_rating || movie.ratingImdb || 0,
                            kinopoisk: movie.kp_rating || movie.ratingKinopoisk || 0
                        };
                        fillContent(render, movie, ratings, lampaData, qualityData);
                        setTimeout(function() {
                            try {
                                focusFirstButton(render);
                            } catch (err) {}
                        }, 500);
                    }
                }

                getLampaRating(movie, function(data) {
                    lampaData = data;
                    checkComplete();
                });

                getBestJacred(movie, function(data) {
                    qualityData = data;
                    checkComplete();
                });

                // Для сезонов используем данные из карточки
                checkComplete();

                loadLogo(render, movie);
                setupAnimations(render);

                setTimeout(function() {
                    try {
                        if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
                            Lampa.Controller.toggle('full_start');
                        }
                    } catch (err) {}
                }, 300);

            } catch (err) {
                console.error('[AppleTV+] Error processing card:', err);
            }
        });

        console.log('[AppleTV+] Initialized successfully');
    }

    // =================================================================
    // FOCUS FIRST BUTTON
    // =================================================================

    function focusFirstButton(render) {
        try {
            var buttons = render.find('.full-start-new__buttons .full-start__button:not(.hidden)');
            if (!buttons.length) return;

            var firstButton = buttons.first();
            
            if (firstButton.hasClass('button--edit-order')) {
                var nextButton = buttons.eq(1);
                if (nextButton.length) {
                    firstButton = nextButton;
                } else {
                    return;
                }
            }

            if (Lampa.Controller && typeof Lampa.Controller.collectionFocus === 'function') {
                Lampa.Controller.collectionFocus(firstButton[0], render.find('.full-start-new__buttons')[0]);
            } else if (typeof firstButton.focus === 'function') {
                firstButton.focus();
            }

            firstButton.addClass('focus');

        } catch (e) {
            console.warn('[AppleTV+] focusFirstButton error:', e);
        }
    }

    // =================================================================
    // DOM MODIFICATION
    // =================================================================

    function modifyCardDOM(render, movie) {
        try {
            var isTv = !!(movie.name || movie.original_name || movie.first_air_date || movie.number_of_seasons);

            render.find('.full-start-new__head, .full-start-new__details, .full-descr, .full-descr__title, .full-start__head, .full-start-new__reactions').hide();

            var right = render.find('.full-start-new__right');
            if (!right.length) return;

            var left = right.find('.applecation__left');
            if (!left.length) {
                left = $('<div class="applecation__left"></div>');
                right.prepend(left);
            }

            var logoWrapper = left.find('.applecation__logo-wrapper');
            if (!logoWrapper.length) {
                logoWrapper = $('<div class="applecation__logo-wrapper"><img class="applecation__logo" style="display:none;" /></div>');
                left.prepend(logoWrapper);
            }

            var contentWrapper = left.find('.applecation__content-wrapper');
            if (!contentWrapper.length) {
                contentWrapper = $('<div class="applecation__content-wrapper"></div>');
                left.append(contentWrapper);
            }

            var title = render.find('.full-start-new__title');
            if (title.length) {
                title.detach();
                contentWrapper.append(title);
                title.show();
            }

            var meta = contentWrapper.find('.applecation__meta');
            if (!meta.length) {
                meta = $('<div class="applecation__meta"><div class="applecation__meta-left"><span class="applecation__network"></span><span class="applecation__meta-text"></span></div></div>');
                contentWrapper.append(meta);
            }

            var studios = contentWrapper.find('.applecation__studios');
            if (!studios.length) {
                studios = $('<div class="applecation__studios"></div>');
                contentWrapper.append(studios);
            }

            var ratings = contentWrapper.find('.applecation__ratings');
            if (!ratings.length) {
                ratings = $('<div class="applecation__ratings"></div>');
                contentWrapper.append(ratings);
            }

            var reactions = contentWrapper.find('.applecation__reactions');
            if (!reactions.length) {
                reactions = $('<div class="applecation__reactions"></div>');
                contentWrapper.append(reactions);
            }

            var descWrapper = contentWrapper.find('.applecation__description-wrapper');
            if (!descWrapper.length) {
                descWrapper = $('<div class="applecation__description-wrapper"><div class="applecation__description"></div></div>');
                contentWrapper.append(descWrapper);
            }

            var info = contentWrapper.find('.applecation__info');
            if (!info.length) {
                info = $('<div class="applecation__info"><span class="applecation__info-text"></span><span class="applecation__quality-badges"></span></div>');
                contentWrapper.append(info);
            }

            var buttons = contentWrapper.find('.full-start-new__buttons');
            if (!buttons.length) {
                buttons = render.find('.full-start-new__buttons');
                if (buttons.length) {
                    buttons.detach();
                    contentWrapper.append(buttons);
                }
            }

            render.find('.full-start-new__rate-line').remove();
            render.find('.applecation__right').remove();

            render.addClass('applecation');
            contentWrapper.addClass('applecation-glass');

            var bg = render.find('.full-start__background:not(.applecation__overlay)');
            if (bg.length && !bg.next('.applecation__overlay').length) {
                bg.after('<div class="full-start__background loaded applecation__overlay"></div>');
            }
        } catch (e) {
            console.error('[AppleTV+] modifyCardDOM error:', e);
        }
    }

    // =================================================================
    // CONTENT FILLING
    // =================================================================

    function fillContent(render, movie, ratings, lampaData, qualityData) {
        try {
            var isTv = !!(movie.name || movie.original_name || movie.first_air_date || movie.number_of_seasons);
            var descriptionOverlayEnabled = Lampa.Storage.get('applecation_description_overlay', false);

            // 1. Мета-информация
            var metaText = render.find('.applecation__meta-text');
            if (metaText.length) {
                var parts = [];
                parts.push(isTv ? 'Сериал' : 'Фильм');

                if (movie.genres && movie.genres.length) {
                    var g = movie.genres.slice(0, 2).map(function(x) {
                        return Lampa.Utils.capitalizeFirstLetter(x.name);
                    });
                    parts = parts.concat(g);
                }

                var pg = parsePG(movie);
                if (pg) {
                    var ageColor = getAgeColor(pg);
                    parts.push('<span class="applecation__age-rating" style="border-color: ' + ageColor + '; color: ' + ageColor + ';">' + pg + '</span>');
                }

                metaText.html(parts.join(' · '));
            }

            // 2. Студии
            var studiosContainer = render.find('.applecation__studios');
            if (studiosContainer.length) {
                var companies = (movie && movie.production_companies && movie.production_companies.length) ?
                    movie.production_companies.slice(0, 3) : [];

                if (companies.length) {
                    studiosContainer.empty().show();
                    companies.forEach(function(co) {
                        if (!co || !co.id) return;
                        var node = $('<div class="applecation__studio selector" data-id="' + co.id + '" data-name="' + (co.name || '') + '"></div>');

                        if (co.logo_path) {
                            var imgUrl = Lampa.Api.img(co.logo_path, 'h100');
                            node.append('<img src="' + imgUrl + '" title="' + (co.name || '') + '" />');
                        } else {
                            node.append('<span class="applecation__studio-name">' + (co.name || '') + '</span>');
                        }

                        node.on('hover:enter click', function() {
                            var id = $(this).data('id');
                            if (!id) return;
                            Lampa.Activity.push({
                                url: 'movie',
                                id: id,
                                title: $(this).data('name') || '',
                                component: 'company',
                                source: 'tmdb',
                                page: 1
                            });
                        });

                        studiosContainer.append(node);
                    });
                    studiosContainer.addClass('show');
                } else {
                    studiosContainer.hide();
                }
            }

            // 3. Рейтинги - используем данные из карточки
            var ratingsContainer = render.find('.applecation__ratings');
            if (ratingsContainer.length) {
                ratingsContainer.empty();
                var ratingItems = [];
                var allRatings = [];

                // Lampa
                if (lampaData && lampaData.rating > 0) {
                    var lampaColor = getRatingColor(lampaData.rating);
                    var lampaBg = getRatingBackgroundColor(lampaData.rating);
                    ratingItems.push({
                        source: 'Lampa',
                        value: lampaData.rating,
                        color: lampaColor,
                        bg: lampaBg,
                        icon: '❤️'
                    });
                    allRatings.push(lampaData.rating);
                }

                // TMDB
                if (ratings.tmdb > 0) {
                    var tmdbColor = getRatingColor(ratings.tmdb);
                    var tmdbBg = getRatingBackgroundColor(ratings.tmdb);
                    ratingItems.push({
                        source: 'TMDB',
                        value: ratings.tmdb,
                        color: tmdbColor,
                        bg: tmdbBg
                    });
                    allRatings.push(ratings.tmdb);
                }

                // IMDb
                if (ratings.imdb > 0) {
                    var imdbColor = getRatingColor(ratings.imdb);
                    var imdbBg = getRatingBackgroundColor(ratings.imdb);
                    ratingItems.push({
                        source: 'IMDb',
                        value: ratings.imdb,
                        color: imdbColor,
                        bg: imdbBg
                    });
                    allRatings.push(ratings.imdb);
                }

                // Кинопоиск
                if (ratings.kinopoisk > 0) {
                    var kpColor = getRatingColor(ratings.kinopoisk);
                    var kpBg = getRatingBackgroundColor(ratings.kinopoisk);
                    ratingItems.push({
                        source: 'Кинопоиск',
                        value: ratings.kinopoisk,
                        color: kpColor,
                        bg: kpBg
                    });
                    allRatings.push(ratings.kinopoisk);
                }

                // ИТОГ
                if (allRatings.length > 1) {
                    var sum = 0;
                    for (var i = 0; i < allRatings.length; i++) {
                        sum += allRatings[i];
                    }
                    var avg = sum / allRatings.length;
                    var avgColor = getRatingColor(avg);
                    var avgBg = getRatingBackgroundColor(avg);
                    ratingItems.push({
                        source: 'ИТОГ',
                        value: avg,
                        color: avgColor,
                        bg: avgBg,
                        isTotal: true
                    });
                }

                ratingItems.forEach(function(item) {
                    var displayValue = item.value.toFixed(1);
                    var extraClass = item.isTotal ? ' applecation__rating-item--total' : '';
                    var iconHtml = item.icon ? '<span class="rating-icon">' + item.icon + '</span>' : '';
                    
                    ratingsContainer.append(
                        '<div class="applecation__rating-item' + extraClass + '" style="border-color: ' + item.color + '40; background: ' + item.bg + ';">' +
                        iconHtml +
                        '<span class="rating-value" style="color: ' + item.color + ';">' + displayValue + '</span>' +
                        '<span class="rating-source">' + item.source + '</span>' +
                        '</div>'
                    );
                });

                if (ratingItems.length > 0) {
                    ratingsContainer.addClass('show');
                } else {
                    ratingsContainer.hide();
                }
            }

            // 4. Реакции Lampa
            var reactionsContainer = render.find('.applecation__reactions');
            if (reactionsContainer.length) {
                reactionsContainer.empty();
                var hasReactions = false;

                if (lampaData && lampaData.reactions && Array.isArray(lampaData.reactions) && lampaData.reactions.length > 0) {
                    var emojiMap = {
                        'fire': '🔥', 'nice': '👍', 'think': '🤔',
                        'bore': '😴', 'shit': '💩', 'like': '❤️', 'dislike': '👎'
                    };

                    var sorted = lampaData.reactions.slice().sort(function(a, b) {
                        return (parseInt(b.counter) || 0) - (parseInt(a.counter) || 0);
                    });

                    sorted.forEach(function(reaction) {
                        var count = parseInt(reaction.counter) || 0;
                        if (count === 0) return;
                        var emoji = emojiMap[reaction.type] || '⭐';
                        reactionsContainer.append(
                            '<div class="applecation__reaction-item">' +
                            '<span>' + emoji + '</span>' +
                            '<span class="reaction-count">' + count + '</span>' +
                            '</div>'
                        );
                        hasReactions = true;
                    });
                }

                if (hasReactions) {
                    reactionsContainer.addClass('show');
                } else {
                    reactionsContainer.hide();
                }
            }

            // 5. Описание
            var descWrapper = render.find('.applecation__description-wrapper');
            var description = render.find('.applecation__description');
            if (descWrapper.length && description.length) {
                var text = movie.overview || 'Описание отсутствует';
                description.text(text);

                if (descriptionOverlayEnabled) {
                    descWrapper.off('hover:enter').on('hover:enter', function() {
                        showDescriptionOverlay(movie);
                    });
                    descWrapper.addClass('selector');
                    if (window.Lampa && Lampa.Controller) {
                        try {
                            Lampa.Controller.collectionAppend(descWrapper);
                        } catch (e) {}
                    }
                } else {
                    descWrapper.removeClass('selector');
                    descWrapper.off('hover:enter');
                }
                descWrapper.addClass('show');
            }

            // 6. Информация о сезонах - из карточки
            var infoText = render.find('.applecation__info-text');
            if (infoText.length) {
                var infoParts = [];

                var date = movie.release_date || movie.first_air_date || '';
                if (date) {
                    var year = date.split('-')[0];
                    infoParts.push(year);
                }

                if (isTv) {
                    if (movie.episode_run_time && movie.episode_run_time.length) {
                        var m = movie.episode_run_time[0];
                        infoParts.push(m + ' ' + Lampa.Lang.translate('time_m').replace('.', ''));
                    }

                    // Текущий сезон
                    var currentSeason = 0;
                    var currentEpisode = 0;
                    var totalEpisodesInSeason = 0;

                    var lastEpisode = movie.last_episode_to_air;
                    if (lastEpisode) {
                        currentSeason = lastEpisode.season_number || 0;
                        currentEpisode = lastEpisode.episode_number || 0;
                        
                        if (movie.seasons && Array.isArray(movie.seasons)) {
                            for (var i = 0; i < movie.seasons.length; i++) {
                                if (movie.seasons[i].season_number === currentSeason) {
                                    totalEpisodesInSeason = movie.seasons[i].episode_count || 0;
                                    break;
                                }
                            }
                        }
                    }

                    if (currentSeason > 0) {
                        var seasonText = 'Сезон ' + currentSeason;
                        if (currentEpisode > 0 && totalEpisodesInSeason > 0) {
                            seasonText += ' · ' + currentEpisode + '/' + totalEpisodesInSeason + ' серий';
                        } else if (currentEpisode > 0) {
                            seasonText += ' · ' + currentEpisode + ' серия';
                        }
                        infoParts.push(
                            '<span class="applecation__season-info" style="background: #2196f3;">' +
                            seasonText +
                            '</span>'
                        );
                    }

                    // Всего серий
                    var totalSeasons = movie.number_of_seasons || 0;
                    var totalEpisodes = movie.number_of_episodes || 0;
                    
                    var totalText = '';
                    if (totalSeasons > 0 && totalEpisodes > 0) {
                        totalText = totalSeasons + ' сез. · ' + totalEpisodes + ' сер.';
                    } else if (totalSeasons > 0) {
                        totalText = totalSeasons + ' сез.';
                    } else if (totalEpisodes > 0) {
                        totalText = totalEpisodes + ' сер.';
                    }

                    if (totalText) {
                        infoParts.push(
                            '<span class="applecation__season-info" style="background: #e74c3c;">' +
                            'Всего: ' + totalText +
                            '</span>'
                        );
                    }

                    // Статус
                    if (movie.status) {
                        var statusText = getStatusText(movie.status);
                        var statusColor = getStatusColor(movie.status);
                        infoParts.push(
                            '<span class="applecation__status-info" style="background: ' + statusColor + ';">' +
                            statusText +
                            '</span>'
                        );
                    }
                } else if (movie.runtime && movie.runtime > 0) {
                    var h = Math.floor(movie.runtime / 60);
                    var mm = movie.runtime % 60;
                    var th = Lampa.Lang.translate('time_h').replace('.', '');
                    var tmm = Lampa.Lang.translate('time_m').replace('.', '');
                    var timeStr = h > 0 ? (h + ' ' + th + ' ' + mm + ' ' + tmm) : (mm + ' ' + tmm);
                    infoParts.push(timeStr);
                }

                if (infoParts.length) {
                    infoText.html(infoParts.join(' · '));
                    render.find('.applecation__info').addClass('show');
                }
            }

            // 7. Бейджи качества
            var badgesContainer = render.find('.applecation__quality-badges');
            if (badgesContainer.length) {
                badgesContainer.empty();
                var hasBadges = false;

                if (qualityData && qualityData.resolution && qualityData.resolution !== 'SD') {
                    var resClass = 'quality-badge--' + qualityData.resolution.toLowerCase().replace(/ /g, '');
                    var resLabel = qualityData.resolution;
                    
                    if (qualityData.resolution === '4K') resLabel = '4K';
                    else if (qualityData.resolution === 'FHD') resLabel = 'FHD';
                    else if (qualityData.resolution === 'HD') resLabel = 'HD';
                    else if (qualityData.resolution === '2K') resLabel = '2K';
                    else if (qualityData.resolution === 'TS') resLabel = 'TS';
                    
                    badgesContainer.append('<span class="quality-badge ' + resClass + '">' + resLabel + '</span>');
                    hasBadges = true;
                }

                if (qualityData && qualityData.dolbyVision) {
                    badgesContainer.append('<span class="quality-badge quality-badge--dv">Dolby Vision</span>');
                    hasBadges = true;
                } else if (qualityData && qualityData.hdr) {
                    badgesContainer.append('<span class="quality-badge quality-badge--hdr">HDR</span>');
                    hasBadges = true;
                }

                if (qualityData && qualityData.sound) {
                    badgesContainer.append('<span class="quality-badge quality-badge--sound">' + qualityData.sound + '</span>');
                    hasBadges = true;
                }

                if (qualityData && qualityData.dub) {
                    badgesContainer.append('<span class="quality-badge quality-badge--dub">DUB</span>');
                    hasBadges = true;
                }

                if (hasBadges) {
                    badgesContainer.addClass('show');
                } else {
                    badgesContainer.hide();
                }
            }
        } catch (e) {
            console.error('[AppleTV+] fillContent error:', e);
        }
    }

    // =================================================================
    // DESCRIPTION OVERLAY
    // =================================================================

    function showDescriptionOverlay(movie) {
        try {
            var text = movie.overview || 'Описание отсутствует';
            var title = movie.title || movie.name || '';

            $('.applecation-description-overlay').remove();

            var overlay = $(`
                <div class="applecation-description-overlay">
                    <div class="applecation-description-overlay__bg"></div>
                    <div class="applecation-description-overlay__content selector">
                        <div class="applecation-description-overlay__logo"></div>
                        <div class="applecation-description-overlay__title">${escapeHtml(title)}</div>
                        <div class="applecation-description-overlay__text">${escapeHtml(text)}</div>
                        <div class="applecation-description-overlay__details">
                            <div class="applecation-description-overlay__info">
                                <div class="applecation-description-overlay__info-name">Дата выхода</div>
                                <div class="applecation-description-overlay__info-body">${movie.release_date || movie.first_air_date || '-'}</div>
                            </div>
                            <div class="applecation-description-overlay__info" ${!movie.budget || movie.budget === 0 ? 'style="display:none;"' : ''}>
                                <div class="applecation-description-overlay__info-name">Бюджет</div>
                                <div class="applecation-description-overlay__info-body">$${Lampa.Utils.numberWithSpaces(movie.budget || 0)}</div>
                            </div>
                            <div class="applecation-description-overlay__info" ${!movie.production_countries || !movie.production_countries.length ? 'style="display:none;"' : ''}>
                                <div class="applecation-description-overlay__info-name">Страны</div>
                                <div class="applecation-description-overlay__info-body">${(movie.production_countries || []).map(function(c) { return c.name; }).join(', ')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            $('body').append(overlay);
            setTimeout(function() { overlay.addClass('show'); }, 10);

            var ctrl = {
                toggle: function() {
                    Lampa.Controller.collectionSet(overlay);
                    Lampa.Controller.collectionFocus(overlay.find('.applecation-description-overlay__content'), overlay);
                },
                back: function() {
                    var ol = $('.applecation-description-overlay');
                    if (!ol.length) return;
                    ol.removeClass('show');
                    setTimeout(function() { Lampa.Controller.toggle('content'); }, 300);
                }
            };

            Lampa.Controller.add('applecation_description', ctrl);
            Lampa.Controller.toggle('applecation_description');
        } catch (e) {
            console.error('[AppleTV+] showDescriptionOverlay error:', e);
        }
    }

    // =================================================================
    // LOGO LOADING
    // =================================================================

    function loadLogo(render, movie) {
        try {
            var logoImg = render.find('.applecation__logo');
            var wrapper = render.find('.applecation__logo-wrapper');
            var titleEl = render.find('.full-start-new__title');

            if (!logoImg.length || !wrapper.length) return;

            fetchLogo(movie, function(logo) {
                try {
                    if (!logo) {
                        titleEl.show();
                        wrapper.addClass('loaded');
                        return;
                    }

                    var logoUrl = getLogoUrl(logo);
                    if (!logoUrl) {
                        titleEl.show();
                        wrapper.addClass('loaded');
                        return;
                    }

                    var img = new Image();
                    img.onload = function() {
                        if (!render.closest('body').length) return;
                        logoImg.attr('src', logoUrl);
                        logoImg.show();
                        wrapper.addClass('loaded');
                        titleEl.hide();

                        var overlay = $('.applecation-description-overlay');
                        if (overlay.length) {
                            overlay.find('.applecation-description-overlay__logo')
                                .html($('<img>').attr('src', logoUrl))
                                .css('display', 'block');
                            overlay.find('.applecation-description-overlay__title')
                                .css('display', 'none');
                        }
                    };
                    img.onerror = function() {
                        titleEl.show();
                        wrapper.addClass('loaded');
                    };
                    img.src = logoUrl;
                } catch (e) {
                    titleEl.show();
                    wrapper.addClass('loaded');
                }
            });
        } catch (e) {
            console.error('[AppleTV+] loadLogo error:', e);
        }
    }

    // =================================================================
    // ANIMATIONS
    // =================================================================

    function setupAnimations(render) {
        try {
            setTimeout(function() {
                if (!render.closest('body').length) return;

                render.find('.applecation__meta, .applecation__studios, .applecation__ratings, .applecation__reactions, .applecation__description-wrapper, .applecation__info').each(function() {
                    $(this).addClass('show');
                });

                render.find('.applecation__meta, .applecation__studios, .applecation__ratings, .applecation__reactions, .applecation__description-wrapper, .applecation__info').css('opacity', '1');
            }, 350);

            var bg = render.find('.full-start__background:not(.applecation__overlay)');
            if (bg.length) {
                if (bg.hasClass('loaded')) {
                    bg.addClass('applecation-animated');
                } else {
                    var interval = setInterval(function() {
                        if (bg.hasClass('loaded')) {
                            clearInterval(interval);
                            bg.addClass('applecation-animated');
                        }
                    }, 100);
                }
            }
        } catch (e) {
            console.error('[AppleTV+] setupAnimations error:', e);
        }
    }

    // =================================================================
    // STYLES
    // =================================================================

    function injectStyles() {
        try {
            $('#applecation_plus_css').remove();

            var css = `
            .applecation { transition: all .3s !important; }
            .applecation .full-start-new__body { height: 80vh !important; min-height: 400px !important; }
            .applecation .full-start-new__right { display: flex !important; align-items: flex-end !important; padding: 0 2em 2em 2em !important; }
            .applecation .full-start-new__left { display: none !important; }
            .applecation .applecation__left { flex: 1 !important; width: 100% !important; }
            .applecation .applecation__content-wrapper { font-size: 100% !important; max-width: 45vw !important; background: rgba(0,0,0,0.3) !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important; padding: 1.5em !important; border-radius: 1em !important; border: 1px solid rgba(255,255,255,0.05) !important; }
            .applecation__logo-wrapper { margin-bottom: 0.5em !important; opacity: 0 !important; transform: translateY(20px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__logo-wrapper.loaded { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__logo { display: block !important; max-width: 30vw !important; max-height: 150px !important; width: auto !important; height: auto !important; object-fit: contain !important; object-position: left center !important; filter: drop-shadow(0 2px 10px rgba(0,0,0,0.5)) !important; }
            .applecation .full-start-new__title { font-size: 2.5em !important; font-weight: 700 !important; line-height: 1.2 !important; margin-bottom: 0.3em !important; color: #fff !important; text-shadow: 0 2px 10px rgba(0,0,0,0.5) !important; }
            .applecation__meta { display: flex !important; align-items: center !important; flex-wrap: wrap !important; color: #fff !important; font-size: 1em !important; margin-bottom: 0.5em !important; line-height: 1 !important; gap: 0.5em !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__meta.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__meta-text { opacity: 0.85 !important; }
            .applecation__age-rating { display: inline-flex !important; align-items: center !important; padding: 0.1em 0.4em !important; border-radius: 0.2em !important; border: 1.5px solid !important; font-size: 0.8em !important; font-weight: 700 !important; }
            .applecation__studios { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.7em !important; margin: 0 0 0.5em 0 !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__studios.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__studio { display: inline-flex !important; align-items: center !important; gap: 0.4em !important; background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 0.6em !important; padding: 0.25em 0.6em !important; transition: all 0.2s ease !important; cursor: pointer !important; }
            .applecation__studio.focus { background: rgba(255,255,255,0.2) !important; border-color: #fff !important; transform: scale(1.05) !important; }
            .applecation__studio img { height: 1.3em !important; max-width: 120px !important; width: auto !important; object-fit: contain !important; filter: brightness(0) invert(1) !important; }
            .applecation__ratings { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.5em !important; margin-bottom: 0.5em !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__ratings.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__rating-item { display: flex !important; align-items: center !important; gap: 0.35em !important; padding: 0.2em 0.6em !important; border-radius: 0.4em !important; background: rgba(0,0,0,0.5) !important; border: 1.5px solid rgba(255,255,255,0.15) !important; font-size: 0.8em !important; font-weight: 600 !important; color: #fff !important; line-height: 1 !important; }
            .applecation__rating-item .rating-value { font-size: 1.05em !important; font-weight: 700 !important; }
            .applecation__rating-item .rating-source { font-size: 0.7em !important; opacity: 0.7 !important; margin-left: 0.15em !important; }
            .applecation__rating-item .rating-icon { margin-right: 0.1em; }
            .applecation__rating-item--total { border-color: rgba(255,215,0,0.5) !important; background: rgba(255,215,0,0.15) !important; }
            .applecation__reactions { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.6em !important; margin-bottom: 0.5em !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__reactions.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__reaction-item { display: flex !important; align-items: center !important; gap: 0.3em !important; padding: 0.15em 0.5em !important; border-radius: 0.4em !important; background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.08) !important; font-size: 0.85em !important; color: #fff !important; line-height: 1 !important; }
            .applecation__reaction-item .reaction-count { font-weight: 600 !important; font-size: 0.9em !important; }
            .applecation__description-wrapper { background: transparent !important; padding: 0 !important; border-radius: 1em !important; width: fit-content !important; opacity: 0 !important; transform: translateY(15px) !important; transition: padding 0.25s ease, transform 0.25s ease, opacity 0.4s ease-out !important; cursor: pointer !important; }
            .applecation__description-wrapper.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__description-wrapper.focus { background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.18)) !important; padding: 0.15em 0.4em 0 0.7em !important; border-radius: 1em !important; width: fit-content !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35) !important; transform: scale(1.07) translateY(0) !important; }
            .applecation__description { color: rgba(255,255,255,0.6) !important; font-size: 0.95em !important; line-height: 1.5 !important; margin-bottom: 0.5em !important; max-width: 35vw !important; display: -webkit-box !important; -webkit-line-clamp: 4 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; text-overflow: ellipsis !important; }
            .focus .applecation__description { color: rgba(255,255,255,0.92) !important; }
            .applecation__info { color: rgba(255,255,255,0.75) !important; font-size: 0.95em !important; line-height: 1.4 !important; margin-bottom: 0.5em !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.5em !important; }
            .applecation__info.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__season-info { display: inline-flex !important; align-items: center !important; padding: 0.15em 0.5em !important; border-radius: 0.3em !important; color: #fff !important; font-size: 0.8em !important; font-weight: 600 !important; line-height: 1.3 !important; }
            .applecation__status-info { display: inline-flex !important; align-items: center !important; padding: 0.15em 0.5em !important; border-radius: 0.3em !important; color: #fff !important; font-size: 0.8em !important; font-weight: 600 !important; line-height: 1.3 !important; }
            .applecation__quality-badges { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.4em !important; margin-left: 0.6em !important; opacity: 0 !important; transform: translateY(10px) !important; transition: opacity 0.3s ease-out, transform 0.3s ease-out !important; }
            .applecation__quality-badges.show { opacity: 1 !important; transform: translateY(0) !important; }
            .quality-badge { display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 0.15em 0.5em !important; border-radius: 0.3em !important; font-size: 0.7em !important; font-weight: 700 !important; line-height: 1.3 !important; color: #fff !important; text-transform: uppercase !important; letter-spacing: 0.03em !important; border: 1px solid rgba(255,255,255,0.15) !important; background: rgba(0,0,0,0.5) !important; }
            .quality-badge--4k { background: rgba(46,204,113,0.8) !important; border-color: rgba(46,204,113,0.4) !important; }
            .quality-badge--fhd { background: rgba(52,152,219,0.8) !important; border-color: rgba(52,152,219,0.4) !important; }
            .quality-badge--hd { background: rgba(243,156,18,0.8) !important; border-color: rgba(243,156,18,0.4) !important; }
            .quality-badge--hdr { background: rgba(155,89,182,0.8) !important; border-color: rgba(155,89,182,0.4) !important; }
            .quality-badge--dv { background: rgba(231,76,60,0.8) !important; border-color: rgba(231,76,60,0.4) !important; }
            .quality-badge--dub { background: rgba(26,188,156,0.8) !important; border-color: rgba(26,188,156,0.4) !important; }
            .quality-badge--sound { background: rgba(241,196,15,0.8) !important; border-color: rgba(241,196,15,0.4) !important; color: #000 !important; }
            .applecation .full-start-new__buttons { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 0.6em !important; margin-top: 0.5em !important; }
            .applecation .full-start__button { min-height: 2.6em !important; padding: 0.4em 1em !important; border-radius: 0.8em !important; background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.12) !important; color: rgba(255,255,255,0.9) !important; font-size: 0.85em !important; font-weight: 600 !important; transition: all 0.25s ease !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important; }
            .applecation .full-start__button.focus, .applecation .full-start__button.hover { background: rgba(255,255,255,0.18) !important; border-color: rgba(255,255,255,0.3) !important; transform: scale(1.05) !important; }
            .applecation .full-start__button.button--play { background: linear-gradient(135deg, rgba(82,255,179,0.9), rgba(105,183,226,0.9)) !important; border-color: rgba(82,255,179,0.4) !important; color: #000 !important; }
            .applecation .full-start-new__head, .applecation .full-start-new__details, .applecation .full-descr, .applecation .full-descr__title, .applecation .full-start__head, .applecation .full-start-new__reactions, .applecation .full-start-new__rate-line, .applecation .full-start-new__left { display: none !important; }
            @media screen and (max-width: 720px) { .applecation .full-start-new__body { height: auto !important; min-height: 0 !important; } .applecation .full-start-new__right { display: block !important; padding: 0 1em 1em 1em !important; } .applecation .applecation__content-wrapper { max-width: 100% !important; padding: 1em !important; } .applecation .applecation__description { max-width: none !important; width: 100% !important; -webkit-line-clamp: 3 !important; } .applecation__logo { max-width: 60vw !important; max-height: 80px !important; } .applecation .full-start-new__title { font-size: 1.8em !important; } }
            @media screen and (max-width: 480px) { .applecation .applecation__description { -webkit-line-clamp: 2 !important; } .applecation__logo { max-width: 70vw !important; max-height: 60px !important; } .applecation .full-start-new__title { font-size: 1.4em !important; } .applecation .applecation__meta { font-size: 0.85em !important; } .applecation .applecation__ratings { font-size: 0.8em !important; } }
            `;

            $('head').append('<style id="applecation_plus_css">' + css + '</style>');
            console.log('[AppleTV+] Styles injected');
        } catch (e) {
            console.error('[AppleTV+] injectStyles error:', e);
        }
    }

    function injectAdditionalStyles() {
        try {
            $('#applecation_plus_extra_css').remove();

            var css = `
            .applecation .applecation__overlay {
                width: 90vw !important;
                background: linear-gradient(to right,
                    rgba(0,0,0,0.85) 0%,
                    rgba(0,0,0,0.50) 25%,
                    rgba(0,0,0,0.25) 45%,
                    rgba(0,0,0,0.10) 55%,
                    rgba(0,0,0,0.04) 60%,
                    rgba(0,0,0,0) 65%
                ) !important;
                pointer-events: none !important;
                z-index: 1 !important;
            }

            .applecation .full-start__background {
                height: calc(100% + 6em) !important;
                left: 0 !important;
                opacity: 0 !important;
                transition: opacity 0.6s ease-out, filter 0.3s ease-out !important;
                animation: none !important;
                transform: none !important;
                will-change: opacity, filter !important;
                image-rendering: auto !important;
            }

            .applecation .full-start__background.loaded:not(.dim) {
                opacity: 1 !important;
                image-rendering: auto !important;
            }

            .applecation .full-start__background.dim {
                filter: blur(30px) !important;
            }

            .applecation .full-start__background.loaded.applecation-animated {
                opacity: 1 !important;
            }

            .applecation-description-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 9999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
                transition: opacity 0.3s ease, visibility 0.3s ease !important;
            }

            .applecation-description-overlay.show {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: all !important;
            }

            .applecation-description-overlay__bg {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                backdrop-filter: blur(100px) !important;
                -webkit-backdrop-filter: blur(100px) !important;
                background: rgba(0,0,0,0.6) !important;
            }

            .applecation-description-overlay__content {
                position: relative !important;
                z-index: 1 !important;
                max-width: 60vw !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
                padding: 2em !important;
                background: rgba(20,20,30,0.9) !important;
                border-radius: 1.2em !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
            }

            .applecation-description-overlay__title {
                font-size: 2em !important;
                font-weight: 600 !important;
                margin-bottom: 1em !important;
                color: #fff !important;
                text-align: center !important;
            }

            .applecation-description-overlay__text {
                font-size: 1.2em !important;
                line-height: 1.6 !important;
                color: rgba(255,255,255,0.9) !important;
                white-space: pre-wrap !important;
                margin-bottom: 1.5em !important;
            }

            .applecation-description-overlay__details {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 1.5em !important;
            }

            .applecation-description-overlay__info-name {
                font-size: 0.9em !important;
                opacity: 0.6 !important;
                margin-bottom: 0.3em !important;
            }

            .applecation-description-overlay__info-body {
                font-size: 1.1em !important;
                opacity: 0.9 !important;
            }

            @keyframes applecation-fade-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .applecation .applecation-animate-in {
                animation: applecation-fade-in 0.5s ease forwards !important;
            }
            `;

            $('head').append('<style id="applecation_plus_extra_css">' + css + '</style>');
            console.log('[AppleTV+] Extra styles injected');
        } catch (e) {
            console.error('[AppleTV+] injectAdditionalStyles error:', e);
        }
    }

    // =================================================================
    // SETTINGS
    // =================================================================    function addSettings() {
        try {
            if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;

            Lampa.SettingsApi.addComponent({
                component: 'applecation_plus',
                name: 'AppleTV+',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 18l20 12-10 2 2 10-12-24z" fill="currentColor"/><path d="M44 20l6-6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
                after: 'interface'
            });

            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_poster_quality', type: 'select', values: {
                    '720p': '720p (HD)',
                    '1080p': '1080p (FHD)',
                    '4k': '4K (Ultra HD)',
                    '8k': '8K (Super Ultra HD)'
                }, default: '4k' },
                field: { name: 'Качество постера', description: 'Выберите качество изображений постеров и фона' },
                onChange: function(value) {
                    Lampa.Storage.set('applecation_poster_quality', value);
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_description_overlay', type: 'trigger', default: false },
                field: { name: 'Описание в оверлее', description: 'Показывать описание в отдельном окне при нажатии' }
            });

            // Кнопка очистки кэша
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_clear_cache', type: 'trigger', default: false },
                field: { 
                    name: '🗑️ Очистить кэш AppleTV+', 
                    description: 'Очистить все кэшированные данные (рейтинги, информация о сезонах, реакции) и перезагрузить страницу' 
                },
                onChange: function(value) {
                    if (value === true || value === 'true' || value === 1 || value === '1') {
                        clearAllCache();
                        setTimeout(function() {
                            try {
                                Lampa.Storage.set('applecation_clear_cache', false);
                            } catch (e) {}
                        }, 100);
                    }
                }
            });

            // Кнопка перезагрузки
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_reload', type: 'trigger', default: false },
                field: { 
                    name: '🔄 Перезагрузить страницу', 
                    description: 'Просто перезагрузить текущую страницу без очистки кэша' 
                },
                onChange: function(value) {
                    if (value === true || value === 'true' || value === 1 || value === '1') {
                        reloadPage();
                        setTimeout(function() {
                            try {
                                Lampa.Storage.set('applecation_reload', false);
                            } catch (e) {}
                        }, 100);
                    }
                }
            });

        } catch (e) {
            console.error('[AppleTV+] addSettings error:', e);
        }
    }

    function clearAllCache() {
        try {
            // Очищаем in-memory кэши
            _jacredCache = {};
            _logoCache = {};
            _lampaRatingCache = {};

            // Очищаем Storage кэши
            var keys = ['jacred_', 'lampa_rating_', 'logo_'];
            var allKeys = [];
            try {
                var storage = Lampa.Storage.getAll ? Lampa.Storage.getAll() : {};
                for (var key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        for (var i = 0; i < keys.length; i++) {
                            if (key.indexOf(keys[i]) === 0) {
                                allKeys.push(key);
                                break;
                            }
                        }
                    }
                }
            } catch (e) {}

            for (var j = 0; j < allKeys.length; j++) {
                try {
                    Lampa.Storage.set(allKeys[j], null);
                } catch (e) {}
            }

            console.log('[AppleTV+] All cache cleared');
            Lampa.Noty.show('Кэш AppleTV+ очищен');

            setTimeout(function() {
                location.reload();
            }, 500);

        } catch (e) {
            console.error('[AppleTV+] clearAllCache error:', e);
            Lampa.Noty.show('Ошибка очистки кэша');
        }
    }

    function reloadPage() {
        try {
            Lampa.Noty.show('Перезагрузка...');
            setTimeout(function() {
                location.reload();
            }, 300);
        } catch (e) {
            location.reload();
        }
    }

    // =================================================================
    // INIT
    // =================================================================

    function init() {
        try {
            if (typeof Lampa === 'undefined') {
                console.error('[AppleTV+] Lampa not found');
                return;
            }

            console.log('[AppleTV+] Initializing v' + PLUGIN_VERSION);

            addSettings();
            initPlugin();

            console.log('[AppleTV+] Initialized successfully');

        } catch (err) {
            console.error('[AppleTV+] Initialization error:', err);
        }
    }

    // =================================================================
    // START
    // =================================================================

    if (window.appready) {
        init();
    } else if (typeof Lampa !== 'undefined' && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') init();
        });
    } else {
        console.warn('[AppleTV+] Lampa.Listener not available, starting immediately');
        init();
    }

})();
