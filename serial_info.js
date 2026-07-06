(function () {
    'use strict';

    // =============================================
    // Serial Info Card - Точная копия Modss с русификацией
    // Версия: 1.0.0
    // Полностью повторяет логику Modss.serialInfo() с русскими переводами
    // =============================================

    const PLUGIN_NAME = 'serial_info_card';
    const VERSION = '1.0.0';

    // =============================================
    // РУССКИЕ ПЕРЕВОДЫ (как в MODS's)
    // =============================================
    
    function addTranslations() {
        Lampa.Lang.add({
            'season_new': {
                ru: 'Новая'
            },
            'season_ended': {
                ru: 'сезон завершён'
            },
            'season_from': {
                ru: 'из'
            },
            'torrent_serial_episode': {
                ru: 'серия'
            },
            'torrent_serial_season': {
                ru: 'Сезон'
            },
            'torrent_parser_voice': {
                ru: 'Озвучка'
            },
            'title_continue': {
                ru: 'Продолжить'
            },
            'title_watched': {
                ru: 'Просмотрено'
            },
            'empty_text': {
                ru: 'Нет данных'
            },
            'empty_title_two': {
                ru: 'Информация не найдена'
            }
        });
    }

    // =============================================
    // Настройки
    // =============================================
    
    const DEFAULTS = {
        enabled: true
    };

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
    // Ключевые функции из Modss (полная копия)
    // =============================================

    // Функция last_view из Modss
    function lastView(card) {
        try {
            var episodes = Lampa.TimeTable.get(card);
            var viewed;
            
            episodes.forEach(function (ep) {
                var hash = Lampa.Utils.hash([ep.season_number, ep.episode_number, card.original_title].join(''));
                var view = Lampa.Timeline.view(hash);
                if (view && view.percent) {
                    viewed = {
                        ep: ep,
                        view: view
                    };
                }
            });
            
            if (viewed) {
                var ep = viewed.ep.episode_number;
                var se = viewed.ep.season_number;
                var last_view = 'S' + se + ':E' + ep;
                
                // Удаляем старые элементы
                $('.timeline, .card--last_view').remove();
                
                // Добавляем на постер
                var poster = $('.full-start__poster, .full-start-new__poster');
                if (poster.length) {
                    poster.append(
                        "<div class='card--last_view' style='top:0.6em;right: -.5em;position: absolute;background: #168FDF;color: #fff;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;z-index:10;'>" +
                        "<div style='float:left;margin:-5px 0 -4px -4px' class='card__icon icon--history'></div>" + 
                        last_view + 
                        "</div>"
                    );
                    
                    // Добавляем таймлайн
                    poster.parent().append('<div class="timeline"></div>');
                    $('body').find('.timeline').append(Lampa.Timeline.render(viewed.view));
                }
            } else {
                $('.timeline,.card--last_view').remove();
            }
        } catch (e) {
            console.error('[SerialInfo] lastView error:', e);
        }
    }

    // Функция serialInfo из Modss (точная копия)
    function serialInfo(card) {
        try {
            if (!card || !card.source || card.source !== 'tmdb') return false;
            if (!card.seasons || !card.last_episode_to_air) return false;

            var last_seria_inseason = card.last_episode_to_air.season_number;
            var air_new_episode = card.last_episode_to_air.episode_number;
            var next_episode = card.next_episode_to_air;
            var last_seria = next_episode && new Date(next_episode.air_date) <= Date.now() 
                ? next_episode.episode_number 
                : card.last_episode_to_air.episode_number;
            var new_ser;
            
            // Находим количество серий в последнем сезоне
            var seasonData = card.seasons.find(function (eps) {
                return eps.season_number == last_seria_inseason;
            });
            var count_eps_last_seas = seasonData ? seasonData.episode_count : 0;

            // Формируем текст (с русскими переводами)
            if (card.next_episode_to_air) {
                var add_ = '<b>' + last_seria;
                var notices = Lampa.Storage.get('account_notice', []).filter(function (n) {
                    return n.card_id == card.id;
                });
                
                if (notices.length) {
                    var notice = notices.find(function (itm) {
                        return itm.episode == last_seria;
                    });
                    
                    if (notice) {
                        try {
                            var episod_new = JSON.parse(notice.data).card.seasons;
                            if (Lampa.Utils.parseTime(notice.date).full == Lampa.Utils.parseTime(Date.now()).full) {
                                add_ = Lampa.Lang.translate('season_new') + ' <b>' + episod_new[last_seria_inseason];
                            }
                        } catch (e) {}
                    }
                }
                new_ser = add_ + '</b> ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + 
                          Lampa.Lang.translate('season_from') + ' ' + count_eps_last_seas + ' - S' + last_seria_inseason;
            } else {
                new_ser = last_seria_inseason + ' ' + Lampa.Lang.translate('season_ended');
            }

            // Получаем рендер активности
            var activityRender = Lampa.Activity.active().activity.render();
            if (!activityRender) return false;

            // Проверяем, нет ли уже элемента
            if ($('.card--new_seria', activityRender).length > 0) {
                return true;
            }

            // Определяем ширину экрана
            var isMobile = window.innerWidth <= 585;

            if (!isMobile) {
                // Десктоп версия - бейдж на постере
                var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                if (poster.length) {
                    poster.append(
                        "<div class='card--new_seria' style='right: -0.6em!important;position: absolute;background: #168FDF;color: #fff;bottom:.6em!important;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;z-index:10;'>" + 
                        Lampa.Lang.translate(new_ser) + 
                        "</div>"
                    );
                }
            } else {
                // Мобильная версия
                var tags = $('.full-start__tags', activityRender);
                var details = $('.full-start-new__details', activityRender);
                
                if (tags.length && $('.card--new_seria', tags).length === 0) {
                    tags.append(
                        '<div class="full-start__tag card--new_seria">' +
                        '<img src="./img/icons/menu/movie.svg" style="width: 1em; height: 1em; margin-right: 0.3em;" />' +
                        '<div style="font-size: 0.9em;">' + Lampa.Lang.translate(new_ser) + '</div>' +
                        '</div>'
                    );
                } else if (details.length) {
                    details.append(
                        '<span class="full-start-new__split">●</span>' +
                        '<div class="card--new_seria" style="display: inline-block; background: #168FDF; color: #fff; padding: 0.2em 0.5em; border-radius: 0.3em; font-size: 0.8em;">' +
                        '<div>' + Lampa.Lang.translate(new_ser) + '</div>' +
                        '</div>'
                    );
                }
            }

            // Вызываем last_view для отображения последнего просмотра
            lastView(card);
            
            return true;
        } catch (e) {
            console.error('[SerialInfo] serialInfo error:', e);
            return false;
        }
    }

    // =============================================
    // Обработка карточек в ленте (упрощенная версия)
    // =============================================

    function processCardsInLine() {
        try {
            $('.card:not(.serial-info-checked)').each(function() {
                var card = $(this);
                card.addClass('serial-info-checked');
                
                if (card.hasClass('hero-banner')) return;
                if (card.hasClass('card--category')) return;
                
                var cardData = card.data('item') || 
                              (card[0] && (card[0].card_data || card[0].item)) || 
                              null;
                
                if (cardData && cardData.source === 'tmdb' && cardData.seasons && cardData.last_episode_to_air) {
                    var view = card.find('.card__view');
                    if (view.length) {
                        var info = cardData.number_of_seasons + ' сез' + 
                                  (cardData.number_of_episodes ? ', ' + cardData.number_of_episodes + ' эп.' : '');
                        view.append(
                            '<div class="card--new_seria" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                            'background:rgba(0,0,0,0.7);color:#fff;padding:0.15em 0.5em;font-size:0.6em;border-radius:0.3em;z-index:10;white-space:nowrap;">' +
                            info +
                            '</div>'
                        );
                    }
                }
            });
        } catch (e) {
            console.error('[SerialInfo] processCardsInLine error:', e);
        }
    }

    // =============================================
    // Обработка текущей карточки
    // =============================================

    function processCurrentCard() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return;
            
            var card = active.card;
            if (!card) return;
            
            if (card.source === 'tmdb' && card.seasons && card.last_episode_to_air) {
                serialInfo(card);
            }
        } catch (e) {
            console.error('[SerialInfo] processCurrentCard error:', e);
        }
    }

    // =============================================
    // Стили
    // =============================================

    function addStyles() {
        if (document.getElementById('serial-info-styles')) return;

        var css = `
            <style id="serial-info-styles">
                .card--new_seria {
                    background: #168FDF;
                    color: #fff;
                    padding: 0.4em 0.4em;
                    font-size: 1.2em;
                    -webkit-border-radius: 0.3em;
                    -moz-border-radius: 0.3em;
                    border-radius: 0.3em;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                .card--last_view {
                    background: #168FDF;
                    color: #fff;
                    padding: 0.4em 0.4em;
                    font-size: 1.2em;
                    -webkit-border-radius: 0.3em;
                    -moz-border-radius: 0.3em;
                    border-radius: 0.3em;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    gap: 0.3em;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                .card--last_view .card__icon.icon--history {
                    display: inline-block;
                    width: 1.2em;
                    height: 1.2em;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4l-2.5 1.5 1 1.5 3.5-2V7h-2z'/%3E%3C/svg%3E");
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }

                .timeline {
                    margin: 0.5em 0;
                    padding: 0 0.5em;
                }

                .timeline .time-line__bar {
                    height: 4px;
                    border-radius: 2px;
                }

                .full-start__tag.card--new_seria {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3em;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.2em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.8em;
                    margin-left: 0.5em;
                }

                .full-start-new__details .card--new_seria {
                    background: #168FDF;
                    color: #fff;
                    padding: 0.2em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.8em;
                    display: inline-block;
                }

                @media (max-width: 585px) {
                    .card--new_seria,
                    .card--last_view {
                        font-size: 0.8em;
                        padding: 0.2em 0.3em;
                    }
                    .card--last_view .card__icon.icon--history {
                        width: 0.8em;
                        height: 0.8em;
                    }
                }

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
        Lampa.SettingsApi.addComponent({
            component: 'serial_info',
            name: 'Информация о сериале',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 4v16"/><path d="M16 4v16"/><path d="M2 10h20"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_enabled',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Включить информацию о сериале',
                description: 'Отображает информацию о количестве серий в карточке, в том числе последнюю серию на постере'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.enabled = value === 'true' || value === true;
                setSettings(settings);
                
                if (settings.enabled) {
                    setTimeout(function() {
                        processCurrentCard();
                        processCardsInLine();
                    }, 500);
                } else {
                    $('.card--new_seria, .card--last_view, .timeline').remove();
                    $('.full-start__tag.card--new_seria').remove();
                    $('.serial-info-checked').removeClass('serial-info-checked');
                }
            }
        });
    }

    // =============================================
    // Инициализация
    // =============================================

    function init() {
        console.log('[SerialInfo] Plugin v' + VERSION + ' loaded');

        // Добавляем русские переводы
        addTranslations();

        var settings = getSettings();
        if (!settings.enabled) return;

        addStyles();
        addSettings();

        // Слушаем события
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                setTimeout(function() {
                    processCurrentCard();
                }, 300);
            }
        });

        Lampa.Listener.follow('activity', function(e) {
            if (e.type === 'start' && e.component === 'full') {
                setTimeout(function() {
                    processCurrentCard();
                }, 500);
            }
        });

        Lampa.Listener.follow('line', function(e) {
            if (e.items) {
                setTimeout(function() {
                    processCardsInLine();
                }, 300);
            }
        });

        // Запускаем при загрузке
        setTimeout(function() {
            processCurrentCard();
            processCardsInLine();
        }, 1500);

        // Периодическая проверка
        setInterval(function() {
            processCardsInLine();
        }, 5000);

        console.log('[SerialInfo] Plugin ready with Russian translations');
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
