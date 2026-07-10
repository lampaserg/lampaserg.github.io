/* Series Manager Widget 1.0.0 — Для темы от SERG */
(function () {
    'use strict';

    var VERSION = '1.0.0';
    var MEMORY_KEY = 'series_manager_widget_v1';
    var WIDGET_ID = 'series-manager-widget';

    // =============================================
    // ПРОВЕРКА
    // =============================================

    if (typeof Lampa === 'undefined') {
        console.warn('[Series Widget] Lampa не найдена');
        return;
    }

    console.log('[Series Widget] v' + VERSION + ' загружается...');

    // =============================================
    // УТИЛИТЫ
    // =============================================

    function getCard() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return null;
            return active.card || (active.object && active.object.card) || null;
        } catch (e) {
            return null;
        }
    }

    function getData() {
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
                data.movie.seasons.forEach(function(s) {
                    if (s.episodes) all = all.concat(s.episodes);
                });
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

        // Сортируем
        episodes.sort(function (a, b) {
            var ca = getEpisodeCoords(a);
            var cb = getEpisodeCoords(b);
            if (!ca || !cb) return 0;
            if (ca.season !== cb.season) return ca.season - cb.season;
            return ca.episode - cb.episode;
        });

        // Проверяем сохранённую
        var saved = getSaved(card);
        var result = null;

        if (saved) {
            for (var i = 0; i < episodes.length; i++) {
                var coords = getEpisodeCoords(episodes[i]);
                if (coords && coords.season === saved.season && coords.episode === saved.episode) {
                    result = episodes[i];
                    break;
                }
            }
        }

        // Если не нашли — ищем с прогрессом
        if (!result) {
            var maxProgress = 0;
            for (var j = 0; j < episodes.length; j++) {
                var progress = getProgress(card, episodes[j]);
                if (progress > 0 && progress < 89) {
                    if (progress > maxProgress) {
                        maxProgress = progress;
                        result = episodes[j];
                    }
                }
            }
        }

        // Если всё ещё нет — берём первую
        if (!result && episodes.length > 0) {
            result = episodes[0];
        }

        return result;
    }

    // =============================================
    // ОТКРЫТИЕ LAMPAC
    // =============================================

    function openLampac(card, season, episode) {
        try {
            if (!card) return false;

            // Проверяем, что компонент Lampac существует
            if (!Lampa.Component || !Lampa.Component.get) {
                console.warn('[Series Widget] Lampa.Component не найден');
                return false;
            }

            var LampacComponent = Lampa.Component.get('lampac');
            if (!LampacComponent) {
                console.warn('[Series Widget] Компонент Lampac не найден');
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
            console.error('[Series Widget] Ошибка открытия Lampac:', e);
            return false;
        }
    }

    // =============================================
    // ВИДЖЕТ (справа снизу)
    // =============================================

    var widgetElement = null;

    function createWidget(card, episode) {
        if (!card || !episode) return null;

        var coords = getEpisodeCoords(episode);
        var title = formatEpisode(episode);
        var progress = getProgress(card, episode);
        var timeline = getTimeline(card, episode);
        var remaining = getRemaining(timeline);

        var seriesTitle = card.title || card.name || card.original_title || card.original_name || '';

        // Статус
        var label = '▶';
        if (progress >= 89) {
            label = '✓';
        } else if (progress > 0) {
            label = '▶';
        }

        var statusText = progress >= 89 ? 'Просмотрено' : 
                         progress > 0 ? 'Продолжить' : 'Смотреть';

        // Удаляем старый виджет
        if (widgetElement && widgetElement.parentNode) {
            widgetElement.parentNode.removeChild(widgetElement);
        }

        var widget = document.createElement('div');
        widget.id = WIDGET_ID;
        widget.className = 'series-widget';
        widget.style.cssText = [
            'position:fixed!important',
            'bottom:2.5em!important',
            'right:2.5em!important',
            'z-index:9999!important',
            'max-width:400px!important',
            'min-width:280px!important',
            'padding:0.8em 1.2em!important',
            'border-radius:0.9em!important',
            'background:rgba(7,10,16,0.95)!important',
            'backdrop-filter:blur(20px)!important',
            'border:2px solid rgba(105,167,255,0.2)!important',
            'box-shadow:0 1.2em 4em rgba(0,0,0,0.85)!important',
            'color:#f6f8fc!important',
            'font-family:system-ui,sans-serif!important',
            'font-size:14px!important',
            'cursor:pointer!important',
            'transition:all .3s ease!important',
            'animation:widgetFadeIn .4s ease!important'
        ].join(';');

        // Анимация
        var style = document.createElement('style');
        style.textContent = '@keyframes widgetFadeIn{0%{opacity:0;transform:translateY(20px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}';
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
        statusEl.textContent = label + ' ' + statusText;
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
    var isOnSeriesPage = false;

    function updateWidget() {
        try {
            // Проверяем, что мы на странице сериала
            var active = Lampa.Activity.active();
            if (!active || active.component !== 'full') {
                if (widgetElement && widgetElement.parentNode) {
                    widgetElement.parentNode.removeChild(widgetElement);
                    widgetElement = null;
                }
                isOnSeriesPage = false;
                return;
            }

            var card = getCard();
            if (!card || !isTv(card)) {
                if (widgetElement && widgetElement.parentNode) {
                    widgetElement.parentNode.removeChild(widgetElement);
                    widgetElement = null;
                }
                isOnSeriesPage = false;
                return;
            }

            isOnSeriesPage = true;
            var data = getData();
            var episode = findLastEpisode(card, data || {});

            if (!episode) {
                if (widgetElement && widgetElement.parentNode) {
                    widgetElement.parentNode.removeChild(widgetElement);
                    widgetElement = null;
                }
                return;
            }

            var widget = createWidget(card, episode);
            if (widget) {
                if (widgetElement && widgetElement.parentNode) {
                    widgetElement.parentNode.removeChild(widgetElement);
                }
                document.body.appendChild(widget);
                widgetElement = widget;
            }

        } catch (e) {
            console.error('[Series Widget] Ошибка обновления:', e);
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
        // Обновляем только если мы на странице сериала
        if (isOnSeriesPage) {
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

            console.log('[Series Widget] v' + VERSION + ' запущен');

            Lampa.Listener.follow('full', onFull);
            Lampa.Listener.follow('timeline', onTimeline);
            Lampa.Listener.follow('activity', onActivity);

            setTimeout(updateWidget, 1000);

        } catch (e) {
            console.error('[Series Widget] Ошибка:', e);
        }
    }

    // =============================================
    // API
    // =============================================

    window.__SERIES_WIDGET__ = {
        version: VERSION,
        update: updateWidget,
        getState: function () {
            return {
                version: VERSION,
                hasWidget: !!widgetElement && !!widgetElement.parentNode,
                isOnSeriesPage: isOnSeriesPage
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
