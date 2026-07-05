/**
 * Перехват сезонов и переводов
 * Версия: 1.0.0
 */

(function() {
    'use strict';

    if (window.osm_data_hook_loaded) return;
    window.osm_data_hook_loaded = true;

    var DEBUG = true;

    function log() {
        if (!DEBUG) return;
        console.log.apply(console, ['[OSM Hook]'].concat(Array.prototype.slice.call(arguments)));
    }

    function logError() {
        console.error.apply(console, ['[OSM Hook ERROR]'].concat(Array.prototype.slice.call(arguments)));
    }

    // Глобальные переменные для доступа к данным
    window._osm_data = {
        seasons: [],
        voices: [],
        videos: [],
        sources: [],
        currentSeason: 0,
        currentVoice: ''
    };

    // ============================================================
    // 1. Перехват parse (основной)
    // ============================================================
    function hookParse() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) {
            log('Компонент lampac не найден');
            return;
        }

        var proto = Lampac.prototype;
        if (typeof proto.parse === 'function' && !proto._osm_parse_hooked) {
            proto._osm_parse_hooked = true;
            var originalParse = proto.parse;

            proto.parse = function(str) {
                var result = originalParse.call(this, str);

                try {
                    var $html = $('<div>' + str + '</div>');

                    // === Перехват сезонов ===
                    var seasonItems = $html.find('.videos__item[method="link"]');
                    if (seasonItems.length > 0) {
                        var seasons = [];
                        seasonItems.each(function() {
                            var $item = $(this);
                            try {
                                var data = JSON.parse($item.attr('data-json'));
                                var text = $item.text().trim();
                                var seasonNum = parseInt($item.attr('s')) || 0;
                                seasons.push({
                                    num: seasonNum,
                                    text: text,
                                    url: data.url
                                });
                            } catch(e) {}
                        });
                        if (seasons.length > 0) {
                            window._osm_data.seasons = seasons;
                            log('Перехвачены сезоны:', seasons.map(function(s) { return s.num; }).join(', '));
                        }
                    }

                    // === Перехват переводов ===
                    var voiceButtons = $html.find('.videos__button');
                    if (voiceButtons.length > 0) {
                        var voices = [];
                        voiceButtons.each(function() {
                            var $item = $(this);
                            try {
                                var data = JSON.parse($item.attr('data-json'));
                                var text = $item.text().trim();
                                var isActive = $item.hasClass('active');
                                voices.push({
                                    text: text,
                                    url: data.url,
                                    active: isActive
                                });
                                if (isActive) {
                                    window._osm_data.currentVoice = text;
                                }
                            } catch(e) {}
                        });
                        if (voices.length > 0) {
                            window._osm_data.voices = voices;
                            log('Перехвачены переводы:', voices.map(function(v) { return v.text + (v.active ? ' [A]' : ''); }).join(', '));
                        }
                    }

                    // === Перехват видео ===
                    var videoItems = $html.find('.videos__item[method="play"]');
                    if (videoItems.length > 0) {
                        var videos = [];
                        videoItems.each(function() {
                            var $item = $(this);
                            try {
                                var data = JSON.parse($item.attr('data-json'));
                                var text = $item.text().trim();
                                var season = parseInt($item.attr('s')) || 0;
                                var episode = parseInt($item.attr('e')) || 0;
                                videos.push({
                                    text: text,
                                    url: data.url,
                                    season: season,
                                    episode: episode,
                                    voice_name: data.voice_name || ''
                                });
                            } catch(e) {}
                        });
                        if (videos.length > 0) {
                            window._osm_data.videos = videos;
                            log('Перехвачено видео:', videos.length + ' шт.');
                        }
                    }

                    // === Перехват выбранного сезона ===
                    var choice = this.getChoice ? this.getChoice() : {};
                    if (choice && typeof choice.season !== 'undefined') {
                        var seasonIdx = choice.season || 0;
                        if (window._osm_data.seasons[seasonIdx]) {
                            window._osm_data.currentSeason = window._osm_data.seasons[seasonIdx].num;
                            log('Текущий сезон:', window._osm_data.currentSeason);
                        }
                    }

                } catch(e) {
                    logError('Ошибка перехвата:', e);
                }

                return result;
            };
            log('parse перехвачен');
        }
    }

    // ============================================================
    // 2. Перехват changeBalanser (смена источника)
    // ============================================================
    function hookChangeBalanser() {
        var Lampac = Lampa.Component.get('lampac');
        if (!Lampac) return;

        var proto = Lampac.prototype;
        if (typeof proto.changeBalanser === 'function' && !proto._osm_change_hooked) {
            proto._osm_change_hooked = true;
            var originalChange = proto.changeBalanser;

            proto.changeBalanser = function(balanser_name) {
                log('Смена балансера:', balanser_name);
                
                // Сбрасываем данные при смене источника
                window._osm_data.seasons = [];
                window._osm_data.voices = [];
                window._osm_data.videos = [];
                
                var result = originalChange.call(this, balanser_name);
                return result;
            };
            log('changeBalanser перехвачен');
        }
    }

    // ============================================================
    // 3. Доступ к данным из консоли
    // ============================================================
    window.getOsmData = function() {
        console.log('=== OSM Data ===');
        console.log('Сезоны:', window._osm_data.seasons);
        console.log('Переводы:', window._osm_data.voices);
        console.log('Видео:', window._osm_data.videos);
        console.log('Текущий сезон:', window._osm_data.currentSeason);
        console.log('Текущий перевод:', window._osm_data.currentVoice);
        console.log('Источники:', window._osm_data.sources);
        return window._osm_data;
    };

    // ============================================================
    // 4. Запуск
    // ============================================================
    function init() {
        log('Инициализация...');

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa не готова, ждём...');
            setTimeout(init, 500);
            return;
        }

        hookParse();
        hookChangeBalanser();

        log('========================================');
        log('ГОТОВО!');
        log('Данные доступны через getOsmData()');
        log('========================================');
    }

    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                init();
            }
        });
    } else {
        setTimeout(init, 1000);
    }

})();