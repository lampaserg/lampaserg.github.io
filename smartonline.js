(function () {
    'use strict';

    if (window.smartonline_plugin_v2) return;
    window.smartonline_plugin_v2 = true;

    var PLAYBACK_TIMEOUT_MS = 12000;
    var CONFIRM_OK_MS = 15000;
    var WAIT_INTERVAL_MS = 300;
    var WAIT_MAX_TRIES = 120;
    var STATS_KEY = 'lampac_smart_stats_v2';
    var CLARIFICATION_KEY = 'clarification_search';
    var FAIL_NOTIFY_KEY = 'lampac_smart_fail_notified_v2';
    var MANIFEST_SYNC_LIMIT = 6;
    var CFG_NOTIFY_RUNTIME = 'lampac_smart_notify_runtime';
    var CFG_TIMEOUT_FAIL = 'lampac_smart_timeout_fail';
    var CFG_TIMEOUT_CONFIRM = 'lampac_smart_timeout_confirm';
    var CFG_STATS_SCOPE = 'lampac_smart_stats_scope';

    var runtime = {
        playback: null,
        playerHooksReady: false,
        fullHookReady: false,
        headButtonReady: false,
        manifestReady: false,
        componentReady: false,
        started: false,
        loadingBase: false,
        waitStarted: false,
        manifestTimer: null,
        manifestSyncCount: 0,
        settingsReady: false,
        baseComponentCache: ''
    };

    var SMART_MANIFEST_VERSION = '2.0.0';

    // ============================================================
    // ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПОИСКА ЛУЧШЕГО БАЛАНСЕРА
    // ============================================================

    var AB_HOST = 'https://ab2024.ru';

    // Приоритеты озвучек
    var VOICE_PRIORITY = {
        'dub': 1000,
        'дубляж': 1000,
        'дублированный': 1000,
        'hdrezka': 100,
        'lostfilm': 80,
        'cube': 70,
        'кубик': 70
    };

    function getVoiceScore(name) {
        var text = String(name || '').toLowerCase();
        for (var key in VOICE_PRIORITY) {
            if (text.indexOf(key) !== -1) {
                return VOICE_PRIORITY[key];
            }
        }
        if (text.indexOf('sub') !== -1 || text.indexOf('subtitles') !== -1) return -50;
        return 0;
    }

    function isDubVoice(name) {
        var text = String(name || '').toLowerCase();
        return text.indexOf('dub') !== -1 || text.indexOf('дубляж') !== -1 || text.indexOf('дублированный') !== -1;
    }

    function getItemQuality(item) {
        var quality = 0;
        var fields = ['text', 'title', 'name', 'label', 'voice_name', 'url', 'stream'];
        fields.forEach(function(field) {
            if (item[field]) {
                var q = detectQuality(item[field]);
                if (q > quality) quality = q;
            }
        });
        var qualityObj = item.quality || item.qualitys;
        if (qualityObj && typeof qualityObj === 'object') {
            for (var key in qualityObj) {
                var q1 = detectQuality(key);
                if (q1 > quality) quality = q1;
                var q2 = detectQuality(qualityObj[key]);
                if (q2 > quality) quality = q2;
            }
        }
        return quality;
    }

    function getAllBalansers(callback) {
        var allBalansers = [];

        var activeBalanser = Lampa.Storage.get('active_balanser', '');
        var onlineBalanser = Lampa.Storage.get('online_balanser', '');

        if (activeBalanser) allBalansers.push(activeBalanser);
        if (onlineBalanser && onlineBalanser !== activeBalanser) allBalansers.push(onlineBalanser);

        var mainBalansers = ['phantom', 'fxapi', 'alloha', 'kinopub', 'rezka', 'kodik'];
        mainBalansers.forEach(function(name) {
            if (!allBalansers.some(function(s) { return s.toLowerCase() === name; })) {
                allBalansers.push(name);
            }
        });

        var unique = [];
        allBalansers.forEach(function(s) {
            var lower = s.toLowerCase();
            if (!unique.some(function(u) { return u.toLowerCase() === lower; })) {
                unique.push(s);
            }
        });

        callback(unique);
    }

    function parseVideosFromResponse(str, sourceName) {
        var videos = [];
        var buttons = [];

        try {
            var $html = $('<div>' + str + '</div>');

            $html.find('.videos__item').each(function() {
                var $item = $(this);
                try {
                    var data = JSON.parse($item.attr('data-json'));
                    var text = $item.text().trim();
                    var season = $item.attr('s');
                    var episode = $item.attr('e');

                    if (data.method === 'play' || data.method === 'call') {
                        data.text = text;
                        data.sourceName = sourceName;
                        if (season) data.season = parseInt(season);
                        if (episode) data.episode = parseInt(episode);
                        videos.push(data);
                    }
                } catch (e) {}
            });

            $html.find('.videos__button').each(function() {
                var $item = $(this);
                try {
                    var data = JSON.parse($item.attr('data-json'));
                    var text = $item.text().trim();
                    data.text = text;
                    data.sourceName = sourceName;
                    buttons.push(data);
                } catch (e) {}
            });

        } catch (e) {}

        return { videos: videos, buttons: buttons };
    }

    function selectBestBalanser(results, isSerial) {
        if (!results || results.length === 0) return null;

        var best = null;
        var bestScore = -1;

        results.forEach(function(result) {
            var score = 0;

            if (result.hasDub) score += 1000;

            if (result.quality >= 2160) score += 90;
            else if (result.quality >= 1080) score += 50;
            else if (result.quality >= 720) score += 20;
            else if (result.quality >= 480) score += 5;

            var source = result.source;
            if (/phantom/.test(source)) score += 10;
            else if (/fxapi/.test(source)) score += 8;
            else if (/alloha/.test(source)) score += 6;
            else if (/kinopub/.test(source)) score += 4;

            if (isSerial && result.videos > 0) {
                score += Math.min(result.videos, 5);
            }

            if (!isSerial && result.videos > 0) {
                score += 2;
            }

            console.log('  📊 ' + source + ': вес ' + score + ' (качество ' + result.quality + 'p, дубляж ' + (result.hasDub ? '✅' : '❌') + ', видео ' + result.videos + ')');

            if (score > bestScore) {
                bestScore = score;
                best = result;
            }
        });

        return best;
    }

    function findBestBalanser(movie, callback) {
        getAllBalansers(function(balansers) {
            var isSerial = !!(movie && movie.name);

            console.log('═══════════════════════════════════════════════════════════');
            console.log('🔍 ПОИСК ЛУЧШЕГО БАЛАНСЕРА');
            console.log('  📺 ' + (movie.title || movie.name));
            console.log('  🎬 Тип: ' + (isSerial ? 'СЕРИАЛ' : 'ФИЛЬМ'));
            console.log('  🆔 ID: ' + movie.id);
            if (movie.imdb_id) console.log('  🆔 IMDB: ' + movie.imdb_id);
            if (movie.kinopoisk_id) console.log('  🆔 Кинопоиск: ' + movie.kinopoisk_id);
            console.log('📋 Балансеров: ' + balansers.length + ' (' + balansers.join(', ') + ')');
            console.log('═══════════════════════════════════════════════════════════');

            var results = [];
            var total = balansers.length;
            var completed = 0;

            if (total === 0) {
                callback(null);
                return;
            }

            balansers.forEach(function(sourceName) {
                var query = [];
                query.push('id=' + encodeURIComponent(movie.id));
                if (movie.imdb_id) query.push('imdb_id=' + (movie.imdb_id || ''));
                if (movie.kinopoisk_id) query.push('kinopoisk_id=' + (movie.kinopoisk_id || ''));
                if (movie.tmdb_id) query.push('tmdb_id=' + (movie.tmdb_id || ''));
                query.push('title=' + encodeURIComponent(movie.title || movie.name));
                query.push('original_title=' + encodeURIComponent(movie.original_title || movie.original_name));
                query.push('serial=' + (isSerial ? 1 : 0));
                query.push('original_language=' + (movie.original_language || ''));
                query.push('year=' + ((movie.release_date || movie.first_air_date || '0000') + '').slice(0, 4));
                query.push('source=' + (movie.source || 'tmdb'));

                var url = AB_HOST + '/lite/' + sourceName + '?' + query.join('&');

                console.log('📡 [' + sourceName + '] Запрос');

                var network = new Lampa.Reguest();
                network.timeout(10000);
                network["native"](url, function(str) {
                    completed++;

                    var parsed = parseVideosFromResponse(str, sourceName);
                    var videos = parsed.videos;
                    var buttons = parsed.buttons;

                    if (videos.length > 0) {
                        var bestQuality = 0;
                        var hasDub = false;
                        var bestVoice = '';
                        var bestItem = null;

                        videos.forEach(function(item) {
                            var quality = getItemQuality(item);
                            var voice = item.voice_name || item.text || '';
                            if (quality > bestQuality) {
                                bestQuality = quality;
                                bestItem = item;
                            }
                            if (isDubVoice(voice)) {
                                hasDub = true;
                                if (!bestVoice) bestVoice = voice;
                            }
                        });

                        results.push({
                            source: sourceName,
                            videos: videos.length,
                            quality: bestQuality,
                            hasDub: hasDub,
                            voice: bestVoice,
                            bestItem: bestItem,
                            buttons: buttons
                        });

                        console.log('  ✅ ' + sourceName + ': ' + videos.length + ' видео, ' + bestQuality + 'p' + (hasDub ? ', ДУБЛЯЖ' : ''));
                    } else {
                        console.log('  ⚠️ ' + sourceName + ': видео не найдены');
                    }

                    if (completed === total) {
                        var best = selectBestBalanser(results, isSerial);

                        if (best) {
                            console.log('═══════════════════════════════════════════════════════════');
                            console.log('🏆 ЛУЧШИЙ БАЛАНСЕР: ' + best.source);
                            console.log('  📹 Видео: ' + best.videos);
                            console.log('  📐 Качество: ' + best.quality + 'p');
                            console.log('  🎤 Дубляж: ' + (best.hasDub ? '✅ есть' : '❌ нет'));
                            console.log('═══════════════════════════════════════════════════════════');
                        } else {
                            console.log('❌ Подходящий балансер не найден');
                        }

                        callback(best);
                    }
                }, function(err) {
                    completed++;
                    console.log('  ❌ ' + sourceName + ': ошибка');
                    if (completed === total) {
                        callback(null);
                    }
                }, false, { dataType: 'text' });
            });
        });
    }

    function switchToBestBalanser(sourceName, movie) {
        if (!sourceName) return;

        console.log('🔄 Переключение на балансер:', sourceName);

        Lampa.Storage.set('active_balanser', sourceName);
        Lampa.Storage.set('online_balanser', sourceName);

        if (movie && movie.id) {
            var lastSelect = Lampa.Storage.cache('online_last_balanser', 3000, {});
            lastSelect[movie.id] = sourceName;
            Lampa.Storage.set('online_last_balanser', lastSelect);
        }

        // Открываем онлайн с новым балансером
        var id = Lampa.Utils.hash(movie.number_of_seasons ? movie.original_name : movie.original_title);
        var all = Lampa.Storage.get('clarification_search', {});

        Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_online'),
            component: 'lampac',
            search: all[id] ? all[id] : movie.title,
            search_one: movie.title,
            search_two: movie.original_title,
            movie: movie,
            page: 1,
            balanser: sourceName,
            clarification: all[id] ? true : false
        });

        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('🔊 ' + sourceName);
        }
    }

    // ============================================================
    // ДОБАВЛЕНИЕ КНОПКИ "ЛУЧШИЙ БАЛАНСЕР"
    // ============================================================

    function addBestBalanserButton() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-best-balanser').length > 0) return;

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-best-balanser" style="display:flex !important; opacity:1 !important; visibility:visible !important; background: rgba(76, 175, 80, 0.12) !important; border: 1px solid #4CAF50 !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4CAF50" style="width:24px;height:24px;">' +
                    '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' +
                    '</svg>' +
                    '<span style="color: #4CAF50;">🔍 Лучший балансер</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    findBestBalanser(movie, function(best) {
                        if (best) {
                            switchToBestBalanser(best.source, movie);
                        } else {
                            Lampa.Noty.show('❌ Подходящий балансер не найден');
                        }
                    });
                });

                var container = render.find('.full-start__buttons, .full-start-new__buttons, .buttons--container').eq(0);
                if (container.length) {
                    container.append(btn);
                } else {
                    render.append(btn);
                }
            }
        });
    }

    // ============================================================
    // ОРИГИНАЛЬНЫЙ КОД SMART ONLINE (без изменений)
    // ============================================================

    function detectBaseComponentFromManifest() {
        if (!window.Lampa || !Lampa.Manifest) return '';

        var plugins = Lampa.Manifest.plugins;
        var list = Array.isArray(plugins) ? plugins : [plugins];
        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            if (!p || !p.component || p.component === 'iptv') continue;

            var text = (p.name || '') + ' ' + (p.description || '');
            if (/online|\u043E\u043D\u043B\u0430\u0439\u043D|nextgen|lampa|serial|film|movie|\u0444\u0438\u043B\u044C\u043C|\u0441\u0435\u0440\u0456\u0430\u043B/i.test(text))
                return p.component;
        }

        return '';
    }

    function baseComponentName() {
        if (window.lampac_base_component_name) return window.lampac_base_component_name;

        if (runtime.baseComponentCache && window.Lampa && Lampa.Component && Lampa.Component.get && Lampa.Component.get(runtime.baseComponentCache))
            return runtime.baseComponentCache;

        var detected = detectBaseComponentFromManifest();
        if (!detected && window.Lampa && Lampa.Component && Lampa.Component.get) {
            var candidates = ['lampac', 'LampaUaNg', 'online'];
            for (var i = 0; i < candidates.length; i++) {
                if (Lampa.Component.get(candidates[i])) {
                    detected = candidates[i];
                    break;
                }
            }
        }

        if (detected) runtime.baseComponentCache = detected;
        return runtime.baseComponentCache || 'lampac';
    }

    function smartComponentName() {
        return window.lampac_smart_component_name || (baseComponentName() + '_smart');
    }

    function notify(text) {
        if (window.Lampa && Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(text);
    }

    function settingValue(name, def) {
        if (!window.Lampa || !Lampa.Storage) return def;
        var val = Lampa.Storage.get(name, def);
        return val === undefined || val === null || val === '' ? def : val;
    }

    function settingBool(name, def) {
        var val = settingValue(name, def);
        if (typeof val === 'boolean') return val;
        return String(val) === 'true';
    }

    function settingInt(name, def) {
        var val = parseInt(settingValue(name, String(def)), 10);
        return isNaN(val) ? def : val;
    }

    function shouldNotifyRuntime() {
        return settingBool(CFG_NOTIFY_RUNTIME, false);
    }

    function getPlaybackTimeoutMs() {
        return Math.max(4, settingInt(CFG_TIMEOUT_FAIL, Math.round(PLAYBACK_TIMEOUT_MS / 1000))) * 1000;
    }

    function getConfirmTimeoutMs() {
        return Math.max(6, settingInt(CFG_TIMEOUT_CONFIRM, Math.round(CONFIRM_OK_MS / 1000))) * 1000;
    }

    function notifyOnce(key, text) {
        if (!window.Lampa || !Lampa.Storage) {
            notify(text);
            return;
        }

        if (Lampa.Storage.get(key, false)) return;
        Lampa.Storage.set(key, true);
        notify(text);
    }

    function notifyRuntime(text) {
        if (shouldNotifyRuntime()) notify(text);
    }

    function normalize(value) {
        return (value || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function keyify(value) {
        return normalize(value).replace(/[^a-z0-9\u0400-\u04FF]+/gi, '_').replace(/^_+|_+$/g, '') || 'unknown';
    }

    function getStats() {
        var data = Lampa.Storage.get(STATS_KEY, {});
        if (!Lampa.Arrays.isObject(data)) data = {};
        if (!Lampa.Arrays.isObject(data.sources)) data.sources = {};
        if (!Lampa.Arrays.isObject(data.voices)) data.voices = {};
        return data;
    }

    function saveStats(data) {
        Lampa.Storage.set(STATS_KEY, data);
    }

    function statWeightByKey(data, type, key) {
        if (!key) return 0;
        var stat = data[type][key];
        if (!stat) return 0;
        return (stat.success || 0) * 8 - (stat.fail || 0) * 5;
    }

    function scopedStatsKey(type, key, context) {
        if (!key) return key;
        var scope = String(settingValue(CFG_STATS_SCOPE, 'media'));
        if (scope === 'global' || !context || !context.mediaType) return key;

        if (type === 'voices') return key + '::' + context.mediaType + '::' + (context.sourceKey || 'default');
        return key + '::' + context.mediaType;
    }

    function updateStats(type, key, success, context) {
        if (!key) return;

        var data = getStats();
        if (!Lampa.Arrays.isObject(data[type][key])) data[type][key] = { success: 0, fail: 0 };

        data[type][key][success ? 'success' : 'fail']++;

        var scoped = scopedStatsKey(type, key, context);
        if (scoped !== key) {
            if (!Lampa.Arrays.isObject(data[type][scoped])) data[type][scoped] = { success: 0, fail: 0 };
            data[type][scoped][success ? 'success' : 'fail']++;
        }

        saveStats(data);
    }

    function statsWeight(type, key, context) {
        if (!key) return 0;

        var data = getStats();
        var base = statWeightByKey(data, type, key);
        var scoped = scopedStatsKey(type, key, context);
        if (scoped === key) return base;

        return Math.round(base * 0.4 + statWeightByKey(data, type, scoped));
    }

    function getClarification(movie) {
        var id = Lampa.Utils.hash(movie.number_of_seasons ? movie.original_name : movie.original_title);
        var all = Lampa.Storage.get(CLARIFICATION_KEY, {});
        if (!Lampa.Arrays.isObject(all)) all = {};
        return all[id];
    }

    function detectQuality(value) {
        var text = normalize(value);
        if (!text) return 0;

        if (/(2160|4k|uhd|ultra[\s-]?hd|3840)/i.test(text)) return 2160;
        if (/(1080|full[\s-]?hd|fhd|1920)/i.test(text)) return 1080;
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 0;
        if (/(480|sd|640|854)/i.test(text)) return 0;

        return 0;
    }

    function qualityWeight(quality) {
        if (quality >= 2160) return 100;
        if (quality >= 1080) return 50;
        return 0;
    }

    function sourceWeight(source) {
        var text = normalize(source);
        if (/phantom/.test(text)) return 10;
        if (/filmix/.test(text)) return 8;
        if (/alloha/.test(text)) return 6;
        if (/kinopub/.test(text)) return 4;
        return 0;
    }

    function voiceWeight(name) {
        var text = normalize(name);
        var score = 0;

        if (!text) return score;

        if (/hdrezka|hd.rezka|rezka/.test(text)) score += 20;
        if (/(\u043A\u0443\u0431\u0438\u043A|cube|куб|kubik)/i.test(text)) score += 13;
        if (/(\u0434\u0443\u0431\u043B\u044F\u0436|dub\b)/i.test(text)) score += 15;
        if (/lostfilm|lost.film/.test(text)) score += 10;
        if (/(\u0441\u0443\u0431\u0442|sub\b|subtitle|original|\u043E\u0440\u0438\u0433\u0456\u043D|orig)/i.test(text)) score -= 10;
        if (/english|eng|en\b/i.test(text) && !/russian|rus/.test(text)) score -= 100;

        return score;
    }

    function getActiveSource() {
        return Lampa.Storage.get('active_balanser', '') || Lampa.Storage.get('online_balanser', '');
    }

    function itemQuality(item) {
        var max = 0;

        if (item && item.quality && Lampa.Arrays.isObject(item.quality)) {
            Lampa.Arrays.getKeys(item.quality).forEach(function (q) {
                var detected = detectQuality(q + ' ' + item.quality[q]);
                if (detected > max) max = detected;
            });
        }

        var textFields = [item && item.text, item && item.title, item && item.name, item && item.label];
        textFields.forEach(function (field) {
            var detected = detectQuality(field);
            if (detected > max) max = detected;
        });

        var urlFields = [item && item.url, item && item.stream];
        urlFields.forEach(function (field) {
            var detected = detectQuality(field);
            if (detected > max) max = detected;
        });

        return max;
    }

    function rankVoices(buttons, sourceName, context) {
        var sourceKey = keyify(sourceName);

        return buttons.map(function (button, index) {
            var title = button.text || '';
            var score = voiceWeight(title) + statsWeight('voices', keyify(title), context) + statsWeight('sources', sourceKey, context);

            if (button.active) score += 1;

            return {
                index: index,
                title: title,
                url: button.url,
                active: !!button.active,
                score: score
            };
        }).sort(function (a, b) {
            return b.score - a.score;
        });
    }

    function bestVoice(buttons, sourceName, context) {
        return rankVoices(buttons, sourceName, context)[0] || null;
    }

    function buildQueue(videos, sourceName, fallbackVoice, context) {
        var map = {};

        videos.forEach(function (item) {
            var voiceName = item.voice_name || item.text || fallbackVoice || '';
            var voiceKey = keyify(voiceName);
            var sourceKey = keyify(sourceName);
            var quality = itemQuality(item);

            if (quality !== 2160 && quality !== 1080) return;

            if (!item || (!item.url && !item.stream)) return;

            var score = 0;

            score += qualityWeight(quality);
            score += voiceWeight(voiceName);
            score += sourceWeight(sourceName);
            score += statsWeight('voices', voiceKey, context);
            score += statsWeight('sources', sourceKey, context);
            score += item.method === 'play' ? 10 : 4;

            var urlHint = normalize(item.url || item.stream || '');
            if (/m3u8/.test(urlHint)) score += 4;
            if (/mp4/.test(urlHint)) score += 2;
            if (/iframe|embed/.test(urlHint)) score -= 4;

            var candidate = {
                id: Lampa.Utils.hash([sourceKey, voiceKey, item.url || item.stream || item.text || Math.random()].join('::')),
                item: item,
                sourceKey: sourceKey,
                sourceName: sourceName || '',
                voiceKey: voiceKey,
                voiceName: voiceName,
                statsContext: context,
                quality: quality,
                score: score
            };

            if (!map[candidate.id] || map[candidate.id].score < candidate.score) {
                map[candidate.id] = candidate;
            }
        });

        return Object.keys(map).map(function (id) { return map[id]; }).sort(function (a, b) {
            return b.score - a.score;
        });
    }

    function clearPlayback(playback) {
        if (!playback) return;

        clearTimeout(playback.failTimer);
        clearTimeout(playback.cleanupTimer);
        if (runtime.playback === playback) runtime.playback = null;
    }

    function activityComponentInstance(activity) {
        if (!activity || !activity.activity || !activity.activity.component) return null;
        return typeof activity.activity.component === 'function' ? activity.activity.component() : activity.activity.component;
    }

    function failPlayback(playback, reason) {
        if (!playback || playback.failing) return;

        playback.failing = true;
        clearTimeout(playback.failTimer);
        clearTimeout(playback.cleanupTimer);

        if (playback.candidate) {
            updateStats('sources', playback.candidate.sourceKey, false, playback.candidate.statsContext);
            updateStats('voices', playback.candidate.voiceKey, false, playback.candidate.statsContext);
        }

        setTimeout(function () {
            playback.failing = false;
            playNextCandidate(playback.instance, playback.state, reason || 'fail');
        }, 250);
    }

    function buildPlayElement(instance, candidate, json, jsonCall) {
        var play = instance.toPlayElement(candidate.item);

        play.url = json.url;
        play.headers = jsonCall.headers || json.headers;
        play.quality = jsonCall.quality || candidate.item.qualitys || candidate.item.quality;
        play.segments = jsonCall.segments || candidate.item.segments;
        play.hls_manifest_timeout = jsonCall.hls_manifest_timeout || json.hls_manifest_timeout;
        play.subtitles = json.subtitles;
        play.subtitles_call = jsonCall.subtitles_call || json.subtitles_call;
        play.isonline = true;
        play._lampacSmartId = candidate.id;

        if (json.vast && json.vast.url) {
            play.vast_url = json.vast.url;
            play.vast_msg = json.vast.msg;
            play.vast_region = json.vast.region;
            play.vast_platform = json.vast.platform;
            play.vast_screen = json.vast.screen;
        }

        instance.orUrlReserve(play);
        if (play.quality && Lampa.Arrays.isObject(play.quality)) instance.setDefaultQuality(play);

        return play;
    }

    function playNextCandidate(instance, state, reason) {
        if (!state || state.manualMode) return;

        state.autoStarted = true;
        state.queueIndex++;

        if (!state.queue.length || state.queueIndex >= state.queue.length) {
            if (runtime.playback && runtime.playback.state === state) clearPlayback(runtime.playback);

            if (state.tryNextVoice && state.tryNextVoice()) return;

            notifyRuntime(Lampa.Lang.translate('lampac_smart_manual_needed'));
            return;
        }

        var candidate = state.queue[state.queueIndex];
        state.currentCandidate = candidate;

        if (reason && reason !== 'autostart') notifyRuntime(Lampa.Lang.translate('lampac_smart_retrying'));

        instance.getFileUrl(candidate.item, function (json, jsonCall) {
            if (!json || !json.url) {
                failPlayback({
                    instance: instance,
                    state: state,
                    candidate: candidate
                }, 'resolve');
                return;
            }

            var play = buildPlayElement(instance, candidate, json, jsonCall || {});
            var playback = {
                instance: instance,
                state: state,
                candidate: candidate,
                play: play,
                readyAt: 0,
                failing: false,
                failTimer: null,
                cleanupTimer: null
            };

            runtime.playback = playback;

            if (Lampa.Storage.field('player') === 'inner') {
                playback.failTimer = setTimeout(function () {
                    failPlayback(playback, 'timeout');
                }, getPlaybackTimeoutMs());
            }

            Lampa.Player.play(play);
            if (play.subtitles_call) instance.loadSubtitles(play.subtitles_call);
            if (candidate.item.mark) candidate.item.mark();
        }, true);
    }

    function installPlayerHooks() {
        if (runtime.playerHooksReady) return true;
        if (!Lampa.Player || !Lampa.Player.listener || !Lampa.Player.listener.follow) return false;

        runtime.playerHooksReady = true;

        Lampa.Player.listener.follow('start', function (data) {
            var playback = runtime.playback;
            if (!playback || !data || data._lampacSmartId !== playback.candidate.id) return;

            if (Lampa.Storage.field('player') !== 'inner') {
                updateStats('sources', playback.candidate.sourceKey, true, playback.candidate.statsContext);
                updateStats('voices', playback.candidate.voiceKey, true, playback.candidate.statsContext);
                clearPlayback(playback);
            }
        });

        Lampa.Player.listener.follow('ready', function (data) {
            var playback = runtime.playback;
            if (!playback || !data || data._lampacSmartId !== playback.candidate.id) return;

            playback.readyAt = Date.now();
            clearTimeout(playback.failTimer);
            updateStats('sources', playback.candidate.sourceKey, true, playback.candidate.statsContext);
            updateStats('voices', playback.candidate.voiceKey, true, playback.candidate.statsContext);
            playback.cleanupTimer = setTimeout(function () {
                clearPlayback(playback);
            }, getConfirmTimeoutMs() + 5000);
        });

        Lampa.Player.listener.follow('error', function () {
            var playback = runtime.playback;
            if (!playback) return;

            if (playback.readyAt && Date.now() - playback.readyAt > getConfirmTimeoutMs()) {
                clearPlayback(playback);
                return;
            }

            try { if (Lampa.Player.close) Lampa.Player.close(); } catch (e) {}

            failPlayback(playback, 'player-error');
        });

        Lampa.Player.listener.follow('ended', function () {
            if (runtime.playback) clearPlayback(runtime.playback);
        });

        return true;
    }

    function smartActivity(movie) {
        var clarification = getClarification(movie);

        return {
            url: '',
            title: Lampa.Lang.translate('lampac_smart_watch'),
            component: smartComponentName(),
            search: clarification ? clarification : movie.title,
            search_one: movie.title,
            search_two: movie.original_title,
            movie: movie,
            page: 1,
            clarification: clarification ? true : false
        };
    }

    function addHeadButton() {
        if (runtime.headButtonReady) return;
        runtime.headButtonReady = true;

        var button = $('<div class="head__action selector lampac-smart-manual" style="display:none;"><span style="font-size:1.05em;font-weight:700;">MAN</span></div>');

        button.on('hover:enter', function () {
            var active = Lampa.Activity.active();
            if (!active || active.component !== smartComponentName()) return;

            var component = activityComponentInstance(active);
            if (component && component._lampacSmart && component._lampacSmart.enableManual)
                component._lampacSmart.enableManual();

            Lampa.Activity.replace({
                component: baseComponentName()
            });
        });

        $('.head .open--search').after(button);

        Lampa.Listener.follow('activity', function (e) {
            if (!e || e
