(function () {
    'use strict';

    if (window.best_balanser_plugin_loaded) return;
    window.best_balanser_plugin_loaded = true;

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

    function isDubVoice(name) {
        var text = String(name || '').toLowerCase();
        return text.indexOf('dub') !== -1 || text.indexOf('дубляж') !== -1 || text.indexOf('дублированный') !== -1;
    }

    // ============================================================
    // ПОЛУЧЕНИЕ ВСЕХ БАЛАНСЕРОВ ИЗ LAMPA
    // ============================================================

    function getAllBalansers(callback) {
        // Получаем все синхронизированные балансеры
        var allBalansers = [];
        var syncKeys = Lampa.Storage.syncKeys ? Lampa.Storage.syncKeys() : [];

        // Ищем ключи с online_choice_
        syncKeys.forEach(function(key) {
            if (key.indexOf('online_choice_') === 0) {
                var name = key.replace('online_choice_', '');
                if (name && allBalansers.indexOf(name) === -1) {
                    allBalansers.push(name);
                }
            }
        });

        // Добавляем основные балансеры, если их нет
        var mainBalansers = ['phantom', 'fxapi', 'filmix', 'alloha', 'kinopub', 'rezka', 'kodik'];
        mainBalansers.forEach(function(name) {
            if (allBalansers.indexOf(name) === -1) {
                allBalansers.push(name);
            }
        });

        // Получаем из хранилища
        var activeBalanser = Lampa.Storage.get('active_balanser', '');
        var onlineBalanser = Lampa.Storage.get('online_balanser', '');

        if (activeBalanser && allBalansers.indexOf(activeBalanser) === -1) {
            allBalansers.push(activeBalanser);
        }
        if (onlineBalanser && onlineBalanser !== activeBalanser && allBalansers.indexOf(onlineBalanser) === -1) {
            allBalansers.push(onlineBalanser);
        }

        callback(allBalansers);
    }

    // ============================================================
    // АВТОВЫБОР ЛУЧШЕГО БАЛАНСЕРА
    // ============================================================

    function findBestBalanser(movie) {
        getAllBalansers(function(balansers) {
            if (!balansers || balansers.length === 0) {
                Lampa.Noty.show('❌ Нет доступных балансеров');
                return;
            }

            console.log('🔍 Поиск лучшего балансера для:', movie.title || movie.name);
            console.log('📋 Все балансеры:', balansers);

            var logLines = [];
            logLines.push('═══════════════════════════════════════════════════════════');
            logLines.push('🔍 ПОИСК ЛУЧШЕГО БАЛАНСЕРА ДЛЯ: ' + (movie.title || movie.name));
            logLines.push('📋 Балансеров: ' + balansers.length + ' (' + balansers.join(', ') + ')');
            logLines.push('═══════════════════════════════════════════════════════════');

            // Если балансеров много, показываем меню для выбора
            if (balansers.length > 1) {
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
                return;
            }

            // Если только один балансер - просто открываем
            var balanser = balansers[0];
            logLines.push('📌 Используется балансер: ' + balanser);
            logLines.push('═══════════════════════════════════════════════════════════');
            console.log(logLines.join('\n'));

            switchToBalanser(balanser, movie);
        });
    }

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ НА БАЛАНСЕР
    // ============================================================

    function switchToBalanser(sourceName, movie) {
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
            Lampa.Noty.show('🔊 Переключено на: ' + sourceName);
        }
    }

    // ============================================================
    // ДОБАВЛЕНИЕ КНОПКИ "ВЫБРАТЬ БАЛАНСЕР"
    // ============================================================

    function addBalanserButton() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (!render || !movie) return;
                if (render.find('.lampac-balanser-button').length > 0) return;

                var btn = $(
                    '<div class="full-start__button full-start-new__button selector view--online lampac-balanser-button" style="display:flex !important; opacity:1 !important; visibility:visible !important; background: rgba(33, 150, 243, 0.12) !important; border: 1px solid #2196F3 !important;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2196F3" style="width:24px;height:24px;">' +
                    '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' +
                    '</svg>' +
                    '<span style="color: #2196F3;">📺 Выбрать балансер</span>' +
                    '</div>'
                );

                btn.on('hover:enter', function() {
                    findBestBalanser(movie);
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
    // ЗАПУСК
    // ============================================================

    function init() {
        console.log('🚀 Плагин "Выбор балансера" загружен');
        addBalanserButton();
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