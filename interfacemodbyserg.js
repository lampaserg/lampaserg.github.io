(function () {
    'use strict';

    // =================================================================
    // КОНФИГУРАЦИЯ И НАСТРОЙКИ
    // =================================================================

    var PLUGIN_NAME = 'interface_mod_full';
    var PLUGIN_VERSION = '2.3.0';

    var SETTINGS_COMPONENT = 'interface_mod_full_settings';
    var ENABLED_KEY = 'interface_mod_full_enabled';
    var SHOW_TYPE_KEY = 'interface_mod_full_show_type';
    var SHOW_QUALITY_KEY = 'interface_mod_full_show_quality';
    var SHOW_STATUS_KEY = 'interface_mod_full_show_status';
    var SHOW_RATINGS_KEY = 'interface_mod_full_show_ratings';
    var SHOW_LAMPA_RATING_KEY = 'interface_mod_full_show_lampa_rating';
    var BLUR_OPACITY_KEY = 'interface_mod_full_blur_opacity';
    var FONT_SCALE_KEY = 'interface_mod_full_font_scale';

    var DEFAULT_SETTINGS = {
        enabled: true,
        show_type: true,
        show_quality: true,
        show_status: true,
        show_ratings: true,
        show_lampa_rating: true,
        blur_opacity: 50,
        font_scale: 100
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
        setSetting(BLUR_OPACITY_KEY, getProfileSetting(BLUR_OPACITY_KEY, DEFAULT_SETTINGS.blur_opacity));
        setSetting(FONT_SCALE_KEY, getProfileSetting(FONT_SCALE_KEY, DEFAULT_SETTINGS.font_scale));
    }

    function isPluginEnabled() {
        return getSetting(ENABLED_KEY, DEFAULT_SETTINGS.enabled);
    }

    // =================================================================
    // CSS СТИЛИ (обновлённые)
    // =================================================================

    var style = document.createElement('style');
    style.id = 'interface_mod_full_styles';
    style.textContent = `
        /* Скрываем стандартные метки Lampa */
        .card__type, .card__vote, .card__quality {
            display: none !important;
        }

        /* Метка типа контента */
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

        /* Метка качества (сдвинута вправо, на одном уровне с типом) */
        .im-quality-label {
            position: absolute;
            top: 0.6em;
            left: 7.5em;
            padding: 0.2em 0.5em;
            border-radius: 0.3em;
            font-size: 0.7em;
            font-weight: bold;
            z-index: 10;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }
        .im-quality-label.quality-4k   { background: #ff9800; color: white; }
        .im-quality-label.quality-fhd  { background: #4caf50; color: white; }
        .im-quality-label.quality-hd   { background: #2196f3; color: white; }
        .im-quality-label.quality-sd   { background: #9e9e9e; color: white; }

        /* Контейнер рейтингов в правом верхнем углу */
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
            background: rgba(0, 0, 0, 0.65);
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

        /* Блок статуса сериала (стеклянный) */
        .im-status-block {
            position: absolute;
            bottom: 0.8em;
            left: 0.8em;
            right: 0.8em;
            padding: 0.5em 0.8em;
            border-radius: 0.5em;
            background: rgba(0, 0, 0, VAR_OPACITY);
            backdrop-filter: blur(10px);
            z-index: 10;
            display: flex;
            flex-direction: column;
            gap: 0.3em;
        }
        .im-status-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.5em;
        }
        .im-status-left {
            display: flex;
            align-items: center;
            gap: 0.5em;
            flex-wrap: wrap;
        }
        .im-status-right {
            display: flex;
            align-items: center;
        }
        .im-status-icon { font-size: 0.9em; margin-right: 0.3em; }
        .im-status-text { font-size: VAR_FONT_SIZE; font-weight: bold; }
        .im-seasons-text { font-size: VAR_FONT_SIZE; opacity: 0.9; }
        .im-rating-text { font-size: VAR_FONT_SIZE; font-weight: bold; }
        .im-lampa-rating {
            display: inline-flex;
            align-items: center;
            gap: 0.2em;
            background: rgba(0, 0, 0, 0.4);
            padding: 0.15em 0.4em;
            border-radius: 0.3em;
            font-size: VAR_FONT_SIZE;
            font-weight: bold;
        }
        .im-lampa-icon { font-size: 0.9em; }

        /* Статус сериала */
        .status-airing    { border-left: 3px solid #4caf50; }
        .status-ended     { border-left: 3px solid #2196f3; }
        .status-paused    { border-left: 3px solid #ffc107; }
        .status-canceled  { border-left: 3px solid #f44336; }

        /* Адаптация под мобильные устройства */
        @media (max-width: 768px) {
            .im-type-label { font-size: 0.65em; top: 0.4em; left: 0.4em; }
            .im-quality-label { font-size: 0.6em; top: 0.4em; left: 6.5em; }
            .im-rating-item { font-size: 0.6em; padding: 0.15em 0.4em; }
            .im-status-block { padding: 0.3em 0.5em; bottom: 0.5em; left: 0.5em; right: 0.5em; }
        }
    `;
    document.head.appendChild(style);

    // Функция обновления CSS переменных
    function updateCSSVariables() {
        var opacity = getSetting(BLUR_OPACITY_KEY, DEFAULT_SETTINGS.blur_opacity);
        var fontScale = getSetting(FONT_SCALE_KEY, DEFAULT_SETTINGS.font_scale);
        
        var opacityValue = Math.max(0, Math.min(100, opacity)) / 100;
        var fontSize = (0.75 * fontScale / 100).toFixed(2);
        
        style.textContent = style.textContent
            .replace(/VAR_OPACITY/g, opacityValue)
            .replace(/VAR_FONT_SIZE/g, fontSize + 'em');
    }

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
    // КАЧЕСТВО ИЗ NUMPARSER (ИСПРАВЛЕННОЕ)
    // =================================================================

    var qualityCache = {};

    // Чёрный список низкокачественных релизов
    var LOW_QUALITY_KEYWORDS = ['ts', 'telesync', 'camrip', 'cam', 'hdts', 'hc', 'screener', 'scr', 'dvdscr', 'r5', 'r6'];

    function isLowQuality(title) {
        if (!title) return false;
        var lower = title.toLowerCase();
        for (var i = 0; i < LOW_QUALITY_KEYWORDS.length; i++) {
            if (lower.indexOf(LOW_QUALITY_KEYWORDS[i]) !== -1) return true;
        }
        return false;
    }

    function getQualityFromNumparser(card) {
        return new Promise(function(resolve) {
            if (!card || !card.id) return resolve(null);

            var cacheKey = 'quality_' + card.id;
            if (qualityCache[cacheKey]) {
                return resolve(qualityCache[cacheKey]);
            }

            // Проверяем наличие release_quality в данных карточки
            if (card.release_quality) {
                // Проверка на низкое качество
                if (isLowQuality(card.release_quality)) {
                    qualityCache[cacheKey] = 'SD';
                    return resolve('SD');
                }
                var q = parseQualityString(card.release_quality);
                if (q) {
                    qualityCache[cacheKey] = q;
                    return resolve(q);
                }
            }

            // Проверяем название торрента на низкое качество
            if (card.title && isLowQuality(card.title)) {
                qualityCache[cacheKey] = 'SD';
                return resolve('SD');
            }

            // Фолбэк: определение по году
            var year = getYearFromCard(card);
            var fallback = getQualityByYear(year);
            qualityCache[cacheKey] = fallback;
            resolve(fallback);
        });
    }

    function parseQualityString(qualityStr) {
        if (!qualityStr || typeof qualityStr !== 'string') return null;

        // Сначала проверяем на низкое качество
        if (isLowQuality(qualityStr)) return 'SD';

        var q = qualityStr.toLowerCase();

        // 4K
        if (q.indexOf('2160p') !== -1 || q.indexOf('4k') !== -1 || q.indexOf('uhd') !== -1) {
            return '4K';
        }
        // 2K / QHD
        if (q.indexOf('1440p') !== -1 || q.indexOf('2k') !== -1 || q.indexOf('qhd') !== -1) {
            return 'FHD';
        }
        // 1080p / FHD
        if (q.indexOf('1080p') !== -1 || q.indexOf('fhd') !== -1 || q.indexOf('full hd') !== -1) {
            return 'FHD';
        }
        // 720p / HD
        if (q.indexOf('720p') !== -1 || q.indexOf('hd') !== -1) {
            return 'HD';
        }
        // SD / 480p
        if (q.indexOf('480p') !== -1 || q.indexOf('sd') !== -1) {
            return 'SD';
        }

        return null;
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
    // СТАТУС СЕРИАЛА И СЕЗОНЫ (ИСПРАВЛЕННЫЙ ФОРМАТ)
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

    function getStatusText(status) {
        var statusMap = {
            'Ended': { text: 'ЗАВЕРШЁН', icon: '🔵', class: 'status-ended' },
            'Canceled': { text: 'ОТМЕНЁН', icon: '🔴', class: 'status-canceled' },
            'Returning Series': { text: 'В ЭФИРЕ', icon: '🟢', class: 'status-airing' },
            'In Production': { text: 'В ПРОИЗВОДСТВЕ', icon: '🔵', class: 'status-airing' },
            'Planned': { text: 'ЗАПЛАНИРОВАН', icon: '🟡', class: 'status-paused' }
        };
        return statusMap[status] || { text: status || 'НЕИЗВЕСТНО', icon: '⚪', class: 'status-paused' };
    }

    function formatSeasonsText(seasonsInfo) {
        var totalSeasons = seasonsInfo.numberOfSeasons;
        var totalEpisodes = seasonsInfo.numberOfEpisodes;

        var airedSeasons = 0;
        var airedEpisodes = 0;
        var currentDate = new Date();

        if (seasonsInfo.seasons && seasonsInfo.seasons.length) {
            for (var i = 0; i < seasonsInfo.seasons.length; i++) {
                var season = seasonsInfo.seasons[i];
                if (season.season_number === 0) continue;

                if (season.air_date) {
                    var airDate = new Date(season.air_date);
                    if (airDate <= currentDate) {
                        airedSeasons++;
                        airedEpisodes += season.episode_count || 0;
                    }
                } else if (season.season_number <= airedSeasons + 1) {
                    airedSeasons++;
                }
            }
        }

        if (totalSeasons === 0) return '';

        var seasonsWord = getSeasonsWord(airedSeasons || totalSeasons);
        var episodesWord = getEpisodesWord(airedEpisodes || totalEpisodes);

        // Формат: "4 сезона • 32 серии из 48"
        if (totalEpisodes > 0 && airedEpisodes < totalEpisodes && airedEpisodes > 0) {
            return (airedSeasons || totalSeasons) + ' ' + seasonsWord + ' • ' +
                   (airedEpisodes) + ' ' + episodesWord + ' из ' + totalEpisodes;
        }

        return (airedSeasons || totalSeasons) + ' ' + seasonsWord + ' • ' +
               (airedEpisodes || totalEpisodes) + ' ' + episodesWord;
    }

    function getSeasonsWord(num) {
        var n = Math.abs(num) % 100;
        if (n >= 5 && n <= 20) return 'сезонов';
        n %= 10;
        if (n === 1) return 'сезон';
        if (n >= 2 && n <= 4) return 'сезона';
        return 'сезонов';
    }

    function getEpisodesWord(num) {
        var n = Math.abs(num) % 100;
        if (n >= 5 && n <= 20) return 'серий';
        n %= 10;
        if (n === 1) return 'серия';
        if (n >= 2 && n <= 4) return 'серии';
        return 'серий';
    }

    // =================================================================
    // ОСНОВНАЯ ФУНКЦИЯ ДОБАВЛЕНИЯ МЕТОК НА КАРТОЧКУ
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
        var position = cardView.style.position;
        if (position !== 'relative') cardView.style.position = 'relative';

        // Очищаем старые метки
        var oldLabels = cardView.querySelectorAll('.im-type-label, .im-quality-label, .im-ratings-container, .im-status-block');
        for (var i = 0; i < oldLabels.length; i++) oldLabels[i].remove();

        // Скрываем стандартные метки Lampa на этой карточке
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
            getQualityFromNumparser(data).then(function(quality) {
                if (quality && cardView.querySelector('.im-quality-label') === null) {
                    var qualityLabel = document.createElement('div');
                    qualityLabel.className = 'im-quality-label quality-' + quality.toLowerCase();
                    qualityLabel.textContent = quality;
                    cardView.appendChild(qualityLabel);
                }
            });
        }

        // 3. Контейнер рейтингов
        if (getSetting(SHOW_RATINGS_KEY, DEFAULT_SETTINGS.show_ratings)) {
            var ratingsContainer = document.createElement('div');
            ratingsContainer.className = 'im-ratings-container';

            if (data.vote_average && data.vote_average > 0) {
                var tmdbRating = document.createElement('div');
                tmdbRating.className = 'im-rating-item';
                tmdbRating.innerHTML = '<span class="im-rating-value ' + getRatingColor(data.vote_average) + '">★ ' + formatRating(data.vote_average) + '</span><span class="im-rating-source">TMDB</span>';
                ratingsContainer.appendChild(tmdbRating);
            }

            if (data.imdb_rating && data.imdb_rating > 0) {
                var imdbRating = document.createElement('div');
                imdbRating.className = 'im-rating-item';
                imdbRating.innerHTML = '<span class="im-rating-value ' + getRatingColor(data.imdb_rating) + '">★ ' + formatRating(data.imdb_rating) + '</span><span class="im-rating-source">IMDB</span>';
                ratingsContainer.appendChild(imdbRating);
            }

            if (data.kp_rating && data.kp_rating > 0) {
                var kpRating = document.createElement('div');
                kpRating.className = 'im-rating-item';
                kpRating.innerHTML = '<span class="im-rating-value ' + getRatingColor(data.kp_rating) + '">★ ' + formatRating(data.kp_rating) + '</span><span class="im-rating-source">КП</span>';
                ratingsContainer.appendChild(kpRating);
            }

            if (ratingsContainer.children.length > 0) {
                cardView.appendChild(ratingsContainer);
            }
        }

        // 4. Блок статуса (только для сериалов)
        if (isTV && getSetting(SHOW_STATUS_KEY, DEFAULT_SETTINGS.show_status)) {
            fetchSeriesStatus(data.id).then(function(seriesInfo) {
                if (!seriesInfo) return;
                if (cardView.querySelector('.im-status-block')) return;

                var statusBlock = document.createElement('div');
                statusBlock.className = 'im-status-block';

                var statusData = getStatusText(seriesInfo.status);
                var seasonsText = formatSeasonsText(seriesInfo);

                // Первая строка: статус слева, Lampa рейтинг справа
                var topRow = document.createElement('div');
                topRow.className = 'im-status-row';

                var leftPart = document.createElement('div');
                leftPart.className = 'im-status-left';
                leftPart.innerHTML = '<span class="im-status-icon">' + statusData.icon + '</span><span class="im-status-text">' + statusData.text + '</span>';
                topRow.appendChild(leftPart);

                // Lampa рейтинг справа
                if (getSetting(SHOW_LAMPA_RATING_KEY, DEFAULT_SETTINGS.show_lampa_rating)) {
                    var ratingKey = (isTV ? 'tv_' : 'movie_') + data.id;
                    fetchLampaRating(ratingKey, isTV).then(function(lampaData) {
                        if (lampaData && lampaData.rating > 0) {
                            var rightPart = document.createElement('div');
                            rightPart.className = 'im-status-right';
                            rightPart.innerHTML = '<span class="im-lampa-rating ' + getRatingColor(lampaData.rating) + '"><span class="im-lampa-icon">' + (lampaData.icon || '⚡') + '</span>' + lampaData.rating.toFixed(1) + ' Lampa</span>';
                            topRow.appendChild(rightPart);
                        }
                        statusBlock.appendChild(topRow);
                    });
                } else {
                    statusBlock.appendChild(topRow);
                }

                // Вторая строка: сезоны
                if (seasonsText) {
                    var seasonsRow = document.createElement('div');
                    seasonsRow.className = 'im-status-row';
                    seasonsRow.innerHTML = '<span class="im-seasons-text">📺 ' + seasonsText + '</span>';
                    statusBlock.appendChild(seasonsRow);
                }

                // Третья строка: рейтинг (просто "Рейтинг: 8.3")
                var tmdb = data.vote_average || 0;
                var imdb = data.imdb_rating || 0;
                var kp = data.kp_rating || 0;
                var hasAnyRating = tmdb > 0 || imdb > 0 || kp > 0;

                if (hasAnyRating) {
                    var weights = { tmdb: 0.35, imdb: 0.30, kp: 0.35 };
                    var weightedSum = 0;
                    var totalWeight = 0;

                    if (tmdb > 0) { weightedSum += tmdb * weights.tmdb; totalWeight += weights.tmdb; }
                    if (imdb > 0) { weightedSum += imdb * weights.imdb; totalWeight += weights.imdb; }
                    if (kp > 0) { weightedSum += kp * weights.kp; totalWeight += weights.kp; }

                    var avgRating = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : '0.0';
                    var avgColor = getRatingColor(avgRating);

                    var ratingRow = document.createElement('div');
                    ratingRow.className = 'im-status-row';
                    ratingRow.innerHTML = '<span class="im-rating-text ' + avgColor + '">Рейтинг: ' + avgRating + '</span>';
                    statusBlock.appendChild(ratingRow);
                }

                cardView.appendChild(statusBlock);
                processedCards.push(cardElement);
            });
        } else {
            processedCards.push(cardElement);
        }
    }

    // =================================================================
    // НАБЛЮДАТЕЛИ ЗА КАРТОЧКАМИ
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
    // НАСТРОЙКИ (обновлённые)
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
                    document.querySelectorAll('.im-type-label, .im-quality-label, .im-ratings-container, .im-status-block').forEach(function(el) { el.remove(); });
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
            field: { name: 'Метка качества', description: 'Показывать качество видео (4K/FHD/HD/SD)' },
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
            param: { name: SHOW_RATINGS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_ratings },
            field: { name: 'Рейтинги (TMDB/IMDB/КП)', description: 'Показывать рейтинги в правом верхнем углу' },
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
            param: { name: SHOW_STATUS_KEY, type: 'trigger', default: DEFAULT_SETTINGS.show_status },
            field: { name: 'Статус и сезоны сериала', description: 'Показывать статус (в эфире/завершён) и информацию о сезонах' },
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
            param: { type: 'title' },
            field: { name: 'Оформление' }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: BLUR_OPACITY_KEY, type: 'select', values: {
                '0': '0% (полностью прозрачный)',
                '20': '20%',
                '30': '30%',
                '40': '40%',
                '50': '50% (по умолчанию)',
                '60': '60%',
                '70': '70%',
                '80': '80%',
                '90': '90%',
                '100': '100% (непрозрачный)'
            }, default: DEFAULT_SETTINGS.blur_opacity },
            field: { name: 'Прозрачность фона', description: 'Прозрачность стеклянного блока со статусом' },
            onChange: function(value) {
                setProfileSetting(BLUR_OPACITY_KEY, parseInt(value));
                setSetting(BLUR_OPACITY_KEY, parseInt(value));
                updateCSSVariables();
            }
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: FONT_SCALE_KEY, type: 'select', values: {
                '60': '60%',
                '70': '70%',
                '80': '80%',
                '90': '90%',
                '100': '100% (по умолчанию)',
                '110': '110%',
                '120': '120%',
                '130': '130%',
                '140': '140%',
                '150': '150%'
            }, default: DEFAULT_SETTINGS.font_scale },
            field: { name: 'Размер шрифта', description: 'Масштаб текста в стеклянном блоке' },
            onChange: function(value) {
                setProfileSetting(FONT_SCALE_KEY, parseInt(value));
                setSetting(FONT_SCALE_KEY, parseInt(value));
                updateCSSVariables();
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
        updateCSSVariables();
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
