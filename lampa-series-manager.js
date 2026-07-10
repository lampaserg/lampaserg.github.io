/* Series Manager PRO 2.4.0 — Блок справа от информации */
(function () {
    'use strict';

    var VERSION = '2.4.0';
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
    // ПРОСТЫЕ УТИЛИТЫ
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

    function getContentId(card) {
        if (!card) return '';
        return 'tv:' + (card.source || 'tmdb') + ':' + String(card.id || '');
    }

    function getEpisodeCoords(episode) {
        if (!episode) return null;
        var season = episode.season_number || episode.season || 0;
        var number = episode.episode_number || episode.episode || 0;
        if (season < 0 || number < 1) return null;
        return { season: Number(season), episode: Number(number) };
    }

    function formatEpisode(episode) {
        var coords = getEpisodeCoords(episode);
        if (!coords) return '';
        var s = String(coords.season).padStart(2, '0');
        var e = String(coords.episode).padStart(2, '0');
        var name = episode && episode.name ? ' · ' + episode.name : '';
        return 'S' + s + ' E' + e + name;
    }

    function formatEpisodeShort(episode) {
        var coords = getEpisodeCoords(episode);
        if (!coords) return '';
        return 'S' + String(coords.season).padStart(2, '0') + ' E' + String(coords.episode).padStart(2, '0');
    }

    function getProgress(card, episode) {
        try {
            if (!card || !episode) return 0;
            var coords = getEpisodeCoords(episode);
            if (!coords) return 0;
            if (Lampa.Timeline && typeof Lampa.Timeline.watchedEpisode === 'function') {
                var data = Lampa.Timeline.watchedEpisode(card, coords.season, coords.episode, true);
                if (data && data.percent) return Math.round(data.percent);
            }
        } catch (e) {}
        return 0;
    }

    function getTimeline(card, episode) {
        var coords = getEpisodeCoords(episode);
        if (!coords) return { percent: 0, time: 0, duration: 0 };
        try {
            if (Lampa.Timeline && typeof Lampa.Timeline.watchedEpisode === 'function') {
                var data = Lampa.Timeline.watchedEpisode(card, coords.season, coords.episode, true);
                if (data) {
                    return {
                        percent: data.percent || 0,
                        time: data.time || 0,
                        duration: data.duration || 0
                    };
                }
            }
        } catch (e) {}
        return { percent: 0, time: 0, duration: 0 };
    }

    function getRemaining(timeline) {
        if (!timeline || !timeline.duration) return '';
        var seconds = Math.max(0, timeline.duration - (timeline.time || 0));
        var minutes = Math.round(seconds / 60);
        if (minutes < 1) return '';
        if (minutes < 60) return minutes + ' мин';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return hours + ' ч' + (rest > 0 ? ' ' + rest + ' мин' : '');
    }

    function getEpisodes(data) {
        try {
            if (data && data.episodes && Array.isArray(data.episodes)) {
                return data.episodes;
            }
            if (data && data.episodes && data.episodes.episodes) {
                return data.episodes.episodes;
            }
            if (data && data.movie && data.movie.seasons) {
                var all = [];
                for (var i = 0; i < data.movie.seasons.length; i++) {
                    if (data.movie.seasons[i].episodes) {
                        all = all.concat(data.movie.seasons[i].episodes);
                    }
                }
                return all;
            }
        } catch (e) {}
        return [];
    }

    // =============================================
    // ПАМЯТЬ
    // =============================================

    function getMemory() {
        try {
            var raw = sessionStorage.getItem(MEMORY_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function setMemory(data) {
        try {
            sessionStorage.setItem(MEMORY_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function getSaved(card) {
        var key = getContentId(card);
        if (!key) return null;
        var mem = getMemory();
        return mem[key] || null;
    }

    function saveEpisode(card, episode) {
        var coords = getEpisodeCoords(episode);
        var key = getContentId(card);
        if (!key || !coords) return;
        var mem = getMemory();
        mem[key] = {
            season: coords.season,
            episode: coords.episode,
            updated: Date.now()
        };
        setMemory(mem);
    }

    // =============================================
    // ПОИСК ПОСЛЕДНЕЙ СЕРИИ
    // =============================================

    function findLastEpisode(card, data) {
        if (!card) return null;

        var episodes = getEpisodes(data);
        if (!episodes || episodes.length === 0) return null;

        episodes.sort(function (a, b) {
            var ca = getEpisodeCoords(a);
            var cb = getEpisodeCoords(b);
            if (!ca || !cb) return 0;
            if (ca.season !== cb.season) return ca.season - cb.season;
            return ca.episode - cb.episode;
        });

        // 1. Проверяем сохранённую серию
        var saved = getSaved(card);
        if (saved) {
            for (var i = 0; i < episodes.length; i++) {
                var coords = getEpisodeCoords(episodes[i]);
                if (coords && coords.season === saved.season && coords.episode === saved.episode) {
                    var progress = getProgress(card, episodes[i]);
                    if (progress >= 89) {
                        var nextIndex = i + 1;
                        if (nextIndex < episodes.length) {
                            return episodes[nextIndex];
                        }
                        return episodes[i];
                    }
                    return episodes[i];
                }
            }
        }

        // 2. Ищем серию с прогрессом 1-89%
        var bestEpisode = null;
        var bestProgress = 0;
        for (var j = 0; j < episodes.length; j++) {
            var progress = getProgress(card, episodes[j]);
            if (progress > 0 && progress < 89) {
                if (progress > bestProgress) {
                    bestProgress = progress;
                    bestEpisode = episodes[j];
                }
            }
        }
        if (bestEpisode) return bestEpisode;

        // 3. Ищем последнюю полностью просмотренную
        var lastWatched = null;
        var lastIndex = -1;
        for (var k = 0; k < episodes.length; k++) {
            var prog = getProgress(card, episodes[k]);
            if (prog >= 89) {
                lastWatched = episodes[k];
                lastIndex = k;
            }
        }
        if (lastWatched && lastIndex < episodes.length - 1) {
            return episodes[lastIndex + 1];
        }

        return episodes[0];
    }

    // =============================================
    // ОТКРЫТИЕ LAMPAC
    // =============================================

    function openLampac(card, season, episode) {
        try {
            if (!card) return false;

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

            var id = Lampa.Utils.hash(card.original_name || card.original_title || '');
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
        } catch (e) {
            console.error('[Series Manager PRO] Ошибка открытия Lampac:', e);
            return false;
        }
    }

    // =============================================
    // СОЗДАНИЕ БЛОКА
    // =============================================

    function createInfoBlock(card, episode) {
        if (!card || !episode) return null;

        var coords = getEpisodeCoords(episode);
        var title = formatEpisode(episode);
        var shortTitle = formatEpisodeShort(episode);
        var progress = getProgress(card, episode);
        var timeline = getTimeline(card, episode);
        var remaining = getRemaining(timeline);

        var seriesTitle = card.title || card.name || card.original_title || card.original_name || '';

        var statusText = '';
        var statusColor = '';
        if (progress >= 89) {
            statusText = '✓ Просмотрено';
            statusColor = '#2ecc71';
        } else if (progress > 0 && progress < 89) {
            statusText = '▶ Продолжить';
            statusColor = '#69a7ff';
        } else {
            statusText = '▶ Смотреть';
            statusColor = '#69a7ff';
        }

        // Основной контейнер блока
        var block = document.createElement('div');
        block.className = 'series-info-block';
        block.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'justify-content:flex-end',
            'min-width:220px',
            'max-width:320px',
            'margin-left:2em',
            'padding:1em 1.2em',
            'border-radius:0.8em',
            'background:rgba(0,0,0,0.3)',
            'border:1px solid rgba(255,255,255,0.06)',
            'backdrop-filter:blur(10px)',
            '-webkit-backdrop-filter:blur(10px)',
            'transition:all .3s ease',
            'cursor:pointer',
            'flex-shrink:0'
        ].join(';');

        // Заголовок блока
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.2em;';

        var label = document.createElement('span');
        label.style.cssText = 'font-size:0.55em;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.3);font-weight:600;';
        label.textContent = 'Продолжить';
        header.appendChild(label);

        var status = document.createElement('span');
        status.style.cssText = 'font-size:0.55em;font-weight:700;color:' + statusColor + ';';
        status.textContent = statusText;
        header.appendChild(status);

        // Название сериала
        var seriesEl = document.createElement('div');
        seriesEl.style.cssText = 'font-size:0.65em;color:rgba(255,255,255,0.3);margin-bottom:0.1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        seriesEl.textContent = seriesTitle;

        // Название серии
        var titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size:0.85em;font-weight:700;color:#fff;margin-bottom:0.15em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleEl.textContent = title;

        // Мета-информация
        var meta = document.createElement('div');
        meta.style.cssText = 'display:flex;align-items:center;gap:0.6em;flex-wrap:wrap;font-size:0.65em;color:rgba(255,255,255,0.4);';

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
            var remainingText = document.createElement('span');
            remainingText.textContent = '⏱ ' + remaining;
            meta.appendChild(remainingText);
        }

        // Прогресс-бар
        var barWrap = document.createElement('div');
        barWrap.style.cssText = 'width:100%;height:2px;border-radius:99em;background:rgba(255,255,255,0.05);margin:0.3em 0 0.05em;overflow:hidden;';
        var bar = document.createElement('div');
        bar.style.cssText = 'height:100%;border-radius:inherit;background:linear-gradient(90deg,#69a7ff,#91beff);transition:width .5s ease;';
        bar.style.width = Math.min(100, progress) + '%';
        barWrap.appendChild(bar);

        // Подсказка
        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.45em;color:rgba(255,255,255,0.08);text-align:right;margin-top:0.05em;';
        hint.textContent = '↗ Открыть в Lampac';

        block.appendChild(header);
        block.appendChild(seriesEl);
        block.appendChild(titleEl);
        block.appendChild(meta);
        block.appendChild(barWrap);
        block.appendChild(hint);

        // Ховер
        block.addEventListener('mouseenter', function () {
            this.style.borderColor = 'rgba(105,167,255,0.25)';
            this.style.background = 'rgba(0,0,0,0.4)';
        });
        block.addEventListener('mouseleave', function () {
            this.style.borderColor = 'rgba(255,255,255,0.06)';
            this.style.background = 'rgba(0,0,0,0.3)';
        });

        // Клик
        block.addEventListener('click', function (e) {
            e.stopPropagation();
            if (coords) {
                saveEpisode(card, episode);
                openLampac(card, coords.season, coords.episode);
            }
        });

        return block;
    }

    // =============================================
    // ВСТАВКА БЛОКА СПРАВА
    // =============================================

    var currentBlock = null;
    var currentEpisodeKey = null;

    function removeBlock() {
        if (currentBlock && currentBlock.parentNode) {
            currentBlock.parentNode.removeChild(currentBlock);
        }
        currentBlock = null;
        currentEpisodeKey = null;
    }

    function insertBlock() {
        try {
            var settings = getSettings();
            if (!settings.enabled) {
                removeBlock();
                return;
            }

            var active = Lampa.Activity.active();
            if (!active || active.component !== 'full') {
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

            // Ищем контейнер .applecation__wrapper или .applecation__left
            var wrapper = render.find('.applecation__wrapper');
            if (!wrapper.length) {
                wrapper = render.find('.applecation__left');
            }
            if (!wrapper.length) {
                wrapper = render.find('.full-start-new__right');
            }
            if (!wrapper.length) {
                return;
            }

            // Ищем блок информации, чтобы вставить справа от него
            var infoBlock = render.find('.applecation__content-wrapper');
            
            // Если есть infoBlock, вставляем рядом
            if (infoBlock.length) {
                var parent = infoBlock.parent();
                // Проверяем, есть ли уже наш блок
                var existing = parent.find('.series-info-block');
                if (existing.length) {
                    // Обновляем существующий блок
                    var data = getCurrentData();
                    var episode = findLastEpisode(card, data || {});
                    if (!episode) {
                        removeBlock();
                        return;
                    }
                    
                    var episodeKey = getContentId(card) + ':' + (episode.season_number || episode.season || 0) + ':' + (episode.episode_number || episode.episode || 0);
                    if (currentEpisodeKey === episodeKey) {
                        // Обновляем прогресс
                        var progress = getProgress(card, episode);
                        var bar = existing.find('.series-info-block .sw-progress-bar');
                        if (bar.length) {
                            bar.css('width', Math.min(100, progress) + '%');
                        }
                        var statusEl = existing.find('.series-info-block .sw-status');
                        if (statusEl.length) {
                            var statusText = '';
                            var statusColor = '';
                            if (progress >= 89) {
                                statusText = '✓ Просмотрено';
                                statusColor = '#2ecc71';
                            } else if (progress > 0 && progress < 89) {
                                statusText = '▶ Продолжить';
                                statusColor = '#69a7ff';
                            } else {
                                statusText = '▶ Смотреть';
                                statusColor = '#69a7ff';
                            }
                            statusEl.text(statusText);
                            statusEl.css('color', statusColor);
                        }
                        return;
                    }
                    
                    // Если серия изменилась, удаляем старый блок
                    existing.remove();
                }

                // Создаём новый блок
                var data = getCurrentData();
                var episode = findLastEpisode(card, data || {});

                if (!episode) {
                    removeBlock();
                    return;
                }

                var episodeKey = getContentId(card) + ':' + (episode.season_number || episode.season || 0) + ':' + (episode.episode_number || episode.episode || 0);
                var block = createInfoBlock(card, episode);
                if (!block) return;

                block._episodeKey = episodeKey;
                currentEpisodeKey = episodeKey;

                // Вставляем блок справа от infoBlock
                infoBlock.after(block);
                currentBlock = block;

                // Добавляем стили для flex-контейнера
                parent.css('display', 'flex');
                parent.css('align-items', 'flex-end');
                parent.css('flex-wrap', 'wrap');
                parent.css('gap', '1em');

                console.log('[Series Manager PRO] Блок добавлен справа');

            } else {
                // Если нет infoBlock, вставляем в конец wrapper
                var data = getCurrentData();
                var episode = findLastEpisode(card, data || {});
                if (!episode) {
                    removeBlock();
                    return;
                }

                var block = createInfoBlock(card, episode);
                if (!block) return;

                wrapper.append(block);
                currentBlock = block;

                console.log('[Series Manager PRO] Блок добавлен в конец');
            }

        } catch (e) {
            console.error('[Series Manager PRO] Ошибка вставки блока:', e);
        }
    }

    // =============================================
    // СОБЫТИЯ
    // =============================================

    var updateTimer = null;

    function onFull(event) {
        if (!event) return;
        if (event.type === 'complite' || event.type === 'start') {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(insertBlock, 400);
        }
    }

    function onTimeline() {
        if (currentBlock) {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(insertBlock, 300);
        }
    }

    function onActivity(event) {
        if (!event || event.type !== 'start') return;
        clearTimeout(updateTimer);
        updateTimer = setTimeout(insertBlock, 500);
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

            setTimeout(insertBlock, 1000);

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
                    name: 'Включить блок продолжения'
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
        openLampac: openLampac,
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
