(function () {
    'use strict';

    window.THEME_A_VER = '4.0';
    window.THEME_A_LOADED = false;
    window.THEME_A_ERROR = null;

    if (typeof Lampa === 'undefined') {
        window.THEME_A_ERROR = 'Lampa not found';
        return;
    }

    // =================================================================
    // CONFIGURATION
    // =================================================================
    var THEME_A_BASE_URL = 'https://cdn.jsdelivr.net/gh/syvyj/studio_2@main/';
    var THEME_A_LANG = 'ru';

    function tr(key) {
        return key;
    }

    var SERVICE_CONFIGS = {
        'netflix': {
            title: 'Netflix',
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
        var custom = (Lampa.Storage.get('theme_a_tmdb_apikey') || '').trim();
        return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
    }

    // =================================================================
    // PLAYER HELPER
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
    // STUDIOS MAIN COMPONENT
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
    // STUDIO SUBSCRIPTION
    // =================================================================
    var ThemeAStudioSubscription = (function () {
        var storageKey = 'theme_a_subscription_studios';

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
            }
        };
    })();

    // =================================================================
    // REMOVE SHOTS SECTION
    // =================================================================
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
    // JACRED QUALITY MARKS
    // =================================================================
    var _jacredCache = {};
    var workingProxy = null;
    var proxies = [
        'https://myfinder.kozak-bohdan.workers.dev/?key=lmp_2026_JacRed_K9xP7aQ4mV2E&url=',
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?url='
    ];

    function fetchWithProxy(url, callback) {
        try {
            var network = new Lampa.Reguest();
            network.timeout(10000);
            network.silent(url, function (json) {
                var text = typeof json === 'string' ? json : JSON.stringify(json);
                workingProxy = 'direct';
                callback(null, text);
            }, function () {
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
                callback(new Error('No proxy worked'));
                return;
            }
            var p = proxyList[index];
            var target = p.indexOf('url=') > -1 ? p + encodeURIComponent(url) : p + url;

            var xhr = new XMLHttpRequest();
            xhr.open('GET', target, true);
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    workingProxy = p;
                    callback(null, xhr.responseText);
                } else {
                    tryProxy(index + 1);
                }
            };
            xhr.onerror = function () {
                tryProxy(index + 1);
            };
            xhr.timeout = 10000;
            xhr.ontimeout = function () {
                tryProxy(index + 1);
            };
            xhr.send();
        }
        tryProxy(0);
    }

    function getBestJacred(card, callback) {
        var cacheKey = 'jacred_v4_' + card.id;

        if (_jacredCache[cacheKey]) {
            callback(_jacredCache[cacheKey]);
            return;
        }

        try {
            var raw = Lampa.Storage.get(cacheKey, '');
            if (raw && typeof raw === 'object' && raw._ts && (Date.now() - raw._ts < 48 * 60 * 60 * 1000)) {
                _jacredCache[cacheKey] = raw;
                callback(raw);
                return;
            }
        } catch (e) { }

        var title = (card.original_title || card.title || card.name || '').toLowerCase();
        var year = (card.release_date || card.first_air_date || '').substr(0, 4);

        if (!title || !year) {
            callback(null);
            return;
        }

        var releaseDate = new Date(card.release_date || card.first_air_date);
        if (releaseDate && releaseDate.getTime() > Date.now()) {
            callback(null);
            return;
        }

        var apiUrl = 'https://jr.maxvol.pro/api/v1.0/torrents?search=' + encodeURIComponent(title) + '&year=' + year;

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
                    callback(null);
                    return;
                }

                if (parsed.contents) {
                    try {
                        parsed = JSON.parse(parsed.contents);
                    } catch (e) { }
                }

                var results = Array.isArray(parsed) ? parsed : (parsed.Results || []);

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

                    if (t.indexOf('rus') >= 0 || t.indexOf('russian') >= 0 || t.indexOf('рус') >= 0 || t.indexOf('рос') >= 0 ||
                        t.indexOf(' ru') >= 0 || t.indexOf('ru ') >= 0 || t.indexOf('[ru]') >= 0 || t.indexOf('(ru)') >= 0) {
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

                    if (videotype.indexOf('dolby') >= 0 || videotype.indexOf('dv') >= 0 || t.indexOf('dolby vision') >= 0) {
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
                callback(best);

            } catch (e) {
                callback(null);
            }
        });
    }

    // =================================================================
    // BADGES ON CARDS
    // =================================================================
    function getCardType(card) {
        var type = card.media_type || card.type;
        if (type === 'movie' || type === 'tv') return type;
        return (card.name || card.original_name) ? 'tv' : 'movie';
    }

    function createBadge(cssClass, label) {
        var badge = document.createElement('div');
        badge.classList.add('card__mark');
        badge.classList.add('card__mark--' + cssClass);
        badge.textContent = label;
        return badge;
    }

    var cardsObserver = null;

    function renderBadges(container, data, movie) {
        container.empty();
        if (data.rus && Lampa.Storage.get('theme_a_badge_ru', true)) container.append(createBadge('ru', 'RU'));
        if (data.ukr && Lampa.Storage.get('theme_a_badge_ua', true)) container.append(createBadge('ua', 'UA'));
        if (data.eng && Lampa.Storage.get('theme_a_badge_en', true)) container.append(createBadge('en', 'EN'));
        if (data.resolution && data.resolution !== 'SD') {
            if (data.resolution === '4K' && Lampa.Storage.get('theme_a_badge_4k', true)) container.append(createBadge('4k', '4K'));
            else if (data.resolution === 'FHD' && Lampa.Storage.get('theme_a_badge_fhd', true)) container.append(createBadge('fhd', 'FHD'));
            else if (data.resolution === 'HD' && Lampa.Storage.get('theme_a_badge_fhd', true)) container.append(createBadge('hd', 'HD'));
            else if (Lampa.Storage.get('theme_a_badge_fhd', true)) container.append(createBadge('hd', data.resolution));
        }
        if (data.hdr && Lampa.Storage.get('theme_a_badge_hdr', true)) container.append(createBadge('hdr', 'HDR'));
        if (movie) {
            var rating = parseFloat(movie.imdb_rating || movie.kp_rating || movie.vote_average || 0);
            if (rating > 0) {
                var rBadge = document.createElement('div');
                rBadge.classList.add('card__mark', 'card__mark--rating');
                rBadge.innerHTML = '<span class="mark-star">★</span>' + rating.toFixed(1);
                container.append(rBadge);
            }
        }
    }

    function processCards() {
        $('.card:not(.jacred-mark-processed-v2)').each(function () {
            var card = $(this);
            card.addClass('jacred-mark-processed-v2');

            var movie = card[0].heroMovieData || card.data('item') || (card[0] && (card[0].card_data || card[0].item)) || null;
            if (movie && movie.id && !movie.size) {
                var marksContainer = card.find('.card-marks');
                if (!marksContainer.length) {
                    marksContainer = $('<div class="card-marks"></div>');
                    card.find('.card__view').append(marksContainer);
                }
                getBestJacred(movie, function (data) {
                    if (!data) data = { empty: true };
                    renderBadges(marksContainer, data, movie);
                });
            }
        });
    }

    function observeCardRows() {
        if (cardsObserver) cardsObserver.disconnect();
        cardsObserver = new MutationObserver(function () {
            processCards();
        });
        cardsObserver.observe(document.body, { childList: true, subtree: true });
        processCards();
    }

    // =================================================================
    // FULL CARD RATINGS AND REACTIONS
    // =================================================================
    function studiosEstimateFallbackQuality(normalized, originalData) {
        var year = 0;
        if (normalized && normalized.release_date && normalized.release_date.length >= 4) {
            year = parseInt(normalized.release_date.substring(0, 4), 10);
        } else if (originalData && originalData.year) {
            var yearMatch = String(originalData.year).match(/(19|20)\d{2}/);
            if (yearMatch) year = parseInt(yearMatch[0], 10);
        }
        if (!year || isNaN(year)) return null;
        if (year >= 2023) return '4K';
        if (year >= 2020) return '1080p';
        if (year >= 2015) return '720p';
        return 'SD';
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
            }
        }
        return {
            id: data && (data.id || data.tmdb_id) || '',
            title: data && (data.title || data.name || '') || '',
            original_title: data && (data.original_title || data.original_name || '') || '',
            type: type,
            release_date: release_date
        };
    }

    function updateQualityElement(text, render) {
        if (!render) return;
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;
        var element = $('.full-start__status.theme-a-quality', render);
        if (element.length) element.text(text);
        else {
            var div = document.createElement('div');
            div.className = 'full-start__status theme-a-quality';
            div.textContent = text;
            rateLine.append(div);
        }
    }

    function syncQualityFromJacred(card, render) {
        if (!render) return;
        var type = getCardType(card);
        if (type === 'tv' && localStorage.getItem('theme_a_quality_tv') === 'false') return;
        
        updateQualityElement('...', render);
        getBestJacred(card, function (data) {
            if (!data || data.empty) {
                var fallback = studiosEstimateFallbackQuality(studiosNormalizeCardForQuality(card), card);
                if (fallback) updateQualityElement(fallback, render);
                return;
            }
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

    function fetchAdditionalRatings(card, render) {
        if (!render || !card || !card.id) return;

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

        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) {
            var rateWrap = $('<div class="full-start-new__rate-line"></div>');
            rateWrap.append('<div class="full-start__rate rate--tmdb"><div></div><div class="source--name">TMDB</div></div>');
            rateWrap.append('<div class="full-start__rate rate--imdb hide"><div></div><div class="source--name">IMDb</div></div>');
            rateWrap.append('<div class="full-start__rate rate--kp hide"><div></div><div class="source--name">Кинопоиск</div></div>');
            
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
        }

        syncQualityFromJacred(card, render);
        
        // Перемещаем реакции под рейтинги и делаем все видимыми
        setTimeout(function() {
            var reactions = render.find('.full-start-new__reactions');
            var rateLineEl = render.find('.full-start-new__rate-line');
            if (reactions.length && rateLineEl.length) {
                reactions.insertAfter(rateLineEl);
                reactions.css({
                    'display': 'flex',
                    'flex-direction': 'row',
                    'flex-wrap': 'wrap',
                    'justify-content': 'flex-start',
                    'align-items': 'center',
                    'gap': '0.5em',
                    'margin-top': '0.5em'
                });
                reactions.find('.reaction').css({
                    'margin': '0'
                });
                reactions.find('.reaction__icon').css({
                    'width': '2.2em',
                    'height': '2.2em'
                });
            }
        }, 300);
    }

    // =================================================================
    // APPLE TV FULL CARD STYLES
    // =================================================================
    function initAppleTvFullCard() {
        if (window.THEME_A_APPLETV_BUILTIN) return;
        window.THEME_A_APPLETV_BUILTIN = true;
        if (!Lampa.Template || !Lampa.Template.add) return;

        var full_start_new_html = `<div class="full-start-new applecation">\n        <div class="full-start-new__body">\n            <div class="full-start-new__left hide">\n                <div class="full-start-new__poster">\n                    <img class="full-start-new__img full--poster" />\n                </div>\n            </div>\n\n            <div class="full-start-new__right">\n                <div class="applecation__left">\n                    <div class="applecation__logo"></div>\n                    \n                    <div class="applecation__content-wrapper">\n                        <div class="full-start-new__title" style="display: none;">{title}</div>\n                        \n                        <div class="applecation__meta">\n                            <div class="applecation__meta-left">\n                                <span class="applecation__network"></span>\n                                <span class="applecation__meta-text"></span>\n                                <div class="full-start__pg hide"></div>\n                            </div>\n                        </div>\n                        \n                        <div class="applecation__description-wrapper">\n                            <div class="applecation__description"></div>\n                        </div>\n                        <div class="applecation__info"></div>\n                    </div>\n                    \n                    <div class="full-start-new__head" style="display: none;"></div>\n                    <div class="full-start-new__details" style="display: none;"></div>\n\n                    <div class="full-start-new__buttons">\n                        <div class="full-start__button selector button--play">\n                            <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <circle cx="14" cy="14.5" r="13" stroke="currentColor" stroke-width="2.7"/>\n                                <path d="M18.0739 13.634C18.7406 14.0189 18.7406 14.9811 18.0739 15.366L11.751 19.0166C11.0843 19.4015 10.251 18.9204 10.251 18.1506L10.251 10.8494C10.251 10.0796 11.0843 9.5985 11.751 9.9834L18.0739 13.634Z" fill="currentColor"/>\n                            </svg>\n                            <span>#{title_watch}</span>\n                        </div>\n\n                        <div class="full-start__button selector button--book">\n                            <svg width="21" height="32" viewBox="0 0 21 32" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <path d="M2 1.5H19C19.2761 1.5 19.5 1.72386 19.5 2V27.9618C19.5 28.3756 19.0261 28.6103 18.697 28.3595L12.6212 23.7303C11.3682 22.7757 9.63183 22.7757 8.37885 23.7303L2.30302 28.3595C1.9739 28.6103 1.5 28.3756 1.5 27.9618V2C1.5 1.72386 1.72386 1.5 2 1.5Z" stroke="currentColor" stroke-width="2.5"/>\n                            </svg>\n                            <span>#{settings_input_links}</span>\n                        </div>\n\n                        <div class="full-start__button selector button--reaction">\n                            <svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <path d="M37.208 10.9742C37.1364 10.8013 37.0314 10.6441 36.899 10.5117C36.7666 10.3794 36.6095 10.2744 36.4365 10.2028L12.0658 0.108375C11.7166 -0.0361828 11.3242 -0.0361227 10.9749 0.108542C10.6257 0.253206 10.3482 0.530634 10.2034 0.879836L0.108666 25.2507C0.0369593 25.4236 3.37953e-05 25.609 2.3187e-08 25.7962C-3.37489e-05 25.9834 0.0368249 26.1688 0.108469 26.3418C0.180114 26.5147 0.28514 26.6719 0.417545 26.8042C0.54995 26.9366 0.707139 27.0416 0.880127 27.1131L17.2452 33.8917C17.5945 34.0361 17.9869 34.0361 18.3362 33.8917L29.6574 29.2017C29.8304 29.1301 29.9875 29.0251 30.1199 28.8928C30.2523 28.7604 30.3573 28.6032 30.4289 28.4303L37.2078 12.065C37.2795 11.8921 37.3164 11.7068 37.3164 11.5196C37.3165 11.3325 37.2796 11.1471 37.208 10.9742ZM20.425 29.9407L21.8784 26.4316L25.3873 27.885L20.425 29.9407ZM28.3407 26.0222L21.6524 23.252C21.3031 23.1075 20.9107 23.1076 20.5615 23.2523C20.2123 23.3969 19.9348 23.6743 19.79 24.0235L17.0194 30.7123L3.28783 25.0247L12.2918 3.28773L34.0286 12.2912L28.3407 26.0222Z" fill="currentColor"/>\n                                <path d="M25.3493 16.976L24.258 14.3423L16.959 17.3666L15.7196 14.375L13.0859 15.4659L15.4161 21.0916L25.3493 16.976Z" fill="currentColor"/>\n                            </svg>\n                            <span>#{title_reactions}</span>\n                        </div>\n\n                        <div class="full-start__button selector button--subscribe hide">\n                            <svg width="25" height="30" viewBox="0 0 25 30" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <path d="M6.01892 24C6.27423 27.3562 9.07836 30 12.5 30C15.9216 30 18.7257 27.3562 18.981 24H15.9645C15.7219 25.6961 14.2632 27 12.5 27C10.7367 27 9.27804 25.6961 9.03542 24H6.01892Z" fill="currentColor"/>\n                                <path d="M3.81972 14.5957V10.2679C3.81972 5.41336 7.7181 1.5 12.5 1.5C17.2819 1.5 21.1803 5.41336 21.1803 10.2679V14.5957C21.1803 15.8462 21.5399 17.0709 22.2168 18.1213L23.0727 19.4494C24.2077 21.2106 22.9392 23.5 20.9098 23.5H4.09021C2.06084 23.5 0.792282 21.2106 1.9273 19.4494L2.78317 18.1213C3.46012 17.0709 3.81972 15.8462 3.81972 14.5957Z" stroke="currentColor" stroke-width="2.5"/>\n                            </svg>\n                            <span>#{title_subscribe}</span>\n                        </div>\n\n                        <div class="full-start__button selector button--options">\n                            <svg width="38" height="10" viewBox="0 0 38 10" fill="none" xmlns="http://www.w3.org/2000/svg">\n                                <circle cx="4.88968" cy="4.98563" r="4.75394" fill="currentColor"/>\n                                <circle cx="18.9746" cy="4.98563" r="4.75394" fill="currentColor"/>\n                                <circle cx="33.0596" cy="4.98563" r="4.75394" fill="currentColor"/>\n                            </svg>\n                        </div>\n                    </div>\n                </div>\n\n                <div class="applecation__right">\n                    <div class="full-start-new__reactions selector">\n                        <div>#{reactions_none}</div>\n                    </div>\n                </div>\n            </div>\n        </div>\n\n        <div class="hide buttons--container">\n            <div class="full-start__button view--torrent hide">\n                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">\n                    <path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z" fill="currentColor"/>\n                </svg>\n                <span>#{full_torrents}</span>\n            </div>\n\n            <div class="full-start__button selector view--trailer">\n                <svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">\n                    <path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z" fill="currentColor"></path>\n                </svg>\n                <span>#{full_trailers}</span>\n            </div>\n        </div>\n    </div>`;

        Lampa.Template.add('full_start_new', full_start_new_html);

        if (!document.getElementById('theme_a_applecation_css')) {
            var css = `<style id="theme_a_applecation_css">
                .applecation {
                    transition: all .3s;
                }
                .applecation .full-start-new__body {
                    height: 80vh;
                }
                .applecation .full-start-new__right {
                    display: flex;
                    align-items: flex-end;
                }
                .applecation .full-start-new__title {
                    font-size: 2.5em;
                    font-weight: 700;
                    line-height: 1.2;
                    margin-bottom: 0.5em;
                    text-shadow: 0 0 .1em rgba(0, 0, 0, 0.3);
                }
                .applecation__logo {
                    margin-bottom: 0.5em;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
                }
                .applecation__logo.loaded {
                    opacity: 1;
                    transform: translateY(0);
                }
                .applecation__logo img {
                    display: block;
                    max-width: 35vw;
                    max-height: 180px;
                    width: auto;
                    height: auto;
                    object-fit: contain;
                    object-position: left center;
                }
                .applecation__content-wrapper {
                    font-size: 100%;
                }
                .applecation__meta {
                    display: flex;
                    align-items: center;
                    color: #fff;
                    font-size: 1.1em;
                    margin-bottom: 0.5em;
                    line-height: 1;
                    opacity: 0;
                    transform: translateY(15px);
                    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
                    transition-delay: 0.05s;
                }
                .applecation__meta.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .applecation__meta-left {
                    display: flex;
                    align-items: center;
                    line-height: 1;
                }
                .applecation__network img {
                    display: block;
                    max-height: 0.8em;
                    width: auto;
                    object-fit: contain;
                    filter: brightness(0) invert(1);
                }
                .applecation__meta-text {
                    margin-left: 1em;
                    line-height: 1;
                }
                .applecation__meta .full-start__pg {
                    margin: 0 0 0 0.6em;
                    padding: 0.2em 0.5em;
                    font-size: 0.85em;
                    font-weight: 600;
                    border: 1.5px solid rgba(255, 255, 255, 0.4);
                    border-radius: 0.3em;
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1;
                    vertical-align: middle;
                }
                .applecation__description-wrapper {
                    background-color: transparent;
                    padding: 0;
                    border-radius: 1em;
                    width: fit-content;
                    opacity: 0;
                    transform: translateY(15px);
                    transition: padding 0.25s ease, transform 0.25s ease, opacity 0.4s ease-out;
                    transition-delay: 0.1s;
                }
                .applecation__description-wrapper.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .applecation__description-wrapper.focus {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.18));
                    padding: .15em .4em 0 .7em;
                    border-radius: 1em;
                    width: fit-content;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
                    transform: scale(1.07) translateY(0);
                    transition-delay: 0s;
                }
                .applecation__description {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.95em;
                    line-height: 1.5;
                    margin-bottom: 0.5em;
                    max-width: 35vw;
                    display: -webkit-box;
                    -webkit-line-clamp: 4;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .focus .applecation__description {
                    color: rgba(255, 255, 255, 0.92);
                }
                .applecation__info {
                    color: rgba(255, 255, 255, 0.75);
                    font-size: 1em;
                    line-height: 1.4;
                    margin-bottom: 0.5em;
                    opacity: 0;
                    transform: translateY(15px);
                    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
                    transition-delay: 0.15s;
                }
                .applecation__info.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .applecation__right {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                    position: relative;
                }
                /* Реакции под рейтингами, все видимы */
                .applecation .full-start-new__reactions {
                    display: flex !important;
                    flex-direction: row !important;
                    flex-wrap: wrap !important;
                    justify-content: flex-start !important;
                    align-items: center !important;
                    gap: 0.5em !important;
                    margin-top: 0.5em !important;
                }
                .applecation .full-start-new__reactions > div {
                    display: block !important;
                }
                .applecation .full-start-new__reactions .reaction {
                    margin: 0 !important;
                }
                .applecation .full-start-new__reactions .reaction__icon {
                    width: 2.2em !important;
                    height: 2.2em !important;
                }
                .full-start__background {
                    height: calc(100% + 6em);
                    left: 0 !important;
                    opacity: 0 !important;
                    transition: opacity 0.6s ease-out, filter 0.3s ease-out !important;
                    animation: none !important;
                    transform: none !important;
                    will-change: opacity, filter;
                }
                .full-start__background.loaded:not(.dim) {
                    opacity: 1 !important;
                }
                .full-start__background.dim {
                    filter: blur(30px);
                }
                .full-start__background.loaded.applecation-animated {
                    opacity: 1 !important;
                }
                .applecation__overlay {
                    width: 90vw;
                    background: linear-gradient(to right, rgba(0, 0, 0, 0.792) 0%, rgba(0, 0, 0, 0.504) 25%, rgba(0, 0, 0, 0.264) 45%, rgba(0, 0, 0, 0.12) 55%, rgba(0, 0, 0, 0.043) 60%, rgba(0, 0, 0, 0) 65%);
                }
                .theme-a-quality {
                    background: rgba(0,0,0,0.6);
                    border-radius: 0.3em;
                    padding: 0.2em 0.5em;
                    font-size: 0.85em;
                    font-weight: 600;
                }
                /* Card marks styles */
                .card-marks {
                    position: absolute;
                    top: 2.2em;
                    left: -0.2em;
                    display: flex;
                    flex-direction: column;
                    gap: 0.15em;
                    z-index: 10;
                    pointer-events: none;
                }
                .card__mark {
                    padding: 0.35em 0.45em;
                    font-size: 0.8em;
                    font-weight: 800;
                    line-height: 1;
                    letter-spacing: 0.03em;
                    border-radius: 0.3em;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    align-self: flex-start;
                    opacity: 0;
                    animation: mark-fade-in 0.35s ease-out forwards;
                    border: 1px solid rgba(255,255,255,0.15);
                }
                .card__mark--ru { background: linear-gradient(135deg, #8e24aa, #ce93d8); color: #fff; }
                .card__mark--ua { background: linear-gradient(135deg, #1565c0, #42a5f5); color: #fff; }
                .card__mark--4k { background: linear-gradient(135deg, #e65100, #ff9800); color: #fff; }
                .card__mark--fhd { background: linear-gradient(135deg, #4a148c, #ab47bc); color: #fff; }
                .card__mark--hd { background: linear-gradient(135deg, #1b5e20, #66bb6a); color: #fff; }
                .card__mark--en { background: linear-gradient(135deg, #37474f, #78909c); color: #fff; }
                .card__mark--hdr { background: linear-gradient(135deg, #f57f17, #ffeb3b); color: #000; }
                .card__mark--rating { background: linear-gradient(135deg, #1a1a2e, #16213e); color: #ffd700; }
                @keyframes mark-fade-in { to { opacity: 1; } }
            </style>`;
            $('body').append(css);
        }
    }

    function initAppleTvFullCardLogoRuntime() {
        if (window.THEME_A_APPLETV_LOGO_RUNTIME) return;
        window.THEME_A_APPLETV_LOGO_RUNTIME = true;
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
            render.find('.full-start-new__rate-line').addClass('show');
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
        if (window.THEME_A_APPLETV_INFO_RUNTIME) return;
        window.THEME_A_APPLETV_INFO_RUNTIME = true;
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
        }

        function fillDescription(render, movie) {
            var description = render.find('.applecation__description');
            if (description.length) description.text(movie.overview || '');
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

            info.html((parts.length ? parts.join(' · ') : '') + '<span class="theme-a-quality-badges"></span>');
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
            fetchAdditionalRatings(movie, render);

            render.find('.applecation__meta').addClass('show');
            render.find('.applecation__description-wrapper').addClass('show');
            render.find('.applecation__info').addClass('show');
        });
    }

    // =================================================================
    // SETTINGS
    // =================================================================
    function setupSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;

        Lampa.SettingsApi.addComponent({
            component: 'theme_a',
            name: 'Theme A',
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="1.5"/><path d="M8 8h8v2H8V8zm0 4h6v2H8v-2zm0 4h8v2H8v-2z" fill="white"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { type: 'title' },
            field: { name: 'API TMDB' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { name: 'theme_a_tmdb_apikey', type: 'input', placeholder: 'Ключ TMDB', values: '', default: '' },
            field: { name: 'Свой ключ TMDB', description: 'Если указать — плагин будет использовать его вместо ключа Лампы.' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { type: 'title' },
            field: { name: 'Бейджи на карточках' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { name: 'theme_a_badge_ru', type: 'trigger', default: true },
            field: { name: 'Русская озвучка (RU)', description: 'Показывать метку наличия русского дубляжа' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { name: 'theme_a_badge_ua', type: 'trigger', default: true },
            field: { name: 'Украинская озвучка (UA)', description: 'Показывать метку наличия украинского дубляжа' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { name: 'theme_a_badge_en', type: 'trigger', default: true },
            field: { name: 'Английская озвучка (EN)', description: 'Показывать метку наличия английской дорожки' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { name: 'theme_a_badge_4k', type: 'trigger', default: true },
            field: { name: 'Качество 4K', description: 'Показывать метку наличия 4K разрешения' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { name: 'theme_a_badge_fhd', type: 'trigger', default: true },
            field: { name: 'Качество FHD/HD', description: 'Показывать метку наличия FHD/HD' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { name: 'theme_a_badge_hdr', type: 'trigger', default: true },
            field: { name: 'HDR / Dolby Vision', description: 'Показывать метку наличия HDR или Dolby Vision' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { type: 'title' },
            field: { name: 'Качество' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_a',
            param: { name: 'theme_a_quality_tv', type: 'trigger', default: true },
            field: { name: 'Качество для сериалов', description: 'Показывать качество для сериалов' }
        });
    }

    // =================================================================
    // MENU BUTTONS
    // =================================================================
    function addMenuButtons() {
        var services = ['netflix', 'apple', 'hbo', 'amazon', 'disney', 'paramount', 'sky_showtime', 'hulu', 'syfy', 'educational_and_reality'];
        var serviceTitles = {
            'netflix': 'Netflix',
            'apple': 'Apple TV+',
            'hbo': 'HBO / Max',
            'amazon': 'Prime Video',
            'disney': 'Disney+',
            'paramount': 'Paramount+',
            'sky_showtime': 'Sky Showtime',
            'hulu': 'Hulu',
            'syfy': 'Syfy',
            'educational_and_reality': 'Познавательное'
        };

        services.forEach(function (id) {
            var config = SERVICE_CONFIGS[id];
            if (!config) return;

            var btn = $('<li class="menu__item selector" data-action="' + id + '"><div class="menu__ico">' + config.icon + '</div><div class="menu__text">' + serviceTitles[id] + '</div></li>');
            btn.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: serviceTitles[id],
                    component: 'studios_main',
                    service_id: id,
                    page: 1
                });
            });
            $('.menu .menu__list').eq(0).append(btn);
        });
    }

    // =================================================================
    // INIT
    // =================================================================
    function init() {
        setupSettings();
        Lampa.Component.add('studios_main', StudiosMain);
        Lampa.Component.add('studios_view', StudiosView);
        ThemeAStudioSubscription.init();
        removeShotsSection();
        addMenuButtons();
        initAppleTvFullCard();
        initAppleTvFullCardLogoRuntime();
        initAppleTvFullCardInfoRuntime();
        observeCardRows();

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var render = e.object && e.object.activity && e.object.activity.render && e.object.activity.render();
            var movie = e.data && e.data.movie;
            if (render && movie) {
                setTimeout(function() {
                    var badges = document.querySelectorAll('.click-quality, .click-quality-full');
                    for (var i = 0; i < badges.length; i++) badges[i].remove();
                }, 200);
                fetchAdditionalRatings(movie, render);
            }
        });

        window.THEME_A_LOADED = true;
    }

    function runInit() {
        try {
            init();
        } catch (err) {
            window.THEME_A_ERROR = (err && err.message) ? err.message : String(err);
            if (typeof console !== 'undefined' && console.error) {
                console.error('[Theme A]', err);
            }
        }
    }

    if (window.appready) runInit();
    else if (typeof Lampa !== 'undefined' && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') runInit();
        });
    } else {
        window.THEME_A_ERROR = 'Lampa.Listener not found';
    }

})();
