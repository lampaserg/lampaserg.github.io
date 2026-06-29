(function () {
    'use strict';

    if (window.smartonline_plugin_v2) return;
    window.smartonline_plugin_v2 = true;

    // ============================================================
    // НАСТРОЙКИ ОТЛАДКИ (РУССКИЙ ЯЗЫК)
    // ============================================================

    var DEBUG = {
        enabled: true,           // Включить отладку
        console: true,           // Вывод в консоль
        noty: false,             // Вывод уведомлений
        qualityDetection: true,  // Отладка определения качества
        queueBuilding: true,     // Отладка построения очереди
        scoreCalculation: true,  // Отладка расчета весов
        selection: true,         // Отладка выбора потока
        streamAnalysis: true     // Отладка анализа видеопотока
    };

    function debugLog(category, message, data) {
        if (!DEBUG.enabled || !DEBUG.console) return;
        if (!DEBUG[category] && category !== 'always') return;

        var prefix = '🔍 [SmartOnline]';
        if (category === 'qualityDetection') prefix = '📐 [Качество]';
        else if (category === 'queueBuilding') prefix = '📋 [Очередь]';
        else if (category === 'scoreCalculation') prefix = '⚖️ [Вес]';
        else if (category === 'selection') prefix = '🎯 [Выбор]';
        else if (category === 'streamAnalysis') prefix = '📺 [Анализ потока]';
        else if (category === 'always') prefix = '📢 [SmartOnline]';

        if (data !== undefined) {
            try {
                console.log(prefix, message, JSON.stringify(data, null, 2));
            } catch (e) {
                console.log(prefix, message, data);
            }
        } else {
            console.log(prefix, message);
        }
    }

    // ============================================================

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

    // ============================================================
    // ОПРЕДЕЛЕНИЕ КАЧЕСТВА ПО ВИДЕОПОТОКУ
    // ============================================================

    // Кэш для хранения результатов анализа потоков
    var streamQualityCache = {};

    /**
     * Анализирует видеопоток через video элемент
     * Определяет реальное разрешение видео
     */
    function analyzeStreamQuality(url, callback) {
        if (!url) {
            callback(0);
            return;
        }

        // Проверяем кэш
        var cacheKey = Lampa.Utils.hash(url);
        if (streamQualityCache[cacheKey]) {
            debugLog('streamAnalysis', '📦 Использую кэшированное качество для потока: ' + streamQualityCache[cacheKey] + 'p', { url: url });
            callback(streamQualityCache[cacheKey]);
            return;
        }

        debugLog('streamAnalysis', '🔍 Анализирую видеопоток: ' + url.substring(0, 100) + '...');

        try {
            var video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.style.display = 'none';
            document.body.appendChild(video);

            var timeout = setTimeout(function() {
                video.remove();
                debugLog('streamAnalysis', '⏱️ Таймаут анализа потока, использую определение по названию');
                // Если не удалось определить по потоку, пробуем по URL
                var qualityFromUrl = detectQualityFromText(url);
                if (qualityFromUrl > 0) {
                    streamQualityCache[cacheKey] = qualityFromUrl;
                }
                callback(qualityFromUrl || 0);
            }, 3000);

            var loadedMetadata = false;

            video.addEventListener('loadedmetadata', function() {
                if (loadedMetadata) return;
                loadedMetadata = true;
                clearTimeout(timeout);

                var width = video.videoWidth || 0;
                var height = video.videoHeight || 0;

                debugLog('streamAnalysis', '📺 Разрешение видео: ' + width + 'x' + height);

                var quality = 0;
                if (height >= 2160) quality = 2160;
                else if (height >= 1080) quality = 1080;
                else if (height >= 720) quality = 720;
                else if (height >= 480) quality = 480;

                debugLog('streamAnalysis', '📐 Определенное качество: ' + quality + 'p');

                if (quality > 0) {
                    streamQualityCache[cacheKey] = quality;
                }

                video.remove();
                callback(quality);
            });

            video.addEventListener('error', function(e) {
                clearTimeout(timeout);
                video.remove();
                debugLog('streamAnalysis', '❌ Ошибка загрузки видео: ' + (e.message || 'неизвестная ошибка'));
                // Пробуем определить по URL
                var qualityFromUrl = detectQualityFromText(url);
                if (qualityFromUrl > 0) {
                    streamQualityCache[cacheKey] = qualityFromUrl;
                    callback(qualityFromUrl);
                } else {
                    callback(0);
                }
            });

            // Пробуем загрузить видео
            video.src = url;
            video.load();

        } catch (e) {
            debugLog('streamAnalysis', '❌ Ошибка анализа потока: ' + (e.message || 'неизвестная ошибка'));
            // Пробуем определить по URL
            var qualityFromUrl = detectQualityFromText(url);
            if (qualityFromUrl > 0) {
                streamQualityCache[cacheKey] = qualityFromUrl;
                callback(qualityFromUrl);
            } else {
                callback(0);
            }
        }
    }

    /**
     * Определение качества по тексту (название, URL)
     */
    function detectQualityFromText(value) {
        var text = normalize(value);
        if (!text) return 0;

        if (/(2160|4k|uhd|ultra[\s-]?hd|3840)/i.test(text)) return 2160;
        if (/(1080|full[\s-]?hd|fhd|1920)/i.test(text)) return 1080;
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 720;
        if (/(480|sd|640|854)/i.test(text)) return 480;

        return 0;
    }

    /**
     * Определение качества с анализом потока (асинхронно)
     */
    function detectQualityWithStreamAnalysis(item, callback) {
        var url = item.url || item.stream || '';

        // Сначала проверяем по тексту
        var textQuality = 0;
        var textFields = [item && item.text, item && item.title, item && item.name, item && item.label];
        textFields.forEach(function(field) {
            if (field) {
                var q = detectQualityFromText(field);
                if (q > textQuality) textQuality = q;
            }
        });

        // Проверяем URL
        var urlQuality = detectQualityFromText(url);
        var maxFromText = Math.max(textQuality, urlQuality);

        debugLog('qualityDetection', '📐 Качество по названию: ' + maxFromText + 'p');

        // Если есть URL, пытаемся проанализировать поток
        if (url && url.indexOf('http') === 0) {
            debugLog('qualityDetection', '🔍 Запускаю анализ видеопотока...');
            analyzeStreamQuality(url, function(streamQuality) {
                debugLog('qualityDetection', '📐 Качество по потоку: ' + streamQuality + 'p');
                var finalQuality = Math.max(maxFromText, streamQuality);
                debugLog('qualityDetection', '✅ Итоговое качество: ' + finalQuality + 'p');
                callback(finalQuality);
            });
            return;
        }

        // Если нет URL, возвращаем то, что нашли по тексту
        callback(maxFromText);
    }

    // ============================================================
    // ВЕСА КАЧЕСТВА
    // ============================================================

    function qualityWeight(quality) {
        if (quality >= 2160) {
            debugLog('scoreCalculation', '📊 Вес качества: 100 (4K)');
            return 100;
        }
        if (quality >= 1080) {
            debugLog('scoreCalculation', '📊 Вес качества: 50 (1080p)');
            return 50;
        }
        debugLog('scoreCalculation', '📊 Вес качества: 0 (исключено)');
        return 0;
    }

    // ============================================================
    // ВЕСА ИСТОЧНИКОВ
    // ============================================================

    function sourceWeight(source) {
        var text = normalize(source);
        var weight = 0;

        if (/phantom/.test(text)) {
            weight = 10;
            debugLog('scoreCalculation', '📊 Вес источника: 10 (Phantom)');
        } else if (/filmix/.test(text)) {
            weight = 8;
            debugLog('scoreCalculation', '📊 Вес источника: 8 (Filmix)');
        } else if (/alloha/.test(text)) {
            weight = 6;
            debugLog('scoreCalculation', '📊 Вес источника: 6 (Alloha)');
        } else if (/kinopub/.test(text)) {
            weight = 4;
            debugLog('scoreCalculation', '📊 Вес источника: 4 (Kinopub)');
        } else {
            debugLog('scoreCalculation', '📊 Вес источника: 0 (неизвестный: ' + text + ')');
        }

        return weight;
    }

    // ============================================================
    // ВЕСА ОЗВУЧЕК
    // ============================================================

    function voiceWeight(name) {
        var text = normalize(name);
        var score = 0;

        if (!text) return score;

        debugLog('scoreCalculation', '🎤 Анализ озвучки: ' + text);

        if (/hdrezka|hd.rezka|rezka/.test(text)) {
            score += 20;
            debugLog('scoreCalculation', '  +20 (HDRezka)');
        }

        if (/(\u043A\u0443\u0431\u0438\u043A|cube|куб|kubik)/i.test(text)) {
            score += 13;
            debugLog('scoreCalculation', '  +13 (Кубик в Кубе)');
        }

        if (/(\u0434\u0443\u0431\u043B\u044F\u0436|dub\b)/i.test(text)) {
            score += 15;
            debugLog('scoreCalculation', '  +15 (Дубляж)');
        }

        if (/lostfilm|lost.film/.test(text)) {
            score += 10;
            debugLog('scoreCalculation', '  +10 (LostFilm)');
        }

        if (/(\u0441\u0443\u0431\u0442|sub\b|subtitle|original|\u043E\u0440\u0438\u0433\u0456\u043D|orig)/i.test(text)) {
            score -= 10;
            debugLog('scoreCalculation', '  -10 (субтитры/оригинал)');
        }

        if (/english|eng|en\b/i.test(text) && !/russian|rus/.test(text)) {
            score -= 100;
            debugLog('scoreCalculation', '  -100 (английская озвучка исключена)');
        }

        debugLog('scoreCalculation', '  Итоговый вес озвучки: ' + score);

        return score;
    }

    function getActiveSource() {
        return Lampa.Storage.get('active_balanser', '') || Lampa.Storage.get('online_balanser', '');
    }

    // ============================================================
    // АНАЛИЗ КАЧЕСТВА ИТЕМА
    // ============================================================

    function itemQuality(item, callback) {
        debugLog('qualityDetection', '🔍 Анализирую элемент:', {
            text: item.text || 'Нет текста',
            title: item.title || 'Нет заголовка',
            url: (item.url || '').substring(0, 80) + '...'
        });

        detectQualityWithStreamAnalysis(item, function(quality) {
            debugLog('qualityDetection', '📐 Итоговое качество: ' + quality + 'p' + (quality === 0 ? ' (будет исключено)' : ''));
            callback(quality);
        });
    }

    // ============================================================
    // ФИЛЬТРАЦИЯ И СОРТИРОВКА
    // ============================================================

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

    // ============================================================
    // ПОСТРОЕНИЕ ОЧЕРЕДИ
    // ============================================================

    function buildQueue(videos, sourceName, fallbackVoice, context) {
        var map = {};
        var totalCandidates = 0;
        var excludedCount = 0;
        var pendingCount = 0;

        debugLog('queueBuilding', '🚀 Построение очереди для источника: ' + sourceName);
        debugLog('queueBuilding', '📊 Всего видео: ' + videos.length);

        return new Promise(function(resolve) {
            videos.forEach(function(item, index) {
                var voiceName = item.voice_name || item.text || fallbackVoice || '';
                var voiceKey = keyify(voiceName);
                var sourceKey = keyify(sourceName);

                // Анализируем качество каждого элемента
                itemQuality(item, function(quality) {
                    pendingCount++;

                    debugLog('queueBuilding', '--- Видео #' + (index + 1) + ' ---');
                    debugLog('queueBuilding', '  Текст: ' + (item.text || 'Нет текста'));
                    debugLog('queueBuilding', '  Озвучка: ' + voiceName);
                    debugLog('queueBuilding', '  Качество: ' + quality + 'p');

                    // === ФИЛЬТРАЦИЯ: исключаем все, кроме 2160p и 1080p ===
                    if (quality !== 2160 && quality !== 1080) {
                        excludedCount++;
                        debugLog('queueBuilding', '  ❌ ИСКЛЮЧЕНО: качество ' + quality + 'p (разрешены только 2160p и 1080p)');
                    } else if (!item || (!item.url && !item.stream)) {
                        debugLog('queueBuilding', '  ❌ ИСКЛЮЧЕНО: нет URL или потока');
                    } else {
                        totalCandidates++;

                        var score = 0;

                        debugLog('queueBuilding', '  📊 Расчет веса:');

                        var qWeight = qualityWeight(quality);
                        score += qWeight;

                        var vWeight = voiceWeight(voiceName);
                        score += vWeight;

                        var sWeight = sourceWeight(sourceName);
                        score += sWeight;

                        var statsVoice = statsWeight('voices', voiceKey, context);
                        score += statsVoice;

                        var statsSource = statsWeight('sources', sourceKey, context);
                        score += statsSource;

                        var methodBonus = item.method === 'play' ? 10 : 4;
                        score += methodBonus;

                        var urlHint = normalize(item.url || item.stream || '');
                        var formatBonus = 0;
                        if (/m3u8/.test(urlHint)) {
                            formatBonus = 4;
                            debugLog('queueBuilding', '  +4 (формат m3u8)');
                        } else if (/mp4/.test(urlHint)) {
                            formatBonus = 2;
                            debugLog('queueBuilding', '  +2 (формат mp4)');
                        } else if (/iframe|embed/.test(urlHint)) {
                            formatBonus = -4;
                            debugLog('queueBuilding', '  -4 (формат iframe/embed)');
                        }
                        score += formatBonus;

                        debugLog('queueBuilding', '  ✅ ИТОГОВЫЙ ВЕС: ' + score);
                        debugLog('queueBuilding', '    Качество: ' + qWeight);
                        debugLog('queueBuilding', '    Озвучка: ' + vWeight);
                        debugLog('queueBuilding', '    Источник: ' + sWeight);
                        debugLog('queueBuilding', '    Статистика (озвучка): ' + statsVoice);
                        debugLog('queueBuilding', '    Статистика (источник): ' + statsSource);
                        debugLog('queueBuilding', '    Метод: ' + methodBonus);
                        debugLog('queueBuilding', '    Формат: ' + formatBonus);

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
                    }

                    // Проверяем, все ли видео обработаны
                    if (pendingCount === videos.length) {
                        debugLog('queueBuilding', '📊 Результаты:');
                        debugLog('queueBuilding', '  Всего кандидатов: ' + totalCandidates);
                        debugLog('queueBuilding', '  Исключено: ' + excludedCount);

                        var sorted = Object.keys(map).map(function(id) { return map[id]; }).sort(function(a, b) {
                            return b.score - a.score;
                        });

                        if (sorted.length > 0) {
                            debugLog('queueBuilding', '🏆 ОТСОРТИРОВАННАЯ ОЧЕРЕДЬ (топ 5):');
                            sorted.slice(0, 5).forEach(function(c, i) {
                                debugLog('queueBuilding', '  #' + (i + 1) + ': вес=' + c.score + ' | качество=' + c.quality + 'p | озвучка=' + c.voiceName + ' | источник=' + c.sourceName);
                            });
                        } else {
                            debugLog('queueBuilding', '❌ КАНДИДАТОВ НЕ НАЙДЕНО!');
                            debugLog('queueBuilding', '  Проверьте:');
                            debugLog('queueBuilding', '  1. Есть ли потоки с качеством 2160p или 1080p?');
                            debugLog('queueBuilding', '  2. Проверьте функцию itemQuality()');
                            debugLog('queueBuilding', '  3. Проверьте наличие URL');
                        }

                        resolve(sorted);
                    }
                });
            });
        });
    }

    // ============================================================
    // ОСТАЛЬНЫЕ ФУНКЦИИ
    // ============================================================

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

        debugLog('always', '❌ Воспроизведение не удалось: ' + reason, {
            candidate: playback.candidate ? {
                источник: playback.candidate.sourceName,
                озвучка: playback.candidate.voiceName,
                качество: playback.candidate.quality + 'p',
                вес: playback.candidate.score
            } : 'Нет данных'
        });

        playback.failing = true;
        clearTimeout(playback.failTimer);
        clearTimeout(playback.cleanupTimer);

        if (playback.candidate) {
            updateStats('sources', playback.candidate.sourceKey, false, playback.candidate.statsContext);
            updateStats('voices', playback.candidate.voiceKey, false, playback.candidate.statsContext);
        }

        setTimeout(function() {
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

        debugLog('selection', '🎬 ЗАПУСК ПОТОКА:', {
            источник: candidate.sourceName,
            озвучка: candidate.voiceName,
            качество: candidate.quality + 'p',
            вес: candidate.score,
            url: (play.url || '').substring(0, 100) + '...'
        });

        return play;
    }

    function playNextCandidate(instance, state, reason) {
        if (!state || state.manualMode) return;

        state.autoStarted = true;
        state.queueIndex++;

        if (!state.queue.length || state.queueIndex >= state.queue.length) {
            debugLog('always', '❌ Очередь исчерпана, все кандидаты не удались');

            if (runtime.playback && runtime.playback.state === state) clearPlayback(runtime.playback);

            if (state.tryNextVoice && state.tryNextVoice()) return;

            notifyRuntime(Lampa.Lang.translate('lampac_smart_manual_needed'));
            return;
        }

        var candidate = state.queue[state.queueIndex];
        state.currentCandidate = candidate;

        debugLog('selection', '▶️ Попытка #' + (state.queueIndex + 1) + ' из ' + state.queue.length, {
            источник: candidate.sourceName,
            озвучка: candidate.voiceName,
            качество: candidate.quality + 'p',
            вес: candidate.score
        });

        if (reason && reason !== 'autostart') notifyRuntime(Lampa.Lang.translate('lampac_smart_retrying'));

        instance.getFileUrl(candidate.item, function(json, jsonCall) {
            if (!json || !json.url) {
                debugLog('always', '❌ Не удалось получить URL для кандидата', {
                    источник: candidate.sourceName,
                    озвучка: candidate.voiceName,
                    качество: candidate.quality + 'p'
                });

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
                playback.failTimer = setTimeout(function() {
                    failPlayback(playback, 'timeout');
                }, getPlaybackTimeoutMs());
            }

            Lampa.Player.play(play);
            if (play.subtitles_call) instance.loadSubtitles(play.subtitles_call);
            if (candidate.item.mark) candidate.item.mark();
        }, true);
    }

    // ============================================================
    // PLAYER HOOKS
    // ============================================================

    function installPlayerHooks() {
        if (runtime.playerHooksReady) return true;
        if (!Lampa.Player || !Lampa.Player.listener || !Lampa.Player.listener.follow) return false;

        runtime.playerHooksReady = true;

        Lampa.Player.listener.follow('start', function(data) {
            var playback = runtime.playback;
            if (!playback || !data || data._lampacSmartId !== playback.candidate.id) return;

            debugLog('always', '✅ Плеер успешно запущен:', {
                источник: playback.candidate.sourceName,
                озвучка: playback.candidate.voiceName,
                качество: playback.candidate.quality + 'p',
                вес: playback.candidate.score
            });

            if (Lampa.Storage.field('player') !== 'inner') {
                updateStats('sources', playback.candidate.sourceKey, true, playback.candidate.statsContext);
                updateStats('voices', playback.candidate.voiceKey, true, playback.candidate.statsContext);
                clearPlayback(playback);
            }
        });

        Lampa.Player.listener.follow('ready', function(data) {
            var playback = runtime.playback;
            if (!playback || !data || data._lampacSmartId !== playback.candidate.id) return;

            debugLog('always', '✅ Плеер готов:', {
                источник: playback.candidate.sourceName,
                озвучка: playback.candidate.voiceName,
                качество: playback.candidate.quality + 'p',
                вес: playback.candidate.score
            });

            playback.readyAt = Date.now();
            clearTimeout(playback.failTimer);
            updateStats('sources', playback.candidate.sourceKey, true, playback.candidate.statsContext);
            updateStats('voices', playback.candidate.voiceKey, true, playback.candidate.statsContext);
            playback.cleanupTimer = setTimeout(function() {
                clearPlayback(playback);
            }, getConfirmTimeoutMs() + 5000);
        });

        Lampa.Player.listener.follow('error', function() {
            var playback = runtime.playback;
            if (!playback) return;

            debugLog('always', '❌ Ошибка плеера', {
                источник: playback.candidate ? playback.candidate.sourceName : 'Нет данных',
                озвучка: playback.candidate ? playback.candidate.voiceName : 'Нет данных',
                качество: playback.candidate ? playback.candidate.quality + 'p' : 'Нет данных',
                readyAt: playback.readyAt ? 'да' : 'нет'
            });

            if (playback.readyAt && Date.now() - playback.readyAt > getConfirmTimeoutMs()) {
                clearPlayback(playback);
                return;
            }

            try { if (Lampa.Player.close) Lampa.Player.close(); } catch (e) {}

            failPlayback(playback, 'player-error');
        });

        Lampa.Player.listener.follow('ended', function() {
            if (runtime.playback) {
                debugLog('always', '🏁 Воспроизведение завершено');
                clearPlayback(runtime.playback);
            }
        });

        return true;
    }

    // ============================================================
    // SMART ACTIVITY
    // ============================================================

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

    // ============================================================
    // UI: HEAD BUTTON
    // ============================================================

    function addHeadButton() {
        if (runtime.headButtonReady) return;
        runtime.headButtonReady = true;

        var button = $('<div class="head__action selector lampac-smart-manual" style="display:none;"><span style="font-size:1.05em;font-weight:700;">MAN</span></div>');

        button.on('hover:enter', function() {
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

        Lampa.Listener.follow('activity', function(e) {
            if (!e || e.type !== 'start') return;

            setTimeout(function() {
                var active = Lampa.Activity.active();
                if (active && active.component === smartComponentName())
                    button.show();
                else
                    button.hide();
            }, 0);
        });
    }

    // ============================================================
    // UI: FULL BUTTON
    // ============================================================

    function addFullButton() {
        if (runtime.fullHookReady) return;
        runtime.fullHookReady = true;

        function buildButton(movie) {
            var btn = $(
                '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button" style="display:flex !important; opacity:1 !important; visibility:visible !important;" data-subtitle="' + Lampa.Lang.translate('lampac_smart_descr') + '">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                '</svg>' +
                '<span>' + Lampa.Lang.translate('lampac_smart_watch') + '</span>' +
                '</div>'
            );

            btn.on('hover:enter', function() {
                debugLog('always', '🔘 Нажата кнопка Smart Online для: ' + (movie.title || movie.name));
                Lampa.Activity.push(smartActivity(movie));
            });

            return btn;
        }

        function addButtonToCard(data) {
            if (!data || !data.render || !data.render.length || !data.movie) return;

            var render = data.render;

            render.find('.lampac-smart-button').remove();

            var buttonsContainer = render.find('.full-start__buttons, .full-start-new__buttons, [class*="buttons-container"]').eq(0);

            if (!buttonsContainer.length) {
                buttonsContainer = render.find('.buttons--container').eq(0);
            }

            if (!buttonsContainer.length) {
                buttonsContainer = $('<div class="full-start__buttons" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;"></div>');
                render.append(buttonsContainer);
            }

            var btn = buildButton(data.movie);
            buttonsContainer.append(btn);

            btn.css({
                'display': 'flex !important',
                'opacity': '1 !important',
                'visibility': 'visible !important'
            });

            buttonsContainer.css('display', 'flex');
        }

        function injectFromActive() {
            try {
                var active = Lampa.Activity.active();
                if (!active || active.component !== 'full' || !active.activity || !active.activity.render) return;

                var render = active.activity.render();
                var movie = active.card;

                if (!movie) return;

                render.find('.lampac-smart-button').remove();

                addButtonToCard({
                    render: render,
                    movie: movie
                });
            } catch (e) {
                console.warn('[SmartOnline] Ошибка внедрения кнопки:', e);
            }
        }

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                render.find('.lampac-smart-button').remove();

                setTimeout(function() {
                    addButtonToCard({
                        render: render,
                        movie: e.data.movie
                    });
                }, 100);
            }
        });

        Lampa.Listener.follow('activity', function(e) {
            if (e && e.type === 'start') {
                setTimeout(function() {
                    injectFromActive();
                }, 200);
            }
        });

        setTimeout(injectFromActive, 500);

        runtime.fullTicker = setInterval(function() {
            var active = Lampa.Activity.active();
            if (active && active.component === 'full' && active.activity && active.activity.render) {
                var render = active.activity.render();
                if (render.find('.lampac-smart-button').length === 0 && active.card) {
                    addButtonToCard({
                        render: render,
                        movie: active.card
                    });
                }
            }
        }, 3000);
    }

    // ============================================================
    // LANG
    // ============================================================

    function addLang() {
        Lampa.Lang.add({
            lampac_smart_watch: { ru: 'Smart Online', en: 'Smart Online', uk: 'Smart Online' },
            lampac_smart_descr: { ru: 'Автовыбор потока', en: 'Auto stream select', uk: 'Автовибор потоку' },
            lampac_smart_retrying: { ru: 'Поток не запустился, пробую следующий', en: 'Stream failed, trying next', uk: 'Потік не запустився, пробую наступний' },
            lampac_smart_manual_needed: { ru: 'Автовыбор не сработал, перейдите в ручной режим', en: 'Autoselect failed, switch to MAN', uk: 'Автовибір не спрацював, перейдіть у ручний режим' },
            lampac_smart_manual: { ru: 'Ручной режим', en: 'Manual mode', uk: 'Ручний режим' },
            lampac_smart_settings_title: { ru: 'Настройки Smart Online', en: 'Smart Online settings', uk: 'Налаштування Smart Online' },
            lampac_smart_settings_noty: { ru: 'Показывать служебные уведомления', en: 'Runtime notifications', uk: 'Показувати службові сповіщення' },
            lampac_smart_settings_fail_timeout: { ru: 'Таймаут неудачного старта (сек.)', en: 'Fail timeout (sec)', uk: 'Таймаут невдалого старту (сек.)' },
            lampac_smart_settings_confirm_timeout: { ru: 'Таймаут подтверждения (сек.)', en: 'Confirm timeout (sec)', uk: 'Таймаут підтвердження (сек.)' },
            lampac_smart_settings_scope: { ru: 'Профиль статистики', en: 'Stats profile', uk: 'Профіль статистики' },
            lampac_smart_settings_clear_stats: { ru: 'Очистить статистику Smart', en: 'Reset Smart stats', uk: 'Очистити статистику Smart' },
            lampac_smart_settings_cleared: { ru: 'Статистика Smart очищена', en: 'Smart stats reset', uk: 'Статистику Smart очищено' }
        });
    }

    // ============================================================
    // SETTINGS
    // ============================================================

    function registerSettings() {
        if (runtime.settingsReady) return true;
        if (!window.Lampa || !Lampa.SettingsApi) return false;

        runtime.settingsReady = true;

        Lampa.SettingsApi.addComponent({
            component: 'smart_online',
            name: 'Смарт Online',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 2L4 14H10L8.5 22L18 10H12L13.5 2Z" fill="white"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'smart_online',
            param: { type: 'title' },
            field: { name: Lampa.Lang.translate('lampac_smart_settings_title') }
        });

        Lampa.SettingsApi.addParam({
            component: 'smart_online',
            param: { name: CFG_NOTIFY_RUNTIME, type: 'trigger', "default": false },
            field: { name: Lampa.Lang.translate('lampac_smart_settings_noty') }
        });

        Lampa.SettingsApi.addParam({
            component: 'smart_online',
            param: {
                name: CFG_TIMEOUT_FAIL,
                type: 'select',
                values: { '8': '8', '12': '12', '16': '16', '20': '20' },
                "default": '12'
            },
            field: { name: Lampa.Lang.translate('lampac_smart_settings_fail_timeout') }
        });

        Lampa.SettingsApi.addParam({
            component: 'smart_online',
            param: {
                name: CFG_TIMEOUT_CONFIRM,
                type: 'select',
                values: { '10': '10', '15': '15', '20': '20', '25': '25' },
                "default": '15'
            },
            field: { name: Lampa.Lang.translate('lampac_smart_settings_confirm_timeout') }
        });

        Lampa.SettingsApi.addParam({
            component: 'smart_online',
            param: {
                name: CFG_STATS_SCOPE,
                type: 'select',
                values: {
                    media: 'По типу контента',
                    global: 'Глобальный'
                },
                "default": 'media'
            },
            field: { name: Lampa.Lang.translate('lampac_smart_settings_scope') }
        });

        Lampa.SettingsApi.addParam({
            component: 'smart_online',
            param: { type: 'button' },
            field: { name: Lampa.Lang.translate('lampac_smart_settings_clear_stats') },
            onChange: function onChange() {
                Lampa.Storage.set(STATS_KEY, { sources: {}, voices: {} });
                notify(Lampa.Lang.translate('lampac_smart_settings_cleared'));
                debugLog('always', '🗑 Статистика очищена');
            }
        });

        return true;
    }

    // ============================================================
    // MANIFEST
    // ============================================================

    function registerManifest() {
        if (!window.Lampa || !Lampa.Manifest) return false;

        runtime.manifestReady = true;
        window.smartonline_plugin = true;

        var manifest = {
            type: 'video',
            version: SMART_MANIFEST_VERSION,
            name: 'Smart Online',
            description: 'Автовыбор потока',
            apn: '',
            component: smartComponentName(),
            onContextMenu: function onContextMenu() {
                return {
                    name: Lampa.Lang.translate('lampac_smart_watch'),
                    description: ''
                };
            },
            onContextLauch: function onContextLauch(object) {
                var smartReady = !!(Lampa.Component && Lampa.Component.get && Lampa.Component.get(smartComponentName()));
                if (!smartReady) smartReady = installComponent();

                if (smartReady) {
                    Lampa.Activity.push(smartActivity(object));
                    return;
                }

                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('title_online') || 'Online',
                    component: baseComponentName(),
                    search: object.title,
                    search_one: object.title,
                    search_two: object.original_title,
                    movie: object,
                    page: 1
                });
            }
        };

        var plugins = Lampa.Manifest.plugins;
        if (Array.isArray(plugins)) {
            var replaced = false;
            for (var i = 0; i < plugins.length; i++) {
                var p = plugins[i];
                if (!p) continue;
                if (p.name === 'Smart Online' || p.name === 'Smart Онлайн' || p.component === smartComponentName()) {
                    if (p.name === manifest.name && p.component === manifest.component && String(p.version || '') === String(manifest.version || '') && p.description === manifest.description)
                        return true;
                    plugins[i] = manifest;
                    replaced = true;
                    break;
                }
            }
            if (!replaced) plugins.push(manifest);
        } else if (plugins && typeof plugins === 'object') {
            if (plugins.name === 'Smart Online' || plugins.name === 'Smart Онлайн' || plugins.component === smartComponentName()) {
                if (plugins.name !== manifest.name || plugins.component !== manifest.component || String(plugins.version || '') !== String(manifest.version || '') || plugins.description !== manifest.description)
                    Lampa.Manifest.plugins = manifest;
            } else
                Lampa.Manifest.plugins = [plugins, manifest];
        } else {
            Lampa.Manifest.plugins = manifest;
        }
        return true;
    }

    function scheduleManifestSync() {
        if (runtime.manifestTimer) return;

        runtime.manifestSyncCount = 0;
        runtime.manifestTimer = setInterval(function() {
            runtime.manifestSyncCount++;
            registerManifest();

            if (runtime.manifestSyncCount >= MANIFEST_SYNC_LIMIT) {
                clearInterval(runtime.manifestTimer);
                runtime.manifestTimer = null;
            }
        }, 2000);
    }

    // ============================================================
    // COMPONENT
    // ============================================================

    function installComponent() {
        if (runtime.componentReady) return true;
        if (!Lampa.Component || !Lampa.Component.get) return false;

        var BaseLampac = Lampa.Component.get(baseComponentName());
        if (!BaseLampac) return false;

        runtime.componentReady = true;

        function SmartLampac(object) {
            BaseLampac.call(this, object);

            var self = this;
            var baseParse = this.parse;
            var state = {
                manualMode: false,
                autoStarted: false,
                autoTimer: null,
                queue: [],
                queueIndex: -1,
                currentCandidate: null,
                lastVoiceUrl: '',
                sourceName: '',
                voiceQueue: [],
                voiceIndex: -1,
                voiceSignature: '',
                statsContext: {
                    mediaType: object.movie && object.movie.number_of_seasons ? 'tv' : 'movie',
                    sourceKey: ''
                }
            };

            debugLog('always', '📦 Компонент Smart инициализирован для: ' + (object.movie.title || object.movie.name));

            function stopAuto() {
                clearTimeout(state.autoTimer);
                state.autoTimer = null;
            }

            function enableManual() {
                debugLog('always', '🔄 Включен ручной режим');
                state.manualMode = true;
                stopAuto();
                if (runtime.playback && runtime.playback.state === state) clearPlayback(runtime.playback);
                notifyRuntime(Lampa.Lang.translate('lampac_smart_manual'));
            }

            function syncVoiceQueue(parsed) {
                if (!parsed || !parsed.buttons || !parsed.buttons.length) return;

                state.statsContext = state.statsContext || {
                    mediaType: object.movie && object.movie.number_of_seasons ? 'tv' : 'movie',
                    sourceKey: keyify(state.sourceName || '')
                };

                var queue = rankVoices(parsed.buttons, state.sourceName, state.statsContext);
                var signature = queue.map(function(voice) { return voice.url; }).join('|');

                if (signature !== state.voiceSignature) {
                    state.voiceQueue = queue;
                    state.voiceSignature = signature;
                    var currentIndex = -1;
                    if (state.lastVoiceUrl) {
                        for (var i = 0; i < queue.length; i++) {
                            if (queue[i].url === state.lastVoiceUrl) {
                                currentIndex = i;
                                break;
                            }
                        }
                    }
                    state.voiceIndex = currentIndex >= 0 ? currentIndex : 0;
                } else if (state.voiceIndex < 0) {
                    state.voiceIndex = 0;
                }
            }

            function tryVoiceByIndex(index) {
                var candidate = state.voiceQueue[index];
                if (!candidate || !candidate.url) return false;

                state.voiceIndex = index;

                if (candidate.active) {
                    state.autoStarted = false;
                    state.queue = [];
                    state.queueIndex = -1;
                    state.currentCandidate = null;
                    state.lastVoiceUrl = candidate.url;
                    self.replaceChoice({
                        voice: candidate.index,
                        voice_name: candidate.title,
                        voice_url: candidate.url
                    });
                    return false;
                }

                if (state.lastVoiceUrl === candidate.url) return false;

                state.lastVoiceUrl = candidate.url;
                state.autoStarted = false;
                state.queue = [];
                state.queueIndex = -1;
                state.currentCandidate = null;
                self.replaceChoice({
                    voice: candidate.index,
                    voice_name: candidate.title,
                    voice_url: candidate.url
                });
                self.request(candidate.url);
                return true;
            }

            state.tryNextVoice = function() {
                if (!state.voiceQueue.length) return false;

                var nextIndex = state.voiceIndex + 1;
                if (nextIndex >= state.voiceQueue.length) return false;

                return tryVoiceByIndex(nextIndex);
            };

            function inspect(str) {
                var json = Lampa.Arrays.decodeJson(str, {});
                if (Lampa.Arrays.isObject(str) && str.rch) return { rch: true };
                if (json.rch) return { rch: true };

                try {
                    var items = self.parseJsonDate(str, '.videos__item');
                    var buttons = self.parseJsonDate(str, '.videos__button');

                    return {
                        items: items,
                        buttons: buttons,
                        videos: items.filter(function(item) {
                            return item.method === 'play' || item.method === 'call';
                        })
                    };
                } catch (e) {
                    return null;
                }
            }

            function maybeSwitchVoice(parsed) {
                if (!parsed || !parsed.buttons || !parsed.buttons.length || state.manualMode) return false;

                state.sourceName = getActiveSource();
                state.statsContext = state.statsContext || {
                    mediaType: object.movie && object.movie.number_of_seasons ? 'tv' : 'movie',
                    sourceKey: ''
                };
                state.statsContext.sourceKey = keyify(state.sourceName || '');
                syncVoiceQueue(parsed);

                var best = bestVoice(parsed.buttons, state.sourceName, state.statsContext);
                if (!best || !best.url) return false;

                if (state.voiceIndex < 0) state.voiceIndex = 0;

                return tryVoiceByIndex(state.voiceIndex);
            }

            function maybeAutoplay(parsed) {
                if (!parsed || !parsed.videos || !parsed.videos.length) return;
                if (state.manualMode || state.autoStarted) return;
                if (object.movie && object.movie.name) return;

                debugLog('always', '🚀 Запущен автовыбор');
                debugLog('queueBuilding', '📊 Доступно видео: ' + parsed.videos.length);

                stopAuto();
                state.sourceName = getActiveSource();

                state.autoTimer = setTimeout(function() {
                    if (state.manualMode || state.autoStarted) return;

                    state.autoStarted = false;
                    state.currentCandidate = null;
                    state.statsContext = state.statsContext || {
                        mediaType: object.movie && object.movie.number_of_seasons ? 'tv' : 'movie',
                        sourceKey: ''
                    };
                    state.statsContext.sourceKey = keyify(state.sourceName || '');

                    buildQueue(parsed.videos, state.sourceName, self.getChoice().voice_name || '', state.statsContext)
                        .then(function(queue) {
                            state.queue = queue;
                            state.queueIndex = -1;

                            if (!state.queue.length) {
                                debugLog('always', '❌ Нет кандидатов в очереди, нужен ручной режим');
                                return;
                            }

                            debugLog('always', '📊 Очередь построена, кандидатов: ' + state.queue.length);
                            playNextCandidate(self, state, 'autostart');
                        });
                }, 150);
            }

            this._lampacSmart = {
                enableManual: enableManual
            };

            this.parse = function(str) {
                var parsed = inspect(str);

                if (parsed && maybeSwitchVoice(parsed)) return;

                var result = baseParse.call(this, str);
                if (parsed && parsed.videos && parsed.videos.length) maybeAutoplay(parsed);
                return result;
            };
        }

        SmartLampac.prototype = Object.create(BaseLampac.prototype);
        SmartLampac.prototype.constructor = SmartLampac;

        Lampa.Component.add(smartComponentName(), SmartLampac);
        debugLog('always', '✅ Компонент Smart установлен: ' + smartComponentName());

        return true;
    }

    // ============================================================
    // BOOT
    // ============================================================

    function ensureRuntime() {
        var tries = 0;
        var timer = setInterval(function() {
            tries++;

            var playerReady = installPlayerHooks();
            var componentReady = installComponent();
            var manifestReady = registerManifest();
            var settingsReady = registerSettings();

            if (!componentReady && !runtime.loadingBase) {
                ensureBaseOnline(function() {});
            }

            if (componentReady && manifestReady && settingsReady && (playerReady || tries >= WAIT_MAX_TRIES)) {
                clearInterval(timer);
                debugLog('always', '✅ Runtime готов после ' + tries + ' попыток');
            } else if (tries >= WAIT_MAX_TRIES * 2) {
                clearInterval(timer);
                debugLog('always', '❌ Таймаут инициализации Runtime');
            }
        }, WAIT_INTERVAL_MS);
    }

    function buildOnlineScriptUrl() {
        var token = '';
        var localhost = 'http://lampaua.mooo.com';

        if (token) return localhost + '/online/js/' + token;
        return localhost + '/online.js';
    }

    function loadScript(url, done) {
        var script = document.createElement('script');
        script.src = url;
        script.async = true;

        script.onload = function() {
            if (done) done(true);
        };

        script.onerror = function() {
            if (done) done(false);
        };

        document.head.appendChild(script);
    }

    function ensureBaseOnline(done) {
        if (window.lampac_plugin) {
            done(true);
            return;
        }

        if (runtime.loadingBase) {
            var wait = 0;
            var timer = setInterval(function() {
                wait++;
                if (window.lampac_plugin) {
                    clearInterval(timer);
                    done(true);
                } else if (wait >= WAIT_MAX_TRIES) {
                    clearInterval(timer);
                    done(false);
                }
            }, WAIT_INTERVAL_MS);
            return;
        }

        runtime.loadingBase = true;
        loadScript(buildOnlineScriptUrl(), function(ok) {
            runtime.loadingBase = false;
            done(ok && !!window.lampac_plugin);
        });
    }

    function start() {
        if (runtime.started) return;

        runtime.started = true;
        window.smartonline_started = true;
        window.smartonline_plugin = true;

        debugLog('always', '🚀 Плагин Smart Online запускается...');
        debugLog('always', '📊 Настройки отладки:', {
            enabled: DEBUG.enabled,
            console: DEBUG.console,
            qualityDetection: DEBUG.qualityDetection,
            queueBuilding: DEBUG.queueBuilding,
            scoreCalculation: DEBUG.scoreCalculation,
            selection: DEBUG.selection,
            streamAnalysis: DEBUG.streamAnalysis
        });

        addLang();
        registerSettings();
        installPlayerHooks();
        installComponent();
        registerManifest();
        addFullButton();
        addHeadButton();
        ensureRuntime();
        scheduleManifestSync();

        debugLog('always', '✅ Плагин Smart Online запущен');
    }

    function waitLampac() {
        if (runtime.waitStarted) return;

        runtime.waitStarted = true;
        var tries = 0;
        var timer = setInterval(function() {
            tries++;

            if (window.Lampa) {
                clearInterval(timer);
                runtime.waitStarted = false;
                ensureBaseOnline(function(ok) {
                    start();

                    if (!ok && shouldNotifyRuntime())
                        notifyOnce(FAIL_NOTIFY_KEY, 'Смарт Online: не удалось загрузить базовый online-плагин');
                });
            } else if (tries >= WAIT_MAX_TRIES) {
                clearInterval(timer);
                runtime.waitStarted = false;
                debugLog('always', '❌ Lampa не найдена после ' + tries + ' попыток');
            }
        }, WAIT_INTERVAL_MS);
    }

    waitLampac();

    if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') waitLampac();
        });
    }

})();
