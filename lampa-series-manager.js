/* Series Manager PRO 2.2.0 — Простая и надёжная версия */
(function () {
    'use strict';

    var VERSION = '2.2.0';
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
    // ПОИСК ПОСЛЕДНЕЙ СЕРИИ (ПРОСТАЯ ВЕРСИЯ)
    // =============================================

    function findLastEpisode(card, data) {
        if (!card) return null;

        var episodes = getEpisodes(data);
        if (!episodes || episodes.length === 0) return null;

        // Сортируем по сезону и серии
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
                    // Если >= 89% — ищем следующую
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

        // 3. Ищем последнюю полностью просмотренную (>= 89%)
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

        // 4. Берём первую доступную серию
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
    // ВИДЖЕТ
    // =============================================

    var widgetElement = null;
    var currentCardId = null;
    var currentEpisodeKey = null;

    function removeWidget() {
        if (widgetElement && widgetElement.parentNode) {
            widgetElement.parentNode.removeChild(widgetElement);
        }
        widgetElement = null;
        var style = document.getElementById('series-widget-styles');
        if (style) style.remove();
    }

    function createWidget(card, episode) {
        if (!card || !episode) return null;

        var coords = getEpisodeCoords(episode);
        var title = formatEpisode(episode);
        var progress = getProgress(card, episode);
        var timeline = getTimeline(card, episode);
        var remaining = getRemaining(timeline);

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
        removeWidget();

        var widget = document.createElement('div');
        widget.id = 'series-widget';
        widget.className = 'series-widget';
        widget.style.cssText = [
            'position:fixed!important',
            'bottom:2.5em!important',
            'right:2.5em!important',
            'z-index:9999!important',
            'max-width:380px!important',
            'min-width:220px!important',
            'padding:0.8em 1.2em!important',
            'border-radius:1em!important',
            'background:rgba(7,10,16,0.94)!important',
            'backdrop-filter:blur(20px)!important',
            'border:2px solid rgba(105,167,255,0.2)!important',
            'box-shadow:0 1.2em 4em rgba(0,0,0,0.8)!important',
            'color:#f6f8fc!important',
            'font-family:system-ui,sans-serif!important',
            'font-size:14px!important',
            'cursor:pointer!important',
            'transition:opacity .3s ease,transform .3s ease!important',
            'animation:fadeIn .4s ease!important'
        ].join(';');

        // Анимация
        var style = document.createElement('style');
        style.id = 'series-widget-styles';
        style.textContent = '@keyframes fadeIn{0%{opacity:0;transform:translateY(20px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}';
        document.head.appendChild(style);

        // Название сериала
        var seriesName = document.createElement('div');
        seriesName.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.35);margin-bottom:0.1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        seriesName.textContent = seriesTitle;

        // Заголовок
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.15em;';

        var titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size:1em;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleEl.textContent = title;
        header.appendChild(titleEl);

        var statusEl = document.createElement('span');
        statusEl.style.cssText = 'font-size:0.6em;padding:0.15em 0.6em;border-radius:99em;background:rgba(105,167,255,0.15);color:#69a7ff;font-weight:700;white-space:nowrap;flex-shrink:0;margin-left:0.5em;';
        statusEl.textContent = statusIcon + ' ' + statusText;
        header.appendChild(statusEl);

        // Мета
        var meta = document.createElement('div');
        meta.style.cssText = 'font-size:0.75em;color:rgba(255,255,255,0.45);display:flex;align-items:center;gap:0.5em;flex-wrap:wrap;margin-bottom:0.1em;';

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
            var remainingText = document.createElement('span');
            remainingText.textContent = '⏱ ' + remaining;
            meta.appendChild(remainingText);
        }

        // Прогресс-бар
        var barWrap = document.createElement('div');
        barWrap.style.cssText = 'width:100%;height:3px;border-radius:99em;background:rgba(255,255,255,0.06);margin:0.3em 0 0.1em;overflow:hidden;';
        var bar = document.createElement('div');
        bar.style.cssText = 'height:100%;border-radius:inherit;background:linear-gradient(90deg,#69a7ff,#91beff);transition:width .5s ease;';
        bar.style.width = Math.min(100, progress) + '%';
        barWrap.appendChild(bar);

        // Подсказка
        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.55em;color:rgba(255,255,255,0.1);text-align:right;margin-top:0.05em;';
        hint.textContent = '↗ Открыть в Lampac';

        widget.appendChild(seriesName);
        widget.appendChild(header);
        widget.appendChild(meta);
        widget.appendChild(barWrap);
        widget.appendChild(hint);

        // Ховер
        widget.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.02)';
            this.style.borderColor = 'rgba(105,167,255,0.45)';
        });
        widget.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1)';
            this.style.borderColor = 'rgba(105,167,255,0.2)';
        });

        // Клик
        widget.addEventListener('click', function (e) {
            e.stopPropagation();
            if (coords) {
                saveEpisode(card, episode);
                openLampac(card, coords.season, coords.episode);
            }
        });

        widgetElement = widget;
        return widget;
    }

    // =============================================
    // ОБНОВЛЕНИЕ ВИДЖЕТА
    // =============================================

    var updateTimer = null;

    function updateWidget() {
        try {
            // Проверяем, что мы на странице сериала
            var active = Lampa.Activity.active();
            if (!active || active.component !== 'full') {
                removeWidget();
                return;
            }

            var card = getCurrentCard();
            if (!card || !isTv(card)) {
                removeWidget();
                return;
            }

            var cardId = getContentId(card);
            var data = getCurrentData();
            var episode = findLastEpisode(card, data || {});

            if (!episode) {
                removeWidget();
                return;
            }

            var episodeKey = getContentId(card) + ':' + (episode.season_number || episode.season || 0) + ':' + (episode.episode_number || episode.episode || 0);
            
            // Проверяем, изменилась ли серия
            if (currentCardId !== cardId || currentEpisodeKey !== episodeKey) {
                currentCardId = cardId;
                currentEpisodeKey = episodeKey;
                var widget = createWidget(card, episode);
                if (widget) {
                    removeWidget();
                    document.body.appendChild(widget);
                    widgetElement = widget;
                }
            } else {
                // Обновляем прогресс-бар
                if (widgetElement) {
                    var progress = getProgress(card, episode);
                    var bar = widgetElement.querySelector('.sw-progress-bar');
                    if (bar) {
                        bar.style.width = Math.min(100, progress) + '%';
                    }
                    var statusEl = widgetElement.querySelector('.sw-status');
                    if (statusEl) {
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
                        statusEl.textContent = statusIcon + ' ' + statusText;
                    }
                    var timeline = getTimeline(card, episode);
                    var remaining = getRemaining(timeline);
                    var remainingEl = widgetElement.querySelector('.sw-remaining');
                    if (remainingEl) {
                        remainingEl.textContent = remaining ? '⏱ ' + remaining : '';
                    }
                }
            }

        } catch (e) {
            console.error('[Series Manager PRO] Ошибка обновления:', e);
        }
    }

    // =============================================
    // СОБЫТИЯ
    // =============================================

    function onFull(event) {
        if (!event) return;
        if (event.type === 'complite' || event.type === 'start') {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(updateWidget, 400);
        }
    }

    function onTimeline() {
        if (widgetElement) {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(updateWidget, 300);
        }
    }

    function onActivity(event) {
        if (!event || event.type !== 'start') return;
        clearTimeout(updateTimer);
        updateTimer = setTimeout(updateWidget, 500);
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

            setTimeout(updateWidget, 1000);

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
        openLampac: openLampac,
        getState: function () {
            return {
                version: VERSION,
                hasWidget: !!widgetElement && !!widgetElement.parentNode,
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
