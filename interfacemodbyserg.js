(function () {
    'use strict';

    // =================================================================
    // КОНФИГУРАЦИЯ И НАСТРОЙКИ
    // =================================================================

    var PLUGIN_NAME = 'interface_mod_full';
    var PLUGIN_VERSION = '2.6.0';

    var SETTINGS_COMPONENT = 'interface_mod_full_settings';
    var ENABLED_KEY = 'interface_mod_full_enabled';
    var SHOW_TYPE_KEY = 'interface_mod_full_show_type';
    var SHOW_QUALITY_KEY = 'interface_mod_full_show_quality';
    var SHOW_STATUS_KEY = 'interface_mod_full_show_status';
    var SHOW_RATINGS_KEY = 'interface_mod_full_show_ratings';
    var SHOW_LAMPA_RATING_KEY = 'interface_mod_full_show_lampa_rating';
    var SHOW_AVERAGE_RATING_KEY = 'interface_mod_full_show_average_rating';
    var SHOW_SEASONS_KEY = 'interface_mod_full_show_seasons';
    var SEASONS_MODE_KEY = 'interface_mod_full_seasons_mode';
    var STATUS_POSITION_KEY = 'interface_mod_full_status_position';
    var SEASONS_POSITION_KEY = 'interface_mod_full_seasons_position';
    var SEASONS_COLOR_KEY = 'interface_mod_full_seasons_color';

    var DEFAULT_SETTINGS = {
        enabled: true,
        show_type: true,
        show_quality: true,
        show_status: true,
        show_ratings: true,
        show_lampa_rating: true,
        show_average_rating: false,
        show_seasons: true,
        seasons_mode: 'auto',
        status_position: 'under',
        seasons_position: 'bottom-right',
        seasons_color: '#e74c3c'
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
        setSetting(SHOW_TYPE_KEY, getProfileSetting(SHOW_TYPE_KEY, DEFAULT_SETTINGS.show_type));
        setSetting(SHOW_QUALITY_KEY, getProfileSetting(SHOW_QUALITY_KEY, DEFAULT_SETTINGS.show_quality));
        setSetting(SHOW_STATUS_KEY, getProfileSetting(SHOW_STATUS_KEY, DEFAULT_SETTINGS.show_status));
        setSetting(SHOW_RATINGS_KEY, getProfileSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings));
        setSetting(SHOW_LAMPA_RATING_KEY, getProfileSetting(SHOW_LAMPA_RATING_KEY, DEFAULT_SETTINGS.show_lampa_rating));
        setSetting(SHOW_AVERAGE_RATING_KEY, getProfileSetting(SHOW_AVERAGE_RATING_KEY, DEFAULT_SETTINGS.show_average_rating));
        setSetting(SHOW_SEASONS_KEY, getProfileSetting(SHOW_SEASONS_KEY, DEFAULT_SETTINGS.show_seasons));
        setSetting(SEASONS_MODE_KEY, getProfileSetting(SEASONS_MODE_KEY, DEFAULT_SETTINGS.seasons_mode));
        setSetting(STATUS_POSITION_KEY, getProfileSetting(STATUS_POSITION_KEY, DEFAULT_SETTINGS.status_position));
        setSetting(SEASONS_POSITION_KEY, getProfileSetting(SEASONS_POSITION_KEY, DEFAULT_SETTINGS.seasons_position));
        setSetting(SEASONS_COLOR_KEY, getProfileSetting(SEASONS_COLOR_KEY, DEFAULT_SETTINGS.seasons_color));
    }

    function isPluginEnabled() {
        return getSetting(ENABLED_KEY, DEFAULT_SETTINGS.enabled);
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

        /* Метка качества (рядом с типом, опущена на 0.2em) */
        .im-quality-label {
            position: absolute;
            top: 0.2em;
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

        /* Метка статуса сериала */
        .im-status-badge {
            position: absolute;
            padding: 0.2em 0.6em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            z-index: 10;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
        }
        .im-status-badge.status-position-under { top: 2.4em; left: 0.6em; }
        .im-status-badge.status-position-bottom-left { bottom: 0.8em; left: 0.8em; }
        
        .status-airing-full   { color: #4caf50; }      /* Сериал в эфире */
        .status-ended-full    { color: #9b59b6; }      /* Сериал полностью завершён */
        .status-season-ended  { color: #3498db; }      /* Только сезон завершён */
        .status-paused        { color: #ffc107; }
        .status-canceled      { color: #f44336; }

        /* Метка сезонов (настраиваемая позиция) */
        .im-seasons-badge {
            position: absolute;
            padding: 0.2em 0.6em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            z-index: 10;
            color: white;
            text-align: center;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .im-seasons-badge.seasons-position-top-right { top: 0.6em; right: 0.6em; }
        .im-seasons-badge.seasons-position-bottom-right { bottom: 3.3em; right: 0.6em; }

        /* Контейнер рейтингов */
        .im-ratings-container {
            position: absolute;
            display: flex;
            flex-direction: column;
            gap: 0.2em;
            z-index: 10;
            align-items: flex-end;
        }
        /* Позиция рейтингов при разных настройках сезонов */
        .im-ratings-container.ratings-position-top-right { top: 0.6em; right: 0.6em; }
        .im-ratings-container.ratings-position-bottom-right { bottom: 3.3em; right: 0.6em; }
        
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
        .im-rating-source { font-size: 0.65em; opacity: 0.8; margin-left: 0.2em; }

        /* Цвета рейтингов */
        .rating-high   { color: #4caf50; }
        .rating-medium { color: #2196f3; }
        .rating-low    { color: #ff9800; }
        .rating-very-low { color: #f44336; }

        /* Адаптация под мобильные устройства */
        @media (max-width: 768px) {
            .im-type-label { font-size: 0.65em; top: 0.4em; left: 0.4em; }
            .im-quality-label { font-size: 0.6em; top: 0.1em; left: 6.2em; }
            .im-status-badge { font-size: 0.6em; }
            .im-seasons-badge { font-size: 0.6em; }
            .im-seasons-badge.seasons-position-bottom-right { bottom: 2.8em; }
            .im-ratings-container.ratings-position-bottom-right { bottom: 2.8em; }
            .im-rating-item { font-size: 0.6em; padding: 0.15em 0.4em; }
        }
    `;
    document.head.appendChild(style);

    // =================================================================
    // УТИЛИТЫ
    // =================================================================

    function log(message, data) {
        if (false) console.log('[InterfaceMod] ' + message, data !== undefined ? data : '');
    }

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
    // КАЧЕСТВО ВИДЕО
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
            if (lower.indexOf(key) !== -1) {
                return QUALITY_MAP[key];
            }
        }
        return null;
    }

    function getQualityFromData(card) {
        return new Promise(function(resolve) {
            if (!card || !card.id) return resolve(null);

            var cacheKey = 'quality_' + card.id;
            if (qualityCache[cacheKey]) {
                return resolve(qualityCache[cacheKey]);
            }

            if (card.release_quality) {
                var q = detectQuality(card.release_quality);
                if (q) {
                    qualityCache[cacheKey] = q;
                    return resolve(q);
                }
            }

            if (card.title) {
                var q = detectQuality(card.title);
                if (q) {
                    qualityCache[cacheKey] = q;
                    return resolve(q);
                }
            }

            var year = getYearFromCard(card);
            var fallback = getQualityByYear(year);
            qualityCache[cacheKey] = fallback;
            resolve(fallback);
        });
    }

    function getYearFromCard(card) {
        var yearStr = card.release_date || card.first_air_date || '';
        var year = parseInt(yearStr.slice(0, 4));
        return isNaN(year) ? 0 : year;
    }

    function getQualityByYear(year) {
        if (year >= 2023) return '4K';
        if (year >= 2020) return 'FHD';
        if (year >= 2015) return 'HD';
        return 'SD';
    }

    // =================================================================
    // ЛАМПА РЕЙТИНГ (CUB)
    // =================================================================

    var lampaRatingCache = {};
    var reactionCoef = { fire: 10, nice: 7.5, think: 5, bore: 2.5, shit: 0 };
    var reactionIcons = { fire: '🔥', nice: '👍', think: '🤔', bore: '😴', shit: '💩' };

    function fetchLampaRating(ratingKey, isTV) {
        return new Promise(function(resolve) {
            if (lampaRatingCache[ratingKey]) {
                return resolve(lampaRatingCache[ratingKey]);
            }

            var url = 'https://cubnotrip.top/api/reactions/get/' + ratingKey;
            var request = new Lampa.Reguest();

            request.silent(url, function(data) {
                try {
                    if (data && data.result && Array.isArray(data.result)) {
                        var result = calculateLampaRating(data.result, isTV);
                        lampaRatingCache[ratingKey] = result;
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            }, function() {
                resolve(null);
            });
        });
    }

    function calculateLampaRating(reactions, isTV) {
        var sum = 0, cnt = 0;
        var reactionCnt = {};

        for (var i = 0; i < reactions.length; i++) {
            var coef = reactionCoef[reactions[i].type] || 0;
            var count = reactions[i].counter || 0;
            sum += count * coef;
            cnt += count;
            reactionCnt[reactions[i].type] = count;
        }

        if (cnt === 0) return null;

        var avg_rating = isTV ? 7.436 : 6.584;
        var m = isTV ? 69 : 274;
        var cub_rating = ((avg_rating * m + sum) / (m + cnt));
        var rating10 = cub_rating;

        var medianReaction = '';
        var medianIndex = Math.floor(cnt / 2);
        var reactionOrder = ['fire', 'nice', 'think', 'bore', 'shit'];
        var cumulativeCount = 0;

        for (var j = 0; j < reactionOrder.length; j++) {
            var type = reactionOrder[j];
            cumulativeCount += (reactionCnt[type] || 0);
            if (cumulativeCount >= medianIndex) {
                medianReaction = type;
                break;
            }
        }

        return {
            rating: parseFloat(rating10.toFixed(1)),
            medianReaction: medianReaction,
            icon: reactionIcons[medianReaction] || '⭐'
        };
    }

    // =================================================================
    // СТАТУС СЕРИАЛА (С УЧЁТОМ ЗАВЕРШЁННОСТИ СЕЗОНА)
    // =================================================================

    var seriesStatusCache = {};

    function fetchSeriesStatus(seriesId) {
        return new Promise(function(resolve) {
            if (seriesStatusCache[seriesId]) {
                return resolve(seriesStatusCache[seriesId]);
            }

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
                    seriesStatusCache[seriesId] = result;
                    resolve(result);
                } else {
                    resolve(null);
                }
            }, function() {
                resolve(null);
            });
        });
    }

    function getSeasonEndedInfo(seriesInfo) {
        if (!seriesInfo) return { isSeriesEnded: false, isSeasonEnded: false, currentSeasonNumber: 0 };
        
        var currentDate = new Date();
        var isSeriesEnded = (seriesInfo.status === 'Ended' || seriesInfo.status === 'Canceled');
        var isSeasonEnded = false;
        var currentSeasonNumber = 0;
        
        var seasons = seriesInfo.seasons || [];
        seasons.sort(function(a, b) { return a.season_number - b.season_number; });
        
        // Ищем текущий сезон (последний вышедший)
        for (var i = seasons.length - 1; i >= 0; i--) {
            var season = seasons[i];
            if (season.season_number === 0) continue;
            
            if (season.air_date) {
                var airDate = new Date(season.air_date);
                if (airDate <= currentDate) {
                    currentSeasonNumber = season.season_number;
                    // Проверяем, завершён ли текущий сезон
                    if (season.episode_count > 0 && season.episodes) {
                        var airedInSeason = 0;
                        for (var j = 0; j < season.episodes.length; j++) {
                            var ep = season.episodes[j];
                            if (ep.air_date) {
                                var epDate = new Date(ep.air_date);
                                if (epDate <= currentDate) airedInSeason++;
                            }
                        }
                        isSeasonEnded = (airedInSeason >= season.episode_count);
                    } else {
                        isSeasonEnded = true;
                    }
                    break;
                }
            }
        }
        
        return { isSeriesEnded: isSeriesEnded, isSeasonEnded: isSeasonEnded, currentSeasonNumber: currentSeasonNumber };
    }

    function getStatusTextAndColor(seriesInfo) {
        if (!seriesInfo) return { text: 'НЕИЗВЕСТНО', colorClass: 'status-paused' };
        
        var seasonInfo = getSeasonEndedInfo(seriesInfo);
        
        // Если сериал полностью завершён
        if (seasonInfo.isSeriesEnded) {
            return { text: 'ЗАВЕРШЁН', colorClass: 'status-ended-full' };
        }
        
        // Если текущий сезон завершён, а сериал продолжается
        if (seasonInfo.isSeasonEnded && seasonInfo.currentSeasonNumber > 0) {
            return { text: seasonInfo.currentSeasonNumber + ' СЕЗОН ЗАВЕРШЁН', colorClass: 'status-season-ended' };
        }
        
        // Если сериал в эфире
        if (seriesInfo.status === 'Returning Series') {
            return { text: 'В ЭФИРЕ', colorClass: 'status-airing-full' };
        }
        
        if (seriesInfo.status === 'In Production') {
            return { text: 'В ПРОИЗВОДСТВЕ', colorClass: 'status-airing-full' };
        }
        
        if (seriesInfo.status === 'Planned') {
            return { text: 'ЗАПЛАНИРОВАН', colorClass: 'status-paused' };
        }
        
        return { text: seriesInfo.status || 'НЕИЗВЕСТНО', colorClass: 'status-paused' };
    }

    // =================================================================
    // СЕЗОНЫ И СЕРИИ (АВТОМАТИЧЕСКИЙ РЕЖИМ)
    // =================================================================

    function getSeasonsInfoAuto(seriesInfo) {
        if (!seriesInfo) return { text: '' };
        
        var currentDate = new Date();
        var isSeriesEnded = (seriesInfo.status === 'Ended' || seriesInfo.status === 'Canceled');
        
        // Если сериал завершён — показываем полную информацию
        if (isSeriesEnded) {
            return getSeasonsInfoTotal(seriesInfo);
        }
        
        // Иначе — показываем актуальную информацию о текущем сезоне
        return getSeasonsInfoAired(seriesInfo);
    }
    
    function getSeasonsInfoTotal(seriesInfo) {
        var totalSeasons = seriesInfo.numberOfSeasons;
        var totalEpisodes = seriesInfo.numberOfEpisodes;
        
        function plural(num, one, two, five) {
            var n = Math.abs(num);
            n %= 100;
            if (n >= 5 && n <= 20) return five;
            n %= 10;
            if (n === 1) return one;
            if (n >= 2 && n <= 4) return two;
            return five;
        }
        
        var seasonsText = totalSeasons + ' ' + plural(totalSeasons, 'сезон', 'сезона', 'сезонов');
        var episodesText = totalEpisodes + ' ' + plural(totalEpisodes, 'серия', 'серии', 'серий');
        
        return { text: seasonsText + ' • ' + episodesText };
    }
    
    function getSeasonsInfoAired(seriesInfo) {
        var currentDate = new Date();
        var currentSeason = null;
        var currentSeasonNumber = 0;
        var airedEpisodesInCurrentSeason = 0;
        var totalEpisodesInCurrentSeason = 0;
        
        var seasons = seriesInfo.seasons || [];
        seasons.sort(function(a, b) { return a.season_number - b.season_number; });
        
        // Находим текущий сезон (последний вышедший)
        for (var i = seasons.length - 1; i >= 0; i--) {
            var season = seasons[i];
            if (season.season_number === 0) continue;
            
            if (season.air_date) {
                var airDate = new Date(season.air_date);
                if (airDate <= currentDate) {
                    currentSeason = season;
                    currentSeasonNumber = season.season_number;
                    totalEpisodesInCurrentSeason = season.episode_count || 0;
                    
                    // Подсчитываем вышедшие серии
                    if (season.episodes) {
                        airedEpisodesInCurrentSeason = 0;
                        for (var j = 0; j < season.episodes.length; j++) {
                            var ep = season.episodes[j];
                            if (ep.air_date) {
                                var epDate = new Date(ep.air_date);
                                if (epDate <= currentDate) {
                                    airedEpisodesInCurrentSeason++;
                                }
                            }
                        }
                    } else {
                        airedEpisodesInCurrentSeason = totalEpisodesInCurrentSeason;
                    }
                    break;
                }
            }
        }
        
        if (currentSeasonNumber === 0) {
            return getSeasonsInfoTotal(seriesInfo);
        }
        
        function pluralEpisode(num) {
            var n = Math.abs(num);
            if (n % 10 === 1 && n % 100 !== 11) return 'серия';
            if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'серии';
            return 'серий';
        }
        
        var seasonText = currentSeasonNumber + ' сезон';
        var episodesText = airedEpisodesInCurrentSeason + ' ' + pluralEpisode(airedEpisodesInCurrentSeason);
        
        if (totalEpisodesInCurrentSeason > 0 && airedEpisodesInCurrentSeason < totalEpisodesInCurrentSeason) {
            return { text: seasonText + ' • ' + episodesText + ' из ' + totalEpisodesInCurrentSeason };
        } else {
            return { text: seasonText + ' • ' + episodesText };
        }
    }

    function getSeasonsInfo(seriesInfo) {
        var mode = getSetting(SEASONS_MODE_KEY, DEFAULT_SETTINGS.seasons_mode);
        
        if (mode === 'total') {
            return getSeasonsInfoTotal(seriesInfo);
        } else if (mode === 'auto') {
            return getSeasonsInfoAuto(seriesInfo);
        } else {
            return getSeasonsInfoAired(seriesInfo);
        }
    }

    // =================================================================
    // ОСНОВНАЯ ФУНКЦИЯ ДОБАВЛЕНИЯ МЕТОК
    // =================================================================

    var processedCards = [];

    function addLabelsToCard(cardElement, movieData) {
        if (!isPluginEnabled()) return;
        if (processedCards.indexOf(cardElement) !== -1) return;

        var cardView = cardElement.querySelector('.card__view');
        if (!cardView) return;

        var data = movieData || cardElement.card_data || {};
        if (!data.id) return;

        var isTV = isTVSeries(data);
        if (cardView.style.position !== 'relative') cardView.style.position = 'relative';

        // Очищаем старые метки
        var oldLabels = cardView.querySelectorAll('.im-type-label, .im-quality-label, .im-status-badge, .im-seasons-badge, .im-ratings-container');
        for (var i = 0; i < oldLabels.length; i++) oldLabels[i].remove();

        // Скрываем стандартные метки
        var stdType = cardView.querySelector('.card__type');
        if (stdType) stdType.style.display = 'none';
        var stdVote = cardView.querySelector('.card__vote');
        if (stdVote) stdVote.style.display = 'none';

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
                if (quality && cardView.querySelector('.im-quality-label') === null) {
                    var qualityLabel = document.createElement('div');
                    var qualityClass = 'quality-' + quality.toLowerCase().replace(/[^a-z0-9]/g, '');
                    qualityLabel.className = 'im-quality-label ' + qualityClass;
                    qualityLabel.textContent = quality;
                    cardView.appendChild(qualityLabel);
                }
            });
        }

        // 3. Статус сериала (без эмодзи, настраиваемая позиция)
        if (isTV && getSetting(SHOW_STATUS_KEY, DEFAULT_SETTINGS.show_status)) {
            fetchSeriesStatus(data.id).then(function(seriesInfo) {
                if (seriesInfo && seriesInfo.status) {
                    var statusInfo = getStatusTextAndColor(seriesInfo);
                    var statusPosition = getSetting(STATUS_POSITION_KEY, DEFAULT_SETTINGS.status_position);
                    
                    var statusBadge = document.createElement('div');
                    statusBadge.className = 'im-status-badge ' + statusInfo.colorClass;
                    if (statusPosition === 'under') {
                        statusBadge.classList.add('status-position-under');
                    } else {
                        statusBadge.classList.add('status-position-bottom-left');
                    }
                    statusBadge.textContent = statusInfo.text;
                    
                    if (cardView.querySelector('.im-status-badge') === null) {
                        cardView.appendChild(statusBadge);
                    }
                }
            });
        }

        // 4. Метка сезонов
        if (isTV && getSetting(SHOW_SEASONS_KEY, DEFAULT_SETTINGS.show_seasons)) {
            fetchSeriesStatus(data.id).then(function(seriesInfo) {
                if (seriesInfo) {
                    var seasonsInfo = getSeasonsInfo(seriesInfo);
                    if (seasonsInfo.text) {
                        var seasonsPosition = getSetting(SEASONS_POSITION_KEY, DEFAULT_SETTINGS.seasons_position);
                        var seasonsColor = getSetting(SEASONS_COLOR_KEY, DEFAULT_SETTINGS.seasons_color);
                        
                        var seasonsBadge = document.createElement('div');
                        seasonsBadge.className = 'im-seasons-badge';
                        if (seasonsPosition === 'top-right') {
                            seasonsBadge.classList.add('seasons-position-top-right');
                        } else {
                            seasonsBadge.classList.add('seasons-position-bottom-right');
                        }
                        seasonsBadge.style.background = seasonsColor;
                        seasonsBadge.textContent = seasonsInfo.text;
                        
                        if (cardView.querySelector('.im-seasons-badge') === null) {
                            cardView.appendChild(seasonsBadge);
                        }
                    }
                }
            });
        }

        // 5. Контейнер рейтингов
        if (getSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings)) {
            var seasonsPosition = getSetting(SEASONS_POSITION_KEY, DEFAULT_SETTINGS.seasons_position);
            var ratingsContainer = document.createElement('div');
            ratingsContainer.className = 'im-ratings-container';
            
            // Устанавливаем позицию рейтингов в зависимости от позиции сезонов
            if (seasonsPosition === 'bottom-right') {
                ratingsContainer.classList.add('ratings-position-bottom-right');
            } else {
                ratingsContainer.classList.add('ratings-position-top-right');
            }

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

            // Lampa рейтинг
            if (getSetting(SHOW_LAMPA_RATING_KEY, DEFAULT_SETTINGS.show_lampa_rating)) {
                var ratingKey = (isTV ? 'tv_' : 'movie_') + data.id;
                fetchLampaRating(ratingKey, isTV).then(function(lampaData) {
                    if (lampaData && lampaData.rating > 0 && cardView.querySelector('.im-lampa-item') === null) {
                        var lampaRating = document.createElement('div');
                        lampaRating.className = 'im-rating-item';
                        lampaRating.innerHTML = '<span class="im-rating-value ' + getRatingColor(lampaData.rating) + '">' + (lampaData.icon || '⚡') + ' ' + formatRating(lampaData.rating) + '</span><span class="im-rating-source">Lampa</span>';
                        ratingsContainer.appendChild(lampaRating);
                    }
                });
            }

            // Общий рейтинг
            if (getSetting(SHOW_AVERAGE_RATING_KEY, DEFAULT_SETTINGS.show_average_rating)) {
                var tmdb = data.vote_average || 0;
                var imdb = data.imdb_rating || 0;
                var kp = data.kp_rating || 0;
                
                if (tmdb > 0 || imdb > 0 || kp > 0) {
                    var weights = { tmdb: 0.35, imdb: 0.30, kp: 0.35 };
                    var weightedSum = 0;
                    var totalWeight = 0;

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

        processedCards.push(cardElement);
    }

    // =================================================================
    // НАБЛЮДАТЕЛИ
    // =================================================================

    function processCard(card) {
        if (!card || !card.card_data) return;
        addLabelsToCard(card, card.card_data);
    }

    function setupObservers() {
        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var addedNodes = mutations[i].addedNodes;
                for (var j = 0; j < addedNodes.length; j++) {
                    var node = addedNodes[j];
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('card')) {
                            processCard(node);
                        }
                        var cards = node.querySelectorAll ? node.querySelectorAll('.card') : [];
                        for (var k = 0; k < cards.length; k++) {
                            processCard(cards[k]);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        var existingCards = document.querySelectorAll('.card');
        for (var i = 0; i < existingCards.length; i++) {
            processCard(existingCards[i]);
        }
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

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: ENABLED_KEY, type: 'trigger', default: DEFAULT_SETTINGS.enabled },
            field: { name: 'Включить плагин', description: 'Включить отображение всех меток' },
            onChange: function(value) {
                setProfileSetting(ENABLED_KEY, value);
                setSetting(ENABLED_KEY, value);
                if (value === false || value === 'false') {
                    document.querySelectorAll('.im-type-label, .im-quality-label, .im-status-badge, .im-seasons-badge, .im-ratings-container').forEach(function(el) { 
                        if (el && el.remove) el.remove(); 
                    });
                    processedCards.length = 0;
                } else {
                    processedCards.length = 0;
                    var cards = document.querySelectorAll('.card');
                    for (var i = 0; i < cards.length; i++) processCard(cards[i]);
                }
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
            field: { name: 'Метка "Фильм"/"Сериал"', description: 'Показывать тип контента в левом верхнем углу' },
            onChange: function(value) {
                setProfileSetting(SHOW_TYPE_KEY, value);
                setSetting(SHOW_TYPE_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_QUALITY_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_quality },
            field: { name: 'Метка качества', description: 'Показывать качество видео (4K/FHD/HD/SD/TS/CAM)' },
            onChange: function(value) {
                setProfileSetting(SHOW_QUALITY_KEY, value);
                setSetting(SHOW_QUALITY_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_STATUS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_status },
            field: { name: 'Статус сериала', description: 'Показывать статус (в эфире/завершён/сезон завершён)' },
            onChange: function(value) {
                setProfileSetting(SHOW_STATUS_KEY, value);
                setSetting(SHOW_STATUS_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: STATUS_POSITION_KEY, type: 'select', values: {
                'under': 'Под меткой "Сериал"',
                'bottom-left': 'Снизу слева'
            }, default: DEFAULT_SETTINGS.status_position },
            field: { name: 'Позиция статуса', description: 'Где отображать статус сериала' },
            onChange: function(value) {
                setProfileSetting(STATUS_POSITION_KEY, value);
                setSetting(STATUS_POSITION_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_SEASONS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_seasons },
            field: { name: 'Сезоны и серии', description: 'Показывать информацию о сезонах и сериях' },
            onChange: function(value) {
                setProfileSetting(SHOW_SEASONS_KEY, value);
                setSetting(SHOW_SEASONS_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SEASONS_MODE_KEY, type: 'select', values: {
                'auto': 'Автоматический (актуально для идущих, полное для завершённых)',
                'aired': 'Актуальная информация (текущий сезон)',
                'total': 'Полное количество'
            }, default: DEFAULT_SETTINGS.seasons_mode },
            field: { name: 'Режим отображения сезонов', description: 'Как отображать информацию о сезонах и сериях' },
            onChange: function(value) {
                setProfileSetting(SEASONS_MODE_KEY, value);
                setSetting(SEASONS_MODE_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SEASONS_POSITION_KEY, type: 'select', values: {
                'top-right': 'Сверху справа',
                'bottom-right': 'Снизу справа'
            }, default: DEFAULT_SETTINGS.seasons_position },
            field: { name: 'Позиция сезонов', description: 'Где отображать информацию о сезонах' },
            onChange: function(value) {
                setProfileSetting(SEASONS_POSITION_KEY, value);
                setSetting(SEASONS_POSITION_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SEASONS_COLOR_KEY, type: 'select', values: {
                '#e74c3c': 'Красный',
                '#3498db': 'Синий',
                '#2ecc71': 'Зелёный',
                '#f39c12': 'Оранжевый',
                '#9b59b6': 'Фиолетовый',
                '#1abc9c': 'Бирюзовый'
            }, default: DEFAULT_SETTINGS.seasons_color },
            field: { name: 'Цвет фона сезонов', description: 'Выберите цвет для метки сезонов' },
            onChange: function(value) {
                setProfileSetting(SEASONS_COLOR_KEY, value);
                setSetting(SEASONS_COLOR_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_RATINGS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_ratings },
            field: { name: 'Рейтинги (TMDB/IMDB/КП)', description: 'Показывать рейтинги' },
            onChange: function(value) {
                setProfileSetting(SHOW_RATINGS_KEY, value);
                setSetting(SHOW_RATINGS_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_LAMPA_RATING_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_lampa_rating },
            field: { name: 'Рейтинг Lampa (CUB)', description: 'Показывать рейтинг сообщества Lampa с эмодзи' },
            onChange: function(value) {
                setProfileSetting(SHOW_LAMPA_RATING_KEY, value);
                setSetting(SHOW_LAMPA_RATING_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: SHOW_AVERAGE_RATING_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_average_rating },
            field: { name: 'Общий рейтинг (средний)', description: 'Показывать средний рейтинг (TMDB + IMDB + КП). По умолчанию отключён' },
            onChange: function(value) {
                setProfileSetting(SHOW_AVERAGE_RATING_KEY, value);
                setSetting(SHOW_AVERAGE_RATING_KEY, value);
                processedCards.length = 0;
                var cards = document.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) processCard(cards[i]);
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
        setupObservers();
        log('Plugin initialized, version ' + PLUGIN_VERSION);
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') init();
        });
    }
})();
