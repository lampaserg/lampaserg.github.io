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
        var rowObserver = null;

        // ---- CSS Injection ----
        function injectCSS() {
            if (document.getElementById('netflix-theme-css')) return;

            var style = document.createElement('style');
            style.id = 'netflix-theme-css';
            style.type = 'text/css';
            style.textContent = getThemeCSS();
            document.head.appendChild(style);
        }

        function getThemeCSS() {
            var heroEnabled = Lampa.Storage.get('netflix_hero', true);
            var overlaysEnabled = Lampa.Storage.get('netflix_overlays', true);
            var animationsEnabled = Lampa.Storage.get('netflix_animations', true);
            
            var overlayStyles = overlaysEnabled ? `
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
            ` : '.nf-card-overlay { display: none !important; }';
            
            var heroStyles = heroEnabled ? `
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
                }

                .nf-hero__gradient {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 60%;
                    background: linear-gradient(to top, #141414 0%, transparent 100%);
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

                .nf-hero__vote::before {
                    content: "★";
                    color: gold;
                    margin-right: 0.3em;
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
            ` : '.nf-hero { display: none !important; }';
            
            var animationStyles = animationsEnabled ? `
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

                .card {
                    transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
                }

                .card.focus {
                    transform: scale(1.08);
                    z-index: 10;
                }

                .card.focus .card__view {
                    box-shadow: 0 0 20px rgba(0,0,0,0.5);
                }
            ` : '';
            
            return `
                <style id="netflix-theme-css">
                    /* Netflix Theme Styles */
                    ${heroStyles}
                    ${overlayStyles}
                    ${animationStyles}
                    
                    .card .card__view {
                        border-radius: 8px;
                        overflow: hidden;
                        transition: box-shadow 0.3s ease;
                    }

                    /* Row base styles */
                    .items-line {
                        margin-bottom: 0;
                    }

                    /* Focus styles for menus */
                    .menu__item.focus,
                    .settings-param.focus,
                    .selectbox-item.focus,
                    .full-start__button.focus {
                        background: #e50914 !important;
                        color: white !important;
                    }

                    /* Scrollbar styling */
                    ::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                    }

                    ::-webkit-scrollbar-track {
                        background: #221f1f;
                    }

                    ::-webkit-scrollbar-thumb {
                        background: #e50914;
                        border-radius: 3px;
                    }
                </style>
            `;
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
                document.body.appendChild(heroEl);
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

        // ---- Mutation Observer for Dynamic Content ----
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
                    en: 'Netflix Theme',
                    ru: 'Netflix Тема',
                    uk: 'Netflix Тема',
                    be: 'Netflix Тэма'
                },
                netflix_theme_hero: {
                    en: 'Cinematic Hero',
                    ru: 'Кинематографичный баннер',
                    uk: 'Кінематографічний банер',
                    be: 'Кінематаграфічны банер'
                },
                netflix_theme_hero_descr: {
                    en: 'Show full-screen hero with backdrop image',
                    ru: 'Показывать полноэкранный баннер с фоновым изображением',
                    uk: 'Показувати повноекранний банер з фоновим зображенням',
                    be: 'Паказваць поўнаэкранны банер з фонавым відарысам'
                },
                netflix_theme_overlays: {
                    en: 'Card Focus Details',
                    ru: 'Детали при фокусе',
                    uk: 'Деталі при фокусі',
                    be: 'Дэталі пры фокусе'
                },
                netflix_theme_overlays_descr: {
                    en: 'Show title and year overlay on focused cards',
                    ru: 'Показывать название и год на выбранной карточке',
                    uk: 'Показувати назву та рік на вибраній картці',
                    be: 'Паказваць назву і год на абранай картцы'
                },
                netflix_theme_animations: {
                    en: 'Row Motion',
                    ru: 'Анимация строк',
                    uk: 'Анімація рядків',
                    be: 'Анімацыя радкоў'
                },
                netflix_theme_animations_descr: {
                    en: 'Smooth entrance motion for content rows',
                    ru: 'Плавная анимация появления строк с контентом',
                    uk: 'Плавна анімація появи рядків з контентом',
                    be: 'Плаўная анімацыя з\'яўлення радкоў з кантэнтам'
                }
            });
        }

        // ---- Settings Integration (отдельная папка) ----
        function addSettings() {
            if (!Lampa.SettingsApi) return;

            // Добавляем компонент Netflix Theme как отдельную папку
            Lampa.SettingsApi.addComponent({
                component: 'netflix_theme',
                name: Lampa.Lang.translate('netflix_theme_name') || 'Netflix Theme',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>'
            });

            // Hero Banner
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                param: {
                    name: 'netflix_hero',
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: Lampa.Lang.translate('netflix_theme_hero') || 'Cinematic Hero',
                    description: Lampa.Lang.translate('netflix_theme_hero_descr') || 'Show full-screen hero with backdrop image'
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
                    default: true
                },
                field: {
                    name: Lampa.Lang.translate('netflix_theme_overlays') || 'Card Focus Details',
                    description: Lampa.Lang.translate('netflix_theme_overlays_descr') || 'Show title and year overlay on focused cards'
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
                    default: true
                },
                field: {
                    name: Lampa.Lang.translate('netflix_theme_animations') || 'Row Motion',
                    description: Lampa.Lang.translate('netflix_theme_animations_descr') || 'Smooth entrance motion for content rows'
                },
                onChange: function (val) {
                    Lampa.Storage.set('netflix_animations', val);
                    injectCSS();
                }
            });
        }

        // ---- Main Init ----
        function addPlugin() {
            addTranslations();
            addSettings();
            injectCSS();

            // Process existing content
            setTimeout(function () {
                var overlaysEnabled = Lampa.Storage.get('netflix_overlays', true);
                var animationsEnabled = Lampa.Storage.get('netflix_animations', true);

                if (overlaysEnabled) processCards();
                if (animationsEnabled) animateRows();
                startObservers();

                // Listen to activity changes for row animations
                Lampa.Listener.follow('activity', function (e) {
                    if (e.type === 'start' || e.type === 'archive') {
                        setTimeout(function () {
                            if (Lampa.Storage.get('netflix_overlays', true)) processCards();
                            if (Lampa.Storage.get('netflix_animations', true)) animateRows();
                        }, 100);
                    }
                });

                // Hide hero when entering detail or player views
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
