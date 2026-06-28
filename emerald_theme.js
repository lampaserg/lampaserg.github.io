(function () {
    'use strict';

    // ============================================
    // ПЛАГИН: Emerald v1 Theme
    // Версия: 1.0.1
    // Описание: Сине-фиолетовая тема с закругленными краями и обводкой
    // ============================================

    var PLUGIN_NAME = 'emerald_v1_theme';
    var PLUGIN_VERSION = '1.0.1';

    // === EMERALD V1 ТЕМА (Сине-фиолетовая с обводкой) ===
    var emeraldV1Theme = `
        /* === ОСНОВНОЙ ФОН === */
        body {
            background: linear-gradient(135deg, #1a2a3a 0%, #2C5364 40%, #203A43 70%, #1a2a3a 100%) !important;
            color: #e8f0f8 !important;
            min-height: 100vh;
        }

        /* === ФОН ДЛЯ КОНТЕЙНЕРОВ === */
        .wrap,
        .activity__body,
        .settings__content,
        .settings-input__content,
        .selectbox__content,
        .modal__content {
            background: rgba(26, 42, 58, 0.88) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(67, 206, 162, 0.12) !important;
            border-radius: 16px !important;
        }

        /* === КНОПКИ МЕНЮ === */
        .menu__item {
            border-radius: 12px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            margin: 2px 0 !important;
        }
        
        .menu__item.focus,
        .menu__item.traverse,
        .menu__item.hover {
            background: transparent !important;
            color: #ffffff !important;
            box-shadow: 0 0 0 2px #43cea2, 0 0 25px rgba(67, 206, 162, 0.25) !important;
            border-radius: 12px !important;
            transform: scale(1.02) !important;
            text-shadow: 0 0 20px rgba(67, 206, 162, 0.3) !important;
        }

        /* === КНОПКИ В НАСТРОЙКАХ === */
        .settings-folder.focus,
        .settings-param.focus,
        .selectbox-item.focus {
            background: transparent !important;
            color: #43cea2 !important;
            box-shadow: 0 0 0 2px #43cea2, 0 0 20px rgba(67, 206, 162, 0.2) !important;
            border-radius: 12px !important;
            transform: scale(1.02) !important;
        }

        /* === КНОПКИ В КАРТОЧКЕ === */
        .full-start__button {
            border-radius: 30px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            background: rgba(67, 206, 162, 0.08) !important;
            border: 1px solid rgba(67, 206, 162, 0.15) !important;
            color: #e8f0f8 !important;
        }
        
        .full-start__button.focus,
        .full-start__button.hover {
            background: transparent !important;
            color: #43cea2 !important;
            box-shadow: 0 0 0 2px #43cea2, 0 0 25px rgba(67, 206, 162, 0.3) !important;
            border-radius: 30px !important;
            transform: scale(1.05) !important;
        }

        /* === КНОПКИ В ПЛЕЕРЕ === */
        .player-panel .button {
            border-radius: 50% !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .player-panel .button.focus,
        .player-panel .button.hover {
            background: transparent !important;
            color: #43cea2 !important;
            box-shadow: 0 0 0 2px #43cea2, 0 0 20px rgba(67, 206, 162, 0.25) !important;
        }

        /* === ТЕГИ В КАРТОЧКЕ === */
        .full-descr__tag {
            border-radius: 20px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            background: rgba(67, 206, 162, 0.06) !important;
            border: 1px solid rgba(67, 206, 162, 0.1) !important;
        }
        
        .full-descr__tag.focus,
        .full-descr__tag.hover {
            background: transparent !important;
            color: #43cea2 !important;
            box-shadow: 0 0 0 2px #43cea2, 0 0 15px rgba(67, 206, 162, 0.2) !important;
            transform: scale(1.05) !important;
        }

        /* === КАРТОЧКИ ПРИ ФОКУСЕ === */
        .card {
            border-radius: 16px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            overflow: hidden !important;
        }
        
        .card .card__view {
            border-radius: 16px !important;
            overflow: hidden !important;
        }
        
        .card.focus .card__view::after,
        .card.hover .card__view::after {
            content: '' !important;
            position: absolute !important;
            inset: -4px !important;
            border: 3px solid #43cea2 !important;
            border-radius: 20px !important;
            box-shadow: 0 0 35px rgba(67, 206, 162, 0.35), inset 0 0 35px rgba(67, 206, 162, 0.05) !important;
            animation: emerald-v1-glow 2.5s ease-in-out infinite !important;
            pointer-events: none !important;
            z-index: 5 !important;
        }

        /* === АНИМАЦИЯ СВЕЧЕНИЯ === */
        @keyframes emerald-v1-glow {
            0% { box-shadow: 0 0 20px rgba(67, 206, 162, 0.2), inset 0 0 20px rgba(67, 206, 162, 0.03); }
            50% { box-shadow: 0 0 50px rgba(67, 206, 162, 0.45), inset 0 0 40px rgba(67, 206, 162, 0.08); }
            100% { box-shadow: 0 0 20px rgba(67, 206, 162, 0.2), inset 0 0 20px rgba(67, 206, 162, 0.03); }
        }

        /* === КНОПКИ В ВЕРХНЕЙ ПАНЕЛИ === */
        .head__action {
            border-radius: 12px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .head__action.focus,
        .head__action.hover {
            background: transparent !important;
            color: #43cea2 !important;
            box-shadow: 0 0 0 2px #43cea2, 0 0 20px rgba(67, 206, 162, 0.25) !important;
            border-radius: 12px !important;
            transform: scale(1.08) !important;
        }

        /* === ФОН В КАРТОЧКЕ ФИЛЬМА === */
        .full-start__background {
            opacity: 0.85 !important;
            filter: brightness(1.1) saturate(1.2) contrast(1.05) !important;
            transition: all 0.5s ease !important;
            border-radius: 16px !important;
        }

        .full-start-new__poster {
            border-radius: 16px !important;
            overflow: hidden !important;
        }

        /* === ПРОГРЕСС-БАР === */
        .progress__bar {
            background: linear-gradient(90deg, #43cea2, #185a9d) !important;
            box-shadow: 0 0 25px rgba(67, 206, 162, 0.25) !important;
            border-radius: 10px !important;
            height: 4px !important;
        }

        .progress__track {
            border-radius: 10px !important;
            background: rgba(67, 206, 162, 0.1) !important;
        }

        /* === ПОЛОСА ПРОКРУТКИ === */
        ::-webkit-scrollbar-track {
            background: rgba(26, 42, 58, 0.3) !important;
            border-radius: 10px !important;
        }
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #43cea2, #185a9d) !important;
            border-radius: 10px !important;
            box-shadow: 0 0 20px rgba(67, 206, 162, 0.15) !important;
            border: 2px solid rgba(26, 42, 58, 0.3) !important;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #5ddbb2, #2a7ab5) !important;
        }

        /* === СКРОЛЛ ДЛЯ FIREFOX === */
        * {
            scrollbar-width: thin !important;
            scrollbar-color: #43cea2 rgba(26, 42, 58, 0.3) !important;
        }

        /* === АНИМАЦИЯ ДЛЯ КАРТОЧЕК === */
        .card {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .card:hover {
            transform: translateY(-5px) !important;
        }

        /* === ПОЛОСА ПОИСКА === */
        .search-input {
            border-radius: 30px !important;
            border: 1px solid rgba(67, 206, 162, 0.15) !important;
            background: rgba(26, 42, 58, 0.6) !important;
            transition: all 0.3s ease !important;
        }
        .search-input.focus {
            border-color: #43cea2 !important;
            box-shadow: 0 0 25px rgba(67, 206, 162, 0.15) !important;
        }

        /* === СЕЛЕКТОРЫ === */
        .selectbox__content {
            border-radius: 16px !important;
            border: 1px solid rgba(67, 206, 162, 0.1) !important;
        }
        
        .selectbox-item {
            border-radius: 10px !important;
            transition: all 0.3s ease !important;
        }
        
        .selectbox-item.focus {
            background: transparent !important;
            color: #43cea2 !important;
            box-shadow: 0 0 0 2px #43cea2 !important;
        }

        /* === ПАНЕЛЬ НАСТРОЕК === */
        .settings-param {
            border-radius: 12px !important;
            transition: all 0.3s ease !important;
        }
        
        .settings-param.focus {
            background: transparent !important;
            color: #43cea2 !important;
            box-shadow: 0 0 0 2px #43cea2 !important;
        }

        .settings-folder {
            border-radius: 12px !important;
            transition: all 0.3s ease !important;
        }
        
        .settings-folder.focus {
            background: transparent !important;
            color: #43cea2 !important;
            box-shadow: 0 0 0 2px #43cea2 !important;
        }

        /* === ОГРАНИЧЕНИЕ ДЛЯ FIREFOX === */
        @-moz-document url-prefix() {
            .full-start__background {
                opacity: 0.7 !important;
                filter: none !important;
            }
            body {
                background: #1a2a3a !important;
            }
        }
    `;

    // === ПРИМЕНЕНИЕ ТЕМЫ ===
    function applyEmeraldV1Theme() {
        var oldStyle = document.querySelector('#emerald-v1-theme-style');
        if (oldStyle) oldStyle.remove();

        var style = document.createElement('style');
        style.id = 'emerald-v1-theme-style';
        style.textContent = emeraldV1Theme;
        document.head.appendChild(style);

        console.log('[Emerald v1 Theme] Тема успешно применена');
    }

    // === ЗАПУСК ПЛАГИНА ===
    function startPlugin() {
        applyEmeraldV1Theme();
    }

    // === РЕГИСТРАЦИЯ В МАНИФЕСТЕ ===
    Lampa.Manifest.plugins = {
        name: 'Emerald v1 Theme',
        version: '1.0.1',
        description: 'Сине-фиолетовая тема Emerald v1 с обводкой и закруглениями',
        author: 'Lampa Community'
    };

    // === ОЖИДАНИЕ ЗАГРУЗКИ ===
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }

})();
