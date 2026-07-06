(function () {
    'use strict';

    // =============================================
    // Serial Info + Next Episode - Объединенный плагин
    // Версия: 2.2.0
    // =============================================

    const VERSION = '2.2.0';

    // =============================================
    // ПРАВИЛЬНЫЕ РУССКИЕ СКЛОНЕНИЯ
    // =============================================
    
    function declension(num, words) {
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
        return count + ' ' + declension(count, ['серия', 'серии', 'серий']);
    }

    // =============================================
    // ФОРМАТИРОВАНИЕ ДАТЫ
    // =============================================
    
    function formatDaysUntil(airDateStr) {
        if (!airDateStr) return null;

        var parts = airDateStr.split('-');
        var airDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        var diffMs = airDate.getTime() - today.getTime();
        var diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return null;
        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Завтра';
        return 'Через ' + diffDays + ' дн.';
    }

    function getSeasonEpisodeText(season, episode) {
        if (!season && !episode) return '';
        return 'S' + (season || '?') + ':E' + (episode || '?');
    }

    // =============================================
    // СТАТУСЫ НА РУССКОМ
    // =============================================
    
    function getStatusText(status) {
        var statusMap = {
            'returning series': 'Онгоинг',
            'returning': 'Онгоинг',
            'ended': 'Завершён',
            'canceled': 'Отменён',
            'in production': 'В производстве',
            'planned': 'Запланирован',
            'released': 'Выпущен',
            'pilot': 'Пилот',
            'to be determined': 'Не определен'
        };
        
        // Приводим к нижнему регистру для поиска
        var key = (status || '').toLowerCase();
        return statusMap[key] || status || '';
    }

    function getStatusColor(status) {
        var key = (status || '').toLowerCase();
        if (key === 'returning series' || key === 'returning') return '#4CAF50'; // зеленый - онгоинг
        if (key === 'ended') return '#666'; // серый - завершен
        if (key === 'canceled') return '#f44336'; // красный - отменен
        if (key === 'in production') return '#FF9800'; // оранжевый - в производстве
        if (key === 'planned') return '#2196F3'; // синий - запланирован
        if (key === 'released') return '#8BC34A'; // салатовый - выпущен
        return '#888'; // серый по умолчанию
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
            'serial_info_ongoing': { ru: 'Онгоинг' },
            'serial_info_ended': { ru: 'Завершён' },
            'serial_info_canceled': { ru: 'Отменён' },
            'serial_info_in_production': { ru: 'В производстве' },
            'serial_info_planned': { ru: 'Запланирован' },
            'serial_info_next_episode': { ru: 'Следующая серия' },
            'serial_info_settings': { ru: 'Информация о сериале' },
            'serial_info_enabled_desc': { ru: 'Отображает информацию о сезонах, сериях и дате выхода следующей серии' },
            'serial_info_badge_desc': { ru: 'Показывает информацию о сезонах/сериях и дате выхода следующей серии внизу карточки' },
            'serial_info_poster_desc': { ru: 'Показывает на постере: статус сериала, номер последней серии, новую серию' },
            'serial_info_next_desc': { ru: 'Показывает через сколько дней выйдет следующая серия' },
            'serial_info_last_desc': { ru: 'Показывает на постере последнюю просмотренную серию (только для просмотренных)' }
        });
    }

    // =============================================
    // Настройки
    // =============================================
    
    const DEFAULTS = {
        enabled: true,
        show_badge: true,
        show_poster: true,
        show_next_episode: true,
        show_last_view: true
    };

    function getSettings() {
        try {
            var settings = Lampa.Storage.get('serial_info_settings', {});
            // Удаляем устаревшие настройки
            var oldKeys = ['show_seasons', 'show_episodes', 'show_status', 'show_episode_number', 'show_new_episode'];
            oldKeys.forEach(function(key) {
                if (settings[key] !== undefined) delete settings[key];
            });
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
    // Проверка карточки
    // =============================================
    
    function isSerialCard(card) {
        if (!card) return false;
        return !!(card.name || card.original_name || card.first_air_date || 
                  card.number_of_seasons || card.seasons);
    }

    // =============================================
    // Кеш для TMDB
    // =============================================
    
    var tvCache = {};
    var CACHE_TIME = 3600000;

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
    // УЛУЧШЕННЫЙ ПОИСК ПОСЛЕДНЕГО ПРОСМОТРА
    // =============================================
    
    function getLastView(card) {
        try {
            if (!card) return null;
            
            var title = card.original_title || card.original_name || card.title || card.name || '';
            if (!title) return null;
            
            // === 1. Проверяем online_watched_last (из MODS's и подобных) ===
            var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
            if (watched) {
                var file_id = Lampa.Utils.hash(title);
                if (watched[file_id] && watched[file_id].season && watched[file_id].episode) {
                    return {
                        season: watched[file_id].season,
                        episode: watched[file_id].episode,
                        source: 'online_watched_last'
                    };
                }
            }
            
            // === 2. Проверяем file_view + resume_file (стандартное хранилище Lampa) ===
            var views = Lampa.Storage.get('file_view', {});
            var files = Lampa.Storage.get('resume_file', {});
            
            // Пробуем разные варианты хеша
            var hashVariants = [
                Lampa.Utils.hash(title),
                Lampa.Utils.hash(card.original_title || ''),
                Lampa.Utils.hash(card.original_name || ''),
                Lampa.Utils.hash((card.original_title || card.original_name || '') + (card.id || ''))
            ];
            
            // Уникальные хеши
            var hashes = [];
            hashVariants.forEach(function(h) {
                if (h && hashes.indexOf(h) === -1) hashes.push(h);
            });
            
            for (var i = 0; i < hashes.length; i++) {
                var hash = hashes[i];
                if (views[hash] && files[hash]) {
                    var resume = views[hash];
                    var fileData = files[hash];
                    
                    // Пытаемся извлечь сезон и серию из данных файла
                    if (fileData.season !== undefined && fileData.episode !== undefined) {
                        return {
                            season: parseInt(fileData.season),
                            episode: parseInt(fileData.episode),
                            source: 'resume_file'
                        };
                    }
                    
                    // Пытаемся извлечь из timeline
                    if (fileData.timeline && fileData.timeline.hash) {
                        // Проверяем, может быть там закодированы сезон/серия
                        var tlHash = fileData.timeline.hash;
                        // Пробуем найти в Timeline
                        var tl = Lampa.Timeline.view(tlHash);
                        if (tl && tl.percent > 0) {
                            // Пытаемся определить сезон/серию из названия
                            var match = (fileData.title || '').match(/S(\d+):?E(\d+)/i);
                            if (match) {
                                return {
                                    season: parseInt(match[1]),
                                    episode: parseInt(match[2]),
                                    source: 'timeline_title'
                                };
                            }
                        }
                    }
                }
            }
            
            // === 3. Проверяем Timeline напрямую ===
            // Пытаемся найти Timeline с прогрессом
            var allViews = Lampa.Storage.get('file_view', {});
            for (var key in allViews) {
                if (allViews.hasOwnProperty(key)) {
                    var view = allViews[key];
                    if (view && view.percent > 0 && view.percent < 100) {
                        // Пытаемся определить сезон/серию из ключа
                        var match = key.match(/S(\d+):?E(\d+)/i) || key.match(/(\d+):(\d+)/);
                        if (match) {
                            return {
                                season: parseInt(match[1]),
                                episode: parseInt(match[2]),
                                source: 'timeline_direct'
                            };
                        }
                    }
                }
            }
            
            // === 4. Проверяем favorite (избранное) ===
            var favorite = Lampa.Storage.get('favorite', {});
            if (favorite.card) {
                var cardData = favorite.card.find(function(c) {
                    return c.id === card.id;
                });
                if (cardData && cardData.history) {
                    // Пытаемся найти последний просмотренный эпизод
                    var history = cardData.history;
                    if (history && history.season && history.episode) {
                        return {
                            season: parseInt(history.season),
                            episode: parseInt(history.episode),
                            source: 'favorite'
                        };
                    }
                }
            }
            
            // === 5. Проверяем timeline (через Lampa.Timeline) ===
            try {
                var timelineData = Lampa.Storage.get('timeline', {});
                for (var tlKey in timelineData) {
                    if (timelineData.hasOwnProperty(tlKey)) {
                        var tlItem = timelineData[tlKey];
                        if (tlItem && tlItem.percent > 0 && tlItem.percent < 100) {
                            // Пытаемся найти соответствие по названию
                            if (tlItem.title && tlItem.title.indexOf(title) !== -1) {
                                var match = (tlItem.title || '').match(/S(\d+):?E(\d+)/i);
                                if (match) {
                                    return {
                                        season: parseInt(match[1]),
                                        episode: parseInt(match[2]),
                                        source: 'timeline_storage'
                                    };
                                }
                            }
                        }
                    }
                }
            } catch (e) {}
            
        } catch (e) {
            console.error('[SerialInfo] getLastView error:', e);
        }
        return null;
    }

    // =============================================
    // Формирование текста для бейджа
    // =============================================
    
    function getBadgeText(card, tvInfo) {
        try {
            if (!tvInfo) return null;

            var parts = [];
            var settings = getSettings();

            // Сезоны
            if (tvInfo.number_of_seasons) {
                parts.push(getSeasonsText(tvInfo.number_of_seasons));
            }

            // Серии
            if (tvInfo.number_of_episodes) {
                parts.push(getEpisodesText(tvInfo.number_of_episodes));
            }

            // Следующая серия (дата)
            if (settings.show_next_episode && tvInfo.next_episode_to_air) {
                var nextEp = tvInfo.next_episode_to_air;
                var dateText = formatDaysUntil(nextEp.air_date);
                if (dateText) {
                    var epText = getSeasonEpisodeText(nextEp.season_number, nextEp.episode_number);
                    parts.push('📅 ' + epText + ' — ' + dateText);
                }
            }

            if (parts.length === 0) return null;
            return parts.join(' • ');
        } catch (e) {
            return null;
        }
    }

    // =============================================
    // Инъекция на карточку
    // =============================================
    
    function injectSerialInfo(cardElement, cardData, tvInfo) {
        try {
            if (!tvInfo) return;
            
            var view = cardElement.find('.card__view');
            if (!view.length) return;

            var settings = getSettings();
            
            // --- 1. Бейдж внизу карточки ---
            if (settings.show_badge) {
                var text = getBadgeText(cardData, tvInfo);
                if (text) {
                    cardElement.find('.card--info-badge').remove();
                    view.append(
                        '<div class="card--info-badge" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                        'background:rgba(0,0,0,0.75);color:#fff;padding:0.2em 0.6em;font-size:0.55em;border-radius:0.3em;z-index:10;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.8);">' +
                        text +
                        '</div>'
                    );
                }
            }

            // --- 2. Информация на постере ---
            if (settings.show_poster) {
                
                // Статус сериала (на русском)
                if (tvInfo.status) {
                    var statusText = getStatusText(tvInfo.status);
                    var statusColor = getStatusColor(tvInfo.status);
                    
                    cardElement.find('.serial-status').remove();
                    view.append(
                        '<div class="serial-status" style="position:absolute;top:0.5em;right:0.5em;' +
                        'padding:0.12em 0.4em;font-size:0.5em;font-weight:bold;color:#fff;' +
                        'background:' + statusColor + ';border-radius:0.3em;z-index:10;text-shadow:0 1px 2px rgba(0,0,0,0.5);">' +
                        statusText +
                        '</div>'
                    );
                }

                // Номер последней серии на постере
                if (tvInfo.last_episode_to_air) {
                    var lastEp = tvInfo.last_episode_to_air;
                    cardElement.find('.serial-episode-number').remove();
                    view.append(
                        '<div class="serial-episode-number" style="position:absolute;bottom:2.5em;left:0.5em;' +
                        'padding:0.12em 0.4em;font-size:0.5em;font-weight:bold;color:#fff;' +
                        'background:rgba(22,143,223,0.85);border-radius:0.3em;z-index:10;text-shadow:0 1px 2px rgba(0,0,0,0.5);">' +
                        getSeasonEpisodeText(lastEp.season_number, lastEp.episode_number) +
                        '</div>'
                    );
                }

                // Новая серия
                if (settings.show_next_episode && tvInfo.next_episode_to_air) {
                    var nextEp = tvInfo.next_episode_to_air;
                    var now = new Date();
                    var airDate = new Date(nextEp.air_date);
                    var diffDays = Math.ceil((airDate - now) / (1000 * 60 * 60 * 24));

                    if (diffDays >= -7 && diffDays <= 30) {
                        var label = '';
                        if (diffDays === 0) label = 'Сегодня';
                        else if (diffDays === 1) label = 'Завтра';
                        else if (diffDays > 1 && diffDays <= 7) label = 'Через ' + diffDays + ' дн.';
                        else if (diffDays > 7) label = 'Скоро';
                        else label = 'Новая';
                        
                        cardElement.find('.serial-new-badge').remove();
                        view.append(
                            '<div class="serial-new-badge" style="position:absolute;top:0.5em;left:0.5em;' +
                            'padding:0.12em 0.4em;font-size:0.5em;font-weight:bold;color:#fff;' +
                            'background:#FF6B35;border-radius:0.3em;z-index:10;text-shadow:0 1px 2px rgba(0,0,0,0.5);">' +
                            '🆕 ' + label +
                            '</div>'
                        );
                    }
                }
            }

            // --- 3. Последний просмотр ---
            if (settings.show_last_view) {
                var lastView = getLastView(cardData);
                if (lastView) {
                    cardElement.find('.card--last_view').remove();
                    view.append(
                        "<div class='card--last_view' style='top:0.6em;right:-0.5em;position:absolute;background:#168FDF;color:#fff;padding:0.2em 0.4em;font-size:0.75em;border-radius:0.3em;z-index:10;display:flex;align-items:center;gap:0.3em;'>" +
                        "<div style='width:0.8em;height:0.8em;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4l-2.5 1.5 1 1.5 3.5-2V7h-2z'/%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat;background-position:center;'></div>" + 
                        getSeasonEpisodeText(lastView.season, lastView.episode) +
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
                
                if (card.find('.card--info-badge').length > 0) {
                    card.addClass('serial-info-checked');
                    return;
                }

                card.addClass('serial-info-checked');

                getTvInfo(cardData, function(tvInfo) {
                    if (tvInfo) {
                        injectSerialInfo(card, cardData, tvInfo);
                    } else if (cardData.number_of_seasons) {
                        var view = card.find('.card__view');
                        if (view.length && settings.show_badge) {
                            var info = getSeasonsText(cardData.number_of_seasons);
                            if (cardData.number_of_episodes) {
                                info += ' • ' + getEpisodesText(cardData.number_of_episodes);
                            }
                            view.append(
                                '<div class="card--info-badge" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                                'background:rgba(0,0,0,0.7);color:#fff;padding:0.15em 0.5em;font-size:0.5em;border-radius:0.3em;z-index:10;white-space:nowrap;">' +
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

            // Удаляем старые элементы
            activityRender.find('.card--info-badge, .card--last_view, .timeline, .serial-episode-number, .serial-new-badge, .serial-status').remove();

            getTvInfo(card, function(tvInfo) {
                if (!tvInfo) return;

                var settings = getSettings();
                var isMobile = window.innerWidth <= 585;

                // --- Бейдж внизу ---
                if (settings.show_badge) {
                    var text = getBadgeText(card, tvInfo);
                    if (text) {
                        if (!isMobile) {
                            var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                            if (poster.length) {
                                poster.append(
                                    "<div class='card--info-badge' style='right:-0.6em!important;position:absolute;background:#168FDF;color:#fff;bottom:0.6em!important;padding:0.3em 0.5em;font-size:1em;border-radius:0.3em;z-index:10;'>" + 
                                    text + 
                                    "</div>"
                                );
                            }
                        } else {
                            var tags = $('.full-start__tags', activityRender);
                            var details = $('.full-start-new__details', activityRender);
                            
                            if (tags.length) {
                                tags.append(
                                    '<div class="full-start__tag card--info-badge" style="display:inline-flex;align-items:center;gap:0.3em;background:#168FDF;color:#fff;padding:0.15em 0.5em;border-radius:0.3em;font-size:0.75em;margin-left:0.5em;">' +
                                    '<img src="./img/icons/menu/movie.svg" style="width:0.9em;height:0.9em;" />' +
                                    '<div>' + text + '</div>' +
                                    '</div>'
                                );
                            } else if (details.length) {
                                details.append(
                                    '<span class="full-start-new__split">●</span>' +
                                    '<div class="card--info-badge" style="display:inline-block;background:#168FDF;color:#fff;padding:0.15em 0.5em;border-radius:0.3em;font-size:0.75em;">' +
                                    text +
                                    '</div>'
                                );
                            }
                        }
                    }
                }

                // --- Информация на постере ---
                if (settings.show_poster) {
                    
                    // Статус (на русском)
                    if (tvInfo.status) {
                        var statusText = getStatusText(tvInfo.status);
                        var statusColor = getStatusColor(tvInfo.status);
                        
                        var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                        if (poster.length) {
                            poster.append(
                                '<div class="serial-status" style="position:absolute;top:0.5em;right:0.5em;' +
                                'padding:0.15em 0.4em;font-size:0.7em;font-weight:bold;color:#fff;' +
                                'background:' + statusColor + ';border-radius:0.3em;z-index:10;text-shadow:0 1px 2px rgba(0,0,0,0.5);">' +
                                statusText +
                                '</div>'
                            );
                        }
                    }

                    // Номер последней серии
                    if (tvInfo.last_episode_to_air) {
                        var lastEp = tvInfo.last_episode_to_air;
                        var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                        if (poster.length) {
                            poster.append(
                                '<div class="serial-episode-number" style="position:absolute;bottom:3.5em;left:0.5em;' +
                                'padding:0.12em 0.4em;font-size:0.65em;font-weight:bold;color:#fff;' +
                                'background:rgba(22,143,223,0.85);border-radius:0.3em;z-index:10;text-shadow:0 1px 2px rgba(0,0,0,0.5);">' +
                                getSeasonEpisodeText(lastEp.season_number, lastEp.episode_number) +
                                '</div>'
                            );
                        }
                    }

                    // Новая серия
                    if (settings.show_next_episode && tvInfo.next_episode_to_air) {
                        var nextEp = tvInfo.next_episode_to_air;
                        var now = new Date();
                        var airDate = new Date(nextEp.air_date);
                        var diffDays = Math.ceil((airDate - now) / (1000 * 60 * 60 * 24));

                        if (diffDays >= -7 && diffDays <= 30) {
                            var label = '';
                            if (diffDays === 0) label = 'Сегодня';
                            else if (diffDays === 1) label = 'Завтра';
                            else if (diffDays > 1 && diffDays <= 7) label = 'Через ' + diffDays + ' дн.';
                            else if (diffDays > 7) label = 'Скоро';
                            else label = 'Новая';
                            
                            var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                            if (poster.length) {
                                poster.append(
                                    '<div class="serial-new-badge" style="position:absolute;top:0.5em;left:0.5em;' +
                                    'padding:0.12em 0.4em;font-size:0.65em;font-weight:bold;color:#fff;' +
                                    'background:#FF6B35;border-radius:0.3em;z-index:10;text-shadow:0 1px 2px rgba(0,0,0,0.5);">' +
                                    '🆕 ' + label +
                                    '</div>'
                                );
                            }
                        }
                    }
                }

                // --- Последний просмотр ---
                if (settings.show_last_view) {
                    var lastView = getLastView(card);
                    if (lastView) {
                        var viewText = getSeasonEpisodeText(lastView.season, lastView.episode);
                        var poster = $('.full-start__poster, .full-start-new__poster', activityRender);
                        if (poster.length) {
                            poster.append(
                                "<div class='card--last_view' style='top:0.6em;right:-0.5em;position:absolute;background:#168FDF;color:#fff;padding:0.2em 0.4em;font-size:0.8em;border-radius:0.3em;z-index:10;display:flex;align-items:center;gap:0.3em;'>" +
                                "<div style='width:0.8em;height:0.8em;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4l-2.5 1.5 1 1.5 3.5-2V7h-2z'/%3E%3C/svg%3E\");background-size:contain;background-repeat:no-repeat;background-position:center;'></div>" + 
                                viewText +
                                "</div>"
                            );
                            
                            // Таймлайн
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
                .card--info-badge {
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
                    bottom: 3.5em;
                    left: 0.5em;
                    padding: 0.12em 0.4em;
                    font-size: 0.65em;
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
                    font-size: 0.65em;
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
                    padding: 0.15em 0.4em;
                    font-size: 0.7em;
                    font-weight: bold;
                    color: #fff;
                    border-radius: 0.3em;
                    z-index: 10;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .full-start__tag.card--info-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3em;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.15em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.75em;
                    margin-left: 0.5em;
                }

                .full-start-new__details .card--info-badge {
                    display: inline-block;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.15em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.75em;
                }

                @media (max-width: 585px) {
                    .card--info-badge {
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
                        font-size: 0.5em;
                        padding: 0.1em 0.3em;
                    }
                }

                .card:not(.card--loaded) .card--info-badge,
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
    // Структурированные настройки
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
                description: 'Отображает информацию о сезонах, сериях и дате выхода следующей серии'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.enabled = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        // Бейдж на карточке
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_badge',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Бейдж на карточке',
                description: 'Показывает информацию о сезонах/сериях и дате выхода следующей серии внизу карточки'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_badge = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        // Информация на постере
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_poster',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Информация на постере',
                description: 'Показывает на постере: статус сериала, номер последней серии, новую серию'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_poster = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        // Дата следующей серии
        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_next_episode',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Дата следующей серии',
                description: 'Показывает через сколько дней выйдет следующая серия'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_next_episode = value === 'true' || value === true;
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
                name: 'Последний просмотр',
                description: 'Показывает на постере последнюю просмотренную серию (только для просмотренных)'
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
        $('.card--info-badge, .card--last_view, .timeline, .serial-episode-number, .serial-new-badge, .serial-status').remove();
        $('.full-start__tag.card--info-badge').remove();
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
