(function() {
    'use strict';

    if (window.quality_sorter_plugin) return;
    window.quality_sorter_plugin = true;

    // ============================================================
    // КОНФИГУРАЦИЯ
    // ============================================================

    var CONFIG = {
        host: 'https://ab2024.ru',  // или ваш хост
        sortEnabled: true,          // включить сортировку
        showQualityInLabel: true,   // показывать качество в названии
        preferDub: true             // предпочитать дубляж
    };

    // ============================================================
    // ОПРЕДЕЛЕНИЕ КАЧЕСТВА (скопировано из вашего кода)
    // ============================================================

    function qualityWeight(label) {
        if (label === undefined || label === null) return 0;
        var s = ('' + label).toLowerCase();
        
        // 2160p (4K)
        if (s.indexOf('4k') !== -1 || s.indexOf('uhd') !== -1 || /2160/.test(s)) return 2160;
        // 1080p (Full HD)
        if (s.indexOf('fullhd') !== -1 || s.indexOf('full hd') !== -1 || s.indexOf('fhd') !== -1 || /1080/.test(s)) return 1080;
        // 720p (HD)
        if (s.indexOf('hd') !== -1 && s.indexOf('full') === -1 || /720/.test(s)) return 720;
        // 480p (SD)
        if (s.indexOf('sd') !== -1 || /480/.test(s)) return 480;
        
        // Извлекаем число с p
        var m = s.match(/(\d{3,4})\s*[pр]?/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n >= 480) return n;
        }
        
        return 0;
    }

    function getQualityFromSource(source) {
        var name = source.name || source.title || '';
        var quality = qualityWeight(name);
        
        // Если в названии есть качество в скобках
        var match = name.match(/\((\d{3,4})\s*[pр]\)/);
        if (match) {
            var q = parseInt(match[1], 10);
            if (q > quality) quality = q;
        }
        
        // Проверяем дополнительные поля
        if (source.quality) {
            var q = qualityWeight(source.quality);
            if (q > quality) quality = q;
        }
        
        return quality;
    }

    // ============================================================
    // СОРТИРОВКА ИСТОЧНИКОВ (как в вашем коде)
    // ============================================================

    function sortSourcesByQuality(sources) {
        if (!sources || !sources.length) return sources;
        
        // Создаем копию
        var sorted = sources.slice();
        
        // Сортируем
        sorted.sort(function(a, b) {
            // 1. Активные (show: true) выше
            var aShow = a.show !== undefined ? a.show : true;
            var bShow = b.show !== undefined ? b.show : true;
            if (aShow && !bShow) return -1;
            if (!aShow && bShow) return 1;
            
            // 2. По качеству (от большего к меньшему)
            var aQuality = getQualityFromSource(a);
            var bQuality = getQualityFromSource(b);
            if (aQuality !== bQuality) return bQuality - aQuality;
            
            // 3. По имени (алфавит)
            var aName = (a.name || a.title || '').toLowerCase();
            var bName = (b.name || b.title || '').toLowerCase();
            return aName.localeCompare(bName);
        });
        
        return sorted;
    }

    // ============================================================
    // ДОБАВЛЕНИЕ МЕТКИ КАЧЕСТВА К НАЗВАНИЮ
    // ============================================================

    function addQualityLabel(source) {
        var quality = getQualityFromSource(source);
        if (!quality) return source.name || source.title || '';
        
        var name = source.name || source.title || '';
        
        // Удаляем старую метку качества в скобках
        name = name.replace(/\s*\((\d{3,4})\s*[pр]\)\s*/g, '');
        name = name.replace(/\s*\d{3,4}\s*[pр]\s*/g, '');
        
        // Добавляем новую метку
        return name + ' (' + quality + 'p)';
    }

    // ============================================================
    // ПЕРЕХВАТ КОМПОНЕНТА LAMPAC
    // ============================================================

    function patchLampacComponent() {
        var componentName = 'lampac';
        
        // Проверяем, есть ли компонент
        if (!Lampa.Component || !Lampa.Component.get) {
            console.log('[Quality Sorter] Lampa.Component не найден, ждем...');
            return false;
        }
        
        var BaseComponent = Lampa.Component.get(componentName);
        if (!BaseComponent) {
            console.log('[Quality Sorter] Компонент ' + componentName + ' не найден');
            return false;
        }
        
        console.log('[Quality Sorter] Патчим компонент ' + componentName);
        
        // Создаем новый компонент с сортировкой
        function SortedComponent(object) {
            BaseComponent.call(this, object);
            
            var self = this;
            var originalStartSource = this.startSource;
            
            // Переопределяем startSource для сортировки
            this.startSource = function(json) {
                console.log('[Quality Sorter] Сортируем источники...');
                
                // Сортируем источники
                var sorted = sortSourcesByQuality(json);
                
                // Добавляем метки качества
                if (CONFIG.showQualityInLabel) {
                    sorted.forEach(function(source) {
                        if (source.name) {
                            source.name = addQualityLabel(source);
                        }
                    });
                }
                
                console.log('[Quality Sorter] Отсортировано:', sorted.map(function(s) {
                    return s.name + ' (' + getQualityFromSource(s) + 'p)';
                }).join(', '));
                
                // Вызываем оригинальный метод с отсортированными данными
                return originalStartSource.call(this, sorted);
            };
        }
        
        // Наследуем прототип
        SortedComponent.prototype = Object.create(BaseComponent.prototype);
        SortedComponent.prototype.constructor = SortedComponent;
        
        // Регистрируем новый компонент
        Lampa.Component.add(componentName + '_sorted', SortedComponent);
        
        // Можно заменить оригинальный компонент
        if (CONFIG.sortEnabled) {
            Lampa.Component.add(componentName, SortedComponent);
            console.log('[Quality Sorter] Компонент ' + componentName + ' заменен на сортирующую версию');
        }
        
        return true;
    }

    // ============================================================
    // ПАТЧ ДЛЯ SMART ONLINE
    // ============================================================

    function patchSmartOnline() {
        // Если есть Smart Online, патчим его
        var smartComponent = Lampa.Component.get('lampac_smart');
        if (!smartComponent) {
            // Может быть другое название
            smartComponent = Lampa.Component.get('lampac_smart_online');
        }
        
        if (!smartComponent) {
            console.log('[Quality Sorter] Smart Online не найден');
            return false;
        }
        
        console.log('[Quality Sorter] Патчим Smart Online');
        
        // Сохраняем оригинальный метод
        var original = smartComponent.prototype.startSource || smartComponent.startSource;
        
        if (original) {
            smartComponent.prototype.startSource = function(json) {
                // Сортируем
                var sorted = sortSourcesByQuality(json);
                
                if (CONFIG.showQualityInLabel) {
                    sorted.forEach(function(source) {
                        if (source.name) {
                            source.name = addQualityLabel(source);
                        }
                    });
                }
                
                return original.call(this, sorted);
            };
        }
        
        return true;
    }

    // ============================================================
    // НАСТРОЙКИ
    // ============================================================

    function registerSettings() {
        if (!Lampa.SettingsApi) return;
        
        Lampa.SettingsApi.addComponent({
            component: 'quality_sorter',
            name: 'Сортировка по качеству',
            icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z" fill="white"/></svg>'
        });
        
        Lampa.SettingsApi.addParam({
            component: 'quality_sorter',
            param: {
                name: 'quality_sort_enabled',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Сортировать источники по качеству'
            },
            onChange: function(value) {
                CONFIG.sortEnabled = value;
                Lampa.Noty.show('Сортировка ' + (value ? 'включена' : 'выключена') + '. Перезайдите в фильм.');
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'quality_sorter',
            param: {
                name: 'quality_show_label',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показывать качество в названии'
            },
            onChange: function(value) {
                CONFIG.showQualityInLabel = value;
                Lampa.Noty.show('Метки качества ' + (value ? 'включены' : 'выключены') + '. Перезайдите в фильм.');
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'quality_sorter',
            param: {
                name: 'quality_prefer_dub',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Предпочитать дубляж'
            },
            onChange: function(value) {
                CONFIG.preferDub = value;
            }
        });
    }

    // ============================================================
    // ЗАПУСК
    // ============================================================

    function init() {
        console.log('[Quality Sorter] Инициализация...');
        
        // Регистрируем настройки
        registerSettings();
        
        // Патчим компоненты
        var patched = false;
        
        // Пробуем патчить Lampac
        if (patchLampacComponent()) {
            patched = true;
        }
        
        // Пробуем патчить Smart Online
        if (patchSmartOnline()) {
            patched = true;
        }
        
        if (patched) {
            console.log('[Quality Sorter] Готово!');
            Lampa.Noty.show('Сортировка источников по качеству включена');
        } else {
            console.log('[Quality Sorter] Не удалось найти компоненты для патча');
            
            // Пробуем позже
            setTimeout(init, 3000);
        }
    }

    // ============================================================
    // ОЖИДАНИЕ LAMPA
    // ============================================================

    function waitForLampa() {
        if (window.Lampa && Lampa.Component) {
            init();
        } else {
            setTimeout(waitForLampa, 500);
        }
    }

    // Ждем готовности Lampa
    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                waitForLampa();
            }
        });
    }
    
    waitForLampa();

})();