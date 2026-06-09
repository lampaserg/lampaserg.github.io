(function () {
    'use strict';

    // =================================================================
    // КОНФИГУРАЦИЯ И НАСТРОЙКИ
    // =================================================================

    var PLUGIN_NAME = 'interface_mod_full';
    var PLUGIN_VERSION = '2.4.0';

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

    var DEFAULT_SETTINGS = {
        enabled: true,
        show_type: true,
        show_quality: true,
        show_status: true,
        show_ratings: true,
        show_lampa_rating: true,
        show_average_rating: false,
        show_seasons: true,
        seasons_mode: 'aired'
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

        /* Метка качества (рядом с типом) */
        .im-quality-label {
            position: absolute;
            top: 0.6em;
            left: 6.6em;
            padding: 0.2em 0.5em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            z-index: 10;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }
        .im-quality-label.quality-4k     { background: #ff9800; color: white; }
        .im-quality-label.quality-fhd    { background: #4caf50; color: white; }
        .im-quality-label.quality-hd     { background: #2196f3; color: white; }
        .im-quality-label.quality-sd     { background: #9e9e9e; color: white; }
        .im-quality-label.quality-ts     { background: #9e9e9e; color: white; }
        .im-quality-label.quality-cam    { background: #9e9e9e; color: white; }
        .im-quality-label.quality-webdl  { background: #00bcd4; color: white; }
        .im-quality-label.quality-bdrip  { background: #9c27b0; color: white; }

        /* Метка статуса сериала (под меткой типа) */
        .im-status-badge {
            position: absolute;
            top: 2.4em;
            left: 0.6em;
            padding: 0.15em 0.5em;
            border-radius: 0.3em;
            font-size: 0.65em;
            font-weight: bold;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 0.2em;
        }
        .status-airing   { background: rgba(76, 175, 80, 0.9); color: white; }
        .status-ended    { background: rgba(33, 150, 243, 0.9); color: white; }
        .status-paused   { background: rgba(255, 193, 7, 0.9); color: black; }
        .status-canceled { background: rgba(244, 67, 54, 0.9); color: white; }

        /* Метка сезонов (правый верхний угол, красный фон) */
        .im-seasons-badge {
            position: absolute;
            top: 0.6em;
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

        /* Контейнер рейтингов (под сезонами, справа) */
        .im-ratings-container {
            position: absolute;
            top: 2.4em;
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
        .im-rating-source { font-size: 0.65em; opacity: 0.8; margin-left: 0.2em; }

        /* Цвета рейтингов */
        .rating-high   { color: #4caf50; }
        .rating-medium { color: #2196f3; }
        .rating-low    { color: #ff9800; }
        .rating-very-low { color: #f44336; }

        /* Адаптация под мобильные устройства */
        @media (max-width: 768px) {
            .im-type-label { font-size: 0.65em; top: 0.4em; left: 0.4em; }
            .im-quality-label { font-size: 0.6em; top: 0.4em; left: 6.0em; }
            .im-status-badge { font-size: 0.55em; top: 2.2em; left: 0.4em; }
            .im-seasons-badge { font-size: 0.6em; top: 0.4em; right: 0.4em; }
            .im-ratings-container { top: 2.2em; right: 0.4em; }
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
    // КАЧЕСТВО ВИДЕО (с определением TS, CAM, WEB-DL, BDRip)
    // =================================================================

    var qualityCache = {};

    var QUALITY_MAP = {
        '4k': '4K', '2160p': '4K', 'uhd': '4K',
        '1080p': 'FHD', 'fhd': 'FHD', 'full hd': 'FHD',
        '720p': 'HD', 'hd': 'HD',
        '480p': 'SD', 'sd': 'SD',
        'ts': 'TS', 'telesync': 'TS',
        'cam': 'CAM', 'camrip': 'CAM',
        'web-dl': 'WEB-DL', 'webdl': 'WEB-DL', 'webrip': 'WEB-DL',
        'bdrip': 'BDRip', 'brrip': 'BDRip', 'bluray': 'BDRip'
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

            // Проверяем release_quality
            if (card.release_quality) {
                var q = detectQuality(card.release_quality);
                if (q) {
                    qualityCache[cacheKey] = q;
                    return resolve(q);
                }
            }

            // Проверяем заголовок
            if (card.title) {
                var q = detectQuality(card.title);
                if (q) {
                    qualityCache[cacheKey] = q;
                    return resolve(q);
                }
            }

            // Фолбэк: по году
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
    // СТАТУС СЕРИАЛА
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

    function getStatusInfo(status) {
        var statusMap = {
            'Ended': { text: 'ЗАВЕРШЁН', icon: '🔵', class: 'status-ended' },
            'Canceled': { text: 'ОТМЕНЁН', icon: '🔴', class: 'status-canceled' },
            'Returning Series': { text: 'В ЭФИРЕ', icon: '🟢', class: 'status-airing' },
            'In Production': { text: 'В ПРОИЗВОДСТВЕ', icon: '🔵', class: 'status-airing' },
            'Planned': { text: 'ЗАПЛАНИРОВАН', icon: '🟡', class: 'status-paused' }
        };
        return statusMap[status] || { text: status || 'НЕИЗВЕСТНО', icon: '⚪', class: 'status-paused' };
    }

    // =================================================================
    // СЕЗОНЫ И СЕРИИ (как в interface_mod.js)
    // =================================================================

    function getSeasonsInfo(seriesInfo) {
        if (!seriesInfo) return { text: '', airedSeasons: 0, airedEpisodes: 0, totalSeasons: 0, totalEpisodes: 0 };

        var totalSeasons = seriesInfo.numberOfSeasons;
        var totalEpisodes = seriesInfo.numberOfEpisodes;
        var airedSeasons = 0;
        var airedEpisodes = 0;
        var currentDate = new Date();

        var seasons = seriesInfo.seasons || [];
        for (var i = 0; i < seasons.length; i++) {
            var season = seasons[i];
            if (season.season_number === 0) continue;

            if (season.air_date) {
                var airDate = new Date(season.air_date);
                if (airDate <= currentDate) {
                    airedSeasons++;
                    airedEpisodes += season.episode_count || 0;
                }
            }
        }

        if (airedSeasons === 0 && totalSeasons > 0) {
            airedSeasons = totalSeasons;
        }

        var seasonsText = '';
        var episodesText = '';

        function plural(num, one, two, five) {
            var n = Math.abs(num);
            n %= 100;
            if (n >= 5 && n <= 20) return five;
            n %= 10;
            if (n === 1) return one;
            if (n >= 2 && n <= 4) return two;
            return five;
        }

        var mode = getSetting(SEASONS_MODE_KEY, DEFAULT_SETTINGS.seasons_mode);
        
        if (mode === 'total') {
            // Полное количество
            seasonsText = totalSeasons + ' ' + plural(totalSeasons, 'сезон', 'сезона', 'сезонов');
            episodesText = totalEpisodes + ' ' + plural(totalEpisodes, 'серия', 'серии', 'серий');
        } else {
            // Актуальная информация (вышедшие)
            seasonsText = airedSeasons + ' ' + plural(airedSeasons, 'сезон', 'сезона', 'сезонов');
            if (totalEpisodes > 0 && airedEpisodes < totalEpisodes && airedEpisodes > 0) {
                episodesText = airedEpisodes + ' ' + plural(airedEpisodes, 'серия', 'серии', 'серий') + ' из ' + totalEpisodes;
            } else {
                episodesText = (airedEpisodes || totalEpisodes) + ' ' + plural(airedEpisodes || totalEpisodes, 'серия', 'серии', 'серий');
            }
        }

        return {
            text: seasonsText + ' • ' + episodesText,
            airedSeasons: airedSeasons,
            airedEpisodes: airedEpisodes,
            totalSeasons: totalSeasons,
            totalEpisodes: totalEpisodes
        };
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

        // 1. Метка типа контента (левый верхний угол)
        if (getSetting(SHOW_TYPE_KEY, DEFAULT_SETTINGS.show_type)) {
            var typeLabel = document.createElement('div');
            typeLabel.className = 'im-type-label ' + (isTV ? 'serial' : 'movie');
            typeLabel.textContent = isTV ? 'СЕРИАЛ' : 'ФИЛЬМ';
            cardView.appendChild(typeLabel);
        }

        // 2. Метка качества (рядом с типом)
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

        // 3. Статус сериала (под меткой типа, только для сериалов)
        if (isTV && getSetting(SHOW_STATUS_KEY, DEFAULT_SETTINGS.show_status)) {
            fetchSeriesStatus(data.id).then(function(seriesInfo) {
                if (seriesInfo && seriesInfo.status) {
                    var statusInfo = getStatusInfo(seriesInfo.status);
                    var statusBadge = document.createElement('div');
                    statusBadge.className = 'im-status-badge ' + statusInfo.class;
                    statusBadge.innerHTML = '<span>' + statusInfo.icon + '</span><span>' + statusInfo.text + '</span>';
                    if (cardView.querySelector('.im-status-badge') === null) {
                        cardView.appendChild(statusBadge);
                    }
                }
            });
        }

        // 4. Метка сезонов (правый верхний угол, красный фон)
        if (isTV && getSetting(SHOW_SEASONS_KEY, DEFAULT_SETTINGS.show_seasons)) {
            fetchSeriesStatus(data.id).then(function(seriesInfo) {
                if (seriesInfo) {
                    var seasonsInfo = getSeasonsInfo(seriesInfo);
                    if (seasonsInfo.text) {
                        var seasonsBadge = document.createElement('div');
                        seasonsBadge.className = 'im-seasons-badge';
                        seasonsBadge.textContent = seasonsInfo.text;
                        if (cardView.querySelector('.im-seasons-badge') === null) {
                            cardView.appendChild(seasonsBadge);
                        }
                    }
                }
            });
        }

        // 5. Контейнер рейтингов (под сезонами, справа)
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

            // Lampa рейтинг (CUB)
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

            // Общий (средний) рейтинг (отдельно, по умолчанию отключён)
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
                if (!value) {
                    document.querySelectorAll('.im-type-label, .im-quality-label, .im-status-badge, .im-seasons-badge, .im-ratings-container').forEach(function(el) { el.remove(); });
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
            field: { name: 'Метка качества', description: 'Показывать качество видео (4K/FHD/HD/SD/TS/CAM/WEB-DL/BDRip)' },
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
            field: { name: 'Статус сериала', description: 'Показывать статус (в эфире/завершён) под меткой типа' },
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
            param: { name: SHOW_SEASONS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_seasons },
            field: { name: 'Сезоны и серии', description: 'Показывать информацию о сезонах и сериях (красный фон, правый верхний угол)' },
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
                'aired': 'Актуальная информация (вышедшие)',
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
            param: { name: SHOW_RATINGS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_ratings },
            field: { name: 'Рейтинги (TMDB/IMDB/КП)', description: 'Показывать рейтинги в правой части' },
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
