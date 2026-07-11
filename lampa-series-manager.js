/* Series Manager PRO 5.2.0 — Встроенный в DOM */
(function () {
    'use strict';

    var VERSION = '5.2.0';
    var MEMORY_KEY = 'lmui_detail_episode_v1';

    // =============================================
    // ПРОВЕРКА
    // =============================================

    if (typeof Lampa === 'undefined') {
        console.warn('[Series Manager PRO] Lampa не найдена');
        return;
    }

    console.log('[Series Manager PRO] v' + VERSION + ' загружается...');

    // =============================================
    // НАСТРОЙКИ
    // =============================================

    var DEFAULTS = {
        enabled: true,
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
    // УТИЛИТЫ
    // =============================================

    function sm_mediaType(card) {
        if (!card) return 'movie';
        var type = String(card.media_type || card.mediaType || card.method || '').toLowerCase();
        if (type === 'tv' || type === 'series' || type === 'show') return 'tv';
        if (type === 'movie') return 'movie';
        return card.name || card.original_name || card.first_air_date || card.number_of_seasons ? 'tv' : 'movie';
    }

    function sm_contentId(card) {
        if (!card) return '';
        var source = String(card.source || 'tmdb');
        var id = card.id !== undefined && card.id !== null ? String(card.id) : '';
        if (id) return sm_mediaType(card) + ':' + source + ':' + id;
        return sm_mediaType(card) + ':title:' + String(card.title || card.name || card.original_title || card.original_name || '').toLowerCase();
    }

    function sm_episodeCoordinates(episode) {
        if (!episode || typeof episode !== 'object') return null;
        var season = episode.season_number !== undefined ? episode.season_number : episode.season;
        var number = episode.episode_number !== undefined ? episode.episode_number : episode.episode;
        season = Number(season);
        number = Number(number);
        if (!isFinite(season) || !isFinite(number) || season < 0 || number < 1) return null;
        return { season: season, episode: number };
    }

    function sm_padEpisodeNumber(value) {
        var text = String(value);
        return text.length < 2 ? '0' + text : text;
    }

    function sm_formatEpisodeTitle(episode) {
        var coordinates = sm_episodeCoordinates(episode);
        if (!coordinates) return '';
        var label = 'S' + sm_padEpisodeNumber(coordinates.season) + ' E' + sm_padEpisodeNumber(coordinates.episode);
        var name = episode && episode.name ? String(episode.name) : '';
        return name ? label + ' · ' + name : label;
    }

    function sm_formatRemainingTime(timeline) {
        if (!timeline || !timeline.duration || timeline.duration <= timeline.time) return '';
        var seconds = Math.max(0, timeline.duration - timeline.time);
        var minutes = Math.max(1, Math.round(seconds / 60));
        if (minutes < 60) return 'осталось ' + minutes + ' мин';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return 'осталось ' + hours + ' ч' + (rest ? ' ' + rest + ' мин' : '');
    }

    function sm_formatWatchedTime(timeline) {
        if (!timeline || !timeline.time || timeline.time < 0) return '';
        var seconds = Math.round(timeline.time);
        var minutes = Math.round(seconds / 60);
        if (minutes < 1) return '< 1 мин';
        if (minutes < 60) return minutes + ' мин';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return hours + ' ч ' + rest + ' мин';
    }

    function sm_numberValue(value, fallback) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : (fallback !== undefined ? fallback : 0);
    }

    function sm_episodeAirTimestamp(episode) {
        if (!episode || !episode.air_date) return 0;
        var parsed = new Date(String(episode.air_date).replace(/-/g, '/')).getTime();
        return isFinite(parsed) ? parsed : 0;
    }

    function sm_episodeIsAvailable(episode) {
        if (!episode || episode.comeing) return false;
        var timestamp = sm_episodeAirTimestamp(episode);
        return !timestamp || timestamp <= (Date.now ? Date.now() : new Date().getTime());
    }

    function sm_activeActivity() {
        try {
            var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;
            return active || null;
        } catch (error) {
            return null;
        }
    }

    function sm_getActiveRender() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return null;
            if (active.activity && typeof active.activity.render === 'function') {
                return active.activity.render();
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // =============================================
    // ПАМЯТЬ СЕРИЙ
    // =============================================

    function sm_detailMemoryStore() {
        try {
            var raw = window.sessionStorage && window.sessionStorage.getItem(MEMORY_KEY);
            var parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function sm_writeDetailMemory(store) {
        try {
            if (window.sessionStorage) window.sessionStorage.setItem(MEMORY_KEY, JSON.stringify(store || {}));
        } catch (error) {}
    }

    function sm_readEpisodeMemory(card) {
        var key = sm_contentId(card);
        if (!key) return null;
        var value = sm_detailMemoryStore()[key];
        return value && typeof value === 'object' ? value : null;
    }

    function sm_rememberEpisodeSelection(card, episode, reason) {
        var coordinates = sm_episodeCoordinates(episode);
        var key = sm_contentId(card);
        if (!key || !coordinates) return false;
        var store = sm_detailMemoryStore();
        store[key] = {
            season: coordinates.season,
            episode: coordinates.episode,
            updatedAt: Date.now ? Date.now() : new Date().getTime()
        };
        var keys = Object.keys(store);
        if (keys.length > 80) {
            keys.sort(function (left, right) {
                return sm_numberValue(store[left] && store[left].updatedAt, 0) - sm_numberValue(store[right] && store[right].updatedAt, 0);
            });
            keys.slice(0, keys.length - 80).forEach(function (oldKey) { delete store[oldKey]; });
        }
        sm_writeDetailMemory(store);
        return true;
    }

    // =============================================
    // СБОР ЭПИЗОДОВ
    // =============================================

    function sm_collectEpisodes(value, result, depth) {
        if (depth > 5 || value === null || value === undefined) return;
        if (Array.isArray(value)) {
            value.forEach(function (item) { sm_collectEpisodes(item, result, depth + 1); });
            return;
        }
        if (typeof value !== 'object') return;
        if (sm_episodeCoordinates(value)) {
            result.push(value);
            return;
        }
        ['episodes_original', 'episodes', 'results', 'items'].forEach(function (key) {
            if (value[key] !== undefined) sm_collectEpisodes(value[key], result, depth + 1);
        });
    }

    function sm_seriesEpisodesFromData(data) {
        var collected = [];
        sm_collectEpisodes(data && data.episodes, collected, 0);
        var unique = {};
        return collected.filter(function (episode) {
            var coordinates = sm_episodeCoordinates(episode);
            if (!coordinates) return false;
            var key = coordinates.season + ':' + coordinates.episode;
            if (unique[key]) return false;
            unique[key] = true;
            return true;
        }).sort(function (left, right) {
            var a = sm_episodeCoordinates(left);
            var b = sm_episodeCoordinates(right);
            return a.season === b.season ? a.episode - b.episode : a.season - b.season;
        });
    }

    function sm_episodeTimeline(card, episode) {
        var coordinates = sm_episodeCoordinates(episode);
        var road = { percent: 0, time: 0, duration: 0 };
        if (!coordinates) return road;
        try {
            if (window.Lampa && Lampa.Timeline && typeof Lampa.Timeline.watchedEpisode === 'function') {
                var current = Lampa.Timeline.watchedEpisode(card, coordinates.season, coordinates.episode, true);
                if (current && typeof current === 'object') {
                    road.percent = sm_numberValue(current.percent, 0);
                    road.time = sm_numberValue(current.time, 0);
                    road.duration = sm_numberValue(current.duration, 0);
                    return road;
                }
            }
        } catch (error) {}
        var embedded = episode.timeline || episode.view || null;
        if (embedded && typeof embedded === 'object') {
            road.percent = sm_numberValue(embedded.percent, 0);
            road.time = sm_numberValue(embedded.time, 0);
            road.duration = sm_numberValue(embedded.duration, 0);
        }
        return road;
    }

    // =============================================
    // АНАЛИЗ ПРОСМОТРА
    // =============================================

    function sm_resolveSeriesPlayback(card, data) {
        if (!card) return { status: 'empty', episodes: [], current: null, next: null, available: [] };

        var episodes = sm_seriesEpisodesFromData(data || {});
        var available = episodes.filter(sm_episodeIsAvailable);
        var entries = available.map(function (episode) {
            return { episode: episode, timeline: sm_episodeTimeline(card, episode) };
        });

        var current = null;
        var memory = sm_readEpisodeMemory(card);
        if (memory) {
            var hint = memory;
            current = entries.find(function (entry) {
                var coords = sm_episodeCoordinates(entry.episode);
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
    // ОТКРЫТИЕ БАЛАНСЕРА LAMPAC
    // =============================================

    function sm_openLampacBalancer(card, season, episode) {
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
    // БЛОК — ВСТРАИВАЕТСЯ В .full-start-new__right
    // =============================================

    function sm_createBlock(state, card) {
        if (!state || !state.current) return null;

        var settings = getSettings();
        if (!settings.enabled) return null;

        var current = state.current;
        var coords = sm_episodeCoordinates(current.episode);
        var title = sm_formatEpisodeTitle(current.episode);
        var progress = Math.round(current.timeline.percent || 0);
        var remaining = sm_formatRemainingTime(current.timeline);
        var watchedTime = sm_formatWatchedTime(current.timeline);

        var seriesTitle = card.title || card.name || card.original_title || card.original_name || '';

        var statusText = '';
        var statusIcon = '';
        var statusColor = '#69a7ff';
        if (state.status === 'complete' || progress >= 89) {
            statusText = 'Просмотрено';
            statusIcon = '✓';
            statusColor = '#2ecc71';
        } else if (state.status === 'upcoming') {
            statusText = 'Ожидается';
            statusIcon = '⏳';
            statusColor = '#ffb432';
        } else if (progress > 0 && progress < 89) {
            statusText = 'Продолжить';
            statusIcon = '▶';
            statusColor = '#69a7ff';
        } else {
            statusText = 'Смотреть';
            statusIcon = '▶';
            statusColor = '#69a7ff';
        }

        var block = document.createElement('div');
        block.className = 'series-info-block';
        block.id = 'series-info-block';
        block.setAttribute('data-card-id', sm_contentId(card));

        // Стили — блок встраивается в DOM
        block.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'width:100%',
            'max-width:100%',
            'padding:0.8em 1.2em',
            'border-radius:0.8em',
            'background:rgba(0,0,0,0.3)',
            'border:1px solid rgba(255,255,255,0.06)',
            'backdrop-filter:blur(8px)',
            '-webkit-backdrop-filter:blur(8px)',
            'transition:all .3s ease',
            'cursor:pointer',
            'color:#f6f8fc',
            'font-family:"SegoeUI",system-ui,sans-serif',
            'font-size:13px',
            'box-shadow:0 4px 20px rgba(0,0,0,0.3)',
            'margin:0.5em 0',
            'flex-shrink:0',
            'position:relative',
            'overflow:hidden',
            'box-sizing:border-box',
            'pointer-events:auto'
        ].join(';');

        // Декоративный верхний градиент
        var gradient = document.createElement('div');
        gradient.style.cssText = [
            'position:absolute',
            'top:0',
            'left:0',
            'right:0',
            'height:3px',
            'background:linear-gradient(90deg, #69a7ff, #91beff)',
            'opacity:0.5'
        ].join(';');
        block.appendChild(gradient);

        // Шапка
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.2em;';

        var leftHeader = document.createElement('div');
        leftHeader.style.cssText = 'display:flex;align-items:center;gap:0.5em;';

        var icon = document.createElement('span');
        icon.style.cssText = 'font-size:0.9em;color:#69a7ff;';
        icon.textContent = '▶';
        leftHeader.appendChild(icon);

        var eyebrow = document.createElement('span');
        eyebrow.style.cssText = 'font-size:0.55em;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.4);font-weight:600;';
        eyebrow.textContent = 'ПРОДОЛЖИТЬ ПРОСМОТР';
        leftHeader.appendChild(eyebrow);

        header.appendChild(leftHeader);

        var statusEl = document.createElement('span');
        statusEl.style.cssText = 'font-size:0.55em;font-weight:700;color:' + statusColor + ';padding:0.15em 0.6em;border-radius:99em;background:rgba(0,0,0,0.3);border:1px solid ' + statusColor + '30;white-space:nowrap;';
        statusEl.textContent = statusIcon + ' ' + statusText;
        header.appendChild(statusEl);

        block.appendChild(header);

        // Название сериала
        var seriesName = document.createElement('div');
        seriesName.style.cssText = 'font-size:1.2em;font-weight:700;color:#ffffff;margin-bottom:0.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;';
        seriesName.textContent = seriesTitle || 'Сериал';
        block.appendChild(seriesName);

        // Название серии
        var titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size:0.9em;font-weight:600;color:rgba(255,255,255,0.75);margin-bottom:0.15em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleEl.textContent = title;
        block.appendChild(titleEl);

        // Разделитель
        var divider = document.createElement('div');
        divider.style.cssText = 'width:100%;height:1px;background:rgba(255,255,255,0.05);margin:0.1em 0 0.2em;';
        block.appendChild(divider);

        // Мета
        var meta = document.createElement('div');
        meta.style.cssText = 'display:flex;align-items:center;gap:0.5em;flex-wrap:wrap;font-size:0.7em;';

        if (coords) {
            var seasonText = document.createElement('span');
            seasonText.style.cssText = 'background:rgba(255,255,255,0.06);padding:0.2em 0.6em;border-radius:0.3em;color:rgba(255,255,255,0.5);';
            seasonText.textContent = 'Сезон ' + coords.season + ' · Эпизод ' + coords.episode;
            meta.appendChild(seasonText);
        }

        if (progress > 0) {
            var progressText = document.createElement('span');
            progressText.style.cssText = 'background:rgba(105,167,255,0.12);padding:0.2em 0.6em;border-radius:0.3em;color:#69a7ff;font-weight:600;';
            progressText.textContent = progress + '%';
            meta.appendChild(progressText);
        }

        if (remaining) {
            var remainingEl = document.createElement('span');
            remainingEl.style.cssText = 'background:rgba(255,255,255,0.06);padding:0.2em 0.6em;border-radius:0.3em;color:rgba(255,255,255,0.4);';
            remainingEl.textContent = '⏱ ' + remaining;
            meta.appendChild(remainingEl);
        }

        block.appendChild(meta);

        // Прогресс-бар
        var progressWrap = document.createElement('div');
        progressWrap.style.cssText = 'width:100%;height:4px;border-radius:99em;background:rgba(255,255,255,0.06);margin:0.3em 0 0.1em;overflow:hidden;';
        var progressBar = document.createElement('div');
        progressBar.className = 'sw-progress-bar';
        progressBar.style.cssText = 'height:100%;border-radius:inherit;background:linear-gradient(90deg,#69a7ff,#91beff);transition:width .5s ease;';
        progressBar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        progressWrap.appendChild(progressBar);
        block.appendChild(progressWrap);

        // Время просмотра
        var timeRow = document.createElement('div');
        timeRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;font-size:0.65em;color:rgba(255,255,255,0.3);margin-top:0.1em;';

        var watchedEl = document.createElement('span');
        watchedEl.textContent = '👁 Просмотрено: ' + watchedTime;
        timeRow.appendChild(watchedEl);

        if (remaining) {
            var remainingShort = document.createElement('span');
            remainingShort.textContent = '⏱ Осталось: ' + remaining;
            timeRow.appendChild(remainingShort);
        }

        block.appendChild(timeRow);

        // Следующая серия
        if (state.next && state.status !== 'complete' && state.status !== 'upcoming') {
            var nextCoords = sm_episodeCoordinates(state.next.episode);
            if (nextCoords) {
                var nextRow = document.createElement('div');
                nextRow.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.4);margin-top:0.15em;padding-top:0.1em;border-top:1px solid rgba(255,255,255,0.04);';
                nextRow.textContent = '▶ Далее: S' + sm_padEpisodeNumber(nextCoords.season) + ' E' + sm_padEpisodeNumber(nextCoords.episode);
                block.appendChild(nextRow);
            }
        }

        // Подсказка
        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.5em;color:rgba(255,255,255,0.1);text-align:right;margin-top:0.05em;';
        hint.textContent = '↗ Нажмите, чтобы открыть в Lampac';
        block.appendChild(hint);

        // Ховер
        block.addEventListener('mouseenter', function () {
            this.style.borderColor = 'rgba(105,167,255,0.15)';
            this.style.background = 'rgba(0,0,0,0.4)';
        });
        block.addEventListener('mouseleave', function () {
            this.style.borderColor = 'rgba(255,255,255,0.06)';
            this.style.background = 'rgba(0,0,0,0.3)';
        });

        // Клик
        block.addEventListener('click', function (e) {
            e.stopPropagation();
            var season = coords ? coords.season : undefined;
            var episode = coords ? coords.episode : undefined;

            if (state.current) {
                sm_rememberEpisodeSelection(card, state.current.episode, 'block-click');
            }

            sm_openLampacBalancer(card, season, episode);
        });

        return block;
    }

    // =============================================
    // УПРАВЛЕНИЕ БЛОКОМ — ВСТРАИВАНИЕ В DOM
    // =============================================

    var currentBlock = null;
    var lastState = null;
    var updateTimer = null;
    var currentCard = null;
    var currentData = null;
    var isOnSeriesPage = false;
    var isLampacOpen = false;

    function sm_removeBlock() {
        var block = document.getElementById('series-info-block');
        if (block && block.parentNode) {
            block.parentNode.removeChild(block);
        }
        currentBlock = null;
    }

    function sm_insertBlock(card, data) {
        try {
            var settings = getSettings();
            if (!settings.enabled) {
                sm_removeBlock();
                return;
            }

            if (isLampacOpen) {
                return;
            }

            var active = sm_activeActivity();
            if (!active || active.component !== 'full') {
                isOnSeriesPage = false;
                sm_removeBlock();
                return;
            }

            if (card) {
                currentCard = card;
                currentData = data;
            }

            if (!currentCard) {
                currentCard = active.card || (active.object && active.object.card) || null;
                currentData = active.data || null;
            }

            if (!currentCard || sm_mediaType(currentCard) !== 'tv') {
                sm_removeBlock();
                return;
            }

            isOnSeriesPage = true;

            var render = sm_getActiveRender();
            if (!render || !render.length) {
                return;
            }

            // Ищем контейнер .full-start-new__right
            var container = render.find('.full-start-new__right');
            if (!container.length) {
                return;
            }

            var state = sm_resolveSeriesPlayback(currentCard, currentData || {});
            if (!state || !state.current) {
                sm_removeBlock();
                return;
            }

            var cardId = sm_contentId(currentCard);
            var signature = [
                cardId,
                state.current ? sm_episodeCoordinates(state.current.episode).season : '',
                state.current ? sm_episodeCoordinates(state.current.episode).episode : '',
                Math.round(state.current.timeline.percent || 0),
                state.status
            ].join('|');

            var existingBlock = document.getElementById('series-info-block');
            
            if (existingBlock && lastState === signature) {
                var bar = existingBlock.querySelector('.sw-progress-bar');
                if (bar && state.current) {
                    var progress = Math.round(state.current.timeline.percent || 0);
                    bar.style.width = Math.max(0, Math.min(100, progress)) + '%';
                }
                return;
            }

            if (existingBlock && existingBlock.getAttribute('data-card-id') !== cardId) {
                sm_removeBlock();
            }

            lastState = signature;
            
            if (document.getElementById('series-info-block')) {
                sm_removeBlock();
            }

            var block = sm_createBlock(state, currentCard);
            if (!block) return;

            // ВСТРАИВАЕМ В КОНЕЦ .full-start-new__right
            container.append(block);
            currentBlock = block;

        } catch (e) {
            console.error('[Series Manager PRO] Ошибка:', e);
        }
    }

    // =============================================
    // ВОССТАНОВЛЕНИЕ
    // =============================================

    function sm_restoreBlock() {
        if (isLampacOpen) {
            sm_removeBlock();
            return;
        }

        var settings = getSettings();
        if (!settings.enabled) {
            sm_removeBlock();
            return;
        }

        var active = sm_activeActivity();
        if (active && active.component === 'full') {
            var card = active.card || (active.object && active.object.card) || null;
            if (card && sm_mediaType(card) === 'tv') {
                var block = document.getElementById('series-info-block');
                if (!block) {
                    sm_insertBlock(card, active.data);
                }
            }
        }
    }

    // =============================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // =============================================

    var listenersInstalled = false;
    var restoreInterval = null;

    function sm_onFull(event) {
        if (!event) return;

        if (event.type === 'complite' || event.type === 'start' || event.type === 'build') {
            var card = null;
            var data = null;

            if (event.data && event.data.movie) {
                card = event.data.movie;
                data = event.data;
            } else if (event.object && (event.object.card || event.object)) {
                card = event.object.card || event.object;
                data = event.data;
            }

            if (card && sm_mediaType(card) === 'tv') {
                clearTimeout(updateTimer);
                updateTimer = setTimeout(function () {
                    sm_insertBlock(card, data);
                }, 500);
            }
        }
    }

    function sm_onTimeline() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(function () {
            sm_restoreBlock();
        }, 300);
    }

    function sm_onActivity(event) {
        if (!event || event.type !== 'start') return;

        clearTimeout(updateTimer);

        if (event.component === 'full') {
            isOnSeriesPage = true;
            if (isLampacOpen) {
                isLampacOpen = false;
            }
            updateTimer = setTimeout(function () {
                sm_insertBlock();
            }, 500);
        } else if (event.component === 'lampac') {
            isLampacOpen = true;
            sm_removeBlock();
        } else {
            isOnSeriesPage = false;
            isLampacOpen = false;
            sm_removeBlock();
        }
    }

    function sm_installListeners() {
        if (listenersInstalled) return;
        if (!window.Lampa || !Lampa.Listener) return;

        listenersInstalled = true;
        
        Lampa.Listener.follow('full', sm_onFull);
        Lampa.Listener.follow('timeline', sm_onTimeline);
        Lampa.Listener.follow('activity', sm_onActivity);

        // Периодическая проверка (каждые 2 секунды)
        if (restoreInterval) clearInterval(restoreInterval);
        restoreInterval = setInterval(function() {
            sm_restoreBlock();
        }, 2000);
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
                    name: 'series_manager_enabled',
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
                    
                    if (settings.enabled) {
                        sm_restoreBlock();
                    } else {
                        sm_removeBlock();
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'series_manager_pro',
                param: {
                    name: 'series_manager_auto_open_balancer',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Открывать Lampac Balancer при клике'
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
    // ЗАПУСК
    // =============================================

    function start() {
        try {
            if (!Lampa || !Lampa.Listener) {
                setTimeout(start, 200);
                return;
            }

            console.log('[Series Manager PRO] v' + VERSION + ' запущен');

            addSettings();
            sm_installListeners();

            setTimeout(function () {
                sm_restoreBlock();
            }, 1000);

        } catch (e) {
            console.error('[Series Manager PRO] Ошибка:', e);
        }
    }

    // =============================================
    // API
    // =============================================

    window.__SERIES_MANAGER_PRO__ = {
        version: VERSION,
        update: sm_insertBlock,
        remove: sm_removeBlock,
        openLampac: sm_openLampacBalancer,
        restore: sm_restoreBlock,
        getState: function () {
            return {
                version: VERSION,
                hasBlock: !!document.getElementById('series-info-block'),
                isOnSeriesPage: isOnSeriesPage,
                isLampacOpen: isLampacOpen,
                settings: getSettings()
            };
        }
    };

    // =============================================
    // СТАРТ
    // =============================================

    if (document.readyState === 'complete') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }

})();
