(function () {
    'use strict';

    // ============================================
    // ПЛАГИН: Emerald Theme
    // Версия: 1.0.0
    // Описание: Тема emerald из Interface Mod
    // ============================================

    // === EMERALD ТЕМА (из Interface Mod) ===
    var emeraldTheme = `
        body {
            background: linear-gradient(135deg, #1a2a3a 0%, #2C5364 50%, #203A43 100%);
            color: #ffffff;
        }
        .menu__item.focus,
        .menu__item.traverse,
        .menu__item.hover,
        .settings-folder.focus,
        .settings-param.focus,
        .selectbox-item.focus,
        .full-start__button.focus,
        .full-descr__tag.focus,
        .player-panel .button.focus {
            background: linear-gradient(to right, #43cea2, #185a9d);
            color: #fff;
            box-shadow: 0 4px 15px rgba(67,206,162,0.3);
            border-radius: 5px;
        }
        .card.focus .card__view::after,
        .card.hover .card__view::after {
            border: 3px solid #43cea2;
            box-shadow: 0 0 20px rgba(67,206,162,0.4);
        }
        .head__action.focus,
        .head__action.hover {
            background: linear-gradient(45deg, #43cea2, #185a9d);
        }
        .full-start__background {
            opacity: 0.85;
            filter: brightness(1.1) saturate(1.2);
        }
        .settings__content,
        .settings-input__content,
        .selectbox__content,
        .modal__content {
            background: rgba(26,42,58,0.98);
            border: 1px solid rgba(67,206,162,0.1);
        }
    `;

    // === ПРИМЕНЕНИЕ ТЕМЫ ===
    function applyEmeraldTheme() {
        var oldStyle = document.querySelector('#emerald-theme-original');
        if (oldStyle) oldStyle.remove();

        var style = document.createElement('style');
        style.id = 'emerald-theme-original';
        style.textContent = emeraldTheme;
        document.head.appendChild(style);

        console.log('[Emerald Theme] Тема emerald из Interface Mod применена');
    }

    // === ЗАПУСК ПЛАГИНА ===
    function startPlugin() {
        applyEmeraldTheme();
    }

    // === РЕГИСТРАЦИЯ В МАНИФЕСТЕ ===
    Lampa.Manifest.plugins = {
        name: 'Emerald Theme',
        version: '1.0.0',
        description: 'Тема emerald из Interface Mod для Lampa',
        author: 'Interface Mod'
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
