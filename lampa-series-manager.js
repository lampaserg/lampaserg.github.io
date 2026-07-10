/* Series Manager PRO 4.2.0 — Адаптивная ширина справа */
(function () {
    'use strict';

    var VERSION = '4.2.0';
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
        show_block: true,
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

    function formatTime(seconds) {
        if (!seconds || seconds < 0) return '0 мин';
        var mins = Math.round(seconds / 60);
        if (mins < 60) return mins + ' мин';
        var hours = Math.floor(mins / 60);
        var rest = mins % 60;
        return hours + ' ч ' + rest + ' мин';
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

    function formatWatchedTime(timeline) {
        if (!timeline || !timeline.time || timeline.time < 0) return '';
        var seconds = Math.round(timeline.time);
        var minutes = Math.round(seconds / 60);
        if (minutes < 1) return '< 1 мин';
        if (minutes < 60) return minutes + ' мин';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return hours + ' ч ' + rest + ' мин';
    }

    function numberValue(value, fallback) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : (fallback !== undefined ? fallback : 0);
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

    function activeActivity() {
        try {
            var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;
            return active || null;
        } catch (error) {
            return null;
        }
    }

    function getActiveRender() {
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

    function getViewportWidth() {
        return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    }

    // =============================================
    // ПАМЯТЬ СЕРИЙ
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
        } catch (error) {}
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
    // АНАЛИЗ ПРОСМОТРА
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
    // СОЗДАНИЕ БЛОКА (АДАПТИВНАЯ ШИРИНА 65-95%)
    // =============================================

    function createBlock(state, card) {
        if (!state || !state.current) return null;

        var settings = getSettings();
        if (!settings.show_block) return null;

        var current = state.current;
        var coords = episodeCoordinates(current.episode);
        var title = formatEpisodeTitle(current.episode);
        var progress = Math.round(current.timeline.percent || 0);
        var remaining = formatRemainingTime(current.timeline);
        var watchedTime = formatWatchedTime(current.timeline);

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

        // Вычисляем ширину: 65-95% от ширины экрана
        var viewportWidth = getViewportWidth();
        var blockWidth = Math.max(viewportWidth * 0.65, Math.min(viewportWidth * 0.95, 900));

        var block = document.createElement('div');
        block.className = 'series-info-block';
        block.id = 'series-info-block';
        block.setAttribute('data-card-id', contentId(card));

        block.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'width:' + blockWidth + 'px',
            'max-width:95vw',
            'padding:1.2em 1.6em',
            'border-radius:1em',
            'background:rgba(0,0,0,0.5)',
            'border:2px solid rgba(105,167,255,0.25)',
            'backdrop-filter:blur(16px)',
            '-webkit-backdrop-filter:blur(16px)',
            'transition:all .3s ease',
            'cursor:pointer',
            'color:#ffffff',
            'font-family:"SegoeUI",system-ui,sans-serif',
            'font-size:16px',
            'box-shadow:0 8px 40px rgba(0,0,0,0.6)',
            'margin:0',
            'flex-shrink:0',
            'position:relative',
            'overflow:hidden',
            'box-sizing:border-box'
        ].join(';');

        // Декоративный верхний градиент
        var gradient = document.createElement('div');
        gradient.style.cssText = [
            'position:absolute',
            'top:0',
            'left:0',
            'right:0',
            'height:4px',
            'background:linear-gradient(90deg, #69a7ff, #91beff)',
            'opacity:0.7'
        ].join(';');
        block.appendChild(gradient);

        // Шапка
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3em;';

        var leftHeader = document.createElement('div');
        leftHeader.style.cssText = 'display:flex;align-items:center;gap:0.6em;';

        var icon = document.createElement('span');
        icon.style.cssText = 'font-size:1.2em;color:#69a7ff;text-shadow:0 0 20px rgba(105,167,255,0.3);';
        icon.textContent = '▶';
        leftHeader.appendChild(icon);

        var eyebrow = document.createElement('span');
        eyebrow.style.cssText = 'font-size:0.65em;text-transform:uppercase;letter-spacing:0.12em;color:#69a7ff;font-weight:700;text-shadow:0 0 20px rgba(105,167,255,0.2);';
        eyebrow.textContent = 'ПРОДОЛЖИТЬ ПРОСМОТР';
        leftHeader.appendChild(eyebrow);

        header.appendChild(leftHeader);

        var statusEl = document.createElement('span');
        statusEl.style.cssText = 'font-size:0.65em;font-weight:700;color:' + statusColor + ';padding:0.2em 0.8em;border-radius:99em;background:rgba(0,0,0,0.4);border:1px solid ' + statusColor + '40;white-space:nowrap;text-shadow:0 0 20px ' + statusColor + '20;';
        statusEl.textContent = statusIcon + ' ' + statusText;
        header.appendChild(statusEl);

        block.appendChild(header);

        // Название сериала
        var seriesName = document.createElement('div');
        seriesName.style.cssText = 'font-size:1.8em;font-weight:800;color:#ffffff;margin-bottom:0.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;text-shadow:0 2px 10px rgba(0,0,0,0.5);';
        seriesName.textContent = seriesTitle || 'Сериал';
        block.appendChild(seriesName);

        // Название серии
        var titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size:1.15em;font-weight:600;color:rgba(255,255,255,0.85);margin-bottom:0.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 6px rgba(0,0,0,0.4);';
        titleEl.textContent = title;
        block.appendChild(titleEl);

        // Разделитель
        var divider = document.createElement('div');
        divider.style.cssText = 'width:100%;height:1px;background:rgba(255,255,255,0.08);margin:0.15em 0 0.3em;';
        block.appendChild(divider);

        // Мета
        var meta = document.createElement('div');
        meta.style.cssText = 'display:flex;align-items:center;gap:0.6em;flex-wrap:wrap;font-size:0.85em;';

        if (coords) {
            var seasonText = document.createElement('span');
            seasonText.style.cssText = 'background:rgba(255,255,255,0.08);padding:0.25em 0.8em;border-radius:0.4em;color:rgba(255,255,255,0.7);font-weight:500;';
            seasonText.textContent = 'Сезон ' + coords.season + ' · Эпизод ' + coords.episode;
            meta.appendChild(seasonText);
        }

        if (progress > 0) {
            var progressText = document.createElement('span');
            progressText.style.cssText = 'background:rgba(105,167,255,0.15);padding:0.25em 0.8em;border-radius:0.4em;color:#69a7ff;font-weight:700;border:1px solid rgba(105,167,255,0.2);';
            progressText.textContent = progress + '%';
            meta.appendChild(progressText);
        }

        if (remaining) {
            var remainingEl = document.createElement('span');
            remainingEl.style.cssText = 'background:rgba(255,255,255,0.06);padding:0.25em 0.8em;border-radius:0.4em;color:rgba(255,255,255,0.5);';
            remainingEl.textContent = '⏱ ' + remaining;
            meta.appendChild(remainingEl);
        }

        block.appendChild(meta);

        // Прогресс-бар
        var progressWrap = document.createElement('div');
        progressWrap.style.cssText = 'width:100%;height:6px;border-radius:99em;background:rgba(255,255,255,0.08);margin:0.4em 0 0.15em;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,0.3);';
        var progressBar = document.createElement('div');
        progressBar.className = 'sw-progress-bar';
        progressBar.style.cssText = 'height:100%;border-radius:inherit;background:linear-gradient(90deg,#69a7ff,#91beff);transition:width .6s ease;box-shadow:0 0 20px rgba(105,167,255,0.3);';
        progressBar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        progressWrap.appendChild(progressBar);
        block.appendChild(progressWrap);

        // Время просмотра
        var timeRow = document.createElement('div');
        timeRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;font-size:0.75em;color:rgba(255,255,255,0.4);margin-top:0.15em;';

        var watchedEl = document.createElement('span');
        watchedEl.style.cssText = 'color:rgba(255,255,255,0.5);';
        watchedEl.textContent = '👁 Просмотрено: ' + watchedTime;
        timeRow.appendChild(watchedEl);

        if (remaining) {
            var remainingShort = document.createElement('span');
            remainingShort.style.cssText = 'color:rgba(255,255,255,0.4);';
            remainingShort.textContent = '⏱ Осталось: ' + remaining;
            timeRow.appendChild(remainingShort);
        }

        block.appendChild(timeRow);

        // Следующая серия — БЕЛЫМ ЦВЕТОМ
        if (state.next && state.status !== 'complete' && state.status !== 'upcoming') {
            var nextCoords = episodeCoordinates(state.next.episode);
            if (nextCoords) {
                var nextRow = document.createElement('div');
                nextRow.style.cssText = 'font-size:0.8em;color:#ffffff;margin-top:0.2em;padding-top:0.15em;border-top:1px solid rgba(255,255,255,0.06);font-weight:500;';
                nextRow.textContent = '▶ Далее: S' + padEpisodeNumber(nextCoords.season) + ' E' + padEpisodeNumber(nextCoords.episode);
                block.appendChild(nextRow);
            }
        }

        // Подсказка
        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.6em;color:rgba(255,255,255,0.15);text-align:right;margin-top:0.1em;letter-spacing:0.05em;';
        hint.textContent = '↗ Нажмите, чтобы открыть в Lampac';
        block.appendChild(hint);

        // Ховер
        block.addEventListener('mouseenter', function () {
            this.style.borderColor = 'rgba(105,167,255,0.5)';
            this.style.background = 'rgba(0,0,0,0.6)';
            this.style.transform = 'scale(1.02)';
            this.style.boxShadow = '0 12px 50px rgba(0,0,0,0.7)';
        });
        block.addEventListener('mouseleave', function () {
            this.style.borderColor = 'rgba(105,167,255,0.25)';
            this.style.background = 'rgba(0,0,0,0.5)';
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 8px 40px rgba(0,0,0,0.6)';
        });

        // Клик
        block.addEventListener('click', function (e) {
            e.stopPropagation();
            var season = coords ? coords.season : undefined;
            var episode = coords ? coords.episode : undefined;

            if (state.current) {
                rememberEpisodeSelection(card, state.current.episode, 'block-click');
            }

            openLampacBalancer(card, season, episode);
        });

        return block;
    }

    // =============================================
    // УПРАВЛЕНИЕ БЛОКОМ
    // =============================================

    var currentBlock = null;
    var lastState = null;
    var updateTimer = null;
    var currentCard = null;
    var currentData = null;
    var isOnSeriesPage = false;
    var observer = null;

    function removeBlock() {
        var block = document.getElementById('series-info-block');
        if (block && block.parentNode) {
            block.parentNode.removeChild(block);
        }
        currentBlock = null;
    }

    function createRightContainer(render) {
        var right = render.find('.full-start-new__right');
        if (!right.length) {
            return null;
        }

        // Проверяем существующий .applecation__right
        var existingRight = right.find('.applecation__right');
        if (existingRight.length) {
            return existingRight;
        }

        // Создаём .applecation__right
        var newRight = $('<div class="applecation__right"></div>');
        newRight.css({
            'display': 'flex',
            'flex-direction': 'column',
            'align-items': 'flex-end',
            'justify-content': 'flex-end',
            'width': '100%',
            'margin-top': 'auto',
            'padding': '0.5em 0',
            'flex-shrink': '0',
            'min-height': '60px'
        });

        right.append(newRight);

        return newRight;
    }

    function updateBlockWidth() {
        var block = document.getElementById('series-info-block');
        if (!block) return;

        var viewportWidth = getViewportWidth();
        var blockWidth = Math.max(viewportWidth * 0.65, Math.min(viewportWidth * 0.95, 900));
        block.style.width = blockWidth + 'px';
    }

    function insertBlock(card, data) {
        try {
            if (card) {
                currentCard = card;
                currentData = data;
            }

            if (!currentCard) {
                var active = activeActivity();
                if (!active || active.component !== 'full') {
                    isOnSeriesPage = false;
                    removeBlock();
                    return;
                }
                currentCard = active.card || (active.object && active.object.card) || null;
                currentData = active.data || null;
                isOnSeriesPage = true;
            }

            if (!currentCard || mediaType(currentCard) !== 'tv') {
                removeBlock();
                return;
            }

            var settings = getSettings();
            if (!settings.enabled || !settings.show_block) {
                removeBlock();
                return;
            }

            var render = getActiveRender();
            if (!render || !render.length) {
                return;
            }

            // Создаём .applecation__right
            var container = createRightContainer(render);
            if (!container) {
                return;
            }

            // Анализируем просмотр
            var state = resolveSeriesPlayback(currentCard, currentData || {});
            if (!state || !state.current) {
                removeBlock();
                return;
            }

            var cardId = contentId(currentCard);
            var signature = [
                cardId,
                state.current ? episodeCoordinates(state.current.episode).season : '',
                state.current ? episodeCoordinates(state.current.episode).episode : '',
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
                updateBlockWidth();
                return;
            }

            if (existingBlock && existingBlock.getAttribute('data-card-id') !== cardId) {
                removeBlock();
            }

            lastState = signature;
            
            if (document.getElementById('series-info-block')) {
                removeBlock();
            }

            var block = createBlock(state, currentCard);
            if (!block) return;

            container.find('.series-info-block').remove();
            container.append(block);
            currentBlock = block;

        } catch (e) {
            console.error('[Series Manager PRO] Ошибка:', e);
        }
    }

    // =============================================
    // НАБЛЮДАТЕЛЬ ЗА .applecation__left
    // =============================================

    function setupObserver() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    var active = activeActivity();
                    if (active && active.component === 'full') {
                        var render = getActiveRender();
                        if (render && render.length) {
                            var left = render.find('.applecation__left');
                            if (left.length) {
                                var card = active.card || (active.object && active.object.card) || null;
                                var data = active.data || null;
                                
                                var block = document.getElementById('series-info-block');
                                if (!block && card && mediaType(card) === 'tv') {
                                    setTimeout(function() {
                                        insertBlock(card, data);
                                    }, 200);
                                } else if (block) {
                                    updateBlockWidth();
                                }
                            }
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // =============================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // =============================================

    var listenersInstalled = false;

    function onFull(event) {
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

            if (card && mediaType(card) === 'tv') {
                isOnSeriesPage = true;
                clearTimeout(updateTimer);
                updateTimer = setTimeout(function () {
                    insertBlock(card, data);
                }, 300);
            }
        }
    }

    function onTimeline() {
        if (isOnSeriesPage && currentCard) {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(function () {
                var active = activeActivity();
                if (active && active.data) {
                    currentData = active.data;
                }
                insertBlock(currentCard, currentData);
            }, 200);
        }
    }

    function onActivity(event) {
        if (!event || event.type !== 'start') return;

        clearTimeout(updateTimer);
        
        if (event.component === 'full') {
            isOnSeriesPage = true;
            updateTimer = setTimeout(function () {
                insertBlock();
            }, 300);
        } else {
            isOnSeriesPage = false;
        }
    }

    function installListeners() {
        if (listenersInstalled) return;
        if (!window.Lampa || !Lampa.Listener) return;

        listenersInstalled = true;
        Lampa.Listener.follow('full', onFull);
        Lampa.Listener.follow('timeline', onTimeline);
        Lampa.Listener.follow('activity', onActivity);
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

            installListeners();
            setupObserver();

            // Проверяем текущую страницу при старте
            setTimeout(function () {
                var active = activeActivity();
                if (active && active.component === 'full') {
                    var card = active.card || (active.object && active.object.card) || null;
                    var data = active.data || null;
                    if (card && mediaType(card) === 'tv') {
                        isOnSeriesPage = true;
                        insertBlock(card, data);
                    }
                }
            }, 800);

            // Обработчик изменения размера окна
            window.addEventListener('resize', function() {
                updateBlockWidth();
            });

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
                        removeBlock();
                    } else {
                        insertBlock();
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'series_manager_pro',
                param: {
                    name: 'series_manager_pro_show_block',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Показывать блок продолжения'
                },
                onChange: function(value) {
                    var settings = getSettings();
                    settings.show_block = value === 'true' || value === true;
                    setSettings(settings);
                    if (!settings.show_block) {
                        removeBlock();
                    } else {
                        insertBlock();
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
    // API
    // =============================================

    window.__SERIES_MANAGER_PRO__ = {
        version: VERSION,
        update: insertBlock,
        remove: removeBlock,
        openLampac: openLampacBalancer,
        getState: function () {
            return {
                version: VERSION,
                hasBlock: !!document.getElementById('series-info-block'),
                isOnSeriesPage: isOnSeriesPage,
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
