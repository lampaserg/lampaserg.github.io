/* Lampa Series Manager 1.0.0 — Компактный виджет сериалов */
(function () {
    'use strict';

    var VERSION = '1.0.0';
    var PLUGIN_ID = 'lampa_series_manager';
    var RUNTIME_KEY = '__LSM_RUNTIME__';
    var MEMORY_KEY = 'lsm_episode_memory_v1';

    // Уничтожаем старый инстанс
    var previous = window[RUNTIME_KEY];
    if (previous && typeof previous.destroy === 'function') {
        try { previous.destroy('replace'); } catch (error) {}
    }

    // =============================================
    // 1. Утилиты
    // =============================================

    function storageGet(name, fallback) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') {
                return Lampa.Storage.get(name, fallback);
            }
        } catch (error) {
            console.warn('[Series Manager] Storage.get failed:', name, error);
        }
        return fallback;
    }

    function storageSet(name, value) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.set === 'function') {
                Lampa.Storage.set(name, value, true);
                return true;
            }
        } catch (error) {
            console.warn('[Series Manager] Storage.set failed:', name, error);
        }
        return false;
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function numberValue(value, fallback) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : (fallback !== undefined ? fallback : 0);
    }

    function clone(value) {
        try { return JSON.parse(JSON.stringify(value)); }
        catch (error) { return value; }
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
        if (minutes < 60) return minutes + ' мин';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return hours + ' ч' + (rest ? ' ' + rest + ' мин' : '');
    }

    function activeActivity() {
        try {
            var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;
            return active || null;
        } catch (error) {
            return null;
        }
    }

    function activeActivityRoot() {
        var active = document.querySelector('.activity--active');
        if (active) return active;
        var activity = activeActivity();
        if (activity && activity.activity && activity.activity.render) {
            try {
                var rendered = activity.activity.render(true);
                if (rendered && rendered.nodeType === 1) return rendered;
            } catch (error) {}
        }
        return null;
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
        } catch (error) {
            console.warn('[Series Manager] Timeline error:', error);
        }
        var embedded = episode.timeline || episode.view || null;
        if (embedded && typeof embedded === 'object') {
            road.percent = numberValue(embedded.percent, 0);
            road.time = numberValue(embedded.time, 0);
            road.duration = numberValue(embedded.duration, 0);
        }
        return road;
    }

    // =============================================
    // 2. Память серий (sessionStorage)
    // =============================================

    function detailMemoryStore() {
        try {
            var raw = window.sessionStorage && window.sessionStorage.getItem(MEMORY_KEY);
            var parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function writeDetailMemory(store) {
        try {
            if (window.sessionStorage) window.sessionStorage.setItem(MEMORY_KEY, JSON.stringify(store || {}));
        } catch (error) {
            console.warn('[Series Manager] Memory write error:', error);
        }
    }

    function readEpisodeMemory(card) {
        var key = contentId(card);
        if (!key) return null;
        var value = detailMemoryStore()[key];
        return value && typeof value === 'object' ? value : null;
    }

    function rememberEpisodeSelection(card, episode, reason) {
        var coordinates = episodeCoordinates(episode);
        var key = contentId(card);
        if (!key || !coordinates) return false;
        var store = detailMemoryStore();
        store[key] = {
            season: coordinates.season,
            episode: coordinates.episode,
            updatedAt: Date.now ? Date.now() : new Date().getTime()
        };
        var keys = Object.keys(store);
        if (keys.length > 80) {
            keys.sort(function (left, right) {
                return numberValue(store[left] && store[left].updatedAt, 0) - numberValue(store[right] && store[right].updatedAt, 0);
            });
            keys.slice(0, keys.length - 80).forEach(function (oldKey) { delete store[oldKey]; });
        }
        writeDetailMemory(store);
        console.log('[Series Manager] Remembered:', key, coordinates, reason || '');
        return true;
    }

    // =============================================
    // 3. Анализ просмотра сериала
    // =============================================

    function resolveSeriesPlayback(card, data) {
        if (!card) return { status: 'empty', episodes: [], current: null, next: null, available: [] };

        var episodes = seriesEpisodesFromData(data || {});
        var available = episodes.filter(episodeIsAvailable);
        var entries = available.map(function (episode) {
            return { episode: episode, timeline: episodeTimeline(card, episode) };
        });

        var current = null;
        var memory = readEpisodeMemory(card);
        if (memory) {
            var hint = memory;
            current = entries.find(function (entry) {
                var coords = episodeCoordinates(entry.episode);
                return coords && coords.season === hint.season && coords.episode === hint.episode && entry.timeline.percent < 60;
            }) || null;
        }

        if (!current) {
            var partial = entries.filter(function (entry) { return entry.timeline.percent > 0 && entry.timeline.percent < 60; });
            if (partial.length) current = partial[partial.length - 1];
        }

        if (!current) {
            var lastWatchedIndex = -1;
            entries.forEach(function (entry, index) {
                if (entry.timeline.percent >= 60) lastWatchedIndex = index;
            });
            current = entries.find(function (entry, index) { return index > lastWatchedIndex && entry.timeline.percent < 60; }) || null;
        }

        var allWatched = !!entries.length && entries.every(function (entry) { return entry.timeline.percent >= 60; });
        if (!current && entries.length) current = entries[allWatched ? entries.length - 1 : 0];

        var currentIndex = current ? entries.indexOf(current) : -1;
        var next = currentIndex >= 0 ? entries.slice(currentIndex + 1).find(function (entry) { return entry.timeline.percent < 60; }) || null : null;

        return {
            card: card,
            episodes: episodes,
            available: entries,
            current: current,
            next: next,
            allWatched: allWatched,
            status: !episodes.length ? 'empty' : !entries.length ? 'upcoming' : allWatched ? 'complete' : 'ready'
        };
    }

    // =============================================
    // 4. Компактный виджет в правом нижнем углу
    // =============================================

    function createWidget(state) {
        if (!state || !state.current) return null;

        // Удаляем старые стили, если есть
        var oldStyle = document.getElementById('lsm-widget-style');
        if (oldStyle) oldStyle.remove();

        var widget = document.createElement('div');
        widget.className = 'lsm-widget';
        widget.setAttribute('data-lsm-status', state.status);
        widget.setAttribute('data-lsm-version', VERSION);

        // Стили виджета
        var style = document.createElement('style');
        style.id = 'lsm-widget-style';
        style.textContent = `
            .lsm-widget {
                position: fixed !important;
                bottom: 2.5em !important;
                right: 2.5em !important;
                z-index: 9999 !important;
                max-width: 340px !important;
                min-width: 180px !important;
                padding: 0.7em 1.1em !important;
                border-radius: 0.9em !important;
                background: rgba(7, 10, 16, 0.94) !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
                border: 0.075em solid rgba(255, 255, 255, 0.1) !important;
                box-shadow: 0 1.2em 3.6em rgba(0, 0, 0, 0.75) !important;
                color: #f6f8fc !important;
                font-family: "SegoeUI", system-ui, -apple-system, sans-serif !important;
                transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease !important;
                cursor: pointer !important;
                user-select: none !important;
                animation: lsm-widget-in 0.35s cubic-bezier(0.22, 0.72, 0.2, 1) !important;
                pointer-events: auto !important;
                line-height: 1.4 !important;
            }
            .lsm-widget:hover {
                transform: scale(1.03) !important;
                border-color: rgba(105, 167, 255, 0.45) !important;
                box-shadow: 0 1.5em 4.5em rgba(0, 0, 0, 0.85) !important;
            }
            .lsm-widget .lsm-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                margin-bottom: 0.15em !important;
            }
            .lsm-widget .lsm-label {
                font-size: 0.6em !important;
                text-transform: uppercase !important;
                letter-spacing: 0.1em !important;
                color: rgba(255, 255, 255, 0.4) !important;
                font-weight: 600 !important;
            }
            .lsm-widget .lsm-status-icon {
                font-size: 0.55em !important;
                padding: 0.15em 0.45em !important;
                border-radius: 99em !important;
                background: rgba(105, 167, 255, 0.15) !important;
                color: #69a7ff !important;
                font-weight: 700 !important;
                letter-spacing: 0.05em !important;
            }
            .lsm-widget[data-lsm-status="complete"] .lsm-status-icon {
                background: rgba(105, 167, 255, 0.1) !important;
                color: rgba(255, 255, 255, 0.3) !important;
            }
            .lsm-widget[data-lsm-status="upcoming"] .lsm-status-icon {
                background: rgba(255, 180, 50, 0.15) !important;
                color: #ffb432 !important;
            }
            .lsm-widget .lsm-title {
                font-size: 0.9em !important;
                font-weight: 700 !important;
                color: #fff !important;
                line-height: 1.3 !important;
                margin: 0.15em 0 0.2em !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .lsm-widget .lsm-meta {
                font-size: 0.75em !important;
                color: rgba(255, 255, 255, 0.55) !important;
                display: flex !important;
                align-items: center !important;
                gap: 0.6em !important;
                flex-wrap: wrap !important;
            }
            .lsm-widget .lsm-progress-wrap {
                width: 100% !important;
                height: 0.2em !important;
                border-radius: 99em !important;
                background: rgba(255, 255, 255, 0.1) !important;
                margin: 0.4em 0 0.2em !important;
                overflow: hidden !important;
            }
            .lsm-widget .lsm-progress-bar {
                height: 100% !important;
                border-radius: inherit !important;
                background: linear-gradient(90deg, #69a7ff, #91beff) !important;
                transition: width 0.4s ease !important;
            }
            .lsm-widget .lsm-remaining {
                font-size: 0.7em !important;
                color: rgba(255, 255, 255, 0.35) !important;
                margin-left: auto !important;
                white-space: nowrap !important;
            }
            .lsm-widget .lsm-next {
                font-size: 0.7em !important;
                color: rgba(255, 255, 255, 0.3) !important;
                margin-top: 0.2em !important;
                border-top: 0.05em solid rgba(255, 255, 255, 0.06) !important;
                padding-top: 0.25em !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .lsm-widget .lsm-next strong {
                color: rgba(255, 255, 255, 0.5) !important;
                font-weight: 600 !important;
            }
            .lsm-widget .lsm-click-hint {
                font-size: 0.55em !important;
                color: rgba(255, 255, 255, 0.15) !important;
                text-align: right !important;
                margin-top: 0.15em !important;
                letter-spacing: 0.05em !important;
            }
            @keyframes lsm-widget-in {
                0% { opacity: 0; transform: translateY(25px) scale(0.92); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            .lsm-widget.lsm-hidden {
                opacity: 0.35 !important;
                transform: scale(0.98) !important;
            }
            .lsm-widget.lsm-hidden:hover {
                opacity: 1 !important;
                transform: scale(1.03) !important;
            }

            /* Адаптация под телефон */
            @media (max-width: 720px) {
                .lsm-widget {
                    bottom: 1.2em !important;
                    right: 1.2em !important;
                    left: 1.2em !important;
                    max-width: none !important;
                    min-width: auto !important;
                    padding: 0.55em 0.9em !important;
                    border-radius: 0.8em !important;
                }
                .lsm-widget .lsm-title {
                    font-size: 0.8em !important;
                }
                .lsm-widget .lsm-meta {
                    font-size: 0.7em !important;
                }
                .lsm-widget .lsm-next {
                    font-size: 0.65em !important;
                }
            }
        `;
        document.head.appendChild(style);

        var current = state.current;
        var coords = episodeCoordinates(current.episode);
        var title = formatEpisodeTitle(current.episode);
        var progress = Math.round(current.timeline.percent || 0);
        var remaining = formatRemainingTime(current.timeline);

        // Заголовок с меткой
        var header = document.createElement('div');
        header.className = 'lsm-header';

        var label = document.createElement('span');
        label.className = 'lsm-label';
        label.textContent = state.status === 'complete' ? 'Просмотрено' : 'Сейчас смотрите';

        var statusIcon = document.createElement('span');
        statusIcon.className = 'lsm-status-icon';
        if (state.status === 'complete') {
            statusIcon.textContent = '✓ Всё';
        } else if (state.status === 'upcoming') {
            statusIcon.textContent = '⏳ Ожидается';
        } else {
            statusIcon.textContent = '▶ ' + (progress > 0 ? progress + '%' : 'Готово');
        }

        header.appendChild(label);
        header.appendChild(statusIcon);

        // Название серии
        var titleEl = document.createElement('div');
        titleEl.className = 'lsm-title';
        titleEl.textContent = title;

        // Мета-информация
        var meta = document.createElement('div');
        meta.className = 'lsm-meta';

        if (coords) {
            var seasonText = document.createElement('span');
            seasonText.textContent = 'Сезон ' + coords.season + ' · Эпизод ' + coords.episode;
            meta.appendChild(seasonText);
        }

        if (remaining) {
            var remainingEl = document.createElement('span');
            remainingEl.className = 'lsm-remaining';
            remainingEl.textContent = '⏱ ' + remaining;
            meta.appendChild(remainingEl);
        }

        // Прогресс-бар
        var progressWrap = document.createElement('div');
        progressWrap.className = 'lsm-progress-wrap';
        var progressBar = document.createElement('div');
        progressBar.className = 'lsm-progress-bar';
        progressBar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        progressWrap.appendChild(progressBar);

        // Следующая серия
        var nextEl = null;
        if (state.next && state.status !== 'complete' && state.status !== 'upcoming') {
            nextEl = document.createElement('div');
            nextEl.className = 'lsm-next';
            var nextTitle = formatEpisodeTitle(state.next.episode);
            var nextProgress = Math.round(state.next.timeline.percent || 0);
            nextEl.innerHTML = 'Далее: <strong>' + nextTitle + '</strong>' +
                (nextProgress > 0 ? ' (' + nextProgress + '%)' : '');
        }

        // Подсказка о клике
        var clickHint = document.createElement('div');
        clickHint.className = 'lsm-click-hint';
        clickHint.textContent = '↗ Открыть эпизоды';

        // Собираем виджет
        widget.appendChild(header);
        widget.appendChild(titleEl);
        widget.appendChild(meta);
        widget.appendChild(progressWrap);
        if (nextEl) widget.appendChild(nextEl);
        widget.appendChild(clickHint);

        // Клик по виджету — переход на страницу эпизодов
        widget.addEventListener('click', function (e) {
            e.stopPropagation();
            openEpisodesScreen(state.card);
        });

        // Авто-скрытие при нулевом прогрессе
        if (progress === 0 && !remaining) {
            var hideTimeout = null;
            var isHidden = false;

            function hideWidget() {
                if (!isHidden && widget.parentNode) {
                    isHidden = true;
                    widget.classList.add('lsm-hidden');
                }
            }

            function showWidget() {
                if (isHidden && widget.parentNode) {
                    isHidden = false;
                    widget.classList.remove('lsm-hidden');
                }
                clearTimeout(hideTimeout);
            }

            hideTimeout = setTimeout(hideWidget, 5000);

            widget.addEventListener('mouseenter', function () {
                showWidget();
                // Показываем дольше при наведении
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(hideWidget, 8000);
            });

            widget.addEventListener('mouseleave', function () {
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(hideWidget, 3000);
            });

            widget.addEventListener('click', function () {
                clearTimeout(hideTimeout);
                showWidget();
            });
        }

        return widget;
    }

    // =============================================
    // 5. Открытие страницы эпизодов
    // =============================================

    function openEpisodesScreen(card) {
        if (!card) return false;
        var memory = readEpisodeMemory(card);
        var payload = {
            component: 'episodes',
            title: window.Lampa && Lampa.Lang && typeof Lampa.Lang.translate === 'function' ? Lampa.Lang.translate('title_episodes') : 'Эпизоды',
            card: card,
            source: card.source || storageGet('source', 'tmdb'),
            page: 1
        };
        if (memory && memory.season) payload.season = memory.season;
        try {
            if (window.Lampa && Lampa.Activity && typeof Lampa.Activity.push === 'function') {
                Lampa.Activity.push(payload);
                return true;
            }
            if (window.Lampa && Lampa.Router && typeof Lampa.Router.call === 'function') {
                Lampa.Router.call('episodes', card);
                return true;
            }
        } catch (error) {
            console.warn('[Series Manager] Open episodes error:', error);
        }
        return false;
    }

    // =============================================
    // 6. Управление виджетами
    // =============================================

    function removeOldWidgets() {
        var widgets = document.querySelectorAll('.lsm-widget');
        widgets.forEach(function (w) {
            if (w.parentNode) w.parentNode.removeChild(w);
        });
    }

    var currentWidget = null;
    var lastState = null;
    var lastCard = null;
    var updateTimer = null;

    function updateWidget(card, data) {
        if (runtime.destroyed) return;

        // Проверяем, что это сериал
        if (mediaType(card) !== 'tv') {
            removeOldWidgets();
            currentWidget = null;
            return;
        }

        var state = resolveSeriesPlayback(card, data || {});
        if (!state || !state.current) {
            removeOldWidgets();
            currentWidget = null;
            return;
        }

        // Проверяем, изменилось ли состояние
        var signature = [
            contentId(card),
            state.current ? episodeCoordinates(state.current.episode).season : '',
            state.current ? episodeCoordinates(state.current.episode).episode : '',
            Math.round(state.current.timeline.percent || 0),
            state.next ? episodeCoordinates(state.next.episode).season : '',
            state.next ? episodeCoordinates(state.next.episode).episode : '',
            state.status
        ].join('|');

        if (lastState === signature && currentWidget && currentWidget.parentNode) {
            // Обновляем только прогресс-бар
            var bar = currentWidget.querySelector('.lsm-progress-bar');
            if (bar && state.current) {
                var progress = Math.round(state.current.timeline.percent || 0);
                bar.style.width = Math.max(0, Math.min(100, progress)) + '%';
                // Обновляем статус
                var statusIcon = currentWidget.querySelector('.lsm-status-icon');
                if (statusIcon) {
                    if (state.status === 'complete') {
                        statusIcon.textContent = '✓ Всё';
                    } else if (state.status === 'upcoming') {
                        statusIcon.textContent = '⏳ Ожидается';
                    } else {
                        statusIcon.textContent = '▶ ' + (progress > 0 ? progress + '%' : 'Готово');
                    }
                }
                // Обновляем remaining
                var remaining = formatRemainingTime(state.current.timeline);
                var remainingEl = currentWidget.querySelector('.lsm-remaining');
                if (remainingEl) {
                    remainingEl.textContent = remaining ? '⏱ ' + remaining : '';
                }
            }
            return;
        }

        lastState = signature;
        lastCard = card;

        // Удаляем старый виджет
        removeOldWidgets();

        // Создаём новый
        var widget = createWidget(state);
        if (widget) {
            document.body.appendChild(widget);
            currentWidget = widget;
        }
    }

    // =============================================
    // 7. Обработчики событий
    // =============================================

    function handleDetailEvent(event) {
        if (!event) return;
        var card = event.data && event.data.movie ? event.data.movie :
            event.object && (event.object.card || event.object) : null;

        if (!card) return;

        if (event.type === 'start' || event.type === 'complite' || event.type === 'build') {
            var data = event.data || null;
            clearTimeout(updateTimer);
            updateTimer = setTimeout(function () {
                updateWidget(card, data);
            }, 300);
        }
    }

    function handleTimelineEvent() {
        // Обновляем виджет при изменении таймлайна
        var active = activeActivity();
        if (active && active.component === 'full') {
            var card = active.card || (active.object && active.object.card) || null;
            if (card && mediaType(card) === 'tv') {
                clearTimeout(updateTimer);
                updateTimer = setTimeout(function () {
                    updateWidget(card, active.data || {});
                }, 200);
            }
        }
    }

    function handleEpisodeSelection(episode, card) {
        if (!episode || !card) return;
        rememberEpisodeSelection(card, episode, 'click');
        // Обновляем виджет после выбора эпизода
        clearTimeout(updateTimer);
        updateTimer = setTimeout(function () {
            updateWidget(card, {});
        }, 100);
    }

    // =============================================
    // 8. Установка обработчиков
    // =============================================

    var runtime = {
        version: VERSION,
        started: false,
        destroyed: false,
        timerIds: [],
        disposers: [],

        destroy: function (reason) {
            if (this.destroyed) return;
            this.destroyed = true;
            this.timerIds.forEach(clearTimeout);
            this.timerIds = [];
            this.disposers.forEach(function (d) { try { d(); } catch (error) {} });
            this.disposers = [];
            clearTimeout(updateTimer);
            removeOldWidgets();
            currentWidget = null;
            if (window[RUNTIME_KEY] === this) delete window[RUNTIME_KEY];
            console.log('[Series Manager] Destroyed:', reason || '');
        }
    };
    window[RUNTIME_KEY] = runtime;

    function setTimeout(callback, delay) {
        if (runtime.destroyed) return 0;
        var id = window.setTimeout(function () {
            var index = runtime.timerIds.indexOf(id);
            if (index >= 0) runtime.timerIds.splice(index, 1);
            if (!runtime.destroyed) callback();
        }, delay || 0);
        runtime.timerIds.push(id);
        return id;
    }

    function clearTimeout(id) {
        if (!id) return;
        window.clearTimeout(id);
        var index = runtime.timerIds.indexOf(id);
        if (index >= 0) runtime.timerIds.splice(index, 1);
    }

    function addDisposer(disposer) {
        if (typeof disposer === 'function') runtime.disposers.push(disposer);
        return disposer;
    }

    function followEmitter(emitter, event, handler) {
        if (!emitter || typeof emitter.follow !== 'function') return false;
        emitter.follow(event, handler);
        addDisposer(function () {
            try {
                if (typeof emitter.remove === 'function') emitter.remove(event, handler);
                else if (typeof emitter.unfollow === 'function') emitter.unfollow(event, handler);
            } catch (error) {}
        });
        return true;
    }

    function installListeners() {
        if (!window.Lampa || !Lampa.Listener) return false;

        // Слушаем события детальной страницы
        followEmitter(Lampa.Listener, 'full', function (event) {
            if (event && (event.type === 'start' || event.type === 'complite' || event.type === 'build')) {
                handleDetailEvent(event);
            }
        });

        // Слушаем изменения таймлайна
        followEmitter(Lampa.Listener, 'timeline', handleTimelineEvent);

        // Слушаем открытие страницы эпизодов
        followEmitter(Lampa.Listener, 'episodes', function (event) {
            if (event && event.type === 'start' && event.item) {
                var card = event.data && event.data.movie ? event.data.movie :
                    event.object && (event.object.card || event.object) : null;
                if (card && mediaType(card) === 'tv') {
                    // Сохраняем текущий эпизод при открытии страницы эпизодов
                    setTimeout(function () {
                        var root = activeActivityRoot();
                        if (root) {
                            var focused = root.querySelector('.selector.focus, .full-episode.focus, .season-episode.focus');
                            if (focused) {
                                var episodeData = focused.card_data || null;
                                if (episodeData && episodeCoordinates(episodeData)) {
                                    rememberEpisodeSelection(card, episodeData, 'episodes-open');
                                }
                            }
                        }
                    }, 100);
                }
            }
        });

        // Слушаем клики по эпизодам через DOM
        if (window.$) {
            try {
                $(document).on('click.lsm hover:enter.lsm', '.full-episode, .season-episode, .card-episode', function () {
                    var episode = this.card_data || null;
                    var active = activeActivity();
                    var card = active && (active.card || (active.object && active.object.card) || null);
                    if (episode && card && mediaType(card) === 'tv') {
                        handleEpisodeSelection(episode, card);
                    }
                });
                addDisposer(function () {
                    try { $(document).off('.lsm'); } catch (error) {}
                });
            } catch (error) {
                console.warn('[Series Manager] DOM click handlers failed:', error);
            }
        }

        return true;
    }

    // =============================================
    // 9. Запуск плагина
    // =============================================

    function start() {
        if (runtime.destroyed || runtime.started) return;
        if (!window.Lampa || !Lampa.Listener) {
            setTimeout(start, 100);
            return;
        }

        runtime.started = true;
        console.log('[Series Manager] v' + VERSION + ' started');

        installListeners();

        // Проверяем, не открыт ли уже сериал
        setTimeout(function () {
            var active = activeActivity();
            if (active && active.component === 'full') {
                var card = active.card || (active.object && active.object.card) || null;
                if (card && mediaType(card) === 'tv') {
                    updateWidget(card, active.data || {});
                }
            }
        }, 500);
    }

    // =============================================
    // 10. Экспорт API
    // =============================================

    var api = {
        version: VERSION,
        updateWidget: updateWidget,
        resolveSeriesPlayback: resolveSeriesPlayback,
        rememberEpisode: rememberEpisodeSelection,
        readMemory: readEpisodeMemory,
        openEpisodes: openEpisodesScreen,
        destroy: runtime.destroy.bind(runtime),
        getState: function () {
            return {
                version: VERSION,
                destroyed: runtime.destroyed,
                started: runtime.started,
                hasWidget: !!currentWidget,
                lastCard: lastCard ? contentId(lastCard) : null
            };
        }
    };

    window.__LSM_API__ = api;
    window[RUNTIME_KEY] = runtime;

    // Запускаем
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }

    console.log('[Series Manager] v' + VERSION + ' loaded');
})();
