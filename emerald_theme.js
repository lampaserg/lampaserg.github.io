(function () {
    'use strict';

    // ============================================
    // ПЛАГИН: Emerald Theme (Изумрудная тема)
    // Версия: 1.0.0
    // Описание: Только тема Emerald, без настроек
    // ============================================

    var PLUGIN_NAME = 'emerald_theme';
    var PLUGIN_VERSION = '1.0.0';

    // === ИЗУМРУДНАЯ ТЕМА (CSS) ===
    var emeraldTheme = `
        /* === ОСНОВНОЙ ФОН === */
        body {
            background: linear-gradient(135deg, #0d1f1f 0%, #1a3a3a 30%, #0f2e2e 60%, #1a4a4a 100%) !important;
            color: #e0f0f0 !important;
            min-height: 100vh;
        }

        /* === ФОН ДЛЯ КОНТЕЙНЕРОВ === */
        .wrap,
        .activity__body,
        .settings__content,
        .settings-input__content,
        .selectbox__content,
        .modal__content {
            background: rgba(13, 31, 31, 0.92) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
        }

        /* === КНОПКИ МЕНЮ ПРИ ФОКУСЕ === */
        .menu__item.focus,
        .menu__item.traverse,
        .menu__item.hover {
            background: linear-gradient(135deg, #2ecc71, #1a8a4a) !important;
            color: #ffffff !important;
            box-shadow: 0 0 30px rgba(46, 204, 113, 0.4), inset 0 0 20px rgba(46, 204, 113, 0.2) !important;
            border-radius: 8px !important;
            transform: scale(1.05) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            text-shadow: 0 0 20px rgba(46, 204, 113, 0.5) !important;
        }

        /* === КНОПКИ В НАСТРОЙКАХ === */
        .settings-folder.focus,
        .settings-param.focus,
        .selectbox-item.focus {
            background: linear-gradient(135deg, #2ecc71, #1a8a4a) !important;
            color: #ffffff !important;
            box-shadow: 0 0 25px rgba(46, 204, 113, 0.3) !important;
            border-radius: 6px !important;
            transform: scale(1.02) !important;
        }

        /* === КНОПКИ В КАРТОЧКЕ (Смотреть, Трейлер, Торрент) === */
        .full-start__button.focus,
        .full-start__button.hover {
            background: linear-gradient(135deg, #2ecc71, #1a8a4a) !important;
            color: #ffffff !important;
            box-shadow: 0 0 30px rgba(46, 204, 113, 0.4) !important;
            transform: scale(1.08) !important;
            border-radius: 10px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* === КНОПКИ В ПЛЕЕРЕ === */
        .player-panel .button.focus,
        .player-panel .button.hover {
            background: linear-gradient(135deg, #2ecc71, #1a8a4a) !important;
            color: #ffffff !important;
            box-shadow: 0 0 20px rgba(46, 204, 113, 0.3) !important;
            border-radius: 50% !important;
        }

        /* === ТЕГИ В КАРТОЧКЕ (жанры) === */
        .full-descr__tag.focus,
        .full-descr__tag.hover {
            background: linear-gradient(135deg, #2ecc71, #1a8a4a) !important;
            color: #ffffff !important;
            box-shadow: 0 0 15px rgba(46, 204, 113, 0.3) !important;
            transform: scale(1.05) !important;
        }

        /* === КАРТОЧКИ ПРИ ФОКУСЕ === */
        .card.focus .card__view::after,
        .card.hover .card__view::after {
            content: '' !important;
            position: absolute !important;
            inset: -3px !important;
            border: 3px solid #2ecc71 !important;
            border-radius: 12px !important;
            box-shadow: 0 0 30px rgba(46, 204, 113, 0.5), inset 0 0 30px rgba(46, 204, 113, 0.1) !important;
            animation: emerald-glow 2s ease-in-out infinite !important;
            pointer-events: none !important;
            z-index: 5 !important;
        }

        @keyframes emerald-glow {
            0% { box-shadow: 0 0 20px rgba(46, 204, 113, 0.3), inset 0 0 20px rgba(46, 204, 113, 0.05); }
            50% { box-shadow: 0 0 40px rgba(46, 204, 113, 0.6), inset 0 0 40px rgba(46, 204, 113, 0.15); }
            100% { box-shadow: 0 0 20px rgba(46, 204, 113, 0.3), inset 0 0 20px rgba(46, 204, 113, 0.05); }
        }

        /* === КНОПКИ В ВЕРХНЕЙ ПАНЕЛИ === */
        .head__action.focus,
        .head__action.hover {
            background: linear-gradient(135deg, #2ecc71, #1a8a4a) !important;
            color: #ffffff !important;
            box-shadow: 0 0 20px rgba(46, 204, 113, 0.3) !important;
            border-radius: 8px !important;
            transform: scale(1.1) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* === ФОН В КАРТОЧКЕ ФИЛЬМА === */
        .full-start__background {
            opacity: 0.85 !important;
            filter: brightness(1.1) saturate(1.3) contrast(1.05) !important;
            transition: all 0.5s ease !important;
        }

        /* === ПРОГРЕСС-БАР === */
        .progress__bar {
            background: linear-gradient(90deg, #2ecc71, #1a8a4a) !important;
            box-shadow: 0 0 20px rgba(46, 204, 113, 0.3) !important;
        }

        /* === ПОЛОСА ПРОКРУТКИ === */
        ::-webkit-scrollbar-track {
            background: rgba(13, 31, 31, 0.5) !important;
            border-radius: 10px !important;
        }
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #2ecc71, #1a8a4a) !important;
            border-radius: 10px !important;
            box-shadow: 0 0 20px rgba(46, 204, 113, 0.2) !important;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #3ddc84, #2ecc71) !important;
        }

        /* === СКРОЛЛ ДЛЯ FIREFOX === */
        * {
            scrollbar-width: thin !important;
            scrollbar-color: #2ecc71 rgba(13, 31, 31, 0.5) !important;
        }

        /* === АНИМАЦИЯ ДЛЯ КАРТОЧЕК ПРИ НАВЕДЕНИИ === */
        .card {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .card:hover {
            transform: translateY(-5px) !important;
        }

        /* === ОГРАНИЧЕНИЕ ДЛЯ FIREFOX === */
        @-moz-document url-prefix() {
            .full-start__background {
                opacity: 0.7 !important;
                filter: none !important;
            }
            body {
                background: #0d1f1f !important;
            }
        }
    `;

    // === ПРИМЕНЕНИЕ ТЕМЫ ===
    function applyEmeraldTheme() {
        // Удаляем старые стили темы, если есть
        var oldStyle = document.querySelector('#emerald-theme-style');
        if (oldStyle) oldStyle.remove();

        // Добавляем новые стили
        var style = document.createElement('style');
        style.id = 'emerald-theme-style';
        style.textContent = emeraldTheme;
        document.head.appendChild(style);

        console.log('[Emerald Theme] Тема успешно применена');
    }

    // === ЗАПУСК ПЛАГИНА ===
    function startPlugin() {
        applyEmeraldTheme();
    }

    // === РЕГИСТРАЦИЯ В МАНИФЕСТЕ ===
    Lampa.Manifest.plugins = {
        name: 'Emerald Theme',
        version: '1.0.0',
        description: 'Изумрудная тема оформления для Lampa',
        author: 'Lampa Community'
    };

    // === ОЖИДАНИЕ ЗАГРУЗКИ ПРИЛОЖЕНИЯ ===
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