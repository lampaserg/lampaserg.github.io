/* Lampa Theme Engine 1.0.0 — Современная тема оформления */
(function () {
    'use strict';

    var VERSION = '1.0.0';
    var PLUGIN_ID = 'lampa_theme_engine';
    var STYLE_ID = 'lampa-theme-engine-style';
    var RUNTIME_KEY = '__LTE_RUNTIME__';
    var CLEANUP_KEY = 'lte_v1_cleanup';
    
    // Уничтожаем старый инстанс, если есть
    var previous = window[RUNTIME_KEY];
    if (previous && typeof previous.destroy === 'function') {
        try { previous.destroy('replace'); } catch (error) {}
    }

    // =============================================
    // 1. Базовые утилиты
    // =============================================
    
    function storageGet(name, fallback) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') {
                return Lampa.Storage.get(name, fallback);
            }
        } catch (error) {
            console.warn('[Theme Engine] Storage.get failed:', name, error);
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
            console.warn('[Theme Engine] Storage.set failed:', name, error);
        }
        return false;
    }

    function boolValue(value, fallback) {
        if (value === undefined || value === null || value === '') return fallback;
        if (value === false || value === 0 || value === '0' || value === 'false') return false;
        if (value === true || value === 1 || value === '1' || value === 'true') return true;
        return fallback;
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function layoutViewport() {
        var content = document.querySelector('.wrap__content');
        var width = content && (content.clientWidth || content.getBoundingClientRect().width) || 0;
        var height = content && (content.clientHeight || content.getBoundingClientRect().height) || 0;
        return {
            width: Math.max(width || 0, window.innerWidth || 0, document.documentElement.clientWidth || 0),
            height: Math.max(height || 0, window.innerHeight || 0, document.documentElement.clientHeight || 0)
        };
    }

    function detectLayoutMode() {
        var viewport = layoutViewport();
        if (viewport.width <= 720) return 'phone';
        if (viewport.width <= 1100) return 'tablet';
        return 'desktop';
    }

    function detectHeightMode() {
        var viewport = layoutViewport();
        return viewport.height > 0 && viewport.height <= 760 ? 'compact' : 'normal';
    }

    function pointerEnvironment() {
        try {
            var hover = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
            var fine = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
            return !!(document.body && (document.body.classList.contains('mouse--controll') || document.body.classList.contains('mouse--control'))) || (hover && fine);
        } catch (error) {
            return false;
        }
    }

    function remoteEnvironment() {
        var body = document.body;
        if (!body) return false;
        if (body.classList.contains('platform--browser')) return false;
        if (body.classList.contains('platform--tv') || body.classList.contains('platform--tizen') || body.classList.contains('platform--webos')) return true;
        if (body.classList.contains('platform--android') && Number(window.navigator && window.navigator.maxTouchPoints || 0) === 0) return true;
        return false;
    }

    function tvUiEnvironment() {
        try {
            if (Lampa.Platform && typeof Lampa.Platform.screen === 'function' && Lampa.Platform.screen('tv')) return true;
        } catch (error) {}
        return remoteEnvironment();
    }

    function detectInputMode() {
        var body = document.body;
        var touch = Number(window.navigator && window.navigator.maxTouchPoints || 0);
        try {
            var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        } catch (error) {
            var coarse = false;
        }

        if (body && (body.classList.contains('touch--controll') || body.classList.contains('touch--control'))) return 'touch';
        if (pointerEnvironment()) return 'pointer';
        if (touch > 0 || coarse) return 'touch';
        if (remoteEnvironment()) return 'remote';
        return 'keyboard';
    }

    // =============================================
    // 2. Ключи настроек
    // =============================================
    
    var KEYS = {
        enabled: 'lte_enabled',
        density: 'lte_density',
        motion: 'lte_motion',
        performance: 'lte_performance'
    };

    // =============================================
    // 3. CSS (полностью из оригинального плагина)
    // =============================================
    
    var CSS = String.raw`
/* ============================================
   Lampa Theme Engine 1.0.0
   Основано на Lampa Modern UI 0.13.4
   ============================================ */

body.lampa-theme-engine {
    --lmui-bg: #070a10;
    --lmui-bg-raised: #0c111b;
    --lmui-surface: #111925;
    --lmui-surface-raised: #182438;
    --lmui-surface-hover: #213149;
    --lmui-text: #f6f8fc;
    --lmui-muted: #aeb8c8;
    --lmui-faint: #748096;
    --lmui-accent: #69a7ff;
    --lmui-accent-strong: #91beff;
    --lmui-accent-soft: rgba(105, 167, 255, 0.16);
    --lmui-danger: #ff756f;
    --lmui-border: rgba(255, 255, 255, 0.10);
    --lmui-border-strong: rgba(255, 255, 255, 0.22);
    --lmui-radius-sm: 0.68em;
    --lmui-radius-md: 1em;
    --lmui-radius-lg: 1.45em;
    --lmui-gutter: clamp(1em, 2vw, 2.5em);
    --lmui-fast: 110ms;
    --lmui-normal: 175ms;
    --lmui-slow: 240ms;
    --lmui-ease: cubic-bezier(0.22, 0.72, 0.2, 1);
    --lmui-focus-ring: 0 0 0 0.11em var(--lmui-accent), 0 0 0 0.25em rgba(105, 167, 255, 0.25);
    --lmui-shadow-card: 0 1.2em 3em rgba(0, 0, 0, 0.46);
    --lmui-shadow-panel: 0 1.5em 4.5em rgba(0, 0, 0, 0.54);
    --lmui-display: clamp(2.3em, 4.4vw, 4.9em);
    --lmui-heading: clamp(1.55em, 2.2vw, 2.35em);
    --lmui-section: clamp(1.16em, 1.45vw, 1.52em);
    --lmui-body: clamp(0.98em, 1.05vw, 1.16em);

    color: var(--lmui-text);
    background: var(--lmui-bg) !important;
    font-family: "SegoeUI", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}

/* Динамический фон */
body.lampa-theme-engine::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
        radial-gradient(72% 56% at 12% -12%, rgba(57, 103, 174, 0.27), transparent 69%),
        radial-gradient(52% 44% at 102% 4%, rgba(37, 75, 135, 0.14), transparent 73%),
        linear-gradient(145deg, #0d1420 0%, var(--lmui-bg) 54%, #04060a 100%);
}

/* Экономный режим */
body.lampa-theme-engine.lte-performance-lite .background {
    display: none !important;
}
body.lampa-theme-engine.lte-performance-lite::before {
    background: linear-gradient(145deg, #0c111a, #06080d 72%);
}

/* Минимальная анимация */
body.lampa-theme-engine.lte-motion-minimal {
    --lmui-fast: 1ms;
    --lmui-normal: 1ms;
    --lmui-slow: 1ms;
}

/* ============================================
   HEADER (Шапка)
   ============================================ */
body.lampa-theme-engine .head {
    background: linear-gradient(180deg, rgba(7, 10, 16, 0.97), rgba(7, 10, 16, 0.73) 74%, transparent);
}
body.lampa-theme-engine .head__body {
    padding-top: 0.68em;
    padding-bottom: 0.72em;
}
body.lampa-theme-engine .head__title {
    color: var(--lmui-text);
    font-size: var(--lmui-section);
    font-weight: 700;
    letter-spacing: -0.025em;
}
body.lampa-theme-engine .head__time-date,
body.lampa-theme-engine .head__time-week {
    color: var(--lmui-muted);
}
body.lampa-theme-engine .head__action {
    width: 2.9em;
    height: 2.9em;
    margin-left: 0.55em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.9em;
    background: rgba(255, 255, 255, 0.045);
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}
body.lampa-theme-engine .head__action.focus,
body.lampa-theme-engine .head__action.hover {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
    transform: translateY(-0.03em);
}

/* TV-режим шапки */
body.lampa-theme-engine.lte-tv-ui .head__body {
    min-height: 3.35em;
    padding-top: 0.46em;
    padding-bottom: 0.5em;
}
body.lampa-theme-engine.lte-tv-ui .head__actions {
    display: flex;
    align-items: center;
    gap: 0.34em;
}
body.lampa-theme-engine.lte-tv-ui .head__action {
    width: 2.65em;
    height: 2.65em;
    margin-left: 0;
    border-radius: 0.78em;
}
body.lampa-theme-engine.lte-tv-ui .head__action.open--profile,
body.lampa-theme-engine.lte-tv-ui .head__action.full--screen,
body.lampa-theme-engine.lte-tv-ui .head__action.open--broadcast {
    display: none !important;
}
body.lampa-theme-engine.lte-tv-ui .head__markers,
body.lampa-theme-engine.lte-tv-ui .head__time-date,
body.lampa-theme-engine.lte-tv-ui .head__time-week {
    display: none !important;
}
body.lampa-theme-engine.lte-tv-ui .head__time {
    margin-left: 0.7em;
}
body.lampa-theme-engine.lte-tv-ui .head__time-now {
    color: var(--lmui-muted);
    font-size: 1.02em;
    font-weight: 650;
    letter-spacing: 0.015em;
}

/* ============================================
   МЕНЮ (Навигация)
   ============================================ */
body.lampa-theme-engine .wrap__left {
    background: linear-gradient(90deg, rgba(5, 8, 13, 0.99), rgba(8, 12, 20, 0.94) 82%, transparent);
}
body.lampa-theme-engine .menu__list {
    padding: 0.55em 0.72em 1em;
}
body.lampa-theme-engine .menu__split {
    width: auto;
    margin: 0.72em 1em;
    border-color: var(--lmui-border);
}
body.lampa-theme-engine .menu__item {
    position: relative;
    min-height: 3.12em;
    padding: 0.72em 0.94em;
    border: 0.075em solid transparent;
    border-radius: 0.88em;
    color: var(--lmui-muted);
    transition: transform var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease);
}
body.lampa-theme-engine .menu__item + li {
    margin-top: 0.14em;
}
body.lampa-theme-engine .menu__ico {
    width: 1.45em;
    height: 1.45em;
    margin-right: 0.92em;
    opacity: 0.76;
    transition: opacity var(--lmui-fast) ease, transform var(--lmui-fast) var(--lmui-ease);
}
body.lampa-theme-engine .menu__text {
    font-weight: 610;
    letter-spacing: -0.014em;
}
body.lampa-theme-engine .menu__item.focus,
body.lampa-theme-engine .menu__item.hover,
body.lampa-theme-engine .menu__item.traverse {
    color: #fff;
    border-color: rgba(105, 167, 255, 0.35);
    background: var(--lmui-accent-soft);
    transform: translateX(0.06em);
}
body.lampa-theme-engine .menu__item.focus::before,
body.lampa-theme-engine .menu__item.hover::before {
    content: "";
    position: absolute;
    left: 0.25em;
    top: 25%;
    bottom: 25%;
    width: 0.17em;
    border-radius: 99em;
    background: var(--lmui-accent-strong);
}
body.lampa-theme-engine .menu__item.focus .menu__ico,
body.lampa-theme-engine .menu__item.hover .menu__ico {
    opacity: 1;
    transform: scale(1.045);
}

/* ============================================
   РЯДЫ И КАРТОЧКИ
   ============================================ */
body.lampa-theme-engine .items-line {
    margin-bottom: 0.58em;
}
body.lampa-theme-engine .items-line__head {
    min-height: 3em;
    margin-bottom: 0.18em;
}
body.lampa-theme-engine .items-line__title {
    overflow: hidden;
    color: var(--lmui-text);
    font-size: var(--lmui-section);
    font-weight: 720;
    letter-spacing: -0.027em;
    line-height: 1.18;
    text-overflow: ellipsis;
    white-space: nowrap;
}
body.lampa-theme-engine .items-line__more {
    padding: 0.48em 0.76em;
    border: 0.075em solid transparent;
    border-radius: 0.68em;
    color: var(--lmui-muted);
    opacity: 0.74;
    transition: color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), opacity var(--lmui-fast) ease;
}
body.lampa-theme-engine .items-line__more.focus,
body.lampa-theme-engine .items-line__more.hover {
    color: #fff;
    opacity: 1;
    border-color: rgba(105, 167, 255, 0.4);
    background: var(--lmui-accent-soft);
}

/* Карточки */
body.lampa-theme-engine .card {
    position: relative;
    transform-origin: center center;
    transition: transform var(--lmui-normal) var(--lmui-ease), opacity var(--lmui-fast) ease;
}
body.lampa-theme-engine .card__view {
    position: relative;
    overflow: hidden;
    margin-bottom: 0.64em;
    border: 0.075em solid rgba(255, 255, 255, 0.07);
    border-radius: var(--lmui-radius-md);
    background: var(--lmui-surface);
    box-shadow: 0 0.32em 1em rgba(0, 0, 0, 0.2);
    transition: border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-normal) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease);
}
body.lampa-theme-engine .card__img,
body.lampa-theme-engine .card__filter,
body.lampa-theme-engine .card__textbox,
body.lampa-theme-engine .card__view::before {
    border-radius: calc(var(--lmui-radius-md) - 0.075em);
}
body.lampa-theme-engine .card__img {
    transform: scale(1.001);
    transition: transform var(--lmui-slow) var(--lmui-ease), opacity var(--lmui-normal) ease;
}
body.lampa-theme-engine .card__title {
    overflow: hidden;
    display: -webkit-box;
    min-height: 2.56em;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    color: var(--lmui-text);
    font-weight: 630;
    line-height: 1.28;
    letter-spacing: -0.016em;
}
body.lampa-theme-engine .card__textbox {
    background: linear-gradient(to bottom, transparent 33%, rgba(3, 6, 11, 0.42) 61%, rgba(3, 6, 11, 0.96) 100%);
}
body.lampa-theme-engine .card__vote,
body.lampa-theme-engine .card__quality,
body.lampa-theme-engine .card__type,
body.lampa-theme-engine .card__marker,
body.lampa-theme-engine .card__icons-inner {
    border: 0;
    border-radius: 0.5em;
    background: rgba(5, 8, 14, 0.9);
    color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0.3em 0.8em rgba(0, 0, 0, 0.3);
}
body.lampa-theme-engine .card__quality {
    left: 0.5em;
    bottom: 0.5em;
    padding: 0.28em 0.48em;
    font-weight: 720;
    letter-spacing: 0.025em;
}

/* Прогресс просмотра */
body.lampa-theme-engine .time-line {
    height: 0.3em;
    overflow: hidden;
    border-radius: 99em;
    background: rgba(255, 255, 255, 0.17);
}
body.lampa-theme-engine .time-line > div {
    height: 100%;
    border-radius: inherit;
    background: var(--lmui-accent);
    box-shadow: none;
}

/* Фокус и ховер карточек */
body.lampa-theme-engine .card.focus,
body.lampa-theme-engine .card.hover {
    z-index: 8;
}
body.lampa-theme-engine .card.focus {
    transform: translateY(-0.045em) scale(1.018);
}
body.lampa-theme-engine .card.focus .card__view {
    border-color: #fff;
    background: var(--lmui-surface-raised);
    box-shadow: 0 0 0 0.12em #fff, 0 0 0 0.27em rgba(105, 167, 255, 0.72), 0 0.9em 2.2em rgba(0, 0, 0, 0.44);
}
body.lampa-theme-engine .card.hover:not(.focus) .card__view {
    border-color: rgba(145, 190, 255, 0.72);
    background: var(--lmui-surface-raised);
    box-shadow: 0 0 0 0.08em rgba(105, 167, 255, 0.5), 0 0.65em 1.5em rgba(0, 0, 0, 0.34);
}
body.lampa-theme-engine .card.focus .card__img {
    transform: scale(1.008);
}
body.lampa-theme-engine .card.focus .card__view::after {
    content: "";
    display: block !important;
    position: absolute;
    left: 18%;
    right: 18%;
    bottom: 0.28em;
    height: 0.18em;
    border-radius: 99em;
    background: #fff;
    box-shadow: 0 0 0.65em rgba(105, 167, 255, 0.85);
    pointer-events: none;
}
body.lampa-theme-engine .card.hover:not(.focus) .card__view::after {
    display: none !important;
}

/* Компактный режим */
body.lampa-theme-engine.lte-density-compact .card:not(.card--wide):not(.card--collection):not(.card--category) {
    width: 11.1em;
}
body.lampa-theme-engine.lte-density-compact .items-line {
    margin-bottom: 0.34em;
}

/* ============================================
   КНОПКИ И ЭЛЕМЕНТЫ УПРАВЛЕНИЯ
   ============================================ */
body.lampa-theme-engine .simple-button,
body.lampa-theme-engine .full-start__button {
    min-height: 2.85em;
    padding-inline: 1em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.82em;
    background: rgba(255, 255, 255, 0.055);
    color: var(--lmui-text);
    font-weight: 650;
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}
body.lampa-theme-engine .simple-button.focus,
body.lampa-theme-engine .simple-button.hover,
body.lampa-theme-engine .full-start__button.focus,
body.lampa-theme-engine .full-start__button.hover {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
    transform: translateY(-0.05em);
}
body.lampa-theme-engine .full-start-new__buttons .full-start__button.lte-primary-action {
    border-color: transparent;
    background: var(--lmui-accent);
    color: #07101c;
    font-weight: 780;
}
body.lampa-theme-engine .full-start-new__buttons .full-start__button.lte-primary-action.focus,
body.lampa-theme-engine .full-start-new__buttons .full-start__button.lte-primary-action.hover {
    border-color: #fff;
    background: var(--lmui-accent-strong);
    color: #050b13;
    box-shadow: 0 0 0 0.11em #fff, 0 0 0 0.25em rgba(105, 167, 255, 0.32), 0 0.9em 2.2em rgba(0, 0, 0, 0.35);
}

/* ============================================
   ДЕТАЛЬНАЯ СТРАНИЦА (Фильм/Сериал)
   ============================================ */
body.lampa-theme-engine .full-start__background {
    opacity: 0.68;
    filter: saturate(0.9) contrast(1.06);
}
body.lampa-theme-engine .full-start-new {
    min-height: calc(100vh - 6.5em);
    padding-bottom: 4em;
}
body.lampa-theme-engine .full-start-new__left {
    margin-right: clamp(1.5em, 3vw, 3.5em);
}
body.lampa-theme-engine .full-start-new__poster,
body.lampa-theme-engine .full-start-new__img {
    border-radius: var(--lmui-radius-lg);
}
body.lampa-theme-engine .full-start-new__poster {
    overflow: hidden;
    border: 0.075em solid rgba(255, 255, 255, 0.13);
    background: var(--lmui-surface);
    box-shadow: 0 1.6em 4em rgba(0, 0, 0, 0.47);
}
body.lampa-theme-engine .full-start-new__right {
    max-width: 70em;
}
body.lampa-theme-engine .full-start-new__title {
    max-width: 16ch;
    color: #fff;
    font-size: var(--lmui-display);
    font-weight: 780;
    letter-spacing: -0.046em;
    line-height: 1.02;
    text-wrap: balance;
    text-shadow: 0 0.12em 0.65em rgba(0, 0, 0, 0.54);
}
body.lampa-theme-engine .full-start-new__head,
body.lampa-theme-engine .full-start-new__tagline,
body.lampa-theme-engine .full-start-new__description {
    color: var(--lmui-muted);
}
body.lampa-theme-engine .full-start-new__description {
    width: min(100%, 58em);
    max-width: 64ch;
    font-size: var(--lmui-body);
    line-height: 1.6;
    text-wrap: pretty;
}
body.lampa-theme-engine .full-start-new__details {
    gap: 0.2em;
    margin-left: 0;
}
body.lampa-theme-engine .full-start-new__details > * {
    margin: 0.12em 0.38em 0.12em 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: rgba(235, 240, 248, 0.82);
}
body.lampa-theme-engine .full-start-new__details > *:not(:last-child)::after {
    content: "·";
    margin-left: 0.38em;
    color: var(--lmui-faint);
}
body.lampa-theme-engine .full-start-new__buttons {
    gap: 0.55em;
    margin-top: 1.15em;
}

/* Теги и эпизоды */
body.lampa-theme-engine .full-descr__tag,
body.lampa-theme-engine .tag-count,
body.lampa-theme-engine .full-review,
body.lampa-theme-engine .full-review-add,
body.lampa-theme-engine .person-start__tag,
body.lampa-theme-engine .person-start__icons > div {
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.72em;
    background: rgba(255, 255, 255, 0.05);
    color: var(--lmui-muted);
}
body.lampa-theme-engine .full-descr__tag.focus,
body.lampa-theme-engine .tag-count.focus,
body.lampa-theme-engine .full-review.focus,
body.lampa-theme-engine .full-review-add.focus {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
}
body.lampa-theme-engine .season-episode,
body.lampa-theme-engine .full-episode,
body.lampa-theme-engine .torrent-item,
body.lampa-theme-engine .explorer-card,
body.lampa-theme-engine .explorer-list {
    overflow: hidden;
    border: 0.075em solid var(--lmui-border);
    border-radius: var(--lmui-radius-md);
    background: rgba(255, 255, 255, 0.045);
}
body.lampa-theme-engine .season-episode.focus,
body.lampa-theme-engine .full-episode.focus,
body.lampa-theme-engine .card-episode.focus .full-episode,
body.lampa-theme-engine .torrent-item.focus,
body.lampa-theme-engine .explorer-card__head-img.focus {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
}

/* ============================================
   ПОИСК
   ============================================ */
body.lampa-theme-engine.search--open {
    --lmui-search-max: min(76em, calc(100vw - 3em));
}
body.lampa-theme-engine .main-search {
    background: linear-gradient(160deg, rgba(8, 12, 20, 0.99), rgba(5, 8, 13, 0.99));
}
body.lampa-theme-engine .main-search > .search,
body.lampa-theme-engine .main-search .scroll.search {
    width: var(--lmui-search-max);
    max-width: var(--lmui-search-max);
    margin-inline: auto;
}
body.lampa-theme-engine .main-search .search > .scroll__content > .scroll__body,
body.lampa-theme-engine .main-search .search__body {
    padding: 0.45em 0 4em;
}
body.lampa-theme-engine .main-search .head-backward {
    margin-bottom: 0.3em;
}
body.lampa-theme-engine .search__keypad {
    margin: 0 0 0.55em;
}

/* Экранная клавиатура */
body.lampa-theme-engine .simple-keyboard {
    width: 100%;
    padding: 0.55em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 1em;
    background: rgba(13, 19, 29, 0.98);
    box-shadow: 0 0.8em 2.2em rgba(0, 0, 0, 0.25);
}
body.lampa-theme-engine.lte-tv-ui .main-search .simple-keyboard {
    width: min(100%, 56em);
    margin-inline: auto;
    padding: 0.46em;
}
body.lampa-theme-engine .simple-keyboard-input,
body.lampa-theme-engine .search-box .search__input {
    box-sizing: border-box;
    width: 100%;
    min-height: 3.25em;
    padding: 0.7em 0.9em;
    border: 0.085em solid rgba(255, 255, 255, 0.13);
    border-radius: 0.82em;
    background: var(--lmui-surface);
    color: var(--lmui-text);
    font-size: clamp(1em, 1.15vw, 1.16em);
    font-weight: 620;
    outline: 0;
}
body.lampa-theme-engine .simple-keyboard-input.focus,
body.lampa-theme-engine .simple-keyboard-input:focus,
body.lampa-theme-engine .search-box--focus .search__input {
    border-color: var(--lmui-accent);
    background: var(--lmui-surface-raised);
    box-shadow: var(--lmui-focus-ring);
}
body.lampa-theme-engine .simple-keyboard .hg-row {
    gap: 0.25em;
    margin-bottom: 0.25em;
}
body.lampa-theme-engine .simple-keyboard .hg-button {
    min-height: 2.55em;
    margin: 0 !important;
    border-radius: 0.55em;
    font-size: 0.94em;
}
body.lampa-theme-engine.lte-tv-ui .main-search .simple-keyboard .hg-row {
    gap: 0.18em;
    margin-bottom: 0.18em;
}
body.lampa-theme-engine.lte-tv-ui .main-search .simple-keyboard .hg-button {
    min-height: 2.95em;
    padding-inline: 0.42em;
    border-radius: 0.62em;
    font-size: 1em;
}

/* Специальные кнопки клавиатуры */
body.lampa-theme-engine .main-search .simple-keyboard .hg-button-bksp,
body.lampa-theme-engine .main-search .simple-keyboard .hg-button-space,
body.lampa-theme-engine .main-search .simple-keyboard .hg-button-lang,
body.lampa-theme-engine .main-search .simple-keyboard .hg-button-numbers,
body.lampa-theme-engine .main-search .simple-keyboard .hg-button[data-skbtn="{bksp}"],
body.lampa-theme-engine .main-search .simple-keyboard .hg-button[data-skbtn="{space}"],
body.lampa-theme-engine .main-search .simple-keyboard .hg-button[data-skbtn="{language}"],
body.lampa-theme-engine .main-search .simple-keyboard .hg-button[data-skbtn="{numbers}"] {
    min-width: 4.2em;
    background: rgba(105, 167, 255, 0.11);
    color: var(--lmui-text);
    font-weight: 720;
}
body.lampa-theme-engine .main-search .simple-keyboard .hg-button-space,
body.lampa-theme-engine .main-search .simple-keyboard .hg-button[data-skbtn="{space}"] {
    flex-grow: 2.4 !important;
}

/* Источники поиска */
body.lampa-theme-engine .search__history,
body.lampa-theme-engine .search__sources {
    margin: 0.45em 0 0.65em;
    padding: 0;
}
body.lampa-theme-engine .search-source,
body.lampa-theme-engine .search-history-key {
    min-height: 2.55em;
    display: inline-flex;
    align-items: center;
    padding: 0.46em 0.72em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.68em;
    background: rgba(255, 255, 255, 0.04);
    color: var(--lmui-muted);
    font-weight: 630;
}
body.lampa-theme-engine .search-source__count {
    min-width: 1.45em;
    margin-left: 0.42em;
    padding: 0.1em 0.32em;
    border-radius: 99em;
    background: rgba(255, 255, 255, 0.08);
    color: var(--lmui-muted);
    text-align: center;
}
body.lampa-theme-engine .search-source.active {
    color: #fff;
    border-color: rgba(105, 167, 255, 0.46);
    background: rgba(105, 167, 255, 0.15);
}
body.lampa-theme-engine .search-source.focus,
body.lampa-theme-engine .search-history-key.focus {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
}

/* ============================================
   НАСТРОЙКИ
   ============================================ */
body.lampa-theme-engine .settings__content,
body.lampa-theme-engine .selectbox__content,
body.lampa-theme-engine .modal__content,
body.lampa-theme-engine .settings-input__content,
body.lampa-theme-engine .navigation-bar__body {
    color: var(--lmui-text);
    border: 0.075em solid var(--lmui-border);
    background: rgba(15, 22, 33, 0.98) !important;
    box-shadow: var(--lmui-shadow-panel);
}
body.lampa-theme-engine .settings__content,
body.lampa-theme-engine .selectbox__content,
body.lampa-theme-engine .modal__content {
    border-radius: var(--lmui-radius-lg);
}
body.lampa-theme-engine .settings__title,
body.lampa-theme-engine .selectbox__title,
body.lampa-theme-engine .modal__title {
    font-size: var(--lmui-heading);
    font-weight: 760;
    letter-spacing: -0.032em;
}
body.lampa-theme-engine .settings-folder,
body.lampa-theme-engine .settings-param,
body.lampa-theme-engine .selectbox-item {
    min-height: 3.05em;
    border: 0.075em solid transparent;
    border-radius: 0.78em;
    transition: color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease);
}
body.lampa-theme-engine .settings-folder.focus,
body.lampa-theme-engine .settings-param.focus,
body.lampa-theme-engine .selectbox-item.focus {
    color: #fff;
    border-color: rgba(105, 167, 255, 0.4);
    background: var(--lmui-accent-soft) !important;
}
body.lampa-theme-engine .settings-param__descr,
body.lampa-theme-engine .settings-param-title > span {
    color: var(--lmui-muted);
    opacity: 1;
}
body.lampa-theme-engine .settings-param__value {
    color: var(--lmui-accent-strong);
    font-weight: 700;
}

/* ============================================
   ПУСТЫЕ СОСТОЯНИЯ И ЗАГРУЗКА
   ============================================ */
body.lampa-theme-engine .empty,
body.lampa-theme-engine .error,
body.lampa-theme-engine .empty-filter,
body.lampa-theme-engine .loading-layer__box,
body.lampa-theme-engine .activity-wait-refresh,
body.lampa-theme-engine .notice,
body.lampa-theme-engine .bell__item {
    border: 0.075em solid var(--lmui-border);
    border-radius: var(--lmui-radius-lg);
    background: var(--lmui-surface) !important;
    color: var(--lmui-text);
    box-shadow: 0 1em 2.8em rgba(0, 0, 0, 0.34);
}
body.lampa-theme-engine .empty__title,
body.lampa-theme-engine .error__title,
body.lampa-theme-engine .empty-filter__title {
    color: var(--lmui-text);
    font-size: var(--lmui-heading);
    font-weight: 750;
    letter-spacing: -0.03em;
}
body.lampa-theme-engine .empty__descr,
body.lampa-theme-engine .error__text,
body.lampa-theme-engine .empty-filter__subtitle,
body.lampa-theme-engine .loading-layer__text,
body.lampa-theme-engine .notice__descr,
body.lampa-theme-engine .notice__time {
    color: var(--lmui-muted);
    line-height: 1.52;
}
body.lampa-theme-engine .content-loading {
    min-height: 12em;
    margin: 1em var(--lmui-gutter);
    border: 0.075em solid rgba(255, 255, 255, 0.07);
    border-radius: var(--lmui-radius-lg);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015));
}

/* ============================================
   НАВИГАЦИОННАЯ ПАНЕЛЬ (ТВ)
   ============================================ */
body.lampa-theme-engine .navigation-bar {
    padding: 0 0.65em 0.65em;
}
body.lampa-theme-engine .navigation-bar__body {
    padding: 0.52em;
    border-radius: 1.15em;
}
body.lampa-theme-engine .navigation-bar__item {
    min-width: 4em;
    min-height: 3em;
    padding: 0.45em 0.58em;
    border-radius: 0.75em;
    color: var(--lmui-muted);
}
body.lampa-theme-engine .navigation-bar__item.focus,
body.lampa-theme-engine .navigation-bar__item.active {
    color: #fff;
    background: var(--lmui-accent-soft);
}

/* ============================================
   АДАПТАЦИЯ ПОД УСТРОЙСТВА
   ============================================ */

/* --- Tablet --- */
body.lampa-theme-engine.lte-layout-tablet {
    --lmui-gutter: clamp(0.95em, 2.6vw, 1.7em);
    --lmui-display: clamp(2.15em, 5.2vw, 3.55em);
}
body.lampa-theme-engine.lte-layout-tablet .full-start-new__left {
    width: min(31vw, 17em);
    margin-right: clamp(1.2em, 2.5vw, 2em);
}
body.lampa-theme-engine.lte-layout-tablet .full-start-new__right {
    max-width: calc(100vw - 21em);
}
body.lampa-theme-engine.lte-layout-tablet .full-start-new__title {
    max-width: 18ch;
}
body.lampa-theme-engine.lte-layout-tablet .full-start-new__description {
    max-width: 54ch;
    -webkit-line-clamp: 6;
    line-clamp: 6;
}
body.lampa-theme-engine.lte-layout-tablet .settings__content,
body.lampa-theme-engine.lte-layout-tablet .selectbox__content,
body.lampa-theme-engine.lte-layout-tablet .modal__content {
    width: min(88vw, 52em);
    max-height: 86vh;
}

/* --- Phone --- */
body.lampa-theme-engine.lte-layout-phone {
    --lmui-radius-md: 0.86em;
    --lmui-radius-lg: 1.15em;
    --lmui-gutter: max(0.75em, env(safe-area-inset-left));
    --lmui-display: clamp(2em, 9.5vw, 3.1em);
    --lmui-heading: clamp(1.45em, 6vw, 2em);
    --lmui-section: clamp(1.12em, 4.8vw, 1.4em);
    --lmui-body: clamp(0.96em, 3.9vw, 1.08em);
}
body.lampa-theme-engine.lte-layout-phone::before {
    background: linear-gradient(160deg, #0d1320, #070a10 58%, #04060a);
}
body.lampa-theme-engine.lte-layout-phone .wrap__content,
body.lampa-theme-engine.lte-layout-phone .activity__body {
    padding-left: max(0.72em, env(safe-area-inset-left));
    padding-right: max(0.72em, env(safe-area-inset-right));
}
body.lampa-theme-engine.lte-layout-phone .head__body {
    padding-top: 0.42em;
    padding-bottom: 0.48em;
}
body.lampa-theme-engine.lte-layout-phone .head__title {
    font-size: 1.35em;
}
body.lampa-theme-engine.lte-layout-phone .head__action {
    width: 2.7em;
    height: 2.7em;
}
body.lampa-theme-engine.lte-layout-phone .items-line__head {
    min-height: 2.55em;
    margin-bottom: 0.1em;
}
body.lampa-theme-engine.lte-layout-phone .card:not(.card--wide):not(.card--collection):not(.card--category) {
    width: min(42vw, 11.2em);
    min-width: 8.5em;
}
body.lampa-theme-engine.lte-layout-phone.lte-density-compact .card:not(.card--wide):not(.card--collection):not(.card--category) {
    width: min(37vw, 9.8em);
    min-width: 7.7em;
}
body.lampa-theme-engine.lte-layout-phone .card.focus,
body.lampa-theme-engine.lte-layout-phone .card.hover {
    transform: none;
}
body.lampa-theme-engine.lte-layout-phone .card.focus .card__view,
body.lampa-theme-engine.lte-layout-phone .card.hover .card__view {
    box-shadow: var(--lmui-focus-ring), 0 0.75em 1.8em rgba(0, 0, 0, 0.35);
}
body.lampa-theme-engine.lte-layout-phone .full-start-new {
    padding-bottom: 2em;
}
body.lampa-theme-engine.lte-layout-phone .full-start-new__right {
    width: 100%;
    padding-top: 1.25em;
    background: linear-gradient(180deg, transparent, rgba(7, 10, 16, 0.96) 14%);
}
body.lampa-theme-engine.lte-layout-phone .full-start-new__title {
    max-width: 100%;
    -webkit-line-clamp: 3;
    line-clamp: 3;
}
body.lampa-theme-engine.lte-layout-phone .full-start-new__description {
    max-width: 100%;
    -webkit-line-clamp: 5;
    line-clamp: 5;
}
body.lampa-theme-engine.lte-layout-phone .full-start-new__buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5em;
    overflow: visible;
}
body.lampa-theme-engine.lte-layout-phone .full-start-new__buttons .full-start__button {
    width: 100%;
    min-height: 3.15em;
    margin: 0;
    justify-content: center;
}
body.lampa-theme-engine.lte-layout-phone .full-start-new__buttons .full-start__button.lte-primary-action {
    grid-column: 1 / -1;
}
body.lampa-theme-engine.lte-layout-phone .settings__content,
body.lampa-theme-engine.lte-layout-phone .selectbox__content,
body.lampa-theme-engine.lte-layout-phone .modal__content {
    width: 100%;
    max-height: min(88vh, 54em);
    margin: 0;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 1.2em 1.2em 0 0;
}

/* ============================================
   РЕЖИМЫ ВВОДА
   ============================================ */
body.lampa-theme-engine.lte-input-pointer .card.hover:not(.focus) {
    transform: translateY(-0.025em) scale(1.006);
}
body.lampa-theme-engine.lte-input-keyboard .card.focus,
body.lampa-theme-engine.lte-input-remote .card.focus {
    transform: translateY(-0.045em) scale(1.018);
}
body.lampa-theme-engine.lte-input-keyboard .card.focus .card__view,
body.lampa-theme-engine.lte-input-remote .card.focus .card__view {
    border-color: #fff;
    box-shadow: 0 0 0 0.12em #fff, 0 0 0 0.27em rgba(105, 167, 255, 0.72), 0 0.9em 2.2em rgba(0, 0, 0, 0.44);
}
body.lampa-theme-engine.lte-input-remote .menu__item,
body.lampa-theme-engine.lte-input-remote .settings-folder,
body.lampa-theme-engine.lte-input-remote .settings-param,
body.lampa-theme-engine.lte-input-remote .selectbox-item {
    min-height: 3.2em;
}

/* ============================================
   КОМПАКТНАЯ ВЫСОТА
   ============================================ */
body.lampa-theme-engine.lte-height-compact {
    --lmui-display: clamp(2.05em, 3.8vw, 3.8em);
}
body.lampa-theme-engine.lte-height-compact .full-start-new {
    min-height: calc(100vh - 5.4em);
    padding-bottom: 2.4em;
}

/* ============================================
   АДАПТАЦИЯ ПОД СИСТЕМНЫЕ НАСТРОЙКИ
   ============================================ */
@media (prefers-reduced-motion: reduce) {
    body.lampa-theme-engine,
    body.lampa-theme-engine * {
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 1ms !important;
        scroll-behavior: auto !important;
    }
}
`;

    // =============================================
    // 4. Основной движок
    // =============================================
    
    var runtime = {
        version: VERSION,
        started: false,
        destroyed: false,
        timerIds: [],
        disposers: [],
        observer: null,
        observedRoot: null,
        lastInputMode: '',
        lastKeyboardInputAt: 0,
        lastMouseX: null,
        lastMouseY: null,
        applyTimer: 0,
        
        destroy: function(reason) {
            if (this.destroyed) return;
            this.destroyed = true;
            this.started = false;
            
            // Очищаем таймеры
            this.timerIds.forEach(clearTimeout);
            this.timerIds = [];
            
            // Отключаем обсервер
            if (this.observer) {
                try { this.observer.disconnect(); } catch (error) {}
                this.observer = null;
            }
            
            // Вызываем диспоузеры
            this.disposers.forEach(function(d) { try { d(); } catch (error) {} });
            this.disposers = [];
            
            // Удаляем стили
            var style = document.getElementById(STYLE_ID);
            if (style && style.parentNode) style.parentNode.removeChild(style);
            
            // Удаляем классы с body
            if (document.body) {
                document.body.classList.remove('lampa-theme-engine');
                document.body.classList.remove('lte-density-comfortable', 'lte-density-compact');
                document.body.classList.remove('lte-motion-calm', 'lte-motion-minimal');
                document.body.classList.remove('lte-performance-standard', 'lte-performance-lite');
                document.body.classList.remove('lte-layout-desktop', 'lte-layout-tablet', 'lte-layout-phone');
                document.body.classList.remove('lte-height-normal', 'lte-height-compact');
                document.body.classList.remove('lte-input-pointer', 'lte-input-touch', 'lte-input-keyboard', 'lte-input-remote');
                document.body.classList.remove('lte-tv-ui');
            }
            
            // Удаляем себя из window
            if (window[RUNTIME_KEY] === this) delete window[RUNTIME_KEY];
            
            console.log('[Theme Engine] Destroyed:', reason || '');
        }
    };
    window[RUNTIME_KEY] = runtime;

    // =============================================
    // 5. Вспомогательные функции движка
    // =============================================
    
    function setTimeout(callback, delay) {
        if (runtime.destroyed) return 0;
        var id = window.setTimeout(function() {
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

    function listenDom(target, event, handler, options) {
        if (!target || typeof target.addEventListener !== 'function') return false;
        target.addEventListener(event, handler, options);
        addDisposer(function() {
            try { target.removeEventListener(event, handler, options); } catch (error) {}
        });
        return true;
    }

    function removeThemeClasses(body) {
        if (!body) return;
        var classes = Array.prototype.slice.call(body.classList);
        classes.forEach(function(name) {
            if (name === 'lampa-theme-engine' || 
                name === 'lte-tv-ui' ||
                name.indexOf('lte-density-') === 0 ||
                name.indexOf('lte-motion-') === 0 ||
                name.indexOf('lte-performance-') === 0 ||
                name.indexOf('lte-device-') === 0 ||
                name.indexOf('lte-layout-') === 0 ||
                name.indexOf('lte-input-') === 0 ||
                name.indexOf('lte-height-') === 0) {
                body.classList.remove(name);
            }
        });
    }

    function setInputModeClass(mode) {
        var body = document.body;
        if (!body || ['pointer', 'touch', 'keyboard', 'remote'].indexOf(mode) < 0) return;
        if (runtime.lastInputMode === mode && body.classList.contains('lte-input-' + mode)) return;
        runtime.lastInputMode = mode;
        if (!body.classList.contains('lampa-theme-engine')) return;
        ['lte-input-pointer', 'lte-input-touch', 'lte-input-keyboard', 'lte-input-remote'].forEach(function(name) {
            body.classList.remove(name);
        });
        body.classList.add('lte-input-' + mode);
    }

    function keyInputMode() {
        if (remoteEnvironment() && runtime.lastInputMode !== 'pointer' && runtime.lastInputMode !== 'touch' && runtime.lastInputMode !== 'keyboard') {
            return 'remote';
        }
        if (pointerEnvironment() || document.body && document.body.classList.contains('platform--browser')) {
            return 'keyboard';
        }
        return runtime.lastInputMode === 'remote' ? 'remote' : 'keyboard';
    }

    function applyTheme() {
        var body = document.body;
        if (!body || runtime.destroyed) return;
        
        // Проверяем, включена ли тема
        if (!boolValue(storageGet(KEYS.enabled, true), true)) {
            // Если выключена — удаляем классы
            if (body.classList.contains('lampa-theme-engine')) {
                removeThemeClasses(body);
                var style = document.getElementById(STYLE_ID);
                if (style && style.parentNode) style.parentNode.removeChild(style);
            }
            return;
        }
        
        // Получаем настройки
        var density = String(storageGet(KEYS.density, 'comfortable') || 'comfortable');
        var motion = String(storageGet(KEYS.motion, 'calm') || 'calm');
        var performance = String(storageGet(KEYS.performance, 'standard') || 'standard');
        
        if (density !== 'comfortable' && density !== 'compact') density = 'comfortable';
        if (motion !== 'calm' && motion !== 'minimal') motion = 'calm';
        if (performance !== 'standard' && performance !== 'lite') performance = 'standard';
        
        // Определяем режимы
        var layout = detectLayoutMode();
        var heightMode = detectHeightMode();
        var input = runtime.lastInputMode || detectInputMode();
        runtime.lastInputMode = input;
        var tvMode = tvUiEnvironment();
        
        // Удаляем старые классы
        removeThemeClasses(body);
        
        // Добавляем новые
        body.classList.add('lampa-theme-engine');
        body.classList.add('lte-density-' + density);
        body.classList.add('lte-motion-' + motion);
        body.classList.add('lte-performance-' + performance);
        body.classList.add('lte-layout-' + layout);
        body.classList.add('lte-height-' + heightMode);
        body.classList.add('lte-input-' + input);
        body.classList.add('lte-device-' + layout);
        if (tvMode) body.classList.add('lte-tv-ui');
        
        // Убеждаемся, что стили вставлены
        injectStyle();
    }

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function installInputModeListeners() {
        listenDom(window, 'pointerdown', function(event) {
            setInputModeClass(event && event.pointerType === 'touch' ? 'touch' : 'pointer');
        }, { passive: true });
        
        listenDom(window, 'mousemove', function(event) {
            var now = Date.now ? Date.now() : new Date().getTime();
            var x = event && typeof event.clientX === 'number' ? event.clientX : 0;
            var y = event && typeof event.clientY === 'number' ? event.clientY : 0;
            if (runtime.lastMouseX === null || runtime.lastMouseY === null) {
                runtime.lastMouseX = x;
                runtime.lastMouseY = y;
                return;
            }
            var distance = Math.abs(x - runtime.lastMouseX) + Math.abs(y - runtime.lastMouseY);
            runtime.lastMouseX = x;
            runtime.lastMouseY = y;
            if (distance < 8 || now - runtime.lastKeyboardInputAt < 650) return;
            setInputModeClass('pointer');
        }, { passive: true });
        
        listenDom(window, 'touchstart', function() {
            setInputModeClass('touch');
        }, { passive: true });
        
        listenDom(window, 'keydown', function() {
            runtime.lastKeyboardInputAt = Date.now ? Date.now() : new Date().getTime();
            setInputModeClass(keyInputMode());
        }, { passive: true });
        
        listenDom(window, 'orientationchange', function() {
            applyTheme();
        }, { passive: true });
        
        // Следим за изменением размера через Lampa
        if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
            try {
                Lampa.Listener.follow('resize_end', function() {
                    applyTheme();
                });
                addDisposer(function() {
                    try { Lampa.Listener.remove('resize_end'); } catch (error) {}
                });
            } catch (error) {
                console.warn('[Theme Engine] Failed to follow resize_end:', error);
            }
        }
    }

    // =============================================
    // 6. Добавление настроек в Lampa
    // =============================================
    
    function addSettings() {
        if (!window.Lampa || !Lampa.SettingsApi) return false;
        
        // Удаляем старую версию настроек, если есть
        try { Lampa.SettingsApi.removeComponent(PLUGIN_ID); } catch (error) {}
        
        // Иконка для раздела
        var icon = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="24" height="22" rx="7" stroke="currentColor" stroke-width="2"/><path d="M9 19.5 13.2 15l3.3 3.1L23 11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23" cy="11.5" r="2" fill="currentColor"/></svg>';
        
        Lampa.SettingsApi.addComponent({
            component: PLUGIN_ID,
            name: 'Тема оформления',
            icon: icon
        });
        
        // Параметр: Включить тему
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: {
                name: KEYS.enabled,
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Включить тему',
                description: 'Современное оформление интерфейса Lampa'
            },
            onChange: function() {
                applyTheme();
                // Принудительно обновляем интерфейс
                try { if (Lampa.Activity) Lampa.Activity.refresh(false); } catch (error) {}
            }
        });
        
        // Параметр: Плотность карточек
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: {
                name: KEYS.density,
                type: 'select',
                values: {
                    comfortable: 'Комфортно',
                    compact: 'Компактно'
                },
                default: 'comfortable'
            },
            field: {
                name: 'Размер карточек',
                description: 'Компактный режим показывает больше контента в строке'
            },
            onChange: applyTheme
        });
        
        // Параметр: Анимации
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: {
                name: KEYS.motion,
                type: 'select',
                values: {
                    calm: 'Плавно',
                    minimal: 'Без анимаций'
                },
                default: 'calm'
            },
            field: {
                name: 'Движение',
                description: 'Отключает декоративные переходы, сохраняя состояния фокуса'
            },
            onChange: applyTheme
        });
        
        // Параметр: Производительность
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: {
                name: KEYS.performance,
                type: 'select',
                values: {
                    standard: 'Обычный',
                    lite: 'Экономный'
                },
                default: 'standard'
            },
            field: {
                name: 'Производительность',
                description: 'Экономный режим отключает динамический фон и тяжёлые тени'
            },
            onChange: applyTheme
        });
        
        return true;
    }

    // =============================================
    // 7. Запуск плагина
    // =============================================
    
    function start() {
        if (runtime.destroyed || runtime.started) return;
        if (!document.head || !document.body || !window.Lampa || !Lampa.SettingsApi) {
            setTimeout(start, 100);
            return;
        }
        
        runtime.started = true;
        console.log('[Theme Engine] v' + VERSION + ' started');
        
        // Добавляем настройки
        addSettings();
        
        // Применяем тему
        applyTheme();
        
        // Устанавливаем слушатели ввода
        installInputModeListeners();
        
        // Наблюдаем за изменениями body
        if (window.MutationObserver && document.body) {
            runtime.observer = new MutationObserver(function() {
                if (!runtime.destroyed && !runtime.observer) return;
                // Проверяем, не изменился ли класс layout
                var currentLayout = detectLayoutMode();
                var body = document.body;
                if (body && !body.classList.contains('lte-layout-' + currentLayout)) {
                    applyTheme();
                }
            });
            runtime.observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
        
        // Отложенное применение для гарантии
        setTimeout(function() {
            applyTheme();
        }, 200);
    }

    // =============================================
    // 8. Экспорт API
    // =============================================
    
    var api = {
        version: VERSION,
        apply: applyTheme,
        destroy: runtime.destroy.bind(runtime),
        getState: function() {
            return {
                version: VERSION,
                destroyed: runtime.destroyed,
                started: runtime.started,
                settings: {
                    enabled: storageGet(KEYS.enabled, true),
                    density: storageGet(KEYS.density, 'comfortable'),
                    motion: storageGet(KEYS.motion, 'calm'),
                    performance: storageGet(KEYS.performance, 'standard')
                },
                layout: {
                    mode: detectLayoutMode(),
                    height: detectHeightMode(),
                    input: runtime.lastInputMode || detectInputMode(),
                    tv: tvUiEnvironment()
                }
            };
        }
    };
    
    window.__LTE_API__ = api;
    window[RUNTIME_KEY] = runtime;

    // Запускаем
    if (document.readyState === 'loading') {
        listenDom(document, 'DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
    
    // Слушаем событие готовности Lampa
    if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        try {
            Lampa.Listener.follow('app', function(event) {
                if (event && event.type === 'ready') {
                    start();
                }
            });
        } catch (error) {
            console.warn('[Theme Engine] Failed to follow app event:', error);
        }
    }

    console.log('[Theme Engine] v' + VERSION + ' loaded');
})();