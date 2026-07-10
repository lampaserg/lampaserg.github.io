/* Lampa Series Manager 1.2.0 — Минимальная рабочая версия */
(function () {
    'use strict';

    var VERSION = '1.2.0';
    var MEMORY_KEY = 'lsm_episode_memory_v1';

    // =============================================
    // 1. ПРОВЕРКА ЗАГРУЗКИ LAMPA
    // =============================================

    if (typeof Lampa === 'undefined') {
        console.warn('[Series Manager] Lampa не найдена');
        return;
    }

    if (!Lampa.Listener || typeof Lampa.Listener.follow !== 'function') {
        console.warn('[Series Manager] Lampa.Listener не доступен');
        return;
    }

    console.log('[Series Manager] v' + VERSION + ' загружается...');

    // =============================================
    // 2. БАЗОВЫЕ УТИЛИТЫ
    // =============================================

    function getContentId(card) {
        if (!card) return '';
        var source = card.source || 'tmdb';
        var id = card.id || '';
        var type = card.name || card.original_name || card.first_air_date ? 'tv' : 'movie';
        return type + ':' + source + ':' + String(id);
    }

    function getEpisodeCoords(episode) {
        if (!episode || typeof episode !== 'object') return null;
        var season = episode.season_number || episode.season || 0;
        var number = episode.episode_number || episode.episode || 0;
        season = Number(season);
        number = Number(number);
        if (season < 0 || number < 1) return null;
        return { season: season, episode: number };
    }

    function formatEpisode(episode) {
        var coords = getEpisodeCoords(episode);
        if (!coords) return '';
        var s = String(coords.season);
        var e = String(coords.episode);
        s = s.length < 2 ? '0' + s : s;
        e = e.length < 2 ? '0' + e : e;
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

    function getRemainingTime(timeline) {
        if (!timeline || !timeline.duration) return '';
        var seconds = Math.max(0, timeline.duration - (timeline.time || 0));
        var minutes = Math.round(seconds / 60);
        if (minutes < 1) return '';
        if (minutes < 60) return minutes + ' мин';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return hours + ' ч' + (rest > 0 ? ' ' + rest + ' мин' : '');
    }

    function getEpisodesFromData(data) {
        var result = [];
        try {
            if (data && data.episodes && Array.isArray(data.episodes)) {
                return data.episodes;
            }
            if (data && data.episodes && data.episodes.episodes && Array.isArray(data.episodes.episodes)) {
                return data.episodes.episodes;
            }
            if (data && data.episodes && typeof data.episodes === 'object') {
                for (var key in data.episodes) {
                    if (Array.isArray(data.episodes[key])) {
                        result = result.concat(data.episodes[key]);
                    }
                }
            }
        } catch (e) {}
        return result;
    }

    function getActive() {
        try {
            if (Lampa.Activity && typeof Lampa.Activity.active === 'function') {
                return Lampa.Activity.active();
            }
        } catch (e) {}
        return null;
    }

    // =============================================
    // 3. ПАМЯТЬ
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

    function getSavedEpisode(card) {
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
    // 4. АНАЛИЗ СЕРИАЛА
    // =============================================

    function analyzeSeries(card, data) {
        if (!card) return null;

        var episodes = getEpisodesFromData(data);
        if (!episodes || episodes.length === 0) {
            return { current: null, next: null, episodes: [] };
        }

        // Сортируем эпизоды
        episodes.sort(function (a, b) {
            var ca = getEpisodeCoords(a);
            var cb = getEpisodeCoords(b);
            if (!ca || !cb) return 0;
            if (ca.season !== cb.season) return ca.season - cb.season;
            return ca.episode - cb.episode;
        });

        // Ищем текущий эпизод
        var saved = getSavedEpisode(card);
        var current = null;
        var currentIndex = -1;

        for (var i = 0; i < episodes.length; i++) {
            var coords = getEpisodeCoords(episodes[i]);
            if (!coords) continue;

            // Проверяем сохраненный эпизод
            if (saved && coords.season === saved.season && coords.episode === saved.episode) {
                current = episodes[i];
                currentIndex = i;
                break;
            }
        }

        // Если не нашли, ищем с прогрессом
        if (!current) {
            for (var j = 0; j < episodes.length; j++) {
                var progress = getProgress(card, episodes[j]);
                if (progress > 0 && progress < 60) {
                    current = episodes[j];
                    currentIndex = j;
                    break;
                }
            }
        }

        // Если всё ещё нет, берём первый
        if (!current && episodes.length > 0) {
            current = episodes[0];
            currentIndex = 0;
        }

        // Ищем следующий эпизод
        var next = null;
        if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
            next = episodes[currentIndex + 1];
        }

        return {
            current: current,
            next: next,
            episodes: episodes,
            currentIndex: currentIndex
        };
    }

    // =============================================
    // 5. ВИДЖЕТ
    // =============================================

    function createWidget(card, analysis) {
        if (!card || !analysis || !analysis.current) return null;

        var current = analysis.current;
        var coords = getEpisodeCoords(current);
        var progress = getProgress(card, current);
        var label = formatEpisode(current);

        // Создаём виджет
        var widget = document.createElement('div');
        widget.className = 'lsm-widget';
        widget.style.cssText = [
            'position:fixed!important',
            'bottom:2.5em!important',
            'right:2.5em!important',
            'z-index:9999!important',
            'max-width:320px!important',
            'min-width:160px!important',
            'padding:0.6em 1em!important',
            'border-radius:0.8em!important',
            'background:rgba(7,10,16,0.92)!important',
            'backdrop-filter:blur(16px)!important',
            'border:1px solid rgba(255,255,255,0.08)!important',
            'box-shadow:0 1em 3em rgba(0,0,0,0.6)!important',
            'color:#f6f8fc!important',
            'font-family:system-ui,sans-serif!important',
            'font-size:14px!important',
            'cursor:pointer!important',
            'transition:opacity .3s ease,transform .3s ease!important'
        ].join(';'));

        // Метка
        var labelEl = document.createElement('div');
        labelEl.style.cssText = 'font-size:0.6em;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.4);margin-bottom:0.15em;';
        labelEl.textContent = 'Сейчас смотрите';
        widget.appendChild(labelEl);

        // Название серии
        var titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size:0.9em;font-weight:700;color:#fff;margin:0.1em 0 0.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleEl.textContent = label;
        widget.appendChild(titleEl);

        // Мета-информация
        var metaEl = document.createElement('div');
        metaEl.style.cssText = 'font-size:0.75em;color:rgba(255,255,255,0.5);display:flex;align-items:center;gap:0.6em;flex-wrap:wrap;';
        if (coords) {
            var seasonText = document.createElement('span');
            seasonText.textContent = 'Сезон ' + coords.season + ' · Эпизод ' + coords.episode;
            metaEl.appendChild(seasonText);
        }
        if (progress > 0) {
            var progressText = document.createElement('span');
            progressText.textContent = progress + '%';
            metaEl.appendChild(progressText);
        }
        widget.appendChild(metaEl);

        // Прогресс-бар
        var barWrap = document.createElement('div');
        barWrap.style.cssText = 'width:100%;height:0.2em;border-radius:99em;background:rgba(255,255,255,0.1);margin:0.3em 0 0.15em;overflow:hidden;';
        var bar = document.createElement('div');
        bar.style.cssText = 'height:100%;border-radius:inherit;background:linear-gradient(90deg,#69a7ff,#91beff);transition:width .4s ease;';
        bar.style.width = Math.min(100, progress) + '%';
        barWrap.appendChild(bar);
        widget.appendChild(barWrap);

        // Следующая серия
        if (analysis.next) {
            var nextLabel = formatEpisode(analysis.next);
            var nextEl = document.createElement('div');
            nextEl.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.3);margin-top:0.2em;border-top:1px solid rgba(255,255,255,0.05);padding-top:0.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            nextEl.innerHTML = 'Далее: <strong style="color:rgba(255,255,255,0.4);">' + nextLabel + '</strong>';
            widget.appendChild(nextEl);
        }

        // Подсказка
        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:0.55em;color:rgba(255,255,255,0.15);text-align:right;margin-top:0.1em;';
        hint.textContent = '↗ Открыть эпизоды';
        widget.appendChild(hint);

        // Клик
        widget.addEventListener('click', function (e) {
            e.stopPropagation();
            try {
                if (Lampa.Activity && typeof Lampa.Activity.push === 'function') {
                    var payload = {
                        component: 'episodes',
                        title: 'Эпизоды',
                        card: card,
                        source: card.source || 'tmdb',
                        page: 1
                    };
                    Lampa.Activity.push(payload);
                }
            } catch (err) {}
        });

        return widget;
    }

    // =============================================
    // 6. УПРАВЛЕНИЕ ВИДЖЕТОМ
    // =============================================

    var currentWidget = null;

    function removeWidget() {
        if (currentWidget && currentWidget.parentNode) {
            currentWidget.parentNode.removeChild(currentWidget);
        }
        currentWidget = null;
    }

    function updateWidget(card, data) {
        removeWidget();

        if (!card) return;
        if (!card.name && !card.original_name && !card.first_air_date) return;

        var analysis = analyzeSeries(card, data);
        if (!analysis || !analysis.current) return;

        var widget = createWidget(card, analysis);
        if (widget) {
            document.body.appendChild(widget);
            currentWidget = widget;
        }
    }

    // =============================================
    // 7. ОБРАБОТЧИКИ СОБЫТИЙ
    // =============================================

    var updateTimer = null;

    function onFull(event) {
        if (!event) return;
        if (event.type !== 'complite' && event.type !== 'start' && event.type !== 'build') return;

        var card = null;
        if (event.data && event.data.movie) {
            card = event.data.movie;
        } else if (event.object && (event.object.card || event.object)) {
            card = event.object.card || event.object;
        }

        if (!card) return;

        clearTimeout(updateTimer);
        updateTimer = setTimeout(function () {
            updateWidget(card, event.data || {});
        }, 500);
    }

    function onTimeline() {
        var active = getActive();
        if (!active || active.component !== 'full') return;

        var card = active.card || (active.object && active.object.card) || null;
        if (!card) return;

        clearTimeout(updateTimer);
        updateTimer = setTimeout(function () {
            updateWidget(card, active.data || {});
        }, 300);
    }

    function onEpisodeClick(event) {
        var target = event.target;
        if (!target) return;

        // Ищем родителя с классом эпизода
        while (target && target !== document) {
            if (target.classList && (
                target.classList.contains('full-episode') ||
                target.classList.contains('season-episode') ||
                target.classList.contains('card-episode')
            )) {
                break;
            }
            target = target.parentNode;
        }

        if (!target) return;

        var episode = target.card_data || null;
        if (!episode) return;

        var active = getActive();
        var card = active && (active.card || (active.object && active.object.card) || null);
        if (!card) return;

        saveEpisode(card, episode);

        clearTimeout(updateTimer);
        updateTimer = setTimeout(function () {
            updateWidget(card, active.data || {});
        }, 200);
    }

    // =============================================
    // 8. ЗАПУСК
    // =============================================

    function start() {
        try {
            // Подписываемся на события
            Lampa.Listener.follow('full', onFull);
            Lampa.Listener.follow('timeline', onTimeline);

            // Слушаем клики по эпизодам
            document.addEventListener('click', onEpisodeClick);
            document.addEventListener('focus', function(e) {
                var target = e.target;
                if (target && target.classList && target.classList.contains('focus')) {
                    onEpisodeClick(e);
                }
            }, true);

            // Проверяем, открыт ли уже сериал
            setTimeout(function () {
                var active = getActive();
                if (active && active.component === 'full') {
                    var card = active.card || (active.object && active.object.card) || null;
                    if (card) {
                        updateWidget(card, active.data || {});
                    }
                }
            }, 1000);

            console.log('[Series Manager] v' + VERSION + ' запущен!');

        } catch (e) {
            console.error('[Series Manager] Ошибка запуска:', e);
        }
    }

    // =============================================
    // 9. API
    // =============================================

    window.__LSM_API__ = {
        version: VERSION,
        update: updateWidget,
        remove: removeWidget,
        getState: function () {
            return {
                version: VERSION,
                hasWidget: !!currentWidget
            };
        }
    };

    // =============================================
    // 10. СТАРТ
    // =============================================

    if (document.readyState === 'complete') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }

})();
