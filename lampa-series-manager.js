/* Series Manager PRO 3.0.0 — Диагностическая версия */
(function () {
    'use strict';

    var VERSION = '3.0.0';
    var MEMORY_KEY = 'series_manager_pro_v3';

    // =============================================
    // ПРОВЕРКА
    // =============================================

    if (typeof Lampa === 'undefined') {
        console.warn('[Series Manager PRO] Lampa не найдена');
        return;
    }

    console.log('[Series Manager PRO] v' + VERSION + ' загружается...');
    console.log('[Series Manager PRO] ДИАГНОСТИЧЕСКАЯ ВЕРСИЯ');

    // =============================================
    // ДИАГНОСТИКА
    // =============================================

    function log(msg, data) {
        console.log('[Series Manager PRO] ' + msg, data || '');
    }

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

    // =============================================
    // УТИЛИТЫ
    // =============================================

    function getCurrentCard() {
        try {
            var active = Lampa.Activity.active();
            if (!active) {
                log('Нет активной активности');
                return null;
            }
            var card = active.card || (active.object && active.object.card) || null;
            log('Получена карточка:', card ? card.title || card.name || card.id : null);
            return card;
        } catch (e) {
            log('Ошибка получения карточки:', e);
            return null;
        }
    }

    function getCurrentData() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return null;
            var data = active.data || null;
            log('Получены данные:', data ? Object.keys(data) : null);
            return data;
        } catch (e) {
            log('Ошибка получения данных:', e);
            return null;
        }
    }

    function getCurrentRender() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return null;
            if (active.activity && typeof active.activity.render === 'function') {
                var render = active.activity.render();
                log('Получен render:', render ? render.length : 0);
                return render;
            }
            log('Нет метода render');
            return null;
        } catch (e) {
            log('Ошибка получения render:', e);
            return null;
        }
    }

    function isTv(card) {
        if (!card) return false;
        var result = !!(card.name || card.original_name || card.first_air_date || card.number_of_seasons);
        log('isTv:', result);
        return result;
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
            log('Память:', parsed);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            log('Ошибка чтения памяти:', error);
            return {};
        }
    }

    function writeMemoryStore(store) {
        try {
            if (window.sessionStorage) {
                window.sessionStorage.setItem(MEMORY_KEY, JSON.stringify(store || {}));
            }
            log('Память сохранена');
        } catch (error) {
            log('Ошибка записи памяти:', error);
        }
    }

    function readSavedEpisode(card) {
        var key = contentId(card);
        if (!key) return null;
        var store = getMemoryStore();
        var value = store[key];
        log('Сохранённая серия:', value);
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
        log('Сериал сохранён:', key, coords);
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
        log('Поиск эпизодов в данных...');
        collectEpisodes(data && data.episodes, collected, 0);
        log('Найдено эпизодов:', collected.length);
        
        var unique = {};
        var result = collected.filter(function (episode) {
            var coordinates = episodeCoordinates(episode);
            if (!coordinates) return false;
            var key = coordinates.season + ':' + coordinates.episode;
            if (unique[key]) return false;
            unique[key] = true;
            return true;
        });
        log('Уникальных эпизодов:', result.length);
        return result.sort(function (left, right) {
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
            log('Ошибка получения таймлайна:', error);
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
    // АНАЛИЗ ПРОСМОТРА
    // =============================================

    function resolveSeriesPlayback(card, data) {
        log('Анализ просмотра...');
        if (!card) {
            log('Нет карточки');
            return { status: 'empty', episodes: [], current: null, next: null, available: [] };
        }

        var episodes = seriesEpisodesFromData(data || {});
        log('Эпизоды из данных:', episodes.length);
        
        var available = episodes.filter(episodeIsAvailable);
        log('Доступные эпизоды:', available.length);
        
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
            log('Поиск по сохранённой серии:', current ? 'найдена' : 'не найдена');
        }

        if (!current) {
            var partial = entries.filter(function (entry) { return entry.timeline.percent > 0 && entry.timeline.percent < 60; });
            if (partial.length) current = partial[partial.length - 1];
            log('Поиск по прогрессу:', current ? 'найдена' : 'не найдена');
        }

        if (!current) {
            var lastWatchedIndex = -1;
            entries.forEach(function (entry, index) {
                if (entry.timeline.percent >= 60) lastWatchedIndex = index;
            });
            current = entries.find(function (entry, index) { return index > lastWatchedIndex && entry.timeline.percent < 60; }) || null;
            log('Поиск последней просмотренной:', current ? 'найдена' : 'не найдена');
        }

        var allWatched = !!entries.length && entries.every(function (entry) { return entry.timeline.percent >= 60; });
        if (!current && entries.length) current = entries[allWatched ? entries.length - 1 : 0];
        log('Текущая серия:', current ? 'найдена' : 'не найдена');

        var currentIndex = current ? entries.indexOf(current) : -1;
        var next = currentIndex >= 0 ? entries.slice(currentIndex + 1).find(function (entry) { return entry.timeline.percent < 60; }) || null : null;

        var seriesTitle = card.title || card.name || card.original_title || card.original_name || '';
        var totalSeasons = card.number_of_seasons || 0;
        var totalEpisodes = card.number_of_episodes || 0;

        log('Результат анализа:', {
            status: !episodes.length ? 'empty' : !entries.length ? 'upcoming' : allWatched ? 'complete' : 'ready',
            hasCurrent: !!current,
            hasNext: !!next
        });

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
                log('Компонент Lampac не найден');
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
            log('Ошибка открытия Lampac:', error);
            return false;
        }
    }

    // =============================================
    // СОЗДАНИЕ БЛОКА
    // =============================================

    function createBlock(state) {
        log('Создание блока...');
        if (!state || !state.current) {
            log('Нет данных для блока');
            return null;
        }

        var settings = getSettings();
        if (!settings.show_block) {
            log('Блок отключен в настройках');
            return null;
        }

        var current = state.current;
        var coords = episodeCoordinates(current.episode);
        var title = formatEpisodeTitle(current.episode);
        var progress = Math.round(current.timeline.percent || 0);
        var remaining = formatRemainingTime(current.timeline);

        log('Данные для блока:', { title, progress, remaining, coords });

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

        // Создаём блок
        var block = document.createElement('div');
        block.className = 'series-info-block';
        block.id = 'series-info-block';
        block.setAttribute('data-status', state.status);
        block.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'width:100%',
            'padding:0.8em 1.2em',
            'border-radius:0.8em',
            'background:rgba(0,0,0,0.25)',
            'border:2px solid #69a7ff',
            'backdrop-filter:blur(8px)',
            '-webkit-backdrop-filter:blur(8px)',
            'transition:all .3s ease',
            'cursor:pointer',
            'color:#f6f8fc',
            'font-family:"SegoeUI",system-ui,sans-serif',
            'font-size:13px',
            'margin-bottom:0.5em'
        ].join(';');

        // Eyebrow
        var eyebrow = document.createElement('div');
        eyebrow.style.cssText = 'font-size:0.5em;text-transform:uppercase;letter-spacing:0.08em;color:#69a7ff;font-weight:600;margin-bottom:0.1em;';
        eyebrow.textContent = '▶ СЕЙЧАС СМОТРИТЕ';
        block.appendChild(eyebrow);

        // Название сериала
        var seriesName = document.createElement('div');
        seriesName.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.5);margin-bottom:0.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        seriesName.textContent = state.seriesTitle || 'Сериал';
        block.appendChild(seriesName);

        // Название серии
        var titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size:0.85em;font-weight:700;color:#fff;margin-bottom:0.1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleEl.textContent = title;
        block.appendChild(titleEl);

        // Мета
        var meta = document.createElement('div');
        meta.style.cssText = 'display:flex;align-items:center;gap:0.5em;flex-wrap:wrap;font-size:0.6em;color:rgba(255,255,255,0.5);';

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

        var statusEl = document.createElement('span');
        statusEl.style.cssText = 'font-size:0.55em;font-weight:700;color:' + statusColor + ';margin-left:auto;';
        statusEl.textContent = statusIcon + ' ' + statusText;
        meta.appendChild(statusEl);

        block.appendChild(meta);

        // Прогресс-бар
        var progressWrap = document.createElement('div');
        progressWrap.style.cssText = 'width:100%;height:3px;border-radius:99em;background:rgba(255,255,255,0.1);margin:0.25em 0 0.05em;overflow:hidden;';
        var progressBar = document.createElement('div');
        progressBar.className = 'sw-progress-bar';
        progressBar.style.cssText = 'height:100%;border-radius:inherit;background:linear-gradient(90deg,#69a7ff,#91beff);transition:width .5s ease;';
        progressBar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        progressWrap.appendChild(progressBar);
        block.appendChild(progressWrap);

        // Подсказка
        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.4em;color:rgba(255,255,255,0.15);text-align:right;margin-top:0.05em;';
        hint.textContent = '↗ Нажмите, чтобы открыть в Lampac';
        block.appendChild(hint);

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

        log('Блок создан');
        return block;
    }

    // =============================================
    // ВСТАВКА БЛОКА
    // =============================================

    var currentBlock = null;
    var lastState = null;
    var updateTimer = null;

    function removeBlock() {
        log('Удаление блока...');
        var block = document.getElementById('series-info-block');
        if (block && block.parentNode) {
            block.parentNode.removeChild(block);
            log('Блок удалён');
        }
        currentBlock = null;
    }

    function insertBlock() {
        log('=== ВСТАВКА БЛОКА ===');
        try {
            // Проверяем, что мы на странице сериала
            var active = Lampa.Activity.active();
            log('Активная активность:', active ? active.component : null);
            if (!active || active.component !== 'full') {
                log('Не на странице сериала');
                removeBlock();
                return;
            }

            var settings = getSettings();
            log('Настройки:', settings);
            if (!settings.enabled || !settings.show_block) {
                log('Блок отключен');
                removeBlock();
                return;
            }

            var card = getCurrentCard();
            if (!card) {
                log('Нет карточки');
                removeBlock();
                return;
            }

            if (!isTv(card)) {
                log('Не сериал');
                removeBlock();
                return;
            }

            var render = getCurrentRender();
            if (!render || !render.length) {
                log('Нет render');
                return;
            }

            log('Рендер найден, ищем контейнер...');

            // Ищем .applecation__right
            var container = render.find('.applecation__right');
            
            // Если нет, создаём
            if (!container.length) {
                log('Нет .applecation__right, создаём...');
                var leftContainer = render.find('.applecation__left');
                if (!leftContainer.length) {
                    leftContainer = render.find('.applecation__wrapper');
                }
                if (!leftContainer.length) {
                    leftContainer = render.find('.full-start-new__right');
                }
                if (!leftContainer.length) {
                    log('Нет подходящего контейнера');
                    return;
                }

                container = $('<div class="applecation__right"></div>');
                container.css({
                    'display': 'flex',
                    'flex-direction': 'column',
                    'flex-shrink': '0',
                    'min-width': '200px',
                    'max-width': '320px',
                    'margin-left': '1.5em'
                });
                leftContainer.after(container);
                log('Контейнер .applecation__right создан');
            }

            var data = getCurrentData();
            var state = resolveSeriesPlayback(card, data || {});
            log('Состояние просмотра:', state.status);

            if (!state || !state.current) {
                log('Нет текущей серии');
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

            log('Сигнатура:', signature);

            // Проверяем существующий блок
            var existingBlock = document.getElementById('series-info-block');
            if (existingBlock && lastState === signature) {
                log('Блок уже есть, обновляем прогресс...');
                var bar = existingBlock.querySelector('.sw-progress-bar');
                if (bar && state.current) {
                    var progress = Math.round(state.current.timeline.percent || 0);
                    bar.style.width = Math.max(0, Math.min(100, progress)) + '%';
                    log('Прогресс обновлён:', progress + '%');
                }
                return;
            }

            lastState = signature;
            removeBlock();

            var block = createBlock(state);
            if (!block) {
                log('Не удалось создать блок');
                return;
            }

            // Очищаем контейнер и вставляем блок
            container.empty();
            container.append(block);
            currentBlock = block;

            log('=== БЛОК УСПЕШНО ВСТАВЛЕН ===');
            log('ID блока:', block.id);
            log('Классы блока:', block.className);

        } catch (e) {
            log('ОШИБКА ВСТАВКИ БЛОКА:', e);
            console.error(e.stack);
        }
    }

    // =============================================
    // СОБЫТИЯ
    // =============================================

    function onFull(event) {
        log('Событие full:', event ? event.type : null);
        if (!event) return;
        if (event.type === 'complite' || event.type === 'start' || event.type === 'build') {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(insertBlock, 800);
        }
    }

    function onTimeline() {
        log('Событие timeline');
        clearTimeout(updateTimer);
        updateTimer = setTimeout(insertBlock, 300);
    }

    function onActivity(event) {
        log('Событие activity:', event ? event.type : null, event ? event.component : null);
        if (!event || event.type !== 'start') return;
        clearTimeout(updateTimer);
        if (event.component === 'full') {
            updateTimer = setTimeout(insertBlock, 1000);
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
            log('Запуск плагина...');
            if (!Lampa || !Lampa.Listener) {
                log('Lampa.Listener не доступен, повтор через 200ms');
                setTimeout(start, 200);
                return;
            }

            log('Подписка на события...');
            Lampa.Listener.follow('full', onFull);
            Lampa.Listener.follow('timeline', onTimeline);
            Lampa.Listener.follow('activity', onActivity);

            log('Первая проверка через 1.5 секунды...');
            setTimeout(insertBlock, 1500);

            // Дополнительная проверка через 3 секунды
            setTimeout(insertBlock, 3000);

            log('[Series Manager PRO] v' + VERSION + ' запущен (диагностическая версия)');

        } catch (e) {
            log('ОШИБКА ЗАПУСКА:', e);
            console.error(e.stack);
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
