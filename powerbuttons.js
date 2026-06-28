(function() {
    setTimeout(function() {
        const buttons = [
            { id: 'RELOAD_BTN', color: '#4fc3f7', svg: '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M1 4V10H7" stroke="currentColor" stroke-width="2"/><path d="M3.51 15C4.15842 17.198 5.62485 19.0965 7.59511 20.3339C9.56537 21.5713 11.9053 22.061 14.2059 21.7124C16.5064 21.3638 18.6034 20.2028 20.1352 18.4407C21.667 16.6786 22.5231 14.4431 22.5488 12.1242C22.5745 9.80536 21.7679 7.55303 20.2745 5.76039C18.781 3.96776 16.7102 2.75985 14.4176 2.35885C12.125 1.95784 9.75845 2.39419 7.75895 3.59124C5.75945 4.7883 4.26564 6.66287 3.52 8.89" stroke="currentColor" stroke-width="2"/></svg>', action: () => location.reload() },
            { id: 'CONSOLE_BTN', color: '#ffb74d', svg: '<svg width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 9L12 12L8 15" stroke="currentColor" stroke-width="2"/><path d="M14 15H18" stroke="currentColor" stroke-width="2"/></svg>', action: () => Lampa.Controller.toggle('console') },
            { id: 'EXIT_BTN', color: '#f44336', svg: '<svg width="24" height="24" viewBox="0 0 36 36"><path d="M18,2A16,16,0,1,0,34,18,16,16,0,0,0,18,2Zm.06,17.68a1.28,1.28,0,0,1-1.29-1.28V8.65a1.29,1.29,0,0,1,2.58,0V18.4A1.28,1.28,0,0,1,18.06,19.68ZM18,27.79A9.88,9.88,0,0,1,12.17,9.85a1.4,1.4,0,0,1,1.94.31,1.37,1.37,0,0,1-.31,1.92,7.18,7.18,0,1,0,11.43,5.8,7.07,7.07,0,0,0-3-5.76A1.37,1.37,0,0,1,22,10.2a1.4,1.4,0,0,1,1.94-.29A9.88,9.88,0,0,1,18,27.79Z"/></svg>', action: () => { try { Lampa.Activity.out(); if (Lampa.Platform.is("tizen")) tizen.application.getCurrentApplication().exit(); if (Lampa.Platform.is("webos")) window.close(); if (Lampa.Platform.is("android")) Lampa.Android.exit(); } catch(e) {} } },
            { id: 'CLEARCACHE_BTN', color: '#2196f3', svg: '<svg width="24" height="24" viewBox="0 0 16 16"><path d="M8 3.1l1.4 2.2-1.6 1.1 1.3 0.3 2.8 0.6 0.6-2.7 0.4-1.4-1.8 1.1-2-3.3h-2.2l-2.6 4.3 1.7 1z"/><path d="M16 12l-2.7-4.3-1.7 1 2 3.3h-2.6v-2l-3 3 3 3v-2h3.7z"/><path d="M2.4 12v0l1.4-2.3 1.7 1.1-0.9-4.2-2.8 0.7-1.3 0.3 1.6 1-2.1 3.4 1.3 2h5.7v-2z"/></svg>', action: () => { try { if (Lampa.Storage.clear) Lampa.Storage.clear(false); setTimeout(() => location.reload(), 300); } catch(e) {} } }
        ];

        buttons.forEach(btn => {
            $('#' + btn.id).remove();
            const el = $(`<div id="${btn.id}" class="head__action selector" style="display:flex;align-items:center;padding:0 0.5em;cursor:pointer;">${btn.svg}</div>`);
            $('.head__actions').append(el);
            el.on('hover:enter hover:click hover:touch', btn.action);
        });
    }, 500);
})();