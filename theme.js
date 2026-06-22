// @name AppleTV+ Pro
// @version 2.6.0
// @description Расширенная карточка фильма в стиле Apple TV+
// @lampa-check Lampa.

(function() {
    'use strict';

    var PLUGIN_VERSION = '2.6.0';

    // =================================================================
    // Настройки по умолчанию
    // =================================================================
    var DEFAULTS = {
        show_metadata: true,
        show_description: true,
        logo_scale: 100,
        text_scale: 100,
        spacing_scale: 100,
        description_overlay: false, // по умолчанию выключен
        reverse_episodes: true
    };

    // Инициализация настроек
    for (var key in DEFAULTS) {
        if (Lampa.Storage.get('applecation_' + key) === undefined) {
            Lampa.Storage.set('applecation_' + key, DEFAULTS[key]);
        }
    }

    function getSetting(key) {
        return Lampa.Storage.get('applecation_' + key, DEFAULTS[key]);
    }

    function setSetting(key, value) {
        Lampa.Storage.set('applecation_' + key, value);
    }

    // =================================================================
    // Вспомогательные функции
    // =================================================================
    function getTmdbKey() {
        var custom = (Lampa.Storage.get('applecation_tmdb_apikey') || '').trim();
        return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
    }

    function isComponentActive(component) {
        return component && !component.__destroyed;
    }

    function waitForBackground(render, callback) {
        var background = render.find('.full-start__background:not(.applecation__overlay)');
        if (!background.length) return callback();
        if (background.hasClass('loaded') && background.hasClass('applecation-animated')) {
            return callback();
        }
        if (background.hasClass('loaded')) {
            return setTimeout(function() {
                background.addClass('applecation-animated');
                callback();
            }, 350);
        }
        var interval = setInterval(function() {
            if (background.hasClass('loaded')) {
                clearInterval(interval);
                setTimeout(function() {
                    background.addClass('applecation-animated');
                    callback();
                }, 650);
            }
        }, 50);
        setTimeout(function() {
            clearInterval(interval);
            if (!background.hasClass('applecation-animated')) {
                background.addClass('applecation-animated');
                callback();
            }
        }, 2000);
    }

    // =================================================================
    // Кэш метаданных (Jacred)
    // =================================================================
    var METADATA_CACHE = {};
    var METADATA_CACHE_TTL = 24 * 60 * 60 * 1000;

    function getCachedMetadata(movieId) {
        var cached = METADATA_CACHE[movieId];
        if (cached && (Date.now() - cached._ts < METADATA_CACHE_TTL)) {
            return cached;
        }
        try {
            var stored = Lampa.Storage.get('applecation_metadata_cache_' + movieId);
            if (stored && stored._ts && (Date.now() - stored._ts < METADATA_CACHE_TTL)) {
                METADATA_CACHE[movieId] = stored;
                return stored;
            }
        } catch (e) {}
        return null;
    }

    function setCachedMetadata(movieId, data) {
        data._ts = Date.now();
        METADATA_CACHE[movieId] = data;
        try {
            Lampa.Storage.set('applecation_metadata_cache_' + movieId, data);
        } catch (e) {}
    }

    // =================================================================
    // Получение метаданных через Jacred
    // =================================================================
    function getMetadata(movie) {
        return new Promise(function(resolve) {
            if (!movie || !movie.id) { resolve(null); return; }

            var cached = getCachedMetadata(movie.id);
            if (cached) {
                resolve(cached);
                return;
            }

            var result = {
                seasonInfo: null,
                quality: null,
                audio: null,
                dub: false,
                hdr: false,
                year: null
            };

            // Год
            var year = (movie.release_date || movie.first_air_date || '').substr(0, 4);
            if (year) result.year = year;

            // Информация о сезонах
            if (movie.name) {
                var lastEpisode = movie.last_episode_to_air;
                if (lastEpisode && lastEpisode.season_number && lastEpisode.episode_number) {
                    var seasonNum = lastEpisode.season_number;
                    var episodeNum = lastEpisode.episode_number;
                    var totalEpisodes = '?';
                    if (movie.seasons && Array.isArray(movie.seasons)) {
                        for (var i = 0; i < movie.seasons.length; i++) {
                            if (movie.seasons[i].season_number === seasonNum && movie.seasons[i].episode_count) {
                                totalEpisodes = movie.seasons[i].episode_count;
                                break;
                            }
                        }
                    }
                    result.seasonInfo = seasonNum + ' сезон ' + episodeNum + '/' + totalEpisodes + ' серий';
                }
            }

            // Качество, аудио, озвучка, HDR — из Jacred
            var title = (movie.original_title || movie.title || movie.name || '').toLowerCase();
            var yearStr = (movie.release_date || movie.first_air_date || '').substr(0, 4);

            if (title && yearStr) {
                var apiUrl = 'https://jr.maxvol.pro/api/v1.0/torrents?search=' + encodeURIComponent(title) + '&year=' + yearStr;

                var proxyList = [
                    'https://api.allorigins.win/raw?url=',
                    'https://corsproxy.io/?url=',
                    'https://thingproxy.freeboard.io/fetch/'
                ];

                function tryProxy(index) {
                    if (index >= proxyList.length) {
                        setCachedMetadata(movie.id, result);
                        resolve(result);
                        return;
                    }
                    var proxy = proxyList[index];
                    var url = proxy + encodeURIComponent(apiUrl);

                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.timeout = 10000;
                    xhr.onload = function() {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                var data = JSON.parse(xhr.responseText);
                                processJacredData(data);
                            } catch (e) {
                                tryProxy(index + 1);
                            }
                        } else {
                            tryProxy(index + 1);
                        }
                    };
                    xhr.onerror = function() { tryProxy(index + 1); };
                    xhr.ontimeout = function() { tryProxy(index + 1); };
                    xhr.send();
                }

                function processJacredData(data) {
                    var results = Array.isArray(data) ? data : (data.Results || []);
                    if (!results.length) {
                        setCachedMetadata(movie.id, result);
                        resolve(result);
                        return;
                    }

                    var qualityPriority = ['4K', 'FHD', 'HD', 'SD'];

                    results.forEach(function(item) {
                        var t = (item.title || '').toLowerCase();
                        var q = parseInt(item.quality || 0, 10);

                        var currentQuality = null;
                        if (q >= 2160) currentQuality = '4K';
                        else if (q >= 1440) currentQuality = '2K';
                        else if (q >= 1080) currentQuality = 'FHD';
                        else if (q >= 720) currentQuality = 'HD';

                        if (!currentQuality) {
                            if (t.indexOf('4k') >= 0 || t.indexOf('2160') >= 0) currentQuality = '4K';
                            else if (t.indexOf('1080') >= 0 || t.indexOf('fhd') >= 0) currentQuality = 'FHD';
                            else if (t.indexOf('720') >= 0 || t.indexOf('hd') >= 0) currentQuality = 'HD';
                            else if (t.indexOf('cam') >= 0 || t.indexOf('ts') >= 0 || t.indexOf('tc') >= 0) {
                                currentQuality = 'TS';
                            }
                        }

                        if (currentQuality) {
                            var currentIndex = qualityPriority.indexOf(currentQuality);
                            var bestIndex = qualityPriority.indexOf(result.quality);
                            if (bestIndex === -1 || currentIndex < bestIndex) {
                                result.quality = currentQuality;
                            }
                        }

                        if (t.indexOf('7.1') >= 0) result.audio = '7.1';
                        else if (t.indexOf('5.1') >= 0) result.audio = '5.1';
                        else if (t.indexOf('2.0') >= 0 && !result.audio) result.audio = '2.0';

                        if (t.indexOf('ukr') >= 0 || t.indexOf('укр') >= 0 || t.indexOf('ua') >= 0) {
                            result.dub = true;
                        }

                        if (t.indexOf('hdr') >= 0 || t.indexOf('dolby vision') >= 0 || t.indexOf('dovi') >= 0) {
                            result.hdr = true;
                        }
                    });

                    setCachedMetadata(movie.id, result);
                    resolve(result);
                }

                tryProxy(0);
            } else {
                setCachedMetadata(movie.id, result);
                resolve(result);
            }
        });
    }

    // =================================================================
    // Формирование HTML метаданных
    // =================================================================
    function buildMetadataHTML(metadata) {
        var html = '';

        if (metadata.year) {
            html += '<span class="metadata-badge metadata-text">' + metadata.year + '</span>';
        }

        if (metadata.seasonInfo) {
            html += '<span class="metadata-badge metadata-season">' + metadata.seasonInfo + '</span>';
        }

        if (metadata.quality) {
            html += '<span class="metadata-badge metadata-quality">' + metadata.quality + '</span>';
        }

        if (metadata.hdr) {
            html += '<span class="metadata-badge metadata-hdr">HDR</span>';
        }

        if (metadata.audio) {
            html += '<span class="metadata-badge metadata-audio">' + metadata.audio + '</span>';
        }

        if (metadata.dub) {
            html += '<span class="metadata-badge metadata-dub">DUB</span>';
        }

        return html;
    }

    // =================================================================
    // Переопределение Lampa.Api.img для 4K
    // =================================================================
    function overrideImageApi() {
        var source = Lampa.Api.sources.tmdb;
        var originalImg = source.img;

        source.img = function(path, size) {
            var isFace = typeof size === 'string' && size.indexOf('_face') !== -1;
            var isBackdrop = ['w300', 'w780', 'w1280', 'original'].indexOf(size) !== -1 && !isFace;

            // Всегда используем максимальное качество
            if (!isFace && !isBackdrop) {
                size = isFace ? 'w600_and_h900_face' : 'original';
            }

            if (isBackdrop) {
                size = 'original';
            }

            return originalImg.call(source, path, size);
        };
    }

    // =================================================================
    // Основная логика
    // =================================================================
    function initPlugin() {
        if (!Lampa.Platform.screen('tv')) {
            console.log('AppleTV+ Pro: TV mode only');
            return;
        }

        overrideImageApi();
        overrideFullStartTemplate();
        injectStyles();
        addSettings();

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                handleFullEvent(e);
            }
        });

        applyScaling();
        console.log('AppleTV+ Pro v' + PLUGIN_VERSION + ' initialized');
    }

    // =================================================================
    // Переопределение шаблона страницы фильма
    // =================================================================
    function overrideFullStartTemplate() {
        // Метаданные
        var metadataHtml = '<div class="applecation__metadata"></div>';

        // Контентная часть
        var contentHtml = 
            '<div class="applecation__logo-wrapper">' +
                '<img class="applecation__logo" style="display:none;" />' +
            '</div>' +
            '<div class="applecation__content-wrapper">' +
                '<div class="full-start-new__title" style="display: none;">{title}</div>' +
                '<div class="applecation__meta">' +
                    '<div class="applecation__meta-left">' +
                        '<span class="applecation__network"></span>' +
                        '<span class="applecation__meta-text"></span>' +
                        '<div class="full-start__pg hide"></div>' +
                    '</div>' +
                '</div>' +
                metadataHtml +
                '<div class="applecation__description-wrapper">' +
                    '<div class="applecation__description"></div>' +
                '</div>' +
                '<div class="applecation__info"></div>' +
            '</div>';

        // Кнопки
        var buttonsHtml = 
            '<div class="full-start-new__buttons">' +
                '<div class="full-start__button selector button--play">' +
                    '<svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="14" cy="14.5" r="13" stroke="currentColor" stroke-width="2.7"/>' +
                        '<path d="M18.0739 13.634C18.7406 14.0189 18.7406 14.9811 18.0739 15.366L11.751 19.0166C11.0843 19.4015 10.251 18.9204 10.251 18.1506L10.251 10.8494C10.251 10.0796 11.0843 9.5985 11.751 9.9834L18.0739 13.634Z" fill="currentColor"/>' +
                    '</svg>' +
                    '<span>#{title_watch}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--book">' +
                    '<svg width="21" height="32" viewBox="0 0 21 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M2 1.5H19C19.2761 1.5 19.5 1.72386 19.5 2V27.9618C19.5 28.3756 19.0261 28.6103 18.697 28.3595L12.6212 23.7303C11.3682 22.7757 9.63183 22.7757 8.37885 23.7303L2.30302 28.3595C1.9739 28.6103 1.5 28.3756 1.5 27.9618V2C1.5 1.72386 1.72386 1.5 2 1.5Z" stroke="currentColor" stroke-width="2.5"/>' +
                    '</svg>' +
                    '<span>#{settings_input_links}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--reaction">' +
                    '<svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M37.208 10.9742C37.1364 10.8013 37.0314 10.6441 36.899 10.5117C36.7666 10.3794 36.6095 10.2744 36.4365 10.2028L12.0658 0.108375C11.7166 -0.0361828 11.3242 -0.0361227 10.9749 0.108542C10.6257 0.253206 10.3482 0.530634 10.2034 0.879836L0.108666 25.2507C0.0369593 25.4236 3.37953e-05 25.609 2.3187e-08 25.7962C-3.37489e-05 25.9834 0.0368249 26.1688 0.108469 26.3418C0.180114 26.5147 0.28514 26.6719 0.417545 26.8042C0.54995 26.9366 0.707139 27.0416 0.880127 27.1131L17.2452 33.8917C17.5945 34.0361 17.9869 34.0361 18.3362 33.8917L29.6574 29.2017C29.8304 29.1301 29.9875 29.0251 30.1199 28.8928C30.2523 28.7604 30.3573 28.6032 30.4289 28.4303L37.2078 12.065C37.2795 11.8921 37.3164 11.7068 37.3164 11.5196C37.3165 11.3325 37.2796 11.1471 37.208 10.9742ZM20.425 29.9407L21.8784 26.4316L25.3873 27.885L20.425 29.9407ZM28.3407 26.0222L21.6524 23.252C21.3031 23.1075 20.9107 23.1076 20.5615 23.2523C20.2123 23.3969 19.9348 23.6743 19.79 24.0235L17.0194 30.7123L3.28783 25.0247L12.2918 3.28773L34.0286 12.2912L28.3407 26.0222Z" fill="currentColor"/>' +
                        '<path d="M25.3493 16.976L24.258 14.3423L16.959 17.3666L15.7196 14.375L13.0859 15.4659L15.4161 21.0916L25.3493 16.976Z" fill="currentColor"/>' +
                    '</svg>' +
                    '<span>#{title_reactions}</span>' +
                '</div>' +
                '<div class="full-start__button selector view--trailer">' +
                    '<svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z" fill="currentColor"/>' +
                    '</svg>' +
                    '<span>#{full_trailers}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--options">' +
                    '<svg width="38" height="10" viewBox="0 0 38 10" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="4.88968" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                        '<circle cx="18.9746" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                        '<circle cx="33.0596" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                    '</svg>' +
                '</div>' +
            '</div>';

        // Сборка шаблона
        var template = '<div class="full-start-new applecation">\n' +
            '    <div class="full-start-new__body">\n' +
            '        <div class="full-start-new__left hide">\n' +
            '            <div class="full-start-new__poster">\n' +
            '                <img class="full-start-new__img full--poster" />\n' +
            '            </div>\n' +
            '        </div>\n' +
            '        <div class="full-start-new__right">\n' +
            '            <div class="applecation__left">\n' +
            '                ' + contentHtml + '\n' +
            '                ' + buttonsHtml + '\n' +
            '                <div class="full-start-new__head" style="display: none;"></div>\n' +
            '                <div class="full-start-new__details" style="display: none;"></div>\n' +
            '            </div>\n' +
            '            <div class="applecation__right">\n' +
            '                <div class="full-start-new__reactions selector">\n' +
            '                    <div>#{reactions_none}</div>\n' +
            '                </div>\n' +
            '                <div class="full-start-new__rate-line">\n' +
            '                    <div class="full-start__status hide"></div>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '    <div class="hide buttons--container">\n' +
            '        <div class="full-start__button view--torrent hide">\n' +
            '            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">\n' +
            '                <path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z" fill="currentColor"/>' +
            '            </svg>\n' +
            '            <span>#{full_torrents}</span>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';

        Lampa.Template.add('full_start_new', template);
        Lampa.Template.add('applecation_overlay', '\n            <div class="applecation-description-overlay">\n                <div class="applecation-description-overlay__bg"></div>\n                <div class="applecation-description-overlay__content selector">\n                    <div class="applecation-description-overlay__logo"></div>\n                    <div class="applecation-description-overlay__title">{title}</div>\n                    <div class="applecation-description-overlay__text">{text}</div>\n                    <div class="applecation-description-overlay__details">\n                        <div class="applecation-description-overlay__info">\n                            <div class="applecation-description-overlay__info-name">#{full_date_of_release}</div>\n                            <div class="applecation-description-overlay__info-body">{relise}</div>\n                        </div>\n                        <div class="applecation-description-overlay__info applecation--budget">\n                            <div class="applecation-description-overlay__info-name">#{full_budget}</div>\n                            <div class="applecation-description-overlay__info-body">{budget}</div>\n                        </div>\n                        <div class="applecation-description-overlay__info applecation--countries">\n                            <div class="applecation-description-overlay__info-name">#{full_countries}</div>\n                            <div class="applecation-description-overlay__info-body">{countries}</div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        ');
    }

    // =================================================================
    // Обработка события full
    // =================================================================
    function handleFullEvent(e) {
        var activity = e.object && e.object.activity;
        if (!activity || !activity.render) return;

        var render = activity.render();
        if (!render || !render.length) return;

        activity.__destroyed = false;
        var oldDestroy = activity.destroy;
        activity.destroy = function() {
            activity.__destroyed = true;
            if (oldDestroy) oldDestroy.apply(activity, arguments);
        };

        render.addClass('applecation');

        // Добавляем оверлей на фон
        var bg = render.find('.full-start__background:not(.applecation__overlay)');
        if (bg.length && !bg.next('.applecation__overlay').length) {
            bg.after('<div class="full-start__background loaded applecation__overlay"></div>');
        }

        var movie = e.data && e.data.movie;
        if (!movie) return;

        // Заполняем контент
        fillMeta(render, movie);
        fillDescription(render, movie);
        fillInfo(render, movie);
        loadLogo(render, movie);
        loadMetadata(render, movie);

        // Настраиваем анимации
        waitForBackground(render, function() {
            if (!isComponentActive(activity)) return;
            render.find('.applecation__meta').addClass('show');
            render.find('.applecation__description-wrapper').addClass('show');
            render.find('.applecation__info').addClass('show');
        });

        // Обновляем контроллер
        setTimeout(function() {
            try {
                if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
                    Lampa.Controller.toggle('full_start');
                }
            } catch (err) {}
        }, 300);
    }

    // =================================================================
    // Заполнение мета-информации
    // =================================================================
    function fillMeta(render, movie) {
        var metaText = render.find('.applecation__meta-text');
        if (!metaText.length) return;

        var parts = [];
        parts.push(movie.name ? 'Сериал' : 'Фильм');

        if (movie.genres && movie.genres.length) {
            var genres = movie.genres.slice(0, 2).map(function(g) {
                return Lampa.Utils.capitalizeFirstLetter(g.name);
            });
            parts = parts.concat(genres);
        }

        metaText.html(parts.join(' · '));

        // Сеть/студия
        var networkNode = render.find('.applecation__network');
        if (networkNode.length) {
            var logo = null;
            if (movie.networks && movie.networks.length && movie.networks[0].logo_path) {
                logo = movie.networks[0];
            } else if (movie.production_companies && movie.production_companies.length && movie.production_companies[0].logo_path) {
                logo = movie.production_companies[0];
            }

            if (logo) {
                var imgUrl = Lampa.Api.img(logo.logo_path, 'w200');
                networkNode.html('<img src="' + imgUrl + '" alt="' + logo.name + '">');
            } else {
                networkNode.remove();
            }
        }
    }

    // =================================================================
    // Загрузка метаданных
    // =================================================================
    function loadMetadata(render, movie) {
        if (!getSetting('show_metadata')) {
            render.find('.applecation__metadata').empty();
            return;
        }

        var metadataEl = render.find('.applecation__metadata');
        if (!metadataEl.length) return;

        // Сначала показываем год
        var year = (movie.release_date || movie.first_air_date || '').substr(0, 4);
        if (year) {
            metadataEl.html('<span class="metadata-badge metadata-text">' + year + '</span>');
        }

        getMetadata(movie).then(function(metadata) {
            var html = buildMetadataHTML(metadata);
            if (html) {
                metadataEl.html(html);
            }
        });
    }

    // =================================================================
    // Заполнение описания
    // =================================================================
    function fillDescription(render, movie) {
        var showDescription = getSetting('show_description');
        var descWrapper = render.find('.applecation__description-wrapper');
        var description = render.find('.applecation__description');

        if (!descWrapper.length || !description.length) return;

        var text = movie.overview || '';

        if (showDescription && text) {
            description.text(text);
            descWrapper.show();

            var descriptionOverlayEnabled = getSetting('description_overlay');
            if (descriptionOverlayEnabled) {
                // Настраиваем оверлей
                descWrapper.off('hover:enter');
                $('.applecation-description-overlay').remove();

                var title = movie.title || movie.name;
                var dateStr = (movie.release_date || movie.first_air_date || '') + '';
                var rel = dateStr.length > 3 ? Lampa.Utils.parseTime(dateStr).full : (dateStr.length > 0 ? dateStr : 'Неизвестно');
                var budget = '$ ' + Lampa.Utils.numberWithSpaces(movie.budget || 0);
                var countries = (movie.production_countries || []).map(function(c) {
                    var key = 'country_' + c.iso_3166_1.toLowerCase();
                    var t = Lampa.Lang.translate(key);
                    return t !== key ? t : c.name;
                }).join(', ');

                var overlay = $(Lampa.Template.get('applecation_overlay', {
                    title: title,
                    text: text,
                    relise: rel,
                    budget: budget,
                    countries: countries
                }));

                if (!movie.budget || movie.budget === 0) overlay.find('.applecation--budget').remove();
                if (!countries) overlay.find('.applecation--countries').remove();

                $('body').append(overlay);
                overlay.data('controller-created', false);

                descWrapper.addClass('selector');
                if (Lampa.Controller && Lampa.Controller.collectionAppend) {
                    Lampa.Controller.collectionAppend(descWrapper);
                }

                descWrapper.on('hover:enter', function() {
                    var el = $('.applecation-description-overlay');
                    if (!el.length) return;

                    setTimeout(function() { el.addClass('show'); }, 10);

                    if (!el.data('controller-created') && Lampa.Controller) {
                        var ctrl = {
                            toggle: function() {
                                Lampa.Controller.collectionSet(el);
                                Lampa.Controller.collectionFocus(el.find('.applecation-description-overlay__content'), el);
                            },
                            back: function() {
                                var ol = $('.applecation-description-overlay');
                                if (!ol.length) return;
                                ol.removeClass('show');
                                setTimeout(function() { Lampa.Controller.toggle('content'); }, 300);
                            }
                        };
                        Lampa.Controller.add('applecation_description', ctrl);
                        el.data('controller-created', true);
                    }

                    if (Lampa.Controller) Lampa.Controller.toggle('applecation_description');
                });
            } else {
                descWrapper.removeClass('selector');
                descWrapper.off('hover:enter');
            }

            descWrapper.addClass('show');
        } else {
            descWrapper.hide();
        }
    }

    // =================================================================
    // Заполнение информации
    // =================================================================
    function fillInfo(render, movie) {
        var info = render.find('.applecation__info');
        if (!info.length) return;

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
                var tm = Lampa.Lang.translate('time_m').replace('.', '');
                parts.push(m + ' ' + tm);
            }

            // Информация о сезонах
            var seasons = Lampa.Utils.countSeasons(movie);
            if (seasons) {
                var t = [2, 0, 1, 1, 1, 2];
                var forms = ['сезон', 'сезона', 'сезонов'];
                var seasonText = seasons + ' ' + forms[seasons % 100 > 4 && seasons % 100 < 20 ? 2 : t[Math.min(seasons % 10, 5)]];
                parts.push(seasonText);
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

        info.html(parts.length ? parts.join(' · ') : '');
        info.addClass('show');
    }

    // =================================================================
    // Загрузка логотипа
    // =================================================================
    function loadLogo(render, movie) {
        var logoImg = render.find('.applecation__logo');
        var wrapper = render.find('.applecation__logo-wrapper');
        var titleEl = render.find('.full-start-new__title');

        if (!logoImg.length || !wrapper.length) return;

        var type = movie.name ? 'tv' : 'movie';
        var lang = Lampa.Storage.get('language', 'ru') || 'ru';
        var url = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey() + '&language=' + lang);
        var urlAll = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey());

        var network = new Lampa.Reguest();
        network.timeout(10000);

        network.silent(url, function(data) {
            if (data && data.logos && data.logos.length) {
                var logo = data.logos.find(function(l) { return l.iso_639_1 === lang; }) ||
                          data.logos.find(function(l) { return l.iso_639_1 === 'en'; }) ||
                          data.logos[0];

                if (logo) {
                    applyLogo(logo.file_path);
                    return;
                }
            }

            network.silent(urlAll, function(dataAll) {
                if (dataAll && dataAll.logos && dataAll.logos.length) {
                    var logo = dataAll.logos.find(function(l) { return l.iso_639_1 === 'en'; }) || dataAll.logos[0];
                    if (logo) {
                        applyLogo(logo.file_path);
                        return;
                    }
                }
                titleEl.show();
                wrapper.addClass('loaded');
            }, function() {
                titleEl.show();
                wrapper.addClass('loaded');
            });

        }, function() {
            titleEl.show();
            wrapper.addClass('loaded');
        });

        function applyLogo(filePath) {
            var logoUrl = Lampa.TMDB.image('/t/p/original' + filePath);
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
        }
    }

    // =================================================================
    // Масштабирование
    // =================================================================
    function applyScaling() {
        var logoScale = parseInt(getSetting('logo_scale'), 10);
        var textScale = parseInt(getSetting('text_scale'), 10);
        var spacingScale = parseInt(getSetting('spacing_scale'), 10);

        $('style[data-id="applecation_scales"]').remove();

        var css = '<style data-id="applecation_scales">\n' +
            '.applecation .applecation__logo-wrapper img {\n' +
            '    max-width: ' + (35 * logoScale / 100) + 'vw !important;\n' +
            '    max-height: ' + (180 * logoScale / 100) + 'px !important;\n' +
            '}\n' +
            '.applecation .applecation__content-wrapper {\n' +
            '    font-size: ' + textScale + '% !important;\n' +
            '}\n' +
            '.applecation .full-start-new__title {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__meta {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__description {\n' +
            '    max-width: ' + (35 * textScale / 100) + 'vw !important;\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__info {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata .metadata-badge {\n' +
            '    font-size: ' + (0.75 * textScale / 100) + 'em !important;\n' +
            '}\n' +
            '</style>';

        $('body').append(css);
    }

    // =================================================================
    // Инжект стилей
    // =================================================================
    function injectStyles() {
        var css = `
        <style id="applecation_styles">
            .applecation { transition: all .3s; }
            .applecation .full-start-new__body { height: 80vh; }
            .applecation .full-start-new__right { display: flex; align-items: flex-end; padding: 0 2em 2em 2em; }
            .applecation .full-start-new__left { display: none !important; }

            .applecation__logo-wrapper { margin-bottom: 0.5em; opacity: 0; transform: translateY(20px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
            .applecation__logo-wrapper.loaded { opacity: 1; transform: translateY(0); }
            .applecation__logo-wrapper img { display: block; max-width: 35vw; max-height: 180px; width: auto; height: auto; object-fit: contain; object-position: left center; filter: drop-shadow(0 2px 10px rgba(0,0,0,0.5)); }

            .applecation__content-wrapper { font-size: 100%; max-width: 45vw; background: rgba(0,0,0,0.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 1.5em; border-radius: 1em; border: 1px solid rgba(255,255,255,0.05); }

            .applecation .full-start-new__title { font-size: 2.5em; font-weight: 700; line-height: 1.2; margin-bottom: 0.3em; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }

            .applecation__meta { display: flex; align-items: center; flex-wrap: wrap; color: #fff; font-size: 1em; margin-bottom: 0.5em; line-height: 1; gap: 0.5em; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
            .applecation__meta.show { opacity: 1; transform: translateY(0); }
            .applecation__meta-text { opacity: 0.85; }
            .applecation__network { display: inline-flex; align-items: center; line-height: 1; }
            .applecation__network img { display: block; max-height: 0.8em; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
            .applecation__meta .full-start__pg { margin: 0 0 0 0.6em; padding: 0.2em 0.5em; font-size: 0.85em; font-weight: 600; border: 1.5px solid rgba(255,255,255,0.4); border-radius: 0.3em; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.9); line-height: 1; }

            .applecation__metadata { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3em; margin: 0.2em 0 0.4em 0; }
            .applecation__metadata .metadata-badge { display: inline-flex; align-items: center; padding: 0.1em 0.4em; border-radius: 0.2em; font-size: 0.75em; font-weight: 500; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
            .applecation__metadata .metadata-season { background: rgba(255,0,0,0.2); border-color: rgba(255,0,0,0.3); color: #ff6b6b; }
            .applecation__metadata .metadata-quality { background: rgba(51,153,153,0.2); border-color: rgba(51,153,153,0.3); color: #5cd4b0; }
            .applecation__metadata .metadata-hdr { background: rgba(255,193,7,0.2); border-color: rgba(255,193,7,0.3); color: #ffd54f; }
            .applecation__metadata .metadata-audio { background: rgba(77,182,255,0.2); border-color: rgba(77,182,255,0.3); color: #4db6ff; }
            .applecation__metadata .metadata-dub { background: rgba(156,39,176,0.2); border-color: rgba(156,39,176,0.3); color: #ce93d8; }
            .applecation__metadata .metadata-text { color: rgba(255,255,255,0.7); }

            .applecation__description-wrapper { background: transparent; padding: 0; border-radius: 1em; width: fit-content; opacity: 0; transform: translateY(15px); transition: padding 0.25s ease, transform 0.25s ease, opacity 0.4s ease-out; cursor: pointer; }
            .applecation__description-wrapper.show { opacity: 1; transform: translateY(0); }
            .applecation__description-wrapper.focus { background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.18)); padding: .15em .4em 0 .7em; border-radius: 1em; width: fit-content; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35); transform: scale(1.07) translateY(0); }
            .applecation__description { color: rgba(255,255,255,0.6); font-size: 0.95em; line-height: 1.5; margin-bottom: 0.5em; max-width: 35vw; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
            .focus .applecation__description { color: rgba(255,255,255,0.92); }

            .applecation__info { color: rgba(255,255,255,0.75); font-size: 0.95em; line-height: 1.4; margin-bottom: 0.5em; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; display: flex; align-items: center; flex-wrap: wrap; gap: 0.5em; }
            .applecation__info.show { opacity: 1; transform: translateY(0); }

            .applecation__left { flex: 1; width: 100%; }
            .applecation__right { display: none; }

            .applecation .full-start-new__buttons { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 0.6em !important; margin-top: 0.5em !important; }
            .applecation .full-start__button { min-height: 2.6em; padding: 0.4em 1em; border-radius: 0.8em; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.9); font-size: 0.85em; font-weight: 600; transition: all 0.25s ease; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
            .applecation .full-start__button.focus, .applecation .full-start__button.hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.3); transform: scale(1.05); }
            .applecation .full-start__button.button--play { background: linear-gradient(135deg, rgba(82,255,179,0.9), rgba(105,183,226,0.9)); border-color: rgba(82,255,179,0.4); color: #000; }

            .applecation__overlay { width: 90vw; background: linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 25%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.10) 55%, rgba(0,0,0,0.04) 60%, rgba(0,0,0,0) 65%); pointer-events: none; z-index: 1; }

            .applecation .full-start__background { height: calc(100% + 6em); left: 0 !important; opacity: 0 !important; transition: opacity 0.6s ease-out, filter 0.3s ease-out !important; animation: none !important; transform: none !important; will-change: opacity, filter; image-rendering: auto; }
            .applecation .full-start__background.loaded:not(.dim) { opacity: 1 !important; image-rendering: auto; }
            .applecation .full-start__background.dim { filter: blur(30px); }
            .applecation .full-start__background.loaded.applecation-animated { opacity: 1 !important; }

            .applecation-description-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.3s ease, visibility 0.3s ease; }
            .applecation-description-overlay.show { opacity: 1; visibility: visible; pointer-events: all; }
            .applecation-description-overlay__bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; backdrop-filter: blur(100px); background: rgba(0,0,0,0.6); }
            .applecation-description-overlay__content { position: relative; z-index: 1; max-width: 60vw; max-height: 90vh; overflow-y: auto; padding: 2em; background: rgba(20,20,30,0.9); border-radius: 1.2em; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
            .applecation-description-overlay__title { font-size: 2em; font-weight: 600; margin-bottom: 1em; color: #fff; text-align: center; }
            .applecation-description-overlay__text { font-size: 1.2em; line-height: 1.6; color: rgba(255,255,255,0.9); white-space: pre-wrap; margin-bottom: 1.5em; }
            .applecation-description-overlay__details { display: flex; flex-wrap: wrap; gap: 1.5em; }
            .applecation-description-overlay__info-name { font-size: 0.9em; opacity: 0.6; margin-bottom: 0.3em; }
            .applecation-description-overlay__info-body { font-size: 1.1em; opacity: 0.9; }

            .applecation .full-start-new__head, .applecation .full-start-new__details, .applecation .full-descr, .applecation .full-descr__title, .applecation .full-start__head, .applecation .full-start-new__reactions, .applecation .full-start-new__rate-line { display: none !important; }

            @keyframes applecation-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .applecation .applecation-animate-in { animation: applecation-fade-in 0.5s ease forwards !important; }

            @media screen and (max-width: 720px) {
                .applecation .full-start-new__body { height: auto !important; min-height: 0 !important; }
                .applecation .full-start-new__right { display: block !important; padding: 0 1em 1em 1em !important; }
                .applecation .applecation__content-wrapper { max-width: 100% !important; padding: 1em !important; }
                .applecation .applecation__description { max-width: none !important; width: 100% !important; -webkit-line-clamp: 3 !important; }
                .applecation__logo-wrapper img { max-width: 60vw !important; max-height: 80px !important; }
                .applecation .full-start-new__title { font-size: 1.8em !important; }
            }

            @media screen and (max-width: 480px) {
                .applecation .applecation__description { -webkit-line-clamp: 2 !important; }
                .applecation__logo-wrapper img { max-width: 70vw !important; max-height: 60px !important; }
                .applecation .full-start-new__title { font-size: 1.4em !important; }
                .applecation .applecation__meta { font-size: 0.85em !important; }
            }
        </style>`;

        $('body').append(css);
    }

    // =================================================================
    // Настройки
    // =================================================================
    function addSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: 'applecation_settings',
            name: 'AppleTV+ Pro',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 18l20 12-10 2 2 10-12-24z" fill="currentColor"/><path d="M44 20l6-6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: { type: 'title' },
            field: { name: 'Отображение' }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_metadata',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать метаданные',
                description: 'Отображать качество, аудио, озвучку и информацию о сезонах'
            },
            onChange: function(value) {
                setSetting('show_metadata', value);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_description',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать описание',
                description: 'Отображать описание фильма в стиле Apple TV'
            },
            onChange: function(value) {
                setSetting('show_description', value);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_description_overlay',
                type: 'trigger',
                default: false
            },
            field: {
                name: 'Описание в оверлее',
                description: 'Показывать описание в отдельном окне при нажатии'
            },
            onChange: function(value) {
                setSetting('description_overlay', value);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: { type: 'title' },
            field: { name: 'Масштабирование' }
        });

        var scaleValues = {50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%', 100: 'По умолчанию (100%)', 110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%', 160: '160%', 170: '170%', 180: '180%'};

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_logo_scale',
                type: 'select',
                values: scaleValues,
                default: '100'
            },
            field: {
                name: 'Размер логотипа',
                description: 'Масштаб логотипа фильма'
            },
            onChange: function(value) {
                setSetting('logo_scale', parseInt(value, 10));
                applyScaling();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_text_scale',
                type: 'select',
                values: scaleValues,
                default: '100'
            },
            field: {
                name: 'Размер текста',
                description: 'Масштаб текста данных о фильме'
            },
            onChange: function(value) {
                setSetting('text_scale', parseInt(value, 10));
                applyScaling();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_spacing_scale',
                type: 'select',
                values: {50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%', 100: 'По умолчанию (100%)', 110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%', 160: '160%', 170: '170%', 180: '180%', 200: '200%', 250: '250%', 300: '300%'},
                default: '100'
            },
            field: {
                name: 'Отступы между строками',
                description: 'Расстояние между элементами информации'
            },
            onChange: function(value) {
                setSetting('spacing_scale', parseInt(value, 10));
                applyScaling();
            }
        });
    }

    // =================================================================
    // Запуск
    // =================================================================
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                initPlugin();
            }
        });
    }

})();
