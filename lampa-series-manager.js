/* Series Manager PRO 2.7.0 — Блок в .applecation__right */
(function () {
    'use strict';

    var VERSION = '2.7.0';
    var MEMORY_KEY = 'series_manager_pro_v2';

    // =============================================
    // ПРОВЕРКА ЗАГРУЗКИ
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

    function getCurrentCard() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return null;
            return active.card || (active.object && active.object.card) || null;
        } catch (e) {
            return null;
        }
    }

    function getCurrentData() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return null;
            return active.data || null;
        } catch (e) {
            return null;
        }
    }

    function getCurrentRender() {
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

    function isTv(card) {
        if (!card) return false;
        return !!(card.name || card.original_name || card.first_air_date || card.number_of_seasons);
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
        var memory = readSavedEpisode(card);
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

        var seriesTitle = card.title || card.name || card.original_title || card.original_name || '';
        var totalSeasons = card.number_of_seasons || 0;
        var totalEpisodes = card.number_of_episodes || 0;

        return {
            card: card,
            seriesTitle: seriesTitle,
            totalSeasons: totalSeasons,
            totalEpisodes: totalEpisodes,
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
    // СОЗДАНИЕ БЛОКА (как в Lampa Modern UI)
    // =============================================

    function createBlock(state) {
        if (!state || !state.current) return null;

        var settings = getSettings();
        if (!settings.show_block) return null;

        var current = state.current;
        var coords = episodeCoordinates(current.episode);
        var title = formatEpisodeTitle(current.episode);
        var progress = Math.round(current.timeline.percent || 0);
        var remaining = formatRemainingTime(current.timeline);

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

        // Основной блок
        var block = document.createElement('div');
        block.className = 'series-info-block';
        block.setAttribute('data-status', state.status);
        block.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'width:100%',
            'padding:0.8em 1.2em',
            'border-radius:0.8em',
            'background:rgba(0,0,0,0.25)',
            'border:1px solid rgba(255,255,255,0.06)',
            'backdrop-filter:blur(8px)',
            '-webkit-backdrop-filter:blur(8px)',
            'transition:all .3s ease',
            'cursor:pointer',
            'color:#f6f8fc',
            'font-family:"SegoeUI",system-ui,sans-serif',
            'font-size:13px'
        ].join(';');

        // Заголовок
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.15em;';

        var label = document.createElement('span');
        label.style.cssText = 'font-size:0.5em;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.25);font-weight:600;';
        label.textContent = 'Продолжить просмотр';
        header.appendChild(label);

        var statusEl = document.createElement('span');
        statusEl.style.cssText = 'font-size:0.5em;font-weight:700;color:' + statusColor + ';';
        statusEl.textContent = statusIcon + ' ' + statusText;
        header.appendChild(statusEl);

        // Название сериала
        var seriesName = document.createElement('div');
        seriesName.style.cssText = 'font-size:0.6em;color:rgba(255,255,255,0.25);margin-bottom:0.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        seriesName.textContent = state.seriesTitle || 'Сериал';

        // Название серии
        var titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size:0.85em;font-weight:700;color:#fff;margin-bottom:0.1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleEl.textContent = title;

        // Мета
        var meta = document.createElement('div');
        meta.style.cssText = 'display:flex;align-items:center;gap:0.5em;flex-wrap:wrap;font-size:0.6em;color:rgba(255,255,255,0.35);';

        if (coords) {
            var seasonText = document.createElement('span');
            seasonText.textContent = 'Сезон ' + coords.season + ' · Эпизод ' + coords.episode;
            meta.appendChild(seasonText);
        }

        if (progress > 0) {
            var progressText = document.createElement('span');
            progressText.textContent = progress + '%';
            meta.appendChild(progressText);
        }

        if (remaining) {
            var remainingEl = document.createElement('span');
            remainingEl.textContent = '⏱ ' + remaining;
            meta.appendChild(remainingEl);
        }

        // Прогресс-бар
        var progressWrap = document.createElement('div');
        progressWrap.style.cssText = 'width:100%;height:2px;border-radius:99em;background:rgba(255,255,255,0.05);margin:0.25em 0 0.05em;overflow:hidden;';
        var progressBar = document.createElement('div');
        progressBar.style.cssText = 'height:100%;border-radius:inherit;background:linear-gradient(90deg,#69a7ff,#91beff);transition:width .5s ease;';
        progressBar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        progressWrap.appendChild(progressBar);

        // Подсказка
        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.4em;color:rgba(255,255,255,0.06);text-align:right;margin-top:0.05em;';
        hint.textContent = '↗ Открыть в Lampac';

        block.appendChild(header);
        block.appendChild(seriesName);
        block.appendChild(titleEl);
        block.appendChild(meta);
        block.appendChild(progressWrap);
        block.appendChild(hint);

        // Ховер
        block.addEventListener('mouseenter', function () {
            this.style.borderColor = 'rgba(105,167,255,0.2)';
            this.style.background = 'rgba(0,0,0,0.35)';
        });
        block.addEventListener('mouseleave', function () {
            this.style.borderColor = 'rgba(255,255,255,0.06)';
            this.style.background = 'rgba(0,0,0,0.25)';
        });

        // Клик
        block.addEventListener('click', function (e) {
            e.stopPropagation();
            var card = state.card;
            var season = coords ? coords.season : undefined;
            var episode = coords ? coords.episode : undefined;

            if (state.current) {
                saveEpisode(card, state.current.episode, 'block-click');
            }

            openLampacBalancer(card, season, episode);
        });

        return block;
    }

    // =============================================
    // ВСТАВКА В .applecation__right
    // =============================================

    var currentBlock = null;
    var lastState = null;
    var updateTimer = null;

    function removeBlock() {
        if (currentBlock && currentBlock.parentNode) {
            currentBlock.parentNode.removeChild(currentBlock);
        }
        currentBlock = null;
        var blocks = document.querySelectorAll('.series-info-block');
        blocks.forEach(function (b) {
            if (b.parentNode) {
                b.parentNode.removeChild(b);
            }
        });
    }

    function insertBlock() {
        try {
            // Проверяем, что мы на странице сериала
            var active = Lampa.Activity.active();
            if (!active || active.component !== 'full') {
                removeBlock();
                return;
            }

            var settings = getSettings();
            if (!settings.enabled || !settings.show_block) {
                removeBlock();
                return;
            }

            var card = getCurrentCard();
            if (!card || !isTv(card)) {
                removeBlock();
                return;
            }

            var render = getCurrentRender();
            if (!render || !render.length) {
                return;
            }

            // Ищем .applecation__right
            var rightContainer = render.find('.applecation__right');
            
            // Если нет .applecation__right, создаём его
            if (!rightContainer.length) {
                // Ищем .applecation__left или .applecation__wrapper
                var leftContainer = render.find('.applecation__left');
                if (!leftContainer.length) {
                    leftContainer = render.find('.applecation__wrapper');
                }
                if (!leftContainer.length) {
                    leftContainer = render.find('.full-start-new__right');
                }
                if (!leftContainer.length) {
                    return;
                }

                // Создаём .applecation__right
                rightContainer = $('<div class="applecation__right"></div>');
                rightContainer.css({
                    'display': 'flex',
                    'flex-direction': 'column',
                    'flex-shrink': '0',
                    'min-width': '200px',
                    'max-width': '320px',
                    'margin-left': '1.5em'
                });
                leftContainer.after(rightContainer);
            }

            var data = getCurrentData();
            var state = resolveSeriesPlayback(card, data || {});
            if (!state || !state.current) {
                removeBlock();
                return;
            }

            var signature = [
                contentId(card),
                state.current ? episodeCoordinates(state.current.episode).season : '',
                state.current ? episodeCoordinates(state.current.episode).episode : '',
                Math.round(state.current.timeline.percent || 0),
                state.status
            ].join('|');

            // Проверяем существующий блок
            var existingBlock = rightContainer.find('.series-info-block');
            if (existingBlock.length && lastState === signature) {
                // Обновляем прогресс
                var bar = existingBlock.find('.sw-progress-bar');
                if (bar.length && state.current) {
                    var progress = Math.round(state.current.timeline.percent || 0);
                    bar.css('width', Math.max(0, Math.min(100, progress)) + '%');
                    
                    var statusEl = existingBlock.find('.sw-status');
                    if (statusEl.length) {
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
                        statusEl.text(statusIcon + ' ' + statusText);
                        statusEl.css('color', statusColor);
                    }
                    
                    var remaining = formatRemainingTime(state.current.timeline);
                    var remainingEl = existingBlock.find('.sw-remaining');
                    if (remainingEl.length) {
                        remainingEl.text(remaining ? '⏱ ' + remaining : '');
                    }
                }
                return;
            }

            lastState = signature;
            removeBlock();

            var block = createBlock(state);
            if (!block) return;

            // Очищаем .applecation__right и вставляем блок
            rightContainer.empty();
            rightContainer.append(block);
            currentBlock = block;

            console.log('[Series Manager PRO] Блок добавлен в .applecation__right');

        } catch (e) {
            console.error('[Series Manager PRO] Ошибка:', e);
        }
    }

    // =============================================
    // СОБЫТИЯ
    // =============================================

    function onFull(event) {
        if (!event) return;
        if (event.type === 'complite' || event.type === 'start' || event.type === 'build') {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(insertBlock, 500);
        }
    }

    function onTimeline() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(insertBlock, 300);
    }

    function onActivity(event) {
        if (!event || event.type !== 'start') return;
        clearTimeout(updateTimer);
        if (event.component === 'full') {
            updateTimer = setTimeout(insertBlock, 600);
        } else {
            removeBlock();
            lastState = null;
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

            setTimeout(insertBlock, 1200);

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
                hasBlock: !!currentBlock,
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
