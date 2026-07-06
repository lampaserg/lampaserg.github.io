(function () {
    'use strict';

    // =============================================
    // Serial Info Card - Полная версия с правильными склонениями
    // Версия: 1.3.0
    // =============================================

    const VERSION = '1.3.0';

    // =============================================
    // ПРАВИЛЬНЫЕ РУССКИЕ СКЛОНЕНИЯ
    // =============================================
    
    function declension(num, words) {
        // words: [1 (именительный), 2-4 (родительный ед.), 5+ (родительный мн.)]
        // пример: declension(5, ['сезон', 'сезона', 'сезонов']) → 'сезонов'
        num = Math.abs(num) % 100;
        var n1 = num % 10;
        if (num > 10 && num < 20) return words[2];
        if (n1 > 1 && n1 < 5) return words[1];
        if (n1 === 1) return words[0];
        return words[2];
    }

    function getSeasonsText(count) {
        if (!count || count === 0) return '';
        return count + ' ' + declension(count, ['сезон', 'сезона', 'сезонов']);
    }

    function getEpisodesText(count) {
        if (!count || count === 0) return '';
        return count + ' ' + declension(count, ['эпизод', 'эпизода', 'эпизодов']);
    }

    function getSeriesText(count) {
        if (!count || count === 0) return '';
        return count + ' ' + declension(count, ['серия', 'серии', 'серий']);
    }

    // =============================================
    // РУССКИЕ ПЕРЕВОДЫ
    // =============================================
    
    function addTranslations() {
        Lampa.Lang.add({
            'season_new': { ru: 'Новая' },
            'season_ended': { ru: 'сезон завершён' },
            'season_from': { ru: 'из' },
            'torrent_serial_episode': { ru: 'серия' },
            'torrent_serial_season': { ru: 'Сезон' },
            'title_continue': { ru: 'Продолжить' },
            'title_watched': { ru: 'Просмотрено' },
            'serial_info_seasons': { ru: 'Сезоны' },
            'serial_info_episodes': { ru: 'Эпизоды' },
            'serial_info_status': { ru: 'Статус' },
            'serial_info_new_episode': { ru: 'Новые серии' },
            'serial_info_last_view': { ru: 'Последний просмотр' },
            'serial_info_ongoing': { ru: 'Онгоинг' },
            'serial_info_ended': { ru: 'Завершён' },
            'serial_info_canceled': { ru: 'Отменён' },
            'serial_info_in_production': { ru: 'В производстве' },
            'serial_info_planned': { ru: 'Запланирован' },
            'serial_info_today': { ru: 'Сегодня' },
            'serial_info_tomorrow': { ru: 'Завтра' },
            'serial_info_soon': { ru: 'Скоро' },
            'serial_info_new': { ru: 'Новая' }
        });
    }

    // =============================================
    // Настройки
    // =============================================
    
    const DEFAULTS = {
        enabled: true,
        show_seasons: true,
        show_episodes: true,
        show_status: true,
        show_new_episode: true,
        show_last_view: true,
        show_episode_number: true
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
        
        var hasSerialFields = !!(card.name || 
                                 card.original_name || 
                                 card.first_air_date || 
                                 card.number_of_seasons || 
                                 card.seasons);
        
        var isMovie = !!(card.release_date && !card.first_air_date);
        
        return hasSerialFields && !isMovie;
    }

    // =============================================
    // Кеш для данных TMDB
    // =============================================
    
    var tvCache = {};
    var CACHE_TIME = 3600000; // 1 час

    function getTvInfo(card, callback) {
        if (!card || !card.id) {
            callback(null);
            return;
        }

        var id = card.id;
        
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
    // Получение последнего просмотра
    // =============================================
    
    function getLastView(card) {
        try {
            var title = card.original_title || card.original_name || card.title || card.name || '';
            var file_id = Lampa.Utils.hash(title);
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
    // Формирование текста для бейджа (с правильными склонениями)
    // =============================================
    
    function getSerialInfoText(card, tvInfo) {
        try {
            if (!tvInfo) return null;

            var settings = getSettings();
            var parts = [];

            // Сезоны
            if (settings.show_seasons && tvInfo.number_of_seasons) {
                parts.push(getSeasonsText(tvInfo.number_of_seasons));
            }

            // Эпизоды
            if (settings.show_episodes && tvInfo.number_of_episodes) {
                parts.push(getEpisodesText(tvInfo.number_of_episodes));
            }

            // Если есть данные о новых сериях
            if (settings.show_new_episode && tvInfo.next_episode_to_air) {
                var nextEp = tvInfo.next_episode_to_air;
                var now = new Date();
                var airDate = new Date(nextEp.air_date);
                var diffDays = Math.ceil((airDate - now) / (1000 * 60 * 60 * 24));

                if (diffDays >= -7 && diffDays <= 30) {
                    var label = '';
                    if (diffDays === 0) label = Lampa.Lang.translate('serial_info_today');
                    else if (diffDays === 1) label = Lampa.Lang.translate('serial_info_tomorrow');
                    else if (diffDays > 1 && diffDays <= 7) label = 'Через ' + diffDays + ' дн.';
                    else if (diffDays > 7) label = Lampa.Lang.translate('serial_info_soon');
                    else label = Lampa.Lang.translate('serial_info_new');
                    
                    parts.push('🆕 ' + label + ' S' + nextEp.season_number + 'E' + nextEp.episode_number);
                }
            }

            if (parts.length === 0) return null;
            return parts.join(' • ');
        } catch (e) {
            console.error('[SerialInfo] getSerialInfoText error:', e);
            return null;
        }
    }

    // =============================================
    // Инъекция информации на карточку
    // =============================================
    
    function injectSerialInfo(cardElement, cardData, tvInfo) {
        try {
            if (!tvInfo) return;
            
            var view = cardElement.find('.card__view');
            if (!view.length) return;

            var settings = getSettings();
            
            // --- 1. Основной бейдж с сезонами/эпизодами ---
            var text = getSerialInfoText(cardData, tvInfo);
            if (text) {
                cardElement.find('.card--new_seria').remove();
                view.append(
                    '<div class="card--new_seria" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                    'background:rgba(0,0,0,0.75);color:#fff;padding:0.2em 0.6em;font-size:0.6em;border-radius:0.3em;z-index:10;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.8);">' +
                    text +
                    '</div>'
                );
            }

            // --- 2. Номер последней серии на постере ---
            if (settings.show_episode_number && tvInfo.last_episode_to_air) {
                var lastEp = tvInfo.last_episode_to_air;
                cardElement.find('.serial-episode-number').remove();
                view.append(
                    '<div class="serial-episode-number" style="position:absolute;bottom:2.5em;left:0.5em;' +
                    'padding:0.15em 0.4em;font-size:0.55em;font-weight:bold;color:#fff;' +
                    'background:rgba(22,143,223,0.85);border-radius:0.3em;z-index:10;">' +
                    'S' + lastEp.season_number + ':E' + lastEp.episode_number +
                    '</div>'
                );
            }

            // --- 3. Статус сериала ---
            if (settings.show_status && tvInfo.status) {
                var statusMap = {
                    'returning series': Lampa.Lang.translate('serial_info_ongoing'),
                    'ended': Lampa.Lang.translate('serial_info_ended'),
                    'canceled': Lampa.Lang.translate('serial_info_canceled'),
                    'in production': Lampa.Lang.translate('serial_info_in_production'),
                    'planned': Lampa.Lang.translate('serial_info_planned')
                };
                var statusText = statusMap[tvInfo.status] || tvInfo.status;
                var statusColor = tvInfo.status === 'returning series' ? '#4CAF50' : 
                                 tvInfo.status === 'ended' ? '#666' :
                                 tvInfo.status === 'canceled' ? '#f44336' : '#FF9800';
                
                cardElement.find('.serial-status').remove();
                view.append(
                    '<div class="serial-status" style="position:absolute;top:0.5em;right:0.5em;' +
                    'padding:0.15em 0.4em;font-size:0.5em;font-weight:bold;color:#fff;' +
                    'background:' + statusColor + ';border-radius:0.3em;z-index:10;">' +
                    statusText +
                    '</div>'
                );
            }

            // --- 4. Новая серия ---
            if (settings.show_new_episode && tvInfo.next_episode_to_air) {
                var nextEp = tvInfo.next_episode_to_air;
                var now = new Date();
                var airDate = new Date(nextEp.air_date);
                var diffDays = Math.ceil((airDate - now) / (1000 * 60 * 60 * 24));

                if (diffDays >= -7 && diffDays <= 30) {
                    var label = '';
                    if (diffDays === 0) label = Lampa.Lang.translate('serial_info_today');
                    else if (diffDays === 1) label = Lampa.Lang.translate('serial_info_tomorrow');
                    else if (diffDays > 1 && diffDays <= 7) label = 'Через ' + diffDays + ' дн.';
                    else if (diffDays > 7) label = Lampa.Lang.translate('serial_info_soon');
                    else label = Lampa.Lang.translate('serial_info_new');
                    
                    cardElement.find('.serial-new-badge').remove();
                    view.append(
                        '<div class="serial-new-badge" style="position:absolute;top:0.5em;left:0.5em;' +
                        'padding:0.15em 0.4em;font-size:0.5em;font-weight:bold;color:#fff;' +
                        'background:#FF6B35;border-radius:0.3em;z-index:10;">' +
                        '🆕 ' + label +
                        '</div>'
                    );
                }
            }

            // --- 5. Последний просмотр ---
            if (settings.show_last_view) {
                var lastView = getLastView(cardData);
                if (lastView) {
                    cardElement.find('.card--last_view').remove();
                    view.append(
                        "<div class='card--last_view' style='top:0.6em;right:-0.5em;position:absolute;background:#168FDF;color:#fff;padding:0.2em 0.4em;font-size:0.8em;border-radius:0.3em;z-index:10;display:flex;align-items:center;gap:0.3em;'>" +
                        "<div style='width:0.8em;height:0.8em;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4l-2.5 1.5 1 1.5 3.5-2V7h-2z'/%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat;background-position:center;'></div>" + 
                        'S' + lastView.season + ':E' + lastView.episode +
                        "</div>"
                    );

                    // Таймлайн
                    var hash = Lampa.Utils.hash([
                        lastView.season,
                        lastView.season > 10 ? ':' : '',
                        lastView.episode,
                        cardData.original_title || cardData.original_name || ''
                    ].join(''));
                    
                    var tl = Lampa.Timeline.view(hash);
                    if (tl && tl.percent > 0 && tl.percent < 100) {
                        cardElement.find('.timeline').remove();
                        view.append(
                            '<div class="timeline" style="margin:0.3em 0;padding:0 0.5em;">' +
                            Lampa.Timeline.render(tl) +
                            '</div>'
                        );
                    }
                }
            }

        } catch (e) {
            console.error('[SerialInfo] injectSerialInfo error:', e);
        }
    }

    // =============================================
    // Обработка всех карточек
    // =============================================
    
    function processAllCards() {
        try {
            var settings = getSettings();
            if (!settings.enabled) return;

            $('.card:not(.serial-info-checked)').each(function() {
                var card = $(this);
                
                if (card.hasClass('hero-banner')) return;
                if (card.hasClass('card--category')) return;
                if (card.hasClass('card-more')) return;
                if (card.find('.card__view').length === 0) return;
                
                var cardData = card.data('item') || 
                              (card[0] && (card[0].card_data || card[0].item)) || 
                              null;
                
                if (!cardData) return;
                if (!isSerialCard(cardData)) return;
                
                if (card.find('.card--new_seria').length > 0) {
                    card.addClass('serial-info-checked');
                    return;
                }

                card.addClass('serial-info-checked');

                getTvInfo(cardData, function(tvInfo) {
                    if (tvInfo) {
                        injectSerialInfo(card, cardData, tvInfo);
                    } else if (cardData.number_of_seasons) {
                        var view = card.find('.card__view');
                        if (view.length) {
                            var info = getSeasonsText(cardData.number_of_seasons);
                            if (cardData.number_of_episodes) {
                                info += ' • ' + getEpisodesText(cardData.number_of_episodes);
                            }
                            view.append(
                                '<div class="card--new_seria" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                                'background:rgba(0,0,0,0.7);color:#fff;padding:0.15em 0.5em;font-size:0.55em;border-radius:0.3em;z-index:10;white-space:nowrap;">' +
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
    // Обработка активной карточки
    // =============================================
    
    function processCurrentCard() {
        try {
            var active = Lampa.Activity.active();
            if (!active) return;
            
            var card = active.card;
            if (!card) return;
            if (!isSerialCard(card)) return;

            var activityRender = Lampa.Activity.active().activity.render();
            if (!activityRender) return;

            activityRender.find('.card--new_seria, .card--last_view, .timeline, .serial-episode-number, .serial-new-badge, .serial-status').remove();

            getTvInfo(card, function(tvInfo) {
                if (!tvInfo) return;

                var settings = getSettings();
                var text = getSerialInfoText(card, tvInfo);
                
                if (!text) return;

                var isMobile = window.innerWidth <= 585;

                if (!isMobile) {
                    var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                    if (poster.length) {
                        poster.append(
                            "<div class='card--new_seria' style='right:-0.6em!important;position:absolute;background:#168FDF;color:#fff;bottom:0.6em!important;padding:0.4em 0.4em;font-size:1.1em;border-radius:0.3em;z-index:10;'>" + 
                            text + 
                            "</div>"
                        );
                    }
                } else {
                    var tags = $('.full-start__tags', activityRender);
                    var details = $('.full-start-new__details', activityRender);
                    
                    if (tags.length) {
                        tags.append(
                            '<div class="full-start__tag card--new_seria" style="display:inline-flex;align-items:center;gap:0.3em;background:#168FDF;color:#fff;padding:0.2em 0.5em;border-radius:0.3em;font-size:0.8em;margin-left:0.5em;">' +
                            '<img src="./img/icons/menu/movie.svg" style="width:1em;height:1em;" />' +
                            '<div>' + text + '</div>' +
                            '</div>'
                        );
                    } else if (details.length) {
                        details.append(
                            '<span class="full-start-new__split">●</span>' +
                            '<div class="card--new_seria" style="display:inline-block;background:#168FDF;color:#fff;padding:0.2em 0.5em;border-radius:0.3em;font-size:0.8em;">' +
                            text +
                            '</div>'
                        );
                    }
                }

                // Последний просмотр
                if (settings.show_last_view) {
                    var lastView = getLastView(card);
                    if (lastView) {
                        var viewText = 'S' + lastView.season + ':E' + lastView.episode;
                        var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                        if (poster.length) {
                            poster.append(
                                "<div class='card--last_view' style='top:0.6em;right:-0.5em;position:absolute;background:#168FDF;color:#fff;padding:0.3em 0.4em;font-size:0.9em;border-radius:0.3em;z-index:10;display:flex;align-items:center;gap:0.3em;'>" +
                                "<div style='width:0.9em;height:0.9em;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4l-2.5 1.5 1 1.5 3.5-2V7h-2z'/%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat;background-position:center;'></div>" + 
                                viewText +
                                "</div>"
                            );
                            
                            var hash = Lampa.Utils.hash([
                                lastView.season,
                                lastView.season > 10 ? ':' : '',
                                lastView.episode,
                                card.original_title || card.original_name || ''
                            ].join(''));
                            
                            var tl = Lampa.Timeline.view(hash);
                            if (tl && tl.percent > 0 && tl.percent < 100) {
                                poster.parent().find('.timeline').remove();
                                poster.parent().append('<div class="timeline" style="margin:0.5em 0;padding:0 0.5em;"></div>');
                                $('.timeline').append(Lampa.Timeline.render(tl));
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
                    padding: 0.3em 0.5em;
                    font-size: 1em;
                    border-radius: 0.3em;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .card--last_view {
                    background: #168FDF;
                    color: #fff;
                    padding: 0.2em 0.4em;
                    font-size: 0.8em;
                    border-radius: 0.3em;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    gap: 0.3em;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                .timeline {
                    margin: 0.3em 0;
                    padding: 0 0.5em;
                }

                .timeline .time-line__bar {
                    height: 3px;
                    border-radius: 2px;
                }

                .serial-episode-number {
                    position: absolute;
                    bottom: 2.5em;
                    left: 0.5em;
                    padding: 0.12em 0.4em;
                    font-size: 0.5em;
                    font-weight: bold;
                    color: #fff;
                    background: rgba(22, 143, 223, 0.85);
                    border-radius: 0.3em;
                    z-index: 10;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .serial-new-badge {
                    position: absolute;
                    top: 0.5em;
                    left: 0.5em;
                    padding: 0.12em 0.4em;
                    font-size: 0.5em;
                    font-weight: bold;
                    color: #fff;
                    background: #FF6B35;
                    border-radius: 0.3em;
                    z-index: 10;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .serial-status {
                    position: absolute;
                    top: 0.5em;
                    right: 0.5em;
                    padding: 0.12em 0.4em;
                    font-size: 0.5em;
                    font-weight: bold;
                    color: #fff;
                    border-radius: 0.3em;
                    z-index: 10;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .full-start__tag.card--new_seria {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3em;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.15em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.8em;
                    margin-left: 0.5em;
                }

                .full-start-new__details .card--new_seria {
                    display: inline-block;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.15em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.8em;
                }

                @media (max-width: 585px) {
                    .card--new_seria {
                        font-size: 0.7em;
                        padding: 0.15em 0.3em;
                    }
                    .card--last_view {
                        font-size: 0.6em;
                        padding: 0.15em 0.3em;
                    }
                    .serial-episode-number,
                    .serial-new-badge,
                    .serial-status {
                        font-size: 0.4em;
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
    // MutationObserver
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
    // Настройки плагина
    // =============================================

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: 'serial_info',
            name: 'Информация о сериале',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 4v16"/><path d="M16 4v16"/><path d="M2 10h20"/></svg>'
        });

        // Основной включатель
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
                refreshCards();
            }
        });

        // Сезоны
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_seasons',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать количество сезонов',
                description: 'Отображает количество сезонов в бейдже'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_seasons = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        // Эпизоды
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_episodes',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать количество эпизодов',
                description: 'Отображает количество эпизодов в бейдже'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_episodes = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        // Статус
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_status',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать статус сериала',
                description: 'Отображает статус: Онгоинг, Завершён, Отменён и т.д.'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_status = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        // Номер последней серии
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_episode_number',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать номер последней серии',
                description: 'Отображает S1:E2 на постере'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_episode_number = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        // Новые серии
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_new_episode',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать новые серии',
                description: 'Отображает информацию о ближайшей новой серии'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_new_episode = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        // Последний просмотр
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_last_view',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать последний просмотр',
                description: 'Отображает на постере последнюю просмотренную серию (только для просмотренных)'
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
        $('.full-start__tag.card--new_seria').remove();
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

        setupObserver();

        setTimeout(function() {
            processAllCards();
            processCurrentCard();
        }, 1000);

        setInterval(function() {
            processAllCards();
        }, 3000);

        console.log('[SerialInfo] Plugin ready');
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
