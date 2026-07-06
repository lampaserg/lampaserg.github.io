(function () {
    'use strict';

    // =============================================
    // Serial Info Card - Полная версия
    // Версия: 1.1.0
    // Обрабатывает ВСЕ карточки сериалов в любых подборках
    // =============================================

    const VERSION = '1.1.0';

    // =============================================
    // РУССКИЕ ПЕРЕВОДЫ (как в MODS's)
    // =============================================
    
    function addTranslations() {
        Lampa.Lang.add({
            'season_new': { ru: 'Новая' },
            'season_ended': { ru: 'сезон завершён' },
            'season_from': { ru: 'из' },
            'torrent_serial_episode': { ru: 'серия' },
            'torrent_serial_season': { ru: 'Сезон' },
            'torrent_parser_voice': { ru: 'Озвучка' },
            'title_continue': { ru: 'Продолжить' },
            'title_watched': { ru: 'Просмотрено' }
        });
    }

    // =============================================
    // Настройки
    // =============================================
    
    const DEFAULTS = {
        enabled: true,
        show_in_lines: true,
        show_in_full: true
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
    // Проверка, является ли карточка сериалом
    // =============================================
    
    function isSerialCard(card) {
        if (!card) return false;
        
        // Проверяем по полям
        var hasSerialFields = !!(card.name || 
                                 card.original_name || 
                                 card.first_air_date || 
                                 card.number_of_seasons || 
                                 card.seasons);
        
        // Проверяем, что это не фильм
        var isMovie = !!(card.release_date && !card.first_air_date);
        
        return hasSerialFields && !isMovie;
    }

    function isValidForSerialInfo(card) {
        if (!card) return false;
        
        // Проверяем источник
        var sourceValid = card.source === 'tmdb' || 
                         card.source === 'cub' || 
                         card.source === undefined;
        
        // Проверяем наличие данных о сезонах
        var hasSeasonsData = !!(card.seasons && card.seasons.length > 0 && 
                               card.last_episode_to_air);
        
        // Для карточек без seasons, но с number_of_seasons
        var hasBasicData = !!(card.number_of_seasons && card.number_of_seasons > 0);
        
        return sourceValid && (hasSeasonsData || hasBasicData);
    }

    // =============================================
    // Функция last_view из Modss
    // =============================================
    
    function lastView(card) {
        try {
            var episodes = Lampa.TimeTable.get(card);
            var viewed;
            
            if (!episodes || !episodes.length) return;
            
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

    // =============================================
    // Функция serialInfo из Modss (расширенная)
    // =============================================
    
    function serialInfo(card) {
        try {
            if (!card) return false;
            if (!isValidForSerialInfo(card)) return false;

            // Получаем данные о сезонах из разных источников
            var seasons = card.seasons || [];
            var last_episode = card.last_episode_to_air || 
                              (seasons.length > 0 && seasons[seasons.length - 1]);

            if (!last_episode) return false;

            var last_seria_inseason = last_episode.season_number || 1;
            var next_episode = card.next_episode_to_air;
            var last_seria = next_episode && new Date(next_episode.air_date) <= Date.now() 
                ? next_episode.episode_number 
                : (last_episode.episode_number || 0);
            var new_ser;
            
            // Находим количество серий в последнем сезоне
            var seasonData = seasons.find(function (eps) {
                return eps.season_number == last_seria_inseason;
            });
            var count_eps_last_seas = seasonData ? seasonData.episode_count || 0 : 
                                      (card.number_of_episodes || 0);

            // Формируем текст
            if (next_episode) {
                var add_ = '<b>' + (last_seria || '');
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
                                add_ = Lampa.Lang.translate('season_new') + ' <b>' + (episod_new[last_seria_inseason] || last_seria);
                            }
                        } catch (e) {}
                    }
                }
                new_ser = add_ + '</b> ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + 
                          Lampa.Lang.translate('season_from') + ' ' + count_eps_last_seas + ' - S' + last_seria_inseason;
            } else {
                new_ser = last_seria_inseason + ' ' + Lampa.Lang.translate('season_ended');
            }

            // Проверяем активную карточку
            var activityRender = Lampa.Activity.active().activity.render();
            if (activityRender && $('.card--new_seria', activityRender).length === 0) {
                var isMobile = window.innerWidth <= 585;

                if (!isMobile) {
                    var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                    if (poster.length) {
                        poster.append(
                            "<div class='card--new_seria' style='right: -0.6em!important;position: absolute;background: #168FDF;color: #fff;bottom:.6em!important;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;z-index:10;'>" + 
                            Lampa.Lang.translate(new_ser) + 
                            "</div>"
                        );
                    }
                } else {
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

                lastView(card);
            }
            
            return true;
        } catch (e) {
            console.error('[SerialInfo] serialInfo error:', e);
            return false;
        }
    }

    // =============================================
    // Обработка ВСЕХ карточек в подборках
    // =============================================
    
    function processAllCards() {
        try {
            var settings = getSettings();
            if (!settings.enabled) return;

            // Обрабатываем ВСЕ карточки на странице
            $('.card:not(.serial-info-checked)').each(function() {
                var card = $(this);
                
                // Пропускаем баннеры и служебные карточки
                if (card.hasClass('hero-banner')) return;
                if (card.hasClass('card--category')) return;
                if (card.hasClass('card-more')) return;
                
                var cardData = card.data('item') || 
                              (card[0] && (card[0].card_data || card[0].item)) || 
                              null;
                
                if (!cardData) return;
                
                // Проверяем, является ли карточка сериалом
                if (!isSerialCard(cardData)) return;
                
                // Проверяем наличие данных для отображения
                if (!isValidForSerialInfo(cardData)) {
                    // Для карточек без полных данных показываем базовую информацию
                    if (cardData.number_of_seasons) {
                        var view = card.find('.card__view');
                        if (view.length) {
                            var info = cardData.number_of_seasons + ' сез';
                            if (cardData.number_of_episodes) {
                                info += ', ' + cardData.number_of_episodes + ' эп.';
                            }
                            view.append(
                                '<div class="card--new_seria" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                                'background:rgba(0,0,0,0.7);color:#fff;padding:0.15em 0.5em;font-size:0.6em;border-radius:0.3em;z-index:10;white-space:nowrap;">' +
                                info +
                                '</div>'
                            );
                        }
                    }
                    card.addClass('serial-info-checked');
                    return;
                }
                
                // Получаем данные о сериале и отображаем информацию
                getTvInfo(cardData, function(tvInfo) {
                    if (tvInfo) {
                        injectSerialInfoToCard(card, cardData, tvInfo);
                    } else if (cardData.number_of_seasons) {
                        // Если TMDB не ответил, показываем базовую информацию
                        var view = card.find('.card__view');
                        if (view.length) {
                            var info = cardData.number_of_seasons + ' сез';
                            if (cardData.number_of_episodes) {
                                info += ', ' + cardData.number_of_episodes + ' эп.';
                            }
                            view.append(
                                '<div class="card--new_seria" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                                'background:rgba(0,0,0,0.7);color:#fff;padding:0.15em 0.5em;font-size:0.6em;border-radius:0.3em;z-index:10;white-space:nowrap;">' +
                                info +
                                '</div>'
                            );
                        }
                    }
                });
                
                card.addClass('serial-info-checked');
            });
        } catch (e) {
            console.error('[SerialInfo] processAllCards error:', e);
        }
    }

    // =============================================
    // Получение данных из TMDB с кешем
    // =============================================
    
    var tvCache = {};

    function getTvInfo(card, callback) {
        if (!card || !card.id) {
            callback(null);
            return;
        }

        var id = card.id;
        
        // Проверяем кеш
        if (tvCache[id] && (Date.now() - tvCache[id].timestamp < 3600000)) {
            callback(tvCache[id].data);
            return;
        }

        var lang = Lampa.Storage.get('language', 'ru');
        var url = Lampa.TMDB.api('tv/' + id + '?language=' + lang);
        var network = new Lampa.Reguest();

        network.timeout(10000);
        network.silent(url, function(data) {
            if (data && data.id) {
                tvCache[id] = {
                    data: data,
                    timestamp: Date.now()
                };
                callback(data);
            } else {
                callback(null);
            }
        }, function() {
            callback(null);
        });
    }

    // =============================================
    // Инъекция информации в карточку
    // =============================================
    
    function injectSerialInfoToCard(cardElement, cardData, tvInfo) {
        try {
            if (!tvInfo) return;
            
            var view = cardElement.find('.card__view');
            if (!view.length) return;

            var seasonCount = tvInfo.number_of_seasons || 0;
            var episodeCount = tvInfo.number_of_episodes || 0;
            
            if (seasonCount === 0 && episodeCount === 0) return;

            var info = seasonCount + ' сез';
            if (episodeCount) {
                info += ', ' + episodeCount + ' эп.';
            }

            // Добавляем информацию на карточку
            view.append(
                '<div class="card--new_seria" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                'background:rgba(0,0,0,0.7);color:#fff;padding:0.15em 0.5em;font-size:0.6em;border-radius:0.3em;z-index:10;white-space:nowrap;">' +
                info +
                '</div>'
            );

            // Если есть данные о последней серии
            if (tvInfo.last_episode_to_air) {
                var lastEp = tvInfo.last_episode_to_air;
                view.append(
                    '<div class="serial-episode-number" style="position:absolute;bottom:2.5em;left:0.5em;' +
                    'padding:0.15em 0.4em;font-size:0.6em;font-weight:bold;color:#fff;' +
                    'background:rgba(22,143,223,0.85);border-radius:0.3em;z-index:10;">' +
                    'S' + lastEp.season_number + ':E' + lastEp.episode_number +
                    '</div>'
                );
            }

            // Если есть следующая серия
            if (tvInfo.next_episode_to_air) {
                var nextEp = tvInfo.next_episode_to_air;
                var now = new Date();
                var airDate = new Date(nextEp.air_date);
                var diffDays = Math.ceil((airDate - now) / (1000 * 60 * 60 * 24));

                if (diffDays >= -7 && diffDays <= 30) {
                    var label = diffDays <= 0 ? 'Новая' : 'Скоро';
                    view.append(
                        '<div class="serial-new-badge" style="position:absolute;top:0.5em;left:0.5em;' +
                        'padding:0.15em 0.4em;font-size:0.55em;font-weight:bold;color:#fff;' +
                        'background:#FF6B35;border-radius:0.3em;z-index:10;">' +
                        label +
                        '</div>'
                    );
                }
            }

            // Статус сериала
            if (tvInfo.status) {
                var statusMap = {
                    'returning series': 'Онгоинг',
                    'ended': 'Завершен',
                    'canceled': 'Отменен'
                };
                var statusText = statusMap[tvInfo.status] || tvInfo.status;
                view.append(
                    '<div class="serial-status" style="position:absolute;top:0.5em;right:0.5em;' +
                    'padding:0.15em 0.4em;font-size:0.5em;font-weight:bold;color:#fff;' +
                    'background:rgba(0,0,0,0.6);border-radius:0.3em;z-index:10;">' +
                    statusText +
                    '</div>'
                );
            }
        } catch (e) {
            console.error('[SerialInfo] injectSerialInfoToCard error:', e);
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
                    z-index: 10;
                }

                .serial-new-badge {
                    position: absolute;
                    top: 0.5em;
                    left: 0.5em;
                    padding: 0.15em 0.4em;
                    font-size: 0.55em;
                    font-weight: bold;
                    color: #fff;
                    background: #FF6B35;
                    border-radius: 0.3em;
                    z-index: 10;
                }

                .serial-status {
                    position: absolute;
                    top: 0.5em;
                    right: 0.5em;
                    padding: 0.15em 0.4em;
                    font-size: 0.5em;
                    font-weight: bold;
                    color: #fff;
                    background: rgba(0, 0, 0, 0.6);
                    border-radius: 0.3em;
                    z-index: 10;
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
                    .serial-episode-number,
                    .serial-new-badge,
                    .serial-status {
                        font-size: 0.45em;
                        padding: 0.1em 0.3em;
                    }
                }

                .card:not(.card--loaded) .card--new_seria,
                .card:not(.card--loaded) .card--last_view,
                .card:not(.card--loaded) .serial-episode-number,
                .card:not(.card--loaded) .serial-new-badge,
                .card:not(.card--loaded) .serial-status {
                    display: none;
                }
            </style>
        `;

        $('head').append(css);
    }

    // =============================================
    // Настройки
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
                        processAllCards();
                        processCurrentCard();
                    }, 500);
                } else {
                    $('.card--new_seria, .card--last_view, .timeline, .serial-episode-number, .serial-new-badge, .serial-status').remove();
                    $('.full-start__tag.card--new_seria').remove();
                    $('.serial-info-checked').removeClass('serial-info-checked');
                }
            }
        });
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
            
            if (isSerialCard(card) && isValidForSerialInfo(card)) {
                serialInfo(card);
            }
        } catch (e) {
            console.error('[SerialInfo] processCurrentCard error:', e);
        }
    }

    // =============================================
    // MutationObserver для отслеживания новых карточек
    // =============================================

    var observer = null;

    function setupObserver() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver(function(mutations) {
            var shouldProcess = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    shouldProcess = true;
                }
            });
            
            if (shouldProcess) {
                clearTimeout(observer.timeout);
                observer.timeout = setTimeout(function() {
                    processAllCards();
                }, 300);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // =============================================
    // Инициализация
    // =============================================

    function init() {
        console.log('[SerialInfo] Plugin v' + VERSION + ' loaded');

        addTranslations();
        addStyles();
        addSettings();

        // Слушаем события
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                setTimeout(function() {
                    processCurrentCard();
                    processAllCards();
                }, 500);
            }
        });

        Lampa.Listener.follow('line', function(e) {
            if (e.type === 'visible' || e.type === 'append') {
                setTimeout(function() {
                    processAllCards();
                }, 300);
            }
        });

        Lampa.Listener.follow('activity', function(e) {
            if (e.type === 'start') {
                setTimeout(function() {
                    processAllCards();
                    if (e.component === 'full') {
                        processCurrentCard();
                    }
                }, 500);
            }
        });

        // Устанавливаем MutationObserver
        setupObserver();

        // Первичная обработка
        setTimeout(function() {
            processAllCards();
            processCurrentCard();
        }, 1000);

        // Периодическая проверка
        setInterval(function() {
            processAllCards();
        }, 3000);

        console.log('[SerialInfo] Plugin ready - processing all cards');
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
