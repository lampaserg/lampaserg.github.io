(function () {
    'use strict';

    if (window.plugin_netflix_theme_ready) return;

    function startPlugin() {
        window.plugin_netflix_theme_ready = true;

        // ============================================
        // Netflix Theme for Lampa TV
        // ============================================

        var heroTimer = null;
        var heroEl = null;
        var overlayObserver = null;
        var currentTheme = 'dark';

        // ---- Темы оформления ----
        var themes = {
            dark: {
                name: 'Dark Netflix',
                primary: '#e50914',
                secondary: '#141414',
                accent: '#0071eb',
                cardScale: 1.04,  // Уменьшен вылет (было 1.08)
                cardRadius: '8px',
                glowIntensity: '0 0 15px rgba(0,0,0,0.4)',
                textColor: '#ffffff',
                secondaryText: '#b3b3b3'
            },
            blue: {
                name: 'Blue Ocean',
                primary: '#0077b6',
                secondary: '#023e8a',
                accent: '#00b4d8',
                cardScale: 1.04,  // Уменьшен вылет
                cardRadius: '12px',
                glowIntensity: '0 0 15px rgba(0,123,255,0.3)',
                textColor: '#ffffff',
                secondaryText: '#ade8f4'
            },
            red: {
                name: 'Red Passion',
                primary: '#d90429',
                secondary: '#2b2d42',
                accent: '#ef233c',
                cardScale: 1.04,  // Уменьшен вылет
                cardRadius: '8px',
                glowIntensity: '0 0 15px rgba(217,4,41,0.3)',
                textColor: '#ffffff',
                secondaryText: '#ffb3b3'
            }
        };

        // ---- Загрузка/сохранение темы ----
        function loadTheme() {
            var saved = Lampa.Storage.get('netflix_theme_selected', 'dark');
            if (themes[saved]) {
                currentTheme = saved;
            } else {
                currentTheme = 'dark';
            }
            return themes[currentTheme];
        }

        function saveTheme(themeKey) {
            currentTheme = themeKey;
            Lampa.Storage.set('netflix_theme_selected', themeKey);
            applyThemeStyles();
            injectCSS();
            // Принудительно обновляем стили на всех страницах
            setTimeout(function() {
                applyThemeStyles();
                var active = Lampa.Activity.active();
                if (active && active.activity && active.activity.render) {
                    var render = active.activity.render();
                    if (render) applyStylesToElement(render);
                }
            }, 100);
        }

        function applyStylesToElement(element) {
            if (!element) return;
            var theme = themes[currentTheme];
            if (!theme) return;
            $(element).find('.card').css('transform', '');
            $(element).find('.card__view').css('border-radius', theme.cardRadius);
        }

        // ---- Применение стилей темы (глобально) ----
        function applyThemeStyles() {
            var theme = themes[currentTheme];
            if (!theme) return;
            
            var style = document.getElementById('netflix-theme-dynamic');
            if (!style) {
                style = document.createElement('style');
                style.id = 'netflix-theme-dynamic';
                document.head.appendChild(style);
            }
            
            style.textContent = `
                /* Основные цвета темы */
                body {
                    background-color: ${theme.secondary} !important;
                    color: ${theme.textColor} !important;
                }
                
                /* Фокус на меню и кнопках */
                .menu__item.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .head__action.focus,
                .simple-button.focus {
                    background: ${theme.primary} !important;
                    color: white !important;
                }
                
                /* Карточки при фокусе - уменьшенный вылет */
                .card.focus {
                    transform: scale(${theme.cardScale}) !important;
                    z-index: 10 !important;
                    transition: transform 0.2s ease-out !important;
                }
                
                .card.focus .card__view {
                    box-shadow: ${theme.glowIntensity} !important;
                }
                
                .card .card__view {
                    border-radius: ${theme.cardRadius} !important;
                    overflow: hidden !important;
                    transition: box-shadow 0.2s ease-out !important;
                }
                
                /* Скроллбар */
                ::-webkit-scrollbar-track {
                    background: ${theme.secondary} !important;
                }
                ::-webkit-scrollbar-thumb {
                    background: ${theme.primary} !important;
                    border-radius: 3px !important;
                }
                
                /* Hero баннер */
                .nf-hero__vote::before {
                    color: ${theme.primary} !important;
                }
                
                .nf-hero__gradient {
                    background: linear-gradient(to top, ${theme.secondary} 0%, transparent 100%) !important;
                }
                
                /* Заголовки строк */
                .items-line__title {
                    color: ${theme.textColor} !important;
                }
                
                /* Текст на карточках */
                .card__title,
                .card__age,
                .card__vote {
                    color: ${theme.textColor} !important;
                }
                
                /* Настройки */
                .settings-folder,
                .settings-param__name,
                .settings-param__value,
                .settings-param__descr {
                    color: ${theme.textColor} !important;
                }
                
                /* Полоска прогресса */
                .timeline__bar {
                    background: ${theme.primary} !important;
                }
                
                /* full-start кнопки */
                .full-start__button.focus .full-start__button__title {
                    color: white !important;
                }
                
                /* Стили для карточки фильма */
                .full-start {
                    background-color: ${theme.secondary} !important;
                }
                .full-start__background {
                    opacity: 0.3 !important;
                }
                .full-start__title,
                .full-start__title-original {
                    color: ${theme.textColor} !important;
                }
            `;
        }

        // ---- CSS Injection (основные стили) ----
        function injectCSS() {
            var existing = document.getElementById('netflix-theme-css');
            if (existing) existing.remove();

            var heroEnabled = Lampa.Storage.get('netflix_hero', true);
            var overlaysEnabled = Lampa.Storage.get('netflix_overlays', true);
            var animationsEnabled = Lampa.Storage.get('netflix_animations', true);
            var theme = themes[currentTheme];
            
            var overlayStyles = overlaysEnabled ? `
                .nf-card-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 12px 8px;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
                    transform: translateY(100%);
                    transition: transform 0.25s ease;
                    z-index: 3;
                }
                .card.focus .nf-card-overlay {
                    transform: translateY(0);
                }
                .nf-card-overlay__title {
                    font-size: 0.8em;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .nf-card-overlay__meta {
                    display: flex;
                    gap: 6px;
                    font-size: 0.65em;
                    color: rgba(255,255,255,0.7);
                }
            ` : '.nf-card-overlay { display: none !important; }';
            
            var heroStyles = heroEnabled ? `
                .nf-hero {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 70vh;
                    min-height: 450px;
                    z-index: 5;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.5s ease, visibility 0.5s ease;
                    overflow: hidden;
                    pointer-events: none;
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
                }
                .nf-hero__gradient {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 60%;
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
                    font-size: 3em;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.3em;
                    text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
                }
                .nf-hero__meta {
                    display: flex;
                    gap: 1em;
                    font-size: 1em;
                    color: rgba(255,255,255,0.9);
                    margin-bottom: 0.8em;
                }
                .nf-hero__vote::before {
                    content: "★";
                    margin-right: 0.3em;
                }
                .nf-hero__overview {
                    font-size: 0.9em;
                    line-height: 1.4;
                    color: rgba(255,255,255,0.85);
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            ` : '.nf-hero { display: none !important; }';
            
            var animationStyles = animationsEnabled ? `
                @keyframes nf-fade-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .nf-row-animated .items-line__body {
                    animation: nf-fade-up 0.4s ease forwards;
                }
                .card {
                    transition: transform 0.2s ease-out !important;
                }
            ` : '';
            
            var style = document.createElement('style');
            style.id = 'netflix-theme-css';
            style.type = 'text/css';
            style.textContent = `
                /* Netflix Theme Styles */
                ${heroStyles}
                ${overlayStyles}
                ${animationStyles}
                
                .items-line {
                    margin-bottom: 0;
                }
                ::-webkit-scrollbar {
                    width: 5px;
                    height: 5px;
                }
            `;
            document.head.appendChild(style);
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
                        '<span class="nf-hero__genres"></span>' +
                    '</div>' +
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
            var heroEnabled = Lampa.Storage.get('netflix_hero', true);
            if (!heroEnabled) {
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
                    vote.style.display = '';
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
            var overlaysEnabled = Lampa.Storage.get('netflix_overlays', true);
            if (!overlaysEnabled) return;
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
            var cards = (container || document).querySelectorAll('.card');
            for (var i = 0; i < cards.length; i++) {
                addCardOverlay(cards[i]);
            }
        }

        // ---- Row Animations ----
        function animateRows(container) {
            var animationsEnabled = Lampa.Storage.get('netflix_animations', true);
            if (!animationsEnabled) return;
            
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

        // ---- Translations ----
        function addTranslations() {
            if (!Lampa.Lang) return;

            Lampa.Lang.add({
                netflix_theme_name: {
                    ru: 'Netflix Тема',
                    en: 'Netflix Theme'
                },
                netflix_theme_select: {
                    ru: 'Выбрать тему',
                    en: 'Select Theme'
                },
                netflix_theme_dark: {
                    ru: 'Тёмная Netflix',
                    en: 'Dark Netflix'
                },
                netflix_theme_blue: {
                    ru: 'Синий океан',
                    en: 'Blue Ocean'
                },
                netflix_theme_red: {
                    ru: 'Красная страсть',
                    en: 'Red Passion'
                },
                netflix_theme_hero: {
                    ru: 'Кинематографичный баннер',
                    en: 'Cinematic Hero'
                },
                netflix_theme_overlays: {
                    ru: 'Детали при фокусе',
                    en: 'Card Focus Details'
                },
                netflix_theme_animations: {
                    ru: 'Анимация строк',
                    en: 'Row Motion'
                }
            });
        }

        // ---- ПОДНЯТИЕ ПАПКИ НАВЕРХ (как у "Интерфейс Мод") ----
        function moveFolderToTop() {
            setTimeout(function() {
                var netflixFolder = $('.settings-folder[data-component="netflix_theme"]');
                var interfaceFolder = $('.settings-folder[data-component="interface"]');
                
                if (netflixFolder.length && interfaceFolder.length) {
                    // Вставляем после папки "Интерфейс" (как в плагине "Интерфейс Мод")
                    netflixFolder.insertAfter(interfaceFolder);
                } else if (netflixFolder.length) {
                    // Если нет папки "Интерфейс", просто ищем первый элемент
                    var firstFolder = $('.settings-folder').first();
                    if (firstFolder.length) {
                        netflixFolder.insertAfter(firstFolder);
                    }
                }
                
                // Стилизуем папку
                netflixFolder.css({
                    'border-top': '1px solid rgba(255,255,255,0.1)',
                    'margin-top': '0.5em',
                    'padding-top': '0.5em'
                });
            }, 200);
        }

        // ---- Фикс слетания темы в карточке фильма ----
        function fixThemeOnFullCard() {
            Lampa.Listener.follow('full', function(e) {
                if (e.type === 'complite') {
                    setTimeout(function() {
                        applyThemeStyles();
                        // Применяем стили к рендеру карточки
                        if (e.object && e.object.activity && e.object.activity.render) {
                            var render = e.object.activity.render();
                            if (render) {
                                $(render).find('.full-start').css('backgroundColor', themes[currentTheme].secondary);
                                $(render).find('.full-start__title, .full-start__title-original')
                                    .css('color', themes[currentTheme].textColor);
                            }
                        }
                    }, 100);
                }
            });
        }

        // ---- Настройки (отдельная папка наверху) ----
        function addSettings() {
            if (!Lampa.SettingsApi) return;

            // Добавляем компонент Netflix Theme
            Lampa.SettingsApi.addComponent({
                component: 'netflix_theme',
                name: Lampa.Lang.translate('netflix_theme_name') || 'Netflix Theme',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>'
            });

            // Выбор темы
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'theme_select',
                    type: 'select',
                    values: {
                        dark: Lampa.Lang.translate('netflix_theme_dark') || 'Dark Netflix',
                        blue: Lampa.Lang.translate('netflix_theme_blue') || 'Blue Ocean',
                        red: Lampa.Lang.translate('netflix_theme_red') || 'Red Passion'
                    },
                    default: currentTheme
                },
                field: {
                    name: Lampa.Lang.translate('netflix_theme_select') || 'Select Theme',
                    description: 'Choose interface color scheme'
                },
                onChange: function (val) {
                    saveTheme(val);
                }
            });

            // Разделитель
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: { name: 'separator_1', type: 'title' },
                field: { name: '───── Features ─────' }
            });

            // Hero Banner
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'netflix_hero',
                    type: 'trigger',
                    default: Lampa.Storage.get('netflix_hero', true)
                },
                field: {
                    name: Lampa.Lang.translate('netflix_theme_hero') || 'Cinematic Hero',
                    description: 'Show full-screen hero with backdrop image'
                },
                onChange: function (val) {
                    Lampa.Storage.set('netflix_hero', val);
                    injectCSS();
                    if (!val) hideHero();
                }
            });

            // Card Overlays
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'netflix_overlays',
                    type: 'trigger',
                    default: Lampa.Storage.get('netflix_overlays', true)
                },
                field: {
                    name: Lampa.Lang.translate('netflix_theme_overlays') || 'Card Focus Details',
                    description: 'Show title and year overlay on focused cards'
                },
                onChange: function (val) {
                    Lampa.Storage.set('netflix_overlays', val);
                    injectCSS();
                    if (val) {
                        processCards();
                    } else {
                        document.querySelectorAll('.nf-card-overlay').forEach(function(el) { el.remove(); });
                    }
                }
            });

            // Row Animations
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'netflix_animations',
                    type: 'trigger',
                    default: Lampa.Storage.get('netflix_animations', true)
                },
                field: {
                    name: Lampa.Lang.translate('netflix_theme_animations') || 'Row Motion',
                    description: 'Smooth entrance motion for content rows'
                },
                onChange: function (val) {
                    Lampa.Storage.set('netflix_animations', val);
                    injectCSS();
                }
            });
            
            // Поднимаем папку наверх
            moveFolderToTop();
        }

        // ---- Main Init ----
        function addPlugin() {
            loadTheme();
            addTranslations();
            addSettings();
            injectCSS();
            applyThemeStyles();
            fixThemeOnFullCard();

            setTimeout(function () {
                var overlaysEnabled = Lampa.Storage.get('netflix_overlays', true);
                var animationsEnabled = Lampa.Storage.get('netflix_animations', true);

                if (overlaysEnabled) processCards();
                if (animationsEnabled) animateRows();
                startObservers();

                Lampa.Listener.follow('activity', function (e) {
                    if (e.type === 'start' || e.type === 'archive') {
                        setTimeout(function () {
                            applyThemeStyles();
                            if (Lampa.Storage.get('netflix_overlays', true)) processCards();
                            if (Lampa.Storage.get('netflix_animations', true)) animateRows();
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
