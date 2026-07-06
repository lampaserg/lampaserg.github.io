(function () {
    'use strict';

    // =============================================
    // Serial Info Card - Полная версия
    // Версия: 1.2.0
    // Отображает информацию на ВСЕХ сериалах
    // =============================================

    const VERSION = '1.2.0';

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
    // Кеш для данных TMDB
    // =============================================
    
    var tvCache = {};
    var CACHE_TIME = 3600000; // 1 час

    // =============================================
    // Настройки
    // =============================================
    
    const DEFAULTS = {
        enabled: true,
        show_seasons: true,
        show_episodes: true,
        show_status: true,
        show_last_view: true
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

    // =============================================
    // Получение данных из TMDB с кешем
    // =============================================
    
    function getTvInfo(card, callback) {
        if (!card || !card.id) {
            callback(null);
            return;
        }

        var id = card.id;
        
        // Проверяем кеш
        if (tvCache[id] && (Date.now() - tvCache[id].timestamp < CACHE_TIME)) {
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
    // Получение последнего просмотра (только для просмотренных)
    // =============================================
    
    function getLastView(card) {
        try {
            var file_id = Lampa.Utils.hash(
                card.original_title || 
                card.original_name || 
                card.title || 
                card.name || 
                ''
            );
            var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
            var data = watched[file_id];

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
    // Формирование текста для бейджа (как в MODS's)
    // =============================================
    
    function getSerialInfoText(card, tvInfo) {
        try {
            if (!tvInfo) return null;

            var last_seria_inseason = 1;
            var count_eps_last_seas = 0;
            var new_ser = '';

            // Получаем данные о последнем сезоне
            if (tvInfo.last_episode_to_air) {
                last_seria_inseason = tvInfo.last_episode_to_air.season_number || 1;
            } else if (tvInfo.number_of_seasons) {
                last_seria_inseason = tvInfo.number_of_seasons;
            }

            // Находим количество серий в последнем сезоне
            if (tvInfo.seasons && tvInfo.seasons.length) {
                var seasonData = tvInfo.seasons.find(function (eps) {
                    return eps.season_number == last_seria_inseason;
                });
                if (seasonData) {
                    count_eps_last_seas = seasonData.episode_count || 0;
                }
            }

            // Если нет данных о сезонах, используем number_of_episodes
            if (!count_eps_last_seas && tvInfo.number_of_episodes) {
                count_eps_last_seas = tvInfo.number_of_episodes;
            }

            var next_episode = tvInfo.next_episode_to_air;
            var last_seria = next_episode && new Date(next_episode.air_date) <= Date.now() 
                ? next_episode.episode_number 
                : (tvInfo.last_episode_to_air ? tvInfo.last_episode_to_air.episode_number : 0);

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
            } else if (tvInfo.status && tvInfo.status === 'ended') {
                new_ser = last_seria_inseason + ' ' + Lampa.Lang.translate('season_ended');
            } else if (tvInfo.number_of_seasons) {
                var word = getNumWord(tvInfo.number_of_seasons, ['', 'а', 'ов']);
                new_ser = tvInfo.number_of_seasons + ' сез' + word;
                if (tvInfo.number_of_episodes) {
                    var epWord = getNumWord(tvInfo.number_of_episodes, ['', 'а', 'ов']);
                    new_ser += ', ' + tvInfo.number_of_episodes + ' эпизод' + epWord;
                }
            }

            return new_ser;
        } catch (e) {
            console.error('[SerialInfo] getSerialInfoText error:', e);
            return null;
        }
    }

    function getNumWord(value, words) {
        value = Math.abs(value) % 100;
        var num = value % 10;
        if (value > 10 && value < 20) return words[2];
        if (num > 1 && num < 5) return words[1];
        if (num == 1) return words[0];
        return words[2];
    }

    // =============================================
    // Отображение информации на карточке (ДЛЯ ВСЕХ СЕРИАЛОВ)
    // =============================================
    
    function injectSerialInfo(cardElement, cardData, tvInfo) {
        try {
            if (!tvInfo) return;
            
            var view = cardElement.find('.card__view');
            if (!view.length) return;

            var settings = getSettings();
            var text = getSerialInfoText(cardData, tvInfo);
            
            if (!text) return;

            // Удаляем старые бейджи
            cardElement.find('.card--new_seria').remove();

            // Добавляем бейдж с информацией о сериале
            view.append(
                '<div class="card--new_seria" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                'background:rgba(0,0,0,0.7);color:#fff;padding:0.15em 0.5em;font-size:0.6em;border-radius:0.3em;z-index:10;white-space:nowrap;">' +
                text +
                '</div>'
            );

            // =============================================
            // Дополнительная информация на постере (ДЛЯ ВСЕХ)
            // =============================================
            
            // Номер последней серии на постере (для всех сериалов)
            if (tvInfo.last_episode_to_air) {
                var lastEp = tvInfo.last_episode_to_air;
                cardElement.find('.serial-episode-number').remove();
                view.append(
                    '<div class="serial-episode-number" style="position:absolute;bottom:2.5em;left:0.5em;' +
                    'padding:0.15em 0.4em;font-size:0.6em;font-weight:bold;color:#fff;' +
                    'background:rgba(22,143,223,0.85);border-radius:0.3em;z-index:10;">' +
                    'S' + lastEp.season_number + ':E' + lastEp.episode_number +
                    '</div>'
                );
            }

            // Статус сериала (для всех)
            if (settings.show_status && tvInfo.status) {
                var statusMap = {
                    'returning series': 'Онгоинг',
                    'ended': 'Завершен',
                    'canceled': 'Отменен',
                    'in production': 'В производстве',
                    'planned': 'Запланирован'
                };
                var statusText = statusMap[tvInfo.status] || tvInfo.status;
                cardElement.find('.serial-status').remove();
                view.append(
                    '<div class="serial-status" style="position:absolute;top:0.5em;right:0.5em;' +
                    'padding:0.15em 0.4em;font-size:0.5em;font-weight:bold;color:#fff;' +
                    'background:rgba(0,0,0,0.6);border-radius:0.3em;z-index:10;">' +
                    statusText +
                    '</div>'
                );
            }

            // Новая серия (для всех)
            if (tvInfo.next_episode_to_air) {
                var nextEp = tvInfo.next_episode_to_air;
                var now = new Date();
                var airDate = new Date(nextEp.air_date);
                var diffDays = Math.ceil((airDate - now) / (1000 * 60 * 60 * 24));

                if (diffDays >= -7 && diffDays <= 30) {
                    var label = diffDays <= 0 ? 'Новая' : 'Скоро';
                    cardElement.find('.serial-new-badge').remove();
                    view.append(
                        '<div class="serial-new-badge" style="position:absolute;top:0.5em;left:0.5em;' +
                        'padding:0.15em 0.4em;font-size:0.55em;font-weight:bold;color:#fff;' +
                        'background:#FF6B35;border-radius:0.3em;z-index:10;">' +
                        label +
                        '</div>'
                    );
                }
            }

            // =============================================
            // Последний просмотр (ТОЛЬКО ДЛЯ ПРОСМОТРЕННЫХ)
            // =============================================
            
            if (settings.show_last_view) {
                var lastView = getLastView(cardData);
                if (lastView) {
                    cardElement.find('.card--last_view').remove();
                    var viewText = 'S' + lastView.season + ':E' + lastView.episode;
                    view.append(
                        "<div class='card--last_view' style='top:0.6em;right: -.5em;position: absolute;background: #168FDF;color: #fff;padding: 0.3em 0.4em;font-size: 0.9em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;z-index:10;display:flex;align-items:center;gap:0.3em;'>" +
                        "<div style='float:left;margin:-3px 0 -3px -3px' class='card__icon icon--history'></div>" + 
                        viewText + 
                        "</div>"
                    );
                }
            }

        } catch (e) {
            console.error('[SerialInfo] injectSerialInfo error:', e);
        }
    }

    // =============================================
    // Обработка ВСЕХ карточек
    // =============================================
    
    function processAllCards() {
        try {
            var settings = getSettings();
            if (!settings.enabled) return;

            $('.card:not(.serial-info-checked)').each(function() {
                var card = $(this);
                
                // Пропускаем баннеры и служебные карточки
                if (card.hasClass('hero-banner')) return;
                if (card.hasClass('card--category')) return;
                if (card.hasClass('card-more')) return;
                if (card.find('.card__view').length === 0) return;
                
                var cardData = card.data('item') || 
                              (card[0] && (card[0].card_data || card[0].item)) || 
                              null;
                
                if (!cardData) return;
                if (!isSerialCard(cardData)) return;
                
                // Проверяем, есть ли уже информация
                if (card.find('.card--new_seria').length > 0) {
                    card.addClass('serial-info-checked');
                    return;
                }

                card.addClass('serial-info-checked');

                // Получаем данные из TMDB
                getTvInfo(cardData, function(tvInfo) {
                    if (tvInfo) {
                        injectSerialInfo(card, cardData, tvInfo);
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
            });
        } catch (e) {
            console.error('[SerialInfo] processAllCards error:', e);
        }
    }

    // =============================================
    // Обработка активной карточки (полный экран)
    // =============================================
    
    function processCurrentCard() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return;
            
            var card = active.card;
            if (!card) return;
            
            if (!isSerialCard(card)) return;

            // Удаляем старые элементы
            var activityRender = Lampa.Activity.active().activity.render();
            if (activityRender) {
                activityRender.find('.card--new_seria, .card--last_view, .timeline, .serial-episode-number, .serial-new-badge, .serial-status').remove();
            }

            // Получаем данные из TMDB
            getTvInfo(card, function(tvInfo) {
                if (tvInfo) {
                    // Отображаем информацию в активной карточке
                    var settings = getSettings();
                    var text = getSerialInfoText(card, tvInfo);
                    
                    if (!text) return;

                    var isMobile = window.innerWidth <= 585;

                    if (!isMobile) {
                        var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                        if (poster.length) {
                            poster.append(
                                "<div class='card--new_seria' style='right: -0.6em!important;position: absolute;background: #168FDF;color: #fff;bottom:.6em!important;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;z-index:10;'>" + 
                                Lampa.Lang.translate(text) + 
                                "</div>"
                            );
                        }
                    } else {
                        var tags = $('.full-start__tags', activityRender);
                        var details = $('.full-start-new__details', activityRender);
                        
                        if (tags.length) {
                            tags.append(
                                '<div class="full-start__tag card--new_seria">' +
                                '<img src="./img/icons/menu/movie.svg" style="width: 1em; height: 1em; margin-right: 0.3em;" />' +
                                '<div style="font-size: 0.9em;">' + Lampa.Lang.translate(text) + '</div>' +
                                '</div>'
                            );
                        } else if (details.length) {
                            details.append(
                                '<span class="full-start-new__split">●</span>' +
                                '<div class="card--new_seria" style="display: inline-block; background: #168FDF; color: #fff; padding: 0.2em 0.5em; border-radius: 0.3em; font-size: 0.8em;">' +
                                '<div>' + Lampa.Lang.translate(text) + '</div>' +
                                '</div>'
                            );
                        }
                    }

                    // Показываем последний просмотр только если есть
                    if (settings.show_last_view) {
                        var lastView = getLastView(card);
                        if (lastView) {
                            var viewText = 'S' + lastView.season + ':E' + lastView.episode;
                            var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                            if (poster.length) {
                                poster.append(
                                    "<div class='card--last_view' style='top:0.6em;right: -.5em;position: absolute;background: #168FDF;color: #fff;padding: 0.3em 0.4em;font-size: 0.9em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;z-index:10;display:flex;align-items:center;gap:0.3em;'>" +
                                    "<div style='float:left;margin:-3px 0 -3px -3px' class='card__icon icon--history'></div>" + 
                                    viewText + 
                                    "</div>"
                                );
                                
                                // Добавляем таймлайн
                                var hash = Lampa.Utils.hash([
                                    lastView.season,
                                    lastView.season > 10 ? ':' : '',
                                    lastView.episode,
                                    card.original_title || card.original_name || ''
                                ].join(''));
                                
                                var tl = Lampa.Timeline.view(hash);
                                if (tl && tl.percent > 0 && tl.percent < 100) {
                                    poster.parent().find('.timeline').remove();
                                    poster.parent().append('<div class="timeline"></div>');
                                    $('.timeline').append(Lampa.Timeline.render(tl));
                                }
                            }
                        }
                    }
                }
            });
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
                    padding: 0.3em 0.4em;
                    font-size: 0.9em;
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
                    width: 1em;
                    height: 1em;
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
                description: 'Отображает информацию о сезонах и сериях на ВСЕХ карточках сериалов'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.enabled = value === 'true' || value === true;
                setSettings(settings);
                
                if (settings.enabled) {
                    $('.serial-info-checked').removeClass('serial-info-checked');
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

        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_last_view',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать последний просмотр',
                description: 'Отображать на постере последнюю просмотренную серию (только для просмотренных)'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_last_view = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });
    }

    function refreshCards() {
        $('.serial-info-checked').removeClass('serial-info-checked');
        $('.card--new_seria, .card--last_view, .timeline, .serial-episode-number, .serial-new-badge, .serial-status').remove();
        setTimeout(function() {
            processAllCards();
            processCurrentCard();
        }, 300);
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

        console.log('[SerialInfo] Plugin ready - processing ALL serials');
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
