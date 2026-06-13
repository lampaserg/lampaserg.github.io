(function () {
    'use strict';

    if (window.plugin_netflix_theme_ready) return;

    function startPlugin() {
        window.plugin_netflix_theme_ready = true;

        // ============================================
        // Netflix Theme for Lampa TV v2.0
        // ============================================

        var heroTimer = null;
        var heroEl = null;
        var overlayObserver = null;
        var rowObserver = null;

        // ---- Настройки по умолчанию ----
        var defaultSettings = {
            theme: 'dark',
            primaryColor: '#e50914',
            secondaryColor: '#221f1f',
            accentColor: '#0071eb',
            heroEnabled: true,
            overlaysEnabled: true,
            animationsEnabled: true,
            cardScale: 1.08,
            cardBorderRadius: 0,
            glowIntensity: 'medium',
            heroBlur: 0,
            fontFamily: 'default'
        };

        var currentSettings = {};

        // ---- Загрузка/сохранение настроек ----
        function loadSettings() {
            for (var key in defaultSettings) {
                var saved = Lampa.Storage.get('netflix_theme_' + key);
                if (saved !== undefined && saved !== null) {
                    currentSettings[key] = saved;
                } else {
                    currentSettings[key] = defaultSettings[key];
                }
            }
        }

        function saveSetting(key, value) {
            currentSettings[key] = value;
            Lampa.Storage.set('netflix_theme_' + key, value);
            applyTheme();
        }

        // ---- Цветовые темы ----
        var themes = {
            netflix: {
                name: 'Netflix Classic',
                primaryColor: '#e50914',
                secondaryColor: '#141414',
                accentColor: '#0071eb',
                gradientStart: '#e50914',
                gradientEnd: '#b20710'
            },
            dark: {
                name: 'Dark Night',
                primaryColor: '#2c3e50',
                secondaryColor: '#1a1a2e',
                accentColor: '#3498db',
                gradientStart: '#2c3e50',
                gradientEnd: '#1a1a2e'
            },
            blue: {
                name: 'Blue Ocean',
                primaryColor: '#0077b6',
                secondaryColor: '#023e8a',
                accentColor: '#00b4d8',
                gradientStart: '#0077b6',
                gradientEnd: '#023e8a'
            },
            cyan: {
                name: 'Cyan Dream',
                primaryColor: '#00b4d8',
                secondaryColor: '#03045e',
                accentColor: '#90e0ef',
                gradientStart: '#00b4d8',
                gradientEnd: '#03045e'
            },
            red: {
                name: 'Red Passion',
                primaryColor: '#d90429',
                secondaryColor: '#2b2d42',
                accentColor: '#ef233c',
                gradientStart: '#d90429',
                gradientEnd: '#8d0801'
            },
            green: {
                name: 'Green Forest',
                primaryColor: '#2d6a4f',
                secondaryColor: '#1b4332',
                accentColor: '#52b788',
                gradientStart: '#2d6a4f',
                gradientEnd: '#1b4332'
            },
            purple: {
                name: 'Purple Galaxy',
                primaryColor: '#7209b7',
                secondaryColor: '#3f37c9',
                accentColor: '#b5179e',
                gradientStart: '#7209b7',
                gradientEnd: '#3f37c9'
            },
            orange: {
                name: 'Orange Sunset',
                primaryColor: '#f4a261',
                secondaryColor: '#e76f51',
                accentColor: '#e9c46a',
                gradientStart: '#f4a261',
                gradientEnd: '#e76f51'
            },
            gold: {
                name: 'Gold Royal',
                primaryColor: '#ffd700',
                secondaryColor: '#1a1a1a',
                accentColor: '#ffaa00',
                gradientStart: '#ffd700',
                gradientEnd: '#ff8c00'
            }
        };

        // ---- Генерация CSS ----
        function generateCSS() {
            var primary = currentSettings.primaryColor;
            var secondary = currentSettings.secondaryColor;
            var accent = currentSettings.accentColor;
            var glowIntensity = currentSettings.glowIntensity;
            var cardScale = currentSettings.cardScale;
            var cardRadius = currentSettings.cardBorderRadius;
            var heroBlur = currentSettings.heroBlur;
            var fontFamily = currentSettings.fontFamily === 'modern' ? "'Inter', 'Segoe UI', sans-serif" : "'Roboto', 'Open Sans', sans-serif";
            
            var glowMap = {
                low: '0 0 10px rgba(0,0,0,0.3)',
                medium: '0 0 20px rgba(0,0,0,0.5)',
                high: '0 0 35px rgba(0,0,0,0.7)'
            };
            
            var glow = glowMap[glowIntensity] || glowMap.medium;
            
            return `
                <style id="netflix-theme-css">
                    /* Основные переменные */
                    :root {
                        --nf-primary: ${primary};
                        --nf-secondary: ${secondary};
                        --nf-accent: ${accent};
                        --nf-card-scale: ${cardScale};
                        --nf-card-radius: ${cardRadius}px;
                        --nf-hero-blur: ${heroBlur}px;
                        --nf-glow: ${glow};
                        --nf-font-family: ${fontFamily};
                    }

                    /* Глобальные стили */
                    body {
                        font-family: var(--nf-font-family);
                        background: var(--nf-secondary);
                    }

                    /* Hero Billboard */
                    .nf-hero {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 75vh;
                        min-height: 500px;
                        z-index: 5;
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.5s ease, visibility 0.5s ease;
                        overflow: hidden;
                    }

                    .nf-hero.visible {
                        opacity: 1;
                        visibility: visible;
                    }

                    .nf-hero__image {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        filter: blur(var(--nf-hero-blur));
                        transform: scale(1.02);
                    }

                    .nf-hero__gradient {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 60%;
                        background: linear-gradient(to top, var(--nf-secondary) 0%, transparent 100%);
                    }

                    .nf-hero__info {
                        position: absolute;
                        bottom: 20%;
                        left: 5%;
                        max-width: 45%;
                        z-index: 2;
                        animation: nf-fade-up 0.6s ease;
                    }

                    .nf-hero__title {
                        font-size: 3.5em;
                        font-weight: 700;
                        color: white;
                        margin-bottom: 0.3em;
                        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
                    }

                    .nf-hero__meta {
                        display: flex;
                    gap: 1em;
                    font-size: 1.1em;
                    color: rgba(255,255,255,0.9);
                    margin-bottom: 1em;
                }

                .nf-hero__year, .nf-hero__vote {
                    display: inline-flex;
                    align-items: center;
                }

                .nf-hero__vote::before {
                    content: "★";
                    color: gold;
                    margin-right: 0.3em;
                }

                .nf-hero__genres {
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 1em;
                }

                .nf-hero__overview {
                    font-size: 1em;
                    line-height: 1.5;
                    color: rgba(255,255,255,0.85);
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Card Overlay */
                .nf-card-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 15px 10px;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                    z-index: 3;
                }

                .card.focus .nf-card-overlay {
                    transform: translateY(0);
                }

                .nf-card-overlay__title {
                    font-size: 0.85em;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .nf-card-overlay__meta {
                    display: flex;
                    gap: 8px;
                    font-size: 0.7em;
                    color: rgba(255,255,255,0.7);
                }

                /* Card Animations */
                .card {
                    transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
                }

                .card.focus {
                    transform: scale(var(--nf-card-scale));
                    z-index: 10;
                }

                .card.focus .card__view {
                    box-shadow: var(--nf-glow);
                }

                .card .card__view {
                    border-radius: var(--nf-card-radius);
                    overflow: hidden;
                    transition: box-shadow 0.3s ease;
                }

                /* Row Animations */
                @keyframes nf-fade-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .nf-row-animated .items-line__body {
                    animation: nf-fade-up 0.5s ease forwards;
                }

                /* Scrollbar Styling */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }

                ::-webkit-scrollbar-track {
                    background: var(--nf-secondary);
                }

                ::-webkit-scrollbar-thumb {
                    background: var(--nf-primary);
                    border-radius: 3px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: var(--nf-accent);
                }

                /* Focus styles for buttons and menus */
                .menu__item.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus {
                    background: var(--nf-primary) !important;
                    color: white !important;
                }

                /* Fullstart button styling */
                .full-start__button {
                    transition: all 0.3s ease;
                }

                .full-start__button.focus {
                    transform: scale(1.05);
                    background: var(--nf-primary) !important;
                }

                /* Loading animation */
                .broadcast__scan div {
                    background: var(--nf-primary);
                }

                /* Category headers */
                .items-line__title {
                    font-weight: 600;
                    letter-spacing: -0.5px;
                }

                /* Settings panel accent */
                .settings-param.focus .settings-param__value {
                    color: var(--nf-primary);
                }
            </style>
            `;
        }

        function injectCSS() {
            var existing = document.getElementById('netflix-theme-css');
            if (existing) existing.remove();
            
            var css = generateCSS();
            var div = document.createElement('div');
            div.innerHTML = css;
            var style = div.firstChild;
            style.id = 'netflix-theme-css';
            document.head.appendChild(style);
        }

        // ---- Применение темы ----
        function applyTheme() {
            injectCSS();
            
            // Применяем дополнительные стили для body
            document.body.style.backgroundColor = currentSettings.secondaryColor;
            
            // Пересоздаем hero если нужно
            if (currentSettings.heroEnabled && heroEl) {
                var wasVisible = heroEl.classList.contains('visible');
                heroEl.remove();
                heroEl = null;
                createHero();
                if (wasVisible && currentSettings.heroEnabled) {
                    var focusedCard = document.querySelector('.card.focus');
                    if (focusedCard) updateHero(focusedCard);
                }
            }
        }

        // ---- Hero Billboard ----
        function createHero() {
            if (heroEl) return heroEl;

            heroEl = document.createElement('div');
            heroEl.className = 'nf-hero';
            heroEl.innerHTML =
                '<img class="nf-hero__image" src="" alt="" />' +
                '<div class="nf-hero__gradient"></div>' +
                '<div class="nf-hero__info">' +
                    '<div class="nf-hero__title"></div>' +
                    '<div class="nf-hero__meta">' +
                        '<span class="nf-hero__year"></span>' +
                        '<span class="nf-hero__vote"></span>' +
                    '</div>' +
                    '<div class="nf-hero__genres"></div>' +
                    '<div class="nf-hero__overview"></div>' +
                '</div>';

            var wrap = document.querySelector('.wrap');
            if (wrap) {
                wrap.parentNode.insertBefore(heroEl, wrap);
            } else {
                document.body.insertBefore(heroEl, document.body.firstChild);
            }

            return heroEl;
        }

        function updateHero(card) {
            if (!currentSettings.heroEnabled) {
                hideHero();
                return;
            }
            
            if (!card) return;

            clearTimeout(heroTimer);

            heroTimer = setTimeout(function () {
                var data = getCardData(card);
                if (!data) {
                    hideHero();
                    return;
                }

                var hero = createHero();
                var img = hero.querySelector('.nf-hero__image');
                var title = hero.querySelector('.nf-hero__title');
                var year = hero.querySelector('.nf-hero__year');
                var vote = hero.querySelector('.nf-hero__vote');
                var genres = hero.querySelector('.nf-hero__genres');
                var overview = hero.querySelector('.nf-hero__overview');

                var backdrop = data.backdrop || data.img || '';
                if (backdrop) {
                    backdrop = backdrop.replace('/w200/', '/w1280/').replace('/w300/', '/w1280/').replace('/w500/', '/w1280/');
                    img.src = backdrop;
                    img.style.display = '';
                } else {
                    img.style.display = 'none';
                }

                title.textContent = data.title || '';
                year.textContent = data.year || '';
                
                if (data.vote) {
                    vote.textContent = data.vote;
                    vote.style.display = 'inline-flex';
                } else {
                    vote.style.display = 'none';
                }

                genres.textContent = data.genres || '';
                overview.textContent = data.overview || '';

                hero.classList.add('visible');
            }, 900);
        }

        function hideHero() {
            if (heroEl) {
                heroEl.classList.remove('visible');
            }
            clearTimeout(heroTimer);
        }

        // ---- Card Data Extraction ----
        function getCardData(cardEl) {
            if (!cardEl) return null;

            var data = {};

            try {
                var $card = $(cardEl);
                var cardData = $card.data('card') || {};

                data.title = cardData.title || cardData.name || cardData.original_title || cardData.original_name || '';
                data.year = '';
                var dateStr = cardData.release_date || cardData.first_air_date || '';
                if (dateStr) {
                    data.year = dateStr.substring(0, 4);
                }
                data.vote = cardData.vote_average ? parseFloat(cardData.vote_average).toFixed(1) : '';
                data.overview = cardData.overview || '';
                data.img = cardData.poster_path ? ('https://image.tmdb.org/t/p/w500' + cardData.poster_path) : '';
                data.backdrop = cardData.backdrop_path ? ('https://image.tmdb.org/t/p/w1280' + cardData.backdrop_path) : '';

                if (cardData.genre_ids && cardData.genre_ids.length && Lampa.Api) {
                    try {
                        var type = cardData.first_air_date ? 'tv' : 'movie';
                        var genreNames = Lampa.Api.sources.tmdb.getGenresNameFromIds(type, cardData.genre_ids);
                        if (genreNames) data.genres = genreNames;
                    } catch (e) {}
                }
                if (!data.genres && cardData.genres) {
                    data.genres = cardData.genres.map(function (g) { return g.name; }).join(', ');
                }
            } catch (e) {
                var titleEl = cardEl.querySelector('.card__title');
                var ageEl = cardEl.querySelector('.card__age');
                var voteEl = cardEl.querySelector('.card__vote');
                var imgEl = cardEl.querySelector('.card__img');

                data.title = titleEl ? titleEl.textContent.trim() : '';
                data.year = ageEl ? ageEl.textContent.trim() : '';
                data.vote = voteEl ? voteEl.textContent.trim() : '';
                data.img = imgEl ? (imgEl.src || '') : '';
                data.backdrop = '';
                data.overview = '';
                data.genres = '';
            }

            if (!data.title && !data.img) return null;
            return data;
        }

        // ---- Card Overlay Injection ----
        function addCardOverlay(card) {
            if (!currentSettings.overlaysEnabled) return;
            if (card.querySelector('.nf-card-overlay')) return;

            var view = card.querySelector('.card__view');
            if (!view) return;

            var data = getCardData(card);
            if (!data || !data.title) return;

            var overlay = document.createElement('div');
            overlay.className = 'nf-card-overlay';

            var html = '<div class="nf-card-overlay__title">' + escapeHtml(data.title) + '</div>';
            if (data.year) {
                html += '<div class="nf-card-overlay__meta">';
                html += '<span class="nf-card-overlay__year">' + escapeHtml(data.year) + '</span>';
                html += '</div>';
            }

            overlay.innerHTML = html;
            view.style.position = 'relative';
            view.appendChild(overlay);
        }

        function processCards(container) {
            if (!currentSettings.overlaysEnabled) return;
            var cards = (container || document).querySelectorAll('.card');
            for (var i = 0; i < cards.length; i++) {
                addCardOverlay(cards[i]);
            }
        }

        // ---- Row Animations ----
        function animateRows(container) {
            if (!currentSettings.animationsEnabled) return;
            var rows = (container || document).querySelectorAll('.items-line');
            for (var i = 0; i < rows.length; i++) {
                if (!rows[i].classList.contains('nf-row-animated')) {
                    rows[i].classList.add('nf-row-animated');
                }
            }
        }

        // ---- Mutation Observer ----
        function startObservers() {
            var target = document.querySelector('.activitys') || document.body;

            overlayObserver = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var added = mutations[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                        var node = added[j];
                        if (node.nodeType !== 1) continue;

                        if (node.classList && node.classList.contains('card')) {
                            addCardOverlay(node);
                        } else if (node.querySelectorAll) {
                            processCards(node);
                            animateRows(node);
                        }
                    }
                }
            });

            overlayObserver.observe(target, {
                childList: true,
                subtree: true
            });

            var focusObserver = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var t = mutations[i].target;
                    if (t.classList && t.classList.contains('card')) {
                        if (t.classList.contains('focus')) {
                            updateHero(t);
                        }
                    }
                }
            });

            focusObserver.observe(target, {
                attributes: true,
                attributeFilter: ['class'],
                subtree: true
            });
        }

        // ---- Utility ----
        function escapeHtml(str) {
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        }

        // ---- Настройки в Lampa ----
        function addSettings() {
            if (!Lampa.SettingsApi) return;

            // Компонент настроек темы
            Lampa.SettingsApi.addComponent({
                component: 'netflix_theme',
                name: 'Netflix Theme',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>'
            });

            // Выбор темы
            var themeOptions = { default: 'Пользовательская' };
            for (var key in themes) {
                themeOptions[key] = themes[key].name;
            }
            
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'theme_preset',
                    type: 'select',
                    values: themeOptions,
                    default: 'netflix'
                },
                field: {
                    name: 'Цветовая тема',
                    description: 'Выберите предустановленную цветовую схему'
                },
                onChange: function (val) {
                    if (val !== 'default' && themes[val]) {
                        var theme = themes[val];
                        saveSetting('primaryColor', theme.primaryColor);
                        saveSetting('secondaryColor', theme.secondaryColor);
                        saveSetting('accentColor', theme.accentColor);
                    }
                    saveSetting('theme', val);
                }
            });

            // Основные цвета
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'primary_color',
                    type: 'input',
                    default: currentSettings.primaryColor,
                    values: ''
                },
                field: {
                    name: 'Основной цвет',
                    description: 'HEX код основного цвета (например #e50914)'
                },
                onChange: function (val) {
                    if (val && val.match(/^#?[A-Fa-f0-9]{6}$/)) {
                        if (val[0] !== '#') val = '#' + val;
                        saveSetting('primaryColor', val);
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'secondary_color',
                    type: 'input',
                    default: currentSettings.secondaryColor,
                    values: ''
                },
                field: {
                    name: 'Фоновый цвет',
                    description: 'HEX код фонового цвета'
                },
                onChange: function (val) {
                    if (val && val.match(/^#?[A-Fa-f0-9]{6}$/)) {
                        if (val[0] !== '#') val = '#' + val;
                        saveSetting('secondaryColor', val);
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'accent_color',
                    type: 'input',
                    default: currentSettings.accentColor,
                    values: ''
                },
                field: {
                    name: 'Акцентный цвет',
                    description: 'HEX код акцентного цвета'
                },
                onChange: function (val) {
                    if (val && val.match(/^#?[A-Fa-f0-9]{6}$/)) {
                        if (val[0] !== '#') val = '#' + val;
                        saveSetting('accentColor', val);
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'separator_1',
                    type: 'title'
                },
                field: { name: '───── Визуальные эффекты ─────' }
            });

            // Масштаб карточек
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'card_scale',
                    type: 'select',
                    values: {
                        1.02: 'Минимальный (1.02x)',
                        1.05: 'Малый (1.05x)',
                        1.08: 'Средний (1.08x)',
                        1.12: 'Большой (1.12x)',
                        1.15: 'Максимальный (1.15x)'
                    },
                    default: String(currentSettings.cardScale)
                },
                field: {
                    name: 'Масштаб карточек',
                    description: 'Увеличение карточки при фокусе'
                },
                onChange: function (val) {
                    saveSetting('cardScale', parseFloat(val));
                }
            });

            // Скругление углов
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'card_border_radius',
                    type: 'select',
                    values: {
                        0: '0px (прямые)',
                        4: '4px (малые)',
                        8: '8px (средние)',
                        12: '12px (большие)',
                        16: '16px (круглые)'
                    },
                    default: String(currentSettings.cardBorderRadius)
                },
                field: {
                    name: 'Скругление углов карточек',
                    description: 'Радиус скругления углов'
                },
                onChange: function (val) {
                    saveSetting('cardBorderRadius', parseInt(val));
                }
            });

            // Интенсивность свечения
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'glow_intensity',
                    type: 'select',
                    values: {
                        low: 'Слабое',
                        medium: 'Среднее',
                        high: 'Сильное'
                    },
                    default: currentSettings.glowIntensity
                },
                field: {
                    name: 'Свечение карточек',
                    description: 'Интенсивность свечения при фокусе'
                },
                onChange: function (val) {
                    saveSetting('glowIntensity', val);
                }
            });

            // Размытие hero
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'hero_blur',
                    type: 'select',
                    values: {
                        0: 'Нет',
                        3: 'Слабое',
                        6: 'Среднее',
                        10: 'Сильное'
                    },
                    default: String(currentSettings.heroBlur)
                },
                field: {
                    name: 'Размытие фона Hero',
                    description: 'Размытие фонового изображения баннера'
                },
                onChange: function (val) {
                    saveSetting('heroBlur', parseInt(val));
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'separator_2',
                    type: 'title'
                },
                field: { name: '───── Функции интерфейса ─────' }
            });

            // Включение/выключение функций
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'hero_enabled',
                    type: 'trigger',
                    default: currentSettings.heroEnabled
                },
                field: {
                    name: 'Cinematic Hero',
                    description: 'Показывать полноэкранный баннер с фоном'
                },
                onChange: function (val) {
                    saveSetting('heroEnabled', val);
                    if (!val) hideHero();
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'overlays_enabled',
                    type: 'trigger',
                    default: currentSettings.overlaysEnabled
                },
                field: {
                    name: 'Детали на карточках',
                    description: 'Показывать название и год на выбранной карточке'
                },
                onChange: function (val) {
                    saveSetting('overlaysEnabled', val);
                    if (val) {
                        processCards();
                    } else {
                        document.querySelectorAll('.nf-card-overlay').forEach(function(el) { el.remove(); });
                    }
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'animations_enabled',
                    type: 'trigger',
                    default: currentSettings.animationsEnabled
                },
                field: {
                    name: 'Анимация строк',
                    description: 'Плавная анимация появления строк с контентом'
                },
                onChange: function (val) {
                    saveSetting('animationsEnabled', val);
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'font_family',
                    type: 'select',
                    values: {
                        default: 'Стандартный (Roboto)',
                        modern: 'Современный (Inter)'
                    },
                    default: currentSettings.fontFamily
                },
                field: {
                    name: 'Шрифт интерфейса',
                    description: 'Выберите стиль шрифта'
                },
                onChange: function (val) {
                    saveSetting('fontFamily', val);
                }
            });
        }

        // ---- Main Init ----
        function addPlugin() {
            loadSettings();
            addSettings();
            injectCSS();
            applyTheme();

            setTimeout(function () {
                if (currentSettings.overlaysEnabled) processCards();
                if (currentSettings.animationsEnabled) animateRows();
                startObservers();

                Lampa.Listener.follow('activity', function (e) {
                    if (e.type === 'start' || e.type === 'archive') {
                        setTimeout(function () {
                            if (currentSettings.overlaysEnabled) processCards();
                            if (currentSettings.animationsEnabled) animateRows();
                        }, 100);
                    }
                });

                Lampa.Listener.follow('full', function (e) {
                    if (e.type === 'start') hideHero();
                });

                Lampa.Listener.follow('player', function (e) {
                    if (e.type === 'start') hideHero();
                });
            }, 300);
        }

        // ---- Start ----
        if (window.appready) {
            addPlugin();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') addPlugin();
            });
        }
    }

    startPlugin();
})();