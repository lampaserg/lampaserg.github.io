(function () {
    'use strict';

    // =============================================
    // Serial Info Card Plugin for Lampa
    // Версия: 1.0
    // Отображает информацию о сериале на карточке:
    // - Количество сезонов и эпизодов
    // - Последнюю серию на постере
    // - Статус сериала (онгоинг/завершен)
    // - Информацию о новых сериях
    // =============================================

    const PLUGIN_NAME = 'serial_info_card';
    const STORAGE_KEY = 'serial_info_enabled';
    const VERSION = '1.0.0';

    // Настройки по умолчанию
    const DEFAULTS = {
        enabled: true,
        show_seasons: true,
        show_episodes: true,
        show_status: true,
        show_new_episode: true,
        show_last_view: true
    };

    // =============================================
    // Хранилище настроек
    // =============================================
    function getSettings() {
        try {
            const settings = Lampa.Storage.get(STORAGE_KEY, {});
            return Object.assign({}, DEFAULTS, settings);
        } catch (e) {
            return DEFAULTS;
        }
    }

    function setSettings(settings) {
        try {
            Lampa.Storage.set(STORAGE_KEY, settings);
        } catch (e) {
            console.error('[SerialInfo] Save settings error:', e);
        }
    }

    // =============================================
    // Утилиты
    // =============================================
    function isSerial(card) {
        return !!(card && (card.name || card.original_name || card.first_air_date));
    }

    function getCardTitle(card) {
        return card.original_title || card.original_name || card.title || card.name || '';
    }

    function getCardId(card) {
        return card.id || card.tmdb_id || 0;
    }

    function numWord(value, words) {
        value = Math.abs(value) % 100;
        const num = value % 10;
        if (value > 10 && value < 20) return words[2];
        if (num > 1 && num < 5) return words[1];
        if (num == 1) return words[0];
        return words[2];
    }

    function getLastView(card) {
        try {
            const file_id = Lampa.Utils.hash(getCardTitle(card));
            const watched = Lampa.Storage.cache('online_watched_last', 5000, {});
            const data = watched[file_id];

            if (data && data.season && data.episode) {
                return {
                    season: data.season,
                    episode: data.episode,
                    balanser: data.balanser_name || ''
                };
            }
        } catch (e) {}
        return null;
    }

    // =============================================
    // Получение данных о сериале из TMDB
    // =============================================
    function getTvInfo(card, callback) {
        if (!isSerial(card) || !getCardId(card)) {
            callback(null);
            return;
        }

        const id = getCardId(card);
        const lang = Lampa.Storage.get('language', 'ru');
        
        // Проверяем кеш
        const cacheKey = 'serial_info_' + id;
        const cached = Lampa.Storage.cache(cacheKey, 100, null);
        if (cached) {
            callback(cached);
            return;
        }

        // Запрос к TMDB
        const url = Lampa.TMDB.api('tv/' + id + '?language=' + lang);
        const network = new Lampa.Reguest();

        network.timeout(10000);
        network.silent(url, function(data) {
            if (data) {
                // Кешируем на 1 час
                Lampa.Storage.set(cacheKey, data);
                callback(data);
            } else {
                callback(null);
            }
        }, function() {
            callback(null);
        });
    }

    // =============================================
    // Создание бейджей и элементов интерфейса
    // =============================================
    function createSeasonBadge(seasonCount, episodeCount) {
        const settings = getSettings();
        let parts = [];

        if (settings.show_seasons && seasonCount > 0) {
            const word = numWord(seasonCount, ['', 'а', 'ов']);
            parts.push(seasonCount + ' сез' + word);
        }

        if (settings.show_episodes && episodeCount > 0) {
            const word = numWord(episodeCount, ['', 'а', 'ов']);
            parts.push(episodeCount + ' эпизод' + word);
        }

        if (parts.length === 0) return '';

        return '<div class="serial-info-badge">' + parts.join(' • ') + '</div>';
    }

    function createStatusBadge(status) {
        const statusMap = {
            'returning series': '🔄 Онгоинг',
            'ended': '✅ Завершен',
            'canceled': '❌ Отменен',
            'in production': '🎬 В производстве',
            'planned': '📅 Запланирован',
            'released': '📺 Выпущен'
        };

        const text = statusMap[status] || status || '';
        if (!text) return '';

        return '<div class="serial-status-badge">' + text + '</div>';
    }

    function createNewEpisodeBadge(season, episode) {
        return '<div class="serial-new-episode">' +
               'Новая серия S' + season + 'E' + episode +
               '</div>';
    }

    function createLastViewBadge(season, episode, balanser) {
        return '<div class="serial-last-view">' +
               '<span class="icon-viewed">▶</span> ' +
               'S' + season + 'E' + episode +
               (balanser ? ' (' + balanser + ')' : '') +
               '</div>';
    }

    function createEpisodeNumberBadge(season, episode) {
        return '<div class="serial-episode-number">S' + season + ':E' + episode + '</div>';
    }

    // =============================================
    // Инъекция информации в карточку
    // =============================================
    function injectSerialInfo(cardElement, cardData, tvInfo) {
        const settings = getSettings();
        if (!settings.enabled) return;

        if (!isSerial(cardData) || !tvInfo) return;

        // Удаляем старые бейджи
        cardElement.find('.serial-info-badge, .serial-status-badge, .serial-new-episode, .serial-last-view, .serial-episode-number').remove();

        const view = cardElement.find('.card__view');
        if (!view.length) return;

        // Информация о сезонах и эпизодах
        const seasonCount = tvInfo.number_of_seasons || 0;
        const episodeCount = tvInfo.number_of_episodes || 0;
        const status = tvInfo.status || '';

        // Бейдж с сезонами/эпизодами
        const badgeHtml = createSeasonBadge(seasonCount, episodeCount);
        if (badgeHtml) {
            view.append(badgeHtml);
        }

        // Бейдж со статусом
        if (settings.show_status) {
            const statusHtml = createStatusBadge(status);
            if (statusHtml) {
                view.append(statusHtml);
            }
        }

        // Новая серия (на постере)
        if (settings.show_new_episode && tvInfo.next_episode_to_air) {
            const nextEp = tvInfo.next_episode_to_air;
            const now = new Date();
            const airDate = new Date(nextEp.air_date);

            // Показываем только если серия еще не вышла или вышла недавно
            const diffDays = Math.ceil((airDate - now) / (1000 * 60 * 60 * 24));
            if (diffDays >= -7 && diffDays <= 30) {
                const epHtml = createNewEpisodeBadge(nextEp.season_number, nextEp.episode_number);
                view.append(epHtml);
            }
        }

        // Номер последней серии на постере
        if (tvInfo.last_episode_to_air) {
            const lastEp = tvInfo.last_episode_to_air;
            const epNumHtml = createEpisodeNumberBadge(lastEp.season_number, lastEp.episode_number);
            view.append(epNumHtml);
        }

        // Последний просмотр
        if (settings.show_last_view) {
            const lastView = getLastView(cardData);
            if (lastView) {
                const viewHtml = createLastViewBadge(
                    lastView.season,
                    lastView.episode,
                    lastView.balanser
                );
                view.append(viewHtml);
            }
        }

        // Добавляем стили, если их еще нет
        addStyles();
    }

    // =============================================
    // Обработка карточек в ленте
    // =============================================
    function processCards() {
        const settings = getSettings();
        if (!settings.enabled) return;

        $('.card:not(.serial-info-processed)').each(function() {
            const card = $(this);
            card.addClass('serial-info-processed');

            // Пропускаем баннеры и карточки без сериалов
            if (card.hasClass('hero-banner')) return;
            if (card.find('.card__view').length === 0) return;

            const cardData = card.data('item') || 
                           (card[0] && (card[0].card_data || card[0].item)) || 
                           null;

            if (cardData && isSerial(cardData)) {
                getTvInfo(cardData, function(tvInfo) {
                    if (tvInfo) {
                        injectSerialInfo(card, cardData, tvInfo);
                    }
                });
            }
        });
    }

    // =============================================
    // Стили
    // =============================================
    function addStyles() {
        if (document.getElementById('serial-info-styles')) return;

        const css = `
            <style id="serial-info-styles">
                /* Основной бейдж с информацией о сезонах */
                .serial-info-badge {
                    position: absolute;
                    bottom: 0.3em;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 0.2em 0.6em;
                    font-size: 0.65em;
                    font-weight: bold;
                    color: #fff;
                    background: rgba(0, 0, 0, 0.75);
                    border-radius: 0.3em;
                    text-align: center;
                    pointer-events: none;
                    white-space: nowrap;
                    z-index: 10;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                }

                /* Бейдж со статусом сериала */
                .serial-status-badge {
                    position: absolute;
                    top: 0.5em;
                    right: 0.5em;
                    padding: 0.2em 0.5em;
                    font-size: 0.55em;
                    font-weight: bold;
                    color: #fff;
                    background: rgba(0, 0, 0, 0.6);
                    border-radius: 0.3em;
                    pointer-events: none;
                    z-index: 10;
                    border: 1px solid rgba(255,255,255,0.15);
                }

                /* Новая серия (на постере) */
                .serial-new-episode {
                    position: absolute;
                    top: 0.5em;
                    left: 0.5em;
                    padding: 0.2em 0.5em;
                    font-size: 0.55em;
                    font-weight: bold;
                    color: #fff;
                    background: #FF6B35;
                    border-radius: 0.3em;
                    pointer-events: none;
                    z-index: 10;
                    animation: pulse-new-episode 2s infinite;
                }

                @keyframes pulse-new-episode {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }

                /* Номер последней серии на постере */
                .serial-episode-number {
                    position: absolute;
                    bottom: 2.5em;
                    left: 0.5em;
                    padding: 0.15em 0.4em;
                    font-size: 0.6em;
                    font-weight: bold;
                    color: #fff;
                    background: rgba(22, 143, 223, 0.85);
                    border-radius: 0.3em;
                    pointer-events: none;
                    z-index: 10;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                }

                /* Последний просмотр */
                .serial-last-view {
                    position: absolute;
                    bottom: 2.5em;
                    right: 0.5em;
                    padding: 0.15em 0.5em;
                    font-size: 0.55em;
                    font-weight: bold;
                    color: #fff;
                    background: rgba(0, 0, 0, 0.7);
                    border-radius: 0.3em;
                    pointer-events: none;
                    z-index: 10;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .serial-last-view .icon-viewed {
                    color: #4CAF50;
                    margin-right: 0.3em;
                }

                /* Для мобильных устройств */
                @media (max-width: 480px) {
                    .serial-info-badge {
                        font-size: 0.5em;
                        padding: 0.15em 0.4em;
                        bottom: 0.2em;
                    }
                    .serial-status-badge,
                    .serial-new-episode,
                    .serial-episode-number,
                    .serial-last-view {
                        font-size: 0.45em;
                        padding: 0.1em 0.3em;
                    }
                    .serial-episode-number {
                        bottom: 2em;
                    }
                }

                /* Для карточек без постера */
                .card:not(.card--loaded) .serial-episode-number,
                .card:not(.card--loaded) .serial-new-episode {
                    display: none;
                }
            </style>
        `;

        $('head').append(css);
    }

    // =============================================
    // Настройки плагина
    // =============================================
    function addSettings() {
        const settings = getSettings();

        Lampa.SettingsApi.addComponent({
            component: 'serial_info',
            name: 'Информация о сериале',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 4v16"/><path d="M16 4v16"/><path d="M2 10h20"/></svg>'
        });

        // Включить/выключить плагин
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_enabled',
                type: 'trigger',
                default: settings.enabled
            },
            field: {
                name: 'Включить информацию о сериале',
                description: 'Отображать информацию о сезонах, эпизодах и статусе сериала на карточках'
            },
            onChange: function(value) {
                const newSettings = getSettings();
                newSettings.enabled = value === 'true' || value === true;
                setSettings(newSettings);
                
                // Обновляем карточки
                setTimeout(function() {
                    $('.card.serial-info-processed').removeClass('serial-info-processed');
                    processCards();
                }, 500);
            }
        });

        // Показывать сезоны
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_seasons',
                type: 'trigger',
                default: settings.show_seasons
            },
            field: {
                name: 'Показывать количество сезонов',
                description: 'Отображать количество сезонов в бейдже'
            },
            onChange: function(value) {
                const newSettings = getSettings();
                newSettings.show_seasons = value === 'true' || value === true;
                setSettings(newSettings);
                refreshCards();
            }
        });

        // Показывать эпизоды
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_episodes',
                type: 'trigger',
                default: settings.show_episodes
            },
            field: {
                name: 'Показывать количество эпизодов',
                description: 'Отображать количество эпизодов в бейдже'
            },
            onChange: function(value) {
                const newSettings = getSettings();
                newSettings.show_episodes = value === 'true' || value === true;
                setSettings(newSettings);
                refreshCards();
            }
        });

        // Показывать статус
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_status',
                type: 'trigger',
                default: settings.show_status
            },
            field: {
                name: 'Показывать статус сериала',
                description: 'Отображать статус: Онгоинг, Завершен, Отменен и т.д.'
            },
            onChange: function(value) {
                const newSettings = getSettings();
                newSettings.show_status = value === 'true' || value === true;
                setSettings(newSettings);
                refreshCards();
            }
        });

        // Показывать новые серии
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_new_episode',
                type: 'trigger',
                default: settings.show_new_episode
            },
            field: {
                name: 'Показывать новые серии',
                description: 'Отображать информацию о ближайшей новой серии'
            },
            onChange: function(value) {
                const newSettings = getSettings();
                newSettings.show_new_episode = value === 'true' || value === true;
                setSettings(newSettings);
                refreshCards();
            }
        });

        // Показывать последний просмотр
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_last_view',
                type: 'trigger',
                default: settings.show_last_view
            },
            field: {
                name: 'Показывать последний просмотр',
                description: 'Отображать на постере последнюю просмотренную серию'
            },
            onChange: function(value) {
                const newSettings = getSettings();
                newSettings.show_last_view = value === 'true' || value === true;
                setSettings(newSettings);
                refreshCards();
            }
        });
    }

    // =============================================
    // Обновление карточек
    // =============================================
    function refreshCards() {
        setTimeout(function() {
            $('.card.serial-info-processed').removeClass('serial-info-processed');
            processCards();
        }, 300);
    }

    // =============================================
    // Инициализация
    // =============================================
    function init() {
        console.log('[SerialInfo] Plugin loaded v' + VERSION);

        addStyles();

        // Добавляем настройки
        addSettings();

        // Обработка событий
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                setTimeout(function() {
                    processCards();
                }, 500);
            }
        });

        Lampa.Listener.follow('line', function(e) {
            if (e.items) {
                setTimeout(function() {
                    processCards();
                }, 200);
            }
        });

        Lampa.Listener.follow('activity', function(e) {
            if (e.type === 'start') {
                setTimeout(function() {
                    processCards();
                }, 300);
            }
        });

        // Первичная обработка
        setTimeout(function() {
            processCards();
        }, 1000);

        // Периодическая проверка (для динамических карточек)
        setInterval(function() {
            processCards();
        }, 5000);
    }

    // =============================================
    // Запуск
    // =============================================
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                init();
            }
        });
    }

})();