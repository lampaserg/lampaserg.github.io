(function () {
    'use strict';

    if (window.smartonline_plugin_v2) return;
    window.smartonline_plugin_v2 = true;

    // ============================================================
    // ПРИОРИТЕТЫ
    // ============================================================

    var TARGET_VOICE = 'dub';

    // ============================================================
    // ОПРЕДЕЛЕНИЕ КАЧЕСТВА
    // ============================================================

    function detectQuality(value) {
        var text = String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (!text) return 0;

        if (/(2160|4k|uhd|ultra[\s-]?hd|3840)/i.test(text)) return 2160;
        if (/(1080|full[\s-]?hd|fhd|1920)/i.test(text)) return 1080;
        if (/(720|hd[\s-]?ready|1280)/i.test(text)) return 720;
        if (/(480|sd|640|854)/i.test(text)) return 480;

        return 0;
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

    function isTargetVoice(name) {
        var text = String(name || '').toLowerCase();
        return text.indexOf('dub') !== -1 || text.indexOf('дубляж') !== -1;
    }

    function getVoiceScore(name) {
        var text = String(name || '').toLowerCase();
        if (text.indexOf('dub') !== -1 || text.indexOf('дубляж') !== -1) return 1000;
        if (text.indexOf('hdrezka') !== -1) return 100;
        if (text.indexOf('lostfilm') !== -1) return 80;
        if (text.indexOf('cube') !== -1) return 70;
        if (text.indexOf('sub') !== -1 || text.indexOf('subtitles') !== -1) return -50;
        return 0;
    }

    function sortVoicesByPriority(buttons) {
        if (!buttons || !buttons.length) return buttons;
        return buttons.slice().sort(function(a, b) {
            return getVoiceScore(b.text || '') - getVoiceScore(a.text || '');
        });
    }

    // ============================================================
    // ПОЛУЧЕНИЕ СПИСКА БАЛАНСЕРОВ ИЗ LAMPA
    // ============================================================

    function getBalansersFromLampa() {
        var sources = [];
        var activeBalanser = Lampa.Storage.get('active_balanser', '');
        var onlineBalanser = Lampa.Storage.get('online_balanser', '');

        if (activeBalanser) sources.push(activeBalanser);
        if (onlineBalanser && onlineBalanser !== activeBalanser) sources.push(onlineBalanser);

        // Если источников нет - добавляем приоритетные
        if (sources.length === 0) {
            sources = ['phantom', 'fxapi', 'alloha', 'kinopub'];
        }

        // Убираем дубликаты
        var unique = [];
        sources.forEach(function(s) {
            var lower = s.toLowerCase();
            if (!unique.some(function(u) { return u.toLowerCase() === lower; })) {
                unique.push(s);
            }
        });

        return unique;
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ НА БАЛАНСЕР
    // ============================================================

    function switchToBalanser(sourceName, movie) {
        if (!sourceName) return;

        Lampa.Storage.set('active_balanser', sourceName);
        Lampa.Storage.set('online_balanser', sourceName);

        if (movie && movie.id) {
            var lastSelect = Lampa.Storage.cache('online_last_balanser', 3000, {});
            lastSelect[movie.id] = sourceName;
            Lampa.Storage.set('online_last_balanser', lastSelect);
        }

        // Открываем онлайн с новым балансером
        Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_online'),
            component: 'lampac',
            search: movie.title,
            search_one: movie.title,
            search_two: movie.original_title,
            movie: movie,
            page: 1,
            balanser: sourceName
        });

        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('🔊 ' + sourceName);
        }
    }

    // ============================================================
    // ПОКАЗ СПИСКА БАЛАНСЕРОВ (ДЛЯ РУЧНОГО ВЫБОРА)
    // ============================================================

    function showBalansersMenu(movie) {
        var balansers = getBalansersFromLampa();

        if (balansers.length === 0) {
            Lampa.Noty.show('❌ Нет доступных балансеров');
            return;
        }

        var items = balansers.map(function(b) {
            return {
                title: b.charAt(0).toUpperCase() + b.slice(1),
                value: b
            };
        });

        Lampa.Select.show({
            title: 'Выберите балансер',
            items: items,
            onSelect: function(item) {
                switchToBalanser(item.value, movie);
            },
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    }

    // ============================================================
    // КНОПКА В КАРТОЧКЕ
    // ============================================================

    function addSmartButton() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-smart-button').length > 0) return;

                var isSerial = !!(movie && movie.name);
                var label = isSerial ? '📺 Выбрать балансер' : '🎬 Smart Online';

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-smart-button" style="display:flex !important; opacity:1 !important; visibility:visible !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">' +
                    '<path d="M13.5 2 4 14h6l-1.5 8L18 10h-6l1.5-8Z"></path>' +
                    '</svg>' +
                    '<span>' + label + '</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    var isSerial = !!(movie && movie.name);

                    if (isSerial) {
                        // Сериал - показываем список балансеров
                        showBalansersMenu(movie);
                    } else {
                        // Фильм - открываем Smart Online с сортировкой
                        Lampa.Activity.push({
                            url: '',
                            title: Lampa.Lang.translate('lampac_smart_watch'),
                            component: smartComponentName(),
                            search: movie.title,
                            search_one: movie.title,
                            search_two: movie.original_title,
                            movie: movie,
                            page: 1
                        });
                    }
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
    // SMART COMPONENT (ДЛЯ ФИЛЬМОВ)
    // ============================================================

    function smartComponentName() {
        return 'lampac_smart';
    }

    function installSmartComponent() {
        if (Lampa.Component.get(smartComponentName())) return true;

        var BaseLampac = Lampa.Component.get('lampac');
        if (!BaseLampac) return false;

        function SmartLampac(object) {
            BaseLampac.call(this, object);

            var self = this;
            var baseParse = this.parse;
            var isSerial = !!(object.movie && object.movie.name);

            this.parse = function(str) {
                // Парсим ответ
                try {
                    var $html = $('<div>' + str + '</div>');
                    var buttons = [];

                    $html.find('.videos__button').each(function() {
                        var $item = $(this);
                        try {
                            var data = JSON.parse($item.attr('data-json'));
                            var text = $item.text().trim();
                            data.text = text;
                            buttons.push(data);
                        } catch (e) {}
                    });

                    // Для фильмов - сортируем озвучки (дубляж в приоритете)
                    if (!isSerial && buttons && buttons.length > 0) {
                        buttons = sortVoicesByPriority(buttons);
                        // Перестраиваем HTML с отсортированными кнопками
                        var newHtml = $('<div></div>');
                        buttons.forEach(function(btn) {
                            var html = '<div class="videos__button selector" data-json=\'' + JSON.stringify(btn) + '\'>' + btn.text + '</div>';
                            newHtml.append(html);
                        });
                        // Заменяем старые кнопки
                        $html.find('.videos__button').remove();
                        $html.find('.videos__buttons').append(newHtml.html());
                        str = $html.html();
                    }
                } catch (e) {}

                return baseParse.call(this, str);
            };
        }

        SmartLampac.prototype = Object.create(BaseLampac.prototype);
        SmartLampac.prototype.constructor = SmartLampac;

        Lampa.Component.add(smartComponentName(), SmartLampac);
        return true;
    }

    // ============================================================
    // ЗАПУСК
    // ============================================================

    function init() {
        console.log('🚀 SmartOnline загружен');
        installSmartComponent();
        addSmartButton();
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