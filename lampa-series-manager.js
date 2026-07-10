/* Series Manager PRO 3.2.0 — Совместимый с темой SERG */
(function () {
    'use strict';

    var VERSION = '3.2.0';
    var MEMORY_KEY = 'series_manager_pro_v3';
    var WIDGET_ID = 'series-manager-pro-widget';

    // =============================================
    // ПРОВЕРКА ЗАГРУЗКИ LAMPA
    // =============================================

    if (typeof Lampa === 'undefined') {
        console.warn('[Series Manager PRO] Lampa не найдена');
        return;
    }

    console.log('[Series Manager PRO] v' + VERSION + ' загружается...');

    // =============================================
    // КЛЮЧИ НАСТРОЕК
    // =============================================

    var DEFAULTS = {
        enabled: true,
        show_widget: true,
        auto_open_balancer: true
    };

    function getSettings() {
        try {
            var settings = Lampa.Storage.get('series_manager_pro_settings', {});
            return Object.assign({}, DEFAULTS, settings);
        } catch (e) {
            return DEFAULTS;
        }
    }

    function setSettings(settings) {
        try {
            Lampa.Storage.set('series_manager_pro_settings', settings);
        } catch (e) {}
    }

    // =============================================
    // ОПРЕДЕЛЕНИЕ ТЕКУЩЕЙ СТРАНИЦЫ
    // =============================================

    function isSeriesPage() {
        try {
            var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;
            if (!active) return false;
            if (active.component !== 'full') return false;
            
            var card = active.card || (active.object && active.object.card) || null;
            if (!card) return false;
            
            return !!(card.name || card.original_name || card.first_air_date || card.number_of_seasons);
        } catch (e) {
            return false;
        }
    }

    function getCurrentCard() {
        try {
            var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;
            if (!active) return null;
            return active.card || (active.object && active.object.card) || null;
        } catch (e) {
            return null;
        }
    }

    function getCurrentData() {
        try {
            var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;
            if (!active) return null;
            return active.data || null;
        } catch (e) {
            return null;
        }
    }

    // =============================================
    // УТИЛИТЫ
    // =============================================

    function numberValue(value, fallback) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : (fallback !== undefined ? fallback : 0);
    }

    function mediaType(card) {
        if (!card) return 'movie';
        var type = String(card.media_type || card.mediaType || card.method || '').toLowerCase();
        if (type === 'tv' || type === 'series' || type === 'show') return 'tv';
        if (type === 'movie') return 'movie';
        return card.name || card.original_name || card.first_air_date || card.number_of_seasons ? 'tv' : 'movie';
    }

    function contentId(card) {
        if (!card) return '';
        var source = String(card.source || 'tmdb');
        var id = card.id !== undefined && card.id !== null ? String(card.id) : '';
        if (id) return mediaType(card) + ':' + source + ':' + id;
        return mediaType(card) + ':title:' + String(card.title || card.name || card.original_title || card.original_name || '').toLowerCase();
    }

    function episodeCoordinates(episode) {
        if (!episode || typeof episode !== 'object') return null;
        var season = episode.season_number !== undefined ? episode.season_number : episode.season;
        var number = episode.episode_number !== undefined ? episode.episode_number : episode.episode;
        season = Number(season);
        number = Number(number);
        if (!isFinite(season) || !isFinite(number) || season < 0 || number < 1) return null;
        return { season: season, episode: number };
    }

    function padEpisodeNumber(value) {
        var text = String(value);
        return text.length < 2 ? '0' + text : text;
    }

    function formatEpisodeTitle(episode) {
        var coordinates = episodeCoordinates(episode);
        if (!coordinates) return '';
        var label = 'S' + padEpisodeNumber(coordinates.season) + ' E' + padEpisodeNumber(coordinates.episode);
        var name = episode && episode.name ? String(episode.name) : '';
        return name ? label + ' · ' + name : label;
    }

    function formatRemainingTime(timeline) {
        if (!timeline || !timeline.duration || timeline.duration <= timeline.time) return '';
        var seconds = Math.max(0, timeline.duration - timeline.time);
        var minutes = Math.max(1, Math.round(seconds / 60));
        if (minutes < 60) return 'осталось ' + minutes + ' мин';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return 'осталось ' + hours + ' ч' + (rest ? ' ' + rest + ' мин' : '');
    }

    function episodeAirTimestamp(episode) {
        if (!episode || !episode.air_date) return 0;
        var parsed = new Date(String(episode.air_date).replace(/-/g, '/')).getTime();
        return isFinite(parsed) ? parsed : 0;
    }

    function episodeIsAvailable(episode) {
        if (!episode || episode.comeing) return false;
        var timestamp = episodeAirTimestamp(episode);
        return !timestamp || timestamp <= (Date.now ? Date.now() : new Date().getTime());
    }

    // =============================================
    // ПАМЯТЬ СЕРИЙ
    // =============================================

    function getMemoryStore() {
        try {
            var raw = window.sessionStorage && window.sessionStorage.getItem(MEMORY_KEY);
            var parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function writeMemoryStore(store) {
        try {
            if (window.sessionStorage) {
                window.sessionStorage.setItem(MEMORY_KEY, JSON.stringify(store || {}));
            }
        } catch (error) {}
    }

    function readSavedEpisode(card) {
        var key = contentId(card);
        if (!key) return null;
        var store = getMemoryStore();
        var value = store[key];
        return value && typeof value === 'object' ? value : null;
    }

    function saveEpisode(card, episode, reason) {
        var coords = episodeCoordinates(episode);
        var key = contentId(card);
        if (!key || !coords) return false;
        var store = getMemoryStore();
        store[key] = {
            season: coords.season,
            episode: coords.episode,
            updatedAt: Date.now ? Date.now() : new Date().getTime()
        };
        var keys = Object.keys(store);
        if (keys.length > 80) {
            keys.sort(function (a, b) {
                return (store[a] && store[a].updatedAt || 0) - (store[b] && store[b].updatedAt || 0);
            });
            keys.slice(0, keys.length - 80).forEach(function (oldKey) { delete store[oldKey]; });
        }
        writeMemoryStore(store);
        return true;
    }

    // =============================================
    // СБОР ЭПИЗОДОВ
    // =============================================

    function collectEpisodes(value, result, depth) {
        if (depth > 5 || value === null || value === undefined) return;
        if (Array.isArray(value)) {
            value.forEach(function (item) { collectEpisodes(item, result, depth + 1); });
            return;
        }
        if (typeof value !== 'object') return;
        if (episodeCoordinates(value)) {
            result.push(value);
            return;
        }
        ['episodes_original', 'episodes', 'results', 'items'].forEach(function (key) {
            if (value[key] !== undefined) collectEpisodes(value[key], result, depth + 1);
        });
    }

    function seriesEpisodesFromData(data) {
        var collected = [];
        collectEpisodes(data && data.episodes, collected, 0);
        var unique = {};
        return collected.filter(function (episode) {
            var coordinates = episodeCoordinates(episode);
            if (!coordinates) return false;
            var key = coordinates.season + ':' + coordinates.episode;
            if (unique[key]) return false;
            unique[key] = true;
            return true;
        }).sort(function (left, right) {
            var a = episodeCoordinates(left);
            var b = episodeCoordinates(right);
            return a.season === b.season ? a.episode - b.episode : a.season - b.season;
        });
    }

    function episodeTimeline(card, episode) {
        var coordinates = episodeCoordinates(episode);
        var road = { percent: 0, time: 0, duration: 0 };
        if (!coordinates) return road;
        try {
            if (window.Lampa && Lampa.Timeline && typeof Lampa.Timeline.watchedEpisode === 'function') {
                var current = Lampa.Timeline.watchedEpisode(card, coordinates.season, coordinates.episode, true);
                if (current && typeof current === 'object') {
                    road.percent = numberValue(current.percent, 0);
                    road.time = numberValue(current.time, 0);
                    road.duration = numberValue(current.duration, 0);
                    return road;
                }
            }
        } catch (error) {}
        var embedded = episode.timeline || episode.view || null;
        if (embedded && typeof embedded === 'object') {
            road.percent = numberValue(embedded.percent, 0);
            road.time = numberValue(embedded.time, 0);
            road.duration = numberValue(embedded.duration, 0);
        }
        return road;
    }

    // =============================================
    // ОПРЕДЕЛЕНИЕ ПОСЛЕДНЕЙ СЕРИИ
    // =============================================

    function findLastWatchedEpisode(card, data) {
        if (!card) return null;

        var episodes = seriesEpisodesFromData(data || {});
        var available = episodes.filter(episodeIsAvailable);
        
        if (!available.length) return null;

        var entries = available.map(function (episode) {
            return {
                episode: episode,
                timeline: episodeTimeline(card, episode),
                coords: episodeCoordinates(episode)
            };
        }).filter(function (entry) {
            return entry.coords !== null;
        });

        if (!entries.length) return null;

        entries.sort(function (a, b) {
            if (a.coords.season !== b.coords.season) return a.coords.season - b.coords.season;
            return a.coords.episode - b.coords.episode;
        });

        var saved = readSavedEpisode(card);
        if (saved) {
            var savedEntry = entries.find(function (entry) {
                return entry.coords.season === saved.season && entry.coords.episode === saved.episode;
            });
            if (savedEntry) {
                if (savedEntry.timeline.percent >= 89) {
                    var nextIndex = entries.indexOf(savedEntry) + 1;
                    if (nextIndex < entries.length) {
                        return entries[nextIndex];
                    }
                    return savedEntry;
                }
                return savedEntry;
            }
        }

        var inProgress = entries.filter(function (entry) {
            return entry.timeline.percent > 0 && entry.timeline.percent < 89;
        });

        if (inProgress.length) {
            return inProgress[inProgress.length - 1];
        }

        var watched = entries.filter(function (entry) {
            return entry.timeline.percent >= 89;
        });

        if (watched.length) {
            var lastWatched = watched[watched.length - 1];
            var nextAfterLast = entries.indexOf(lastWatched) + 1;
            if (nextAfterLast < entries.length) {
                return entries[nextAfterLast];
            }
            return lastWatched;
        }

        return entries[0];
    }

    // =============================================
    // ОТКРЫТИЕ БАЛАНСЕРА LAMPAC
    // =============================================

    function openLampacBalancer(card, season, episode) {
        try {
            if (!card) return false;

            var settings = getSettings();
            if (!settings.auto_open_balancer) return false;

            var LampacComponent = Lampa.Component.get('lampac');
            if (!LampacComponent) {
                console.warn('[Series Manager PRO] Компонент Lampac не найден');
                return false;
            }

            var movie = Lampa.Arrays.clone(card);
            if (season !== undefined && episode !== undefined) {
                movie.season = season;
                movie.episode = episode;
            }

            var id = Lampa.Utils.hash(card.number_of_seasons ? card.original_name : card.original_title);
            var all = Lampa.Storage.get('clarification_search', '{}');
            var searchQuery = all[id] || card.title || card.name || '';

            Lampa.Activity.push({
                url: '',
                title: 'Lampac - ' + (card.title || card.name || ''),
                component: 'lampac',
                search: searchQuery,
                search_one: card.title || card.name || '',
                search_two: card.original_title || card.original_name || '',
                movie: movie,
                page: 1,
                clarification: all[id] ? true : false
            });

            return true;

        } catch (error) {
            console.error('[Series Manager PRO] Ошибка открытия Lampac:', error);
            return false;
        }
    }

    // =============================================
    // ВИДЖЕТ (справа снизу, совместимый с темой SERG)
    // =============================================

    function createWidget(entry, card) {
        if (!entry || !entry.episode) return null;

        var settings = getSettings();
        if (!settings.show_widget) return null;

        var coords = entry.coords;
        var title = formatEpisodeTitle(entry.episode);
        var progress = Math.round(entry.timeline.percent || 0);
        var remaining = formatRemainingTime(entry.timeline);

        var seriesTitle = card.title || card.name || card.original_title || card.original_name || '';

        var statusText = '';
        var statusIcon = '';
        if (progress >= 89) {
            statusText = 'Просмотрено';
            statusIcon = '✓';
        } else if (progress > 0 && progress < 89) {
            statusText = 'Продолжить';
            statusIcon = '▶';
        } else {
            statusText = 'Смотреть';
            statusIcon = '▶';
        }

        // Удаляем старый виджет
        var oldWidget = document.getElementById(WIDGET_ID);
        if (oldWidget) oldWidget.remove();

        var widget = document.createElement('div');
        widget.id = WIDGET_ID;
        widget.className = 'series-widget';
        widget.setAttribute('data-progress', progress);

        // Стили виджета — справа снизу
        var style = document.createElement('style');
        style.id = 'series-widget-styles';
        style.textContent = `
            .series-widget {
                position: fixed !important;
                bottom: 2.5em !important;
                right: 2.5em !important;
                z-index: 9999 !important;
                max-width: 420px !important;
                min-width: 280px !important;
                padding: 0.8em 1.2em !important;
                border-radius: 0.9em !important;
                background: rgba(7, 10, 16, 0.95) !important;
                backdrop-filter: blur(24px) !important;
                -webkit-backdrop-filter: blur(24px) !important;
                border: 0.1em solid rgba(105, 167, 255, 0.2) !important;
                box-shadow: 0 1.5em 4em rgba(0, 0, 0, 0.85) !important;
                color: #f6f8fc !important;
                font-family: "SegoeUI", system-ui, -apple-system, sans-serif !important;
                transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease !important;
                cursor: pointer !important;
                user-select: none !important;
                animation: series-widget-in 0.4s cubic-bezier(0.22, 0.72, 0.2, 1) !important;
                line-height: 1.5 !important;
                pointer-events: auto !important;
                font-size: 14px !important;
            }
            .series-widget:hover {
                transform: scale(1.03) !important;
                border-color: rgba(105, 167, 255, 0.45) !important;
                box-shadow: 0 1.8em 5em rgba(0, 0, 0, 0.9) !important;
            }
            .series-widget .sw-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                margin-bottom: 0.2em !important;
            }
            .series-widget .sw-title {
                font-size: 1em !important;
                font-weight: 700 !important;
                color: #fff !important;
                line-height: 1.3 !important;
                margin-bottom: 0.1em !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .series-widget .sw-series-name {
                font-size: 0.7em !important;
                color: rgba(255, 255, 255, 0.35) !important;
                margin-bottom: 0.1em !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .series-widget .sw-status {
                font-size: 0.6em !important;
                padding: 0.15em 0.6em !important;
                border-radius: 99em !important;
                background: rgba(105, 167, 255, 0.12) !important;
                color: #69a7ff !important;
                font-weight: 700 !important;
                letter-spacing: 0.05em !important;
                white-space: nowrap !important;
            }
            .series-widget[data-progress="100"] .sw-status {
                background: rgba(46, 204, 113, 0.12) !important;
                color: #2ecc71 !important;
            }
            .series-widget .sw-meta {
                font-size: 0.75em !important;
                color: rgba(255, 255, 255, 0.45) !important;
                display: flex !important;
                align-items: center !important;
                gap: 0.5em !important;
                flex-wrap: wrap !important;
                margin-bottom: 0.1em !important;
            }
            .series-widget .sw-progress-wrap {
                width: 100% !important;
                height: 0.25em !important;
                border-radius: 99em !important;
                background: rgba(255, 255, 255, 0.06) !important;
                margin: 0.35em 0 0.15em !important;
                overflow: hidden !important;
            }
            .series-widget .sw-progress-bar {
                height: 100% !important;
                border-radius: inherit !important;
                background: linear-gradient(90deg, #69a7ff, #91beff) !important;
                transition: width 0.5s ease !important;
            }
            .series-widget .sw-remaining {
                font-size: 0.7em !important;
                color: rgba(255, 255, 255, 0.25) !important;
                margin-left: auto !important;
                white-space: nowrap !important;
            }
            .series-widget .sw-click-hint {
                font-size: 0.55em !important;
                color: rgba(255, 255, 255, 0.1) !important;
                text-align: right !important;
                margin-top: 0.1em !important;
                letter-spacing: 0.05em !important;
                border-top: 0.05em solid rgba(255, 255, 255, 0.04) !important;
                padding-top: 0.15em !important;
            }
            @keyframes series-widget-in {
                0% { opacity: 0; transform: translateY(30px) scale(0.92); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @media (max-width: 720px) {
                .series-widget {
                    bottom: 1.5em !important;
                    right: 1.5em !important;
                    left: 1.5em !important;
                    max-width: none !important;
                    min-width: auto !important;
                    padding: 0.6em 1em !important;
                    border-radius: 0.8em !important;
                    font-size: 12px !important;
                }
                .series-widget .sw-title {
                    font-size: 0.9em !important;
                }
                .series-widget .sw-meta {
                    font-size: 0.7em !important;
                }
            }
        `;
        document.head.appendChild(style);

        // Сборка виджета
        var header = document.createElement('div');
        header.className = 'sw-header';

        var statusEl = document.createElement('span');
        statusEl.className = 'sw-status';
        statusEl.textContent = statusIcon + ' ' + statusText;
        header.appendChild(statusEl);

        var seriesName = document.createElement('div');
        seriesName.className = 'sw-series-name';
        seriesName.textContent = seriesTitle || 'Сериал';

        var titleEl = document.createElement('div');
        titleEl.className = 'sw-title';
        titleEl.textContent = title;

        var meta = document.createElement('div');
        meta.className = 'sw-meta';

        if (coords) {
            var seasonText = document.createElement('span');
            seasonText.textContent = 'Сезон ' + coords.season + ' · Эпизод ' + coords.episode;
            meta.appendChild(seasonText);
        }

        if (progress > 0 && progress < 100) {
            var progressText = document.createElement('span');
            progressText.textContent = progress + '%';
            meta.appendChild(progressText);
        }

        if (remaining) {
            var remainingEl = document.createElement('span');
            remainingEl.className = 'sw-remaining';
            remainingEl.textContent = '⏱ ' + remaining;
            meta.appendChild(remainingEl);
        }

        var progressWrap = document.createElement('div');
        progressWrap.className = 'sw-progress-wrap';
        var progressBar = document.createElement('div');
        progressBar.className = 'sw-progress-bar';
        progressBar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        progressWrap.appendChild(progressBar);

        var hint = document.createElement('div');
        hint.className = 'sw-click-hint';
        hint.textContent = '↗ Открыть в Lampac';

        widget.appendChild(header);
        widget.appendChild(seriesName);
        widget.appendChild(titleEl);
        widget.appendChild(meta);
        widget.appendChild(progressWrap);
        widget.appendChild(hint);

        // Клик — открываем Lampac Balancer
        widget.addEventListener('click', function (e) {
            e.stopPropagation();
            if (coords) {
                saveEpisode(card, entry.episode, 'widget-click');
                openLampacBalancer(card, coords.season, coords.episode);
            }
        });

        return widget;
    }

    // =============================================
    // УПРАВЛЕНИЕ ВИДЖЕТОМ
    // =============================================

    var currentEntry = null;
    var lastCardId = null;
    var updateTimer = null;

    function removeWidget() {
        var widget = document.getElementById(WIDGET_ID);
        if (widget && widget.parentNode) {
            widget.parentNode.removeChild(widget);
        }
        var widgets = document.querySelectorAll('.series-widget');
        if (widgets.length === 0) {
            var style = document.getElementById('series-widget-styles');
            if (style) style.remove();
        }
    }

    function updateWidget() {
        // Проверяем, что мы на странице сериала
        if (!isSeriesPage()) {
            removeWidget();
            return;
        }

        var settings = getSettings();
        if (!settings.enabled || !settings.show_widget) {
            removeWidget();
            return;
        }

        var card = getCurrentCard();
        if (!card || mediaType(card) !== 'tv') {
            removeWidget();
            return;
        }

        var cardId = contentId(card);
        if (lastCardId !== cardId) {
            removeWidget();
            lastCardId = cardId;
        }

        var data = getCurrentData();
        var entry = findLastWatchedEpisode(card, data || {});

        if (!entry) {
            removeWidget();
            return;
        }

        var currentKey = entry.coords.season + ':' + entry.coords.episode + ':' + Math.round(entry.timeline.percent);
        var oldKey = currentEntry ? 
            currentEntry.coords.season + ':' + currentEntry.coords.episode + ':' + Math.round(currentEntry.timeline.percent) : 
            '';

        if (currentKey !== oldKey || !document.getElementById(WIDGET_ID)) {
            currentEntry = entry;
            var widget = createWidget(entry, card);
            if (widget) {
                removeWidget();
                document.body.appendChild(widget);
            }
        }
    }

    // =============================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // =============================================

    function onFull(event) {
        if (!event) return;
        
        if (event.type === 'complite' || event.type === 'start' || event.type === 'build') {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(function () {
                updateWidget();
            }, 300);
        }
    }

    function onTimeline() {
        if (isSeriesPage()) {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(function () {
                updateWidget();
            }, 200);
        }
    }

    function onActivity(event) {
        if (!event || event.type !== 'start') return;

        if (event.component === 'full') {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(function () {
                updateWidget();
            }, 400);
        } else {
            removeWidget();
            currentEntry = null;
            lastCardId = null;
        }
    }

    // =============================================
    // ЗАПУСК
    // =============================================

    function start() {
        try {
            if (!Lampa || !Lampa.Listener) {
                setTimeout(start, 200);
                return;
            }

            console.log('[Series Manager PRO] v' + VERSION + ' запущен');

            Lampa.Listener.follow('full', onFull);
            Lampa.Listener.follow('timeline', onTimeline);
            Lampa.Listener.follow('activity', onActivity);

            setTimeout(function () {
                if (isSeriesPage()) {
                    updateWidget();
                }
            }, 800);

        } catch (e) {
            console.error('[Series Manager PRO] Ошибка:', e);
        }
    }

    // =============================================
    // НАСТРОЙКИ
    // =============================================

    function addSettings() {
        try {
            if (!Lampa.SettingsApi) return;

            Lampa.SettingsApi.addComponent({
                component: 'series_manager_pro',
                name: 'Series Manager PRO',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M8 7v10l7-5-7-5z"/></svg>'
            });

            Lampa.SettingsApi.addParam({
                component: 'series_manager_pro',
                param: {
                    name: 'series_manager_pro_enabled',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Включить Series Manager PRO'
                },
                onChange: function(value) {
                    var settings = getSettings();
                    settings.enabled = value === 'true' || value === true;
                    setSettings(settings);
                    if (!settings.enabled) {
                        removeWidget();
                    } else {
                        updateWidget();
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'series_manager_pro',
                param: {
                    name: 'series_manager_pro_widget',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Показывать виджет'
                },
                onChange: function(value) {
                    var settings = getSettings();
                    settings.show_widget = value === 'true' || value === true;
                    setSettings(settings);
                    if (!settings.show_widget) {
                        removeWidget();
                    } else {
                        updateWidget();
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'series_manager_pro',
                param: {
                    name: 'series_manager_pro_balancer',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Автоматически открывать Lampac Balancer'
                },
                onChange: function(value) {
                    var settings = getSettings();
                    settings.auto_open_balancer = value === 'true' || value === true;
                    setSettings(settings);
                }
            });

        } catch (e) {
            console.warn('[Series Manager PRO] Ошибка добавления настроек:', e);
        }
    }

    // =============================================
    // API
    // =============================================

    window.__SERIES_MANAGER_PRO__ = {
        version: VERSION,
        update: updateWidget,
        remove: removeWidget,
        openLampac: openLampacBalancer,
        findLastWatched: findLastWatchedEpisode,
        isSeriesPage: isSeriesPage,
        getState: function () {
            return {
                version: VERSION,
                hasWidget: !!document.getElementById(WIDGET_ID),
                isSeriesPage: isSeriesPage(),
                currentEntry: currentEntry,
                settings: getSettings()
            };
        }
    };

    // =============================================
    // СТАРТ
    // =============================================

    addSettings();

    if (document.readyState === 'complete') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }

})();
