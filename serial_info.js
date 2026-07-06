(function () {
    'use strict';

    // =============================================
    // Serial Info Card Plugin for Lampa
    // Версия: 1.0.0
    // Автономный плагин без зависимостей от MODS's
    // Отображает информацию о сериале на карточке
    // =============================================

    const PLUGIN_NAME = 'serial_info_card';
    const VERSION = '1.0.0';

    // Настройки по умолчанию
    const DEFAULTS = {
        enabled: true,
        show_seasons: true,
        show_episodes: true,
        show_status: true,
        show_new_series: true,
        show_last_view: true
    };

    // =============================================
    // Хранилище настроек
    // =============================================
    function getSettings() {
        try {
            const settings = Lampa.Storage.get('serial_info_settings', {});
            return Object.assign({}, DEFAULTS, settings);
        } catch (e) {
            return DEFAULTS;
        }
    }

    function setSettings(settings) {
        try {
            Lampa.Storage.set('serial_info_settings', settings);
        } catch (e) {
            console.error('[SerialInfo] Save settings error:', e);
        }
    }

    // =============================================
    // Утилиты
    // =============================================
    function isSerial(card) {
        return !!(card && (card.name || card.original_name || card.first_air_date || card.number_of_seasons));
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

    // =============================================
    // Получение последнего просмотра (как в Modss)
    // =============================================
    function getLastViewData(card) {
        try {
            const file_id = Lampa.Utils.hash(getCardTitle(card));
            const watched = Lampa.Storage.cache('online_watched_last', 5000, {});
            const data = watched[file_id];

            if (data && data.season && data.episode) {
                return {
                    season: data.season,
                    episode: data.episode,
                    balanser_name: data.balanser_name || ''
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
        const cacheKey = 'serial_info_tv_' + id;
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
            if (data && data.id) {
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
    // Создание элементов как в Modss
    // =============================================
    function createModssStyleBadge(cardData, tvInfo, lastView) {
        const settings = getSettings();
        if (!settings.enabled) return '';
        if (!isSerial(cardData) || !tvInfo) return '';

        let result = '';
        const isMobile = window.innerWidth < 585;
        
        // --- 1. Информация о сезонах (как в Modss) ---
        if (settings.show_seasons || settings.show_episodes) {
            let parts = [];
            
            if (settings.show_seasons && tvInfo.number_of_seasons) {
                const word = numWord(tvInfo.number_of_seasons, ['', 'а', 'ов']);
                parts.push(tvInfo.number_of_seasons + ' сез' + word);
            }
            
            if (settings.show_episodes && tvInfo.number_of_episodes) {
                const word = numWord(tvInfo.number_of_episodes, ['', 'а', 'ов']);
                parts.push(tvInfo.number_of_episodes + ' эпизод' + word);
            }
            
            if (parts.length > 0) {
                const text = parts.join(' • ');
                if (isMobile) {
                    // Для мобильных добавляем в теги
                    result += '<span class="full-start__tag card--new_seria" style="margin-left: 0.5em;">' +
                              '<img src="./img/icons/menu/movie.svg" style="width: 1em; height: 1em; margin-right: 0.3em;">' +
                              '<div style="font-size: 0.9em;">' + text + '</div>' +
                              '</span>';
                } else {
                    // Для десктопа - бейдж на постере
                    result += '<div class="card--new_seria" style="' +
                              'position: absolute;' +
                              'right: -0.6em !important;' +
                              'bottom: 0.6em !important;' +
                              'background: #168FDF;' +
                              'color: #fff;' +
                              'padding: 0.3em 0.6em;' +
                              'font-size: 1em;' +
                              '-webkit-border-radius: 0.3em;' +
                              '-moz-border-radius: 0.3em;' +
                              'border-radius: 0.3em;' +
                              'z-index: 10;' +
                              '">' + text + '</div>';
                }
            }
        }

        // --- 2. Статус сериала (как в Modss) ---
        if (settings.show_status && tvInfo.status) {
            const statusMap = {
                'returning series': 'Онгоинг',
                'ended': 'Закончен',
                'canceled': 'Отменен',
                'in production': 'В производстве',
                'planned': 'Запланирован',
                'released': 'Выпущенный'
            };
            const statusText = statusMap[tvInfo.status] || tvInfo.status;
            
            if (!isMobile) {
                result += '<div class="card--new_seria" style="' +
                          'position: absolute;' +
                          'right: -0.6em !important;' +
                          'top: 0.6em !important;' +
                          'background: ' + (tvInfo.status === 'returning series' ? '#4CAF50' : '#666') + ';' +
                          'color: #fff;' +
                          'padding: 0.2em 0.5em;' +
                          'font-size: 0.8em;' +
                          '-webkit-border-radius: 0.3em;' +
                          '-moz-border-radius: 0.3em;' +
                          'border-radius: 0.3em;' +
                          'z-index: 10;' +
                          '">' + statusText + '</div>';
            }
        }

        // --- 3. Номер последней серии на постере (как в Modss) ---
        if (tvInfo.last_episode_to_air) {
            const lastEp = tvInfo.last_episode_to_air;
            const season = lastEp.season_number || 0;
            const episode = lastEp.episode_number || 0;
            
            if (season > 0 && episode > 0) {
                const epText = 'S' + season + ':E' + episode;
                
                // Как в Modss - на постере
                result += '<div class="card--last_view" style="' +
                          'position: absolute;' +
                          'top: 0.6em;' +
                          'right: -0.5em;' +
                          'background: #168FDF;' +
                          'color: #fff;' +
                          'padding: 0.3em 0.5em;' +
                          'font-size: 1em;' +
                          '-webkit-border-radius: 0.3em;' +
                          '-moz-border-radius: 0.3em;' +
                          'border-radius: 0.3em;' +
                          'z-index: 10;' +
                          '">' +
                          '<div style="float:left;margin:-3px 0 -3px -3px" class="card__icon icon--history"></div>' +
                          epText +
                          '</div>';
            }
        }

        // --- 4. Новая серия (как в Modss) ---
        if (settings.show_new_series && tvInfo.next_episode_to_air) {
            const nextEp = tvInfo.next_episode_to_air;
            const now = new Date();
            const airDate = new Date(nextEp.air_date);
            const diffDays = Math.ceil((airDate - now) / (1000 * 60 * 60 * 24));

            // Показываем если серия выйдет в ближайшие 30 дней или вышла недавно
            if (diffDays >= -7 && diffDays <= 30) {
                let label = '';
                if (diffDays === 0) label = 'Сегодня';
                else if (diffDays === 1) label = 'Завтра';
                else if (diffDays > 1 && diffDays <= 7) label = 'Через ' + diffDays + ' дн.';
                else if (diffDays > 7) label = 'Скоро';
                else label = 'Новая';

                if (isMobile) {
                    result += '<span class="full-start__tag" style="margin-left: 0.5em; background: #FF6B35; color: #fff;">' +
                              '<img src="./img/icons/menu/movie.svg" style="width: 1em; height: 1em; margin-right: 0.3em;">' +
                              '<div style="font-size: 0.9em;">' + label + ' S' + nextEp.season_number + 'E' + nextEp.episode_number + '</div>' +
                              '</span>';
                } else {
                    result += '<div class="card--new_seria" style="' +
                              'position: absolute;' +
                              'left: -0.6em !important;' +
                              'top: 0.6em !important;' +
                              'background: #FF6B35;' +
                              'color: #fff;' +
                              'padding: 0.2em 0.5em;' +
                              'font-size: 0.8em;' +
                              '-webkit-border-radius: 0.3em;' +
                              '-moz-border-radius: 0.3em;' +
                              'border-radius: 0.3em;' +
                              'z-index: 10;' +
                              '">' + label + '</div>';
                }
            }
        }

        // --- 5. Последний просмотр (как в Modss) ---
        if (settings.show_last_view && lastView) {
            const text = 'S' + lastView.season + ':E' + lastView.episode;
            
            if (isMobile) {
                result += '<span class="full-start__tag" style="margin-left: 0.5em; background: #4CAF50; color: #fff;">' +
                          '<img src="./img/icons/menu/movie.svg" style="width: 1em; height: 1em; margin-right: 0.3em;">' +
                          '<div style="font-size: 0.9em;">Продолжить ' + text + '</div>' +
                          '</span>';
            } else {
                result += '<div class="card--last_view" style="' +
                          'position: absolute;' +
                          'bottom: 0.6em;' +
                          'right: -0.5em;' +
                          'background: #4CAF50;' +
                          'color: #fff;' +
                          'padding: 0.2em 0.5em;' +
                          'font-size: 0.8em;' +
                          '-webkit-border-radius: 0.3em;' +
                          '-moz-border-radius: 0.3em;' +
                          'border-radius: 0.3em;' +
                          'z-index: 10;' +
                          '">▶ ' + text + '</div>';
            }
        }

        return result;
    }

    // =============================================
    // Инъекция информации в карточку
    // =============================================
    function injectSerialInfo(cardElement, cardData) {
        const settings = getSettings();
        if (!settings.enabled) return;
        if (!isSerial(cardData)) return;

        // Проверяем, есть ли уже информация
        if (cardElement.find('.card--new_seria, .card--last_view').length > 0) {
            return;
        }

        const view = cardElement.find('.card__view');
        if (!view.length) return;

        // Получаем данные о сериале
        getTvInfo(cardData, function(tvInfo) {
            if (!tvInfo) return;

            const lastView = getLastViewData(cardData);
            const html = createModssStyleBadge(cardData, tvInfo, lastView);
            
            if (html) {
                view.append(html);
                
                // Добавляем таймлайн если есть просмотр
                if (lastView && settings.show_last_view) {
                    const hash = Lampa.Utils.hash([
                        lastView.season,
                        lastView.season > 10 ? ':' : '',
                        lastView.episode,
                        getCardTitle(cardData)
                    ].join(''));
                    
                    const tl = Lampa.Timeline.view(hash);
                    if (tl && tl.percent > 0 && tl.percent < 100) {
                        // Добавляем таймлайн в карточку
                        const timelineHtml = '<div class="time-line" style="margin: 0.5em 0;">' +
                                             Lampa.Timeline.render(tl) +
                                             '</div>';
                        
                        // Ищем место для таймлайна
                        const body = cardElement.find('.card__body, .card__view');
                        if (body.length) {
                            body.append(timelineHtml);
                        }
                    }
                }
            }
        });
    }

    // =============================================
    // Обработка карточек
    // =============================================
    function processCards() {
        const settings = getSettings();
        if (!settings.enabled) return;

        $('.card:not(.serial-info-processed)').each(function() {
            const card = $(this);
            
            // Пропускаем баннеры и карточки без сериалов
            if (card.hasClass('hero-banner')) return;
            if (card.hasClass('card--category')) return;
            if (card.find('.card__view').length === 0) return;

            const cardData = card.data('item') || 
                           (card[0] && (card[0].card_data || card[0].item)) || 
                           null;

            if (cardData && isSerial(cardData)) {
                card.addClass('serial-info-processed');
                injectSerialInfo(card, cardData);
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
                /* Стили для бейджей как в Modss */
                .card--new_seria {
                    position: absolute;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.3em 0.6em;
                    font-size: 1em;
                    -webkit-border-radius: 0.3em;
                    -moz-border-radius: 0.3em;
                    border-radius: 0.3em;
                    z-index: 10;
                    pointer-events: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                .card--last_view {
                    position: absolute;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.3em 0.5em;
                    font-size: 1em;
                    -webkit-border-radius: 0.3em;
                    -moz-border-radius: 0.3em;
                    border-radius: 0.3em;
                    z-index: 10;
                    pointer-events: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    gap: 0.3em;
                }

                .card--last_view .card__icon {
                    display: inline-block;
                    width: 1.2em;
                    height: 1.2em;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }

                .card--last_view .card__icon.icon--history {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4l-2.5 1.5 1 1.5 3.5-2V7h-2z'/%3E%3C/svg%3E");
                }

                /* Таймлайн в карточке */
                .card .time-line {
                    margin: 0.5em 0;
                    padding: 0 0.5em;
                }

                .card .time-line .time-line__bar {
                    height: 4px;
                    border-radius: 2px;
                }

                /* Адаптация для мобильных */
                @media (max-width: 585px) {
                    .card--new_seria,
                    .card--last_view {
                        font-size: 0.7em;
                        padding: 0.15em 0.4em;
                    }
                    .card--last_view .card__icon {
                        width: 0.8em;
                        height: 0.8em;
                    }
                }

                /* Для карточек без постера */
                .card:not(.card--loaded) .card--new_seria,
                .card:not(.card--loaded) .card--last_view {
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

        // Добавляем компонент в настройки
        Lampa.SettingsApi.addComponent({
            component: 'serial_info',
            name: 'Информация о сериале',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 4v16"/><path d="M16 4v16"/><path d="M2 10h20"/></svg>'
        });

        // Включить/выключить
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
                refreshCards();
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
                name: 'serial_info_new_series',
                type: 'trigger',
                default: settings.show_new_series
            },
            field: {
                name: 'Показывать новые серии',
                description: 'Отображать информацию о ближайшей новой серии'
            },
            onChange: function(value) {
                const newSettings = getSettings();
                newSettings.show_new_series = value === 'true' || value === true;
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
            $('.card .card--new_seria, .card .card--last_view, .card .time-line').remove();
            processCards();
        }, 300);
    }

    // =============================================
    // Инициализация
    // =============================================
    function init() {
        console.log('[SerialInfo] Plugin v' + VERSION + ' loaded');

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
                }, 300);
            }
        });

        Lampa.Listener.follow('activity', function(e) {
            if (e.type === 'start') {
                setTimeout(function() {
                    processCards();
                }, 500);
            }
        });

        // Первичная обработка
        setTimeout(function() {
            processCards();
        }, 1500);

        // Периодическая проверка
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
