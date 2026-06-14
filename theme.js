/**
 * Flixio Studios Lite - Модифицированная версия
 */

(function () {
    'use strict';

    window.FLIXIO_STUDIOS_VER = '3.0-lite';
    window.FLIXIO_STUDIOS_LOADED = false;
    window.FLIXIO_STUDIOS_ERROR = null;

    if (typeof Lampa === 'undefined') {
        window.FLIXIO_STUDIOS_ERROR = 'Lampa not found';
        return;
    }

    // =================================================================
    // CONFIGURATION
    // =================================================================
    var FLIXIO_LANG = 'ru';
    var FLIXIO_BASE_URL = 'https://cdn.jsdelivr.net/gh/syvyj/studio_2@main/';

    function tr(key) {
        // Только русский язык
        var translations = {
            settings_tab_title: 'Flixio',
            settings_header_info: 'Flixio — кастомная страница фильмов в стиле Apple TV+. Автор: Flixio Team',
            settings_sections_title: 'Настройки',
            settings_streamings_name: 'Стриминги',
            settings_streamings_desc: 'Показывать секцию с логотипами стримингов',
            settings_badges_title: 'Метки на карточках (отключено, используется другой плагин)',
            settings_badge_ru_name: 'Русская озвучка (RU)',
            settings_badge_ua_name: 'Украинская озвучка (UA)',
            settings_badge_en_name: 'Английская озвучка (EN)',
            settings_badge_4k_name: 'Качество 4K',
            settings_badge_fhd_name: 'Качество FHD',
            settings_badge_hdr_name: 'HDR / Dolby Vision',
            settings_tmdb_input_name: 'Свой ключ TMDB',
            settings_tmdb_input_desc: 'Если указать — плагин будет использовать его вместо ключа Лампы.',
            go_to_page: 'На страницу',
            loading_trailer: 'Загрузка трейлера...',
            menu_title: 'Меню',
            menu_details: 'Детальнее',
            menu_trailer: 'Трейлер',
            cat_new_movies: '🔥 Новые фильмы',
            cat_new_tv: '🔥 Новые сериалы',
            cat_top_tv: '🏆 Топ сериалы',
            cat_top_movies: '🏆 Топ фильмы',
            cat_top_movies_wb: '🏆 Топ фильмы (WB)',
            cat_only_netflix: '🅰️ Только на Netflix (Originals)',
            cat_twisted_thrillers: '🤯 Запутанные триллеры',
            cat_fantasy_sci: '🐉 Фантастика и Фентези',
            cat_kdrama: '🇰🇷 K-Dramas (Корея)',
            cat_truecrime_doc: '🔪 Документальный True Crime',
            cat_anime: '🍿 Аниме',
            cat_apple_epic_sci: '🛸 Эпический Sci-Fi (Apple)',
            cat_comedy_feelgood: '😂 Комедии и Feel-Good',
            cat_quality_detectives: '🕵️ Качественные детективы',
            cat_apple_original: '🎬 Apple Original Films',
            cat_epic_sagas: '🐉 Эпические саги (Фентези)',
            cat_premium_dramas: '🎭 Премиальные драмы',
            cat_dc_blockbusters: '🦇 Блокбастеры DC',
            cat_dark_detectives: '🧠 Мрачные детективы',
            cat_hbo_classics: '👑 Золотая классика HBO',
            cat_hard_action: '🩸 Жесткий экшн и Антигерои',
            cat_amazon_mgm: '🎬 Фильмы от Amazon MGM',
            cat_comedies: '😂 Комедии',
            cat_thrillers: '🕵️ Триллеры',
            cat_adult_animation: '🤬 Анимация для взрослых',
            cat_marvel_universe: '🦸‍♂️ Кинопселенная Marvel',
            cat_starwars: '⚔️ Далекая галактика (Star Wars)',
            cat_pixar: '🧸 Шедевры Pixar',
            cat_fx_star: '🍷 Взрослый контент (FX / Star)',
            cat_sheridan_universe: '🤠 Вселенная Шеридана (Yellowstone)',
            cat_startrek_collection: '🖖 Коллекция Star Trek',
            cat_crime_investigation: '🚓 Криминал и Расследования',
            cat_kids_world: '🧽 Детский мир (Nickelodeon)',
            cat_paramount_blockbusters: '🎬 Блокбастеры (Paramount)',
            cat_universal_world: '🌍 Мир Universal',
            cat_showtime_adult: '🕵️ Взрослый разбор (Showtime)',
            cat_dreamworks_worlds: '🦄 Сказочные миры (DreamWorks)',
            cat_new_releases_syfy: '🔥 Новинки',
            cat_top_syfy: '🏆 Топ на Syfy',
            cat_space_travel: '🚀 Космические путешествия',
            cat_monsters_paranormal: '🧟 Монстры и паранормальное',
            educational_title: 'Познавательное',
            cat_new_episodes: '🔥 Новые выпуски',
            cat_cooking_battles: '🔪 Кулинарные битвы',
            cat_survival: '🪓 Выживание'
        };
        return translations[key] || key;
    }

    // =================================================================
    // TMDB KEY
    // =================================================================
    function getTmdbKey() {
        var custom = (Lampa.Storage.get('flixio_tmdb_apikey') || '').trim();
        return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
    }

    // =================================================================
    // SERVICE CONFIGURATIONS (Streamings)
    // =================================================================
    var SERVICE_CONFIGS = {
        'netflix': {
            title: 'Netflix',
            logo: 'logos/netflix.svg',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 2L16.5 22" stroke="#E50914" stroke-width="4"/><path d="M7.5 2L7.5 22" stroke="#E50914" stroke-width="4"/><path d="M7.5 2L16.5 22" stroke="#E50914" stroke-width="4"/></svg>',
            categories: [
                { "title": tr('cat_new_movies'), "url": "discover/movie", "params": { "with_watch_providers": "8", "watch_region": "RU", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": tr('cat_new_tv'), "url": "discover/tv", "params": { "with_networks": "213", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": tr('cat_top_tv'), "url": "discover/tv", "params": { "with_networks": "213", "sort_by": "popularity.desc" } },
                { "title": tr('cat_top_movies'), "url": "discover/movie", "params": { "with_watch_providers": "8", "watch_region": "RU", "sort_by": "popularity.desc" } },
                { "title": tr('cat_only_netflix'), "url": "discover/tv", "params": { "with_networks": "213", "sort_by": "vote_average.desc", "vote_count.gte": "500", "vote_average.gte": "7.5" } },
                { "title": tr('cat_twisted_thrillers'), "url": "discover/movie", "params": { "with_watch_providers": "8", "watch_region": "RU", "with_genres": "53,9648", "sort_by": "popularity.desc" } },
                { "title": tr('cat_fantasy_sci'), "url": "discover/tv", "params": { "with_networks": "213", "with_genres": "10765", "sort_by": "popularity.desc" } },
                { "title": tr('cat_kdrama'), "url": "discover/tv", "params": { "with_networks": "213", "with_original_language": "ko", "sort_by": "popularity.desc" } },
                { "title": tr('cat_truecrime_doc'), "url": "discover/tv", "params": { "with_networks": "213", "with_genres": "99", "with_keywords": "9840|10714", "sort_by": "popularity.desc" } },
                { "title": tr('cat_anime'), "url": "discover/tv", "params": { "with_networks": "213", "with_genres": "16", "with_keywords": "210024", "sort_by": "popularity.desc" } }
            ]
        },
        'apple': {
            title: 'Apple TV+',
            logo: 'logos/apple.svg',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
            categories: [
                { "title": tr('cat_new_tv'), "url": "discover/tv", "params": { "with_networks": "2552|3235", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": tr('cat_new_movies'), "url": "discover/movie", "params": { "with_watch_providers": "350", "watch_region": "RU", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": tr('cat_top_tv'), "url": "discover/tv", "params": { "with_networks": "2552|3235", "sort_by": "popularity.desc" } },
                { "title": tr('cat_top_movies'), "url": "discover/movie", "params": { "with_watch_providers": "350", "watch_region": "RU", "sort_by": "popularity.desc" } },
                { "title": tr('cat_apple_epic_sci'), "url": "discover/tv", "params": { "with_networks": "2552|3235", "with_genres": "10765", "sort_by": "popularity.desc" } },
                { "title": tr('cat_comedy_feelgood'), "url": "discover/tv", "params": { "with_networks": "2552|3235", "with_genres": "35", "sort_by": "popularity.desc" } },
                { "title": tr('cat_quality_detectives'), "url": "discover/tv", "params": { "with_networks": "2552|3235", "with_genres": "9648,80", "sort_by": "popularity.desc" } },
                { "title": tr('cat_apple_original'), "url": "discover/movie", "params": { "with_watch_providers": "350", "watch_region": "RU", "sort_by": "vote_average.desc", "vote_count.gte": "100" } }
            ]
        },
        'hbo': {
            title: 'HBO / Max',
            logo: 'logos/hbo.svg',
            icon: '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="currentColor"><path d="M7.042 16.896H4.414v-3.754H2.708v3.754H.01L0 7.22h2.708v3.6h1.706v-3.6h2.628zm12.043.046C21.795 16.94 24 14.689 24 11.978a4.89 4.89 0 0 0-4.915-4.92c-2.707-.002-4.09 1.991-4.432 2.795.003-1.207-1.187-2.632-2.58-2.634H7.59v9.674l4.181.001c1.686 0 2.886-1.46 2.888-2.713.385.788 1.72 2.762 4.427 2.76zm-7.665-3.936c.387 0 .692.382.692.817 0 .435-.305.817-.692.817h-1.33v-1.634zm.005-3.633c.387 0 .692.382.692.817 0 .436-.305.818-.692.818h-1.33V9.373zm1.77 2.607c.305-.039.813-.387.992-.61-.063.276-.068 1.074.006 1.35-.204-.314-.688-.701-.998-.74zm3.43 0a2.462 2.462 0 1 1 4.924 0 2.462 2.462 0 0 1-4.925 0zm2.462 1.936a1.936 1.936 0 1 0 0-3.872 1.936 1.936 0 0 0 0 3.872z"/></svg>',
            categories: [
                { "title": tr('cat_new_tv'), "url": "discover/tv", "params": { "with_networks": "49|3186", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": tr('cat_new_movies'), "url": "discover/movie", "params": { "with_companies": "174|49", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "10" } },
                { "title": tr('cat_top_tv'), "url": "discover/tv", "params": { "with_networks": "49|3186", "sort_by": "popularity.desc" } },
                { "title": tr('cat_top_movies_wb'), "url": "discover/movie", "params": { "with_companies": "174", "sort_by": "popularity.desc", "vote_count.gte": "50" } },
                { "title": tr('cat_epic_sagas'), "url": "discover/tv", "params": { "with_networks": "49|3186", "with_genres": "10765", "sort_by": "popularity.desc" } },
                { "title": tr('cat_premium_dramas'), "url": "discover/tv", "params": { "with_networks": "49", "with_genres": "18", "without_genres": "10765", "sort_by": "popularity.desc" } },
                { "title": tr('cat_dc_blockbusters'), "url": "discover/movie", "params": { "with_companies": "174", "with_keywords": "9715", "sort_by": "revenue.desc" } },
                { "title": tr('cat_dark_detectives'), "url": "discover/tv", "params": { "with_networks": "49", "with_genres": "80,9648", "sort_by": "vote_average.desc", "vote_count.gte": "300" } },
                { "title": tr('cat_hbo_classics'), "url": "discover/tv", "params": { "with_networks": "49", "sort_by": "vote_average.desc", "vote_count.gte": "1000" } }
            ]
        },
        'amazon': {
            title: 'Prime Video',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 15c2.4 1.7 5.1 2.6 8 2.6 2.9 0 5.6-.9 8-2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M15.5 14.4L18 16.8 15.5 19.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            categories: [
                { "title": tr('cat_new_tv'), "url": "discover/tv", "params": { "with_networks": "1024", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": tr('cat_new_movies'), "url": "discover/movie", "params": { "with_watch_providers": "119", "watch_region": "US", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": tr('cat_top_tv'), "url": "discover/tv", "params": { "with_networks": "1024", "sort_by": "popularity.desc" } },
                { "title": tr('cat_top_movies'), "url": "discover/movie", "params": { "with_watch_providers": "119", "watch_region": "US", "sort_by": "popularity.desc" } },
                { "title": tr('cat_hard_action'), "url": "discover/tv", "params": { "with_networks": "1024", "with_genres": "10759,10765", "sort_by": "popularity.desc" } },
                { "title": tr('cat_amazon_mgm'), "url": "discover/movie", "params": { "with_companies": "1024|21", "sort_by": "popularity.desc" } },
                { "title": tr('cat_comedies'), "url": "discover/tv", "params": { "with_networks": "1024", "with_genres": "35", "sort_by": "popularity.desc" } },
                { "title": tr('cat_thrillers'), "url": "discover/tv", "params": { "with_networks": "1024", "with_genres": "9648,18", "sort_by": "vote_average.desc", "vote_count.gte": "300" } }
            ]
        },
        'disney': {
            title: 'Disney+',
            logo: 'logos/disney.svg',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10c2.2-2.5 5-3.7 8-3.7 2.2 0 4.1.7 5.8 1.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M12 13v4M10 15h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
            categories: [
                { "title": tr('cat_new_tv'), "url": "discover/tv", "params": { "with_networks": "2739", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": tr('cat_new_movies'), "url": "discover/movie", "params": { "with_watch_providers": "337", "watch_region": "US", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": tr('cat_top_tv'), "url": "discover/tv", "params": { "with_networks": "2739", "sort_by": "popularity.desc" } },
                { "title": tr('cat_top_movies'), "url": "discover/movie", "params": { "with_companies": "2", "sort_by": "popularity.desc" } },
                { "title": tr('cat_marvel_universe'), "url": "discover/movie", "params": { "with_companies": "420", "sort_by": "release_date.desc", "vote_count.gte": "100" } },
                { "title": tr('cat_starwars'), "url": "discover/tv", "params": { "with_companies": "1", "with_keywords": "1930", "sort_by": "popularity.desc" } },
                { "title": tr('cat_pixar'), "url": "discover/movie", "params": { "with_companies": "3", "sort_by": "popularity.desc" } },
                { "title": tr('cat_fx_star'), "url": "discover/tv", "params": { "with_networks": "88|453", "sort_by": "popularity.desc" } }
            ]
        },
        'paramount': {
            title: 'Paramount+',
            logo: 'logos/paramount.svg',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22H22L12 2ZM12 6.5L18.5 19.5H5.5L12 6.5Z"/></svg>',
            categories: [
                { "title": tr('cat_new_tv'), "url": "discover/tv", "params": { "with_networks": "4330", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": tr('cat_new_movies'), "url": "discover/movie", "params": { "with_companies": "4", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "10" } },
                { "title": tr('cat_top_tv'), "url": "discover/tv", "params": { "with_networks": "4330", "sort_by": "popularity.desc" } },
                { "title": tr('cat_top_movies'), "url": "discover/movie", "params": { "with_companies": "4", "sort_by": "popularity.desc" } },
                { "title": tr('cat_sheridan_universe'), "url": "discover/tv", "params": { "with_networks": "318|4330", "with_keywords": "256112", "sort_by": "popularity.desc" } },
                { "title": tr('cat_startrek_collection'), "url": "discover/tv", "params": { "with_networks": "4330", "with_keywords": "159223", "sort_by": "first_air_date.desc" } },
                { "title": tr('cat_crime_investigation'), "url": "discover/tv", "params": { "with_networks": "16", "with_genres": "80,18", "sort_by": "popularity.desc" } },
                { "title": tr('cat_kids_world'), "url": "discover/tv", "params": { "with_networks": "13", "sort_by": "popularity.desc" } }
            ]
        },
        'sky_showtime': {
            title: 'Sky Showtime',
            logo: 'logos/SkyShowtime.svg',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 9.5c1-.8 2.2-1.2 3.5-1.2 2 0 3.7 1 4.7 2.6" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
            categories: [
                { "title": tr('cat_new_tv'), "url": "discover/tv", "params": { "with_companies": "67|115331", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": tr('cat_new_movies'), "url": "discover/movie", "params": { "with_companies": "4|33|521", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": tr('cat_top_tv'), "url": "discover/tv", "params": { "with_companies": "67|115331", "sort_by": "popularity.desc" } },
                { "title": tr('cat_top_movies'), "url": "discover/movie", "params": { "with_companies": "4|33", "sort_by": "popularity.desc" } },
                { "title": tr('cat_paramount_blockbusters'), "url": "discover/movie", "params": { "with_companies": "4", "sort_by": "revenue.desc" } },
                { "title": tr('cat_universal_world'), "url": "discover/movie", "params": { "with_companies": "33", "sort_by": "popularity.desc" } },
                { "title": tr('cat_showtime_adult'), "url": "discover/tv", "params": { "with_companies": "67", "sort_by": "popularity.desc" } },
                { "title": tr('cat_dreamworks_worlds'), "url": "discover/movie", "params": { "with_companies": "521", "sort_by": "popularity.desc" } }
            ]
        },
        'hulu': {
            title: 'Hulu',
            logo: 'logos/Hulu.svg',
            icon: '<svg viewBox="0 0 24 24" fill="#3DBB3D"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>',
            categories: [
                { "title": tr('cat_new_tv'), "url": "discover/tv", "params": { "with_networks": "453", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": tr('cat_new_movies'), "url": "discover/movie", "params": { "with_watch_providers": "15", "watch_region": "US", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": tr('cat_top_tv'), "url": "discover/tv", "params": { "with_networks": "453", "sort_by": "popularity.desc" } },
                { "title": tr('cat_top_movies'), "url": "discover/movie", "params": { "with_watch_providers": "15", "watch_region": "US", "sort_by": "popularity.desc" } },
                { "title": tr('cat_truecrime_doc'), "url": "discover/tv", "params": { "with_networks": "453", "with_genres": "18,9648", "sort_by": "popularity.desc" } },
                { "title": tr('cat_comedy_feelgood'), "url": "discover/tv", "params": { "with_networks": "453", "with_genres": "35", "sort_by": "popularity.desc" } },
                { "title": tr('cat_adult_animation'), "url": "discover/tv", "params": { "with_networks": "453", "with_genres": "16", "sort_by": "popularity.desc" } }
            ]
        },
        'syfy': {
            title: 'Syfy',
            logo: 'logos/Syfy.svg',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>',
            categories: [
                { "title": tr('cat_new_releases_syfy'), "url": "discover/tv", "params": { "with_networks": "77", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "1" } },
                { "title": tr('cat_top_syfy'), "url": "discover/tv", "params": { "with_networks": "77", "sort_by": "popularity.desc" } },
                { "title": tr('cat_space_travel'), "url": "discover/tv", "params": { "with_networks": "77", "with_genres": "10765", "with_keywords": "3801", "sort_by": "vote_average.desc", "vote_count.gte": "50" } },
                { "title": tr('cat_monsters_paranormal'), "url": "discover/tv", "params": { "with_networks": "77", "with_genres": "9648,10765", "without_keywords": "3801", "sort_by": "popularity.desc" } }
            ]
        },
        'educational_and_reality': {
            title: tr('educational_title'),
            logo: 'logos/Discovery.svg',
            icon: '<svg viewBox="0 0 24 24" fill="#FF9800"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>',
            categories: [
                { "title": tr('cat_new_episodes'), "url": "discover/tv", "params": { "with_networks": "64|91|43|2696|4|65", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": "🌍 Discovery Channel", "url": "discover/tv", "params": { "with_networks": "64", "sort_by": "popularity.desc" } },
                { "title": "🦁 National Geographic", "url": "discover/tv", "params": { "with_networks": "43", "sort_by": "popularity.desc" } },
                { "title": "🐾 Animal Planet", "url": "discover/tv", "params": { "with_networks": "91", "sort_by": "popularity.desc" } },
                { "title": "🌿 BBC Earth", "url": "discover/tv", "params": { "with_networks": "4", "with_genres": "99", "sort_by": "vote_average.desc", "vote_count.gte": "20" } },
                { "title": tr('cat_cooking_battles'), "url": "discover/tv", "params": { "with_genres": "10764", "with_keywords": "222083", "sort_by": "popularity.desc" } },
                { "title": tr('cat_survival'), "url": "discover/tv", "params": { "with_genres": "10764", "with_keywords": "5481|10348", "sort_by": "popularity.desc" } }
            ]
        }
    };

    // =================================================================
    // GLOBAL PLAYER HELPER
    // =================================================================
    function playYouTubeCustom(key) {
        var overlay = $('<div class="youtube-pro-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; background: #000;"></div>');
        var playerContainer = $('<div id="yt-player-custom"></div>');
        var loader = $('<div class="yt-loader" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 1.5em; font-weight: bold; text-align: center;"><div class="broadcast__scan"></div><div>' + tr('loading_trailer') + '</div></div>');
        
        overlay.append(loader);
        overlay.append(playerContainer);
        $('body').append(overlay);
        
        var closePlayer = function() {
            overlay.remove();
            Lampa.Controller.toggle('content'); 
        };
        
        Lampa.Controller.add('youtube_custom_controller', {
            toggle: function() {}, up: function() {}, down: function() {}, left: function() {}, right: function() {},
            enter: function() {}, back: closePlayer
        });
        Lampa.Controller.toggle('youtube_custom_controller');
        
        var initPlayer = function() {
            new YT.Player('yt-player-custom', {
                height: '100%',
                width: '100%',
                videoId: key,
                playerVars: { 'autoplay': 1, 'controls': 1, 'showinfo': 0, 'rel': 0, 'modestbranding': 1, 'iv_load_policy': 3, 'playsinline': 1, 'disablekb': 1, 'fs': 0 },
                events: {
                    'onReady': function(event) { 
                        loader.remove();
                        event.target.playVideo(); 
                    },
                    'onStateChange': function(event) {
                        if (event.data === 0) closePlayer();
                    },
                    'onError': function(e) { 
                        if (e.data == 150 || e.data == 153) Lampa.Noty.show('Видео ограничено владельцем (Error ' + e.data + ')');
                        else Lampa.Noty.show('Ошибка YouTube: ' + e.data);
                        closePlayer();
                    }
                }
            });
        };
        
        if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            var oldReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = function() { if(oldReady) oldReady(); initPlayer(); };
        } else {
            initPlayer();
        }
    }

    // =================================================================
    // STREAMING COMPONENTS
    // =================================================================
    function StudiosMain(object) {
        var comp = new Lampa.InteractionMain(object);
        var config = SERVICE_CONFIGS[object.service_id];
        if (!config) { comp.empty && comp.empty(); return comp; }

        comp.create = function () {
            var _this = this;
            this.activity.loader(true);
            var categories = config.categories;
            var network = new Lampa.Reguest();
            var total = categories.length;
            var status = new Lampa.Status(total);

            status.onComplite = function () {
                var fulldata = [];
                if (status.data) {
                    Object.keys(status.data).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); }).forEach(function (key) {
                        var num = parseInt(key, 10);
                        var data = status.data[key];
                        var cat = categories[num];
                        if (cat && data && data.results && data.results.length) {
                            Lampa.Utils.extendItemsParams(data.results, { style: { name: 'wide' } });
                            fulldata.push({
                                title: cat.title,
                                results: data.results,
                                url: cat.url,
                                params: cat.params,
                                service_id: object.service_id
                            });
                        }
                    });
                }

                if (fulldata.length) {
                    _this.build(fulldata);
                    _this.activity.loader(false);
                } else {
                    _this.empty();
                }
            };

            categories.forEach(function (cat, index) {
                var params = [];
                params.push('api_key=' + getTmdbKey());
                params.push('language=' + Lampa.Storage.get('language', 'ru'));
                if (cat.params) {
                    for (var key in cat.params) {
                        var val = cat.params[key];
                        if (val === '{current_date}') {
                            var d = new Date();
                            val = [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2)].join('-');
                        }
                        params.push(key + '=' + val);
                    }
                }
                var url = Lampa.TMDB.api(cat.url + '?' + params.join('&'));

                network.silent(url, function (json) {
                    if (json && json.results && Array.isArray(json.results)) {
                        json.results.forEach(function (item) {
                            if (!item.poster_path && item.backdrop_path) {
                                item.poster_path = item.backdrop_path;
                            }
                        });
                    }
                    status.append(index.toString(), json);
                }, function () { status.error(); });
            });

            return this.render();
        };

        comp.onMore = function (data) {
            Lampa.Activity.push({
                url: data.url,
                params: data.params,
                title: data.title,
                component: 'studios_view',
                page: 1
            });
        };

        return comp;
    }

    function StudiosView(object) {
        var comp = new Lampa.InteractionCategory(object);
        var network = new Lampa.Reguest();

        function buildUrl(page) {
            var params = [];
            params.push('api_key=' + getTmdbKey());
            params.push('language=' + Lampa.Storage.get('language', 'ru'));
            params.push('page=' + page);

            if (object.params) {
                for (var key in object.params) {
                    var val = object.params[key];
                    if (val === '{current_date}') {
                        var d = new Date();
                        val = [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2)].join('-');
                    }
                    params.push(key + '=' + val);
                }
            }
            return Lampa.TMDB.api(object.url + '?' + params.join('&'));
        }

        comp.create = function () {
            var _this = this;
            network.silent(buildUrl(1), function (json) {
                if (json && json.results && Array.isArray(json.results)) {
                    json.results.forEach(function (item) {
                        if (!item.poster_path && item.backdrop_path) {
                            item.poster_path = item.backdrop_path;
                        }
                    });
                }
                _this.build(json);
            }, this.empty.bind(this));
        };

        comp.nextPageReuest = function (object, resolve, reject) {
            network.silent(buildUrl(object.page), resolve, reject);
        };

        return comp;
    }

    // =================================================================
    // STUDIO ROW FOR MAIN PAGE
    // =================================================================
    function addStudioRow() {
        var studios = [
            { id: 'netflix', name: 'Netflix', svg: SERVICE_CONFIGS.netflix.icon, providerId: '8' },
            { id: 'disney', name: 'Disney+', svg: SERVICE_CONFIGS.disney.icon, providerId: '337' },
            { id: 'hbo', name: 'HBO / Max', svg: SERVICE_CONFIGS.hbo.icon, providerId: '384' },
            { id: 'apple', name: 'Apple TV+', svg: SERVICE_CONFIGS.apple.icon, providerId: '350' },
            { id: 'amazon', name: 'Prime Video', svg: SERVICE_CONFIGS.amazon.icon, providerId: '119' },
            { id: 'hulu', name: 'Hulu', svg: SERVICE_CONFIGS.hulu.icon, providerId: '15' },
            { id: 'paramount', name: 'Paramount+', svg: SERVICE_CONFIGS.paramount.icon, providerId: '531' },
            { id: 'sky_showtime', name: 'Sky Showtime', svg: SERVICE_CONFIGS.sky_showtime.icon },
            { id: 'syfy', name: 'Syfy', svg: SERVICE_CONFIGS.syfy.icon },
            { id: 'educational_and_reality', name: tr('educational_title'), svg: SERVICE_CONFIGS.educational_and_reality.icon }
        ];

        Lampa.ContentRows.add({
            index: 1,
            name: 'custom_studio_row',
            title: 'Стриминги',
            screen: ['main'],
            call: function (params) {
                return function (callback) {
                    var items = studios.map(function (s) {
                        return {
                            title: s.name,
                            params: {
                                createInstance: function () {
                                    var card = Lampa.Maker.make('Card', this, function (module) {
                                        return module.only('Card', 'Callback');
                                    });
                                    return card;
                                },
                                emit: {
                                    onFocus: function() {
                                        var serviceBGs = {
                                            'netflix': 'linear-gradient(135deg, #000000, #4c0000)',
                                            'disney': 'linear-gradient(135deg, #050f2c, #1a2f63)',
                                            'hbo': 'linear-gradient(135deg, #0f0c29, #302b63)',
                                            'apple': 'linear-gradient(135deg, #000000, #333333)',
                                            'amazon': 'linear-gradient(135deg, #0f1c29, #004d40)',
                                            'hulu': 'linear-gradient(135deg, #0b1a0e, #1ce783)',
                                            'paramount': 'linear-gradient(135deg, #003366, #0066cc)',
                                            'sky_showtime': 'linear-gradient(135deg, #1a1a2e, #e94560)',
                                            'syfy': 'linear-gradient(135deg, #1a0b2e, #6a1b9a)',
                                            'educational_and_reality': 'linear-gradient(135deg, #3e2723, #ff6f00)'
                                        };
                                        
                                        if (Lampa.Background && Lampa.Background.change) {
                                            if (serviceBGs[s.id]) {
                                                $('.background').css('background', serviceBGs[s.id]);
                                                $('.background__img').css('opacity', 0);
                                            } else {
                                                $('.background').css('background', '');
                                                $('.background__img').css('opacity', 1);
                                            }
                                        }
                                    },
                                    onHover: function() {
                                        var serviceBGs = {
                                            'netflix': 'linear-gradient(135deg, #000000, #4c0000)',
                                            'disney': 'linear-gradient(135deg, #050f2c, #1a2f63)',
                                            'hbo': 'linear-gradient(135deg, #0f0c29, #302b63)',
                                            'apple': 'linear-gradient(135deg, #000000, #333333)',
                                            'amazon': 'linear-gradient(135deg, #0f1c29, #004d40)',
                                            'hulu': 'linear-gradient(135deg, #0b1a0e, #1ce783)',
                                            'paramount': 'linear-gradient(135deg, #003366, #0066cc)',
                                            'sky_showtime': 'linear-gradient(135deg, #1a1a2e, #e94560)',
                                            'syfy': 'linear-gradient(135deg, #1a0b2e, #6a1b9a)',
                                            'educational_and_reality': 'linear-gradient(135deg, #3e2723, #ff6f00)'
                                        };
                                        
                                        if (Lampa.Background && Lampa.Background.change) {
                                            if (serviceBGs[s.id]) {
                                                $('.background').css('background', serviceBGs[s.id]);
                                                $('.background__img').css('opacity', 0);
                                            } else {
                                                $('.background').css('background', '');
                                                $('.background__img').css('opacity', 1);
                                            }
                                        }
                                    },
                                    onCreate: function () {
                                        var item = $(this.html);
                                        item.addClass('card--studio');
                                        var view = item.find('.card__view');
                                        view.empty();

                                        var wrapper = $('<div class="studio-logo-wrap"></div>');
                                        
                                        if (s.svg) {
                                            var svgEl = $(s.svg);
                                            svgEl.addClass('studio-logo-img');
                                            svgEl.css({
                                                'max-width': '70%',
                                                'max-height': '60%',
                                                'display': 'block'
                                            });
                                            wrapper.append(svgEl);
                                        } else {
                                            var fallback = $('<div class="studio-logo-fallback" style="display:block;"></div>').text(s.name);
                                            wrapper.append(fallback);
                                        }

                                        view.append(wrapper);
                                        item.find('.card__age, .card__year, .card__type, .card__textbox, .card__title').remove();
                                        item.attr('data-click-processed', '1');
                                    },
                                    onlyEnter: function () {
                                        Lampa.Activity.push({
                                            url: '',
                                            title: s.name,
                                            component: 'studios_main',
                                            service_id: s.id,
                                            page: 1
                                        });
                                    }
                                }
                            }
                        };
                    });

                    callback({
                        results: items,
                        title: '📺 Стриминги',
                        params: {
                            items: {
                                view: 15,
                                mapping: 'line'
                            }
                        }
                    });
                };
            }
        });
    }

    // =================================================================
    // APPLE TV FULL CARD STYLES
    // =================================================================
    function initAppleTvFullCard() {
        if (window.FLIXIO_APPLETV_BUILTIN) return;
        window.FLIXIO_APPLETV_BUILTIN = true;
        if (!Lampa.Template || !Lampa.Template.add) return;

        // Reactions HTML (уменьшенный размер, под рейтингом)
        var reactionsHtml = '<div class="full-start-new__reactions selector flixio-reactions" style="margin-top: 0.5em;">' +
            '<div>#{reactions_none}</div>' +
            '</div>';

        var fullStartNewHtml = `<div class="full-start-new applecation">\n` +
            `    <div class="full-start-new__body">\n` +
            `        <div class="full-start-new__left hide">\n` +
            `            <div class="full-start-new__poster">\n` +
            `                <img class="full-start-new__img full--poster" />\n` +
            `            </div>\n` +
            `        </div>\n` +
            `        <div class="full-start-new__right">\n` +
            `            <div class="applecation__left">\n` +
            `                <div class="applecation__logo"></div>\n` +
            `                <div class="applecation__content-wrapper">\n` +
            `                    <div class="full-start-new__title" style="display: none;">{title}</div>\n` +
            `                    <div class="applecation__meta">\n` +
            `                        <div class="applecation__meta-left">\n` +
            `                            <span class="applecation__network"></span>\n` +
            `                            <span class="applecation__meta-text"></span>\n` +
            `                            <div class="full-start__pg hide"></div>\n` +
            `                        </div>\n` +
            `                    </div>\n` +
            `                    <div class="full-start-new__rate-line applecation__ratings"></div>\n` +
            `                    ${reactionsHtml}\n` +
            `                    <div class="applecation__description-wrapper">\n` +
            `                        <div class="applecation__description"></div>\n` +
            `                    </div>\n` +
            `                    <div class="applecation__info"></div>\n` +
            `                </div>\n` +
            `                <div class="full-start-new__head" style="display: none;"></div>\n` +
            `                <div class="full-start-new__details" style="display: none;"></div>\n` +
            `                <div class="full-start-new__buttons">\n` +
            `                    <div class="full-start__button selector button--play">\n` +
            `                        <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">\n` +
            `                            <circle cx="14" cy="14.5" r="13" stroke="currentColor" stroke-width="2.7"/>\n` +
            `                            <path d="M18.0739 13.634C18.7406 14.0189 18.7406 14.9811 18.0739 15.366L11.751 19.0166C11.0843 19.4015 10.251 18.9204 10.251 18.1506L10.251 10.8494C10.251 10.0796 11.0843 9.5985 11.751 9.9834L18.0739 13.634Z" fill="currentColor"/>\n` +
            `                        </svg>\n` +
            `                        <span>#{title_watch}</span>\n` +
            `                    </div>\n` +
            `                    <div class="full-start__button selector button--book">\n` +
            `                        <svg width="21" height="32" viewBox="0 0 21 32" fill="none" xmlns="http://www.w3.org/2000/svg">\n` +
            `                            <path d="M2 1.5H19C19.2761 1.5 19.5 1.72386 19.5 2V27.9618C19.5 28.3756 19.0261 28.6103 18.697 28.3595L12.6212 23.7303C11.3682 22.7757 9.63183 22.7757 8.37885 23.7303L2.30302 28.3595C1.9739 28.6103 1.5 28.3756 1.5 27.9618V2C1.5 1.72386 1.72386 1.5 2 1.5Z" stroke="currentColor" stroke-width="2.5"/>\n` +
            `                        </svg>\n` +
            `                        <span>#{settings_input_links}</span>\n` +
            `                    </div>\n` +
            `                    <div class="full-start__button selector button--reaction">\n` +
            `                        <svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">\n` +
            `                            <path d="M37.208 10.9742C37.1364 10.8013 37.0314 10.6441 36.899 10.5117C36.7666 10.3794 36.6095 10.2744 36.4365 10.2028L12.0658 0.108375C11.7166 -0.0361828 11.3242 -0.0361227 10.9749 0.108542C10.6257 0.253206 10.3482 0.530634 10.2034 0.879836L0.108666 25.2507C0.0369593 25.4236 3.37953e-05 25.609 2.3187e-08 25.7962C-3.37489e-05 25.9834 0.0368249 26.1688 0.108469 26.3418C0.180114 26.5147 0.28514 26.6719 0.417545 26.8042C0.54995 26.9366 0.707139 27.0416 0.880127 27.1131L17.2452 33.8917C17.5945 34.0361 17.9869 34.0361 18.3362 33.8917L29.6574 29.2017C29.8304 29.1301 29.9875 29.0251 30.1199 28.8928C30.2523 28.7604 30.3573 28.6032 30.4289 28.4303L37.2078 12.065C37.2795 11.8921 37.3164 11.7068 37.3164 11.5196C37.3165 11.3325 37.2796 11.1471 37.208 10.9742ZM20.425 29.9407L21.8784 26.4316L25.3873 27.885L20.425 29.9407ZM28.3407 26.0222L21.6524 23.252C21.3031 23.1075 20.9107 23.1076 20.5615 23.2523C20.2123 23.3969 19.9348 23.6743 19.79 24.0235L17.0194 30.7123L3.28783 25.0247L12.2918 3.28773L34.0286 12.2912L28.3407 26.0222Z" fill="currentColor"/>\n` +
            `                            <path d="M25.3493 16.976L24.258 14.3423L16.959 17.3666L15.7196 14.375L13.0859 15.4659L15.4161 21.0916L25.3493 16.976Z" fill="currentColor"/>\n` +
            `                        </svg>\n` +
            `                        <span>#{title_reactions}</span>\n` +
            `                    </div>\n` +
            `                    <div class="full-start__button selector button--subscribe hide">\n` +
            `                        <svg width="25" height="30" viewBox="0 0 25 30" fill="none" xmlns="http://www.w3.org/2000/svg">\n` +
            `                            <path d="M6.01892 24C6.27423 27.3562 9.07836 30 12.5 30C15.9216 30 18.7257 27.3562 18.981 24H15.9645C15.7219 25.6961 14.2632 27 12.5 27C10.7367 27 9.27804 25.6961 9.03542 24H6.01892Z" fill="currentColor"/>\n` +
            `                            <path d="M3.81972 14.5957V10.2679C3.81972 5.41336 7.7181 1.5 12.5 1.5C17.2819 1.5 21.1803 5.41336 21.1803 10.2679V14.5957C21.1803 15.8462 21.5399 17.0709 22.2168 18.1213L23.0727 19.4494C24.2077 21.2106 22.9392 23.5 20.9098 23.5H4.09021C2.06084 23.5 0.792282 21.2106 1.9273 19.4494L2.78317 18.1213C3.46012 17.0709 3.81972 15.8462 3.81972 14.5957Z" stroke="currentColor" stroke-width="2.5"/>\n` +
            `                        </svg>\n` +
            `                        <span>#{title_subscribe}</span>\n` +
            `                    </div>\n` +
            `                    <div class="full-start__button selector button--options">\n` +
            `                        <svg width="38" height="10" viewBox="0 0 38 10" fill="none" xmlns="http://www.w3.org/2000/svg">\n` +
            `                            <circle cx="4.88968" cy="4.98563" r="4.75394" fill="currentColor"/>\n` +
            `                            <circle cx="18.9746" cy="4.98563" r="4.75394" fill="currentColor"/>\n` +
            `                            <circle cx="33.0596" cy="4.98563" r="4.75394" fill="currentColor"/>\n` +
            `                        </svg>\n` +
            `                    </div>\n` +
            `                </div>\n` +
            `            </div>\n` +
            `            <div class="applecation__right"></div>\n` +
            `        </div>\n` +
            `    </div>\n` +
            `</div>`;

        Lampa.Template.add('full_start_new', fullStartNewHtml);
        Lampa.Template.add('applecation_overlay', '\n            <div class="applecation-description-overlay">\n                <div class="applecation-description-overlay__bg"></div>\n                <div class="applecation-description-overlay__content selector">\n                    <div class="applecation-description-overlay__logo"></div>\n                    <div class="applecation-description-overlay__title">{title}</div>\n                    <div class="applecation-description-overlay__text">{text}</div>\n                    <div class="applecation-description-overlay__details">\n                        <div class="applecation-description-overlay__info">\n                            <div class="applecation-description-overlay__info-name">#{full_date_of_release}</div>\n                            <div class="applecation-description-overlay__info-body">{relise}</div>\n                        </div>\n                        <div class="applecation-description-overlay__info applecation--budget">\n                            <div class="applecation-description-overlay__info-name">#{full_budget}</div>\n                            <div class="applecation-description-overlay__info-body">{budget}</div>\n                        </div>\n                        <div class="applecation-description-overlay__info applecation--countries">\n                            <div class="applecation-description-overlay__info-name">#{full_countries}</div>\n                            <div class="applecation-description-overlay__info-body">{countries}</div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        ');

        // CSS стили для Apple TV
        if (!document.getElementById('flixio_applecation_css')) {
            var css = `
            <style id="flixio_applecation_css">
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
                .applecation__meta .full-start__pg { margin: 0 0 0 0.6em; padding: 0.2em 0.5em; font-size: 0.85em; border-radius: 0.3em; border: 2px solid rgba(255,255,255,0.45); }
                
                .applecation__ratings { display: flex; align-items: center; gap: 0.8em; margin-bottom: 0.3em; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; transition-delay: 0.08s; }
                .applecation__ratings.show { opacity: 1; transform: translateY(0); }
                .applecation__ratings .rate--imdb, .applecation__ratings .rate--kp { display: flex; align-items: center; gap: 0.35em; }
                .applecation__ratings svg { width: 1.6em; height: auto; flex-shrink: 0; color: rgba(255,255,255,0.85); }
                .applecation__ratings .rate--kp svg { width: 1.4em; }
                .applecation__ratings > div > div { font-size: 0.9em; font-weight: 600; line-height: 1; color: #fff; }
                
                .flixio-reactions { margin-top: 0.3em !important; transform: scale(0.85) !important; transform-origin: left top !important; }
                .flixio-reactions .reaction__icon { width: 2em !important; height: 2em !important; }
                .flixio-reactions .reaction__count { font-size: 0.9em !important; }
                
                .applecation__description-wrapper { background-color: transparent; padding: 0; border-radius: 1em; width: fit-content; opacity: 0; transform: translateY(15px); transition: padding 0.25s ease, transform 0.25s ease, opacity 0.4s ease-out; transition-delay: 0.1s; }
                .applecation__description-wrapper.show { opacity: 1; transform: translateY(0); }
                .applecation__description-wrapper.focus { background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.18)); padding: .15em .4em 0 .7em; border-radius: 1em; width: fit-content; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35); transform: scale(1.07) translateY(0); transition-delay: 0s; }
                
                .applecation__description { color: rgba(255,255,255,0.6); font-size: 0.95em; line-height: 1.5; margin-bottom: 0.5em; max-width: 35vw; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
                .focus .applecation__description { color: rgba(255,255,255,0.92); }
                
                .applecation__info { color: rgba(255,255,255,0.75); font-size: 1em; line-height: 1.4; margin-bottom: 0.5em; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; transition-delay: 0.15s; }
                .applecation__info.show { opacity: 1; transform: translateY(0); }
                .applecation__left { flex-grow: 1; }
                .applecation__right { display: flex; align-items: center; flex-shrink: 0; position: relative; }
                
                .full-start__background { height: calc(100% + 6em); left: 0 !important; opacity: 0 !important; transition: opacity 0.6s ease-out, filter 0.3s ease-out !important; animation: none !important; transform: none !important; will-change: opacity, filter; }
                .full-start__background.loaded:not(.dim) { opacity: 1 !important; }
                .full-start__background.dim { filter: blur(30px); }
                .full-start__background.loaded.applecation-animated { opacity: 1 !important; }
                
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
                
                @media screen and (max-width: 720px) {
                    .applecation .full-start-new__body { height: auto !important; min-height: 0 !important; }
                    .applecation .full-start-new__right { display: block !important; }
                    .applecation .applecation__right { display: none !important; }
                    .applecation .applecation__left { width: 100% !important; max-width: none !important; }
                    .applecation .applecation__content-wrapper { width: 100% !important; }
                    .applecation .applecation__description-wrapper { width: 100% !important; }
                    .applecation .applecation__description { max-width: none !important; width: 100% !important; }
                }
            </style>`;
            $('body').append(css);
        }
    }

    // =================================================================
    // APPLE TV FULL CARD RUNTIME FUNCTIONS
    // =================================================================
    function initAppleTvFullCardRuntime() {
        if (window.FLIXIO_APPLETV_RUNTIME) return;
        window.FLIXIO_APPLETV_RUNTIME = true;
        if (!Lampa.Listener || !Lampa.Listener.follow) return;

        function waitForBackground(render, callback) {
            var background = render.find('.full-start__background:not(.applecation__overlay)');
            if (!background.length) return callback();
            if (background.hasClass('loaded')) {
                return setTimeout(callback, 350);
            }
            var interval = setInterval(function () {
                if (!render.closest('body').length) {
                    clearInterval(interval);
                    return;
                }
                if (background.hasClass('loaded')) {
                    clearInterval(interval);
                    setTimeout(callback, 650);
                }
            }, 50);
            setTimeout(function () { clearInterval(interval); callback(); }, 2000);
        }

        function finalize(render) {
            render.find('.applecation__meta').addClass('show');
            render.find('.applecation__description-wrapper').addClass('show');
            render.find('.applecation__info').addClass('show');
            render.find('.applecation__ratings').addClass('show');
        }

        function loadLogo(render, movie) {
            var logo = render.find('.applecation__logo');
            var titleEl = render.find('.full-start-new__title');
            if (!logo.length) return;

            var done = false;
            var timer = setTimeout(function () {
                if (done) return;
                done = true;
                titleEl.show();
                logo.addClass('loaded');
                finalize(render);
            }, 2500);

            var type = movie && movie.name ? 'tv' : 'movie';
            var lang = Lampa.Storage.get('language') || 'ru';
            var url = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=' + lang);
            var urlAll = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key());

            function applyLogoFromData(data) {
                if (done) return;
                if (!render.closest('body').length) return;

                var filePath = (data && data.logos && data.logos[0] && data.logos[0].file_path) ? data.logos[0].file_path : null;

                if (filePath) {
                    var imgUrl = Lampa.TMDB.image('/t/p/w500' + filePath);
                    var img = new Image();
                    img.onload = function () {
                        if (done) return;
                        done = true;
                        clearTimeout(timer);
                        if (!render.closest('body').length) return;
                        logo.html('<img src="' + imgUrl + '" alt="" />');
                        waitForBackground(render, function () {
                            if (!render.closest('body').length) return;
                            logo.addClass('loaded');
                            finalize(render);
                        });
                        var overlay = $('.applecation-description-overlay');
                        if (overlay.length) {
                            overlay.find('.applecation-description-overlay__logo').html($('<img>').attr('src', imgUrl)).css('display', 'block');
                            overlay.find('.applecation-description-overlay__title').css('display', 'none');
                        }
                    };
                    img.onerror = function () {
                        if (done) return;
                        done = true;
                        clearTimeout(timer);
                        titleEl.show();
                        waitForBackground(render, function () {
                            if (!render.closest('body').length) return;
                            logo.addClass('loaded');
                            finalize(render);
                        });
                    };
                    img.src = imgUrl;
                } else {
                    done = true;
                    clearTimeout(timer);
                    titleEl.show();
                    waitForBackground(render, function () {
                        if (!render.closest('body').length) return;
                        logo.addClass('loaded');
                        finalize(render);
                    });
                }
            }

            $.get(url, function (data) {
                if (data && data.logos && data.logos.length) applyLogoFromData(data);
                else $.get(urlAll, function (dataAll) { applyLogoFromData(dataAll || data); }).fail(function () { applyLogoFromData(data); });
            }).fail(function () {
                if (done) return;
                done = true;
                clearTimeout(timer);
                titleEl.show();
                waitForBackground(render, function () {
                    if (!render.closest('body').length) return;
                    logo.addClass('loaded');
                    finalize(render);
                });
            });
        }

        function typeLabel(movie) {
            var isTv = !!movie.name;
            return isTv ? 'Сериал' : 'Фильм';
        }

        function fillMeta(render, movie) {
            var metaText = render.find('.applecation__meta-text');
            if (metaText.length) {
                var parts = [typeLabel(movie)];
                if (movie.genres && movie.genres.length) {
                    var g = movie.genres.slice(0, 2).map(function (x) { return Lampa.Utils.capitalizeFirstLetter(x.name); });
                    parts = parts.concat(g);
                }
                metaText.html(parts.join(' · '));
            }

            var networkNode = render.find('.applecation__network');
            if (networkNode.length) {
                if (movie.networks && movie.networks.length && movie.networks[0].logo_path) {
                    networkNode.html('<img src="' + Lampa.Api.img(movie.networks[0].logo_path, 'w200') + '" alt="' + movie.networks[0].name + '">');
                } else if (movie.production_companies && movie.production_companies.length && movie.production_companies[0].logo_path) {
                    networkNode.html('<img src="' + Lampa.Api.img(movie.production_companies[0].logo_path, 'w200') + '" alt="' + movie.production_companies[0].name + '">');
                } else {
                    networkNode.remove();
                }
            }
        }

        function fillDescription(render, movie) {
            var description = render.find('.applecation__description');
            if (description.length) description.text(movie.overview || '');

            var wrap = render.find('.applecation__description-wrapper');
            if (!wrap.length) return;

            wrap.off('hover:enter');
            $('.applecation-description-overlay').remove();

            var text = movie.overview || '';
            if (!text) return;

            var title = movie.title || movie.name;
            var dateStr = (movie.release_date || movie.first_air_date || '') + '';
            var rel = dateStr.length > 3 ? Lampa.Utils.parseTime(dateStr).full : (dateStr.length > 0 ? dateStr : Lampa.Lang.translate('player_unknown'));
            var budget = '$ ' + Lampa.Utils.numberWithSpaces(movie.budget || 0);
            var countries = (movie.production_countries ? movie.production_countries.map(function (c) {
                var key = 'country_' + c.iso_3166_1.toLowerCase();
                var t = Lampa.Lang.translate(key);
                return t !== key ? t : c.name;
            }) : []).join(', ');

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
            if (Lampa.Controller && Lampa.Controller.collectionAppend) Lampa.Controller.collectionAppend(wrap);

            wrap.on('hover:enter', function () {
                var el = $('.applecation-description-overlay');
                if (!el.length) return;
                setTimeout(function () { el.addClass('show'); }, 10);

                if (!el.data('controller-created') && Lampa.Controller) {
                    var ctrl = {
                        toggle: function () {
                            Lampa.Controller.collectionSet(el);
                            Lampa.Controller.collectionFocus(el.find('.applecation-description-overlay__content'), el);
                        },
                        back: function () {
                            var ol = $('.applecation-description-overlay');
                            if (!ol.length) return;
                            ol.removeClass('show');
                            setTimeout(function () { Lampa.Controller.toggle('content'); }, 300);
                        }
                    };
                    Lampa.Controller.add('applecation_description', ctrl);
                    el.data('controller-created', true);
                }
                if (Lampa.Controller) Lampa.Controller.toggle('applecation_description');
            });
        }

        function fillInfo(render, movie) {
            var info = render.find('.applecation__info');
            if (!info.length) return;

            var parts = [];
            var date = movie.release_date || movie.first_air_date || '';
            if (date) parts.push(date.split('-')[0]);

            if (movie.name) {
                if (movie.episode_run_time && movie.episode_run_time.length) {
                    var m = movie.episode_run_time[0];
                    var tm = Lampa.Lang.translate('time_m').replace('.', '');
                    parts.push(m + ' ' + tm);
                }
                var seasons = Lampa.Utils.countSeasons(movie);
                if (seasons) {
                    var t = [2, 0, 1, 1, 1, 2];
                    var forms = ['сезон', 'сезона', 'сезонов'];
                    var seasonText = seasons + ' ' + forms[seasons % 100 > 4 && seasons % 100 < 20 ? 2 : t[Math.min(seasons % 10, 5)]];
                    parts.push(seasonText);
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

        function insertOverlayBackground(render) {
            var bg = render.find('.full-start__background');
            if (bg.length && !bg.next('.applecation__overlay').length) {
                bg.after('<div class="full-start__background loaded applecation__overlay"></div>');
            }
        }

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var activity = e.object && e.object.activity;
            if (!activity || !activity.render) return;
            var render = activity.render();
            if (!render || !render.length) return;
            if (!render.find('.applecation__meta-text, .applecation__description, .applecation__info').length) return;

            var movie = e.data && e.data.movie;
            if (!movie) return;

            insertOverlayBackground(render);
            fillMeta(render, movie);
            fillDescription(render, movie);
            fillInfo(render, movie);
            loadLogo(render, movie);
        });
    }

    // =================================================================
    // SETTINGS
    // =================================================================
    function setupSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;

        Lampa.SettingsApi.addComponent({
            component: 'flixio_plugin',
            name: tr('settings_tab_title'),
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="1.5"/><path d="M8 8h8v2H8V8zm0 4h6v2H8v-2zm0 4h8v2H8v-2z" fill="white"/><circle cx="3" cy="3" r="1" fill="white" opacity="0.6"/><circle cx="21" cy="3" r="1" fill="white" opacity="0.6"/><circle cx="3" cy="21" r="1" fill="white" opacity="0.6"/><circle cx="21" cy="21" r="1" fill="white" opacity="0.6"/><circle cx="12" cy="1" r="1" fill="white" opacity="0.7"/><circle cx="12" cy="23" r="1" fill="white" opacity="0.7"/><circle cx="1" cy="12" r="1" fill="white" opacity="0.7"/><circle cx="23" cy="12" r="1" fill="white" opacity="0.7"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { type: 'title' },
            field: { name: 'API TMDB' }
        });

        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { name: 'flixio_tmdb_apikey', type: 'input', placeholder: tr('settings_tmdb_input_placeholder'), values: '', default: '' },
            field: { name: tr('settings_tmdb_input_name'), description: tr('settings_tmdb_input_desc') }
        });

        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { type: 'title' },
            field: { name: tr('settings_sections_title') }
        });

        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { name: 'flixio_section_streamings', type: 'trigger', default: true },
            field: { name: tr('settings_streamings_name'), description: tr('settings_streamings_desc') }
        });
    }

    // =================================================================
    // STYLES FOR STUDIO CARDS
    // =================================================================
    function addStyles() {
        $('#custom_main_page_css').remove();
        $('body').append(`
            <style id="custom_main_page_css">
                .card--studio {
                    width: 12em !important;
                    height: 6.75em !important;
                    padding: 0 !important;
                    background: #f5f7fa;
                    border-radius: 0.8em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.35);
                    border: 1px solid rgba(255,255,255,0.06);
                    transition: transform 0.18s ease-out, box-shadow 0.18s ease-out;
                }
                .card--studio.focus {
                    transform: scale(1.06);
                    box-shadow: 0 0 18px rgba(255,255,255,0.9);
                    z-index: 10;
                }
                .card--studio .card__view {
                    width: 100%;
                    height: 100%;
                    padding: 0.6em !important;
                    box-sizing: border-box !important;
                    display: block;
                    position: relative;
                }
                .studio-logo-wrap {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .studio-logo-img {
                    max-width: 70%;
                    max-height: 60%;
                    object-fit: contain;
                    display: block;
                }
                .flixio-more-btn {
                    width: 14em !important;
                    height: 21em !important;
                    border-radius: 0.8em;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s, background 0.2s;
                    order: 9999 !important;
                }
                .flixio-more-btn:hover, .flixio-more-btn.focus {
                    background: rgba(255,255,255,0.15);
                    transform: scale(1.05);
                    box-shadow: 0 0 0 3px #fff;
                }
                .flixio-more-btn > div {
                    text-align: center;
                }
                .items-line {
                    padding-bottom: 2em !important;
                }
            </style>
        `);
    }

    // =================================================================
    // INIT
    // =================================================================
    function init() {
        setupSettings();

        Lampa.Component.add('studios_main', StudiosMain);
        Lampa.Component.add('studios_view', StudiosView);

        addStyles();
        addStudioRow();

        initAppleTvFullCard();
        initAppleTvFullCardRuntime();
        initMaxsmRatingsIntegration();

        window.FLIXIO_STUDIOS_LOADED = true;
    }

    // =================================================================
    // MAXSM RATINGS INTEGRATION (оставлен полностью)
    // =================================================================
    function initMaxsmRatingsIntegration() {
        if (window.maxsmRatingsPlugin) return;
        if (typeof Lampa === 'undefined') return;

        function normalizeApiKeys(value) {
            if (!value) return [];
            if (Array.isArray(value)) return value.filter(function (v) { return !!v; });
            if (typeof value === 'string') return [value];
            return [];
        }

        var TOKENS = window.RATINGS_PLUGIN_TOKENS || {};
        var OMDB_API_KEYS = normalizeApiKeys(TOKENS.OMDB_API_KEYS || TOKENS.OMDB || TOKENS.OMDB_KEYS || TOKENS.OMDB_API_KEY || TOKENS.OMDB_KEY);
        var KP_API_KEYS = normalizeApiKeys(TOKENS.KP_API_KEYS || TOKENS.KP || TOKENS.KP_KEYS || TOKENS.KP_API_KEY || TOKENS.KP_KEY);
        if (!OMDB_API_KEYS.length) OMDB_API_KEYS = ['73ff4450'];
        if (!KP_API_KEYS.length) KP_API_KEYS = ['5178ab83-699c-4422-937e-f8a759f872ef'];

        var CACHE_TIME = 3 * 24 * 60 * 60 * 1000;
        var OMDB_CACHE = 'maxsm_ratings_omdb_cache';
        var KP_CACHE = 'maxsm_ratings_kp_cache';
        var ID_MAPPING_CACHE = 'maxsm_ratings_id_mapping_cache';

        var PROXY_TIMEOUT = 5000;
        var PROXY_LIST = ['https://cors.bwa.workers.dev/', 'https://api.allorigins.win/raw?url='];

        var AGE_RATINGS = {
            'G': '3+', 'PG': '6+', 'PG-13': '13+', 'R': '17+', 'NC-17': '18+',
            'TV-Y': '0+', 'TV-Y7': '7+', 'TV-G': '3+', 'TV-PG': '6+', 'TV-14': '14+', 'TV-MA': '17+'
        };

        var WEIGHTS = { imdb: 0.35, tmdb: 0.15, kp: 0.20, mc: 0.15, rt: 0.15 };

        var star_svg = '<svg viewBox="5 5 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="white" stroke-width="2" d="M32 18.7461L36.2922 27.4159L46.2682 28.6834L38.9675 35.3631L40.7895 44.8469L32 40.2489L23.2105 44.8469L25.0325 35.3631L17.7318 28.6834L27.7078 27.4159L32 18.7461ZM32 23.2539L29.0241 29.2648L22.2682 30.1231L27.2075 34.6424L25.9567 41.1531L32 37.9918L38.0433 41.1531L36.7925 34.6424L41.7318 30.1231L34.9759 29.2648L32 23.2539Z"/><path fill="none" stroke="white" stroke-width="2" d="M32 9C19.2975 9 9 19.2975 9 32C9 44.7025 19.2975 55 32 55C44.7025 55 55 44.7025 55 32C55 19.2975 44.7025 9 32 9ZM7 32C7 18.1929 18.1929 7 32 7C45.8071 7 57 18.1929 57 32C57 45.8071 45.8071 57 32 57C18.1929 57 7 45.8071 7 32Z"/></svg>';
        var avg_svg = '<svg width="64" height="64" viewBox="10 10 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.4517 11.3659C31.8429 10.7366 32.7589 10.7366 33.1501 11.3659L40.2946 22.8568C40.4323 23.0782 40.651 23.2371 40.9041 23.2996L54.0403 26.5435C54.7598 26.7212 55.0428 27.5923 54.5652 28.1589L45.8445 38.5045C45.6764 38.7039 45.5929 38.961 45.6117 39.221L46.5858 52.7168C46.6392 53.4559 45.8982 53.9942 45.2117 53.7151L32.6776 48.6182C32.4361 48.52 32.1657 48.52 31.9242 48.6182L19.39 53.7151C18.7036 53.9942 17.9626 53.4559 18.016 52.7168L18.9901 39.221C19.0089 38.961 18.9253 38.7039 18.7573 38.5045L10.0366 28.1589C9.559 27.5923 9.84204 26.7212 10.5615 26.5435L23.6977 23.2996C23.9508 23.2371 24.1695 23.0782 24.3072 22.8568L31.4517 11.3659Z" fill="#FFDF6D"/></svg>';
        var tmdb_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150"><defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#90cea1"/><stop offset="56%" stop-color="#3cbec9"/><stop offset="100%" stop-color="#00b3e5"/></linearGradient><style>.text-style{font-weight:bold;fill:url(#grad);text-anchor:start;dominant-baseline:middle;textLength:150;lengthAdjust:spacingAndGlyphs;font-size:70px;}</style></defs><text class="text-style" x="0" y="50" textLength="150" lengthAdjust="spacingAndGlyphs">TM</text><text class="text-style" x="0" y="120" textLength="150" lengthAdjust="spacingAndGlyphs">DB</text></svg>';
        var imdb_svg = '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88" xml:space="preserve"><style type="text/css"><![CDATA[.st0{fill:#F5C518;}]]></style><g><path class="st0" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43 C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0L18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96L24.96,78.72z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8 l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36L45.36,44.16z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56 c0,3.36-2.64,6-6.24,6H61.44L61.44,78.72z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32 V54.24v-2.88L72.72,50.4L72.72,50.4L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6l-0.72,0 c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8L100.56,52.8z M98.64,69.6v-8.16 L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72 c0.48,0,1.44-0.24,1.44-0.72L98.64,69.6L98.64,69.6z"/></g></svg>';
        var kp_svg = '<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_1_69" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="300"><circle cx="150" cy="150" r="150" fill="white"/></mask><g mask="url(#mask0_1_69)"><circle cx="150" cy="150" r="150" fill="black"/><path d="M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z" fill="url(#paint0_radial_1_69)"/></g><defs><radialGradient id="paint0_radial_1_69" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(89.9999 45) rotate(45) scale(296.985)"><stop offset="0.5" stop-color="#FF5500"/><stop offset="1" stop-color="#BBFF00"/></radialGradient></defs></svg>';
        var rt_svg = '<svg xmlns="http://www.w3.org/2000/svg" height="141.25" viewBox="0 0 138.75 141.25" width="138.75"><g fill="#f93208"><path d="m20.154 40.829c-28.149 27.622-13.657 61.011-5.734 71.931 35.254 41.954 92.792 25.339 111.89-5.9071 4.7608-8.2027 22.554-53.467-23.976-78.009z"/><path d="m39.613 39.265 4.7778-8.8607 28.406-5.0384 11.119 9.2082z"/></g><g><path d="m39.436 8.5696 8.9682-5.2826 6.7569 15.479c3.7925-6.3226 13.79-16.316 24.939-4.6684-4.7281 1.2636-7.5161 3.8553-7.7397 8.4768 15.145-4.1697 31.343 3.2127 33.539 9.0911-10.951-4.314-27.695 10.377-41.771 2.334 0.009 15.045-12.617 16.636-19.902 17.076 2.077-4.996 5.591-9.994 1.474-14.987-7.618 8.171-13.874 10.668-33.17 4.668 4.876-1.679 14.843-11.39 24.448-11.425-6.775-2.467-12.29-2.087-17.814-1.475 2.917-3.961 12.149-15.197 28.625-8.476z" fill="#02902e"/></g></svg>';
        var mc_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><circle fill="#001B36" stroke="#FC0" stroke-width="4.6" cx="44" cy="44" r="41.6"/></svg>';
        var awards_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path fill="#FFD700" d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.8L12 15.8 6.4 19.6l2.1-6.8L3 8.8h6.8z"/></svg>';

        if (Lampa.Lang && Lampa.Lang.add) {
            Lampa.Lang.add({
                maxsm_ratings: { ru: 'Рейтинг и качество' },
                maxsm_ratings_cc: { ru: 'Очистить локальный кеш' },
                maxsm_ratings_critic: { ru: 'Оценки критиков' },
                maxsm_ratings_mode: { ru: 'Средний рейтинг' },
                maxsm_ratings_mode_normal: { ru: 'Показывать средний рейтинг' },
                maxsm_ratings_mode_simple: { ru: 'Только средний рейтинг' },
                maxsm_ratings_mode_noavg: { ru: 'Без среднего рейтинга' },
                maxsm_ratings_icons: { ru: 'Значки' },
                maxsm_ratings_colors: { ru: 'Цвета' },
                maxsm_ratings_avg: { ru: 'ИТОГ' },
                maxsm_ratings_avg_simple: { ru: 'Оценка' },
                maxsm_ratings_loading: { ru: 'Загрузка' },
                maxsm_ratings_oscars: { ru: 'Оскар' },
                maxsm_ratings_emmy: { ru: 'Эмми' },
                maxsm_ratings_awards: { ru: 'Награды' },
                maxsm_ratings_show_total: { ru: 'Итог' },
                maxsm_ratings_show_oscars: { ru: 'Оскар' },
                maxsm_ratings_show_awards: { ru: 'Награды' },
                maxsm_ratings_show_tmdb: { ru: 'TMDB' },
                maxsm_ratings_show_imdb: { ru: 'IMDB' },
                maxsm_ratings_show_kp: { ru: 'Кинопоиск' },
                maxsm_ratings_show_rt: { ru: 'Tomatoes' },
                maxsm_ratings_show_mc: { ru: 'Metacritic' },
                maxsm_ratings_quality: { ru: 'Качество внутри карточек' },
                maxsm_ratings_quality_inlist: { ru: 'Качество на карточках' },
                maxsm_ratings_quality_tv: { ru: 'Качество для сериалов' }
            });
        }

        if (!document.getElementById('maxsm_ratings_css')) {
            var style = document.createElement('style');
            style.id = 'maxsm_ratings_css';
            style.textContent = '.full-start-new__rate-line{display:flex;flex-wrap:wrap;column-gap:.22em;row-gap:.22em}.full-start-new__rate-line>*{margin:0!important}.full-start-new__rate-line .full-start__rate{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;gap:.28em!important;margin:0!important;width:auto!important}.full-start-new__rate-line .full-start__rate.hide{display:none!important}.full-start-new__rate-line .full-start__rate>div{margin:0!important}.full-start__rate>div:last-child{padding:.2em .35em}.rate--green{color:#4caf50}.rate--lime{color:#cddc39}.rate--orange{color:#ff9800}.rate--red{color:#f44336}.rate--gold{color:gold}.rate--icon{height:1.8em}.maxsm-quality{min-width:2.8em;text-align:center}.maxsm-icon-container{display:inline-flex;align-items:center;justify-content:center;height:1.6em;width:1.6em;overflow:hidden;vertical-align:middle;padding:0}.maxsm-icon-container svg{width:100%;height:100%;object-fit:contain}.full-start-new__rate-line .source--name{display:inline-flex;align-items:center;justify-content:center;min-width:2.2em}.full-start-new__rate-line .source--name.rate--icon{min-width:2.2em}.applecation__ratings:not(.full-start-new__rate-line){display:none!important}.applecation .full-start-new__rate-line.applecation__ratings{height:auto!important;overflow:visible!important;opacity:1!important;pointer-events:auto!important;margin:0 0 .3em 0!important}';
            document.head.appendChild(style);
        }

        if (!localStorage.getItem('maxsm_ratings_awards')) localStorage.setItem('maxsm_ratings_awards', 'true');
        if (!localStorage.getItem('maxsm_ratings_critic')) localStorage.setItem('maxsm_ratings_critic', 'true');
        if (!localStorage.getItem('maxsm_ratings_colors')) localStorage.setItem('maxsm_ratings_colors', 'false');
        if (!localStorage.getItem('maxsm_ratings_icons')) localStorage.setItem('maxsm_ratings_icons', 'false');
        if (!localStorage.getItem('maxsm_ratings_mode')) localStorage.setItem('maxsm_ratings_mode', '0');
        if (!localStorage.getItem('maxsm_ratings_show_total')) localStorage.setItem('maxsm_ratings_show_total', 'true');
        if (!localStorage.getItem('maxsm_ratings_show_oscars')) localStorage.setItem('maxsm_ratings_show_oscars', 'true');
        if (!localStorage.getItem('maxsm_ratings_show_awards')) localStorage.setItem('maxsm_ratings_show_awards', 'true');
        if (!localStorage.getItem('maxsm_ratings_show_tmdb')) localStorage.setItem('maxsm_ratings_show_tmdb', 'true');
        if (!localStorage.getItem('maxsm_ratings_show_imdb')) localStorage.setItem('maxsm_ratings_show_imdb', 'true');
        if (!localStorage.getItem('maxsm_ratings_show_kp')) localStorage.setItem('maxsm_ratings_show_kp', 'true');
        if (!localStorage.getItem('maxsm_ratings_show_rt')) localStorage.setItem('maxsm_ratings_show_rt', 'true');
        if (!localStorage.getItem('maxsm_ratings_show_mc')) localStorage.setItem('maxsm_ratings_show_mc', 'true');

        function getRandomToken(arr) { return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''; }

        function getRatingClass(rating) {
            var r = parseFloat(rating);
            if (r >= 8.5) return 'rate--green';
            if (r >= 7.0) return 'rate--lime';
            if (r >= 5.0) return 'rate--orange';
            return 'rate--red';
        }

        function getCardType(card) {
            var type = card.media_type || card.type;
            if (type === 'movie' || type === 'tv') return type;
            return (card.name || card.original_name) ? 'tv' : 'movie';
        }

        function parseAwards(awardsText) {
            if (typeof awardsText !== 'string') return { oscars: 0, emmy: 0, awards: 0 };
            var result = { oscars: 0, emmy: 0, awards: 0 };
            var oscarMatch = awardsText.match(/Won (\d+) Oscars?/i);
            if (oscarMatch && oscarMatch[1]) result.oscars = parseInt(oscarMatch[1], 10);
            var emmyMatch = awardsText.match(/Won (\d+) Primetime Emmys?/i);
            if (emmyMatch && emmyMatch[1]) result.emmy = parseInt(emmyMatch[1], 10);
            var otherMatch = awardsText.match(/Another (\d+) wins?/i);
            if (otherMatch && otherMatch[1]) result.awards = parseInt(otherMatch[1], 10);
            if (result.awards === 0) {
                var simpleMatch = awardsText.match(/(\d+) wins?/i);
                if (simpleMatch && simpleMatch[1]) result.awards = parseInt(simpleMatch[1], 10);
            }
            return result;
        }

        function extractRating(ratings, source) {
            if (!ratings || !Array.isArray(ratings)) return null;
            for (var i = 0; i < ratings.length; i++) {
                if (ratings[i].Source === source) {
                    try {
                        return source === 'Rotten Tomatoes' ? parseFloat(ratings[i].Value.replace('%', '')) : parseFloat(ratings[i].Value.split('/')[0]);
                    } catch (e) { return null; }
                }
            }
            return null;
        }

        function getOmdbCache(key) {
            var cache = Lampa.Storage.get(OMDB_CACHE) || {};
            var item = cache[key];
            return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null;
        }

        function saveOmdbCache(key, data) {
            var cache = Lampa.Storage.get(OMDB_CACHE) || {};
            cache[key] = { rt: data.rt, mc: data.mc, imdb: data.imdb, ageRating: data.ageRating, oscars: data.oscars, emmy: data.emmy, awards: data.awards, timestamp: Date.now() };
            Lampa.Storage.set(OMDB_CACHE, cache);
        }

        function getKpCache(key) {
            var cache = Lampa.Storage.get(KP_CACHE) || {};
            var item = cache[key];
            return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null;
        }

        function saveKpCache(key, data) {
            var cache = Lampa.Storage.get(KP_CACHE) || {};
            cache[key] = { kp: data.kp || null, imdb: data.imdb || null, timestamp: Date.now() };
            Lampa.Storage.set(KP_CACHE, cache);
        }

        function getImdbIdFromTmdb(tmdbId, cardType, localCurrentCard, callback) {
            var cleanType = cardType === 'tv' ? 'tv' : 'movie';
            var cacheKey = cleanType + '_' + tmdbId;
            var cache = Lampa.Storage.get(ID_MAPPING_CACHE) || {};
            if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TIME)) return callback(cache[cacheKey].imdb_id);

            var mainUrl = Lampa.TMDB.api(cleanType + '/' + tmdbId + '/external_ids?api_key=' + Lampa.TMDB.key());
            new Lampa.Reguest().silent(mainUrl, function (data) {
                if (data && data.imdb_id) {
                    cache[cacheKey] = { imdb_id: data.imdb_id, timestamp: Date.now() };
                    Lampa.Storage.set(ID_MAPPING_CACHE, cache);
                    callback(data.imdb_id);
                } else callback(null);
            }, function () { callback(null); });
        }

        function fetchOmdbRatings(card, localCurrentCard, callback) {
            if (!card.imdb_id) return callback(null);
            var url = 'https://www.omdbapi.com/?apikey=' + getRandomToken(OMDB_API_KEYS) + '&i=' + card.imdb_id;
            new Lampa.Reguest().silent(url, function (data) {
                if (data && data.Response === 'True') {
                    var parsedAwards = parseAwards(data.Awards || '');
                    callback({
                        rt: extractRating(data.Ratings, 'Rotten Tomatoes'),
                        mc: extractRating(data.Ratings, 'Metacritic'),
                        imdb: data.imdbRating || null,
                        ageRating: data.Rated || null,
                        oscars: parsedAwards.oscars,
                        emmy: parsedAwards.emmy,
                        awards: parsedAwards.awards
                    });
                } else callback(null);
            }, function () { callback(null); });
        }

        function getKPRatings(normalizedCard, apiKey, localCurrentCard, callback) {
            if (normalizedCard.kinopoisk_id) return fetchRatings(normalizedCard.kinopoisk_id, localCurrentCard);

            var queryTitle = (normalizedCard.original_title || normalizedCard.title || '').replace(/[:\\-–—]/g, ' ').trim();
            var year = normalizedCard.release_date && typeof normalizedCard.release_date === 'string' ? normalizedCard.release_date.split('-')[0] : '';
            if (!year) { callback(null); return; }

            var encodedTitle = encodeURIComponent(queryTitle);
            var searchUrl = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodedTitle;

            fetch(searchUrl, { headers: { 'X-API-KEY': apiKey } })
                .then(function (response) { return response.ok ? response.json() : null; })
                .then(function (data) {
                    if (!data || !data.films || !data.films.length) { callback(null); return; }
                    var bestMatch = null;
                    var targetYear = parseInt(year, 10);
                    for (var j = 0; j < data.films.length; j++) {
                        var film = data.films[j];
                        if (!film.year) continue;
                        var filmYear = parseInt(String(film.year).substring(0, 4), 10);
                        if (isNaN(filmYear)) continue;
                        if (filmYear === targetYear) { bestMatch = film; break; }
                    }
                    if (!bestMatch) {
                        for (var k = 0; k < data.films.length; k++) {
                            var film2 = data.films[k];
                            if (!film2.year) continue;
                            var filmYear2 = parseInt(String(film2.year).substring(0, 4), 10);
                            if (isNaN(filmYear2)) continue;
                            if (Math.abs(filmYear2 - targetYear) <= 1) { bestMatch = film2; break; }
                        }
                    }
                    if (!bestMatch || !bestMatch.filmId) { callback(null); return; }
                    fetchRatings(bestMatch.filmId, localCurrentCard);
                })
                .catch(function () { callback(null); });

            function fetchRatings(filmId, localCurrentCard) {
                fetch('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + filmId, { headers: { 'X-API-KEY': apiKey } })
                    .then(function (response) { return response.ok ? response.json() : null; })
                    .then(function (data) { callback({ kinopoisk: data.ratingKinopoisk || null, imdb: data.ratingImdb || null }); })
                    .catch(function () { callback(null); });
            }
        }

        function fetchAdditionalRatings(card, render) {
            if (!render || !card || !card.id) return;
            var localCurrentCard = card.id;

            var normalizedCard = {
                id: card.id, tmdb: card.vote_average || null, kinopoisk_id: card.kinopoisk_id,
                imdb_id: card.imdb_id || card.imdb || null, title: card.title || card.name || '',
                original_title: card.original_title || card.original_name || '',
                type: getCardType(card), release_date: card.release_date || card.first_air_date || ''
            };

            var rateLine = $('.full-start-new__rate-line.applecation__ratings', render);
            if (!rateLine.length) {
                var insertPoint = $('.applecation__meta', render);
                if (!insertPoint.length) insertPoint = $('.full-start-new__title', render);
                if (!insertPoint.length) insertPoint = $(render);

                rateLine = $('<div class="full-start-new__rate-line applecation__ratings show"></div>');
                rateLine.append('<div class="full-start__rate rate--tmdb"><div></div><div class="source--name">TMDB</div></div>');
                rateLine.append('<div class="full-start__rate rate--imdb hide"><div></div><div class="source--name">IMDb</div></div>');
                rateLine.append('<div class="full-start__rate rate--kp hide"><div></div><div class="source--name">Кинопоиск</div></div>');
                rateLine.append('<div class="full-start__status hide"></div>');
                rateLine.insertAfter(insertPoint);
            }

            if (rateLine.length) {
                var tmdbEl = $('.rate--tmdb', render);
                if (tmdbEl.length && normalizedCard.tmdb && !isNaN(normalizedCard.tmdb)) {
                    tmdbEl.removeClass('hide').find('> div').eq(0).text(parseFloat(normalizedCard.tmdb).toFixed(1));
                }
                rateLine.addClass('done');
            }

            var cacheKey = normalizedCard.type + '_' + (normalizedCard.imdb_id || normalizedCard.id);
            var cachedData = getOmdbCache(cacheKey);
            var cachedKpData = getKpCache(cacheKey);
            var ratingsData = { tmdb: normalizedCard.tmdb };

            if (cachedKpData) { ratingsData.kp = cachedKpData.kp; ratingsData.imdb_kp = cachedKpData.imdb; }
            if (cachedData) {
                ratingsData.rt = cachedData.rt; ratingsData.mc = cachedData.mc; ratingsData.imdb = cachedData.imdb;
                ratingsData.ageRating = cachedData.ageRating; ratingsData.oscars = cachedData.oscars;
                ratingsData.emmy = cachedData.emmy; ratingsData.awards = cachedData.awards;
            }

            function renderNow() {
                try { render.data('maxsm_ratings_data', ratingsData); } catch (e) { }
                // Insert ratings
                var rateLineDiv = $('.full-start-new__rate-line.applecation__ratings', render);
                $('.rate--rt, .rate--mc, .rate--awards, .rate--oscars, .rate--avg', rateLineDiv).remove();

                var showRT = localStorage.getItem('maxsm_ratings_show_rt') !== 'false';
                var showMC = localStorage.getItem('maxsm_ratings_show_mc') !== 'false';
                var showAwards = localStorage.getItem('maxsm_ratings_show_awards') !== 'false';
                var showOscar = localStorage.getItem('maxsm_ratings_show_oscars') !== 'false';

                function upsertNumberRate(className, value, label, opts) {
                    var existing = $('.' + className, rateLineDiv);
                    var enabled = opts && opts.enabled;
                    var okValue = value != null && value !== '' && !isNaN(value) && (!opts || !opts.min || value >= opts.min);
                    if (!enabled || !okValue) { if (existing.length) existing.remove(); return; }
                    if (!existing.length) {
                        var el = $('<div class="full-start__rate ' + className + '"><div></div><div class="source--name"></div></div>');
                        if (opts && opts.gold) el.addClass('rate--gold');
                        el.find('> div').eq(1).text(label);
                        rateLineDiv.append(el);
                        existing = el;
                    }
                    existing.find('> div').eq(0).text(value);
                }

                upsertNumberRate('rate--rt', ratingsData.rt, 'Tomatoes', { enabled: showRT });
                upsertNumberRate('rate--mc', ratingsData.mc, 'Metacritic', { enabled: showMC });
                upsertNumberRate('rate--awards', ratingsData.awards, 'Награды', { enabled: showAwards, gold: true, min: 1 });
                upsertNumberRate('rate--oscars', ratingsData.oscars, 'Оскар', { enabled: showOscar, gold: true, min: 1 });

                // Update hidden elements
                var pgElement = $('.full-start__pg.hide', render);
                if (pgElement.length && ratingsData.ageRating) {
                    var invalidRatings = ['N/A', 'Not Rated', 'Unrated', 'NR'];
                    if (invalidRatings.indexOf(ratingsData.ageRating) === -1) {
                        var localizedRating = AGE_RATINGS[ratingsData.ageRating] || ratingsData.ageRating;
                        pgElement.removeClass('hide').text(localizedRating);
                    }
                }

                function setRateVisible(selector, value) {
                    var el = $(selector, render);
                    if (!el.length) return;
                    var ok = value != null && value !== '' && !isNaN(value);
                    if (ok) el.removeClass('hide').find('> div').eq(0).text(parseFloat(value).toFixed(1));
                    else el.addClass('hide');
                }

                var imdbValue = ratingsData.imdb || ratingsData.imdb_kp || null;
                var showImdb = localStorage.getItem('maxsm_ratings_show_imdb') !== 'false';
                var showKp = localStorage.getItem('maxsm_ratings_show_kp') !== 'false';
                var showTmdb = localStorage.getItem('maxsm_ratings_show_tmdb') !== 'false';
                setRateVisible('.rate--imdb', showImdb ? imdbValue : null);
                setRateVisible('.rate--kp', showKp ? ratingsData.kp : null);
                setRateVisible('.rate--tmdb', showTmdb ? ratingsData.tmdb : null);

                // Average rating
                var mode = parseInt(localStorage.getItem('maxsm_ratings_mode'), 10);
                var showTotal = localStorage.getItem('maxsm_ratings_show_total') !== 'false';
                if (showTotal && mode !== 2) {
                    var weights = { imdb: 0.35, tmdb: 0.15, kp: 0.20, mc: 0.15, rt: 0.15 };
                    var totalWeight = 0, weightedSum = 0, ratingsCount = 0;
                    var rImdb = imdbValue && !isNaN(imdbValue) ? imdbValue : 0;
                    var rTmdb = ratingsData.tmdb && !isNaN(ratingsData.tmdb) ? ratingsData.tmdb : 0;
                    var rKp = ratingsData.kp && !isNaN(ratingsData.kp) ? ratingsData.kp : 0;
                    var rMc = ratingsData.mc && !isNaN(ratingsData.mc) ? ratingsData.mc / 10 : 0;
                    var rRt = ratingsData.rt && !isNaN(ratingsData.rt) ? ratingsData.rt / 10 : 0;
                    var allRatings = { imdb: rImdb, tmdb: rTmdb, kp: rKp, mc: rMc, rt: rRt };
                    for (var key in allRatings) if (allRatings[key] > 0) { weightedSum += allRatings[key] * weights[key]; totalWeight += weights[key]; ratingsCount++; }
                    if (totalWeight > 0 && (ratingsCount > 1 || mode === 1)) {
                        var avg = (weightedSum / totalWeight).toFixed(1);
                        var avgLabel = mode === 1 ? 'Оценка' : 'ИТОГ';
                        var avgElement = $('<div class="full-start__rate rate--avg ' + getRatingClass(avg) + '"><div>' + avg + '</div><div class="source--name">' + avgLabel + '</div></div>');
                        if (localStorage.getItem('maxsm_ratings_colors') !== 'true') avgElement.removeClass(getRatingClass(avg));
                        rateLineDiv.append(avgElement);
                    }
                }

                // Icons
                var showIcons = localStorage.getItem('maxsm_ratings_icons') === 'true';
                function isNumericText(txt) { if (!txt) return false; var n = parseFloat(String(txt).trim().replace(',', '.')); return !isNaN(n) && isFinite(n); }
                function applyIcon(className, svg) {
                    var Element = $('.' + className, render);
                    if (!Element.length) return;
                    Element.find('.maxsm-icon-container').remove();
                    if (showIcons) {
                        var target = Element.find('.source--name');
                        if (!target.length) {
                            var childDivs = Element.children('div');
                            if (childDivs.length >= 2) {
                                var t0 = childDivs.eq(0).text().trim();
                                var t1 = childDivs.eq(1).text().trim();
                                if (isNumericText(t0) && !isNumericText(t1)) target = childDivs.eq(1);
                                else if (isNumericText(t1) && !isNumericText(t0)) target = childDivs.eq(0);
                                else target = childDivs.eq(1);
                            }
                        }
                        if (target.length) {
                            var iconWrap = $('<div class="maxsm-icon-container"></div>').html(svg);
                            if (!target.data('original-html')) target.data('original-html', target.html());
                            target.html(iconWrap).addClass('rate--icon');
                        }
                    } else {
                        var t = Element.find('.rate--icon');
                        if (t.length && t.data('original-html')) { t.html(t.data('original-html')).removeClass('rate--icon').removeData('original-html'); }
                    }
                }
                applyIcon('rate--imdb', imdb_svg);
                applyIcon('rate--kp', kp_svg);
                applyIcon('rate--tmdb', tmdb_svg);
                applyIcon('rate--oscars', awards_svg);
                applyIcon('rate--awards', awards_svg);
                applyIcon('rate--rt', rt_svg);
                applyIcon('rate--mc', mc_svg);
                applyIcon('rate--avg', avg_svg);

                // Reorder
                var order = ['rate--tmdb', 'rate--imdb', 'rate--kp', 'rate--rt', 'rate--mc', 'rate--oscars', 'rate--awards', 'rate--avg'];
                for (var i = 0; i < order.length; i++) {
                    var el = rateLineDiv.find('.' + order[i]).first();
                    if (el.length) rateLineDiv.append(el.detach());
                }
                var status = rateLineDiv.find('.full-start__status').detach();
                if (status.length) rateLineDiv.append(status);
            }

            renderNow();

            var pending = 0;
            function startPending() { pending++; }
            function endPending() { pending = Math.max(0, pending - 1); if (pending === 0) renderNow(); }

            if (!cachedKpData) {
                startPending();
                getKPRatings(normalizedCard, getRandomToken(KP_API_KEYS), localCurrentCard, function (kpRatings) {
                    if (kpRatings) { ratingsData.kp = kpRatings.kinopoisk || null; ratingsData.imdb_kp = kpRatings.imdb || null; saveKpCache(cacheKey, { kp: ratingsData.kp, imdb: ratingsData.imdb_kp }); }
                    renderNow(); endPending();
                });
            }

            if (!cachedData) {
                startPending();
                if (normalizedCard.imdb_id) {
                    fetchOmdbRatings(normalizedCard, localCurrentCard, function (omdbData) {
                        if (omdbData) {
                            ratingsData.rt = omdbData.rt; ratingsData.mc = omdbData.mc; ratingsData.imdb = omdbData.imdb;
                            ratingsData.ageRating = omdbData.ageRating; ratingsData.oscars = omdbData.oscars;
                            ratingsData.emmy = omdbData.emmy; ratingsData.awards = omdbData.awards;
                            saveOmdbCache(cacheKey, omdbData);
                        }
                        renderNow(); endPending();
                    });
                } else {
                    getImdbIdFromTmdb(normalizedCard.id, normalizedCard.type, localCurrentCard, function (newImdbId) {
                        if (newImdbId) {
                            normalizedCard.imdb_id = newImdbId;
                            cacheKey = normalizedCard.type + '_' + newImdbId;
                            fetchOmdbRatings(normalizedCard, localCurrentCard, function (omdbData) {
                                if (omdbData) {
                                    ratingsData.rt = omdbData.rt; ratingsData.mc = omdbData.mc; ratingsData.imdb = omdbData.imdb;
                                    ratingsData.ageRating = omdbData.ageRating; ratingsData.oscars = omdbData.oscars;
                                    ratingsData.emmy = omdbData.emmy; ratingsData.awards = omdbData.awards;
                                    saveOmdbCache(cacheKey, omdbData);
                                }
                                renderNow(); endPending();
                            });
                        } else { renderNow(); endPending(); }
                    });
                }
            }

            if (pending === 0) renderNow();

            $('.full-start__rate', render).off('click.maxsm-ratings-modal').on('click.maxsm-ratings-modal', function (e) {
                e.stopPropagation();
                var modalContent = $('<div class="maxsm-modal-ratings"></div>');
                var showColors = localStorage.getItem('maxsm_ratings_colors') === 'true';
                var rateLineDiv = $('.full-start-new__rate-line', render);
                function isNumericTextModal(txt) { if (!txt) return false; var n = parseFloat(String(txt).trim().replace(',', '.')); return !isNaN(n) && isFinite(n); }
                function extractValue(element) {
                    if (!element || !element.length) return '';
                    var divs = element.children('div');
                    for (var i = 0; i < divs.length; i++) { var t = divs.eq(i).text().trim(); if (isNumericTextModal(t)) return t; }
                    return '';
                }
                var ratingOrder = ['rate--tmdb', 'rate--imdb', 'rate--kp', 'rate--rt', 'rate--mc', 'rate--oscars', 'rate--awards', 'rate--avg'];
                for (var i = 0; i < ratingOrder.length; i++) {
                    var className = ratingOrder[i];
                    var element = $('.' + className, rateLineDiv);
                    if (!element.length || element.hasClass('hide') || !element.is(':visible')) continue;
                    var value = extractValue(element);
                    if (!value) continue;
                    var label = '';
                    switch (className) {
                        case 'rate--avg': label = 'Средний рейтинг'; break;
                        case 'rate--oscars': label = 'Оскар'; break;
                        case 'rate--awards': label = 'Награды'; break;
                        case 'rate--tmdb': label = 'TMDB'; break;
                        case 'rate--imdb': label = 'IMDb'; break;
                        case 'rate--kp': label = 'Кинопоиск'; break;
                        case 'rate--rt': label = 'Rotten Tomatoes'; break;
                        case 'rate--mc': label = 'Metacritic'; break;
                    }
                    var item = $('<div class="maxsm-modal-rating-line"></div>');
                    if (showColors && className === 'rate--avg') item.addClass(getRatingClass(parseFloat(value)));
                    item.text(value + ' - ' + label);
                    modalContent.append(item);
                }
                Lampa.Modal.open({ title: 'Оценка', html: modalContent, width: 600, onBack: function () { Lampa.Modal.close(); if (Lampa.Controller) Lampa.Controller.toggle('content'); return true; } });
            });
        }

        if (Lampa.Listener && Lampa.Listener.follow) {
            Lampa.Listener.follow('full', function (e) {
                if (e.type !== 'complite') return;
                var render = e.object && e.object.activity && e.object.activity.render && e.object.activity.render();
                var movie = e.data && e.data.movie;
                fetchAdditionalRatings(movie, render);
            });
        }

        window.maxsmRatingsPlugin = true;
    }

    // =================================================================
    // START
    // =================================================================
    function runInit() {
        try {
            init();
            window.FLIXIO_STUDIOS_LOADED = true;
        } catch (err) {
            window.FLIXIO_STUDIOS_ERROR = (err && err.message) ? err.message : String(err);
            if (typeof console !== 'undefined' && console.error) console.error('[Flixio Studios Lite]', err);
        }
    }

    if (window.appready) runInit();
    else if (typeof Lampa !== 'undefined' && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') runInit(); });
    } else {
        window.FLIXIO_STUDIOS_ERROR = 'Lampa.Listener not found';
    }

})();
