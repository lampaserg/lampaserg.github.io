(function () {
    'use strict';

    window.FLIXIO_STUDIOS_VER = '4.0';
    window.FLIXIO_STUDIOS_LOADED = false;
    window.FLIXIO_STUDIOS_ERROR = null;

    if (typeof Lampa === 'undefined') {
        window.FLIXIO_STUDIOS_ERROR = 'Lampa not found (script loaded before app?)';
        return;
    }

    // =================================================================
    // CONFIGURATION & CONSTANTS
    // =================================================================
    var currentScript = document.currentScript || [].slice.call(document.getElementsByTagName('script')).filter(function (s) {
        return (s.src || '').indexOf('studios') !== -1 || (s.src || '').indexOf('fix.js') !== -1 || (s.src || '').indexOf('flixio') !== -1;
    })[0];

    var FLIXIO_BASE_URL = 'https://cdn.jsdelivr.net/gh/syvyj/studio_2@main/';
    var FLIXIO_LANG = 'ru';

    var FLIXIO_I18N = {};

    function tr(key) {
        var pack = FLIXIO_I18N[key];
        if (!pack) return key;
        return pack.ru || pack.en || key;
    }

    var SERVICE_CONFIGS = {
        'netflix': {
            title: 'Netflix',
            logo: 'logos/netflix.svg',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 2L16.5 22" stroke="#E50914" stroke-width="4"/><path d="M7.5 2L7.5 22" stroke="#E50914" stroke-width="4"/><path d="M7.5 2L16.5 22" stroke="#E50914" stroke-width="4"/></svg>',
            categories: [
                { "title": "🔥 Новые фильмы", "url": "discover/movie", "params": { "with_watch_providers": "8", "watch_region": "UA", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": "🔥 Новые сериалы", "url": "discover/tv", "params": { "with_networks": "213", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": "🏆 Топ сериалы", "url": "discover/tv", "params": { "with_networks": "213", "sort_by": "popularity.desc" } },
                { "title": "🏆 Топ фильмы", "url": "discover/movie", "params": { "with_watch_providers": "8", "watch_region": "UA", "sort_by": "popularity.desc" } },
                { "title": "🅰️ Только на Netflix", "url": "discover/tv", "params": { "with_networks": "213", "sort_by": "vote_average.desc", "vote_count.gte": "500", "vote_average.gte": "7.5" } },
                { "title": "🤯 Запутанные триллеры", "url": "discover/movie", "params": { "with_watch_providers": "8", "watch_region": "UA", "with_genres": "53,9648", "sort_by": "popularity.desc" } },
                { "title": "🐉 Фантастика и фэнтези", "url": "discover/tv", "params": { "with_networks": "213", "with_genres": "10765", "sort_by": "popularity.desc" } },
                { "title": "🇰🇷 K-Dramas (Корея)", "url": "discover/tv", "params": { "with_networks": "213", "with_original_language": "ko", "sort_by": "popularity.desc" } },
                { "title": "🔪 Документальный True Crime", "url": "discover/tv", "params": { "with_networks": "213", "with_genres": "99", "with_keywords": "9840|10714", "sort_by": "popularity.desc" } },
                { "title": "🍿 Аниме", "url": "discover/tv", "params": { "with_networks": "213", "with_genres": "16", "with_keywords": "210024", "sort_by": "popularity.desc" } }
            ]
        },
        'apple': {
            title: 'Apple TV+',
            logo: 'logos/apple.svg',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
            categories: [
                { "title": "🔥 Новые сериалы", "url": "discover/tv", "params": { "with_networks": "2552|3235", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": "🔥 Новые фильмы", "url": "discover/movie", "params": { "with_watch_providers": "350", "watch_region": "UA", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": "🏆 Топ сериалы", "url": "discover/tv", "params": { "with_networks": "2552|3235", "sort_by": "popularity.desc" } },
                { "title": "🏆 Топ фильмы", "url": "discover/movie", "params": { "with_watch_providers": "350", "watch_region": "UA", "sort_by": "popularity.desc" } },
                { "title": "🛸 Эпический Sci-Fi", "url": "discover/tv", "params": { "with_networks": "2552|3235", "with_genres": "10765", "sort_by": "popularity.desc" } },
                { "title": "😂 Комедии и feel-good", "url": "discover/tv", "params": { "with_networks": "2552|3235", "with_genres": "35", "sort_by": "popularity.desc" } },
                { "title": "🕵️ Качественные детективы", "url": "discover/tv", "params": { "with_networks": "2552|3235", "with_genres": "9648,80", "sort_by": "popularity.desc" } },
                { "title": "🎬 Apple Original Films", "url": "discover/movie", "params": { "with_watch_providers": "350", "watch_region": "UA", "sort_by": "vote_average.desc", "vote_count.gte": "100" } }
            ]
        },
        'hbo': {
            title: 'HBO / Max',
            logo: 'logos/hbo.svg',
            icon: '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="currentColor"><path d="M7.042 16.896H4.414v-3.754H2.708v3.754H.01L0 7.22h2.708v3.6h1.706v-3.6h2.628zm12.043.046C21.795 16.94 24 14.689 24 11.978a4.89 4.89 0 0 0-4.915-4.92c-2.707-.002-4.09 1.991-4.432 2.795.003-1.207-1.187-2.632-2.58-2.634H7.59v9.674l4.181.001c1.686 0 2.886-1.46 2.888-2.713.385.788 1.72 2.762 4.427 2.76zm-7.665-3.936c.387 0 .692.382.692.817 0 .435-.305.817-.692.817h-1.33v-1.634zm.005-3.633c.387 0 .692.382.692.817 0 .436-.305.818-.692.818h-1.33V9.373zm1.77 2.607c.305-.039.813-.387.992-.61-.063.276-.068 1.074.006 1.35-.204-.314-.688-.701-.998-.74zm3.43 0a2.462 2.462 0 1 1 4.924 0 2.462 2.462 0 0 1-4.925 0zm2.462 1.936a1.936 1.936 0 1 0 0-3.872 1.936 1.936 0 0 0 0 3.872z"/></svg>',
            categories: [
                { "title": "🔥 Новые сериалы", "url": "discover/tv", "params": { "with_networks": "49|3186", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": "🔥 Новые фильмы", "url": "discover/movie", "params": { "with_companies": "174|49", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "10" } },
                { "title": "🏆 Топ сериалы", "url": "discover/tv", "params": { "with_networks": "49|3186", "sort_by": "popularity.desc" } },
                { "title": "🏆 Топ фильмы (WB)", "url": "discover/movie", "params": { "with_companies": "174", "sort_by": "popularity.desc", "vote_count.gte": "50" } },
                { "title": "🐉 Эпические саги", "url": "discover/tv", "params": { "with_networks": "49|3186", "with_genres": "10765", "sort_by": "popularity.desc" } },
                { "title": "🎭 Премиальные драмы", "url": "discover/tv", "params": { "with_networks": "49", "with_genres": "18", "without_genres": "10765", "sort_by": "popularity.desc" } },
                { "title": "🦇 Блокбастеры DC", "url": "discover/movie", "params": { "with_companies": "174", "with_keywords": "9715", "sort_by": "revenue.desc" } },
                { "title": "🧠 Мрачные детективы", "url": "discover/tv", "params": { "with_networks": "49", "with_genres": "80,9648", "sort_by": "vote_average.desc", "vote_count.gte": "300" } },
                { "title": "👑 Золотая классика HBO", "url": "discover/tv", "params": { "with_networks": "49", "sort_by": "vote_average.desc", "vote_count.gte": "1000" } }
            ]
        },
        'amazon': {
            title: 'Prime Video',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 15c2.4 1.7 5.1 2.6 8 2.6 2.9 0 5.6-.9 8-2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M15.5 14.4L18 16.8 15.5 19.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            categories: [
                { "title": "🔥 Новые сериалы", "url": "discover/tv", "params": { "with_networks": "1024", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": "🔥 Новые фильмы", "url": "discover/movie", "params": { "with_watch_providers": "119", "watch_region": "US", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": "🏆 Топ сериалы", "url": "discover/tv", "params": { "with_networks": "1024", "sort_by": "popularity.desc" } },
                { "title": "🏆 Топ фильмы", "url": "discover/movie", "params": { "with_watch_providers": "119", "watch_region": "US", "sort_by": "popularity.desc" } },
                { "title": "🩸 Жёсткий экшн и антигерои", "url": "discover/tv", "params": { "with_networks": "1024", "with_genres": "10759,10765", "sort_by": "popularity.desc" } },
                { "title": "🎬 Фильмы от Amazon MGM", "url": "discover/movie", "params": { "with_companies": "1024|21", "sort_by": "popularity.desc" } },
                { "title": "😂 Комедии", "url": "discover/tv", "params": { "with_networks": "1024", "with_genres": "35", "sort_by": "popularity.desc" } },
                { "title": "🕵️ Триллеры", "url": "discover/tv", "params": { "with_networks": "1024", "with_genres": "9648,18", "sort_by": "vote_average.desc", "vote_count.gte": "300" } }
            ]
        },
        'disney': {
            title: 'Disney+',
            logo: 'logos/disney.svg',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10c2.2-2.5 5-3.7 8-3.7 2.2 0 4.1.7 5.8 1.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M12 13v4M10 15h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
            categories: [
                { "title": "🔥 Новые сериалы", "url": "discover/tv", "params": { "with_networks": "2739", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": "🔥 Новые фильмы", "url": "discover/movie", "params": { "with_watch_providers": "337", "watch_region": "US", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": "🏆 Топ сериалы", "url": "discover/tv", "params": { "with_networks": "2739", "sort_by": "popularity.desc" } },
                { "title": "🏆 Топ фильмы", "url": "discover/movie", "params": { "with_companies": "2", "sort_by": "popularity.desc" } },
                { "title": "🦸‍♂️ Киновселенная Marvel", "url": "discover/movie", "params": { "with_companies": "420", "sort_by": "release_date.desc", "vote_count.gte": "100" } },
                { "title": "⚔️ Далекая галактика (Star Wars)", "url": "discover/tv", "params": { "with_companies": "1", "with_keywords": "1930", "sort_by": "popularity.desc" } },
                { "title": "🧸 Шедевры Pixar", "url": "discover/movie", "params": { "with_companies": "3", "sort_by": "popularity.desc" } },
                { "title": "🍷 Взрослый контент (FX / Star)", "url": "discover/tv", "params": { "with_networks": "88|453", "sort_by": "popularity.desc" } }
            ]
        },
        'paramount': {
            title: 'Paramount+',
            logo: 'logos/paramount.svg',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22H22L12 2ZM12 6.5L18.5 19.5H5.5L12 6.5Z"/></svg>',
            categories: [
                { "title": "🔥 Новые сериалы", "url": "discover/tv", "params": { "with_networks": "4330", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": "🔥 Новые фильмы", "url": "discover/movie", "params": { "with_companies": "4", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "10" } },
                { "title": "🏆 Топ сериалы", "url": "discover/tv", "params": { "with_networks": "4330", "sort_by": "popularity.desc" } },
                { "title": "🏆 Топ фильмы", "url": "discover/movie", "params": { "with_companies": "4", "sort_by": "popularity.desc" } },
                { "title": "🤠 Вселенная Шеридана (Yellowstone)", "url": "discover/tv", "params": { "with_networks": "318|4330", "with_keywords": "256112", "sort_by": "popularity.desc" } },
                { "title": "🖖 Коллекция Star Trek", "url": "discover/tv", "params": { "with_networks": "4330", "with_keywords": "159223", "sort_by": "first_air_date.desc" } },
                { "title": "🚓 Криминал и расследования", "url": "discover/tv", "params": { "with_networks": "16", "with_genres": "80,18", "sort_by": "popularity.desc" } },
                { "title": "🧽 Детский мир (Nickelodeon)", "url": "discover/tv", "params": { "with_networks": "13", "sort_by": "popularity.desc" } }
            ]
        },
        'sky_showtime': {
            title: 'Sky Showtime',
            logo: 'logos/SkyShowtime.svg',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 9.5c1-.8 2.2-1.2 3.5-1.2 2 0 3.7 1 4.7 2.6" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
            categories: [
                { "title": "🔥 Новые сериалы", "url": "discover/tv", "params": { "with_companies": "67|115331", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": "🔥 Новые фильмы", "url": "discover/movie", "params": { "with_companies": "4|33|521", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "5" } },
                { "title": "🏆 Топ сериалы", "url": "discover/tv", "params": { "with_companies": "67|115331", "sort_by": "popularity.desc" } },
                { "title": "🏆 Топ фильмы", "url": "discover/movie", "params": { "with_companies": "4|33", "sort_by": "popularity.desc" } },
                { "title": "🎬 Блокбастеры Paramount", "url": "discover/movie", "params": { "with_companies": "4", "sort_by": "revenue.desc" } },
                { "title": "🌍 Мир Universal", "url": "discover/movie", "params": { "with_companies": "33", "sort_by": "popularity.desc" } },
                { "title": "🕵️ Взрослый разбор (Showtime)", "url": "discover/tv", "params": { "with_companies": "67", "sort_by": "popularity.desc" } },
                { "title": "🦄 Казковые миры (DreamWorks)", "url": "discover/movie", "params": { "with_companies": "521", "sort_by": "popularity.desc" } }
            ]
        },
        'hulu': {
            title: 'Hulu',
            logo: 'logos/Hulu.svg',
            icon: '<svg viewBox="0 0 24 24" fill="#3DBB3D"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>',
            categories: [
                { "title": "🔥 Новые сериалы", "url": "discover/tv", "params": { "with_networks": "453", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": "🔥 Новые фильмы", "url": "discover/movie", "params": { "with_watch_providers": "15", "watch_region": "US", "sort_by": "primary_release_date.desc", "primary_release_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": "🏆 Топ сериалы", "url": "discover/tv", "params": { "with_networks": "453", "sort_by": "popularity.desc" } },
                { "title": "🏆 Топ фильмы", "url": "discover/movie", "params": { "with_watch_providers": "15", "watch_region": "US", "sort_by": "popularity.desc" } },
                { "title": "🔪 Документальный True Crime", "url": "discover/tv", "params": { "with_networks": "453", "with_genres": "18,9648", "sort_by": "popularity.desc" } },
                { "title": "😂 Комедии и feel-good", "url": "discover/tv", "params": { "with_networks": "453", "with_genres": "35", "sort_by": "popularity.desc" } },
                { "title": "🤬 Анимация для взрослых", "url": "discover/tv", "params": { "with_networks": "453", "with_genres": "16", "sort_by": "popularity.desc" } }
            ]
        },
        'syfy': {
            title: 'Syfy',
            logo: 'logos/Syfy.svg',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>',
            categories: [
                { "title": "🔥 Новинки", "url": "discover/tv", "params": { "with_networks": "77", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "1" } },
                { "title": "🏆 Топ на Syfy", "url": "discover/tv", "params": { "with_networks": "77", "sort_by": "popularity.desc" } },
                { "title": "🚀 Космические путешествия", "url": "discover/tv", "params": { "with_networks": "77", "with_genres": "10765", "with_keywords": "3801", "sort_by": "vote_average.desc", "vote_count.gte": "50" } },
                { "title": "🧟 Монстры и паранормальное", "url": "discover/tv", "params": { "with_networks": "77", "with_genres": "9648,10765", "without_keywords": "3801", "sort_by": "popularity.desc" } }
            ]
        },
        'educational_and_reality': {
            title: 'Познавательное',
            logo: 'logos/Discovery.svg',
            icon: '<svg viewBox="0 0 24 24" fill="#FF9800"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>',
            categories: [
                { "title": "🔥 Новые выпуски", "url": "discover/tv", "params": { "with_networks": "64|91|43|2696|4|65", "sort_by": "first_air_date.desc", "first_air_date.lte": "{current_date}", "vote_count.gte": "2" } },
                { "title": "🌍 Discovery Channel", "url": "discover/tv", "params": { "with_networks": "64", "sort_by": "popularity.desc" } },
                { "title": "🦁 National Geographic", "url": "discover/tv", "params": { "with_networks": "43", "sort_by": "popularity.desc" } },
                { "title": "🐾 Animal Planet", "url": "discover/tv", "params": { "with_networks": "91", "sort_by": "popularity.desc" } },
                { "title": "🌿 BBC Earth", "url": "discover/tv", "params": { "with_networks": "4", "with_genres": "99", "sort_by": "vote_average.desc", "vote_count.gte": "20" } },
                { "title": "🔪 Кулинарные битвы", "url": "discover/tv", "params": { "with_genres": "10764", "with_keywords": "222083", "sort_by": "popularity.desc" } },
                { "title": "🪓 Выживание", "url": "discover/tv", "params": { "with_genres": "10764", "with_keywords": "5481|10348", "sort_by": "popularity.desc" } }
            ]
        }
    };

    function getTmdbKey() {
        var custom = (Lampa.Storage.get('flixio_tmdb_apikey') || '').trim();
        return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
    }

    // =================================================================
    // GLOBAL PLAYER HELPER
    // =================================================================
    function playYouTubeCustom(key) {
        var overlay = $('<div class="youtube-pro-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; background: #000;"></div>');
        var playerContainer = $('<div id="yt-player-custom"></div>');
        var loader = $('<div class="yt-loader" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 1.5em; font-weight: bold; text-align: center;"><div class="broadcast__scan"></div><div>Загрузка трейлера...</div></div>');
        
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
                        if (event.data === 0) {
                            closePlayer();
                        }
                    },
                    'onError': function(e) { 
                        if (e.data == 150 || e.data == 153) Lampa.Noty.show('Видео ограничено владельцем');
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
    // UTILS & COMPONENTS
    // =================================================================

    function makeHeroResultItem(movie, heightEm) {
        if (!$('#studios5-hero-css').length) {
            $('body').append('<style id="studios5-hero-css">.hero-banner .card-marks, .hero-banner .card__icons, .hero-banner .card__quality { display: none !important; }</style>');
        }
        if (!$('#studios5-show-more-css').length) {
            $('body').append('<style id="studios5-show-more-css">' +
                '.show-more-button.focus { transform: scale(1.05) !important; box-shadow: 0 0 0 3px #fff !important; z-index: 10 !important; }' +
                '.card.show-more-button:focus { transform: scale(1.05) !important; box-shadow: 0 0 0 3px #fff !important; z-index: 10 !important; }' +
                '.kino-card.show-more-button:hover { transform: scale(1.05) !important; box-shadow: 0 0 0 3px #fff !important; z-index: 10 !important; }' +
                '.kino-card.show-more-button.focus { transform: scale(1.05) !important; box-shadow: 0 0 0 3px #fff !important; z-index: 10 !important; }' +
            '</style>');
        }
        heightEm = heightEm || 22.5;
        var pad = (heightEm / 35 * 2).toFixed(1);
        var titleEm = (heightEm / 35 * 2.5).toFixed(2);
        var descEm = (heightEm / 35 * 1.1).toFixed(2);

        var renderHeroContent = function(item, movie) {
            item.empty();
            item.append('<div class="hero-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding: ' + pad + 'em; border-radius: 0 0 1em 1em;">' +
                '<div class="hero-header" style="margin-bottom: 0.3em; min-height: 3em; display: flex; align-items: flex-end;">' +
                    '<div class="hero-title" style="font-size: ' + titleEm + 'em; font-weight: bold; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">' + (movie.title || movie.name) + '</div>' +
                '</div>' +
                '<div class="hero-meta" style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5em; font-size: 0.9em; color: #ccc; margin-bottom: 0.5em;"></div>' +
                '<div class="hero-desc" style="font-size: ' + descEm + 'em; color: #ddd; max-width: 60%; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.6em;">' + (movie.overview || '') + '</div>' +
                '<div class="hero-trailer-btn selector" style="display: inline-flex; align-items: center; background: rgba(255, 255, 255, 0.2); padding: 0.4em 0.8em; border-radius: 0.3em; cursor: pointer; transition: background 0.2s;">' +
                '<svg style="width: 1.2em; height: 1.2em; margin-right: 0.4em;" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
                '<span style="font-size: 0.9em; font-weight: 600;">Трейлер</span>' +
                '</div>' +
                '</div>');
            
            item.find('.hero-trailer-btn').on('hover:enter click', function (e) {
                e.stopPropagation();
                var network = new Lampa.Reguest();
                var type = movie.name ? 'tv' : 'movie';
                var lang = 'ru';
                function search(searchLang) {
                    var url = Lampa.TMDB.api(type + '/' + movie.id + '/videos?api_key=' + getTmdbKey() + '&language=' + searchLang);
                    network.silent(url, function (json) {
                        var videos = json.results || [];
                        var trailer = videos.find(function(v) { return v.type === 'Trailer' && v.site === 'YouTube'; }) || videos[0];
                        if (trailer && trailer.key) {
                            playYouTubeCustom(trailer.key);
                        } else if (searchLang !== 'en-US') {
                            search('en-US');
                        } else {
                            Lampa.Noty.show('Трейлер не найден');
                        }
                    }, function() {
                            if (searchLang !== 'en-US') search('en-US');
                            else Lampa.Noty.show('Ошибка поиска трейлера');
                    });
                }
                search(lang);
            });

            var type = movie.name ? 'tv' : 'movie';
            var lang = 'ru';
            var url = Lampa.TMDB.api(type + '/' + movie.id + '?api_key=' + getTmdbKey() + '&language=' + lang + '&append_to_response=images,release_dates,content_ratings');
            
            var network = new Lampa.Reguest();
            network.silent(url, function(details) {
                var logo = null;
                if (details.images && details.images.logos && details.images.logos.length) {
                    logo = details.images.logos.find(function(l) { return l.iso_639_1 === lang; }) || 
                           details.images.logos.find(function(l) { return l.iso_639_1 === 'en'; }) || 
                           details.images.logos[0];
                }
                if (logo) {
                    var logoUrl = Lampa.TMDB.image('t/p/w500' + logo.file_path);
                    item.find('.hero-title').html('<img src="' + logoUrl + '" style="height: 4em; width: auto; max-width: 80%; object-fit: contain; display: block;" />');
                    item.find('.hero-header').css('min-height', 'auto');
                }

                var metaParts = [];
                
                var headMeta = '';
                var rating = details.vote_average || movie.vote_average;
                if (rating) headMeta += '<span class="card__mark card__mark--rating" style="position: static; margin: 0 0.5em 0 0; padding: 0.2em 0.5em; font-size: 0.9em; background: rgba(255,255,255,0.2); border-radius: 0.3em;">★ ' + parseFloat(rating).toFixed(1) + '</span>';
                
                var date = details.release_date || details.first_air_date || movie.release_date || movie.first_air_date;
                if (date) headMeta += parseInt(date);
                
                if (headMeta) metaParts.push(headMeta);
                
                var typeStr = type === 'movie' ? 'Фильм' : 'Сериал';
                metaParts.push(typeStr);
                
                var age = '';
                if (type === 'movie' && details.release_dates && details.release_dates.results) {
                    var rel = details.release_dates.results.find(function(r) { return r.iso_3166_1 === 'US' || r.iso_3166_1 === 'RU'; });
                    if (rel && rel.release_dates && rel.release_dates.length) age = rel.release_dates[0].certification;
                } else if (type === 'tv' && details.content_ratings && details.content_ratings.results) {
                    var rat = details.content_ratings.results.find(function(r) { return r.iso_3166_1 === 'US' || r.iso_3166_1 === 'RU'; });
                    if (rat) age = rat.rating;
                }
                if (age) {
                    var ageColor = '#fff';
                    var ageVal = parseInt(age);
                    var displayAge = age;

                    if (!isNaN(ageVal)) {
                        displayAge = ageVal + '+';
                        if (ageVal >= 18) ageColor = '#d32f2f';
                        else if (ageVal >= 16) ageColor = '#f57c00';
                        else if (ageVal >= 12) ageColor = '#fbc02d';
                        else ageColor = '#388e3c';
                    } else {
                        if (['R', 'NC-17', 'TV-MA'].indexOf(age) !== -1) {
                            ageColor = '#d32f2f';
                            displayAge = '18+';
                        } else if (['PG-13', 'TV-14'].indexOf(age) !== -1) {
                            ageColor = '#f57c00';
                            displayAge = '16+';
                        } else if (['PG', 'TV-PG', 'TV-Y7'].indexOf(age) !== -1) {
                            ageColor = '#fbc02d';
                            displayAge = '12+';
                        } else {
                            ageColor = '#388e3c';
                            displayAge = '0+';
                        }
                    }
                    metaParts.push('<span style="border: 1px solid ' + ageColor + '; color: ' + ageColor + '; padding: 0 0.3em; border-radius: 0.2em; font-size: 0.9em; font-weight: bold;">' + displayAge + '</span>');
                }

                if (details.production_countries && details.production_countries.length) {
                    metaParts.push(details.production_countries[0].iso_3166_1);
                }
                
                var runtime = details.runtime || (details.episode_run_time ? details.episode_run_time[0] : 0);
                if (runtime) {
                    var h = Math.floor(runtime / 60);
                    var m = runtime % 60;
                    var hStr = h > 0 ? h + 'ч.' : '';
                    var mStr = m > 0 ? m + 'м.' : '';
                    if (hStr || mStr) metaParts.push((hStr + ' ' + mStr).trim());
                }

                if (metaParts.length) {
                    item.find('.hero-meta').html('<span>' + metaParts.join('</span><span>') + '</span>');
                }
            });
        };

        return {
            title: 'Hero',
            params: {
                createInstance: function (element) {
                    var card = Lampa.Maker.make('Card', element, function (module) { return module.only('Card', 'Callback'); });
                    return card;
                },
                emit: {
                    onCreate: function () {
                        var img = movie.backdrop_path ? Lampa.TMDB.image('t/p/original' + movie.backdrop_path) : (movie.poster_path ? Lampa.TMDB.image('t/p/original' + movie.poster_path) : '');
                        try {
                            var item = $(this.html);
                            item.addClass('hero-banner');
                            item.css({
                                'background-image': 'url(' + img + ')',
                                'width': '100%',
                                'height': heightEm + 'em',
                                'background-size': 'cover',
                                'background-position': 'center',
                                'border-radius': '1em',
                                'position': 'relative',
                                'box-shadow': '0 0 20px rgba(0,0,0,0.5)',
                                'margin-bottom': '10px'
                            });
                            
                            renderHeroContent(item, movie);

                            item.find('.card__view').remove();
                            item.find('.card__title').remove();
                            item.find('.card__age').remove();
                            item.find('.card-marks').remove();
                            item.find('.card__icons').remove();
                            item[0].heroMovieData = movie;
                        } catch (e) { console.log('Hero onCreate error:', e); }
                    },
                    onVisible: function () {
                        try {
                            var item = $(this.html);
                            if (!item.hasClass('hero-banner')) {
                                var img = movie.backdrop_path ? Lampa.TMDB.image('t/p/original' + movie.backdrop_path) : (movie.poster_path ? Lampa.TMDB.image('t/p/original' + movie.poster_path) : '');
                                item.addClass('hero-banner');
                                item.css({
                                    'background-image': 'url(' + img + ')',
                                    'width': '100%',
                                    'height': heightEm + 'em',
                                    'background-size': 'cover',
                                    'background-position': 'center',
                                    'border-radius': '1em',
                                    'position': 'relative',
                                    'box-shadow': '0 0 20px rgba(0,0,0,0.5)',
                                    'margin-bottom': '10px'
                                });
                                
                                renderHeroContent(item, movie);

                                item.find('.card__view').remove();
                                item.find('.card__title').remove();
                                item.find('.card__age').remove();
                                item.find('.card-marks').remove();
                                item.find('.card__icons').remove();
                                item[0].heroMovieData = movie;
                            }
                            if (this.img) this.img.onerror = function () { };
                            if (this.img) this.img.onload = function () { };
                        } catch (e) { console.log('Hero onVisible error:', e); }
                    },
                    onlyEnter: function () {
                        var playHeroTrailer = function() {
                             var network = new Lampa.Reguest();
                             var type = movie.name ? 'tv' : 'movie';
                             var lang = 'ru';
                            
                            function search(searchLang) {
                                var url = Lampa.TMDB.api(type + '/' + movie.id + '/videos?api_key=' + getTmdbKey() + '&language=' + searchLang);
                                network.silent(url, function (json) {
                                    var videos = json.results || [];
                                    var trailer = videos.find(function(v) { return v.type === 'Trailer' && v.site === 'YouTube'; }) || videos[0];
                                    if (trailer && trailer.key) {
                                        playYouTubeCustom(trailer.key);
                                    } else if (searchLang !== 'en-US') {
                                        search('en-US');
                                    } else {
                                        Lampa.Noty.show('Трейлер не найден');
                                    }
                                }, function() {
                                     if (searchLang !== 'en-US') search('en-US');
                                     else Lampa.Noty.show('Ошибка поиска трейлера');
                                });
                            }
                            search(lang);
                        };

                        Lampa.Select.show({
                            title: 'Меню',
                            items: [
                                { title: 'Подробнее', action: 'open' },
                                { title: 'Трейлер', action: 'trailer' }
                            ],
                            onSelect: function(a) {
                                if(a.action === 'trailer') {
                                    playHeroTrailer();
                                } else {
                                    Lampa.Activity.push({
                                        url: '',
                                        component: 'full',
                                        id: movie.id,
                                        method: movie.name ? 'tv' : 'movie',
                                        card: movie,
                                        source: 'tmdb'
                                    });
                                }
                            }
                        });
                    },
                    onKey: function(key) {
                        if (key === 'play') {
                           var playHeroTrailerKey = function() {
                                  var network = new Lampa.Reguest();
                                  var type = movie.name ? 'tv' : 'movie';
                                  var lang = 'ru';
                                  
                                function search(searchLang) {
                                    var url = Lampa.TMDB.api(type + '/' + movie.id + '/videos?api_key=' + getTmdbKey() + '&language=' + searchLang);
                                    network.silent(url, function (json) {
                                        var videos = json.results || [];
                                        var trailer = videos.find(function(v) { return v.type === 'Trailer' && v.site === 'YouTube'; }) || videos[0];
                                        if (trailer && trailer.key) { playYouTubeCustom(trailer.key); } 
                                        else if (searchLang !== 'en-US') { search('en-US'); } 
                                        else { Lampa.Noty.show('Трейлер не найден'); }
                                    });
                                }
                                search(lang);
                           };
                           playHeroTrailerKey();
                        }
                    }
                }
            }
        };
    }

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
                params.push('language=ru');
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

                console.log('[StudiosMain] Category', index + 1, ':', cat.title, 'URL:', url);

                network.silent(url, function (json) {
                    console.log('[StudiosMain] Category', index + 1, 'data received:', json);
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
            params.push('language=ru');
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
    // ПІДПИСКИ НА СТУДІЇ
    // =================================================================
    var FlixioStudioSubscription = (function () {
        var storageKey = 'flixio_subscription_studios';

        function getParams() {
            var raw = Lampa.Storage.get(storageKey, '[]');
            return typeof raw === 'string' ? (function () { try { return JSON.parse(raw); } catch (e) { return []; } })() : (Array.isArray(raw) ? raw : []);
        }

        function setParams(params) {
            Lampa.Storage.set(storageKey, params);
        }

        function add(company) {
            var c = { id: company.id, name: company.name || '', logo_path: company.logo_path || '' };
            var studios = getParams();
            if (!studios.find(function (s) { return String(s.id) === String(c.id); })) {
                studios.push(c);
                setParams(studios);
                Lampa.Noty.show('Добавлено в подписки');
            }
        }

        function remove(company) {
            var studios = getParams();
            var idx = studios.findIndex(function (c) { return c.id === company.id; });
            if (idx !== -1) {
                studios.splice(idx, 1);
                setParams(studios);
                Lampa.Noty.show('Удалено из подписок');
            }
        }

        function isSubscribed(company) {
            return !!getParams().find(function (c) { return c.id === company.id; });
        }

        function injectButton(object) {
            var attempts = 0;
            var interval = setInterval(function () {
                var nameEl = $('.company-start__name');
                var company = object.company;
                if (!nameEl.length || !company || !company.id) {
                    attempts++;
                    if (attempts > 25) clearInterval(interval);
                    return;
                }
                clearInterval(interval);
                if (nameEl.find('.studio-subscription-btn').length) return;

                var btn = $('<div class="studio-subscription-btn selector"></div>');

                function updateState() {
                    var sub = isSubscribed(company);
                    btn.text(sub ? 'Отписаться' : 'Подписаться');
                    btn.removeClass('studio-subscription-btn--sub studio-subscription-btn--unsub').addClass(sub ? 'studio-subscription-btn--unsub' : 'studio-subscription-btn--sub');
                }

                function doToggle() {
                    if (isSubscribed(company)) remove(company);
                    else add({ id: company.id, name: company.name || '', logo_path: company.logo_path || '' });
                    updateState();
                }

                btn.on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    doToggle();
                });
                btn.on('hover:enter', doToggle);

                updateState();
                nameEl.append(btn);

                setTimeout(function () {
                    try {
                        if (Lampa.Controller && Lampa.Controller.collectionFocus) {
                            Lampa.Controller.collectionFocus(btn[0]);
                        }
                    } catch (e) { }
                }, 300);
            }, 200);
        }

        function registerComponent() {
        }

        return {
            init: function () {
                var existing = Lampa.Storage.get(storageKey, '[]');
                var fromOld = Lampa.Storage.get('subscription_studios', '[]');
                if ((!existing || existing === '[]' || (Array.isArray(existing) && !existing.length)) && fromOld && fromOld !== '[]') {
                    try {
                        var arr = typeof fromOld === 'string' ? JSON.parse(fromOld) : fromOld;
                        if (Array.isArray(arr) && arr.length) setParams(arr);
                    } catch (e) { }
                }
                registerComponent();
            }
        };
    })();

    // =================================================================
    // MAIN PAGE ROWS (REMOVED)
    // =================================================================

    // ========== Удаляем секцию Shots ==========
    function removeShotsSection() {
        function doRemove() {
            $('.items-line').each(function () {
                var title = $(this).find('.items-line__title').text().trim();
                if (title === 'Shots' || title === 'shots') {
                    $(this).remove();
                }
            });
        }
        setTimeout(doRemove, 1000);
        setTimeout(doRemove, 3000);
        setTimeout(doRemove, 6000);
    }

    // =================================================================
    // FLIXIO QUALITY MARKS (Jacred) - NO CARD BADGES
    // =================================================================

    function initMarksJacRed() {
        var svgIcons = {
            '4K': '<span style="font-weight:800;font-size:0.85em;color:#ff9800;">4K</span>',
            'UKR': '<span style="font-weight:800;font-size:0.85em;color:#4fc3f7;">UA</span>',
            'HDR': '<span style="font-weight:800;font-size:0.85em;color:#ffeb3b;">HDR</span>'
        };

        var workingProxy = null;
        var proxies = [
            'https://myfinder.kozak-bohdan.workers.dev/?key=lmp_2026_JacRed_K9xP7aQ4mV2E&url=',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?url='
        ];

        var cardsObserver = null;

        function fetchWithProxy(url, callback) {
            try {
                var network = new Lampa.Reguest();
                network.timeout(10000);
                network.silent(url, function (json) {
                    console.log('[JacRed] Direct success via Lampa.Reguest');
                    var text = typeof json === 'string' ? json : JSON.stringify(json);
                    workingProxy = 'direct';
                    callback(null, text);
                }, function () {
                    console.log('[JacRed] Direct Lampa.Reguest failed, trying proxies...');
                    tryProxies(url, callback);
                });
            } catch (e) {
                tryProxies(url, callback);
            }
        }

        function tryProxies(url, callback) {
            var proxyList = (workingProxy && workingProxy !== 'direct') ? [workingProxy] : proxies;

            function tryProxy(index) {
                if (index >= proxyList.length) {
                    console.error('[JacRed] All proxies failed for:', url);
                    callback(new Error('No proxy worked'));
                    return;
                }
                var p = proxyList[index];
                var target = p.indexOf('url=') > -1 ? p + encodeURIComponent(url) : p + url;
                console.log('[JacRed] Fetching via proxy:', target);

                var xhr = new XMLHttpRequest();
                xhr.open('GET', target, true);
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        console.log('[JacRed] Proxy success:', p);
                        workingProxy = p;
                        callback(null, xhr.responseText);
                    } else {
                        console.warn('[JacRed] Proxy failed:', xhr.status, p);
                        tryProxy(index + 1);
                    }
                };
                xhr.onerror = function () {
                    console.warn('[JacRed] Proxy error:', p);
                    tryProxy(index + 1);
                };
                xhr.timeout = 10000;
                xhr.ontimeout = function () {
                    console.warn('[JacRed] Proxy timeout:', p);
                    tryProxy(index + 1);
                };
                xhr.send();
            }
            tryProxy(0);
        }

        var _jacredCache = {};

        function getBestJacred(card, callback) {
            var cacheKey = 'jacred_v4_' + card.id;

            if (_jacredCache[cacheKey]) {
                console.log('[JacRed] mem-cache HIT:', cacheKey);
                callback(_jacredCache[cacheKey]);
                return;
            }

            try {
                var raw = Lampa.Storage.get(cacheKey, '');
                if (raw && typeof raw === 'object' && raw._ts && (Date.now() - raw._ts < 48 * 60 * 60 * 1000)) {
                    console.log('[JacRed] storage-cache HIT:', cacheKey, raw);
                    _jacredCache[cacheKey] = raw;
                    callback(raw);
                    return;
                }
            } catch (e) { }

            console.log('[JacRed] cache MISS for', cacheKey);

            var title = (card.original_title || card.title || card.name || '').toLowerCase();
            var year = (card.release_date || card.first_air_date || '').substr(0, 4);
            console.log('[JacRed] title:', title, 'year:', year, 'release_date:', card.release_date, 'first_air_date:', card.first_air_date);

            if (!title || !year) {
                console.warn('[JacRed] SKIP: no title or year');
                callback(null);
                return;
            }

            var releaseDate = new Date(card.release_date || card.first_air_date);
            console.log('[JacRed] releaseDate:', releaseDate, 'now:', new Date(), 'future?', releaseDate.getTime() > Date.now());
            if (releaseDate && releaseDate.getTime() > Date.now()) {
                console.warn('[JacRed] SKIP: future release');
                callback(null);
                return;
            }

            var apiUrl = 'https://jr.maxvol.pro/api/v1.0/torrents?search=' + encodeURIComponent(title) + '&year=' + year;
            console.log('[JacRed] API URL:', apiUrl);

            fetchWithProxy(apiUrl, function (err, data) {
                if (err || !data) {
                    callback(null);
                    return;
                }

                try {
                    var parsed;
                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {
                        console.error('[JacRed] JSON Parse Error:', e);
                        console.log('[JacRed] Raw Data:', data);
                        callback(null);
                        return;
                    }

                    if (parsed.contents) {
                        try {
                            parsed = JSON.parse(parsed.contents);
                        } catch (e) {
                            console.log('[JacRed] Failed to parse inner contents, using raw');
                        }
                    }

                    var results = Array.isArray(parsed) ? parsed : (parsed.Results || []);
                    console.log('[JacRed] Parsed results:', results.length);

                    if (!results.length) {
                        var emptyData = { empty: true, _ts: Date.now() };
                        _jacredCache[cacheKey] = emptyData;
                        try { Lampa.Storage.set(cacheKey, emptyData); } catch (e) { }
                        callback(null);
                        return;
                    }

                    var best = { resolution: 'SD', rus: false, ukr: false, eng: false, hdr: false };
                    var resOrder = ['SD', 'HD', 'FHD', '2K', '4K'];

                    results.forEach(function (item) {
                        var t = (item.title || '').toLowerCase();
                        var tracker = (item.tracker || '').toLowerCase();
                        var voices = Array.isArray(item.voices) ? item.voices : [];
                        var voicesStr = (voices.join(' ') || '').toLowerCase();
                        var videotype = (item.videotype || '').toLowerCase();

                        var currentRes = 'SD';
                        var q = parseInt(item.quality || 0, 10);
                        if (q >= 2160) currentRes = '4K';
                        else if (q >= 1440) currentRes = '2K';
                        else if (q >= 1080) currentRes = 'FHD';
                        else if (q >= 720) currentRes = 'HD';

                        if (currentRes === 'SD') {
                            if (t.indexOf('4k') >= 0 || t.indexOf('2160') >= 0 || t.indexOf('uhd') >= 0) currentRes = '4K';
                            else if (t.indexOf('2k') >= 0 || t.indexOf('1440') >= 0) currentRes = '2K';
                            else if (t.indexOf('1080') >= 0 || t.indexOf('fhd') >= 0 || t.indexOf('full hd') >= 0) currentRes = 'FHD';
                            else if (t.indexOf('720') >= 0 || t.indexOf('hd') >= 0) currentRes = 'HD';
                        }

                        if (resOrder.indexOf(currentRes) > resOrder.indexOf(best.resolution)) {
                            best.resolution = currentRes;
                        }

                        if (t.indexOf('ukr') >= 0 || t.indexOf('укр') >= 0 || t.indexOf('ua') >= 0 || t.indexOf('ukrainian') >= 0) {
                            best.ukr = true;
                        }

                        if (
                            t.indexOf('rus') >= 0 ||
                            t.indexOf('russian') >= 0 ||
                            t.indexOf('рус') >= 0 ||
                            t.indexOf('рос') >= 0 ||
                            t.indexOf(' ru') >= 0 ||
                            t.indexOf('ru ') >= 0 ||
                            t.indexOf('[ru]') >= 0 ||
                            t.indexOf('(ru)') >= 0 ||
                            t.indexOf('/ru') >= 0 ||
                            t.indexOf('ru/') >= 0 ||
                            t.indexOf('ua/ru') >= 0 ||
                            t.indexOf('ukr/ru') >= 0 ||
                            t.indexOf('ru/ua') >= 0
                        ) {
                            best.rus = true;
                        }

                        if (!best.rus) {
                            var ruTrackers = ['kinozal', 'rutracker', 'rutor', 'nnmclub', 'megapeer', 'selezen'];
                            if (ruTrackers.indexOf(tracker) >= 0 && voices.length) {
                                best.rus = true;
                            }
                        }

                        if (t.indexOf('eng') >= 0 || t.indexOf('english') >= 0 || t.indexOf('multi') >= 0) {
                            best.eng = true;
                        }

                        if (videotype.indexOf('dolby') >= 0 || videotype.indexOf('dv') >= 0 || t.indexOf('dolby vision') >= 0 || t.indexOf('dolbyvision') >= 0) {
                            best.hdr = true;
                            best.dolbyVision = true;
                        } else if (videotype.indexOf('hdr') >= 0 || t.indexOf('hdr') >= 0) {
                            best.hdr = true;
                        }
                    });

                    if (card.original_language === 'uk') best.ukr = true;
                    if (card.original_language === 'ru') best.rus = true;
                    if (card.original_language === 'en') best.eng = true;

                    best._ts = Date.now();
                    _jacredCache[cacheKey] = best;
                    try { Lampa.Storage.set(cacheKey, best); } catch (e) { }
                    console.log('[JacRed] RESULT for', card.id, ':', JSON.stringify(best));
                    callback(best);

                } catch (e) {
                    callback(null);
                }
            });
        }

        function createBadge(cssClass, label) {
            var badge = document.createElement('div');
            badge.classList.add('card__mark');
            badge.classList.add('card__mark--' + cssClass);
            badge.textContent = label;
            return badge;
        }

        // ====== Функции для работы с качеством ======
        var studios_quality_cache_key = 'studios_quality_cache';
        var studios_quality_cache_ttl = 12 * 60 * 60 * 1000;
        
        function studiosGetQualityCache(cacheKey) {
            var cache = Lampa.Storage.get(studios_quality_cache_key) || {};
            var item = cache[cacheKey];
            if (!item) return null;
            if (!item.timestamp || (Date.now() - item.timestamp) > studios_quality_cache_ttl) return null;
            return item;
        }
        
        function studiosSaveQualityCache(cacheKey, data) {
            var cache = Lampa.Storage.get(studios_quality_cache_key) || {};
            cache[cacheKey] = {
                label: data.label,
                code: data.code,
                timestamp: Date.now()
            };
            Lampa.Storage.set(studios_quality_cache_key, cache);
        }
        
        function studiosExtractNumericQualityFromTitle(title) {
            if (!title) return 0;
            var lower = String(title).toLowerCase();
            if (/2160p|4k/.test(lower)) return 2160;
            if (/1440p|qhd|2k/.test(lower)) return 1440;
            if (/1080p/.test(lower)) return 1080;
            if (/720p/.test(lower)) return 720;
            if (/480p/.test(lower)) return 480;
            if (/tc|telecine/.test(lower)) return 3;
            if (/ts|telesync/.test(lower)) return 2;
            if (/camrip|камрип/.test(lower)) return 1;
            return 0;
        }
        
        function studiosNormalizeCardForQuality(data) {
            var type = 'movie';
            if (data && (data.name || data.first_air_date || data.media_type === 'tv' || data.type === 'tv')) {
                type = 'tv';
            }
            var release_date = '';
            if (data) {
                if (typeof data.release_date === 'string' && data.release_date.length >= 4) {
                    release_date = data.release_date;
                } else if (typeof data.first_air_date === 'string' && data.first_air_date.length >= 4) {
                    release_date = data.first_air_date;
                } else if (data.year) {
                    var yearMatch = String(data.year).match(/(19|20)\d{2}/);
                    if (yearMatch) release_date = yearMatch[0] + '-01-01';
                } else if (data.date) {
                    var dateMatch = String(data.date).match(/(19|20)\d{2}/);
                    if (dateMatch) release_date = dateMatch[0] + '-01-01';
                }
            }
            return {
                id: data && (data.id || data.tmdb_id || (data.tmdb && data.tmdb.id)) || '',
                title: data && (data.title || data.name || '') || '',
                original_title: data && (data.original_title || data.original_name || '') || '',
                type: type,
                release_date: release_date
            };
        }
        
        function studiosEstimateFallbackQuality(normalized, originalData) {
            var year = 0;
            if (normalized && normalized.release_date && normalized.release_date.length >= 4) {
                year = parseInt(normalized.release_date.substring(0, 4), 10);
            } else if (originalData && originalData.year) {
                var yearMatch = String(originalData.year).match(/(19|20)\d{2}/);
                if (yearMatch) year = parseInt(yearMatch[0], 10);
            }
            if (!year || isNaN(year)) return null;
            var code = 0;
            var label = '';
            if (year >= 2023) {
                code = 2160;
                label = '4K';
            } else if (year >= 2020) {
                code = 1080;
                label = '1080p';
            } else if (year >= 2015) {
                code = 720;
                label = '720p';
            } else {
                code = 480;
                label = 'SD';
            }
            return { code: code, label: label };
        }
        
        function studiosResolveRealQuality(cardData, callback) {
            try {
                console.log('[Studios5] Starting quality detection for:', cardData.title || cardData.name);
                
                var parserEnabled = Lampa.Storage.get('parser_use', false);
                console.log('[Studios5] Parser enabled:', parserEnabled);
                
                if (!parserEnabled) {
                    console.log('[Studios5] Parser disabled, using year fallback');
                    var normalized = studiosNormalizeCardForQuality(cardData);
                    var estimated = studiosEstimateFallbackQuality(normalized, cardData);
                    callback(estimated || null);
                    return;
                }
                
                if (!Lampa.Parser || typeof Lampa.Parser.get !== 'function') {
                    console.log('[Studios5] Lampa.Parser not available, using year fallback');
                    var normalized = studiosNormalizeCardForQuality(cardData);
                    var estimated = studiosEstimateFallbackQuality(normalized, cardData);
                    callback(estimated || null);
                    return;
                }
                
                var title = cardData.title || cardData.name || 'Неизвестно';
                var year = ((cardData.first_air_date || cardData.release_date || '0000') + '').slice(0, 4);
                var searchQuery = {
                    df: cardData.original_title,
                    df_year: cardData.original_title + ' ' + year,
                    df_lg: cardData.original_title + ' ' + cardData.title,
                    df_lg_year: cardData.original_title + ' ' + cardData.title + ' ' + year,
                    lg: cardData.title,
                    lg_year: cardData.title + ' ' + year,
                    lg_df: cardData.title + ' ' + cardData.original_title,
                    lg_df_year: cardData.title + ' ' + cardData.original_title + ' ' + year
                }[Lampa.Storage.get('parse_lang', 'ru')] || cardData.title;
                
                console.log('[Studios5] Searching with query:', searchQuery);
                
                Lampa.Parser.get({
                    search: searchQuery,
                    movie: cardData,
                    page: 1
                }, function(data) {
                    console.log('[Studios5] Parser response:', data);
                    
                    if (!data || !data.Results || data.Results.length === 0) {
                        console.log('[Studios5] No results from parser, using year fallback');
                        var normalized = studiosNormalizeCardForQuality(cardData);
                        var estimated = studiosEstimateFallbackQuality(normalized, cardData);
                        callback(estimated || null);
                        return;
                    }
                    
                    var resolutions = new Set();
                    var hdr = new Set();
                    var audio = new Set();
                    var hasDub = false;
                    
                    console.log('[Studios5] Processing', data.Results.length, 'results');
                    
                    data.Results.forEach(function(result) {
                        if (result.ffprobe && Array.isArray(result.ffprobe)) {
                            var videoInfo = function(ffprobeData) {
                                if (!ffprobeData || !Array.isArray(ffprobeData)) return null;
                                
                                var info = {
                                    resolution: null,
                                    hdr: false,
                                    dolbyVision: false,
                                    audio: null
                                };
                                
                                var videoTrack = ffprobeData.find(function(track) {
                                    return track.codec_type === 'video';
                                });
                                
                                if (videoTrack) {
                                    if (videoTrack.width && videoTrack.height) {
                                        info.resolution = videoTrack.width + 'x' + videoTrack.height;
                                        
                                        if (videoTrack.height >= 2160 || videoTrack.width >= 3840) {
                                            info.resolutionLabel = '4K';
                                        } else if (videoTrack.height >= 1440 || videoTrack.width >= 2560) {
                                            info.resolutionLabel = '2K';
                                        } else if (videoTrack.height >= 1080 || videoTrack.width >= 1920) {
                                            info.resolutionLabel = 'FULL HD';
                                        } else if (videoTrack.height >= 720 || videoTrack.width >= 1280) {
                                            info.resolutionLabel = 'HD';
                                        }
                                    }
                                    
                                    if (videoTrack.side_data_list) {
                                        var hasMastering = videoTrack.side_data_list.some(function(item) {
                                            return item.side_data_type === 'Mastering display metadata';
                                        });
                                        var hasContentLight = videoTrack.side_data_list.some(function(item) {
                                            return item.side_data_type === 'Content light level metadata';
                                        });
                                        
                                        if (videoTrack.side_data_list.some(function(item) {
                                            return item.side_data_type === 'DOVI configuration record' || item.side_data_type === 'Dolby Vision RPU';
                                        })) {
                                            info.dolbyVision = true;
                                            info.hdr = true;
                                        } else if (hasMastering || hasContentLight) {
                                            info.hdr = true;
                                        }
                                    }
                                    
                                    if (!info.hdr && videoTrack.color_transfer && ['smpte2084', 'arib-std-b67'].includes(videoTrack.color_transfer.toLowerCase())) {
                                        info.hdr = true;
                                    }
                                    
                                    if (!info.dolbyVision && videoTrack.codec_name && (videoTrack.codec_name.toLowerCase().includes('dovi') || videoTrack.codec_name.toLowerCase().includes('dolby'))) {
                                        info.dolbyVision = true;
                                        info.hdr = true;
                                    }
                                }
                                
                                var audioTracks = ffprobeData.filter(function(track) {
                                    return track.codec_type === 'audio';
                                });
                                
                                var maxChannels = 0;
                                audioTracks.forEach(function(track) {
                                    if (track.channels && track.channels > maxChannels) {
                                        maxChannels = track.channels;
                                    }
                                });
                                
                                if (maxChannels >= 8) {
                                    info.audio = '7.1';
                                } else if (maxChannels >= 6) {
                                    info.audio = '5.1';
                                } else if (maxChannels >= 4) {
                                    info.audio = '4.0';
                                } else if (maxChannels >= 2) {
                                    info.audio = '2.0';
                                }
                                
                                return info;
                            }(result.ffprobe);
                            
                            if (videoInfo) {
                                if (videoInfo.resolutionLabel) {
                                    resolutions.add(videoInfo.resolutionLabel);
                                }
                                if (videoInfo.audio) {
                                    audio.add(videoInfo.audio);
                                }
                            }
                            
                            if (!hasDub) {
                                result.ffprobe.filter(function(track) {
                                    return track.codec_type === 'audio' && track.tags;
                                }).forEach(function(track) {
                                    var language = (track.tags.language || '').toLowerCase();
                                    var trackTitle = (track.tags.title || track.tags.handler_name || '').toLowerCase();
                                    
                                    if (language === 'rus' || language === 'ru' || language === 'russian') {
                                        if (trackTitle.includes('dub') || trackTitle.includes('дубляж') || trackTitle.includes('дублир') || trackTitle === 'd') {
                                            hasDub = true;
                                        }
                                    }
                                });
                            }
                        }
                        
                        var titleLower = result.Title.toLowerCase();
                        if (titleLower.includes('dolby vision') || titleLower.includes('dovi') || titleLower.match(/\bdv\b/)) {
                            hdr.add('Dolby Vision');
                        }
                        if (titleLower.includes('hdr10+')) {
                            hdr.add('HDR10+');
                        }
                        if (titleLower.includes('hdr10')) {
                            hdr.add('HDR10');
                        }
                        if (titleLower.includes('hdr')) {
                            hdr.add('HDR');
                        }
                    });
                    
                    console.log('[Studios5] Resolutions found:', Array.from(resolutions));
                    console.log('[Studios5] Audio found:', Array.from(audio));
                    
                    var result = {
                        title: title,
                        torrents_found: data.Results.length,
                        quality: null,
                        dv: false,
                        hdr: false,
                        hdr_type: null,
                        sound: null,
                        dub: hasDub
                    };
                    
                    if (resolutions.size > 0) {
                        var qualityPriority = ['8K', '4K', '2K', 'FULL HD', 'HD'];
                        for (var i = 0; i < qualityPriority.length; i++) {
                            if (resolutions.has(qualityPriority[i])) {
                                result.quality = qualityPriority[i];
                                break;
                            }
                        }
                    }
                    
                    console.log('[Studios5] Final quality result:', result.quality);
                    
                    if (result.quality) {
                        callback({ code: result.quality, label: result.quality, fromParser: true });
                    } else {
                        console.log('[Studios5] No quality from parser, using year fallback');
                        var normalized = studiosNormalizeCardForQuality(cardData);
                        var estimated = studiosEstimateFallbackQuality(normalized, cardData);
                        callback(estimated || null);
                    }
                });
                
            } catch (e) {
                console.error('[Studios5] studiosResolveRealQuality error:', e);
                var normalized = studiosNormalizeCardForQuality(cardData);
                var estimated = studiosEstimateFallbackQuality(normalized, cardData);
                callback(estimated || null);
            }
        }

        function forceQualityBadgeStyles() {
            // No card badges
        }

        // ====== Функции для отображения качества в детальной карточке ======
        function updateQualityElement(text, render) {
            if (!render) return;
            var rateLine = $('.full-start-new__rate-line', render);
            if (!rateLine.length) return;
            var element = $('.full-start__status.maxsm-quality', render);
            if (element.length) element.text(text);
            else {
                var div = document.createElement('div');
                div.className = 'full-start__status maxsm-quality';
                div.textContent = text;
                rateLine.append(div);
            }
        }

        function syncQualityFromJacred(card, render) {
            if (!render) return;
            if (localStorage.getItem('maxsm_ratings_quality') !== 'true') return;
            var type = getCardType(card);
            if (type === 'tv' && localStorage.getItem('maxsm_ratings_quality_tv') === 'false') return;
            if (!window.FLIXIO_GET_BEST_JACRED) return;
            updateQualityElement('...', render);
            window.FLIXIO_GET_BEST_JACRED(card, function (data) {
                if (!data || data.empty) return;
                var resText = data.resolution || '';
                if (resText === 'FHD') resText = '1080p';
                else if (resText === 'HD') resText = '720p';
                else if (resText === '4K') resText = '4K';
                else if (resText === '2K') resText = '2K';
                if (!resText) return;
                if (data.hdr) resText = resText + (data.dolbyVision ? ' DV' : ' HDR');
                updateQualityElement(resText, render);
            });
        }

        // ====== Полная карточка: рейтинги и качество ======
        var maxsmRatingsIntegrated = false;

        function getCardType(card) {
            var type = card.media_type || card.type;
            if (type === 'movie' || type === 'tv') return type;
            return (card.name || card.original_name) ? 'tv' : 'movie';
        }

        function fetchTmdbDetails(movie, callback) {
            if (!movie || !movie.id) return callback(movie);
            var type = movie.name ? 'tv' : 'movie';
            var lang = 'ru';
            var url = Lampa.TMDB.api(type + '/' + movie.id + '?api_key=' + getTmdbKey() + '&language=' + lang);
            $.get(url, function (data) {
                if (!data) return callback(movie);
                var merged = $.extend(true, {}, movie, data);
                callback(merged);
            }).fail(function () {
                callback(movie);
            });
        }

        function fetchAdditionalRatings(card, render) {
            if (!render || !card || !card.id) return;
            var localCurrentCard = card.id;

            var normalizedCard = {
                id: card.id,
                tmdb: card.vote_average || null,
                kinopoisk_id: card.kinopoisk_id,
                imdb_id: card.imdb_id || card.imdb || null,
                title: card.title || card.name || '',
                original_title: card.original_title || card.original_name || '',
                type: getCardType(card),
                release_date: card.release_date || card.first_air_date || ''
            };

            // Вставляем блок рейтингов, если его нет
            var rateLine = $('.full-start-new__rate-line', render);
            if (!rateLine.length) {
                var rateWrap = $('<div class="full-start-new__rate-line"></div>');
                rateWrap.append('<div class="full-start__rate rate--tmdb"><div></div><div class="source--name">TMDB</div></div>');
                rateWrap.append('<div class="full-start__rate rate--imdb hide"><div></div><div class="source--name">IMDb</div></div>');
                rateWrap.append('<div class="full-start__rate rate--kp hide"><div></div><div class="source--name">Кинопоиск</div></div>');
                rateWrap.append('<div class="full-start__status hide"></div>');
                
                var insertPoint = render.find('.full-start-new__title').first();
                if (insertPoint.length) {
                    rateWrap.insertAfter(insertPoint);
                } else {
                    render.find('.full-start-new__right').prepend(rateWrap);
                }
                rateLine = rateWrap;
            }

            if (rateLine.length) {
                var tmdbEl = $('.rate--tmdb', render);
                if (tmdbEl.length && normalizedCard.tmdb && !isNaN(normalizedCard.tmdb)) {
                    tmdbEl.removeClass('hide').find('> div').eq(0).text(parseFloat(normalizedCard.tmdb).toFixed(1));
                }
                rateLine.addClass('done');
            }

            // Качество
            syncQualityFromJacred(card, render);

            // Загружаем остальные рейтинги через MaxSM Ratings, если он не загружен
            if (!maxsmRatingsIntegrated && typeof initMaxsmRatingsIntegration === 'function') {
                maxsmRatingsIntegrated = true;
                initMaxsmRatingsIntegration();
                setTimeout(function() {
                    if (window.maxsmRatingsPlugin && Lampa.Activity && Lampa.Activity.active) {
                        var act = Lampa.Activity.active();
                        if (act && act.component === 'full') {
                            var renderEl = act.activity && act.activity.render && act.activity.render();
                            if (renderEl) {
                                fetchTmdbDetails(card, function(m) {
                                    if (window.maxsmRatingsPlugin && typeof window.maxsmRatingsPlugin.updateFullCard === 'function') {
                                        window.maxsmRatingsPlugin.updateFullCard(m, renderEl);
                                    }
                                });
                            }
                        }
                    }
                }, 500);
            }
        }

        // Экспортируем функцию для MaxSM Ratings
        window.FLIXIO_GET_BEST_JACRED = getBestJacred;

        // Наблюдатель за карточками (только для качества на детальной странице, без бейджей на постерах)
        var fullPageProcessed = false;
        
        function initFullCardMarks() {
            if (!Lampa.Listener || !Lampa.Listener.follow) return;
            Lampa.Listener.follow('full', function (e) {
                if (e.type !== 'complite') return;
                var render = e.object && e.object.activity && e.object.activity.render && e.object.activity.render();
                var movie = e.data && e.data.movie;
                if (render && movie) {
                    // Удаляем стандартные бейджи click_theme.js
                    setTimeout(function() {
                        var badges = document.querySelectorAll('.click-quality, .click-quality-full, .full-start__status.click-quality-full');
                        for (var i = 0; i < badges.length; i++) badges[i].remove();
                    }, 200);
                    
                    fetchAdditionalRatings(movie, render);
                    
                    // Перемещаем реакции под рейтинги
                    setTimeout(function() {
                        var reactions = render.find('.full-start-new__reactions');
                        var rateLine = render.find('.full-start-new__rate-line');
                        if (reactions.length && rateLine.length) {
                            reactions.insertAfter(rateLine);
                            reactions.css({
                                'display': 'flex',
                                'flex-direction': 'row',
                                'justify-content': 'flex-start',
                                'align-items': 'center',
                                'gap': '0.5em',
                                'margin-top': '0.5em'
                            });
                            reactions.find('.reaction').css({
                                'margin': '0'
                            });
                        }
                    }, 300);
                }
            });
        }

        initFullCardMarks();
    }

    // =================================================================
    // MAXSM RATINGS INTEGRATION
    // =================================================================

    function initMaxsmRatingsIntegration() {
        if (window.maxsmRatingsPlugin) return;
        if (typeof Lampa === 'undefined') return;

        // Определяем глобальную функцию для обновления полной карточки
        window.maxsmRatingsPlugin = {
            updateFullCard: function(movie, renderEl) {
                if (!renderEl || !movie) return;
                // Здесь будет логика обновления рейтингов, если потребуется
            }
        };

        // Добавляем CSS для рейтингов
        if (!document.getElementById('maxsm_ratings_css')) {
            var style = document.createElement('style');
            style.id = 'maxsm_ratings_css';
            style.textContent = '.full-start-new__rate-line{display:flex;flex-wrap:wrap;column-gap:.22em;row-gap:.22em}.full-start-new__rate-line>*{margin:0!important}.full-start-new__rate-line .full-start__rate{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;gap:.28em!important;margin:0!important;width:auto!important}.full-start-new__rate-line .full-start__rate.hide{display:none!important}.full-start-new__rate-line .full-start__rate>div{margin:0!important}.full-start__rate>div:last-child{padding:.2em .35em}.rate--green{color:#4caf50}.rate--lime{color:#cddc39}.rate--orange{color:#ff9800}.rate--red{color:#f44336}.rate--gold{color:gold}.rate--icon{height:1.8em}.maxsm-quality{min-width:2.8em;text-align:center}';
            document.head.appendChild(style);
        }

        if (!localStorage.getItem('maxsm_ratings_quality')) localStorage.setItem('maxsm_ratings_quality', 'true');
        if (!localStorage.getItem('maxsm_ratings_quality_inlist')) localStorage.setItem('maxsm_ratings_quality_inlist', 'true');
        if (!localStorage.getItem('maxsm_ratings_quality_tv')) localStorage.setItem('maxsm_ratings_quality_tv', 'true');
    }

    // =================================================================
    // APPLE TV FULL CARD
    // =================================================================

    function initAppleTvFullCardBuiltIn() {
        if (window.FLIXIO_APPLETV_BUILTIN) return;
        window.FLIXIO_APPLETV_BUILTIN = true;
        if (!Lampa.Template || !Lampa.Template.add) return;

        var full_start_new_html = `<div class="full-start-new applecation">\n        <div class="full-start-new__body">\n            <div class="full-start-new__left hide">\n                <div class="full-start-new__poster">\n                    <img class="full-start-new__img full--poster" />\n                </div>\n            </div>\n\n            <div class="full-start-new__right">\n                <div class="applecation__left">\n                    <div class="applecation__logo"></div>\n                    \n                    <div class="applecation__content-wrapper">\n                        <div class="full-start-new__title" style="display: none;">{title}</div>\n                        \n                        <div class="applecation__meta">\n                            <div class="applecation__meta-left">\n                                <span class="applecation__network"></span>\n                                <span class="applecation__meta-text"></span>\n                                <div class="full-start__pg hide"></div>\n                            </div>\n                        </div>\n                        \n                        <div class="applecation__description-wrapper">\n                            <div class="applecation__description"></div>\n                        </div>\n                        <div class="applecation__info"></div>\n                    </div>\n                    \n                    <div class="full-start-new__head" style="display: none;"></div>\n                    <div class="full-start-new__details" style="display: none;"></div>\n\n                    <div class="full-start-new__buttons">\n                        <div class="full-start__button selector button--play">\n                            <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <circle cx="14" cy="14.5" r="13" stroke="currentColor" stroke-width="2.7"/>\n                                <path d="M18.0739 13.634C18.7406 14.0189 18.7406 14.9811 18.0739 15.366L11.751 19.0166C11.0843 19.4015 10.251 18.9204 10.251 18.1506L10.251 10.8494C10.251 10.0796 11.0843 9.5985 11.751 9.9834L18.0739 13.634Z" fill="currentColor"/>\n                            </svg>\n                            <span>#{title_watch}</span>\n                        </div>\n\n                        <div class="full-start__button selector button--book">\n                            <svg width="21" height="32" viewBox="0 0 21 32" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <path d="M2 1.5H19C19.2761 1.5 19.5 1.72386 19.5 2V27.9618C19.5 28.3756 19.0261 28.6103 18.697 28.3595L12.6212 23.7303C11.3682 22.7757 9.63183 22.7757 8.37885 23.7303L2.30302 28.3595C1.9739 28.6103 1.5 28.3756 1.5 27.9618V2C1.5 1.72386 1.72386 1.5 2 1.5Z" stroke="currentColor" stroke-width="2.5"/>\n                            </svg>\n                            <span>#{settings_input_links}</span>\n                        </div>\n\n                        <div class="full-start__button selector button--reaction">\n                            <svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <path d="M37.208 10.9742C37.1364 10.8013 37.0314 10.6441 36.899 10.5117C36.7666 10.3794 36.6095 10.2744 36.4365 10.2028L12.0658 0.108375C11.7166 -0.0361828 11.3242 -0.0361227 10.9749 0.108542C10.6257 0.253206 10.3482 0.530634 10.2034 0.879836L0.108666 25.2507C0.0369593 25.4236 3.37953e-05 25.609 2.3187e-08 25.7962C-3.37489e-05 25.9834 0.0368249 26.1688 0.108469 26.3418C0.180114 26.5147 0.28514 26.6719 0.417545 26.8042C0.54995 26.9366 0.707139 27.0416 0.880127 27.1131L17.2452 33.8917C17.5945 34.0361 17.9869 34.0361 18.3362 33.8917L29.6574 29.2017C29.8304 29.1301 29.9875 29.0251 30.1199 28.8928C30.2523 28.7604 30.3573 28.6032 30.4289 28.4303L37.2078 12.065C37.2795 11.8921 37.3164 11.7068 37.3164 11.5196C37.3165 11.3325 37.2796 11.1471 37.208 10.9742ZM20.425 29.9407L21.8784 26.4316L25.3873 27.885L20.425 29.9407ZM28.3407 26.0222L21.6524 23.252C21.3031 23.1075 20.9107 23.1076 20.5615 23.2523C20.2123 23.3969 19.9348 23.6743 19.79 24.0235L17.0194 30.7123L3.28783 25.0247L12.2918 3.28773L34.0286 12.2912L28.3407 26.0222Z" fill="currentColor"/>\n                                <path d="M25.3493 16.976L24.258 14.3423L16.959 17.3666L15.7196 14.375L13.0859 15.4659L15.4161 21.0916L25.3493 16.976Z" fill="currentColor"/>\n                            </svg>\n                            <span>#{title_reactions}</span>\n                        </div>\n\n                        <div class="full-start__button selector button--subscribe hide">\n                            <svg width="25" height="30" viewBox="0 0 25 30" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <path d="M6.01892 24C6.27423 27.3562 9.07836 30 12.5 30C15.9216 30 18.7257 27.3562 18.981 24H15.9645C15.7219 25.6961 14.2632 27 12.5 27C10.7367 27 9.27804 25.6961 9.03542 24H6.01892Z" fill="currentColor"/>\n                                <path d="M3.81972 14.5957V10.2679C3.81972 5.41336 7.7181 1.5 12.5 1.5C17.2819 1.5 21.1803 5.41336 21.1803 10.2679V14.5957C21.1803 15.8462 21.5399 17.0709 22.2168 18.1213L23.0727 19.4494C24.2077 21.2106 22.9392 23.5 20.9098 23.5H4.09021C2.06084 23.5 0.792282 21.2106 1.9273 19.4494L2.78317 18.1213C3.46012 17.0709 3.81972 15.8462 3.81972 14.5957Z" stroke="currentColor" stroke-width="2.5"/>\n                            </svg>\n                            <span>#{title_subscribe}</span>\n                        </div>\n\n                        <div class="full-start__button selector button--options">\n                            <svg width="38" height="10" viewBox="0 0 38 10" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <circle cx="4.88968" cy="4.98563" r="4.75394" fill="currentColor"/>\n                                <circle cx="18.9746" cy="4.98563" r="4.75394" fill="currentColor"/>\n                                <circle cx="33.0596" cy="4.98563" r="4.75394" fill="currentColor"/>\n                            </svg>\n                        </div>\n                    </div>\n                </div>\n\n                <div class="applecation__right">\n                    <div class="full-start-new__reactions selector">\n                        <div>#{reactions_none}</div>\n                    </div>\n                </div>\n            </div>\n        </div>\n\n        <div class="hide buttons--container">\n            <div class="full-start__button view--torrent hide">\n                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">\n                    <path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z" fill="currentColor"/>\n                </svg>\n                <span>#{full_torrents}</span>\n            </div>\n\n            <div class="full-start__button selector view--trailer">\n                <svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">\n                    <path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z" fill="currentColor"></path>\n                </svg>\n                <span>#{full_trailers}</span>\n            </div>\n        </div>\n    </div>`;

        Lampa.Template.add('full_start_new', full_start_new_html);

        if (!document.getElementById('flixio_applecation_css')) {
            var cssRaw =
                String.raw`<style id="flixio_applecation_css">` +
                String.raw`\n\n/* Основной контейнер */\n.applecation {\n    transition: all .3s;\n}\n\n.applecation .full-start-new__body {\n    height: 80vh;\n}\n\n.applecation .full-start-new__right {\n    display: flex;\n    align-items: flex-end;\n}\n\n.applecation .full-start-new__title {\n    font-size: 2.5em;\n    font-weight: 700;\n    line-height: 1.2;\n    margin-bottom: 0.5em;\n    text-shadow: 0 0 .1em rgba(0, 0, 0, 0.3);\n}\n\n/* Логотип */\n.applecation__logo {\n    margin-bottom: 0.5em;\n    opacity: 0;\n    transform: translateY(20px);\n    transition: opacity 0.4s ease-out, transform 0.4s ease-out;\n}\n\n.applecation__logo.loaded {\n    opacity: 1;\n    transform: translateY(0);\n}\n\n.applecation__logo img {\n    display: block;\n    max-width: 35vw;\n    max-height: 180px;\n    width: auto;\n    height: auto;\n    object-fit: contain;\n    object-position: left center;\n}\n\n/* Контейнер для масштабируемого контента */\n.applecation__content-wrapper {\n    font-size: 100%;\n}\n\n/* Мета информация */\n.applecation__meta {\n    display: flex;\n    align-items: center;\n    color: #fff;\n    font-size: 1.1em;\n    margin-bottom: 0.5em;\n    line-height: 1;\n    opacity: 0;\n    transform: translateY(15px);\n    transition: opacity 0.4s ease-out, transform 0.4s ease-out;\n    transition-delay: 0.05s;\n}\n\n.applecation__meta.show {\n    opacity: 1;\n    transform: translateY(0);\n}\n\n.applecation__meta-left {\n    display: flex;\n    align-items: center;\n    line-height: 1;\n}\n\n.applecation__network {\n    display: inline-flex;\n    align-items: center;\n    line-height: 1;\n}\n\n.applecation__network img {\n    display: block;\n    max-height: 0.8em;\n    width: auto;\n    object-fit: contain;\n    filter: brightness(0) invert(1);\n}\n\n.applecation__meta-text {\n    margin-left: 1em;\n    line-height: 1;\n}\n\n.applecation__meta .full-start__pg {\n    margin: 0 0 0 0.6em;\n    padding: 0.2em 0.5em;\n    font-size: 0.85em;\n    font-weight: 600;\n    border: 1.5px solid rgba(255, 255, 255, 0.4);\n    border-radius: 0.3em;\n    background: rgba(255, 255, 255, 0.1);\n    color: rgba(255, 255, 255, 0.9);\n    line-height: 1;\n    vertical-align: middle;\n}\n\n/* Рейтинги */\n.applecation__ratings {\n    display: flex;\n    align-items: center;\n    gap: 0.8em;\n    margin-bottom: 0.5em;\n    opacity: 0;\n    transform: translateY(15px);\n    transition: opacity 0.4s ease-out, transform 0.4s ease-out;\n    transition-delay: 0.08s;\n}\n\n.applecation__ratings.show {\n    opacity: 1;\n    transform: translateY(0);\n}\n\n.applecation__ratings .rate--imdb,\n.applecation__ratings .rate--kp {\n    display: flex;\n    align-items: center;\n    gap: 0.35em;\n}\n\n.applecation__ratings svg {\n    width: 1.8em;\n    height: auto;\n    flex-shrink: 0;\n    color: rgba(255, 255, 255, 0.85);\n}\n\n.applecation__ratings .rate--kp svg {\n    width: 1.5em;\n}\n\n.applecation__ratings > div > div {\n    font-size: 0.95em;\n    font-weight: 600;\n    line-height: 1;\n    color: #fff;\n}\n\n/* Обертка для описания */\n.applecation__description-wrapper {\n    background-color: transparent;\n    padding: 0;\n    border-radius: 1em;\n    width: fit-content;\n    opacity: 0;\n    transform: translateY(15px);\n    transition:\n        padding 0.25s ease,\n        transform 0.25s ease,\n        opacity 0.4s ease-out;\n    transition-delay: 0.1s;\n}\n\n.applecation__description-wrapper.show {\n    opacity: 1;\n    transform: translateY(0);\n}\n\n.applecation__description-wrapper.focus {\n    background: linear-gradient(\n        135deg,\n        rgba(255, 255, 255, 0.28),\n        rgba(255, 255, 255, 0.18)\n    );\n    padding: .15em .4em 0 .7em;\n    border-radius: 1em;\n    width: fit-content;\n    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);\n    transform: scale(1.07) translateY(0);\n    transition-delay: 0s;\n}\n\n/* Описание */\n.applecation__description {\n    color: rgba(255, 255, 255, 0.6);\n    font-size: 0.95em;\n    line-height: 1.5;\n    margin-bottom: 0.5em;\n    max-width: 35vw;\n    display: -webkit-box;\n    -webkit-line-clamp: 4;\n    -webkit-box-orient: vertical;\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n\n.focus .applecation__description {\n    color: rgba(255, 255, 255, 0.92);\n}\n\n/* Дополнительная информация (Год/длительность) */\n.applecation__info {\n    color: rgba(255, 255, 255, 0.75);\n    font-size: 1em;\n    line-height: 1.4;\n    margin-bottom: 0.5em;\n    opacity: 0;\n    transform: translateY(15px);\n    transition: opacity 0.4s ease-out, transform 0.4s ease-out;\n    transition-delay: 0.15s;\n}\n\n.applecation__info.show {\n    opacity: 1;\n    transform: translateY(0);\n}\n\n/* Левая и правая части */\n.applecation__left {\n    flex-grow: 1;\n}\n\n.applecation__right {\n    display: flex;\n    align-items: center;\n    flex-shrink: 0;\n    position: relative;\n}\n\n/* Реакции - под рейтингами */\n.applecation .full-start-new__reactions {\n    display: flex !important;\n    flex-direction: row !important;\n    flex-wrap: wrap !important;\n    justify-content: flex-start !important;\n    align-items: center !important;\n    gap: 0.5em !important;\n    margin-top: 0.5em !important;\n}\n\n.applecation .full-start-new__reactions > div {\n    display: block !important;\n}\n\n.applecation .full-start-new__reactions .reaction {\n    margin: 0 !important;\n}\n\n/* Скрываем стандартный rate-line */\n.applecation .full-start-new__rate-line:not(.applecation__ratings) {\n    margin: 0;\n    height: 0;\n    overflow: hidden;\n    opacity: 0;\n    pointer-events: none;\n}\n\n/* Фоновый оверлей */\n.full-start__background {\n    height: calc(100% + 6em);\n    left: 0 !important;\n    opacity: 0 !important;\n    transition: opacity 0.6s ease-out, filter 0.3s ease-out !important;\n    animation: none !important;\n    transform: none !important;\n    will-change: opacity, filter;\n}\n\n.full-start__background.loaded:not(.dim) {\n    opacity: 1 !important;\n}\n\n.full-start__background.dim {\n    filter: blur(30px);\n}\n\n.full-start__background.loaded.applecation-animated {\n    opacity: 1 !important;\n}\n\nbody:not(.menu--open) .full-start__background {\n    mask-image: none;\n}\n\nbody.advanced--animation:not(.no--animation) .full-start__background.loaded {\n    animation: none !important;\n}\n\n.applecation .full-start__status {\n    display: none;\n}\n\n.applecation__overlay {\n    width: 90vw;\n    background: linear-gradient(to right, rgba(0, 0, 0, 0.792) 0%, rgba(0, 0, 0, 0.504) 25%, rgba(0, 0, 0, 0.264) 45%, rgba(0, 0, 0, 0.12) 55%, rgba(0, 0, 0, 0.043) 60%, rgba(0, 0, 0, 0) 65%);\n}\n\n/* Бейджи качества */\n.applecation__quality-badges {\n    display: inline-flex;\n    align-items: center;\n    gap: 0.4em;\n    margin-left: 0.6em;\n    opacity: 0;\n    transform: translateY(10px);\n    transition: opacity 0.3s ease-out, transform 0.3s ease-out;\n}\n\n.applecation__quality-badges.show {\n    opacity: 1;\n    transform: translateY(0);\n}\n\n.quality-badge {\n    display: inline-flex;\n    height: 0.8em;\n}\n\n.quality-badge svg {\n    height: 100%;\n    width: auto;\n    display: block;\n}\n\n</style>`;

            var css = cssRaw.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            $('body').append(css);
        }
    }

    function initAppleTvFullCardLogoRuntime() {
        if (window.FLIXIO_APPLETV_LOGO_RUNTIME) return;
        window.FLIXIO_APPLETV_LOGO_RUNTIME = true;
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
            setTimeout(function () {
                clearInterval(interval);
                callback();
            }, 2000);
        }

        function finalize(render) {
            render.find('.applecation__meta').addClass('show');
            render.find('.applecation__description-wrapper').addClass('show');
            render.find('.applecation__info').addClass('show');
            render.find('.full-start-new__rate-line.applecation__ratings').addClass('show');
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
            var lang = 'ru';
            var url = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=' + lang);
            var urlAll = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key());

            function logoSize() {
                var q = Lampa.Storage.get('applecation_poster_quality', 'medium');
                if (q === 'low') return 'w300';
                if (q === 'medium') return 'w500';
                if (q === 'high') return 'original';
                var posterSize = Lampa.Storage.field ? Lampa.Storage.field('poster_size') : null;
                return { w200: 'w300', w300: 'w500', w500: 'original' }[posterSize] || 'w500';
            }

            function applyLogoFromData(data) {
                if (done) return;
                if (!render.closest('body').length) return;

                var filePath = (data && data.logos && data.logos[0] && data.logos[0].file_path) ? data.logos[0].file_path : null;

                if (filePath) {
                    var imgUrl = Lampa.TMDB.image('/t/p/' + logoSize() + filePath);
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

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var activity = e.object && e.object.activity;
            if (!activity || !activity.render) return;
            var render = activity.render();
            if (!render || !render.length) return;
            if (!render.find('.applecation__logo, .full-start-new__title').length) return;

            var movie = e.data && e.data.movie;
            if (!movie || !movie.id) return;
            loadLogo(render, movie);
        });
    }

    function initAppleTvFullCardInfoRuntime() {
        if (window.FLIXIO_APPLETV_INFO_RUNTIME) return;
        window.FLIXIO_APPLETV_INFO_RUNTIME = true;
        if (!Lampa.Listener || !Lampa.Listener.follow) return;

        function typeLabel(movie) {
            var isTv = !!movie.name;
            return isTv ? 'Сериал' : 'Фильм';
        }

        function pluralSeasons(count) {
            if (count === 1) return count + ' сезон';
            if (count >= 2 && count <= 4) return count + ' сезона';
            return count + ' сезонов';
        }

        function insertOverlayBackground(render) {
            var bg = render.find('.full-start__background');
            if (bg.length && !bg.next('.applecation__overlay').length) {
                bg.after('<div class="full-start__background loaded applecation__overlay"></div>');
            }
        }

        function fillMeta(render, movie) {
            var metaText = render.find('.applecation__meta-text');
            if (metaText.length) {
                var parts = [];
                parts.push(typeLabel(movie));
                if (movie.genres && movie.genres.length) {
                    var g = movie.genres.slice(0, 2).map(function (x) { return Lampa.Utils.capitalizeFirstLetter(x.name); });
                    parts = parts.concat(g);
                }
                metaText.html(parts.join(' · '));
            }

            var networkNode = render.find('.applecation__network');
            if (networkNode.length) {
                networkNode.remove();
            }
        }

        function buildDescriptionOverlay(movie) {
            if (!Lampa.Storage.get('applecation_description_overlay', true)) return;
            var text = movie.overview || '';
            if (!text) return;

            $('.applecation-description-overlay').remove();

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
        }

        function attachDescriptionOverlay(render) {
            if (!Lampa.Storage.get('applecation_description_overlay', true)) {
                render.find('.applecation__description-wrapper').off('hover:enter');
                $('.applecation-description-overlay').remove();
                return;
            }

            var wrap = render.find('.applecation__description-wrapper');
            if (!wrap.length) return;
            wrap.off('hover:enter').on('hover:enter', function () {
                var overlay = $('.applecation-description-overlay');
                if (!overlay.length) return;
                setTimeout(function () { overlay.addClass('show'); }, 10);

                if (!overlay.data('controller-created') && Lampa.Controller) {
                    var ctrl = {
                        toggle: function () {
                            Lampa.Controller.collectionSet(overlay);
                            Lampa.Controller.collectionFocus(overlay.find('.applecation-description-overlay__content'), overlay);
                        },
                        back: function () {
                            var ol = $('.applecation-description-overlay');
                            if (!ol.length) return;
                            ol.removeClass('show');
                            setTimeout(function () { Lampa.Controller.toggle('content'); }, 300);
                        }
                    };
                    Lampa.Controller.add('applecation_description', ctrl);
                    overlay.data('controller-created', true);
                }

                if (Lampa.Controller) Lampa.Controller.toggle('applecation_description');
            });

            if (Lampa.Controller && Lampa.Controller.collectionAppend) {
                wrap.addClass('selector');
                Lampa.Controller.collectionAppend(wrap);
            }
        }

        function fillDescription(render, movie) {
            var description = render.find('.applecation__description');
            if (description.length) description.text(movie.overview || '');
            buildDescriptionOverlay(movie);
            attachDescriptionOverlay(render);
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
                    parts.push(m + ' м.');
                }

                var lastEpisode = movie.last_episode_to_air;
                if (lastEpisode && lastEpisode.season_number && lastEpisode.episode_number) {
                    var seasonNumber = lastEpisode.season_number;
                    var episodeNumber = lastEpisode.episode_number;
                    
                    var totalEpisodes = '?';
                    if (movie.seasons && Array.isArray(movie.seasons)) {
                        for (var i = 0; i < movie.seasons.length; i++) {
                            var season = movie.seasons[i];
                            if (season.season_number === seasonNumber && season.episode_count) {
                                totalEpisodes = season.episode_count;
                                break;
                            }
                        }
                    }
                    
                    parts.push(seasonNumber + ' сезон ' + episodeNumber + '/' + totalEpisodes + ' серий');
                } else {
                    var seasons = (typeof movie.number_of_seasons === 'number' && movie.number_of_seasons > 0) ? movie.number_of_seasons : (Lampa.Utils.countSeasons ? Lampa.Utils.countSeasons(movie) : 0);
                    if (seasons) parts.push(pluralSeasons(seasons));
                }
            } else if (movie.runtime && movie.runtime > 0) {
                var h = Math.floor(movie.runtime / 60);
                var mm = movie.runtime % 60;
                if (h > 0) parts.push(h + ' ч. ' + mm + ' м.');
                else parts.push(mm + ' м.');
            }

            info.html((parts.length ? parts.join(' · ') : '') + '<span class="applecation__quality-badges"></span>');
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

            render.find('.applecation__meta').addClass('show');
            render.find('.applecation__description-wrapper').addClass('show');
            render.find('.applecation__info').addClass('show');
            render.find('.full-start-new__rate-line.applecation__ratings').addClass('show');
        });
    }

    // =================================================================
    // SETTINGS
    // =================================================================

    function setupSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;

        Lampa.SettingsApi.addComponent({
            component: 'flixio_plugin',
            name: 'Flixio',
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="1.5"/><path d="M8 8h8v2H8V8zm0 4h6v2H8v-2zm0 4h8v2H8v-2z" fill="white"/><circle cx="3" cy="3" r="1" fill="white" opacity="0.6"/><circle cx="21" cy="3" r="1" fill="white" opacity="0.6"/><circle cx="3" cy="21" r="1" fill="white" opacity="0.6"/><circle cx="21" cy="21" r="1" fill="white" opacity="0.6"/><circle cx="12" cy="1" r="1" fill="white" opacity="0.7"/><circle cx="12" cy="23" r="1" fill="white" opacity="0.7"/><circle cx="1" cy="12" r="1" fill="white" opacity="0.7"/><circle cx="23" cy="12" r="1" fill="white" opacity="0.7"/></svg>'
        });

        // API TMDB
        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { type: 'title' },
            field: { name: 'API TMDB' }
        });

        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { name: 'flixio_tmdb_apikey', type: 'input', placeholder: 'Ключ TMDB (опционально)', values: '', default: '' },
            field: { name: 'Свой ключ TMDB', description: 'Если указать — плагин будет использовать его вместо ключа Лампы.' }
        });

        // Качество
        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { type: 'title' },
            field: { name: 'Качество' }
        });

        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { name: 'maxsm_ratings_quality', type: 'trigger', default: true },
            field: { name: 'Показывать качество на странице фильма', description: 'Отображать качество видео на детальной странице' }
        });

        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { name: 'maxsm_ratings_quality_tv', type: 'trigger', default: true },
            field: { name: 'Качество для сериалов', description: 'Показывать качество для сериалов' }
        });

        Lampa.SettingsApi.addParam({
            component: 'flixio_plugin',
            param: { name: 'maxsm_ratings_quality_inlist', type: 'trigger', default: true },
            field: { name: 'Качество на карточках', description: 'Показывать качество на карточках в списках' },
            onChange: function (value) {
                if (window.FLIXIO_TOGGLE_JACRED_CARD_MARKS) window.FLIXIO_TOGGLE_JACRED_CARD_MARKS(value === 'true');
            }
        });
    }

    // =================================================================
    // INIT FUNCTION
    // =================================================================
    function init() {
        setupSettings();

        Lampa.Component.add('studios_main', StudiosMain);
        Lampa.Component.add('studios_view', StudiosView);
        FlixioStudioSubscription.init();

        removeShotsSection();

        initMarksJacRed();
        initMaxsmRatingsIntegration();
        initAppleTvFullCardBuiltIn();
        initAppleTvFullCardLogoRuntime();
        initAppleTvFullCardInfoRuntime();

        window.FLIXIO_STUDIOS_LOADED = true;
    }

    function runInit() {
        try {
            init();
        } catch (err) {
            window.FLIXIO_STUDIOS_ERROR = (err && err.message) ? err.message : String(err);
            if (typeof console !== 'undefined' && console.error) {
                console.error('[Flixio Studios]', err);
            }
        }
    }

    if (window.appready) runInit();
    else if (typeof Lampa !== 'undefined' && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') runInit();
        });
    } else {
        window.FLIXIO_STUDIOS_ERROR = 'Lampa.Listener not found';
    }

})();