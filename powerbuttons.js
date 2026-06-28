(function() {
    setTimeout(function() {
        // === 1. УДАЛЯЕМ СТАРЫЕ КНОПКИ ===
        const btnIds = ['RELOAD_BTN', 'CONSOLE_BTN', 'EXIT_BTN', 'CLEARCACHE_BTN'];
        btnIds.forEach(id => $('#' + id).remove());

        // === 2. ДОБАВЛЯЕМ СТИЛИ ===
        if (!document.getElementById('quick-buttons-style')) {
            const css = `
                #RELOAD_BTN svg path { stroke: #4fc3f7 !important; }
                #CONSOLE_BTN svg path { stroke: #ffb74d !important; }
                #EXIT_BTN svg path { fill: #ef5350 !important; }
                #CLEARCACHE_BTN svg path { fill: #66bb6a !important; }
                
                #RELOAD_BTN:hover svg path { stroke: #81d4fa !important; }
                #CONSOLE_BTN:hover svg path { stroke: #ffcc80 !important; }
                #EXIT_BTN:hover svg path { fill: #ef9a9a !important; }
                #CLEARCACHE_BTN:hover svg path { fill: #a5d6a7 !important; }
                
                .quick-btn { 
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 0 0.5em !important;
                    cursor: pointer !important;
                    transition: transform 0.15s ease !important;
                }
                .quick-btn:hover { transform: scale(1.15) !important; }
                .quick-btn:active { transform: scale(0.9) !important; }
            `;
            const style = document.createElement('style');
            style.id = 'quick-buttons-style';
            style.textContent = css;
            document.head.appendChild(style);
        }

        // === 3. ОПРЕДЕЛЯЕМ КНОПКИ ===
        const buttons = [
            {
                id: 'RELOAD_BTN',
                title: 'Перезагрузка',
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4V10H7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3.51 15C4.15842 17.198 5.62485 19.0965 7.59511 20.3339C9.56537 21.5713 11.9053 22.061 14.2059 21.7124C16.5064 21.3638 18.6034 20.2028 20.1352 18.4407C21.667 16.6786 22.5231 14.4431 22.5488 12.1242C22.5745 9.80536 21.7679 7.55303 20.2745 5.76039C18.781 3.96776 16.7102 2.75985 14.4176 2.35885C12.125 1.95784 9.75845 2.39419 7.75895 3.59124C5.75945 4.7883 4.26564 6.66287 3.52 8.89" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                action: function() { location.reload(); }
            },
            {
                id: 'CONSOLE_BTN',
                title: 'Консоль разработчика',
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2.2"/>
                    <path d="M8 9L12 12L8 15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 15H18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                </svg>`,
                action: function() {
                    try {
                        if (typeof Lampa !== 'undefined' && Lampa.Controller) {
                            Lampa.Controller.toggle('console');
                        } else {
                            console.log('Консоль открыта');
                        }
                    } catch(e) { console.log('Ошибка открытия консоли'); }
                }
            },
            {
                id: 'EXIT_BTN',
                title: 'Выход из приложения',
                svg: `<svg width="24" height="24" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18,2A16,16,0,1,0,34,18,16,16,0,0,0,18,2Zm.06,17.68a1.28,1.28,0,0,1-1.29-1.28V8.65a1.29,1.29,0,0,1,2.58,0V18.4A1.28,1.28,0,0,1,18.06,19.68ZM18,27.79A9.88,9.88,0,0,1,12.17,9.85a1.4,1.4,0,0,1,1.94.31,1.37,1.37,0,0,1-.31,1.92,7.18,7.18,0,1,0,11.43,5.8,7.07,7.07,0,0,0-3-5.76A1.37,1.37,0,0,1,22,10.2a1.4,1.4,0,0,1,1.94-.29A9.88,9.88,0,0,1,18,27.79Z" fill="currentColor"/>
                </svg>`,
                action: function() {
                    try {
                        if (typeof Lampa !== 'undefined') {
                            Lampa.Activity.out();
                            if (Lampa.Platform.is('apple_tv')) window.location.assign('exit://exit');
                            if (Lampa.Platform.is('tizen')) tizen.application.getCurrentApplication().exit();
                            if (Lampa.Platform.is('webos')) window.close();
                            if (Lampa.Platform.is('android')) Lampa.Android.exit();
                            if (Lampa.Platform.is('orsay')) Lampa.Orsay.exit();
                            if (Lampa.Platform.is('netcast')) window.NetCastBack();
                        }
                    } catch(e) { console.log('Ошибка выхода'); }
                }
            },
            {
                id: 'CLEARCACHE_BTN',
                title: 'Очистить кэш',
                svg: `<svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.1l1.4 2.2-1.6 1.1 1.3 0.3 2.8 0.6 0.6-2.7 0.4-1.4-1.8 1.1-2-3.3h-2.2l-2.6 4.3 1.7 1z" fill="currentColor"/>
                    <path d="M16 12l-2.7-4.3-1.7 1 2 3.3h-2.6v-2l-3 3 3 3v-2h3.7z" fill="currentColor"/>
                    <path d="M2.4 12v0l1.4-2.3 1.7 1.1-0.9-4.2-2.8 0.7-1.3 0.3 1.6 1-2.1 3.4 1.3 2h5.7v-2z" fill="currentColor"/>
                </svg>`,
                action: function() {
                    try {
                        const btn = $('#CLEARCACHE_BTN');
                        btn.css('opacity', '0.5');
                        
                        if (typeof Lampa !== 'undefined' && Lampa.Storage && typeof Lampa.Storage.clear === 'function') {
                            Lampa.Storage.clear(false);
                            setTimeout(() => {
                                btn.css('opacity', '1');
                                location.reload();
                            }, 300);
                        } else {
                            // Ручная очистка
                            let removed = 0;
                            const keys = [];
                            for (let i = 0; i < localStorage.length; i++) {
                                const key = localStorage.key(i);
                                if (key && (key.startsWith('card_') || key.startsWith('full_card_') || 
                                    key.startsWith('cache_') || key.startsWith('cub_'))) {
                                    keys.push(key);
                                }
                            }
                            keys.forEach(key => { localStorage.removeItem(key); removed++; });
                            btn.css('opacity', '1');
                            alert('Очищено ' + removed + ' ключей кэша');
                            setTimeout(() => location.reload(), 300);
                        }
                    } catch(e) { 
                        console.log('Ошибка очистки кэша');
                        $('#CLEARCACHE_BTN').css('opacity', '1');
                    }
                }
            }
        ];

        // === 4. ДОБАВЛЯЕМ КНОПКИ ===
        const container = $('.head__actions');
        if (container.length === 0) return;

        // Добавляем разделитель
        if (!$('.head__actions .quick-separator').length) {
            container.prepend('<span class="quick-separator" style="width:1px;height:24px;background:rgba(255,255,255,0.15);margin:0 0.3em;"></span>');
        }

        buttons.forEach(btn => {
            const element = $(`
                <div id="${btn.id}" class="head__action selector quick-btn" title="${btn.title}">
                    ${btn.svg}
                </div>
            `);
            container.append(element);
            
            // Обработчики для TV пультов и мыши
            element.on('hover:enter hover:click hover:touch', function(e) {
                e.preventDefault();
                btn.action();
            });
        });

        // === 5. РЕГИСТРИРУЕМ ПЛАГИН ===
        if (window.plugin) {
            window.plugin('quick_buttons_plugin', {
                type: 'component',
                name: 'Быстрые кнопки (4 шт)',
                version: '1.0',
                author: 'Lampa',
                description: 'Перезагрузка, консоль, выход, очистка кэша'
            });
        }

        console.log('[QuickButtons] 4 кнопки добавлены');

    }, 500);
})();
