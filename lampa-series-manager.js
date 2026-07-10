/* Serial Info + Series Manager 4.0.0 — Полная информация о сериалах */
(function () {
    'use strict';

    const VERSION = '4.0.0';

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
            'title_watched': { ru: 'Просмотрено' }
        });
    }

    // =============================================
    // Настройки
    // =============================================
    
    const DEFAULTS = {
        enabled: true,
        show_badge: true,
        show_next_episode: true,
        show_last_view: true,
        show_widget: true,
        remember_episode: true
    };

    function getSettings() {
        try {
            var settings = Lampa.Storage.get('serial_info_settings', {});
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
    // ПАМЯТЬ СЕРИЙ (из Lampa Modern UI)
    // =============================================
    
    var MEMORY_KEY = 'lmui_detail_episode_v1';

    function getMemoryStore() {
        try {
            var raw = window.sessionStorage && window.sessionStorage.getItem(MEMORY_KEY);
            var parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function writeMemoryStore(store) {
        try {
            if (window.sessionStorage) {
                window.sessionStorage.setItem(MEMORY_KEY, JSON.stringify(store || {}));
            }
        } catch (error) {}
    }

    function getContentId(card) {
        if (!card) return '';
        var source = String(card.source || 'tmdb');
        var id = card.id !== undefined && card.id !== null ? String(card.id) : '';
        if (id) return 'tv:' + source + ':' + id;
        return 'tv:title:' + String(card.title || card.name || card.original_title || card.original_name || '').toLowerCase();
    }

    function getEpisodeCoords(episode) {
        if (!episode || typeof episode !== 'object') return null;
        var season = episode.season_number !== undefined ? episode.season_number : episode.season;
        var number = episode.episode_number !== undefined ? episode.episode_number : episode.episode;
        season = Number(season);
        number = Number(number);
        if (!isFinite(season) || !isFinite(number) || season < 0 || number < 1) return null;
        return { season: season, episode: number };
    }

    function readSavedEpisode(card) {
        var key = getContentId(card);
        if (!key) return null;
        var store = getMemoryStore();
        var value = store[key];
        return value && typeof value === 'object' ? value : null;
    }

    function saveEpisode(card, episode, reason) {
        var coords = getEpisodeCoords(episode);
        var key = getContentId(card);
        if (!key || !coords) return false;
        var store = getMemoryStore();
        store[key] = {
            season: coords.season,
            episode: coords.episode,
            updatedAt: Date.now ? Date.now() : new Date().getTime()
        };
        // Ограничиваем размер хранилища
        var keys = Object.keys(store);
        if (keys.length > 80) {
            keys.sort(function (a, b) {
                return (store[a] && store[a].updatedAt || 0) - (store[b] && store[b].updatedAt || 0);
            });
            keys.slice(0, keys.length - 80).forEach(function (oldKey) { delete store[oldKey]; });
        }
        writeMemoryStore(store);
        return true;
    }

    // =============================================
    // ПОСЛЕДНИЙ ПРОСМОТР - улучшенная версия
    // =============================================
    
    function getLastViewData(card) {
        try {
            if (!card) return null;

            // 1. Сначала проверяем сохранённую серию (из Lampa Modern UI)
            var saved = readSavedEpisode(card);
            if (saved) {
                var hash = Lampa.Utils.hash([
                    saved.season,
                    saved.episode,
                    card.original_title || card.original_name || ''
                ].join(''));
                var view = Lampa.Timeline.view(hash);
                if (view && view.percent > 0) {
                    return {
                        season: saved.season,
                        episode: saved.episode,
                        view: view,
                        source: 'saved'
                    };
                }
            }
            
            // 2. Проверяем через Lampa.TimeTable (как в MODS's)
            var episodes = Lampa.TimeTable.get(card);
            var viewed = null;
            
            if (episodes && episodes.length) {
                for (var i = 0; i < episodes.length; i++) {
                    var ep = episodes[i];
                    var hash = Lampa.Utils.hash([
                        ep.season_number, 
                        ep.episode_number, 
                        card.original_title || card.original_name || ''
                    ].join(''));
                    
                    var view = Lampa.Timeline.view(hash);
                    if (view && view.percent && view.percent > 0) {
                        viewed = {
                            ep: ep,
                            view: view
                        };
                        // Запоминаем для будущего
                        if (view.percent > 0 && view.percent < 100) {
                            saveEpisode(card, ep, 'auto');
                        }
                    }
                }
            }
            
            if (viewed) {
                return {
                    season: viewed.ep.season_number,
                    episode: viewed.ep.episode_number,
                    view: viewed.view,
                    source: 'timeline'
                };
            }
            
            // 3. Fallback: online_watched_last
            var title = card.original_title || card.original_name || card.title || card.name || '';
            var file_id = Lampa.Utils.hash(title);
            var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
            if (watched && watched[file_id] && watched[file_id].season && watched[file_id].episode) {
                var hash2 = Lampa.Utils.hash([
                    watched[file_id].season, 
                    watched[file_id].episode, 
                    title
                ].join(''));
                var view2 = Lampa.Timeline.view(hash2);
                if (view2 && view2.percent) {
                    return {
                        season: watched[file_id].season,
                        episode: watched[file_id].episode,
                        view: view2,
                        source: 'online'
                    };
                }
            }
            
        } catch (e) {
            console.error('[SerialInfo] getLastViewData error:', e);
        }
        return null;
    }

    // =============================================
    // ФОРМИРОВАНИЕ ТЕКСТА
    // =============================================
    
    function getBadgeText(card, tvInfo) {
        try {
            if (!tvInfo) return null;

            var settings = getSettings();
            
            var last_seria_inseason = 1;
            var count_eps_last_seas = 0;
            var new_ser = '';
            
            if (tvInfo.last_episode_to_air) {
                last_seria_inseason = tvInfo.last_episode_to_air.season_number || 1;
            } else if (tvInfo.number_of_seasons) {
                last_seria_inseason = tvInfo.number_of_seasons;
            }
            
            if (tvInfo.seasons && tvInfo.seasons.length) {
                var seasonData = tvInfo.seasons.find(function (eps) {
                    return eps.season_number == last_seria_inseason;
                });
                if (seasonData) {
                    count_eps_last_seas = seasonData.episode_count || 0;
                }
            }
            
            if (!count_eps_last_seas && tvInfo.number_of_episodes) {
                count_eps_last_seas = tvInfo.number_of_episodes;
            }
            
            var next_episode = tvInfo.next_episode_to_air;
            var last_seria = next_episode && new Date(next_episode.air_date) <= Date.now() 
                ? next_episode.episode_number 
                : (tvInfo.last_episode_to_air ? tvInfo.last_episode_to_air.episode_number : 0);

            // Проверяем статус сериала
            var status = (tvInfo.status || '').toLowerCase();
            var isEnded = status === 'ended';
            var isCanceled = status === 'canceled';
            var isInProduction = status === 'in production';
            
            if (isEnded) {
                new_ser = 'Сериал завершён';
            } else if (isCanceled) {
                new_ser = 'Сериал отменён';
            } else if (isInProduction) {
                new_ser = 'Сериал в производстве';
            } else if (next_episode) {
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

            if (settings.show_next_episode && next_episode) {
                var dateText = formatDaysUntil(next_episode.air_date);
                if (dateText) {
                    var epText = getSeasonEpisodeText(next_episode.season_number, next_episode.episode_number);
                    new_ser += '<br>📅 ' + epText + ' - ' + dateText;
                }
            }

            return new_ser;
        } catch (e) {
            console.error('[SerialInfo] getBadgeText error:', e);
            return null;
        }
    }

    // =============================================
    // ВИДЖЕТ В ПРАВОМ НИЖНЕМ УГЛУ
    // =============================================

    function createWidget(card, lastViewData, tvInfo) {
        if (!lastViewData || !card) return null;
        
        var settings = getSettings();
        if (!settings.show_widget) return null;

        var season = lastViewData.season;
        var episode = lastViewData.episode;
        var view = lastViewData.view || { percent: 0, time: 0, duration: 0 };
        var progress = Math.round(view.percent || 0);
        
        // Вычисляем оставшееся время
        var remaining = '';
        if (view.duration && view.duration > 0) {
            var seconds = Math.max(0, view.duration - (view.time || 0));
            var minutes = Math.round(seconds / 60);
            if (minutes > 0) {
                if (minutes < 60) {
                    remaining = '⏱ ' + minutes + ' мин';
                } else {
                    var hours = Math.floor(minutes / 60);
                    var rest = minutes % 60;
                    remaining = '⏱ ' + hours + ' ч' + (rest > 0 ? ' ' + rest + ' мин' : '');
                }
            }
        }

        // Название серии
        var label = 'S' + String(season).padStart(2, '0') + ' E' + String(episode).padStart(2, '0');
        
        // Ищем название эпизода
        var episodeName = '';
        try {
            if (tvInfo && tvInfo.seasons) {
                for (var i = 0; i < tvInfo.seasons.length; i++) {
                    if (tvInfo.seasons[i].season_number === season && tvInfo.seasons[i].episodes) {
                        for (var j = 0; j < tvInfo.seasons[i].episodes.length; j++) {
                            if (tvInfo.seasons[i].episodes[j].episode_number === episode) {
                                episodeName = tvInfo.seasons[i].episodes[j].name || '';
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {}

        var title = label + (episodeName ? ' · ' + episodeName : '');

        // Создаём виджет
        var widget = document.createElement('div');
        widget.className = 'serial-widget';
        widget.style.cssText = [
            'position:fixed!important',
            'bottom:2.5em!important',
            'right:2.5em!important',
            'z-index:9999!important',
            'max-width:320px!important',
            'min-width:160px!important',
            'padding:0.6em 1em!important',
            'border-radius:0.8em!important',
            'background:rgba(7,10,16,0.92)!important',
            'backdrop-filter:blur(16px)!important',
            'border:1px solid rgba(255,255,255,0.08)!important',
            'box-shadow:0 1em 3em rgba(0,0,0,0.6)!important',
            'color:#f6f8fc!important',
            'font-family:system-ui,sans-serif!important',
            'font-size:14px!important',
            'cursor:pointer!important',
            'transition:opacity .3s ease,transform .3s ease!important'
        ].join(';');

        // Метка
        var labelEl = document.createElement('div');
        labelEl.style.cssText = 'font-size:0.6em;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.4);margin-bottom:0.15em;';
        labelEl.textContent = progress > 0 && progress < 100 ? 'Продолжить просмотр' : 'Смотреть сериал';
        widget.appendChild(labelEl);

        // Название
        var titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-size:0.9em;font-weight:700;color:#fff;margin:0.1em 0 0.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleEl.textContent = title;
        widget.appendChild(titleEl);

        // Мета
        var metaEl = document.createElement('div');
        metaEl.style.cssText = 'font-size:0.75em;color:rgba(255,255,255,0.5);display:flex;align-items:center;gap:0.6em;flex-wrap:wrap;';
        
        var seasonText = document.createElement('span');
        seasonText.textContent = 'Сезон ' + season + ' · Эпизод ' + episode;
        metaEl.appendChild(seasonText);
        
        if (progress > 0) {
            var progressText = document.createElement('span');
            progressText.textContent = progress + '%';
            metaEl.appendChild(progressText);
        }
        
        if (remaining) {
            var remainingText = document.createElement('span');
            remainingText.textContent = remaining;
            metaEl.appendChild(remainingText);
        }
        
        widget.appendChild(metaEl);

        // Прогресс-бар
        var barWrap = document.createElement('div');
        barWrap.style.cssText = 'width:100%;height:0.2em;border-radius:99em;background:rgba(255,255,255,0.1);margin:0.3em 0 0.15em;overflow:hidden;';
        var bar = document.createElement('div');
        bar.style.cssText = 'height:100%;border-radius:inherit;background:linear-gradient(90deg,#69a7ff,#91beff);transition:width .4s ease;';
        bar.style.width = Math.min(100, progress) + '%';
        barWrap.appendChild(bar);
        widget.appendChild(barWrap);

        // Клик — открывает сериал
        widget.addEventListener('click', function (e) {
            e.stopPropagation();
            try {
                // Открываем сериал на том же эпизоде
                var payload = {
                    component: 'full',
                    card: card,
                    source: card.source || 'tmdb',
                    episode: episode,
                    season: season
                };
                if (Lampa.Activity && typeof Lampa.Activity.push === 'function') {
                    Lampa.Activity.push(payload);
                }
            } catch (err) {}
        });

        return widget;
    }

    // =============================================
    // ОТОБРАЖЕНИЕ ПОСЛЕДНЕГО ПРОСМОТРА
    // =============================================
    
    function showLastView(card, tvInfo) {
        try {
            var settings = getSettings();
            if (!settings.show_last_view) return;
            
            var lastViewData = getLastViewData(card);
            if (!lastViewData) return;
            
            var ep = lastViewData.episode;
            var se = lastViewData.season;
            var last_view = 'S' + se + ':E' + ep;
            
            // Удаляем старые элементы
            $('.timeline, .card--last_view').remove();
            
            // Находим постер
            var poster = $('.full-start__poster, .full-start-new__poster');
            if (poster.length) {
                poster.append(
                    "<div class='card--last_view' style='top:0.6em;right: -.5em;position: absolute;background: #168FDF;color: #fff;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;z-index:10;'>" +
                    "<div style='float:left;margin:-5px 0 -4px -4px' class='card__icon icon--history'></div>" + 
                    last_view + 
                    "</div>"
                );
                
                if (lastViewData.view) {
                    poster.parent().append('<div class="timeline"></div>');
                    $('body').find('.timeline').append(Lampa.Timeline.render(lastViewData.view));
                }
            }

            // Виджет в правом нижнем углу
            var widget = createWidget(card, lastViewData, tvInfo);
            if (widget) {
                // Удаляем старый виджет
                $('.serial-widget').remove();
                document.body.appendChild(widget);
            }
            
        } catch (e) {
            console.error('[SerialInfo] showLastView error:', e);
        }
    }

    // =============================================
    // ИНЪЕКЦИЯ НА КАРТОЧКУ
    // =============================================
    
    function injectSerialInfo(cardElement, cardData, tvInfo) {
        try {
            if (!tvInfo) return;
            
            var view = cardElement.find('.card__view');
            if (!view.length) return;

            var settings = getSettings();
            
            // --- Бейдж внизу карточки ---
            if (settings.show_badge) {
                var text = getBadgeText(cardData, tvInfo);
                if (text) {
                    cardElement.find('.card--info-badge').remove();
                    view.append(
                        '<div class="card--info-badge" style="position:absolute;bottom:0.3em;left:50%;transform:translateX(-50%);' +
                        'background:rgba(0,0,0,0.75);color:#fff;padding:0.2em 0.6em;font-size:0.5em;border-radius:0.3em;z-index:10;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.8);text-align:center;line-height:1.4;">' +
                        text +
                        '</div>'
                    );
                }
            }

            // --- Последний просмотр ---
            var isActive = cardElement.closest('.activity--active').length > 0;
            if (settings.show_last_view && isActive) {
                showLastView(cardData, tvInfo);
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
                                'background:rgba(0,0,0,0.7);color:#fff;padding:0.15em 0.5em;font-size:0.45em;border-radius:0.3em;z-index:10;white-space:nowrap;text-align:center;">' +
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
            activityRender.find('.card--info-badge, .card--last_view, .timeline, .serial-widget').remove();

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
                                    "<div class='card--info-badge' style='right:-0.6em!important;position:absolute;background:#168FDF;color:#fff;bottom:0.6em!important;padding:0.3em 0.5em;font-size:0.9em;border-radius:0.3em;z-index:10;text-align:center;line-height:1.5;'>" + 
                                    text + 
                                    "</div>"
                                );
                            }
                        } else {
                            var tags = $('.full-start__tags', activityRender);
                            var details = $('.full-start-new__details', activityRender);
                            
                            if (tags.length) {
                                tags.append(
                                    '<div class="full-start__tag card--info-badge" style="display:inline-flex;align-items:center;gap:0.3em;background:#168FDF;color:#fff;padding:0.15em 0.5em;border-radius:0.3em;font-size:0.7em;margin-left:0.5em;text-align:center;line-height:1.5;flex-direction:column;">' +
                                    '<img src="./img/icons/menu/movie.svg" style="width:0.9em;height:0.9em;" />' +
                                    '<div style="text-align:center;">' + text + '</div>' +
                                    '</div>'
                                );
                            } else if (details.length) {
                                details.append(
                                    '<span class="full-start-new__split">●</span>' +
                                    '<div class="card--info-badge" style="display:inline-block;background:#168FDF;color:#fff;padding:0.15em 0.5em;border-radius:0.3em;font-size:0.7em;text-align:center;line-height:1.5;">' +
                                    text +
                                    '</div>'
                                );
                            }
                        }
                    }
                }

                // --- Последний просмотр ---
                if (settings.show_last_view) {
                    showLastView(card, tvInfo);
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
                    font-size: 0.9em;
                    border-radius: 0.3em;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    text-align: center;
                    line-height: 1.5;
                }

                .card--last_view {
                    top: 0.6em;
                    right: -0.5em;
                    position: absolute;
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
                    margin: -5px 0 -4px -4px;
                    float: left;
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

                .full-start__tag.card--info-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3em;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.15em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.7em;
                    margin-left: 0.5em;
                    text-align: center;
                    line-height: 1.5;
                    flex-direction: column;
                }

                .full-start__tag.card--info-badge img {
                    width: 0.9em;
                    height: 0.9em;
                }

                .full-start-new__details .card--info-badge {
                    display: inline-block;
                    background: #168FDF;
                    color: #fff;
                    padding: 0.15em 0.5em;
                    border-radius: 0.3em;
                    font-size: 0.7em;
                    text-align: center;
                    line-height: 1.5;
                }

                .serial-widget {
                    animation: serial-widget-in 0.35s cubic-bezier(0.22, 0.72, 0.2, 1) !important;
                }

                @keyframes serial-widget-in {
                    0% { opacity: 0; transform: translateY(25px) scale(0.92); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }

                @media (max-width: 585px) {
                    .card--info-badge {
                        font-size: 0.7em;
                        padding: 0.15em 0.3em;
                    }
                    .card--last_view {
                        font-size: 0.9em;
                        padding: 0.25em 0.3em;
                    }
                    .card--last_view .card__icon.icon--history {
                        width: 0.9em;
                        height: 0.9em;
                        margin: -3px 0 -3px -3px;
                    }
                    .serial-widget {
                        bottom: 1.2em !important;
                        right: 1.2em !important;
                        left: 1.2em !important;
                        max-width: none !important;
                        min-width: auto !important;
                        padding: 0.55em 0.9em !important;
                        border-radius: 0.8em !important;
                        font-size: 12px !important;
                    }
                }

                .card:not(.card--loaded) .card--info-badge,
                .card:not(.card--loaded) .card--last_view {
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
                name: 'Включить информацию о сериале'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.enabled = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_badge',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Бейдж на карточке'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_badge = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_next_episode',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Дата следующей серии'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_next_episode = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
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
                name: 'Последний просмотр (как в MODS\'s)'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_last_view = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'serial_info',
            param: {
                name: 'serial_info_widget',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Виджет продолжения (в правом нижнем углу)'
            },
            onChange: function(value) {
                var settings = getSettings();
                settings.show_widget = value === 'true' || value === true;
                setSettings(settings);
                refreshCards();
            }
        });
    }

    function refreshCards() {
        $('.serial-info-checked').removeClass('serial-info-checked');
        $('.card--info-badge, .card--last_view, .timeline, .serial-widget').remove();
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
