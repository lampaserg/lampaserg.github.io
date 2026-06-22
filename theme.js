/**
 * AppleTV+ Pro v3.0 — Расширенная версия с интеграцией плагинов
 * Интеграция: Интерфейс Мод (#1), Buttons Editor (#4), Flixio Studios (#6)
 * Режим "Кинотеатр", улучшенные метаданные, стили Flixio
 */

(function() {
    'use strict';

    var PLUGIN_VERSION = '3.0.0';
    var PLUGIN_NAME = 'AppleTV+ Pro';

    // =================================================================
    // Языковые настройки
    // =================================================================
    var TRANSLATIONS = {
        show_ratings: 'Показывать рейтинги',
        show_ratings_desc: 'Отображать все рейтинги на странице фильма',
        ratings_size: 'Размер рейтингов',
        ratings_size_desc: 'Масштаб рейтингов (цифры + подписи)',
        reactions_size: 'Размер реакций',
        reactions_size_desc: 'Масштаб блока реакций',
        show_reactions: 'Показывать реакции Lampa',
        show_reactions_desc: 'Отображать блок с реакциями под рейтингом',
        show_metadata: 'Показывать метаданные',
        show_metadata_desc: 'Отображать качество, аудио, озвучку и информацию о сезонах',
        show_description: 'Показывать описание',
        show_description_desc: 'Отображать описание фильма в стиле Apple TV',
        logo_scale: 'Размер логотипа',
        logo_scale_desc: 'Масштаб логотипа фильма',
        text_scale: 'Размер текста',
        text_scale_desc: 'Масштаб текста данных о фильме',
        scale_default: 'По умолчанию',
        spacing_scale: 'Отступы между строками',
        spacing_scale_desc: 'Расстояние между элементами информации',
        buttons_spacing: 'Отступ до кнопок',
        buttons_spacing_desc: 'Расстояние от контента до кнопок',
        settings_title_display: 'Отображение',
        settings_title_scaling: 'Масштабирование',
        description_overlay: 'Описание в оверлее',
        description_overlay_desc: 'Показывать описание в отдельном окне при нажатии',
        settings_poster_quality: 'Качество постера',
        settings_poster_quality_desc: 'Выберите качество изображений постеров и фона',
        quality_low: 'Низкое - 720p (HD)',
        quality_medium: 'Среднее - 1080p (FHD)',
        quality_high: 'Высокое - 2160p (4K)',
        loading: 'Загрузка...',
        avg_rating: 'ИТОГ',
        rating_tmdb: 'TMDB',
        rating_imdb: 'IMDB',
        rating_kp: 'Кинопоиск',
        rating_lampa: 'Lampa',
        rating_rt: 'Rotten Tomatoes',
        rating_mc: 'Metacritic',
        cinema_mode: 'Режим "Кинотеатр"',
        cinema_mode_desc: 'Полноэкранный режим с затемнением и увеличенным постером',
        cinema_blur: 'Размытие фона',
        cinema_blur_desc: 'Размывать фон при открытии плеера или торрентов',
        theme_mode: 'Тема оформления',
        theme_mode_desc: 'Выберите стиль оформления страницы фильма',
        theme_apple: 'Apple TV',
        theme_temav: 'TemaV',
        theme_flixio: 'Flixio',
        theme_custom: 'Пользовательская'
    };

    function tr(key) {
        return TRANSLATIONS[key] || key;
    }

    // =================================================================
    // Хранилище настроек
    // =================================================================
    function getSetting(key, defaultValue) {
        var val = Lampa.Storage.get('applecation_' + key);
        return val !== undefined && val !== null ? val : defaultValue;
    }

    function setSetting(key, value) {
        Lampa.Storage.set('applecation_' + key, value);
    }

    // Инициализация настроек
    var defaults = {
        show_ratings: true,
        ratings_size: 100,
        reactions_size: 100,
        show_reactions: true,
        show_metadata: true,
        show_description: true,
        logo_scale: 100,
        text_scale: 100,
        spacing_scale: 100,
        buttons_spacing: 100,
        poster_quality: 'medium',
        description_overlay: true,
        cinema_mode: false,
        cinema_blur: true,
        theme_mode: 'apple'
    };

    for (var key in defaults) {
        if (getSetting(key) === undefined) {
            setSetting(key, defaults[key]);
        }
    }

    // =================================================================
    // SVG иконки для рейтингов (из плагина #1)
    // =================================================================
    var RATING_ICONS = {
        tmdb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150"><defs><linearGradient id="tmdbGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#90cea1"/><stop offset="56%" stop-color="#3cbec9"/><stop offset="100%" stop-color="#00b3e5"/></linearGradient><style>.tmdb-text{font-weight:bold;fill:url(#tmdbGrad);text-anchor:start;dominant-baseline:middle;textLength:150;lengthAdjust:spacingAndGlyphs;font-size:70px;}</style></defs><text class="tmdb-text" x="0" y="50" textLength="150" lengthAdjust="spacingAndGlyphs">TM</text><text class="tmdb-text" x="0" y="120" textLength="150" lengthAdjust="spacingAndGlyphs">DB</text></svg>',

        imdb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88"><path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path fill="#000" d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44h-12v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72L98.64,69.6z"/></svg>',

        kp: '<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="kpMask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="300"><circle cx="150" cy="150" r="150" fill="white"/></mask><g mask="url(#kpMask)"><circle cx="150" cy="150" r="150" fill="black"/><path d="M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z" fill="url(#kpGrad)"/></g><defs><radialGradient id="kpGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(89.9999 45) rotate(45) scale(296.985)"><stop offset="0.5" stop-color="#FF5500"/><stop offset="1" stop-color="#BBFF00"/></radialGradient></defs></svg>',

        lampa: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z" fill="currentColor"/></svg>',

        avg: '<svg width="64" height="64" viewBox="10 10 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.4517 11.3659C31.8429 10.7366 32.7589 10.7366 33.1501 11.3659L40.2946 22.8568C40.4323 23.0782 40.651 23.2371 40.9041 23.2996L54.0403 26.5435C54.7598 26.7212 55.0428 27.5923 54.5652 28.1589L45.8445 38.5045C45.6764 38.7039 45.5929 38.961 45.6117 39.221L46.5858 52.7168C46.6392 53.4559 45.8982 53.9942 45.2117 53.7151L32.6776 48.6182C32.4361 48.52 32.1657 48.52 31.9242 48.6182L19.39 53.7151C18.7036 53.9942 17.9626 53.4559 18.016 52.7168L18.9901 39.221C19.0089 38.961 18.9253 38.7039 18.7573 38.5045L10.0366 28.1589C9.559 27.5923 9.84204 26.7212 10.5615 26.5435L23.6977 23.2996C23.9508 23.2371 24.1695 23.0782 24.3072 22.8568L31.4517 11.3659Z" fill="#FFDF6D"/></svg>',

        rt: '<svg xmlns="http://www.w3.org/2000/svg" height="141.25" viewBox="0 0 138.75 141.25" width="138.75"><g fill="#f93208"><path d="m20.154 40.829c-28.149 27.622-13.657 61.011-5.734 71.931 35.254 41.954 92.792 25.339 111.89-5.9071 4.7608-8.2027 22.554-53.467-23.976-78.009z"/><path d="m39.613 39.265 4.7778-8.8607 28.406-5.0384 11.119 9.2082z"/></g><g><path d="m39.436 8.5696 8.9682-5.2826 6.7569 15.479c3.7925-6.3226 13.79-16.316 24.939-4.6684-4.7281 1.2636-7.5161 3.8553-7.7397 8.4768 15.145-4.1697 31.343 3.2127 33.539 9.0911-10.951-4.314-27.695 10.377-41.771 2.334 0.009 15.045-12.617 16.636-19.902 17.076 2.077-4.996 5.591-9.994 1.474-14.987-7.618 8.171-13.874 10.668-33.17 4.668 4.876-1.679 14.843-11.39 24.448-11.425-6.775-2.467-12.29-2.087-17.814-1.475 2.917-3.961 12.149-15.197 28.625-8.476z" fill="#02902e"/></g></svg>',

        mc: '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><circle fill="#001B36" stroke="#FC0" stroke-width="4.6" cx="44" cy="44" r="41.6"/></svg>'
    };

    // =================================================================
    // Интеграция с плагином #1 (Интерфейс Мод) — рейтинги
    // =================================================================
    function getRatingsFromPlugin1(movie) {
        return new Promise(function(resolve) {
            try {
                // Проверяем наличие плагина #1
                if (typeof window.RATING_CACHE !== 'undefined' || typeof window.ratingCache !== 'undefined') {
                    // Используем кэш плагина #1 если доступен
                    var cache = window.ratingCache || window.RATING_CACHE;
                    var key = (movie.name ? 'tv' : 'movie') + '_' + movie.id;
                    
                    if (cache && cache.get) {
                        var cached = cache.get('tmdb_rating', key);
                        if (cached && cached.vote_average > 0) {
                            resolve({
                                tmdb: cached.vote_average,
                                imdb: cached.imdb || 0,
                                kp: cached.kp || 0,
                                lampa: cached.lampa || 0,
                                avg: cached.avg || 0
                            });
                            return;
                        }
                    }
                }
                
                // Fallback — использовать встроенные рейтинги
                resolve({
                    tmdb: movie.vote_average || 0,
                    imdb: movie.imdb_rating || 0,
                    kp: movie.kp_rating || 0,
                    lampa: 0,
                    avg: 0
                });
            } catch (e) {
                resolve({
                    tmdb: movie.vote_average || 0,
                    imdb: movie.imdb_rating || 0,
                    kp: movie.kp_rating || 0,
                    lampa: 0,
                    avg: 0
                });
            }
        });
    }

    // =================================================================
    // Интеграция с Flixio Studios (#6) — метаданные и стили
    // =================================================================
    function getMetadataFromFlixio(movie) {
        return new Promise(function(resolve) {
            try {
                // Используем данные из Flixio Studios если доступны
                if (movie.applecation_quality) {
                    resolve(movie.applecation_quality);
                    return;
                }
                
                // Проверяем глобальные переменные Flixio
                if (window.FLIXIO_STUDIOS_LOADED && window.FLIXIO_GET_BEST_JACRED) {
                    window.FLIXIO_GET_BEST_JACRED(movie, function(data) {
                        if (data && !data.empty) {
                            resolve({
                                quality: data.resolution || null,
                                audio: data.sound || null,
                                dub: data.dub || false,
                                hdr: data.hdr || false,
                                dolbyVision: data.dolbyVision || false,
                                seasonInfo: data.seasonInfo || null
                            });
                        } else {
                            resolve(null);
                        }
                    });
                } else {
                    resolve(null);
                }
            } catch (e) {
                resolve(null);
            }
        });
    }

    // =================================================================
    // Интеграция с Buttons Editor (#4) — кастомизация кнопок
    // =================================================================
    function integrateButtonsEditor(render, movie) {
        try {
            // Проверяем наличие плагина #4
            if (typeof window.plugin_buttons_editor_ready !== 'undefined') {
                // Плагин #4 уже обрабатывает кнопки
                return;
            }
            
            // Базовая кастомизация кнопок если плагин #4 не активен
            var buttons = render.find('.full-start-new__buttons');
            if (!buttons.length) return;
            
            // Сортируем кнопки в порядке приоритета
            var playBtn = buttons.find('.button--play');
            var bookBtn = buttons.find('.button--book');
            var reactionBtn = buttons.find('.button--reaction');
            var optionsBtn = buttons.find('.button--options');
            var otherBtns = buttons.find('.full-start__button').not('.button--play, .button--book, .button--reaction, .button--options');
            
            // Переупорядочиваем
            buttons.empty();
            buttons.append(playBtn);
            buttons.append(bookBtn);
            buttons.append(reactionBtn);
            buttons.append(otherBtns);
            buttons.append(optionsBtn);
            
        } catch (e) {}
    }

    // =================================================================
    // Режим "Кинотеатр"
    // =================================================================
    function initCinemaMode() {
        if (window.__cinema_mode_initialized) return;
        window.__cinema_mode_initialized = true;
        
        // Добавляем стили для кинорежима
        var cinemaStyles = document.createElement('style');
        cinemaStyles.id = 'applecation_cinema_mode';
        cinemaStyles.textContent = `
            /* Режим "Кинотеатр" */
            body.applecation-cinema-mode .full-start-new {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 9998 !important;
                background: #000 !important;
                padding: 2em !important;
                margin: 0 !important;
            }
            
            body.applecation-cinema-mode .full-start-new__body {
                height: 100vh !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            body.applecation-cinema-mode .full-start-new__left {
                flex: 0 0 40% !important;
                max-width: 40% !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
            }
            
            body.applecation-cinema-mode .full-start-new__poster {
                border-radius: 0.8em !important;
                overflow: hidden !important;
                box-shadow: 0 0 60px rgba(0,0,0,0.8) !important;
            }
            
            body.applecation-cinema-mode .full-start-new__poster img {
                width: 100% !important;
                height: auto !important;
                object-fit: cover !important;
            }
            
            body.applecation-cinema-mode .full-start-new__right {
                flex: 1 !important;
                padding: 0 2em !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
            }
            
            body.applecation-cinema-mode .applecation__logo img {
                max-width: 80% !important;
                max-height: 200px !important;
            }
            
            body.applecation-cinema-mode .applecation__description {
                max-width: 80% !important;
                font-size: 1.1em !important;
            }
            
            body.applecation-cinema-mode .full-start__background {
                display: none !important;
            }
            
            body.applecation-cinema-mode .head {
                z-index: 9999 !important;
            }
            
            /* Размытие фона при открытии плеера/торрентов */
            body.applecation-blur-bg .full-start-new {
                filter: blur(10px) !important;
                transition: filter 0.3s ease !important;
                pointer-events: none !important;
            }
            
            body.applecation-blur-bg .full-start-new::after {
                content: '' !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0,0,0,0.7) !important;
                z-index: 9997 !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(cinemaStyles);
        
        // Следим за открытием плеера
        if (Lampa.Listener) {
            Lampa.Listener.follow('player', function(e) {
                if (e.type === 'open' && getSetting('cinema_blur', true)) {
                    document.body.classList.add('applecation-blur-bg');
                }
                if (e.type === 'close') {
                    document.body.classList.remove('applecation-blur-bg');
                }
            });
        }
    }

    function toggleCinemaMode(enable) {
        if (enable) {
            document.body.classList.add('applecation-cinema-mode');
        } else {
            document.body.classList.remove('applecation-cinema-mode');
        }
    }

    // =================================================================
    // Тема оформления (Apple TV / TemaV / Flixio)
    // =================================================================
    function applyTheme(theme, render) {
        var themes = {
            apple: {
                bg: 'linear-gradient(135deg, rgba(10,10,12,0.95), rgba(20,20,25,0.98))',
                accent: '#52ff86',
                text: '#ffffff',
                cardBg: 'rgba(255,255,255,0.06)',
                glass: 'rgba(255,255,255,0.12)'
            },
            temav: {
                bg: 'linear-gradient(135deg, #050608, #0a0c12)',
                accent: '#5cd4b0',
                text: '#e0e0e0',
                cardBg: 'rgba(255,255,255,0.05)',
                glass: 'rgba(255,255,255,0.08)'
            },
            flixio: {
                bg: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)',
                accent: '#6c5ce7',
                text: '#f5f5f5',
                cardBg: 'rgba(108,92,231,0.12)',
                glass: 'rgba(108,92,231,0.15)'
            },
            custom: {
                bg: getSetting('custom_bg', 'linear-gradient(135deg, #0a0a1a, #1a1a2e)'),
                accent: getSetting('custom_accent', '#52ff86'),
                text: getSetting('custom_text', '#ffffff'),
                cardBg: getSetting('custom_card_bg', 'rgba(255,255,255,0.06)'),
                glass: getSetting('custom_glass', 'rgba(255,255,255,0.12)')
            }
        };

        var themeData = themes[theme] || themes.apple;
        
        // Применяем CSS переменные
        var style = document.createElement('style');
        style.id = 'applecation_theme_' + theme;
        style.textContent = `
            .applecation-theme-${theme} .applecation {
                background: ${themeData.bg} !important;
            }
            .applecation-theme-${theme} .applecation__meta-text {
                color: ${themeData.text} !important;
            }
            .applecation-theme-${theme} .applecation__description {
                color: ${themeData.text} !important;
            }
            .applecation-theme-${theme} .applecation__info {
                color: ${themeData.text} !important;
            }
            .applecation-theme-${theme} .applecation__ratings .rating-label {
                color: ${themeData.text} !important;
            }
            .applecation-theme-${theme} .applecation__ratings .rating-value {
                color: ${themeData.text} !important;
            }
            .applecation-theme-${theme} .applecation__metadata .metadata-badge {
                background: ${themeData.cardBg} !important;
            }
            .applecation-theme-${theme} .applecation__metadata .metadata-season {
                background: rgba(255,0,0,0.25) !important;
                color: ${themeData.accent} !important;
            }
            .applecation-theme-${theme} .applecation__description-wrapper.focus {
                background: ${themeData.glass} !important;
            }
        `;
        document.head.appendChild(style);
        
        // Убираем старые темы
        var oldThemes = ['apple', 'temav', 'flixio', 'custom'];
        oldThemes.forEach(function(t) {
            if (t !== theme) {
                document.body.classList.remove('applecation-theme-' + t);
            }
        });
        document.body.classList.add('applecation-theme-' + theme);
    }

    // =================================================================
    // Получение рейтинга Lampa
    // =================================================================
    function getLampaRating(ratingKey) {
        return new Promise(function(resolve) {
            var request = new Lampa.Reguest();
            request.timeout(10000);
            request.silent('https://cubnotrip.top/api/reactions/get/' + ratingKey, function(data) {
                try {
                    if (data && data.result && Array.isArray(data.result)) {
                        var weightedSum = 0, totalCount = 0;
                        var coef = { fire: 5, nice: 4, think: 3, bore: 2, shit: 1 };
                        data.result.forEach(function(item) {
                            var count = parseInt(item.counter, 10) || 0;
                            var c = coef[item.type] || 0;
                            weightedSum += count * c;
                            totalCount += count;
                        });
                        if (totalCount === 0) { resolve(0); return; }
                        var avgRating = weightedSum / totalCount;
                        var rating10 = (avgRating - 1) * 2.5;
                        resolve(rating10 >= 0 ? parseFloat(rating10.toFixed(1)) : 0);
                    } else {
                        resolve(0);
                    }
                } catch (e) {
                    resolve(0);
                }
            }, function() {
                resolve(0);
            }, false);
        });
    }

    // =================================================================
    // Расчет среднего рейтинга (ИТОГ)
    // =================================================================
    function calculateAverage(ratings) {
        var weights = {
            tmdb: 0.15,
            imdb: 0.30,
            kp: 0.20,
            lampa: 0.25,
            rt: 0.05,
            mc: 0.05
        };

        var weightedSum = 0;
        var totalWeight = 0;
        var count = 0;

        for (var key in weights) {
            var val = ratings[key];
            if (val && !isNaN(val) && val > 0) {
                weightedSum += val * weights[key];
                totalWeight += weights[key];
                count++;
            }
        }

        if (totalWeight === 0 || count < 2) return null;
        return parseFloat((weightedSum / totalWeight).toFixed(1));
    }

    // =================================================================
    // Основная логика
    // =================================================================
    function initPlugin() {
        if (!Lampa.Platform.screen('tv')) {
            console.log('AppleTV+ Pro: TV mode only');
            return;
        }

        // Инициализируем кинорежим
        initCinemaMode();

        // Переопределяем API изображений
        overrideImageApi();

        // Переопределяем шаблон
        overrideFullStartTemplate();

        // Добавляем стили
        injectStyles();

        // Добавляем настройки
        addSettings();

        // Обработчик события full
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                handleFullEvent(e);
            }
        });

        // Применяем начальные настройки
        applyInitialSettings();

        console.log('AppleTV+ Pro v' + PLUGIN_VERSION + ' initialized');
    }

    // =================================================================
    // Переопределение шаблона страницы фильма
    // =================================================================
    function overrideFullStartTemplate() {
        // Рейтинги (с иконками из плагина #1)
        var ratingsHtml = '<div class="applecation__ratings">' +
            '<div class="full-start__rate rate--tmdb hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_tmdb') + '</div></div>' +
            '<div class="full-start__rate rate--imdb hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_imdb') + '</div></div>' +
            '<div class="full-start__rate rate--kp hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_kp') + '</div></div>' +
            '<div class="full-start__rate rate--lampa hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_lampa') + '</div></div>' +
            '<div class="full-start__rate rate--rt hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_rt') + '</div></div>' +
            '<div class="full-start__rate rate--mc hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_mc') + '</div></div>' +
            '<div class="full-start__rate rate--avg hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('avg_rating') + '</div></div>' +
            '</div>';

        // Реакции
        var reactionsHtml = '<div class="full-start-new__reactions selector applecation-reactions">' +
            '<div>#{reactions_none}</div>' +
            '</div>';

        // Метаданные (стиль Flixio Studios)
        var metadataHtml = '<div class="applecation__metadata flixio-metadata"></div>';

        // Контентная часть
        var contentHtml = 
            '<div class="applecation__logo"></div>' +
            '<div class="applecation__content-wrapper">' +
                '<div class="full-start-new__title" style="display: none;">{title}</div>' +
                '<div class="applecation__meta">' +
                    '<div class="applecation__meta-left">' +
                        '<span class="applecation__network"></span>' +
                        '<span class="applecation__meta-text"></span>' +
                        '<div class="full-start__pg hide"></div>' +
                    '</div>' +
                '</div>' +
                ratingsHtml +
                reactionsHtml +
                metadataHtml +
                '<div class="applecation__description-wrapper">' +
                    '<div class="applecation__description"></div>' +
                    '<div class="flixio-metadata-full"></div>' +
                '</div>' +
                '<div class="applecation__info"></div>' +
            '</div>';

        // Кнопки (с интеграцией Buttons Editor)
        var buttonsHtml = 
            '<div class="full-start-new__buttons applecation-buttons">' +
                '<div class="full-start__button selector button--play">' +
                    '<svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="14" cy="14.5" r="13" stroke="currentColor" stroke-width="2.7"/>' +
                        '<path d="M18.0739 13.634C18.7406 14.0189 18.7406 14.9811 18.0739 15.366L11.751 19.0166C11.0843 19.4015 10.251 18.9204 10.251 18.1506L10.251 10.8494C10.251 10.0796 11.0843 9.5985 11.751 9.9834L18.0739 13.634Z" fill="currentColor"/>' +
                    '</svg>' +
                    '<span>#{title_watch}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--book">' +
                    '<svg width="21" height="32" viewBox="0 0 21 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M2 1.5H19C19.2761 1.5 19.5 1.72386 19.5 2V27.9618C19.5 28.3756 19.0261 28.6103 18.697 28.3595L12.6212 23.7303C11.3682 22.7757 9.63183 22.7757 8.37885 23.7303L2.30302 28.3595C1.9739 28.6103 1.5 28.3756 1.5 27.9618V2C1.5 1.72386 1.72386 1.5 2 1.5Z" stroke="currentColor" stroke-width="2.5"/>' +
                    '</svg>' +
                    '<span>#{settings_input_links}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--reaction">' +
                    '<svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M37.208 10.9742C37.1364 10.8013 37.0314 10.6441 36.899 10.5117C36.7666 10.3794 36.6095 10.2744 36.4365 10.2028L12.0658 0.108375C11.7166 -0.0361828 11.3242 -0.0361227 10.9749 0.108542C10.6257 0.253206 10.3482 0.530634 10.2034 0.879836L0.108666 25.2507C0.0369593 25.4236 3.37953e-05 25.609 2.3187e-08 25.7962C-3.37489e-05 25.9834 0.0368249 26.1688 0.108469 26.3418C0.180114 26.5147 0.28514 26.6719 0.417545 26.8042C0.54995 26.9366 0.707139 27.0416 0.880127 27.1131L17.2452 33.8917C17.5945 34.0361 17.9869 34.0361 18.3362 33.8917L29.6574 29.2017C29.8304 29.1301 29.9875 29.0251 30.1199 28.8928C30.2523 28.7604 30.3573 28.6032 30.4289 28.4303L37.2078 12.065C37.2795 11.8921 37.3164 11.7068 37.3164 11.5196C37.3165 11.3325 37.2796 11.1471 37.208 10.9742ZM20.425 29.9407L21.8784 26.4316L25.3873 27.885L20.425 29.9407ZM28.3407 26.0222L21.6524 23.252C21.3031 23.1075 20.9107 23.1076 20.5615 23.2523C20.2123 23.3969 19.9348 23.6743 19.79 24.0235L17.0194 30.7123L3.28783 25.0247L12.2918 3.28773L34.0286 12.2912L28.3407 26.0222Z" fill="currentColor"/>' +
                        '<path d="M25.3493 16.976L24.258 14.3423L16.959 17.3666L15.7196 14.375L13.0859 15.4659L15.4161 21.0916L25.3493 16.976Z" fill="currentColor"/>' +
                    '</svg>' +
                    '<span>#{title_reactions}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--subscribe hide">' +
                    '<svg width="25" height="30" viewBox="0 0 25 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M6.01892 24C6.27423 27.3562 9.07836 30 12.5 30C15.9216 30 18.7257 27.3562 18.981 24H15.9645C15.7219 25.6961 14.2632 27 12.5 27C10.7367 27 9.27804 25.6961 9.03542 24H6.01892Z" fill="currentColor"/>' +
                        '<path d="M3.81972 14.5957V10.2679C3.81972 5.41336 7.7181 1.5 12.5 1.5C17.2819 1.5 21.1803 5.41336 21.1803 10.2679V14.5957C21.1803 15.8462 21.5399 17.0709 22.2168 18.1213L23.0727 19.4494C24.2077 21.2106 22.9392 23.5 20.9098 23.5H4.09021C2.06084 23.5 0.792282 21.2106 1.9273 19.4494L2.78317 18.1213C3.46012 17.0709 3.81972 15.8462 3.81972 14.5957Z" stroke="currentColor" stroke-width="2.5"/>' +
                    '</svg>' +
                    '<span>#{title_subscribe}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--options">' +
                    '<svg width="38" height="10" viewBox="0 0 38 10" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="4.88968" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                        '<circle cx="18.9746" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                        '<circle cx="33.0596" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                    '</svg>' +
                '</div>' +
            '</div>';

        // Стандартное описание Lampa
        var standardDescriptionHtml = 
            '<div class="full-start__description" style="display: none;">{description}</div>' +
            '<div class="full-start__details" style="display: none;"></div>';

        // Сборка шаблона
        var template = '<div class="full-start-new applecation">\n' +
            '    <div class="full-start-new__body">\n' +
            '        <div class="full-start-new__left hide">\n' +
            '            <div class="full-start-new__poster">\n' +
            '                <img class="full-start-new__img full--poster" />\n' +
            '            </div>\n' +
            '        </div>\n' +
            '        <div class="full-start-new__right">\n' +
            '            <div class="applecation__left">\n' +
            '                ' + contentHtml + '\n' +
            '                ' + buttonsHtml + '\n' +
            '                ' + standardDescriptionHtml + '\n' +
            '                <div class="full-start-new__head" style="display: none;"></div>\n' +
            '            </div>\n' +
            '            <div class="applecation__right">\n' +
            '                <div class="full-start-new__rate-line">\n' +
            '                    <div class="full-start__status hide"></div>\n' +
            '                </div>\n' +
            '                <div class="rating--modss" style="display: none;"></div>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '    <div class="hide buttons--container">\n' +
            '        <div class="full-start__button view--torrent hide">\n' +
            '            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">\n' +
            '                <path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z" fill="currentColor"/>\n' +
            '            </svg>\n' +
            '            <span>#{full_torrents}</span>\n' +
            '        </div>\n' +
            '        <div class="full-start__button selector view--trailer">\n' +
            '            <svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
            '                <path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z" fill="currentColor"/>\n' +
            '            </svg>\n' +
            '            <span>#{full_trailers}</span>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';

        Lampa.Template.add('full_start_new', template);
        Lampa.Template.add('applecation_overlay', '\n            <div class="applecation-description-overlay">\n                <div class="applecation-description-overlay__bg"></div>\n                <div class="applecation-description-overlay__content selector">\n                    <div class="applecation-description-overlay__logo"></div>\n                    <div class="applecation-description-overlay__title">{title}</div>\n                    <div class="applecation-description-overlay__text">{text}</div>\n                    <div class="applecation-description-overlay__details">\n                        <div class="applecation-description-overlay__info">\n                            <div class="applecation-description-overlay__info-name">#{full_date_of_release}</div>\n                            <div class="applecation-description-overlay__info-body">{relise}</div>\n                        </div>\n                        <div class="applecation-description-overlay__info applecation--budget">\n                            <div class="applecation-description-overlay__info-name">#{full_budget}</div>\n                            <div class="applecation-description-overlay__info-body">{budget}</div>\n                        </div>\n                        <div class="applecation-description-overlay__info applecation--countries">\n                            <div class="applecation-description-overlay__info-name">#{full_countries}</div>\n                            <div class="applecation-description-overlay__info-body">{countries}</div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        ');
    }

    // =================================================================
    // Обработка события full
    // =================================================================
    function handleFullEvent(e) {
        var activity = e.object && e.object.activity;
        if (!activity || !activity.render) return;

        var render = activity.render();
        if (!render || !render.length) return;

        activity.__destroyed = false;
        var oldDestroy = activity.destroy;
        activity.destroy = function() {
            activity.__destroyed = true;
            if (oldDestroy) oldDestroy.apply(activity, arguments);
        };

        render.addClass('applecation');
        applyScaling();

        // Применяем тему
        var theme = getSetting('theme_mode', 'apple');
        applyTheme(theme, render);

        // Кинорежим
        if (getSetting('cinema_mode', false)) {
            toggleCinemaMode(true);
        }

        // Затемняем фон
        var bg = render.find('.full-start__background:not(.applecation__overlay)');
        if (bg.length && !bg.next('.applecation__overlay').length) {
            bg.after('<div class="full-start__background loaded applecation__overlay"></div>');
        }

        var movie = e.data && e.data.movie;
        if (!movie) return;

        fillMeta(render, movie);
        loadMetadataFlixio(render, movie);
        fillDescription(render, movie);
        fillInfo(render, movie);
        loadLogo(render, movie);
        loadRatingsIntegrated(render, movie);
        integrateButtonsEditor(render, movie);
        setupScrollDim(render);
        applyMarquee(render);

        waitForBackground(render, function() {
            if (!isComponentActive(activity)) return;
            render.find('.applecation__meta').addClass('show');
            render.find('.applecation__description-wrapper').addClass('show');
            render.find('.applecation__info').addClass('show');
            render.find('.applecation__ratings').addClass('show');
        });
    }

    // =================================================================
    // Загрузка метаданных из Flixio Studios
    // =================================================================
    function loadMetadataFlixio(render, movie) {
        if (!getSetting('show_metadata', true)) {
            render.find('.applecation__metadata').empty();
            return;
        }

        var metadataEl = render.find('.applecation__metadata');
        if (!metadataEl.length) return;

        // Показываем загрузку
        metadataEl.html('<span class="metadata-loading">' + tr('loading') + '</span>');

        // Используем Flixio для получения метаданных
        getMetadataFromFlixio(movie).then(function(metadata) {
            var html = '';
            
            // Год (из данных фильма)
            var year = (movie.release_date || movie.first_air_date || '').substr(0, 4);
            if (year) {
                html += '<span class="metadata-badge metadata-text">' + year + '</span>';
            }

            // Сезон и серии
            if (metadata && metadata.seasonInfo) {
                html += '<span class="metadata-badge metadata-season">' + metadata.seasonInfo + '</span>';
            } else if (movie.name) {
                // Fallback — вычисляем сами
                var seasonInfo = getSeasonInfo(movie);
                if (seasonInfo) {
                    html += '<span class="metadata-badge metadata-season">' + seasonInfo + '</span>';
                }
            }

            // Качество
            if (metadata && metadata.quality) {
                html += '<span class="metadata-badge metadata-quality">' + metadata.quality + '</span>';
            }

            // HDR
            if (metadata && metadata.hdr) {
                html += '<span class="metadata-badge metadata-hdr">' + (metadata.dolbyVision ? 'Dolby Vision' : 'HDR') + '</span>';
            }

            // Аудио
            if (metadata && metadata.audio) {
                html += '<span class="metadata-badge metadata-audio">' + metadata.audio + '</span>';
            }

            // Озвучка
            if (metadata && metadata.dub) {
                html += '<span class="metadata-badge metadata-dub">DUB</span>';
            }

            if (html) {
                metadataEl.html(html);
            } else {
                metadataEl.empty();
            }
        });
    }

    function getSeasonInfo(movie) {
        if (!movie || !movie.name) return null;

        var lastEpisode = movie.last_episode_to_air;
        if (lastEpisode && lastEpisode.season_number && lastEpisode.episode_number) {
            var seasonNum = lastEpisode.season_number;
            var episodeNum = lastEpisode.episode_number;
            var totalEpisodes = '?';
            if (movie.seasons && Array.isArray(movie.seasons)) {
                for (var i = 0; i < movie.seasons.length; i++) {
                    if (movie.seasons[i].season_number === seasonNum && movie.seasons[i].episode_count) {
                        totalEpisodes = movie.seasons[i].episode_count;
                        break;
                    }
                }
            }
            return seasonNum + ' сезон ' + episodeNum + '/' + totalEpisodes + ' серий';
        }

        var seasons = Lampa.Utils.countSeasons(movie);
        if (seasons) {
            var t = [2, 0, 1, 1, 1, 2];
            var forms = ['сезон', 'сезона', 'сезонов'];
            return seasons + ' ' + forms[seasons % 100 > 4 && seasons % 100 < 20 ? 2 : t[Math.min(seasons % 10, 5)]];
        }

        return null;
    }

    // =================================================================
    // Загрузка рейтингов с интеграцией плагина #1
    // =================================================================
    function loadRatingsIntegrated(render, movie) {
        if (!getSetting('show_ratings', true)) {
            render.find('.applecation__ratings').addClass('hide');
            return;
        }

        var rateLine = render.find('.applecation__ratings');
        if (!rateLine.length) return;

        var ratings = {
            tmdb: 0,
            imdb: 0,
            kp: 0,
            lampa: 0,
            rt: 0,
            mc: 0
        };

        var ratingElements = {
            tmdb: rateLine.find('.rate--tmdb'),
            imdb: rateLine.find('.rate--imdb'),
            kp: rateLine.find('.rate--kp'),
            lampa: rateLine.find('.rate--lampa'),
            rt: rateLine.find('.rate--rt'),
            mc: rateLine.find('.rate--mc'),
            avg: rateLine.find('.rate--avg')
        };

        function updateRatingElement(el, value, iconSvg) {
            if (!el.length) return;

            var formatted = formatRating(value);
            var colorClass = getRatingClass(value);

            var iconEl = el.find('.rating-icon');
            if (iconEl.length && iconSvg) {
                iconEl.html(iconSvg);
            }

            var valEl = el.find('.rating-value');
            if (valEl.length) {
                valEl.text(formatted);
                valEl.removeClass('rate--green rate--lime rate--orange rate--red');
                if (colorClass) {
                    valEl.addClass(colorClass);
                }
            }

            if (value > 0) {
                el.removeClass('hide');
            } else {
                el.addClass('hide');
            }
        }

        // Получаем рейтинги из плагина #1
        getRatingsFromPlugin1(movie).then(function(data) {
            ratings.tmdb = data.tmdb || movie.vote_average || 0;
            ratings.imdb = data.imdb || movie.imdb_rating || 0;
            ratings.kp = data.kp || movie.kp_rating || 0;
            
            updateRatingElement(ratingElements.tmdb, ratings.tmdb, RATING_ICONS.tmdb);
            if (ratings.imdb > 0) {
                updateRatingElement(ratingElements.imdb, ratings.imdb, RATING_ICONS.imdb);
            }
            if (ratings.kp > 0) {
                updateRatingElement(ratingElements.kp, ratings.kp, RATING_ICONS.kp);
            }

            // Загружаем рейтинг Lampa
            var type = movie.name ? 'tv' : 'movie';
            var ratingKey = type + '_' + movie.id;

            getLampaRating(ratingKey).then(function(lampaRating) {
                if (lampaRating > 0) {
                    ratings.lampa = lampaRating;
                    updateRatingElement(ratingElements.lampa, lampaRating, RATING_ICONS.lampa);
                }

                // Добавляем RT и MC если доступны
                if (movie.rt_rating) {
                    ratings.rt = movie.rt_rating;
                    updateRatingElement(ratingElements.rt, ratings.rt, RATING_ICONS.rt);
                }
                if (movie.mc_rating) {
                    ratings.mc = movie.mc_rating;
                    updateRatingElement(ratingElements.mc, ratings.mc, RATING_ICONS.mc);
                }

                // Рассчитываем ИТОГ
                var avg = calculateAverage(ratings);
                if (avg !== null) {
                    updateRatingElement(ratingElements.avg, avg, RATING_ICONS.avg);
                }
            });

            // Таймаут для Lampa рейтинга
            setTimeout(function() {
                if (ratingElements.lampa.hasClass('hide')) {
                    var avg = calculateAverage(ratings);
                    if (avg !== null) {
                        updateRatingElement(ratingElements.avg, avg, RATING_ICONS.avg);
                    }
                }
            }, 5000);
        });
    }

    // =================================================================
    // Вспомогательные функции
    // =================================================================
    function getRatingClass(rating) {
        var r = parseFloat(rating);
        if (isNaN(r) || r <= 0) return '';
        if (r >= 8.0) return 'rate--green';
        if (r >= 6.5) return 'rate--lime';
        if (r >= 5.0) return 'rate--orange';
        return 'rate--red';
    }

    function formatRating(value) {
        var n = parseFloat(value);
        if (isNaN(n) || n <= 0) return '—';
        if (n === 10) return '10';
        return n.toFixed(1);
    }

    function getTmdbKey() {
        var custom = (Lampa.Storage.get('flixio_tmdb_apikey') || '').trim();
        return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
    }

    function isComponentActive(component) {
        return component && !component.__destroyed;
    }

    function waitForBackground(render, callback) {
        var background = render.find('.full-start__background:not(.applecation__overlay)');
        if (!background.length) return callback();
        if (background.hasClass('loaded') && background.hasClass('applecation-animated')) {
            return callback();
        }
        if (background.hasClass('loaded')) {
            return setTimeout(function() {
                background.addClass('applecation-animated');
                callback();
            }, 350);
        }
        var interval = setInterval(function() {
            if (background.hasClass('loaded')) {
                clearInterval(interval);
                setTimeout(function() {
                    background.addClass('applecation-animated');
                    callback();
                }, 650);
            }
        }, 50);
        setTimeout(function() {
            clearInterval(interval);
            if (!background.hasClass('applecation-animated')) {
                background.addClass('applecation-animated');
                callback();
            }
        }, 2000);
    }

    // =================================================================
    // Заполнение мета-информации
    // =================================================================
    function fillMeta(render, movie) {
        var metaText = render.find('.applecation__meta-text');
        if (!metaText.length) return;

        var parts = [];
        parts.push(movie.name ? 'Сериал' : 'Фильм');

        if (movie.genres && movie.genres.length) {
            var genres = movie.genres.slice(0, 2).map(function(g) {
                return Lampa.Utils.capitalizeFirstLetter(g.name);
            });
            parts = parts.concat(genres);
        }

        metaText.html(parts.join(' · '));

        var networkNode = render.find('.applecation__network');
        if (networkNode.length) {
            var logo = null;
            if (movie.networks && movie.networks.length && movie.networks[0].logo_path) {
                logo = movie.networks[0];
            } else if (movie.production_companies && movie.production_companies.length && movie.production_companies[0].logo_path) {
                logo = movie.production_companies[0];
            }

            if (logo) {
                var imgUrl = Lampa.Api.img(logo.logo_path, 'w200');
                networkNode.html('<img src="' + imgUrl + '" alt="' + logo.name + '">');
            } else {
                networkNode.remove();
            }
        }
    }

    // =================================================================
    // Заполнение описания
    // =================================================================
    function fillDescription(render, movie) {
        var showDescription = getSetting('show_description', true);
        var descWrapper = render.find('.applecation__description-wrapper');
        var standardDesc = render.find('.full-start__description');

        if (showDescription) {
            descWrapper.show();
            standardDesc.hide();

            var text = movie.overview || '';
            var descEl = render.find('.applecation__description');
            if (descEl.length) descEl.text(text);

            var wrap = render.find('.applecation__description-wrapper');
            if (!wrap.length) return;

            wrap.off('hover:enter');
            $('.applecation-description-overlay').remove();

            if (!text || !getSetting('description_overlay', true)) return;

            var title = movie.title || movie.name;
            var dateStr = (movie.release_date || movie.first_air_date || '') + '';
            var rel = dateStr.length > 3 ? Lampa.Utils.parseTime(dateStr).full : (dateStr.length > 0 ? dateStr : 'Неизвестно');
            var budget = '$ ' + Lampa.Utils.numberWithSpaces(movie.budget || 0);
            var countries = (movie.production_countries || []).map(function(c) {
                var key = 'country_' + c.iso_3166_1.toLowerCase();
                var t = Lampa.Lang.translate(key);
                return t !== key ? t : c.name;
            }).join(', ');

            var overlay = $(Lampa.Template.get('applecation_overlay', {
                title: title,
                text: text,
                relise: rel,
                budget: budget,
                countries: countries
            }));

            if (!movie.budget || movie.budget === 0) overlay.find('.applecation--budget').remove();
            if (!countries) overlay.find('.applecation--countries').remove();

            $('body').append(overlay);
            overlay.data('controller-created', false);

            wrap.addClass('selector');
            if (Lampa.Controller && Lampa.Controller.collectionAppend) {
                Lampa.Controller.collectionAppend(wrap);
            }

            wrap.on('hover:enter', function() {
                var el = $('.applecation-description-overlay');
                if (!el.length) return;

                setTimeout(function() { el.addClass('show'); }, 10);

                if (!el.data('controller-created') && Lampa.Controller) {
                    var ctrl = {
                        toggle: function() {
                            Lampa.Controller.collectionSet(el);
                            Lampa.Controller.collectionFocus(el.find('.applecation-description-overlay__content'), el);
                        },
                        back: function() {
                            var ol = $('.applecation-description-overlay');
                            if (!ol.length) return;
                            ol.removeClass('show');
                            setTimeout(function() { Lampa.Controller.toggle('content'); }, 300);
                        }
                    };
                    Lampa.Controller.add('applecation_description', ctrl);
                    el.data('controller-created', true);
                }

                if (Lampa.Controller) Lampa.Controller.toggle('applecation_description');
            });
        } else {
            descWrapper.hide();
            standardDesc.show();
        }
    }

    // =================================================================
    // Заполнение информации
    // =================================================================
    function fillInfo(render, movie) {
        var info = render.find('.applecation__info');
        if (!info.length) return;

        var parts = [];

        if (movie.name) {
            if (movie.episode_run_time && movie.episode_run_time.length) {
                var m = movie.episode_run_time[0];
                var tm = Lampa.Lang.translate('time_m').replace('.', '');
                parts.push(m + ' ' + tm);
            }
        } else if (movie.runtime && movie.runtime > 0) {
            var h = Math.floor(movie.runtime / 60);
            var mm = movie.runtime % 60;
            var th = Lampa.Lang.translate('time_h').replace('.', '');
            var tmm = Lampa.Lang.translate('time_m').replace('.', '');
            parts.push(h > 0 ? (h + ' ' + th + ' ' + mm + ' ' + tmm) : (mm + ' ' + tmm));
        }

        info.html(parts.length ? parts.join(' · ') : '');
    }

    // =================================================================
    // Загрузка логотипа
    // =================================================================
    function loadLogo(render, movie) {
        var logo = render.find('.applecation__logo');
        var titleEl = render.find('.full-start-new__title');
        if (!logo.length) return;

        var done = false;
        var timer = setTimeout(function() {
            if (done) return;
            done = true;
            titleEl.show();
            logo.addClass('loaded');
        }, 3000);

        var type = movie.name ? 'tv' : 'movie';
        var lang = Lampa.Storage.get('language', 'ru') || 'ru';
        var url = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey() + '&language=' + lang);
        var urlAll = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey());

        function getLogoSize() {
            var quality = getSetting('poster_quality', 'medium');
            if (quality === 'low') return 'w300';
            if (quality === 'medium') return 'w500';
            return 'original';
        }

        function applyLogo(data) {
            if (done) return;
            if (!render.closest('body').length) return;

            var filePath = data && data.logos && data.logos[0] && data.logos[0].file_path;
            if (filePath) {
                var imgUrl = Lampa.TMDB.image('/t/p/' + getLogoSize() + filePath);
                var img = new Image();
                img.onload = function() {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    if (!render.closest('body').length) return;

                    logo.html('<img src="' + imgUrl + '" alt="" />');

                    waitForBackground(render, function() {
                        if (!render.closest('body').length) return;
                        logo.addClass('loaded');
                    });

                    var overlay = $('.applecation-description-overlay');
                    if (overlay.length) {
                        overlay.find('.applecation-description-overlay__logo')
                            .html($('<img>').attr('src', imgUrl))
                            .css('display', 'block');
                        overlay.find('.applecation-description-overlay__title').css('display', 'none');
                    }
                };
                img.onerror = function() {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    titleEl.show();
                    waitForBackground(render, function() {
                        if (!render.closest('body').length) return;
                        logo.addClass('loaded');
                    });
                };
                img.src = imgUrl;
            } else {
                done = true;
                clearTimeout(timer);
                titleEl.show();
                waitForBackground(render, function() {
                    if (!render.closest('body').length) return;
                    logo.addClass('loaded');
                });
            }
        }

        $.get(url, function(data) {
            if (data && data.logos && data.logos.length) {
                applyLogo(data);
            } else {
                $.get(urlAll, function(dataAll) {
                    applyLogo(dataAll || data);
                }).fail(function() {
                    applyLogo(data);
                });
            }
        }).fail(function() {
            if (done) return;
            done = true;
            clearTimeout(timer);
            titleEl.show();
            waitForBackground(render, function() {
                if (!render.closest('body').length) return;
                logo.addClass('loaded');
            });
        });
    }

    // =================================================================
    // Настройка скролла
    // =================================================================
    function setupScrollDim(render) {
        var bg = render.find('.full-start__background:not(.applecation__overlay)')[0];
        var scroll = render.find('.scroll__body')[0];
        if (!bg || !scroll) return;

        var dim = false;
        var desc = Object.getOwnPropertyDescriptor(scroll.style, '-webkit-transform') ||
                   Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'webkitTransform');

        Object.defineProperty(scroll.style, '-webkit-transform', {
            set: function(v) {
                if (v) {
                    var s = v.indexOf(',') + 1;
                    var e = v.indexOf(',', s);
                    if (s > 0 && e > s) {
                        var isDown = parseFloat(v.substring(s, e)) < 0;
                        if (isDown !== dim) {
                            dim = isDown;
                            bg.classList.toggle('dim', isDown);
                        }
                    }
                }
                if (desc && desc.set) desc.set.call(this, v);
                else this.setProperty('-webkit-transform', v);
            },
            get: function() {
                return desc && desc.get ? desc.get.call(this) : this.getPropertyValue('-webkit-transform');
            },
            configurable: true
        });
    }

    // =================================================================
    // Бегущая строка для актеров
    // =================================================================
    function applyMarquee(render) {
        var names = render.find('.full-person__name');

        names.each(function() {
            var n = $(this);
            if (n.hasClass('marquee-processed')) {
                var t = n.find('span').first().text();
                if (t) {
                    n.text(t);
                    n.removeClass('marquee-processed marquee-active');
                    n.css('--marquee-duration', '');
                }
            }
        });

        setTimeout(function() {
            names.each(function() {
                var n = $(this);
                var txt = n.text().trim();
                if (!txt) return;

                if (n[0].scrollWidth > n[0].clientWidth + 1) {
                    var dur = Math.min(Math.max(0.25 * txt.length, 5), 20);
                    n.addClass('marquee-processed marquee-active');
                    n.css('--marquee-duration', dur + 's');

                    var s1 = $('<span>').text(txt);
                    var s2 = $('<span>').text(txt);
                    var inner = $('<div class="marquee__inner">').append(s1).append(s2);
                    n.empty().append(inner);
                } else {
                    n.addClass('marquee-processed');
                }
            });
        }, 100);
    }

    // =================================================================
    // Переопределение API изображений
    // =================================================================
    function overrideImageApi() {
        var source = Lampa.Api.sources.tmdb;
        var originalImg = source.img;

        source.img = function(path, size) {
            var quality = getSetting('poster_quality', 'medium');
            var isFace = typeof size === 'string' && size.indexOf('_face') !== -1;
            var isBackdrop = ['w300', 'w780', 'w1280', 'original'].indexOf(size) !== -1 && !isFace;

            var useCustomSize = false;

            if (!isFace && !isBackdrop) {
                if (quality === 'low') {
                    size = isFace ? 'w276_and_h350_face' : 'w300';
                    useCustomSize = true;
                } else if (quality === 'medium') {
                    size = isFace ? 'w600_and_h900_face' : 'w780';
                    useCustomSize = true;
                } else if (quality === 'high') {
                    size = 'original';
                    useCustomSize = true;
                }
            }

            if (isBackdrop) {
                if (quality === 'low' || quality === 'medium') {
                    size = 'w1280';
                    useCustomSize = true;
                } else if (quality === 'high') {
                    size = 'original';
                    useCustomSize = true;
                }
            }

            if (!useCustomSize && size === 'w1280') {
                var posterSize = Lampa.Storage.field('poster_size');
                var map = { w200: 'w780', w300: 'w1280', w500: 'original' };
                size = map[posterSize] || 'w1280';
            }

            if (!useCustomSize && size === 'w300') {
                var posterSize2 = Lampa.Storage.field('poster_size');
                var map2 = { w200: 'w300', w300: 'w780', w500: 'w780' };
                size = map2[posterSize2] || 'w300';
            }

            if (!useCustomSize && isFace && size === 'w500') {
                size = 'w600_and_h900_face';
            }

            return originalImg.call(source, path, size);
        };
    }

    // =================================================================
    // Масштабирование
    // =================================================================
    function applyScaling() {
        var logoScale = parseInt(getSetting('logo_scale', 100));
        var textScale = parseInt(getSetting('text_scale', 100));
        var spacingScale = parseInt(getSetting('spacing_scale', 100));
        var buttonsSpacing = parseInt(getSetting('buttons_spacing', 100));
        var ratingsSize = parseInt(getSetting('ratings_size', 100));
        var reactionsSize = parseInt(getSetting('reactions_size', 100));

        $('style[data-id="applecation_scales"]').remove();

        var css = '<style data-id="applecation_scales">\n' +
            '.applecation .applecation__logo img {\n' +
            '    max-width: ' + (35 * logoScale / 100) + 'vw !important;\n' +
            '    max-height: ' + (180 * logoScale / 100) + 'px !important;\n' +
            '}\n' +
            '.applecation .applecation__content-wrapper {\n' +
            '    font-size: ' + textScale + '% !important;\n' +
            '}\n' +
            '.applecation .full-start-new__title {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__meta {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings {\n' +
            '    margin-bottom: ' + (0.3 * spacingScale / 100) + 'em !important;\n' +
            '    gap: ' + (0.6 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings .full-start__rate {\n' +
            '    gap: ' + (0.3 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings .rating-icon {\n' +
            '    width: ' + (1.2 * ratingsSize / 100) + 'em !important;\n' +
            '    height: ' + (1.2 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings .rating-value {\n' +
            '    font-size: ' + (0.9 * ratingsSize / 100) + 'em !important;\n' +
            '    padding: ' + (0.1 * ratingsSize / 100) + 'em ' + (0.35 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings .rating-label {\n' +
            '    font-size: ' + (0.65 * ratingsSize / 100) + 'em !important;\n' +
            '    opacity: 1 !important;\n' +
            '}\n' +
            '.applecation-reactions {\n' +
            '    gap: ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '    margin-top: ' + (0.2 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation-reactions .reaction {\n' +
            '    gap: ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '    padding: ' + (0.2 * reactionsSize / 100) + 'em ' + (0.5 * reactionsSize / 100) + 'em ' + (0.2 * reactionsSize / 100) + 'em ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation-reactions .reaction__icon {\n' +
            '    width: ' + (1.6 * reactionsSize / 100) + 'em !important;\n' +
            '    height: ' + (1.6 * reactionsSize / 100) + 'em !important;\n' +
            '    border: 2px solid rgba(255,255,255,0.25) !important;\n' +
            '}\n' +
            '.applecation-reactions .reaction__count {\n' +
            '    font-size: ' + (0.8 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__description {\n' +
            '    max-width: ' + (35 * textScale / 100) + 'vw !important;\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__info {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata {\n' +
            '    gap: ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '    margin: ' + (0.3 * reactionsSize / 100) + 'em 0 ' + (0.5 * spacingScale / 100) + 'em 0 !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata .metadata-badge {\n' +
            '    padding: ' + (0.1 * reactionsSize / 100) + 'em ' + (0.35 * reactionsSize / 100) + 'em !important;\n' +
            '    font-size: ' + (0.7 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata .metadata-season {\n' +
            '    background: rgba(255,0,0,0.2) !important;\n' +
            '    border: 1px solid rgba(255,0,0,0.3) !important;\n' +
            '    color: #ff6b6b !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata .metadata-quality {\n' +
            '    background: rgba(51,153,153,0.15) !important;\n' +
            '    border: 1px solid rgba(51,153,153,0.25) !important;\n' +
            '    color: #5cd4b0 !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata .metadata-hdr {\n' +
            '    background: rgba(255,193,7,0.15) !important;\n' +
            '    border: 1px solid rgba(255,193,7,0.25) !important;\n' +
            '    color: #ffd54f !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata .metadata-audio {\n' +
            '    background: rgba(77,182,255,0.15) !important;\n' +
            '    border: 1px solid rgba(77,182,255,0.25) !important;\n' +
            '    color: #4db6ff !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata .metadata-dub {\n' +
            '    background: rgba(156,39,176,0.15) !important;\n' +
            '    border: 1px solid rgba(156,39,176,0.25) !important;\n' +
            '    color: #ce93d8 !important;\n' +
            '}\n' +
            '.applecation .full-start-new__buttons {\n' +
            '    margin-top: ' + (0.5 * buttonsSpacing / 100) + 'em !important;\n' +
            '}\n' +
            '</style>';

        $('body').append(css);
    }

    // =================================================================
    // Применение начальных настроек
    // =================================================================
    function applyInitialSettings() {
        if (!getSetting('show_ratings', true)) {
            $('body').addClass('applecation--hide-ratings');
        }

        // Применяем тему
        var theme = getSetting('theme_mode', 'apple');
        applyTheme(theme);

        // Кинорежим
        if (getSetting('cinema_mode', false)) {
            toggleCinemaMode(true);
        }

        applyScaling();
    }

    // =================================================================
    // Инжект стилей
    // =================================================================
    function injectStyles() {
        var css = `
        <style id="applecation_styles">
            /* Основные стили */
            .applecation { transition: all .3s; }
            .applecation .full-start-new__body { height: 80vh; }
            .applecation .full-start-new__right { display: flex; align-items: flex-end; }
            .applecation .full-start-new__title { font-size: 2.5em; font-weight: 700; line-height: 1.2; margin-bottom: 0.5em; text-shadow: 0 0 .1em rgba(0,0,0,0.3); }
            
            .applecation__logo { margin-bottom: 0.5em; opacity: 0; transform: translateY(20px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
            .applecation__logo.loaded { opacity: 1; transform: translateY(0); }
            .applecation__logo img { display: block; max-width: 35vw; max-height: 180px; width: auto; height: auto; object-fit: contain; object-position: left center; }
            
            .applecation__content-wrapper { font-size: 100%; }
            
            .applecation__meta { display: flex; align-items: center; color: #fff; font-size: 1.1em; margin-bottom: 0.5em; line-height: 1; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; transition-delay: 0.05s; }
            .applecation__meta.show { opacity: 1; transform: translateY(0); }
            .applecation__meta-left { display: flex; align-items: center; line-height: 1; }
            .applecation__network { display: inline-flex; align-items: center; line-height: 1; }
            .applecation__network img { display: block; max-height: 0.8em; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
            .applecation__meta-text { margin-left: 1em; line-height: 1; }
            .applecation__meta .full-start__pg { margin: 0 0 0 0.6em; padding: 0.2em 0.5em; font-size: 0.85em; font-weight: 600; border: 1.5px solid rgba(255,255,255,0.4); border-radius: 0.3em; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.9); line-height: 1; vertical-align: middle; }
            
            /* Рейтинги */
            .applecation__ratings { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6em; margin-bottom: 0.3em; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; transition-delay: 0.08s; }
            .applecation__ratings.show { opacity: 1; transform: translateY(0); }
            .applecation__ratings .full-start__rate { display: flex !important; align-items: center !important; gap: 0.3em !important; margin: 0 !important; padding: 0 !important; background: none !important; }
            .applecation__ratings .full-start__rate.hide { display: none !important; }
            .applecation__ratings .rating-icon { width: 1.2em; height: 1.2em; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
            .applecation__ratings .rating-icon svg { width: 100%; height: 100%; display: block; }
            .applecation__ratings .rating-value { font-size: 0.9em; font-weight: 700; line-height: 1; color: #fff; padding: 0.1em 0.35em; border-radius: 0.3em; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); }
            .applecation__ratings .rating-value.rate--green { color: #4caf50; border-color: rgba(76,175,80,0.25); }
            .applecation__ratings .rating-value.rate--lime { color: #cddc39; border-color: rgba(205,220,57,0.25); }
            .applecation__ratings .rating-value.rate--orange { color: #ff9800; border-color: rgba(255,152,0,0.25); }
            .applecation__ratings .rating-value.rate--red { color: #f44336; border-color: rgba(244,67,54,0.25); }
            .applecation__ratings .rating-label { font-size: 0.65em; color: rgba(255,255,255,0.6); margin-left: 0.1em; }
            
            /* Реакции */
            .applecation-reactions { margin-top: 0.2em !important; display: flex !important; flex-wrap: wrap !important; gap: 0.3em !important; }
            .applecation-reactions > div { display: block !important; }
            .applecation-reactions .reaction { display: flex !important; align-items: center !important; gap: 0.3em !important; background: rgba(255,255,255,0.05) !important; border-radius: 2em !important; padding: 0.2em 0.5em 0.2em 0.3em !important; border: 1px solid rgba(255,255,255,0.06) !important; }
            .applecation-reactions .reaction__icon { width: 1.6em !important; height: 1.6em !important; border-radius: 50% !important; background: rgba(0,0,0,0.3) !important; padding: 0.3em !important; border: 2px solid rgba(255,255,255,0.2) !important; }
            .applecation-reactions .reaction__icon img { width: 100% !important; height: 100% !important; object-fit: contain !important; }
            .applecation-reactions .reaction__count { font-size: 0.8em !important; font-weight: 600 !important; color: #fff !important; }
            
            /* Метаданные (Flixio стиль) */
            .applecation__metadata { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3em; margin: 0.3em 0 0.5em 0; }
            .applecation__metadata .metadata-badge { display: inline-flex; align-items: center; padding: 0.1em 0.35em; border-radius: 0.2em; font-size: 0.7em; font-weight: 500; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }
            .applecation__metadata .metadata-text { color: rgba(255,255,255,0.6); }
            .applecation__metadata .metadata-loading { font-size: 0.7em; color: rgba(255,255,255,0.3); }
            .applecation__metadata .metadata-season { background: rgba(255,0,0,0.15) !important; border: 1px solid rgba(255,0,0,0.25) !important; color: #ff6b6b !important; }
            .applecation__metadata .metadata-quality { background: rgba(51,153,153,0.12) !important; border: 1px solid rgba(51,153,153,0.2) !important; color: #5cd4b0 !important; }
            .applecation__metadata .metadata-hdr { background: rgba(255,193,7,0.12) !important; border: 1px solid rgba(255,193,7,0.2) !important; color: #ffd54f !important; }
            .applecation__metadata .metadata-audio { background: rgba(77,182,255,0.12) !important; border: 1px solid rgba(77,182,255,0.2) !important; color: #4db6ff !important; }
            .applecation__metadata .metadata-dub { background: rgba(156,39,176,0.12) !important; border: 1px solid rgba(156,39,176,0.2) !important; color: #ce93d8 !important; }
            
            .applecation__description-wrapper { background-color: transparent; padding: 0; border-radius: 1em; width: fit-content; opacity: 0; transform: translateY(15px); transition: padding 0.25s ease, transform 0.25s ease, opacity 0.4s ease-out; transition-delay: 0.1s; }
            .applecation__description-wrapper.show { opacity: 1; transform: translateY(0); }
            .applecation__description-wrapper.focus { background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.18)); padding: .15em .4em 0 .7em; border-radius: 1em; width: fit-content; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35); transform: scale(1.07) translateY(0); transition-delay: 0s; }
            .applecation__description { color: rgba(255,255,255,0.6); font-size: 0.95em; line-height: 1.5; margin-bottom: 0.5em; max-width: 35vw; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
            .focus .applecation__description { color: rgba(255,255,255,0.92); }
            
            .applecation__info { color: rgba(255,255,255,0.75); font-size: 1em; line-height: 1.4; margin-bottom: 0.5em; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; transition-delay: 0.15s; }
            .applecation__info.show { opacity: 1; transform: translateY(0); }
            
            .applecation__left { flex-grow: 1; }
            .applecation__right { display: flex; align-items: center; flex-shrink: 0; position: relative; }
            
            .applecation .full-start-new__rate-line { margin: 0; height: 0; overflow: hidden; opacity: 0; pointer-events: none; }
            
            .full-start__background { height: calc(100% + 6em); left: 0 !important; opacity: 0 !important; transition: opacity 0.6s ease-out, filter 0.3s ease-out !important; animation: none !important; transform: none !important; will-change: opacity, filter; }
            .full-start__background.loaded:not(.dim) { opacity: 1 !important; }
            .full-start__background.dim { filter: blur(30px); }
            .full-start__background.loaded.applecation-animated { opacity: 1 !important; }
            body:not(.menu--open) .full-start__background { mask-image: none; }
            body.advanced--animation:not(.no--animation) .full-start__background.loaded { animation: none !important; }
            
            .applecation__overlay { width: 90vw; background: linear-gradient(to right, rgba(0,0,0,0.792) 0%, rgba(0,0,0,0.504) 25%, rgba(0,0,0,0.264) 45%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0.043) 60%, rgba(0,0,0,0) 65%); }
            
            .applecation-description-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.3s ease, visibility 0.3s ease; }
            .applecation-description-overlay.show { opacity: 1; visibility: visible; pointer-events: all; }
            .applecation-description-overlay__bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; backdrop-filter: blur(100px); }
            .applecation-description-overlay__content { position: relative; z-index: 1; max-width: 60vw; max-height: 90vh; overflow-y: auto; }
            .applecation-description-overlay__logo { text-align: center; margin-bottom: 1.5em; display: none; }
            .applecation-description-overlay__logo img { max-width: 40vw; max-height: 150px; width: auto; height: auto; object-fit: contain; }
            .applecation-description-overlay__title { font-size: 2em; font-weight: 600; margin-bottom: 1em; color: #fff; text-align: center; }
            .applecation-description-overlay__text { font-size: 1.2em; line-height: 1.6; color: rgba(255,255,255,0.9); white-space: pre-wrap; margin-bottom: 1.5em; }
            .applecation-description-overlay__details { display: flex; flex-wrap: wrap; margin: -1em; }
            .applecation-description-overlay__details > * { margin: 1em; }
            .applecation-description-overlay__info-name { font-size: 1.1em; margin-bottom: 0.5em; opacity: 0.7; }
            .applecation-description-overlay__info-body { font-size: 1.2em; }
            
            .applecation .full-person { display: flex !important; flex-direction: column !important; align-items: center !important; width: 10.7em !important; background: none !important; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: transform; animation: none !important; margin-left: 0; }
            .applecation .full-person.focus { transform: scale(1.08) translateY(-6px) !important; z-index: 10; }
            .applecation .full-person__photo { position: relative !important; width: 9.4em !important; height: 9.4em !important; margin: 0 0 .3em 0 !important; border-radius: 50% !important; overflow: hidden !important; background: rgba(255,255,255,0.05) !important; flex-shrink: 0 !important; transition: box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: transform, box-shadow, backdrop-filter; animation: none !important; }
            .applecation .full-person__photo img { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 50% !important; }
            .applecation .full-person__photo::before { content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: opacity; z-index: 2; box-shadow: inset 2px 2px 1px rgba(255,255,255,0.30), inset -2px -2px 2px rgba(255,255,255,0.30); }
            .applecation .full-person__photo::after { content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: opacity; z-index: 3; background: radial-gradient(circle at center, transparent 58%, rgba(255,255,255,0.22) 75%, rgba(255,255,255,0.38) 90%), radial-gradient(120% 85% at 18% 10%, rgba(255,255,255,0.35), rgba(255,255,255,0.10) 38%, transparent 62%); mix-blend-mode: screen; }
            .applecation .full-person.focus .full-person__photo::before,
            .applecation .full-person.focus .full-person__photo::after { opacity: 1; }
            .applecation .full-person.focus .full-person__photo::after { opacity: 0.9; }
            
            .applecation .full-person__body { display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; width: 100% !important; padding: 0 0.3em !important; }
            .applecation .full-person__name { font-size: 1em !important; font-weight: 600 !important; color: #fff !important; line-height: 1.3 !important; width: 100% !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; position: relative !important; }
            .applecation .full-person__name.marquee-active { text-overflow: clip !important; mask-image: linear-gradient(to right, #000 92%, transparent 100%); -webkit-mask-image: linear-gradient(to right, #000 92%, transparent 100%); }
            .applecation .full-person.focus .full-person__name.marquee-active { mask-image: linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%); }
            .applecation .marquee__inner { display: inline-block; white-space: nowrap; }
            .applecation .marquee__inner span { padding-right: 2.5em; display: inline-block; }
            .applecation .full-person.focus .full-person__name.marquee-active .marquee__inner { animation: marquee var(--marquee-duration, 5s) linear infinite; }
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            
            .applecation .full-person__role { font-size: 0.8em !important; font-weight: 400 !important; color: rgba(255,255,255,0.5) !important; line-height: 1.3 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; width: 100% !important; margin-top: 0; }
            .applecation .full-person.focus .full-person__role { color: rgb(255,255,255) !important; }
            
            /* Эпизоды в стиле Flixio */
            .applecation .full-episode--small { width: 20em !important; height: auto !important; margin-right: 1.5em !important; background: none !important; display: flex !important; flex-direction: column !important; transition: transform 0.3s !important; }
            .applecation .full-episode--small.focus { transform: scale(1.02); }
            .applecation .full-episode__img { padding-bottom: 56.25% !important; border-radius: 0.8em !important; margin-bottom: 1em !important; background-color: rgba(255,255,255,0.05) !important; position: relative !important; overflow: visible !important; }
            .applecation .full-episode__img img { border-radius: 0.8em !important; object-fit: cover !important; }
            .applecation .full-episode__time { position: absolute; bottom: 0.8em; left: 0.8em; background: rgba(0,0,0,0.6); padding: 0.2em 0.5em; border-radius: 0.4em; font-size: 0.75em; font-weight: 600; color: #fff; backdrop-filter: blur(5px); z-index: 2; }
            .applecation .full-episode__time:empty { display: none; }
            .applecation .full-episode__body { position: static !important; display: flex !important; flex-direction: column !important; background: none !important; padding: 0 0.5em !important; opacity: 0.6; transition: opacity 0.3s; }
            .applecation .full-episode.focus .full-episode__body { opacity: 1; }
            .applecation .full-episode__num { font-size: 0.75em !important; font-weight: 600 !important; text-transform: uppercase !important; color: rgba(255,255,255,0.4) !important; margin-bottom: 0.2em !important; letter-spacing: 0.05em !important; }
            .applecation .full-episode__name { font-size: 1.1em !important; font-weight: 600 !important; color: #fff !important; margin-bottom: 0.4em !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; line-height: 1.4 !important; padding-bottom: 0.1em !important; }
            .applecation .full-episode__overview { font-size: 0.85em !important; line-height: 1.4 !important; color: rgba(255,255,255,0.5) !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; margin-bottom: 0.6em !important; height: 2.8em !important; }
            .applecation .full-episode__date { font-size: 0.8em !important; color: rgba(255,255,255,0.3) !important; }
            
            /* Кнопки */
            .applecation-buttons { display: flex !important; flex-wrap: wrap !important; gap: 0.5em !important; }
            .applecation-buttons .full-start__button { flex: 0 0 auto !important; margin: 0 !important; }
            
            @media screen and (max-width: 720px) {
                .applecation .full-start-new__body { height: auto !important; min-height: 0 !important; }
                .applecation .full-start-new__right { display: block !important; }
                .applecation .applecation__right { display: none !important; }
                .applecation .applecation__left { width: 100% !important; max-width: none !important; }
                .applecation .applecation__content-wrapper { width: 100% !important; }
                .applecation .applecation__description-wrapper { width: 100% !important; }
                .applecation .applecation__description { max-width: none !important; width: 100% !important; }
                .applecation-buttons { justify-content: center !important; }
            }
        </style>`;

        $('body').append(css);
    }

    // =================================================================
    // Настройки
    // =================================================================
    function addSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: 'applecation_settings',
            name: 'AppleTV+ Pro v3.0',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 18l20 12-10 2 2 10-12-24z" fill="currentColor"/><path d="M44 20l6-6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>'
        });

        // Качество постера
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_poster_quality',
                type: 'select',
                values: {
                    low: tr('quality_low') + ' - 1280x720',
                    medium: tr('quality_medium') + ' - 1920x1080',
                    high: tr('quality_high') + ' - 3840x2160'
                },
                default: 'medium'
            },
            field: {
                name: tr('settings_poster_quality'),
                description: tr('settings_poster_quality_desc')
            },
            onChange: function(value) {
                setSetting('poster_quality', value);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: { type: 'title' },
            field: { name: tr('settings_title_display') }
        });

        // Тема оформления
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_theme_mode',
                type: 'select',
                values: {
                    apple: tr('theme_apple'),
                    temav: tr('theme_temav'),
                    flixio: tr('theme_flixio'),
                    custom: tr('theme_custom')
                },
                default: 'apple'
            },
            field: {
                name: tr('theme_mode'),
                description: tr('theme_mode_desc')
            },
            onChange: function(value) {
                setSetting('theme_mode', value);
                var theme = value;
                applyTheme(theme);
            }
        });

        // Показывать рейтинги
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_ratings',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('show_ratings'),
                description: tr('show_ratings_desc')
            },
            onChange: function(value) {
                setSetting('show_ratings', value);
                if (value) {
                    $('body').removeClass('applecation--hide-ratings');
                } else {
                    $('body').addClass('applecation--hide-ratings');
                }
            }
        });

        // Размер рейтингов
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_ratings_size',
                type: 'select',
                values: {
                    50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%',
                    100: tr('scale_default') + ' (100%)',
                    110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%'
                },
                default: '100'
            },
            field: {
                name: tr('ratings_size'),
                description: tr('ratings_size_desc')
            },
            onChange: function(value) {
                setSetting('ratings_size', parseInt(value, 10));
                applyScaling();
            }
        });

        // Размер реакций
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_reactions_size',
                type: 'select',
                values: {
                    50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%',
                    100: tr('scale_default') + ' (100%)',
                    110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%'
                },
                default: '100'
            },
            field: {
                name: tr('reactions_size'),
                description: tr('reactions_size_desc')
            },
            onChange: function(value) {
                setSetting('reactions_size', parseInt(value, 10));
                applyScaling();
            }
        });

        // Показывать реакции
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_reactions',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('show_reactions'),
                description: tr('show_reactions_desc')
            },
            onChange: function(value) {
                setSetting('show_reactions', value);
                if (value) {
                    $('.applecation-reactions').show();
                } else {
                    $('.applecation-reactions').hide();
                }
            }
        });

        // Показывать метаданные
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_metadata',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('show_metadata'),
                description: tr('show_metadata_desc')
            },
            onChange: function(value) {
                setSetting('show_metadata', value);
            }
        });

        // Показывать описание
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_description',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('show_description'),
                description: tr('show_description_desc')
            },
            onChange: function(value) {
                setSetting('show_description', value);
            }
        });

        // Описание в оверлее
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_description_overlay',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('description_overlay'),
                description: tr('description_overlay_desc')
            },
            onChange: function(value) {
                setSetting('description_overlay', value);
            }
        });

        // Режим "Кинотеатр"
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_cinema_mode',
                type: 'trigger',
                default: false
            },
            field: {
                name: tr('cinema_mode'),
                description: tr('cinema_mode_desc')
            },
            onChange: function(value) {
                setSetting('cinema_mode', value);
                toggleCinemaMode(value);
            }
        });

        // Размытие фона
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_cinema_blur',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('cinema_blur'),
                description: tr('cinema_blur_desc')
            },
            onChange: function(value) {
                setSetting('cinema_blur', value);
            }
        });

        // Масштабирование
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: { type: 'title' },
            field: { name: tr('settings_title_scaling') }
        });

        var scaleValues = {50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%', 100: tr('scale_default') + ' (100%)', 110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%', 160: '160%', 170: '170%', 180: '180%', 200: '200%', 250: '250%', 300: '300%'};

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_logo_scale',
                type: 'select',
                values: scaleValues,
                default: '100'
            },
            field: {
                name: tr('logo_scale'),
                description: tr('logo_scale_desc')
            },
            onChange: function(value) {
                setSetting('logo_scale', parseInt(value, 10));
                applyScaling();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_text_scale',
                type: 'select',
                values: scaleValues,
                default: '100'
            },
            field: {
                name: tr('text_scale'),
                description: tr('text_scale_desc')
            },
            onChange: function(value) {
                setSetting('text_scale', parseInt(value, 10));
                applyScaling();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_spacing_scale',
                type: 'select',
                values: {50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%', 100: tr('scale_default') + ' (100%)', 110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%', 160: '160%', 170: '170%', 180: '180%', 200: '200%', 250: '250%', 300: '300%'},
                default: '100'
            },
            field: {
                name: tr('spacing_scale'),
                description: tr('spacing_scale_desc')
            },
            onChange: function(value) {
                setSetting('spacing_scale', parseInt(value, 10));
                applyScaling();
            }
        });

        // Отступ до кнопок
        var buttonSpacingValues = {};
        for (var i = 100; i <= 1500; i += 100) {
            buttonSpacingValues[i] = i + '%';
        }

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_buttons_spacing',
                type: 'select',
                values: buttonSpacingValues,
                default: '100'
            },
            field: {
                name: tr('buttons_spacing'),
                description: tr('buttons_spacing_desc')
            },
            onChange: function(value) {
                setSetting('buttons_spacing', parseInt(value, 10));
                applyScaling();
            }
        });
    }

    // =================================================================
    // Регистрация плагина
    // =================================================================
    var pluginInfo = {
        type: 'other',
        version: PLUGIN_VERSION,
        name: PLUGIN_NAME,
        description: 'Стиль Apple TV с интеграцией плагинов #1, #4, #6. Рейтинги, метаданные, кинорежим.',
        author: 'AppleTV+ Pro Team',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 18l20 12-10 2 2 10-12-24z" fill="currentColor"/><path d="M44 20l6-6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>'
    };

    if (Lampa.Manifest && Lampa.Manifest.plugins) {
        Lampa.Manifest.plugins['applecation_pro'] = pluginInfo;
    }

    // =================================================================
    // Запуск
    // =================================================================
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                initPlugin();
            }
        });
    }

})();
