// @name AppleTV+
// @version 2.0.0
// @author Your Name
// @description Расширенная карточка фильма в стиле Apple TV+ с интеграцией Jacred, качественными бейджами и стеклянными эффектами
// @lampa-check Lampa.

(function() {
    'use strict';

    // =================================================================
    // CONFIGURATION & CONSTANTS
    // =================================================================

    var PLUGIN_VERSION = '2.0.0';
    var PLUGIN_NAME = 'AppleTV+';
    var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа
    var PROXY_TIMEOUT = 10000;

    // Базовые URL для ресурсов
    var ANIMATED_REACTIONS_BASE_URL = 'https://amikdn.github.io/img';
    var SVG_REACTIONS_BASE_URL = 'https://cubnotrip.top/img/reactions';

    // Прокси-сервера для обхода CORS
    var PROXY_LIST = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ];

    // =================================================================
    // I18N (локализация)
    // =================================================================

    var LANG = (Lampa.Storage.get('language', 'uk') || 'uk').toLowerCase();
    if (LANG === 'ua') LANG = 'uk';
    if (['uk', 'ru', 'en', 'pl'].indexOf(LANG) === -1) LANG = 'en';

    var I18N = {
        meta_type_movie: { uk: 'Фільм', ru: 'Фильм', en: 'Movie', pl: 'Film' },
        meta_type_tv: { uk: 'Серіал', ru: 'Сериал', en: 'TV Series', pl: 'Serial' },
        watch_button: { uk: 'Дивитися', ru: 'Смотреть', en: 'Watch', pl: 'Oglądaj' },
        trailer_button: { uk: 'Трейлер', ru: 'Трейлер', en: 'Trailer', pl: 'Zwiastun' },
        details_button: { uk: 'Деталі', ru: 'Подробнее', en: 'Details', pl: 'Szczegóły' },
        reactions_label: { uk: 'Реакції', ru: 'Реакции', en: 'Reactions', pl: 'Reakcje' },
        loading: { uk: 'Завантаження...', ru: 'Загрузка...', en: 'Loading...', pl: 'Ładowanie...' },
        no_overview: { uk: 'Опис відсутній', ru: 'Описание отсутствует', en: 'No overview available', pl: 'Brak opisu' },
        budget: { uk: 'Бюджет', ru: 'Бюджет', en: 'Budget', pl: 'Budżet' },
        release_date: { uk: 'Дата виходу', ru: 'Дата выхода', en: 'Release date', pl: 'Data premiery' },
        countries: { uk: 'Країни', ru: 'Страны', en: 'Countries', pl: 'Kraje' },
        seasons: { uk: 'Сезон', ru: 'Сезон', en: 'Season', pl: 'Sezon' },
        episodes: { uk: 'Серій', ru: 'Серий', en: 'Episodes', pl: 'Odcinków' },
        season_info: { uk: 'Сезон {s}: {e} серій', ru: 'Сезон {s}: {e} серий', en: 'Season {s}: {e} episodes', pl: 'Sezon {s}: {e} odcinków' }
    };

    function t(key) {
        var pack = I18N[key];
        if (!pack) return key;
        return pack[LANG] || pack.uk || pack.en || key;
    }

    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================

    function isComponentActive(component) {
        return component && !component.__destroyed;
    }

    function getTmdbKey() {
        var custom = (Lampa.Storage.get('applecation_tmdb_apikey') || '').trim();
        return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
    }

    function getLanguage() {
        return Lampa.Storage.get('language', 'uk') || 'uk';
    }

    function formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return String(num);
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

    function getSeasonInfoColor(isCompleted) {
        return isCompleted ? 'rgba(46,204,113,0.85)' : 'rgba(231,76,60,0.85)';
    }

    function getTypeLabel(movie) {
        var isTv = !!(movie.name || movie.original_name || movie.first_air_date || movie.number_of_seasons);
        return isTv ? t('meta_type_tv') : t('meta_type_movie');
    }

    function pluralSeasons(count) {
        var lang = LANG;
        if (['ru', 'uk', 'be', 'bg'].indexOf(lang) !== -1) {
            var t = [2, 0, 1, 1, 1, 2];
            var a = {
                ru: ['сезон', 'сезона', 'сезонов'],
                uk: ['сезон', 'сезони', 'сезонів'],
                be: ['сезон', 'сезоны', 'сезонаў'],
                bg: ['сезон', 'сезона', 'сезона']
            };
            return count + ' ' + ((a[lang] || a.ru)[count % 100 > 4 && count % 100 < 20 ? 2 : t[Math.min(count % 10, 5)]]);
        }
        if (lang === 'en') return count === 1 ? count + ' Season' : count + ' Seasons';
        var key = 'full_season';
        return count === 1 ? count + ' ' + key : count + ' ' + key + 's';
    }

    // =================================================================
    // JACRED QUALITY INTEGRATION
    // =================================================================

    var _jacredCache = {};
    var workingProxy = null;

    function fetchWithProxy(url, callback) {
        var network = new Lampa.Reguest();
        network.timeout(PROXY_TIMEOUT);
        
        // Сначала пробуем прямой запрос через Lampa.Reguest
        network.silent(url, function(data) {
            console.log('[AppleTV+] Jacred: Direct success');
            workingProxy = 'direct';
            callback(null, data);
        }, function() {
            console.log('[AppleTV+] Jacred: Direct failed, trying proxies...');
            tryProxies(url, callback);
        });
    }

    function tryProxies(url, callback) {
        var proxyList = (workingProxy && workingProxy !== 'direct') ? [workingProxy] : PROXY_LIST;

        function tryProxy(index) {
            if (index >= proxyList.length) {
                console.error('[AppleTV+] Jacred: All proxies failed');
                callback(new Error('No proxy worked'));
                return;
            }
            var p = proxyList[index];
            var target = p.indexOf('url=') > -1 ? p + encodeURIComponent(url) : p + url;
            console.log('[AppleTV+] Jacred: Fetching via proxy:', p);

            var xhr = new XMLHttpRequest();
            xhr.open('GET', target, true);
            xhr.timeout = PROXY_TIMEOUT;
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('[AppleTV+] Jacred: Proxy success:', p);
                    workingProxy = p;
                    callback(null, xhr.responseText);
                } else {
                    console.warn('[AppleTV+] Jacred: Proxy failed:', xhr.status, p);
                    tryProxy(index + 1);
                }
            };
            xhr.onerror = function() {
                console.warn('[AppleTV+] Jacred: Proxy error:', p);
                tryProxy(index + 1);
            };
            xhr.ontimeout = function() {
                console.warn('[AppleTV+] Jacred: Proxy timeout:', p);
                tryProxy(index + 1);
            };
            xhr.send();
        }
        tryProxy(0);
    }

    function getBestJacred(card, callback) {
        var cacheKey = 'jacred_v4_' + (card.id || card.tmdb_id);
        var now = Date.now();

        // Проверяем in-memory кэш
        if (_jacredCache[cacheKey] && (now - _jacredCache[cacheKey]._ts < CACHE_TTL)) {
            console.log('[AppleTV+] Jacred: Memory cache HIT');
            callback(_jacredCache[cacheKey]);
            return;
        }

        // Проверяем localStorage кэш
        try {
            var raw = Lampa.Storage.get(cacheKey, null);
            if (raw && raw._ts && (now - raw._ts < CACHE_TTL)) {
                console.log('[AppleTV+] Jacred: Storage cache HIT');
                _jacredCache[cacheKey] = raw;
                callback(raw);
                return;
            }
        } catch (e) {}

        var title = (card.original_title || card.title || card.name || '').toLowerCase();
        var year = (card.release_date || card.first_air_date || '').substr(0, 4);

        if (!title || !year) {
            console.warn('[AppleTV+] Jacred: No title or year');
            callback(null);
            return;
        }

        var apiUrl = 'https://jr.maxvol.pro/api/v1.0/torrents?search=' + encodeURIComponent(title) + '&year=' + year;
        console.log('[AppleTV+] Jacred: Fetching:', apiUrl);

        fetchWithProxy(apiUrl, function(err, data) {
            if (err || !data) {
                callback(null);
                return;
            }

            try {
                var parsed;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    console.error('[AppleTV+] Jacred: JSON parse error');
                    callback(null);
                    return;
                }

                // Обрабатываем обертку AllOrigins
                if (parsed.contents) {
                    try {
                        parsed = JSON.parse(parsed.contents);
                    } catch (e) {
                        console.log('[AppleTV+] Jacred: Failed to parse inner contents');
                    }
                }

                var results = Array.isArray(parsed) ? parsed : (parsed.Results || []);
                if (!results.length) {
                    var emptyData = { empty: true, _ts: now };
                    _jacredCache[cacheKey] = emptyData;
                    try { Lampa.Storage.set(cacheKey, emptyData); } catch (e) {}
                    callback(null);
                    return;
                }

                var best = {
                    resolution: 'SD',
                    hdr: false,
                    dolbyVision: false,
                    sound: null,
                    dub: false,
                    rus: false,
                    ukr: false,
                    eng: false
                };

                var resOrder = ['SD', 'HD', 'FHD', '2K', '4K'];

                results.forEach(function(item) {
                    var t = (item.title || '').toLowerCase();
                    var voices = Array.isArray(item.voices) ? item.voices : [];
                    var voicesStr = (voices.join(' ') || '').toLowerCase();
                    var videotype = (item.videotype || '').toLowerCase();

                    // Определяем качество
                    var currentRes = 'SD';
                    var q = parseInt(item.quality || 0, 10);
                    if (q >= 2160) currentRes = '4K';
                    else if (q >= 1440) currentRes = '2K';
                    else if (q >= 1080) currentRes = 'FHD';
                    else if (q >= 720) currentRes = 'HD';

                    if (currentRes === 'SD') {
                        if (t.indexOf('4k') >= 0 || t.indexOf('2160') >= 0) currentRes = '4K';
                        else if (t.indexOf('2k') >= 0 || t.indexOf('1440') >= 0) currentRes = '2K';
                        else if (t.indexOf('1080') >= 0 || t.indexOf('fhd') >= 0) currentRes = 'FHD';
                        else if (t.indexOf('720') >= 0 || t.indexOf('hd') >= 0) currentRes = 'HD';
                    }

                    if (resOrder.indexOf(currentRes) > resOrder.indexOf(best.resolution)) {
                        best.resolution = currentRes;
                    }

                    // Определяем озвучку
                    if (t.indexOf('ukr') >= 0 || t.indexOf('укр') >= 0 || t.indexOf('ua') >= 0) {
                        best.ukr = true;
                    }
                    if (t.indexOf('rus') >= 0 || t.indexOf('russian') >= 0 || t.indexOf('рус') >= 0) {
                        best.rus = true;
                    }
                    if (t.indexOf('eng') >= 0 || t.indexOf('english') >= 0) {
                        best.eng = true;
                    }
                    if (t.indexOf('dub') >= 0 || t.indexOf('дубляж') >= 0) {
                        best.dub = true;
                    }

                    // Определяем HDR
                    if (videotype.indexOf('dolby') >= 0 || videotype.indexOf('dv') >= 0) {
                        best.dolbyVision = true;
                        best.hdr = true;
                    } else if (videotype.indexOf('hdr') >= 0 || t.indexOf('hdr') >= 0) {
                        best.hdr = true;
                    }

                    // Определяем звук
                    if (t.indexOf('7.1') >= 0) best.sound = '7.1';
                    else if (t.indexOf('5.1') >= 0) best.sound = '5.1';
                    else if (t.indexOf('2.0') >= 0) best.sound = '2.0';
                });

                best._ts = now;
                _jacredCache[cacheKey] = best;
                try { Lampa.Storage.set(cacheKey, best); } catch (e) {}
                console.log('[AppleTV+] Jacred: Result:', best);
                callback(best);

            } catch (e) {
                console.error('[AppleTV+] Jacred: Error processing results:', e);
                callback(null);
            }
        });
    }

    // =================================================================
    // TMDB LOGO FETCH
    // =================================================================

    var _logoCache = {};

    function fetchLogo(movie, callback) {
        if (!movie || !movie.id) {
            callback(null);
            return;
        }

        var type = movie.name ? 'tv' : 'movie';
        var cacheKey = type + '_' + movie.id + '_logo';
        var now = Date.now();

        // Проверяем кэш
        if (_logoCache[cacheKey] && (now - _logoCache[cacheKey]._ts < CACHE_TTL)) {
            callback(_logoCache[cacheKey]);
            return;
        }

        var lang = LANG;
        var url = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey() + '&language=' + lang);
        var urlAll = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey());

        var network = new Lampa.Reguest();
        network.timeout(PROXY_TIMEOUT);

        network.silent(url, function(data) {
            if (data && data.logos && data.logos.length) {
                var logo = data.logos.find(function(l) {
                    return l.iso_639_1 === lang;
                }) || data.logos.find(function(l) {
                    return l.iso_639_1 === 'en';
                }) || data.logos[0];

                if (logo) {
                    var result = {
                        file_path: logo.file_path,
                        _ts: now
                    };
                    _logoCache[cacheKey] = result;
                    callback(result);
                    return;
                }
            }

            // Fallback на английский
            network.silent(urlAll, function(dataAll) {
                if (dataAll && dataAll.logos && dataAll.logos.length) {
                    var logo = dataAll.logos.find(function(l) {
                        return l.iso_639_1 === 'en';
                    }) || dataAll.logos[0];

                    if (logo) {
                        var result = {
                            file_path: logo.file_path,
                            _ts: now
                        };
                        _logoCache[cacheKey] = result;
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
    }

    function getLogoUrl(logo, size) {
        if (!logo || !logo.file_path) return null;
        var posterSize = Lampa.Storage.field('poster_size') || 'w500';
        var sizeMap = {
            'w200': 'w300',
            'w300': 'w500',
            'w500': 'original'
        };
        var targetSize = sizeMap[posterSize] || 'w500';
        if (size) targetSize = size;
        return Lampa.TMDB.image('/t/p/' + targetSize + logo.file_path);
    }

    // =================================================================
    // MAIN PLUGIN: Applecation Full Card
    // =================================================================

    function initApplecationFullCard() {
        if (window._applecation_full_card_initialized) return;
        window._applecation_full_card_initialized = true;

        if (typeof Lampa === 'undefined') {
            console.error('[AppleTV+] Lampa not found');
            return;
        }

        // Добавляем CSS стили
        injectStyles();

        // Переопределяем шаблон full_start_new
        overrideFullStartTemplate();

        // Добавляем обработчик события full
        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;

            var activity = e.object && e.object.activity;
            if (!activity || !activity.render) return;

            var render = activity.render();
            if (!render || !render.length) return;

            // Маркируем контейнер как обработанный
            if (render.data('applecation_processed')) return;
            render.data('applecation_processed', true);

            var movie = e.data && e.data.movie;
            if (!movie) return;

            // Сохраняем ссылку на активность
            activity.__destroyed = false;
            var oldDestroy = activity.destroy;
            activity.destroy = function() {
                activity.__destroyed = true;
                if (oldDestroy) oldDestroy.apply(activity, arguments);
            };

            // Применяем стиль Applecation
            render.addClass('applecation');

            // Добавляем оверлей для фона
            addBackgroundOverlay(render);

            // Заполняем мета-информацию
            fillMetaInfo(render, movie);

            // Заполняем студии
            fillStudios(render, movie);

            // Заполняем описание
            fillDescription(render, movie);

            // Заполняем дополнительную информацию
            fillInfo(render, movie);

            // Заполняем рейтинги (интеграция с Интерфейс Мод)
            fillRatings(render, movie);

            // Заполняем реакции Lampa
            fillReactions(render, movie);

            // Заполняем качественные бейджи
            fillQualityBadges(render, movie);

            // Загружаем логотип
            loadLogo(render, movie);

            // Настраиваем анимации
            setupAnimations(render);

            // Обновляем контроллер
            setTimeout(function() {
                if (isComponentActive(activity)) {
                    try {
                        Lampa.Controller.toggle('full_start');
                    } catch (err) {}
                }
            }, 200);
        });
    }

    // =================================================================
    // STYLES
    // =================================================================

    function injectStyles() {
        if (document.getElementById('applecation_plus_css')) return;

        var css = `
            /* ============================================================
               AppleTV+ - Основные стили
               ============================================================ */

            .applecation {
                transition: all .3s;
            }

            .applecation .full-start-new__body {
                height: 80vh;
                min-height: 400px;
            }

            .applecation .full-start-new__right {
                display: flex;
                align-items: flex-end;
                padding: 0 2em 2em 2em;
            }

            /* ============================================================
               Логотип
               ============================================================ */

            .applecation__logo-wrapper {
                margin-bottom: 0.5em;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.4s ease-out, transform 0.4s ease-out;
            }

            .applecation__logo-wrapper.loaded {
                opacity: 1;
                transform: translateY(0);
            }

            .applecation__logo {
                display: block;
                max-width: 35vw;
                max-height: 180px;
                width: auto;
                height: auto;
                object-fit: contain;
                object-position: left center;
                filter: drop-shadow(0 2px 10px rgba(0,0,0,0.5));
            }

            /* ============================================================
               Мета-информация
               ============================================================ */

            .applecation__meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                color: #fff;
                font-size: 1.1em;
                margin-bottom: 0.5em;
                line-height: 1;
                opacity: 0;
                transform: translateY(15px);
                transition: opacity 0.4s ease-out, transform 0.4s ease-out;
                transition-delay: 0.05s;
                gap: 0.5em;
            }

            .applecation__meta.show {
                opacity: 1;
                transform: translateY(0);
            }

            .applecation__meta-left {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.5em;
            }

            .applecation__network {
                display: inline-flex;
                align-items: center;
                line-height: 1;
            }

            .applecation__network img {
                display: block;
                max-height: 0.8em;
                width: auto;
                object-fit: contain;
                filter: brightness(0) invert(1);
            }

            .applecation__meta-text {
                margin-left: 0.5em;
                line-height: 1;
                opacity: 0.85;
            }

            /* ============================================================
               Студии
               ============================================================ */

            .applecation__studios {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.7em;
                margin: 0 0 0.6em 0;
                opacity: 0;
                transform: translateY(15px);
                transition: opacity 0.4s ease-out, transform 0.4s ease-out;
                transition-delay: 0.07s;
            }

            .applecation__studios.show {
                opacity: 1;
                transform: translateY(0);
            }

            .applecation__studio {
                display: inline-flex;
                align-items: center;
                gap: 0.4em;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 0.6em;
                padding: 0.25em 0.6em;
                transition: all 0.2s ease;
                cursor: pointer;
            }

            .applecation__studio.focus {
                background: rgba(255,255,255,0.2);
                border-color: #fff;
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(255,255,255,0.1);
            }

            .applecation__studio img {
                height: 1.3em;
                max-width: 120px;
                width: auto;
                object-fit: contain;
                filter: brightness(0) invert(1);
            }

            .applecation__studio-name {
                font-size: 0.85em;
                font-weight: 700;
                color: #fff;
                white-space: nowrap;
            }

            /* ============================================================
               Рейтинги (интеграция с Интерфейс Мод)
               ============================================================ */

            .applecation__ratings {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.6em;
                margin-bottom: 0.5em;
                opacity: 0;
                transform: translateY(15px);
                transition: opacity 0.4s ease-out, transform 0.4s ease-out;
                transition-delay: 0.08s;
            }

            .applecation__ratings.show {
                opacity: 1;
                transform: translateY(0);
            }

            .applecation__rating-item {
                display: flex;
                align-items: center;
                gap: 0.35em;
                padding: 0.2em 0.6em;
                border-radius: 0.4em;
                background: rgba(0,0,0,0.5);
                border: 1.5px solid rgba(255,255,255,0.15);
                font-size: 0.85em;
                font-weight: 600;
                color: #fff;
                line-height: 1;
                transition: all 0.2s ease;
            }

            .applecation__rating-item .rating-value {
                font-size: 1.1em;
                font-weight: 700;
            }

            .applecation__rating-item .rating-source {
                font-size: 0.75em;
                opacity: 0.7;
                margin-left: 0.15em;
            }

            .applecation__rating-item .rating-icon {
                width: 1.2em;
                height: 1.2em;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .applecation__rating-item .rating-icon svg {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* Цвета для рейтингов */
            .applecation__rating-item.rating-high {
                border-color: rgba(46,204,113,0.5);
                background: rgba(46,204,113,0.15);
            }

            .applecation__rating-item.rating-mid {
                border-color: rgba(52,152,219,0.5);
                background: rgba(52,152,219,0.15);
            }

            .applecation__rating-item.rating-low {
                border-color: rgba(243,156,18,0.5);
                background: rgba(243,156,18,0.15);
            }

            .applecation__rating-item.rating-bad {
                border-color: rgba(231,76,60,0.5);
                background: rgba(231,76,60,0.15);
            }

            /* ============================================================
               Реакции Lampa
               ============================================================ */

            .applecation__reactions {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.6em;
                margin-bottom: 0.5em;
                opacity: 0;
                transform: translateY(15px);
                transition: opacity 0.4s ease-out, transform 0.4s ease-out;
                transition-delay: 0.1s;
            }

            .applecation__reactions.show {
                opacity: 1;
                transform: translateY(0);
            }

            .applecation__reaction-item {
                display: flex;
                align-items: center;
                gap: 0.3em;
                padding: 0.15em 0.5em;
                border-radius: 0.4em;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.08);
                font-size: 0.85em;
                color: #fff;
                line-height: 1;
            }

            .applecation__reaction-item .reaction-icon {
                width: 1.2em;
                height: 1.2em;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .applecation__reaction-item .reaction-icon img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            .applecation__reaction-item .reaction-count {
                font-weight: 600;
                font-size: 0.9em;
            }

            .applecation__reaction-item .reaction-label {
                font-size: 0.7em;
                opacity: 0.6;
            }

            /* ============================================================
               Качественные бейджи
               ============================================================ */

            .applecation__quality-badges {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.4em;
                margin-left: 0.6em;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.3s ease-out, transform 0.3s ease-out;
                transition-delay: 0.12s;
            }

            .applecation__quality-badges.show {
                opacity: 1;
                transform: translateY(0);
            }

            .quality-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.15em 0.5em;
                border-radius: 0.3em;
                font-size: 0.7em;
                font-weight: 700;
                line-height: 1.3;
                color: #fff;
                text-transform: uppercase;
                letter-spacing: 0.03em;
                border: 1px solid rgba(255,255,255,0.15);
                background: rgba(0,0,0,0.5);
            }

            .quality-badge--4k {
                background: rgba(46,204,113,0.8);
                border-color: rgba(46,204,113,0.4);
                color: #fff;
            }

            .quality-badge--fhd {
                background: rgba(52,152,219,0.8);
                border-color: rgba(52,152,219,0.4);
                color: #fff;
            }

            .quality-badge--hd {
                background: rgba(243,156,18,0.8);
                border-color: rgba(243,156,18,0.4);
                color: #fff;
            }

            .quality-badge--hdr {
                background: rgba(155,89,182,0.8);
                border-color: rgba(155,89,182,0.4);
                color: #fff;
            }

            .quality-badge--dv {
                background: rgba(231,76,60,0.8);
                border-color: rgba(231,76,60,0.4);
                color: #fff;
            }

            .quality-badge--dub {
                background: rgba(26,188,156,0.8);
                border-color: rgba(26,188,156,0.4);
                color: #fff;
            }

            .quality-badge--sound {
                background: rgba(241,196,15,0.8);
                border-color: rgba(241,196,15,0.4);
                color: #000;
            }

            /* ============================================================
               Описание
               ============================================================ */

            .applecation__description-wrapper {
                background: transparent;
                padding: 0;
                border-radius: 1em;
                width: fit-content;
                opacity: 0;
                transform: translateY(15px);
                transition: padding 0.25s ease, transform 0.25s ease, opacity 0.4s ease-out;
                transition-delay: 0.1s;
                cursor: pointer;
            }

            .applecation__description-wrapper.show {
                opacity: 1;
                transform: translateY(0);
            }

            .applecation__description-wrapper.focus {
                background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.18));
                padding: 0.15em 0.4em 0 0.7em;
                border-radius: 1em;
                width: fit-content;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
                transform: scale(1.07) translateY(0);
                transition-delay: 0s;
            }

            .applecation__description {
                color: rgba(255,255,255,0.6);
                font-size: 0.95em;
                line-height: 1.5;
                margin-bottom: 0.5em;
                max-width: 35vw;
                display: -webkit-box;
                -webkit-line-clamp: 4;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .focus .applecation__description {
                color: rgba(255,255,255,0.92);
            }

            /* ============================================================
               Дополнительная информация
               ============================================================ */

            .applecation__info {
                color: rgba(255,255,255,0.75);
                font-size: 1em;
                line-height: 1.4;
                margin-bottom: 0.5em;
                opacity: 0;
                transform: translateY(15px);
                transition: opacity 0.4s ease-out, transform 0.4s ease-out;
                transition-delay: 0.15s;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.5em;
            }

            .applecation__info.show {
                opacity: 1;
                transform: translateY(0);
            }

            .applecation__info-separator {
                opacity: 0.3;
                margin: 0 0.2em;
            }

            .applecation__season-info {
                display: inline-flex;
                align-items: center;
                padding: 0.15em 0.5em;
                border-radius: 0.3em;
                background: rgba(231,76,60,0.85);
                color: #fff;
                font-size: 0.85em;
                font-weight: 600;
                line-height: 1.3;
            }

            .applecation__season-info.completed {
                background: rgba(46,204,113,0.85);
            }

            /* ============================================================
               Кнопки
               ============================================================ */

            .applecation .full-start-new__buttons {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                gap: 0.6em !important;
                margin-top: 0.5em !important;
            }

            .applecation .full-start__button {
                min-height: 2.6em !important;
                padding: 0.4em 1em !important;
                border-radius: 0.8em !important;
                background: rgba(255,255,255,0.08) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                color: rgba(255,255,255,0.9) !important;
                font-size: 0.85em !important;
                font-weight: 600 !important;
                transition: all 0.25s ease !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
            }

            .applecation .full-start__button.focus,
            .applecation .full-start__button.hover {
                background: rgba(255,255,255,0.18) !important;
                border-color: rgba(255,255,255,0.3) !important;
                transform: scale(1.05) !important;
                box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
            }

            .applecation .full-start__button.button--play {
                background: linear-gradient(135deg, rgba(82,255,179,0.9), rgba(105,183,226,0.9)) !important;
                border-color: rgba(82,255,179,0.4) !important;
                color: #000 !important;
            }

            .applecation .full-start__button.button--play.focus {
                background: linear-gradient(135deg, rgba(82,255,179,1), rgba(105,183,226,1)) !important;
                transform: scale(1.08) !important;
            }

            /* ============================================================
               Фоновый оверлей
               ============================================================ */

            .applecation__overlay {
                width: 90vw;
                background: linear-gradient(to right,
                    rgba(0,0,0,0.85) 0%,
                    rgba(0,0,0,0.50) 25%,
                    rgba(0,0,0,0.25) 45%,
                    rgba(0,0,0,0.10) 55%,
                    rgba(0,0,0,0.04) 60%,
                    rgba(0,0,0,0) 65%
                );
                pointer-events: none;
                z-index: 1;
            }

            .full-start__background {
                height: calc(100% + 6em);
                left: 0 !important;
                opacity: 0 !important;
                transition: opacity 0.6s ease-out, filter 0.3s ease-out !important;
                animation: none !important;
                transform: none !important;
                will-change: opacity, filter;
            }

            .full-start__background.loaded:not(.dim) {
                opacity: 1 !important;
            }

            .full-start__background.dim {
                filter: blur(30px);
            }

            .full-start__background.loaded.applecation-animated {
                opacity: 1 !important;
            }

            /* ============================================================
               Оверлей для описания
               ============================================================ */

            .applecation-description-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .applecation-description-overlay.show {
                opacity: 1;
                visibility: visible;
                pointer-events: all;
            }

            .applecation-description-overlay__bg {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                backdrop-filter: blur(100px);
                -webkit-backdrop-filter: blur(100px);
                background: rgba(0,0,0,0.6);
            }

            .applecation-description-overlay__content {
                position: relative;
                z-index: 1;
                max-width: 60vw;
                max-height: 90vh;
                overflow-y: auto;
                padding: 2em;
                background: rgba(20,20,30,0.9);
                border-radius: 1.2em;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            }

            .applecation-description-overlay__logo {
                text-align: center;
                margin-bottom: 1.5em;
                display: none;
            }

            .applecation-description-overlay__logo img {
                max-width: 40vw;
                max-height: 150px;
                width: auto;
                height: auto;
                object-fit: contain;
            }

            .applecation-description-overlay__title {
                font-size: 2em;
                font-weight: 600;
                margin-bottom: 1em;
                color: #fff;
                text-align: center;
            }

            .applecation-description-overlay__text {
                font-size: 1.2em;
                line-height: 1.6;
                color: rgba(255,255,255,0.9);
                white-space: pre-wrap;
                margin-bottom: 1.5em;
            }

            .applecation-description-overlay__details {
                display: flex;
                flex-wrap: wrap;
                gap: 1.5em;
            }

            .applecation-description-overlay__info-name {
                font-size: 0.9em;
                opacity: 0.6;
                margin-bottom: 0.3em;
            }

            .applecation-description-overlay__info-body {
                font-size: 1.1em;
                opacity: 0.9;
            }

            /* ============================================================
               Адаптивность
               ============================================================ */

            @media screen and (max-width: 720px) {
                .applecation .full-start-new__body {
                    height: auto !important;
                    min-height: 0 !important;
                }

                .applecation .full-start-new__right {
                    display: block !important;
                    padding: 0 1em 1em 1em !important;
                }

                .applecation .applecation__right {
                    display: none !important;
                }

                .applecation .applecation__left {
                    width: 100% !important;
                    max-width: none !important;
                }

                .applecation .applecation__content-wrapper {
                    width: 100% !important;
                }

                .applecation .applecation__description-wrapper {
                    width: 100% !important;
                }

                .applecation .applecation__description {
                    max-width: none !important;
                    width: 100% !important;
                    -webkit-line-clamp: 3 !important;
                }

                .applecation__logo {
                    max-width: 60vw !important;
                    max-height: 100px !important;
                }

                .applecation-description-overlay__content {
                    max-width: 90vw;
                    padding: 1.5em;
                }

                .applecation .full-start__button {
                    font-size: 0.75em !important;
                    padding: 0.3em 0.7em !important;
                }
            }

            @media screen and (max-width: 480px) {
                .applecation .full-start-new__body {
                    height: auto !important;
                }

                .applecation .applecation__description {
                    -webkit-line-clamp: 2 !important;
                }

                .applecation__logo {
                    max-width: 70vw !important;
                    max-height: 70px !important;
                }

                .applecation .applecation__meta {
                    font-size: 0.85em !important;
                }

                .applecation .applecation__ratings {
                    font-size: 0.8em !important;
                }

                .applecation .full-start__button {
                    font-size: 0.65em !important;
                    padding: 0.2em 0.5em !important;
                    min-height: 2.2em !important;
                }
            }

            /* ============================================================
               Анимации
               ============================================================ */

            @keyframes applecation-fade-in {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .applecation .applecation-animate-in {
                animation: applecation-fade-in 0.5s ease forwards;
            }

            /* ============================================================
               Glassmorphism эффекты
               ============================================================ */

            .applecation-glass {
                background: rgba(255,255,255,0.05) !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
            }

            .applecation-glass-light {
                background: rgba(255,255,255,0.08) !important;
                backdrop-filter: blur(15px) !important;
                -webkit-backdrop-filter: blur(15px) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
            }
        `;

        var style = document.createElement('style');
        style.id = 'applecation_plus_css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // =================================================================
    // TEMPLATE OVERRIDE
    // =================================================================

    function overrideFullStartTemplate() {
        if (Lampa.Template.get('full_start_new_applecation')) return;

        var ratingsPosition = Lampa.Storage.get('applecation_ratings_position', 'card');

        var template = `
            <div class="full-start-new applecation">
                <div class="full-start-new__body">
                    <div class="full-start-new__left hide">
                        <div class="full-start-new__poster">
                            <img class="full-start-new__img full--poster" />
                        </div>
                    </div>

                    <div class="full-start-new__right">
                        <div class="applecation__left">
                            <div class="applecation__logo-wrapper">
                                <img class="applecation__logo" style="display:none;" />
                            </div>

                            <div class="applecation__content-wrapper">
                                <div class="full-start-new__title" style="display: none;">{title}</div>

                                <div class="applecation__meta">
                                    <div class="applecation__meta-left">
                                        <span class="applecation__network"></span>
                                        <span class="applecation__meta-text"></span>
                                    </div>
                                </div>

                                <div class="applecation__studios"></div>

                                <div class="applecation__ratings"></div>

                                <div class="applecation__reactions"></div>

                                <div class="applecation__description-wrapper">
                                    <div class="applecation__description"></div>
                                </div>

                                <div class="applecation__info">
                                    <span class="applecation__info-text"></span>
                                    <span class="applecation__quality-badges"></span>
                                </div>

                                <div class="full-start-new__buttons">
                                    <div class="full-start__button selector button--play">
                                        <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="14" cy="14.5" r="13" stroke="currentColor" stroke-width="2.7"/>
                                            <path d="M18.0739 13.634C18.7406 14.0189 18.7406 14.9811 18.0739 15.366L11.751 19.0166C11.0843 19.4015 10.251 18.9204 10.251 18.1506L10.251 10.8494C10.251 10.0796 11.0843 9.5985 11.751 9.9834L18.0739 13.634Z" fill="currentColor"/>
                                        </svg>
                                        <span>#{title_watch}</span>
                                    </div>

                                    <div class="full-start__button selector button--book">
                                        <svg width="21" height="32" viewBox="0 0 21 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 1.5H19C19.2761 1.5 19.5 1.72386 19.5 2V27.9618C19.5 28.3756 19.0261 28.6103 18.697 28.3595L12.6212 23.7303C11.3682 22.7757 9.63183 22.7757 8.37885 23.7303L2.30302 28.3595C1.9739 28.6103 1.5 28.3756 1.5 27.9618V2C1.5 1.72386 1.72386 1.5 2 1.5Z" stroke="currentColor" stroke-width="2.5"/>
                                        </svg>
                                        <span>#{settings_input_links}</span>
                                    </div>

                                    <div class="full-start__button selector button--reaction">
                                        <svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M37.208 10.9742C37.1364 10.8013 37.0314 10.6441 36.899 10.5117C36.7666 10.3794 36.6095 10.2744 36.4365 10.2028L12.0658 0.108375C11.7166 -0.0361828 11.3242 -0.0361227 10.9749 0.108542C10.6257 0.253206 10.3482 0.530634 10.2034 0.879836L0.108666 25.2507C0.0369593 25.4236 3.37953e-05 25.609 2.3187e-08 25.7962C-3.37489e-05 25.9834 0.0368249 26.1688 0.108469 26.3418C0.180114 26.5147 0.28514 26.6719 0.417545 26.8042C0.54995 26.9366 0.707139 27.0416 0.880127 27.1131L17.2452 33.8917C17.5945 34.0361 17.9869 34.0361 18.3362 33.8917L29.6574 29.2017C29.8304 29.1301 29.9875 29.0251 30.1199 28.8928C30.2523 28.7604 30.3573 28.6032 30.4289 28.4303L37.2078 12.065C37.2795 11.8921 37.3164 11.7068 37.3164 11.5196C37.3165 11.3325 37.2796 11.1471 37.208 10.9742ZM20.425 29.9407L21.8784 26.4316L25.3873 27.885L20.425 29.9407ZM28.3407 26.0222L21.6524 23.252C21.3031 23.1075 20.9107 23.1076 20.5615 23.2523C20.2123 23.3969 19.9348 23.6743 19.79 24.0235L17.0194 30.7123L3.28783 25.0247L12.2918 3.28773L34.0286 12.2912L28.3407 26.0222Z" fill="currentColor"/>
                                            <path d="M25.3493 16.976L24.258 14.3423L16.959 17.3666L15.7196 14.375L13.0859 15.4659L15.4161 21.0916L25.3493 16.976Z" fill="currentColor"/>
                                        </svg>
                                        <span>#{title_reactions}</span>
                                    </div>

                                    <div class="full-start__button selector view--trailer">
                                        <svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z" fill="currentColor"/>
                                        </svg>
                                        <span>#{full_trailers}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="full-start-new__head" style="display: none;"></div>
                            <div class="full-start-new__details" style="display: none;"></div>
                        </div>

                        <div class="applecation__right">
                            <div class="full-start-new__reactions selector">
                                <div>#{reactions_none}</div>
                            </div>

                            <div class="full-start-new__rate-line" style="display: none;">
                                <div class="full-start__status hide"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="hide buttons--container">
                    <div class="full-start__button view--torrent hide">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">
                            <path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z" fill="currentColor"/>
                        </svg>
                        <span>#{full_torrents}</span>
                    </div>
                </div>
            </div>
        `;

        Lampa.Template.add('full_start_new', template);
    }

    // =================================================================
    // CARD CONTENT FUNCTIONS
    // =================================================================

    function addBackgroundOverlay(render) {
        var bg = render.find('.full-start__background:not(.applecation__overlay)');
        if (bg.length && !bg.next('.applecation__overlay').length) {
            bg.after('<div class="full-start__background loaded applecation__overlay"></div>');
        }
    }

    function fillMetaInfo(render, movie) {
        var metaText = render.find('.applecation__meta-text');
        if (!metaText.length) return;

        var parts = [];
        parts.push(getTypeLabel(movie));

        if (movie.genres && movie.genres.length) {
            var g = movie.genres.slice(0, 2).map(function(x) {
                return Lampa.Utils.capitalizeFirstLetter(x.name);
            });
            parts = parts.concat(g);
        }

        metaText.html(parts.join(' · '));

        // Сеть/Студия
        var networkNode = render.find('.applecation__network');
        if (networkNode.length) {
            if (movie.networks && movie.networks.length && movie.networks[0].logo_path) {
                var imgUrl = Lampa.Api.img(movie.networks[0].logo_path, 'w200');
                networkNode.html('<img src="' + imgUrl + '" alt="' + movie.networks[0].name + '">');
            } else if (movie.production_companies && movie.production_companies.length && movie.production_companies[0].logo_path) {
                var imgUrl = Lampa.Api.img(movie.production_companies[0].logo_path, 'w200');
                networkNode.html('<img src="' + imgUrl + '" alt="' + movie.production_companies[0].name + '">');
            } else {
                networkNode.remove();
            }
        }
    }

    function fillStudios(render, movie) {
        var container = render.find('.applecation__studios');
        if (!container.length) return;

        var companies = (movie && movie.production_companies && movie.production_companies.length) ?
            movie.production_companies.slice(0, 3) : [];

        if (!companies.length) {
            container.remove();
            return;
        }

        container.empty();

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

            container.append(node);
        });

        container.addClass('show');
    }

    function fillDescription(render, movie) {
        var description = render.find('.applecation__description');
        var wrapper = render.find('.applecation__description-wrapper');

        var text = movie.overview || t('no_overview');
        description.text(text);

        // Добавляем оверлей для полного описания
        wrapper.off('hover:enter').on('hover:enter', function() {
            showDescriptionOverlay(movie);
        });

        wrapper.addClass('selector');
        if (window.Lampa && Lampa.Controller) {
            Lampa.Controller.collectionAppend(wrapper);
        }

        wrapper.addClass('show');
    }

    function showDescriptionOverlay(movie) {
        var text = movie.overview || t('no_overview');
        var title = movie.title || movie.name || '';

        // Удаляем старый оверлей
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
                            <div class="applecation-description-overlay__info-name">${t('release_date')}</div>
                            <div class="applecation-description-overlay__info-body">${movie.release_date || movie.first_air_date || '-'}</div>
                        </div>
                        <div class="applecation-description-overlay__info applecation--budget" ${!movie.budget || movie.budget === 0 ? 'style="display:none;"' : ''}>
                            <div class="applecation-description-overlay__info-name">${t('budget')}</div>
                            <div class="applecation-description-overlay__info-body">$${Lampa.Utils.numberWithSpaces(movie.budget || 0)}</div>
                        </div>
                        <div class="applecation-description-overlay__info applecation--countries" ${!movie.production_countries || !movie.production_countries.length ? 'style="display:none;"' : ''}>
                            <div class="applecation-description-overlay__info-name">${t('countries')}</div>
                            <div class="applecation-description-overlay__info-body">${(movie.production_countries || []).map(function(c) { return c.name; }).join(', ')}</div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(overlay);

        setTimeout(function() {
            overlay.addClass('show');
        }, 10);

        // Контроллер для закрытия
        var ctrl = {
            toggle: function() {
                Lampa.Controller.collectionSet(overlay);
                Lampa.Controller.collectionFocus(overlay.find('.applecation-description-overlay__content'), overlay);
            },
            back: function() {
                var ol = $('.applecation-description-overlay');
                if (!ol.length) return;
                ol.removeClass('show');
                setTimeout(function() {
                    Lampa.Controller.toggle('content');
                }, 300);
            }
        };

        Lampa.Controller.add('applecation_description', ctrl);
        Lampa.Controller.toggle('applecation_description');
    }

    function fillInfo(render, movie) {
        var infoText = render.find('.applecation__info-text');
        if (!infoText.length) return;

        var parts = [];

        // Год
        var date = movie.release_date || movie.first_air_date || '';
        if (date) {
            var year = date.split('-')[0];
            parts.push(year);
        }

        // Длительность
        if (movie.name) {
            // Сериал
            if (movie.episode_run_time && movie.episode_run_time.length) {
                var m = movie.episode_run_time[0];
                parts.push(m + ' ' + Lampa.Lang.translate('time_m').replace('.', ''));
            }

            // Информация о сезонах
            var seasons = movie.number_of_seasons || Lampa.Utils.countSeasons(movie) || 0;
            if (seasons > 0) {
                var isCompleted = movie.status === 'Ended' || movie.status === 'Canceled';
                var seasonLabel = t('seasons') + ' ' + seasons;
                parts.push(
                    '<span class="applecation__season-info' + (isCompleted ? ' completed' : '') + '">' +
                    seasonLabel + ' · ' + t('episodes') + ' ' + (movie.number_of_episodes || '?') +
                    '</span>'
                );
            }
        } else if (movie.runtime && movie.runtime > 0) {
            // Фильм
            var h = Math.floor(movie.runtime / 60);
            var mm = movie.runtime % 60;
            var th = Lampa.Lang.translate('time_h').replace('.', '');
            var tmm = Lampa.Lang.translate('time_m').replace('.', '');
            var timeStr = h > 0 ? (h + ' ' + th + ' ' + mm + ' ' + tmm) : (mm + ' ' + tmm);
            parts.push(timeStr);
        }

        infoText.html(parts.join(' · '));
        render.find('.applecation__info').addClass('show');
    }

    function fillRatings(render, movie) {
        var container = render.find('.applecation__ratings');
        if (!container.length) return;

        // Проверяем, есть ли уже рейтинги от Интерфейс Мод
        if (container.children().length > 0) {
            return;
        }

        container.empty();

        // TMDB рейтинг
        if (movie.vote_average && movie.vote_average > 0) {
            var rating = parseFloat(movie.vote_average).toFixed(1);
            var color = getRatingColor(rating);
            var bgColor = getRatingBackgroundColor(rating);

            container.append(`
                <div class="applecation__rating-item" style="border-color: ${color}40; background: ${bgColor};">
                    <span class="rating-value" style="color: ${color};">${rating}</span>
                    <span class="rating-source">TMDB</span>
                </div>
            `);
        }

        // IMDb рейтинг (если доступен)
        if (movie.imdb_rating || movie.ratingImdb) {
            var imdb = parseFloat(movie.imdb_rating || movie.ratingImdb || 0);
            if (imdb > 0) {
                var imdbColor = getRatingColor(imdb);
                container.append(`
                    <div class="applecation__rating-item" style="border-color: ${imdbColor}40; background: rgba(0,0,0,0.5);">
                        <span class="rating-icon">
                            <svg viewBox="0 0 24 24" fill="#F5C518" width="16" height="16">
                                <path d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z" transform="scale(0.2)"/>
                            </svg>
                        </span>
                        <span class="rating-value" style="color: ${imdbColor};">${imdb.toFixed(1)}</span>
                        <span class="rating-source">IMDb</span>
                    </div>
                `);
            }
        }

        // Кинопоиск рейтинг (если доступен)
        if (movie.kp_rating || movie.ratingKinopoisk) {
            var kp = parseFloat(movie.kp_rating || movie.ratingKinopoisk || 0);
            if (kp > 0) {
                var kpColor = getRatingColor(kp);
                container.append(`
                    <div class="applecation__rating-item" style="border-color: ${kpColor}40; background: rgba(0,0,0,0.5);">
                        <span class="rating-icon">
                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                <circle cx="12" cy="12" r="11" stroke="#FF5500" stroke-width="1.5"/>
                                <text x="12" y="16" text-anchor="middle" font-size="10" fill="#FF5500" font-weight="bold">КП</text>
                            </svg>
                        </span>
                        <span class="rating-value" style="color: ${kpColor};">${kp.toFixed(1)}</span>
                        <span class="rating-source">Кинопоиск</span>
                    </div>
                `);
            }
        }

        if (container.children().length > 0) {
            container.addClass('show');
        } else {
            container.remove();
        }
    }

    function fillReactions(render, movie) {
        var container = render.find('.applecation__reactions');
        if (!container.length) return;

        // Получаем реакции через API Lampa
        if (!window.Lampa || !Lampa.Api || !Lampa.Api.sources || !Lampa.Api.sources.cub) {
            container.remove();
            return;
        }

        var type = movie.name ? 'tv' : 'movie';
        var key = type + '_' + movie.id;

        try {
            Lampa.Api.sources.cub.reactionsGet({ method: type, id: movie.id }, function(data) {
                if (!data || !data.result || !Array.isArray(data.result)) {
                    container.remove();
                    return;
                }

                var reactions = data.result;
                if (!reactions.length) {
                    container.remove();
                    return;
                }

                container.empty();

                // Сортируем по популярности
                reactions.sort(function(a, b) {
                    return (parseInt(b.counter) || 0) - (parseInt(a.counter) || 0);
                });

                // Показываем все реакции в строку
                reactions.forEach(function(reaction) {
                    var count = parseInt(reaction.counter) || 0;
                    if (count === 0) return;

                    var type = reaction.type || '';
                    var emoji = getReactionEmoji(type);

                    var item = $(`
                        <div class="applecation__reaction-item">
                            <span class="reaction-icon">${emoji}</span>
                            <span class="reaction-count">${count}</span>
                        </div>
                    `);

                    container.append(item);
                });

                if (container.children().length > 0) {
                    container.addClass('show');
                } else {
                    container.remove();
                }

            }, function() {
                container.remove();
            });
        } catch (e) {
            container.remove();
        }
    }

    function getReactionEmoji(type) {
        var map = {
            'fire': '🔥',
            'nice': '👍',
            'think': '🤔',
            'bore': '😴',
            'shit': '💩',
            'like': '❤️',
            'dislike': '👎'
        };
        return map[type] || '⭐';
    }

    function fillQualityBadges(render, movie) {
        var container = render.find('.applecation__quality-badges');
        if (!container.length) return;

        // Получаем качество через Jacred
        getBestJacred(movie, function(result) {
            if (!result || result.empty) {
                container.remove();
                return;
            }

            container.empty();
            var hasBadges = false;

            // Качество
            if (result.resolution && result.resolution !== 'SD') {
                var resClass = 'quality-badge--' + result.resolution.toLowerCase();
                var resLabel = result.resolution === '4K' ? '4K' :
                              result.resolution === 'FHD' ? 'FHD' :
                              result.resolution === 'HD' ? 'HD' : result.resolution;
                container.append('<span class="quality-badge ' + resClass + '">' + resLabel + '</span>');
                hasBadges = true;
            }

            // HDR / Dolby Vision
            if (result.dolbyVision) {
                container.append('<span class="quality-badge quality-badge--dv">Dolby Vision</span>');
                hasBadges = true;
            } else if (result.hdr) {
                container.append('<span class="quality-badge quality-badge--hdr">HDR</span>');
                hasBadges = true;
            }

            // Звук
            if (result.sound) {
                container.append('<span class="quality-badge quality-badge--sound">' + result.sound + '</span>');
                hasBadges = true;
            }

            // DUB
            if (result.dub) {
                container.append('<span class="quality-badge quality-badge--dub">DUB</span>');
                hasBadges = true;
            }

            if (hasBadges) {
                container.addClass('show');
            } else {
                container.remove();
            }
        });
    }

    function loadLogo(render, movie) {
        var logoImg = render.find('.applecation__logo');
        var wrapper = render.find('.applecation__logo-wrapper');
        var titleEl = render.find('.full-start-new__title');

        if (!logoImg.length || !wrapper.length) return;

        fetchLogo(movie, function(logo) {
            if (!logo) {
                // Логотип не найден - показываем заголовок
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

                // Обновляем оверлей описания
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
        });
    }

    function setupAnimations(render) {
        // Показываем элементы с задержкой
        setTimeout(function() {
            if (!render.closest('body').length) return;
            render.find('.applecation__meta').addClass('show');
            render.find('.applecation__studios').addClass('show');
            render.find('.applecation__ratings').addClass('show');
            render.find('.applecation__reactions').addClass('show');
            render.find('.applecation__description-wrapper').addClass('show');
            render.find('.applecation__info').addClass('show');
        }, 350);

        // Анимация фона
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
    }

    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================

    function escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // =================================================================
    // SETTINGS
    // =================================================================

    function addSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;

        // Добавляем компонент настроек
        Lampa.SettingsApi.addComponent({
            component: 'applecation_plus',
            name: 'AppleTV+',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 18l20 12-10 2 2 10-12-24z" fill="currentColor"/><path d="M44 20l6-6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
            after: 'interface'
        });

        // Настройка качества постера
        Lampa.SettingsApi.addParam({
            component: 'applecation_plus',
            param: { name: 'applecation_poster_quality', type: 'select', values: {
                low: 'Низкое - 720p (HD)',
                medium: 'Среднее - 1080p (FHD)',
                high: 'Высокое - 4K'
            }, default: 'medium' },
            field: { name: 'Качество постера', description: 'Выберите качество изображений постеров и фона' },
            onChange: function(value) {
                Lampa.Storage.set('applecation_poster_quality', value);
            }
        });

        // Настройка логотипов
        Lampa.SettingsApi.addParam({
            component: 'applecation_plus',
            param: { name: 'applecation_show_logos', type: 'trigger', default: true },
            field: { name: 'Показывать логотипы', description: 'Отображать логотипы фильмов и студий' }
        });

        // Настройка реакций
        Lampa.SettingsApi.addParam({
            component: 'applecation_plus',
            param: { name: 'applecation_show_reactions', type: 'trigger', default: true },
            field: { name: 'Показывать реакции', description: 'Отображать реакции Lampa в развернутом виде' }
        });

        // Настройка качественных бейджей
        Lampa.SettingsApi.addParam({
            component: 'applecation_plus',
            param: { name: 'applecation_show_quality_badges', type: 'trigger', default: true },
            field: { name: 'Показывать бейджи качества', description: 'Отображать бейджи 4K, HDR, Dolby Vision, DUB' }
        });

        // Настройка описания в оверлее
        Lampa.SettingsApi.addParam({
            component: 'applecation_plus',
            param: { name: 'applecation_description_overlay', type: 'trigger', default: true },
            field: { name: 'Описание в оверлее', description: 'Показывать описание в отдельном окне при нажатии' }
        });
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

            // Добавляем настройки
            addSettings();

            // Инициализируем основную функцию
            initApplecationFullCard();

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