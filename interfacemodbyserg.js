(function () {
    'use strict';

    // =================================================================
    // КОНФИГУРАЦИЯ И НАСТРОЙКИ
    // =================================================================

    var PLUGIN_NAME = 'interface_mod_full';
    var PLUGIN_VERSION = '3.2.0';

    var SETTINGS_COMPONENT = 'interface_mod_full_settings';
    var ENABLED_KEY = 'interface_mod_full_enabled';
    var ENABLED_ON_MAIN_KEY = 'interface_mod_full_enabled_main';
    var ENABLED_ON_FULL_KEY = 'interface_mod_full_enabled_full';
    var SHOW_TYPE_KEY = 'interface_mod_full_show_type';
    var SHOW_QUALITY_KEY = 'interface_mod_full_show_quality';
    var SHOW_STATUS_KEY = 'interface_mod_full_show_status';
    var SHOW_RATINGS_KEY = 'interface_mod_full_show_ratings';
    var SHOW_LAMPA_RATING_KEY = 'interface_mod_full_show_lampa_rating';
    var SHOW_AVERAGE_RATING_KEY = 'interface_mod_full_show_average_rating';
    var SHOW_SEASONS_KEY = 'interface_mod_full_show_seasons';
    var SEASONS_MODE_KEY = 'interface_mod_full_seasons_mode';
    var SHOW_BUTTONS_KEY = 'interface_mod_full_show_buttons';
    var THEME_KEY = 'interface_mod_full_theme';

    var DEFAULT_SETTINGS = {
        enabled: true,
        enabled_on_main: true,
        enabled_on_full: true,
        show_type: true,
        show_quality: true,
        show_status: true,
        show_ratings: true,
        show_lampa_rating: true,
        show_average_rating: true,
        show_seasons: true,
        show_buttons: false,
        seasons_mode: 'aired',
        theme: 'default'
    };

    function getSetting(key, defaultValue) {
        var value = Lampa.Storage.get(key, defaultValue);
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    }

    function setSetting(key, value) {
        Lampa.Storage.set(key, value);
    }

    function resetAllSettings() {
        setSetting(ENABLED_KEY, DEFAULT_SETTINGS.enabled);
        setSetting(ENABLED_ON_MAIN_KEY, DEFAULT_SETTINGS.enabled_on_main);
        setSetting(ENABLED_ON_FULL_KEY, DEFAULT_SETTINGS.enabled_on_full);
        setSetting(SHOW_TYPE_KEY, DEFAULT_SETTINGS.show_type);
        setSetting(SHOW_QUALITY_KEY, DEFAULT_SETTINGS.show_quality);
        setSetting(SHOW_STATUS_KEY, DEFAULT_SETTINGS.show_status);
        setSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings);
        setSetting(SHOW_LAMPA_RATING_KEY, DEFAULT_SETTINGS.show_lampa_rating);
        setSetting(SHOW_AVERAGE_RATING_KEY, DEFAULT_SETTINGS.show_average_rating);
        setSetting(SHOW_SEASONS_KEY, DEFAULT_SETTINGS.show_seasons);
        setSetting(SEASONS_MODE_KEY, DEFAULT_SETTINGS.seasons_mode);
        setSetting(SHOW_BUTTONS_KEY, DEFAULT_SETTINGS.show_buttons);
        setSetting(THEME_KEY, DEFAULT_SETTINGS.theme);
        
        setProfileSetting(ENABLED_KEY, DEFAULT_SETTINGS.enabled);
        setProfileSetting(ENABLED_ON_MAIN_KEY, DEFAULT_SETTINGS.enabled_on_main);
        setProfileSetting(ENABLED_ON_FULL_KEY, DEFAULT_SETTINGS.enabled_on_full);
        setProfileSetting(SHOW_TYPE_KEY, DEFAULT_SETTINGS.show_type);
        setProfileSetting(SHOW_QUALITY_KEY, DEFAULT_SETTINGS.show_quality);
        setProfileSetting(SHOW_STATUS_KEY, DEFAULT_SETTINGS.show_status);
        setProfileSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings);
        setProfileSetting(SHOW_LAMPA_RATING_KEY, DEFAULT_SETTINGS.show_lampa_rating);
        setProfileSetting(SHOW_AVERAGE_RATING_KEY, DEFAULT_SETTINGS.show_average_rating);
        setProfileSetting(SHOW_SEASONS_KEY, DEFAULT_SETTINGS.show_seasons);
        setProfileSetting(SEASONS_MODE_KEY, DEFAULT_SETTINGS.seasons_mode);
        setProfileSetting(SHOW_BUTTONS_KEY, DEFAULT_SETTINGS.show_buttons);
        setProfileSetting(THEME_KEY, DEFAULT_SETTINGS.theme);
        
        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('Настройки сброшены. Плагин будет перезагружен.');
        }
        setTimeout(function() { window.location.reload(); }, 1500);
    }

    // =================================================================
    // ПОДДЕРЖКА ПРОФИЛЕЙ
    // =================================================================

    function getProfileId() {
        if (window._np_profiles_started || window.profiles_plugin) {
            var lampacId = Lampa.Storage.get('lampac_profile_id', '');
            if (lampacId) return String(lampacId);
        }
        try {
            if (Lampa.Account.Permit.account && Lampa.Account.Permit.account.profile &&
                Lampa.Account.Permit.account.profile.id) {
                return String(Lampa.Account.Permit.account.profile.id);
            }
        } catch (e) {}
        return '';
    }

    function getProfileKey(baseKey) {
        var profileId = getProfileId();
        if (profileId && profileId.charAt(0) === '_') profileId = profileId.slice(1);
        return profileId ? baseKey + '_profile_' + profileId : baseKey;
    }

    function getProfileSetting(key, defaultValue) {
        return Lampa.Storage.get(getProfileKey(key), defaultValue);
    }

    function setProfileSetting(key, value) {
        Lampa.Storage.set(getProfileKey(key), value);
    }

    function loadProfileSettings() {
        setSetting(ENABLED_KEY, getProfileSetting(ENABLED_KEY, DEFAULT_SETTINGS.enabled));
        setSetting(ENABLED_ON_MAIN_KEY, getProfileSetting(ENABLED_ON_MAIN_KEY, DEFAULT_SETTINGS.enabled_on_main));
        setSetting(ENABLED_ON_FULL_KEY, getProfileSetting(ENABLED_ON_FULL_KEY, DEFAULT_SETTINGS.enabled_on_full));
        setSetting(SHOW_TYPE_KEY, getProfileSetting(SHOW_TYPE_KEY, DEFAULT_SETTINGS.show_type));
        setSetting(SHOW_QUALITY_KEY, getProfileSetting(SHOW_QUALITY_KEY, DEFAULT_SETTINGS.show_quality));
        setSetting(SHOW_STATUS_KEY, getProfileSetting(SHOW_STATUS_KEY, DEFAULT_SETTINGS.show_status));
        setSetting(SHOW_RATINGS_KEY, getProfileSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings));
        setSetting(SHOW_LAMPA_RATING_KEY, getProfileSetting(SHOW_LAMPA_RATING_KEY, DEFAULT_SETTINGS.show_lampa_rating));
        setSetting(SHOW_AVERAGE_RATING_KEY, getProfileSetting(SHOW_AVERAGE_RATING_KEY, DEFAULT_SETTINGS.show_average_rating));
        setSetting(SHOW_SEASONS_KEY, getProfileSetting(SHOW_SEASONS_KEY, DEFAULT_SETTINGS.show_seasons));
        setSetting(SEASONS_MODE_KEY, getProfileSetting(SEASONS_MODE_KEY, DEFAULT_SETTINGS.seasons_mode));
        setSetting(SHOW_BUTTONS_KEY, getProfileSetting(SHOW_BUTTONS_KEY, DEFAULT_SETTINGS.show_buttons));
        setSetting(THEME_KEY, getProfileSetting(THEME_KEY, DEFAULT_SETTINGS.theme));
    }

    function isPluginEnabled() {
        return getSetting(ENABLED_KEY, DEFAULT_SETTINGS.enabled);
    }

    function isEnabledOnMain() {
        return isPluginEnabled() && getSetting(ENABLED_ON_MAIN_KEY, DEFAULT_SETTINGS.enabled_on_main);
    }

    function isEnabledOnFull() {
        return isPluginEnabled() && getSetting(ENABLED_ON_FULL_KEY, DEFAULT_SETTINGS.enabled_on_full);
    }

    // =================================================================
    // CSS СТИЛИ
    // =================================================================

    var style = document.createElement('style');
    style.id = 'interface_mod_full_styles';
    style.textContent = `
        /* Скрываем стандартные метки Lampa */
        .card__type, .card__vote {
            display: none !important;
        }

        /* Метка типа контента (левый верхний угол) */
        .im-type-label {
            position: absolute;
            top: 0.6em;
            left: 0.6em;
            padding: 0.2em 0.6em;
            border-radius: 0.3em;
            font-size: 0.75em;
            font-weight: bold;
            z-index: 10;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .im-type-label.serial { background: #3498db; color: white; }
        .im-type-label.movie  { background: #2ecc71; color: white; }

        /* Метка качества */
        .im-quality-label {
            position: absolute;
            top: 0.7em;
            left: 6.8em;
            padding: 0.2em 0.5em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            z-index: 10;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }
        .im-quality-label.quality-4k  { background: #ff9800; color: white; }
        .im-quality-label.quality-fhd { background: #4caf50; color: white; }
        .im-quality-label.quality-hd  { background: #2196f3; color: white; }
        .im-quality-label.quality-sd  { background: #9e9e9e; color: white; }
        .im-quality-label.quality-ts  { background: #9e9e9e; color: white; }
        .im-quality-label.quality-cam { background: #9e9e9e; color: white; }

        /* Метка статуса сериала (под меткой типа) */
        .im-status-badge {
            position: absolute;
            top: 2.4em;
            left: 0.6em;
            padding: 0.2em 0.6em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            z-index: 10;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
        }
        .status-airing   { color: #4caf50; }
        .status-ended    { color: #9b59b6; }
        .status-canceled { color: #f44336; }
        .status-paused   { color: #ffc107; }

        /* Метка сезонов (снизу справа) */
        .im-seasons-badge {
            position: absolute;
            bottom: 2.5em;
            right: 0.6em;
            padding: 0.2em 0.6em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            z-index: 10;
            background: #e74c3c;
            color: white;
            text-align: center;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Контейнер основных рейтингов (справа сверху) */
        .im-ratings-container {
            position: absolute;
            top: 0.6em;
            right: 0.6em;
            display: flex;
            flex-direction: column;
            gap: 0.2em;
            z-index: 10;
            align-items: flex-end;
        }
        .im-rating-item {
            background: rgba(0, 0, 0, 0.7);
            padding: 0.2em 0.5em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            gap: 0.2em;
        }
        .im-rating-value { font-weight: bold; }
        .im-rating-source { 
            font-size: 0.65em; 
            font-weight: bold;
            color: white;
            margin-left: 0.2em;
        }

        /* Рейтинг Lampa (отдельно, снизу справа под сезонами) */
        .im-lampa-rating {
            position: absolute;
            bottom: 0.6em;
            right: 0.6em;
            background: rgba(0, 0, 0, 0.7);
            padding: 0.2em 0.5em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            gap: 0.2em;
            z-index: 10;
        }
        .im-lampa-value { font-weight: bold; }
        .im-lampa-source {
            font-size: 0.65em;
            font-weight: bold;
            color: white;
            margin-left: 0.2em;
        }

        /* Цвета рейтингов (только для чисел, источник белый) */
        .rating-high   { color: #4caf50; }
        .rating-medium { color: #2196f3; }
        .rating-low    { color: #ff9800; }
        .rating-very-low { color: #f44336; }

        /* Кнопки в карточке */
        .full-start-new__buttons, .full-start__buttons {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
        }

        /* Стили для постера внутри фильма/сериала */
        .full-start-new__poster, .full-start__poster {
            position: relative !important;
        }

        /* Адаптация под мобильные устройства */
        @media (max-width: 768px) {
            .im-type-label { font-size: 0.65em; top: 0.4em; left: 0.4em; }
            .im-quality-label { font-size: 0.6em; top: 0.5em; left: 6.2em; }
            .im-status-badge { font-size: 0.6em; top: 2.2em; left: 0.4em; }
            .im-seasons-badge { font-size: 0.6em; bottom: 2.0em; right: 0.4em; }
            .im-ratings-container { top: 0.4em; right: 0.4em; }
            .im-lampa-rating { bottom: 0.4em; right: 0.4em; }
            .im-rating-item { font-size: 0.6em; padding: 0.15em 0.4em; }
        }
    `;
    document.head.appendChild(style);

    // =================================================================
    // ТЕМЫ ОФОРМЛЕНИЯ
    // =================================================================

    var themes = {
        default: '',
        emerald_v2: `
            body { background: radial-gradient(1200px 600px at 70% 10%, #214a57 0%, transparent 60%), linear-gradient(135deg, #112229 0%, #15303a 45%, #0f1c22 100%) !important; color:#e6f2ef !important; }
            .menu__item, .settings-folder, .settings-param, .selectbox-item, .full-start__button, .full-descr__tag, .player-panel .button { border-radius: .85em !important; }
            .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus { background: linear-gradient(90deg, rgba(38,164,131,0.95), rgba(18,94,138,0.95)) !important; color:#fff !important; backdrop-filter: blur(2px) !important; box-shadow:0 6px 18px rgba(18,94,138,.35) !important; }
            .card.focus .card__view::after, .card.hover .card__view::after { border: 3px solid rgba(38,164,131,0.9) !important; box-shadow: 0 0 20px rgba(38,164,131,.45) !important; border-radius: .9em !important; }
            .settings__content, .settings-input__content, .selectbox__content, .modal__content { background: rgba(10,24,29,0.98) !important; border: 1px solid rgba(38,164,131,.15) !important; border-radius: .9em !important; }
        `,
        spotify: `
            body { background: linear-gradient(135deg, #282828 0%, #121212 40%, #000000 100%) !important; color: #ffffff !important; }
            .menu__item, .settings-folder, .settings-param, .selectbox-item, .full-start__button, .full-descr__tag, .player-panel .button { border-radius: 2em !important; }
            .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus { background: #1DB954 !important; color: #000 !important; box-shadow: 0 4px 15px rgba(29,185,84,.3) !important; font-weight: bold !important; }
            .card.focus .card__view::after, .card.hover .card__view::after { border: 3px solid #1DB954 !important; box-shadow: 0 0 15px rgba(29,185,84,.4) !important; border-radius: 0.6em !important; }
            .settings__content, .settings-input__content, .selectbox__content, .modal__content { background: rgba(18, 18, 18, 0.98) !important; border: 1px solid rgba(29,185,84,.2) !important; border-radius: 0.6em !important; }
        `,
        prime: `
            body { background: linear-gradient(135deg, #1e2b3c 0%, #232f3e 100%) !important; color: #ffffff !important; }
            .menu__item, .settings-folder, .settings-param, .selectbox-item, .full-start__button, .full-descr__tag, .player-panel .button { border-radius: 0.4em !important; }
            .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus { background: #00a8e1 !important; color: #fff !important; box-shadow: 0 4px 12px rgba(0, 168, 225, 0.4) !important; }
            .card.focus .card__view::after, .card.hover .card__view::after { border: 2px solid #00a8e1 !important; box-shadow: 0 0 15px rgba(0, 168, 225, 0.4) !important; border-radius: 0.4em !important; }
            .settings__content, .settings-input__content, .selectbox__content, .modal__content { background: rgba(30, 43, 60, 0.98) !important; border: 1px solid rgba(0, 168, 225, 0.2) !important; border-radius: 0.4em !important; }
        `,
        netflix: `
            body { background: #141414 !important; color: #ffffff !important; }
            .menu__item, .settings-folder, .settings-param, .selectbox-item, .full-start__button, .full-descr__tag, .player-panel .button { border-radius: 0.4em !important; }
            .menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus { background: #E50914 !important; color: #fff !important; box-shadow: 0 4px 15px rgba(229,9,20,.4) !important; }
            .card.focus .card__view::after, .card.hover .card__view::after { border: 3px solid #E50914 !important; box-shadow: 0 0 18px rgba(229,9,20,.5) !important; border-radius: 0.4em !important; }
            .settings__content, .settings-input__content, .selectbox__content, .modal__content { background: rgba(20, 20, 20, 0.98) !important; border: 1px solid rgba(229,9,20,.25) !important; border-radius: 0.4em !important; }
        `
    };

    function applyTheme(theme) {
        var oldStyle = document.getElementById('interface_mod_theme');
        if (oldStyle) oldStyle.remove();
        if (!theme || theme === 'default') return;
        var themeCss = themes[theme];
        if (!themeCss) return;
        var styleEl = document.createElement('style');
        styleEl.id = 'interface_mod_theme';
        styleEl.textContent = themeCss;
        document.head.appendChild(styleEl);
    }

    // =================================================================
    // УТИЛИТЫ
    // =================================================================

    function getRatingColor(rating) {
        var r = parseFloat(rating);
        if (isNaN(r)) return '';
        if (r >= 8.0) return 'rating-high';
        if (r >= 6.0) return 'rating-medium';
        if (r >= 4.0) return 'rating-low';
        return 'rating-very-low';
    }

    function formatRating(value) {
        var v = parseFloat(value);
        if (isNaN(v)) return '0.0';
        if (v === 10) return '10';
        return v.toFixed(1);
    }

    function isTVSeries(movie) {
        return movie.type === 'tv' ||
               movie.name !== undefined ||
               movie.first_air_date ||
               movie.number_of_seasons > 0 ||
               (movie.seasons && movie.seasons.length > 0);
    }

    // =================================================================
    // КАЧЕСТВО ВИДЕО (ТОЛЬКО ИЗ NUMPARSER, БЕЗ ОПРЕДЕЛЕНИЯ ПО ГОДУ)
    // =================================================================

    var qualityCache = {};

    var QUALITY_MAP = {
        '4k': '4K', '2160p': '4K', 'uhd': '4K',
        '1080p': 'FHD', 'fhd': 'FHD', 'full hd': 'FHD',
        '720p': 'HD', 'hd': 'HD',
        '480p': 'SD', 'sd': 'SD',
        'ts': 'TS', 'telesync': 'TS',
        'cam': 'CAM', 'camrip': 'CAM'
    };

    function detectQuality(title) {
        if (!title) return null;
        var lower = title.toLowerCase();
        for (var key in QUALITY_MAP) {
            if (lower.indexOf(key) !== -1) return QUALITY_MAP[key];
        }
        return null;
    }

    function getQualityFromData(card) {
        return new Promise(function(resolve) {
            if (!card || !card.id) return resolve(null);
            var cacheKey = 'quality_' + card.id;
            if (qualityCache[cacheKey]) return resolve(qualityCache[cacheKey]);
            
            if (card.release_quality) {
                var q = detectQuality(card.release_quality);
                if (q) { qualityCache[cacheKey] = q; return resolve(q); }
            }
            if (card.title) {
                var q = detectQuality(card.title);
                if (q) { qualityCache[cacheKey] = q; return resolve(q); }
            }
            resolve(null);
        });
    }

    // =================================================================
    // ЛАМПА РЕЙТИНГ (CUB)
    // =================================================================

    var lampaRatingCache = {};
    var reactionCoef = { fire: 10, nice: 7.5, think: 5, bore: 2.5, shit: 0 };
    var reactionIcons = { fire: '🔥', nice: '👍', think: '🤔', bore: '😴', shit: '💩' };

    function fetchLampaRating(ratingKey, isTV) {
        return new Promise(function(resolve) {
            if (lampaRatingCache[ratingKey]) return resolve(lampaRatingCache[ratingKey]);
            var url = 'https://cubnotrip.top/api/reactions/get/' + ratingKey;
            var request = new Lampa.Reguest();
            request.silent(url, function(data) {
                try {
                    if (data && data.result && Array.isArray(data.result)) {
                        var sum = 0, cnt = 0, reactionCnt = {};
                        for (var i = 0; i < data.result.length; i++) {
                            var coef = reactionCoef[data.result[i].type] || 0;
                            var count = data.result[i].counter || 0;
                            sum += count * coef;
                            cnt += count;
                            reactionCnt[data.result[i].type] = count;
                        }
                        if (cnt === 0) { resolve(null); return; }
                        var avg_rating = isTV ? 7.436 : 6.584;
                        var m = isTV ? 69 : 274;
                        var cub_rating = ((avg_rating * m + sum) / (m + cnt));
                        var medianIndex = Math.floor(cnt / 2);
                        var reactionOrder = ['fire', 'nice', 'think', 'bore', 'shit'];
                        var cumulativeCount = 0, medianReaction = '';
                        for (var j = 0; j < reactionOrder.length; j++) {
                            cumulativeCount += (reactionCnt[reactionOrder[j]] || 0);
                            if (cumulativeCount >= medianIndex) { medianReaction = reactionOrder[j]; break; }
                        }
                        var result = { rating: parseFloat(cub_rating.toFixed(1)), medianReaction: medianReaction, icon: reactionIcons[medianReaction] || '⭐' };
                        lampaRatingCache[ratingKey] = result;
                        resolve(result);
                    } else resolve(null);
                } catch(e) { resolve(null); }
            }, function() { resolve(null); });
        });
    }

    // =================================================================
    // СЕЗОНЫ И ЭПИЗОДЫ (КОРРЕКТНАЯ АКТУАЛЬНАЯ ИНФОРМАЦИЯ)
    // =================================================================

    var seriesDataCache = {};

    function fetchSeriesData(seriesId) {
        return new Promise(function(resolve) {
            if (seriesDataCache[seriesId]) return resolve(seriesDataCache[seriesId]);
            var url = Lampa.TMDB.api('tv/' + seriesId + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru'));
            var request = new Lampa.Reguest();
            request.silent(url, function(data) {
                if (data) {
                    var result = {
                        status: data.status,
                        seasons: data.seasons || [],
                        numberOfSeasons: data.number_of_seasons || 0,
                        numberOfEpisodes: data.number_of_episodes || 0
                    };
                    seriesDataCache[seriesId] = result;
                    resolve(result);
                } else resolve(null);
            }, function() { resolve(null); });
        });
    }

    function getSeasonsInfo(seriesInfo) {
        if (!seriesInfo) return { text: '' };
        var mode = getSetting(SEASONS_MODE_KEY, DEFAULT_SETTINGS.seasons_mode);
        
        var totalSeasons = seriesInfo.numberOfSeasons || 0;
        var totalEpisodes = seriesInfo.numberOfEpisodes || 0;
        var airedSeasons = 0, airedEpisodes = 0;
        var now = new Date();
        
        // Подсчёт вышедших сезонов и серий
        if (seriesInfo.seasons) {
            seriesInfo.seasons.forEach(function(season) {
                if (season.season_number === 0) return;
                
                // Проверяем, вышел ли сезон
                var seasonAired = false;
                if (season.air_date) {
                    var airDate = new Date(season.air_date);
                    if (airDate <= now) {
                        seasonAired = true;
                        airedSeasons++;
                    }
                }
                
                // Считаем вышедшие эпизоды
                if (season.episodes && season.episodes.length > 0) {
                    season.episodes.forEach(function(ep) {
                        if (ep.air_date) {
                            var epAirDate = new Date(ep.air_date);
                            if (epAirDate <= now) {
                                airedEpisodes++;
                            }
                        }
                    });
                } else if (seasonAired && season.episode_count) {
                    airedEpisodes += season.episode_count;
                }
            });
        }
        
        // Если не нашли вышедшие, используем общее количество
        if (airedSeasons === 0 && totalSeasons > 0) airedSeasons = totalSeasons;
        if (airedEpisodes === 0 && totalEpisodes > 0) airedEpisodes = totalEpisodes;
        
        function plural(n, one, two, five) {
            var m = Math.abs(n) % 100;
            if (m >= 5 && m <= 20) return five;
            m %= 10;
            if (m === 1) return one;
            if (m >= 2 && m <= 4) return two;
            return five;
        }
        
        if (mode === 'total') {
            var seasonsText = totalSeasons + ' ' + plural(totalSeasons, 'сезон', 'сезона', 'сезонов');
            var episodesText = totalEpisodes + ' ' + plural(totalEpisodes, 'серия', 'серии', 'серий');
            return { text: seasonsText + ' • ' + episodesText };
        } else {
            // Актуальная информация
            var sText = airedSeasons + ' ' + plural(airedSeasons, 'сезон', 'сезона', 'сезонов');
            var eText;
            if (totalEpisodes > 0 && airedEpisodes < totalEpisodes && airedEpisodes > 0) {
                eText = airedEpisodes + ' ' + plural(airedEpisodes, 'серия', 'серии', 'серий') + ' из ' + totalEpisodes;
            } else {
                eText = (airedEpisodes || totalEpisodes) + ' ' + plural(airedEpisodes || totalEpisodes, 'серия', 'серии', 'серий');
            }
            return { text: sText + ' • ' + eText };
        }
    }

    function getStatusTextAndColor(seriesInfo) {
        if (!seriesInfo) return { text: 'НЕИЗВЕСТНО', colorClass: 'status-paused' };
        var status = seriesInfo.status;
        if (status === 'Ended') return { text: 'ЗАВЕРШЁН', colorClass: 'status-ended' };
        if (status === 'Canceled') return { text: 'ОТМЕНЁН', colorClass: 'status-canceled' };
        if (status === 'Returning Series') return { text: 'В ЭФИРЕ', colorClass: 'status-airing' };
        if (status === 'In Production') return { text: 'В ПРОИЗВОДСТВЕ', colorClass: 'status-airing' };
        if (status === 'Planned') return { text: 'ЗАПЛАНИРОВАН', colorClass: 'status-paused' };
        return { text: status || 'НЕИЗВЕСТНО', colorClass: 'status-paused' };
    }

    // =================================================================
    // ВСЕ КНОПКИ В КАРТОЧКЕ
    // =================================================================

    function setupAllButtons() {
        if (!getSetting(SHOW_BUTTONS_KEY, DEFAULT_SETTINGS.show_buttons)) return;
        
        if (Lampa.FullCard) {
            var origBuild = Lampa.FullCard.build;
            Lampa.FullCard.build = function(data) {
                var card = origBuild(data);
                card.organizeButtons = function() {
                    var el = card.activity && card.activity.render();
                    if (!el) return;
                    var cont = el.find('.full-start-new__buttons').length ? el.find('.full-start-new__buttons') :
                              el.find('.full-start__buttons').length ? el.find('.full-start__buttons') :
                              el.find('.buttons-container');
                    if (!cont.length) return;
                    var selectors = ['.buttons--container .full-start__button', '.full-start-new__buttons .full-start__button', '.full-start__buttons .full-start__button', '.buttons-container .button'];
                    var all = [];
                    selectors.forEach(function(s) { el.find(s).each(function() { all.push(this); }); });
                    if (!all.length) return;
                    var cats = { online: [], torrent: [], trailer: [], other: [] }, seen = {};
                    all.forEach(function(b) {
                        var t = $(b).text().trim();
                        if (!t || seen[t]) return;
                        seen[t] = true;
                        var c = b.className || '';
                        if (c.includes('online')) cats.online.push(b);
                        else if (c.includes('torrent')) cats.torrent.push(b);
                        else if (c.includes('trailer')) cats.trailer.push(b);
                        else cats.other.push(b);
                    });
                    var order = ['online', 'torrent', 'trailer', 'other'];
                    var toggle = Lampa.Controller.enabled().name === 'full_start';
                    if (toggle) Lampa.Controller.toggle('settings_component');
                    cont.children().detach();
                    cont.css({ display: 'flex', flexWrap: 'wrap', gap: '10px' });
                    order.forEach(function(o) { cats[o].forEach(function(btn) { cont.append(btn); }); });
                    if (toggle) setTimeout(function() { Lampa.Controller.toggle('full_start'); }, 100);
                };
                card.onCreate = function() { setTimeout(card.organizeButtons, 300); };
                return card;
            };
        }
        
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' && e.object && e.object.activity && !Lampa.FullCard) {
                setTimeout(function() {
                    var el = e.object.activity.render();
                    var cont = el.find('.full-start-new__buttons').length ? el.find('.full-start-new__buttons') :
                              el.find('.full-start__buttons').length ? el.find('.full-start__buttons') :
                              el.find('.buttons-container');
                    if (!cont.length) return;
                    cont.css({ display: 'flex', flexWrap: 'wrap', gap: '10px' });
                    var selectors = ['.buttons--container .full-start__button', '.full-start-new__buttons .full-start__button', '.full-start__buttons .full-start__button', '.buttons-container .button'];
                    var all = [];
                    selectors.forEach(function(s) { el.find(s).each(function() { all.push(this); }); });
                    if (!all.length) return;
                    var cats = { online: [], torrent: [], trailer: [], other: [] }, seen = {};
                    all.forEach(function(b) {
                        var t = $(b).text().trim();
                        if (!t || seen[t]) return;
                        seen[t] = true;
                        var c = b.className || '';
                        if (c.includes('online')) cats.online.push(b);
                        else if (c.includes('torrent')) cats.torrent.push(b);
                        else if (c.includes('trailer')) cats.trailer.push(b);
                        else cats.other.push(b);
                    });
                    var order = ['online', 'torrent', 'trailer', 'other'];
                    var toggle = Lampa.Controller.enabled().name === 'full_start';
                    if (toggle) Lampa.Controller.toggle('settings_component');
                    order.forEach(function(o) { cats[o].forEach(function(btn) { cont.append(btn); }); });
                    if (toggle) setTimeout(function() { Lampa.Controller.toggle('full_start'); }, 100);
                }, 300);
            }
        });
        
        new MutationObserver(function(muts) {
            if (!getSetting(SHOW_BUTTONS_KEY, DEFAULT_SETTINGS.show_buttons)) return;
            var need = false;
            muts.forEach(function(m) {
                if (m.type === 'childList' && (m.target.classList.contains('full-start-new__buttons') || m.target.classList.contains('full-start__buttons') || m.target.classList.contains('buttons-container'))) {
                    need = true;
                }
            });
            if (need) {
                setTimeout(function() {
                    var act = Lampa.Activity.active();
                    if (act && act.activity.card && typeof act.activity.card.organizeButtons === 'function') {
                        act.activity.card.organizeButtons();
                    }
                }, 100);
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    // =================================================================
    // МЕТКА ТИПА КОНТЕНТА
    // =================================================================

    function addTypeLabel(card) {
        if (!getSetting(SHOW_TYPE_KEY, DEFAULT_SETTINGS.show_type)) return;
        if ($(card).closest('.explorer, .layer--online, .select-box').length) return;
        if ($(card).find('.im-type-label').length) return;
        
        var view = $(card).find('.card__view');
        if (!view.length) return;
        
        var data = card.card_data || {};
        var isTV = isTVSeries(data);
        if (!isTV) {
            if ($(card).hasClass('card--tv')) isTV = true;
            else if ($(card).find('.card__type, .card__temp').text().match(/(сезон|серия|эпизод|ТВ|TV)/i)) isTV = true;
        }
        
        var isPerson = $(card).hasClass('card--person') || $(card).closest('.scroll--persons, .items--persons, .crew').length > 0;
        if (isPerson) return;
        
        var lbl = $('<div class="im-type-label ' + (isTV ? 'serial' : 'movie') + '">' + (isTV ? 'СЕРИАЛ' : 'ФИЛЬМ') + '</div>');
        view.append(lbl);
    }

    function processTypeLabels() {
        $('.card').each(function() { addTypeLabel(this); });
    }

    function setupTypeLabels() {
        processTypeLabels();
        new MutationObserver(function(muts) {
            muts.forEach(function(m) {
                if (m.addedNodes) $(m.addedNodes).find('.card').each(function() { addTypeLabel(this); });
                if (m.type === 'attributes' && ['class', 'data-card', 'data-type'].includes(m.attributeName) && $(m.target).hasClass('card')) {
                    addTypeLabel(m.target);
                }
            });
        }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-card', 'data-type'] });
        setInterval(processTypeLabels, 2000);
    }

    // =================================================================
    // ОСНОВНАЯ ФУНКЦИЯ ДОБАВЛЕНИЯ ВСЕХ МЕТОК НА КАРТОЧКУ
    // =================================================================

    var processedCards = [];

    function addAllLabelsToCard(cardElement, movieData) {
        if (!isEnabledOnMain()) return;
        if (processedCards.indexOf(cardElement) !== -1) return;

        var cardView = cardElement.querySelector('.card__view');
        if (!cardView) return;

        var data = movieData || cardElement.card_data || {};
        if (!data.id) return;

        var isTV = isTVSeries(data);
        if (cardView.style.position !== 'relative') cardView.style.position = 'relative';

        // Очищаем только наши метки
        var oldLabels = cardView.querySelectorAll('.im-type-label, .im-quality-label, .im-status-badge, .im-seasons-badge, .im-ratings-container, .im-lampa-rating');
        for (var i = 0; i < oldLabels.length; i++) oldLabels[i].remove();

        // 1. Метка типа контента
        if (getSetting(SHOW_TYPE_KEY, DEFAULT_SETTINGS.show_type)) {
            var typeLabel = document.createElement('div');
            typeLabel.className = 'im-type-label ' + (isTV ? 'serial' : 'movie');
            typeLabel.textContent = isTV ? 'СЕРИАЛ' : 'ФИЛЬМ';
            cardView.appendChild(typeLabel);
        }

        // 2. Метка качества
        if (getSetting(SHOW_QUALITY_KEY, DEFAULT_SETTINGS.show_quality)) {
            getQualityFromData(data).then(function(quality) {
                if (quality && !cardView.querySelector('.im-quality-label')) {
                    var qClass = 'quality-' + quality.toLowerCase().replace(/[^a-z0-9]/g, '');
                    var qualityLabel = document.createElement('div');
                    qualityLabel.className = 'im-quality-label ' + qClass;
                    qualityLabel.textContent = quality;
                    cardView.appendChild(qualityLabel);
                }
            });
        }

        // 3. Статус сериала (под меткой типа)
        if (isTV && getSetting(SHOW_STATUS_KEY, DEFAULT_SETTINGS.show_status)) {
            fetchSeriesData(data.id).then(function(seriesInfo) {
                if (seriesInfo && seriesInfo.status && !cardView.querySelector('.im-status-badge')) {
                    var statusInfo = getStatusTextAndColor(seriesInfo);
                    var statusBadge = document.createElement('div');
                    statusBadge.className = 'im-status-badge ' + statusInfo.colorClass;
                    statusBadge.textContent = statusInfo.text;
                    cardView.appendChild(statusBadge);
                }
            });
        }

        // 4. Сезоны и серии (снизу справа)
        if (isTV && getSetting(SHOW_SEASONS_KEY, DEFAULT_SETTINGS.show_seasons)) {
            fetchSeriesData(data.id).then(function(seriesInfo) {
                if (seriesInfo && !cardView.querySelector('.im-seasons-badge')) {
                    var seasonsInfo = getSeasonsInfo(seriesInfo);
                    if (seasonsInfo.text) {
                        var seasonsBadge = document.createElement('div');
                        seasonsBadge.className = 'im-seasons-badge';
                        seasonsBadge.textContent = seasonsInfo.text;
                        cardView.appendChild(seasonsBadge);
                    }
                }
            });
        }

        // 5. Основные рейтинги (справа сверху)
        if (getSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings)) {
            var ratingsContainer = document.createElement('div');
            ratingsContainer.className = 'im-ratings-container';

            // TMDB
            if (data.vote_average && data.vote_average > 0) {
                var tmdbRating = document.createElement('div');
                tmdbRating.className = 'im-rating-item';
                tmdbRating.innerHTML = '<span class="im-rating-value ' + getRatingColor(data.vote_average) + '">★ ' + formatRating(data.vote_average) + '</span><span class="im-rating-source">TMDB</span>';
                ratingsContainer.appendChild(tmdbRating);
            }
            // IMDB
            if (data.imdb_rating && data.imdb_rating > 0) {
                var imdbRating = document.createElement('div');
                imdbRating.className = 'im-rating-item';
                imdbRating.innerHTML = '<span class="im-rating-value ' + getRatingColor(data.imdb_rating) + '">★ ' + formatRating(data.imdb_rating) + '</span><span class="im-rating-source">IMDB</span>';
                ratingsContainer.appendChild(imdbRating);
            }
            // Кинопоиск
            if (data.kp_rating && data.kp_rating > 0) {
                var kpRating = document.createElement('div');
                kpRating.className = 'im-rating-item';
                kpRating.innerHTML = '<span class="im-rating-value ' + getRatingColor(data.kp_rating) + '">★ ' + formatRating(data.kp_rating) + '</span><span class="im-rating-source">КП</span>';
                ratingsContainer.appendChild(kpRating);
            }
            // Общий рейтинг (средний) - включен по умолчанию
            if (getSetting(SHOW_AVERAGE_RATING_KEY, DEFAULT_SETTINGS.show_average_rating)) {
                var tmdb = data.vote_average || 0, imdb = data.imdb_rating || 0, kp = data.kp_rating || 0;
                if (tmdb > 0 || imdb > 0 || kp > 0) {
                    var weights = { tmdb: 0.35, imdb: 0.30, kp: 0.35 };
                    var weightedSum = 0, totalWeight = 0;
                    if (tmdb > 0) { weightedSum += tmdb * weights.tmdb; totalWeight += weights.tmdb; }
                    if (imdb > 0) { weightedSum += imdb * weights.imdb; totalWeight += weights.imdb; }
                    if (kp > 0) { weightedSum += kp * weights.kp; totalWeight += weights.kp; }
                    var avgRating = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : '0.0';
                    var avgColor = getRatingColor(avgRating);
                    var avgRatingEl = document.createElement('div');
                    avgRatingEl.className = 'im-rating-item';
                    avgRatingEl.innerHTML = '<span class="im-rating-value ' + avgColor + '">★ ' + avgRating + '</span><span class="im-rating-source">Средний</span>';
                    ratingsContainer.appendChild(avgRatingEl);
                }
            }
            if (ratingsContainer.children.length > 0) {
                cardView.appendChild(ratingsContainer);
            }
        }

        // 6. Рейтинг Lampa (отдельно, снизу справа под сезонами)
        if (isTV && getSetting(SHOW_LAMPA_RATING_KEY, DEFAULT_SETTINGS.show_lampa_rating)) {
            var ratingKey = (isTV ? 'tv_' : 'movie_') + data.id;
            fetchLampaRating(ratingKey, isTV).then(function(lampaData) {
                if (lampaData && lampaData.rating > 0 && !cardView.querySelector('.im-lampa-rating')) {
                    var lampaRatingDiv = document.createElement('div');
                    lampaRatingDiv.className = 'im-lampa-rating';
                    lampaRatingDiv.innerHTML = '<span class="im-lampa-value ' + getRatingColor(lampaData.rating) + '">' + (lampaData.icon || '⚡') + ' ' + formatRating(lampaData.rating) + '</span><span class="im-lampa-source">Lampa</span>';
                    cardView.appendChild(lampaRatingDiv);
                }
            });
        }

        processedCards.push(cardElement);
    }

    // =================================================================
    // ДЛЯ СТРАНИЦЫ ФИЛЬМА/СЕРИАЛА (full)
    // =================================================================

    function addLabelsToFullPoster() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;
            if (!isEnabledOnFull()) return;
            
            var activity = e.object.activity;
            var render = activity.render();
            var poster = render.find('.full-start-new__poster, .full-start__poster');
            if (!poster.length) return;
            
            var movie = e.data && e.data.movie;
            if (!movie || !movie.id) return;
            
            poster.find('.im-type-label, .im-quality-label, .im-status-badge, .im-seasons-badge, .im-ratings-container, .im-lampa-rating').remove();
            poster.css('position', 'relative');
            
            var tempCard = document.createElement('div');
            tempCard.classList.add('card');
            tempCard.card_data = movie;
            var tempView = document.createElement('div');
            tempView.classList.add('card__view');
            tempCard.appendChild(tempView);
            
            var savedProcessed = processedCards.slice();
            processedCards = [];
            addAllLabelsToCard(tempCard, movie);
            processedCards = savedProcessed;
            
            var labels = tempCard.querySelectorAll('.im-type-label, .im-quality-label, .im-status-badge, .im-seasons-badge, .im-ratings-container, .im-lampa-rating');
            for (var i = 0; i < labels.length; i++) {
                poster.append(labels[i]);
            }
            
            // Повторная попытка для асинхронных данных
            setTimeout(function() {
                if (!poster.find('.im-seasons-badge').length || !poster.find('.im-lampa-rating').length) {
                    var retryCard = document.createElement('div');
                    retryCard.classList.add('card');
                    retryCard.card_data = movie;
                    var retryView = document.createElement('div');
                    retryView.classList.add('card__view');
                    retryCard.appendChild(retryView);
                    addAllLabelsToCard(retryCard, movie);
                    var retryLabels = retryCard.querySelectorAll('.im-seasons-badge, .im-lampa-rating');
                    for (var j = 0; j < retryLabels.length; j++) {
                        poster.append(retryLabels[j]);
                    }
                }
            }, 1000);
        });
    }

    // =================================================================
    // НАБЛЮДАТЕЛИ ДЛЯ КАРТОЧЕК
    // =================================================================

    function processCard(card) {
        if (!card || !card.card_data) return;
        addAllLabelsToCard(card, card.card_data);
    }

    function setupObservers() {
        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var addedNodes = mutations[i].addedNodes;
                for (var j = 0; j < addedNodes.length; j++) {
                    var node = addedNodes[j];
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('card')) processCard(node);
                        var cards = node.querySelectorAll ? node.querySelectorAll('.card') : [];
                        for (var k = 0; k < cards.length; k++) processCard(cards[k]);
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        var existingCards = document.querySelectorAll('.card');
        for (var i = 0; i < existingCards.length; i++) processCard(existingCards[i]);
    }

    // =================================================================
    // ЦВЕТНЫЕ РЕЙТИНГИ (ТОЛЬКО ЧИСЛО ЦВЕТНОЕ)
    // =================================================================

    function updateVoteColors() {
        if (!getSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings)) return;
        
        function applyColor(el) {
            if ($(el).closest('.explorer').length) return;
            // Ищем число в тексте
            var text = $(el).text().trim();
            var match = text.match(/(\d+[\.,]\d+|\d+)/);
            if (!match) return;
            var rating = parseFloat(match[0].replace(',', '.'));
            if (isNaN(rating)) return;
            
            // Определяем цвет для числа
            var color = '';
            if (rating >= 8.0) color = '#4caf50';
            else if (rating >= 6.0) color = '#2196f3';
            else if (rating >= 4.0) color = '#ff9800';
            else color = '#f44336';
            
            // Красим только число
            var newHtml = text.replace(match[0], '<span style="color:' + color + '; font-weight:bold;">' + match[0] + '</span>');
            $(el).html(newHtml);
        }
        
        $('.card__vote, .full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate').each(function() { 
            applyColor(this); 
        });
    }

    function setupVoteColors() {
        if (!getSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings)) return;
        setTimeout(updateVoteColors, 500);
        new MutationObserver(function() { setTimeout(updateVoteColors, 100); }).observe(document.body, { childList: true, subtree: true });
        Lampa.Listener.follow('full', function(d) { if (d.type === 'complite') setTimeout(updateVoteColors, 100); });
    }

    // =================================================================
    // НАСТРОЙКИ
    // =================================================================

    function setupSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: SETTINGS_COMPONENT,
            name: 'Interface Mod',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z" fill="currentColor"/><path d="M4 11C4 10.4477 4.44772 10 5 10H19C19.5523 10 20 10.4477 20 11V13C20 13.5523 19.5523 14 19 14H5C4.44772 14 4 13.5523 4 13V11Z" fill="currentColor"/><path d="M4 17C4 16.4477 4.44772 16 5 16H19C19.5523 16 20 16.4477 20 17V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z" fill="currentColor"/></svg>'
        });

        // Кнопка сброса
        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: 'reset_all', type: 'button' },
            field: { name: 'Сбросить все настройки', description: 'Вернуть все параметры плагина к значениям по умолчанию' },
            onChange: resetAllSettings
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { type: 'title' },
            field: { name: 'Включение плагина' }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: ENABLED_KEY, type: 'trigger', default: DEFAULT_SETTINGS.enabled },
            field: { name: 'Включить плагин', description: 'Глобальное включение/отключение всех функций' },
            onChange: function(v) {
                setProfileSetting(ENABLED_KEY, v);
                setSetting(ENABLED_KEY, v);
                if (!v) document.querySelectorAll('.im-type-label, .im-quality-label, .im-status-badge, .im-seasons-badge, .im-ratings-container, .im-lampa-rating').forEach(function(el) { el && el.remove(); });
                processedCards = [];
                if (v) $('.card').each(function() { processCard(this); });
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: ENABLED_ON_MAIN_KEY, type: 'trigger', default: DEFAULT_SETTINGS.enabled_on_main },
            field: { name: 'Показывать на главной странице', description: 'Отображать метки на карточках в списках' },
            onChange: function(v) {
                setProfileSetting(ENABLED_ON_MAIN_KEY, v);
                setSetting(ENABLED_ON_MAIN_KEY, v);
                if (!v) document.querySelectorAll('.card .im-type-label, .card .im-quality-label, .card .im-status-badge, .card .im-seasons-badge, .card .im-ratings-container, .card .im-lampa-rating').forEach(function(el) { el && el.remove(); });
                processedCards = [];
                if (v) $('.card').each(function() { processCard(this); });
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: ENABLED_ON_FULL_KEY, type: 'trigger', default: DEFAULT_SETTINGS.enabled_on_full },
            field: { name: 'Показывать внутри фильма/сериала', description: 'Отображать метки на постере при открытии карточки' },
            onChange: function(v) {
                setProfileSetting(ENABLED_ON_FULL_KEY, v);
                setSetting(ENABLED_ON_FULL_KEY, v);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { type: 'title' },
            field: { name: 'Элементы на постере' }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_TYPE_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_type },
            field: { name: 'Метка "Фильм"/"Сериал"', description: 'Показывать тип контента' },
            onChange: function(v) {
                setProfileSetting(SHOW_TYPE_KEY, v);
                setSetting(SHOW_TYPE_KEY, v);
                if (v) processTypeLabels();
                else $('.im-type-label').remove();
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_QUALITY_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_quality },
            field: { name: 'Метка качества', description: 'Показывать качество видео (4K/FHD/HD/SD/TS/CAM)' },
            onChange: function(v) {
                setProfileSetting(SHOW_QUALITY_KEY, v);
                setSetting(SHOW_QUALITY_KEY, v);
                processedCards = [];
                if (v) $('.card').each(function() { processCard(this); });
                else $('.im-quality-label').remove();
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_STATUS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_status },
            field: { name: 'Статус сериала', description: 'Показывать статус (в эфире/завершён)' },
            onChange: function(v) {
                setProfileSetting(SHOW_STATUS_KEY, v);
                setSetting(SHOW_STATUS_KEY, v);
                processedCards = [];
                if (v) $('.card').each(function() { processCard(this); });
                else $('.im-status-badge').remove();
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_SEASONS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_seasons },
            field: { name: 'Сезоны и серии', description: 'Показывать информацию о сезонах и сериях' },
            onChange: function(v) {
                setProfileSetting(SHOW_SEASONS_KEY, v);
                setSetting(SHOW_SEASONS_KEY, v);
                processedCards = [];
                if (v) $('.card').each(function() { processCard(this); });
                else $('.im-seasons-badge').remove();
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SEASONS_MODE_KEY, type: 'select', values: { aired: 'Актуальная информация', total: 'Полное количество' }, default: DEFAULT_SETTINGS.seasons_mode },
            field: { name: 'Режим отображения сезонов', description: 'Как отображать информацию о сезонах' },
            onChange: function(v) {
                setProfileSetting(SEASONS_MODE_KEY, v);
                setSetting(SEASONS_MODE_KEY, v);
                processedCards = [];
                $('.card').each(function() { processCard(this); });
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_RATINGS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_ratings },
            field: { name: 'Рейтинги (TMDB/IMDB/КП)', description: 'Показывать рейтинги' },
            onChange: function(v) {
                setProfileSetting(SHOW_RATINGS_KEY, v);
                setSetting(SHOW_RATINGS_KEY, v);
                processedCards = [];
                if (v) $('.card').each(function() { processCard(this); });
                else $('.im-ratings-container').remove();
                setupVoteColors();
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_LAMPA_RATING_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_lampa_rating },
            field: { name: 'Рейтинг Lampa (CUB)', description: 'Показывать рейтинг сообщества Lampa с эмодзи (отдельно снизу справа)' },
            onChange: function(v) {
                setProfileSetting(SHOW_LAMPA_RATING_KEY, v);
                setSetting(SHOW_LAMPA_RATING_KEY, v);
                processedCards = [];
                $('.card').each(function() { processCard(this); });
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_AVERAGE_RATING_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_average_rating },
            field: { name: 'Общий рейтинг (средний)', description: 'Показывать средний рейтинг (TMDB + IMDB + КП)' },
            onChange: function(v) {
                setProfileSetting(SHOW_AVERAGE_RATING_KEY, v);
                setSetting(SHOW_AVERAGE_RATING_KEY, v);
                processedCards = [];
                $('.card').each(function() { processCard(this); });
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_BUTTONS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_buttons },
            field: { name: 'Показывать все кнопки', description: 'Отображать все кнопки действий в карточке' },
            onChange: function(v) {
                setProfileSetting(SHOW_BUTTONS_KEY, v);
                setSetting(SHOW_BUTTONS_KEY, v);
                setupAllButtons();
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: THEME_KEY, type: 'select', values: { default: 'По умолчанию', emerald_v2: 'Изумруд V2', spotify: 'Spotify Dark', prime: 'Prime Blue', netflix: 'Netflix' }, default: DEFAULT_SETTINGS.theme },
            field: { name: 'Тема интерфейса', description: 'Выберите тему оформления' },
            onChange: function(v) {
                setProfileSetting(THEME_KEY, v);
                setSetting(THEME_KEY, v);
                applyTheme(v);
            }
        });
    }

    // =================================================================
    // ПЕРЕМЕЩЕНИЕ НАСТРОЕК
    // =================================================================

    function moveSettingsAfterInterface() {
        Lampa.Settings.listener.follow('open', function() {
            setTimeout(function() {
                var ourComponent = document.querySelector('.settings-folder[data-component="' + SETTINGS_COMPONENT + '"]');
                var interfaceComponent = document.querySelector('.settings-folder[data-component="interface"]');
                if (ourComponent && interfaceComponent && ourComponent.nextSibling !== interfaceComponent.nextSibling) {
                    interfaceComponent.insertAdjacentElement('afterend', ourComponent);
                }
            }, 100);
        });
    }

    // =================================================================
    // ИНИЦИАЛИЗАЦИЯ
    // =================================================================

    function init() {
        loadProfileSettings();
        setupSettings();
        moveSettingsAfterInterface();
        setupTypeLabels();
        setupVoteColors();
        setupAllButtons();
        setupObservers();
        addLabelsToFullPoster();
        applyTheme(getSetting(THEME_KEY, DEFAULT_SETTINGS.theme));
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') init();
        });
    }
})();
