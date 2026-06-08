(function () {
    'use strict';

    function addonStart() {
        
        // ======================= ИКОНКИ РАЗДЕЛОВ =======================
        var icon_add_plugin = '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="256px" height="256px" viewBox="0 0 512 512" xml:space="preserve" fill="currentColor"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:currentColor;} </style> <g> <path class="st0" d="M432.531,229.906c-9.906,0-19.125,2.594-27.313,6.375v-51.656c0-42.938-34.922-77.875-77.859-77.875h-51.641 c3.781-8.156,6.375-17.375,6.375-27.281C282.094,35.656,246.438,0,202.625,0c-43.828,0-79.484,35.656-79.484,79.469 c0,9.906,2.594,19.125,6.359,27.281H77.875C34.938,106.75,0,141.688,0,184.625l0.047,23.828H0l0.078,33.781 c0,23.031,8.578,36.828,12.641,42.063c12.219,15.797,27.094,18.172,34.891,18.172c11.953,0,23.141-4.953,33.203-14.703l0.906-0.422 l1.516-2.141c1.391-1.359,6.328-5.484,14.016-5.5c16.344,0,29.656,13.297,29.656,29.672c0,16.344-13.313,29.656-29.672,29.656 c-7.672,0-12.609-4.125-14-5.5l-1.516-2.141l-0.906-0.422c-10.063-9.75-21.25-14.703-33.203-14.703 c-7.797,0.016-22.672,2.375-34.891,18.172c-4.063,5.25-12.641,19.031-12.641,42.063L0,410.281h0.047L0,434.063 C0,477.063,34.938,512,77.875,512h54.563v-0.063l3.047-0.016c23.016,0,36.828-8.563,42.063-12.641 c15.797-12.219,18.172-27.094,18.172-34.891c0-11.953-4.953-23.141-14.688-33.203l-0.438-0.906l-2.125-1.516 c-1.375-1.391-5.516-6.328-5.516-14.016c0-16.344,13.313-29.656,29.672-29.656c16.344,0,29.656,13.313,29.656,29.656 c0,7.688-4.141,12.625-5.5,14.016l-2.125,1.516l-0.438,0.906c-9.75,10.063-14.703,21.25-14.703,33.203 c0,7.797,2.359,22.672,18.172,34.891c5.25,4.078,19.031,12.641,42.063,12.641l17,0.047V512h40.609 c42.938,0,77.859-34.938,77.859-77.875v-51.641c8.188,3.766,17.406,6.375,27.313,6.375c43.813,0,79.469-35.656,79.469-79.484 C512,265.563,476.344,229.906,432.531,229.906z M432.531,356.375c-19.031,0-37.469-22.063-37.469-22.063 c-3.344-3.203-6.391-4.813-9.25-4.813c-2.844,0-5.469,1.609-7.938,4.813c0,0-5.125,5.891-5.125,19.313v80.5 c0,25.063-20.313,45.391-45.391,45.391h-23.813l-33.797-0.078c-15.438,0-22.188-5.875-22.188-5.875 c-3.703-2.859-5.563-5.875-5.563-9.172c0-3.266,1.859-6.797,5.563-10.594c0,0,17.219-13.891,17.219-39.047 c0-34.313-27.844-62.156-62.156-62.156c-34.344,0-62.156,27.844-62.156,62.156c0,25.156,17.219,39.047,17.219,39.047 c3.688,3.797,5.531,7.328,5.531,10.594c0,3.297-1.844,6.313-5.531,9.172c0,0-6.766,5.875-22.203,5.875l-33.797,0.078H77.875 c-25.063,0-45.375-20.328-45.375-45.391l0.094-48.203h-0.047l0.016-9.422c0-15.422,5.875-22.203,5.875-22.203 c2.859-3.703,5.875-5.531,9.156-5.531s6.813,1.828,10.609,5.531c0,0,13.891,17.234,39.047,17.234 c34.313-0.016,62.156-27.844,62.156-62.156c-0.016-34.344-27.844-62.156-62.156-62.156c-25.156,0-39.047,17.219-39.047,17.219 c-3.797,3.688-7.328,5.531-10.609,5.531s-6.297-1.828-9.156-5.531c0,0-5.875-6.781-5.875-22.203v-1.156h0.031L32.5,184.625 c0-25.063,20.313-45.375,45.375-45.375h80.5c13.422,0,19.313-5.125,19.313-5.125c6.422-4.938,6.422-10.531,0-17.188 c0,0-22.063-18.438-22.063-37.469c0-25.953,21.047-46.984,47-46.984c25.938,0,46.984,21.031,46.984,46.984 c0,19.031-22.047,37.469-22.047,37.469c-6.438,6.656-6.438,12.25,0,17.188c0,0,5.875,5.125,19.281,5.125h80.516 c25.078,0,45.391,20.313,45.391,45.375v80.516c0,13.422,5.125,19.297,5.125,19.297c2.469,3.219,5.094,4.813,7.938,4.813 c2.859,0,5.906-1.594,9.25-4.813c0,0,18.438-22.047,37.469-22.047c25.938,0,46.969,21.047,46.969,46.984 C479.5,335.344,458.469,356.375,432.531,356.375z"></path> </g> </g></svg>';
        
        var icon_tmdb = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24"><path fill="currentColor" d="M8.125 21.213q-1.825-.788-3.187-2.15t-2.15-3.188T2 11.988t.788-3.875t2.15-3.175t3.187-2.15T12 2q.8 0 1.538.113T15 2.45V5q0 .825-.587 1.413T13 7h-2v2q0 .425-.288.713T10 10H8v2h6q.425 0 .713.288T15 13v3h1q.675 0 1.188.4t.712 1q.975-1.1 1.538-2.463T20 12q0-.275-.025-.5T19.9 11h2.05q.05.275.05.5v.5q0 2.05-.787 3.875t-2.15 3.188t-3.175 2.15t-3.875.787t-3.888-.787M11 19.95V18q-.825 0-1.412-.587T9 16v-1l-4.8-4.8q-.075.45-.137.9T4 12q0 3.1 2.013 5.338T11 19.95M18 9q-.425 0-.712-.287T17 8V5q0-.425.288-.712T18 4V3q0-.825.588-1.412T20 1t1.413.588T22 3v1q.425 0 .713.288T23 5v3q0 .425-.288.713T22 9zm1-5h2V3q0-.425-.288-.712T20 2t-.712.288T19 3z" stroke-width="0.5" stroke="currentColor"/></svg></div><div style="font-size:1.3em">TMDB Proxy</div></div>';
        
        var icon_interface = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><path fill="currentColor" d="M18 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0"/><path fill="currentColor" fill-rule="evenodd" d="M11.943 1.25h.114c2.309 0 4.118 0 5.53.19c1.444.194 2.584.6 3.479 1.494c.895.895 1.3 2.035 1.494 3.48c.19 1.411.19 3.22.19 5.529v.088c0 1.909 0 3.471-.104 4.743c-.104 1.28-.317 2.347-.795 3.235q-.314.586-.785 1.057c-.895.895-2.035 1.3-3.48 1.494c-1.411.19-3.22.19-5.529.19h-.114c-2.309 0-4.118 0-5.53-.19c-1.444-.194-2.584-.6-3.479-1.494c-.793-.793-1.203-1.78-1.42-3.006c-.215-1.203-.254-2.7-.262-4.558Q1.25 12.792 1.25 12v-.058c0-2.309 0-4.118.19-5.53c.194-1.444.6-2.584 1.494-3.479c.895-.895 2.035-1.3 3.48-1.494c1.411-.19 3.22-.19 5.529-.19m-5.33 1.676c-1.278.172-2.049.5-2.618 1.069c-.57.57-.897 1.34-1.069 2.619c-.174 1.3-.176 3.008-.176 5.386v.844l1.001-.876a2.3 2.3 0 0 1 3.141.104l4.29 4.29a2 2 0 0 0 2.564.222l.298-.21a3 3 0 0 1 3.732.225l2.83 2.547c.286-.598.455-1.384.545-2.493c.098-1.205.099-2.707.099-4.653c0-2.378-.002-4.086-.176-5.386c-.172-1.279-.5-2.05-1.069-2.62c-.57-.569-1.34-.896-2.619-1.068c-1.3-.174-3.008-.176-5.386-.176s-4.086.002-5.386.176" clip-rule="evenodd"/></svg></div><div style="font-size:1.3em">Интерфейс</div></div>';
        
        var icon_online = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg viewBox="0 0 32 32" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 32 32"><path d="m17 14.5 4.2-4.5L4.9 1.2c-.1-.1-.3-.1-.6-.2L17 14.5zM23 21l5.9-3.2c.7-.4 1.1-1 1.1-1.8s-.4-1.5-1.1-1.8L23 11l-4.7 5 4.7 5zM2.4 1.9c-.3.3-.4.7-.4 1.1v26c0 .4.1.8.4 1.2L15.6 16 2.4 1.9zM17 17.5 4.3 31c.2 0 .4-.1.6-.2L21.2 22 17 17.5z" fill="currentColor" fill="#currentColor" class="fill-000000"></path></svg></div><div style="font-size:1.3em">Онлайн</div></div>';
        
        var icon_torrent = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><path fill="currentColor" d="M13.684 23.94a12.01 12.01 0 0 0 9.599-7.79c-.118.044-.26.096-.432.147c-2 .59-3.404-.466-3.687-.649c-.283-.18-.587-.48-.643-.464c-.183 1.132-1.218 2.706-3.58 3.42c-1.295.391-2.687.4-3.681-.157l.328.822c.13.328.351.866.488 1.192c0 0 .858 2.044 1.608 3.48M2.723 7.153l3.54-.66c.323-.059.68.124.794.407l2.432 6.07c.332.633.399.773.615 1.043c0 0 1.68 2.398 4.24 1.812c1.726-.394 2.532-1.69 2.587-2.612c.057-.296-.032-.669-.185-1.016L13.832 5.61c-.117-.266.022-.527.306-.581l2.953-.55a.69.69 0 0 1 .706.376l3.227 6.91c.13.276.394.712.588.966c0 0 .671.964 1.747.78c.266 0 .569-.143.569-.143q.071-.645.072-1.31c0-6.627-5.373-12-12.002-12C5.372.06 0 5.433 0 12.06c0 5.319 3.46 9.827 8.252 11.402a25 25 0 0 1-.919-2.121L2.298 7.808c-.111-.297.083-.59.425-.654"/></svg></div><div style="font-size:1.3em">Торренты</div></div>';
        
        var icon_tv = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><g fill="none"><path stroke="currentColor" stroke-width="1.5" d="M22 16c0 2.828 0 4.243-.879 5.121C20.243 22 18.828 22 16 22H8c-2.828 0-4.243 0-5.121-.879C2 20.243 2 18.828 2 16v-4c0-2.828 0-4.243.879-5.121C3.757 6 5.172 6 8 6h8c2.828 0 4.243 0 5.121.879C22 7.757 22 9.172 22 12z"/><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="m9 2l3 3.5L15 2m1 4v16"/><path fill="currentColor" d="M20 16a1 1 0 1 0-2 0a1 1 0 0 0 2 0m0-4a1 1 0 1 0-2 0a1 1 0 0 0 2 0"/></g></svg></div><div style="font-size:1.3em">ТВ</div></div>';
        
        var icon_radio = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 26 26"><path fill="currentColor" d="M23.5.063c-.794 0-1.438.643-1.438 1.437L4.657 6.313c-.2-.076-.43-.125-.656-.125A1.81 1.81 0 0 0 2.187 8v.125C.933 8.484 0 9.63 0 11v11c0 1.656 1.344 3 3 3h20c1.656 0 3-1.344 3-3V11c0-1.656-1.344-3-3-3H5.812c0-.277-.076-.546-.187-.781l16.656-5c.25.428.688.719 1.219.719a1.437 1.437 0 1 0 0-2.876zm-6 10.75a5.696 5.696 0 0 1 5.688 5.687a5.696 5.696 0 0 1-5.688 5.688a5.697 5.697 0 0 1-5.688-5.688a5.697 5.697 0 0 1 5.688-5.688zm-13 .093c.877 0 1.594.717 1.594 1.594s-.717 1.594-1.594 1.594A1.597 1.597 0 0 1 2.906 12.5c0-.877.716-1.594 1.594-1.594m13 1.281c-.937 0-1.793.306-2.5.813h5a4.26 4.26 0 0 0-2.5-.813M14 14a4.3 4.3 0 0 0-.531 1h8.062A4.4 4.4 0 0 0 21 14zm-9.5 1.906c.877 0 1.594.717 1.594 1.594s-.717 1.594-1.594 1.594A1.597 1.597 0 0 1 2.906 17.5c0-.877.716-1.594 1.594-1.594m8.75.094c-.02.166-.063.328-.063.5s.043.334.063.5h8.5c.02-.166.063-.328.063-.5s-.044-.334-.063-.5zm.219 2q.202.538.531 1h7q.33-.462.531-1H13.47zM15 20a4.27 4.27 0 0 0 2.5.813c.938 0 1.793-.306 2.5-.813z"/></svg></div><div style="font-size:1.3em">Радио</div></div>';
        
        var icon_sisi = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path fill="currentColor" d="M51.348 15.912c-3.332-3.347-7.33-4.796-11.498-4.796c-.359 0-.721.016-1.08.038C37.734 6.492 36.295 2 36.295 2s-6.291 3.991-9.97 7.716c-4.255-3.327-9.149-6.391-9.149-6.391s-1.044 7.646-.678 13.247c-5.577-.361-13.188.692-13.188.692s3.051 4.912 6.368 9.185C5.97 30.146 2 36.47 2 36.47s4.646 1.497 9.382 2.538c-.159 4.421 1.261 8.681 4.776 12.213C23.599 58.692 36.494 62 46.373 62c5.729-.001 10.445-1.113 12.492-3.17c5.522-5.549 4.184-31.161-7.517-42.918m6.074 41.482c-1.236 1.242-4.789 2.57-11.049 2.571c-9.275 0-21.77-3.147-28.771-10.18c-8.058-8.096-3.363-20.183 4.41-27.987c5.389-5.413 12.057-8.646 17.838-8.646c3.9.001 7.283 1.411 10.055 4.198c4.908 4.93 8.424 13.172 9.643 22.61c1.147 8.891-.2 15.499-2.126 17.434"/><path fill="currentColor" d="M40.172 18.321c.578.403 1.215.606 1.771.607c.541 0 1.006-.19 1.271-.573c.545-.775.063-2.052-1.072-2.848c-.58-.405-1.215-.607-1.773-.607c-.539 0-1.006.19-1.273.572c-.543.776-.063 2.054 1.076 2.849m3.902 14.408a1.34 1.34 0 0 0-.891.31c-.715.621-.557 1.976.352 3.025c.604.695 1.389 1.081 2.057 1.08c.34.001.65-.099.891-.309c.717-.621.557-1.975-.352-3.024c-.604-.696-1.387-1.081-2.057-1.082m-8.781-8.797a1.3 1.3 0 0 0-.865.294c-.727.609-.592 1.968.303 3.031c.602.715 1.391 1.114 2.064 1.115c.33 0 .629-.097.867-.295c.727-.61.59-1.966-.303-3.033c-.601-.714-1.392-1.113-2.066-1.112m17.111 2.537c-.518-.945-1.369-1.53-2.111-1.53a1.26 1.26 0 0 0-.604.148c-.832.456-.967 1.813-.301 3.032c.52.945 1.367 1.529 2.111 1.529c.213 0 .418-.047.604-.148c.833-.455.967-1.812.301-3.031m2.551 11.924q-.153 0-.303.039c-.918.24-1.379 1.521-1.027 2.866c.313 1.198 1.162 2.037 1.994 2.038q.153 0 .303-.038c.918-.239 1.379-1.523 1.027-2.868c-.312-1.196-1.164-2.037-1.994-2.037M53.76 51.021c-.354.001-.674.105-.918.327c-.703.636-.518 1.987.414 3.019c.607.671 1.381 1.038 2.041 1.039c.354-.001.676-.106.922-.329c.701-.636.516-1.987-.418-3.017c-.606-.669-1.379-1.039-2.041-1.039m-20.837-.979c-.569-.384-1.189-.573-1.736-.572c-.559 0-1.041.198-1.309.598c-.527.788-.02 2.054 1.135 2.825c.57.383 1.191.573 1.736.573c.561 0 1.042-.2 1.309-.6c.528-.786.02-2.053-1.135-2.824m-11.758-3.359c-.569-.382-1.189-.571-1.735-.571c-.561 0-1.042.199-1.309.597c-.527.787-.02 2.055 1.134 2.825c.57.382 1.191.574 1.738.573c.559 0 1.041-.199 1.307-.6c.526-.786.02-2.052-1.135-2.824m21.382 7.939a3.4 3.4 0 0 0-1.275-.259c-.797-.001-1.463.326-1.701.91c-.354.877.404 2.013 1.691 2.531c.434.175.871.258 1.275.257c.797 0 1.465-.324 1.699-.908c.356-.878-.4-2.012-1.689-2.531m2.617-9.926c-.543-.323-1.119-.481-1.633-.481c-.617-.001-1.143.229-1.406.672c-.486.814.09 2.053 1.283 2.763c.543.322 1.119.48 1.635.48c.615 0 1.141-.229 1.404-.672c.485-.816-.09-2.054-1.283-2.762m-10.596-6.943c-.602-.5-1.295-.758-1.895-.757c-.465-.001-.873.155-1.138.474c-.604.729-.229 2.042.839 2.928c.603.498 1.297.758 1.897.758c.465 0 .871-.156 1.137-.475c.604-.73.231-2.043-.84-2.928m-10.701-14.53c-.385.001-.73.119-.982.368c-.676.665-.434 2.008.539 2.997c.611.618 1.364.953 2.009.954c.384-.001.729-.119.981-.368c.676-.666.435-2.008-.539-2.996c-.612-.621-1.364-.954-2.008-.955m-1.055 11.751c-.598-.473-1.275-.716-1.863-.715c-.484 0-.909.163-1.175.5c-.589.741-.184 2.046.904 2.906c.598.474 1.276.715 1.864.715c.484 0 .908-.161 1.174-.499c.587-.742.184-2.045-.904-2.907"/></svg></div><div style="font-size:1.3em">18+</div></div>';
        
        var ads = '<div style="padding: 0.3em 0.3em; padding-top: 0;"><div style="background: #3e3e3e; padding: 0.5em; border-radius: 1em;"><div style="line-height: 1.2;"><span style="color: #ffffff"><div style="text-align: center;">Мои плагины<br><span style="color: #f3d900">Сборник уникальных плагинов</span></span></div></div></div></div>';
        
        var notice = '<div style="padding: 0.3em 0.3em; padding-top: 0;"><div style="background: #3e3e3e; padding: 0.5em; border-radius: 1em;"><div style="line-height: 1.2;"><span style="color: #f3d900"><div style="text-align: center;">ВНИМАНИЕ!<br>Устанавливайте только совместимые плагины</div></span></div></div></div>';
        
        var nthChildIndex = null;
        
        // ======================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =======================
        
        Lampa.Storage.set('needReboot', false);
        Lampa.Storage.set('needRebootSettingExit', false);
        
        function showReload(reloadText){
            if (document.querySelector('.modal') == null) {
                Lampa.Modal.open({
                    title: '',
                    align: 'center',
                    zIndex: 300,
                    html: $('<div class="about">' + reloadText + '</div>'),
                    buttons: [{
                        name: 'Нет',
                        onSelect: function onSelect() {
                            $('.modal').remove();
                            Lampa.Controller.toggle('content')
                        }
                    }, {
                        name: 'Да',
                        onSelect: function onSelect() {
                            window.location.reload();
                        }
                    }]
                });
            }
        }
        
        function showLoadingBar() {
            var loadingBar = document.createElement('div');
            loadingBar.className = 'loading-bar';
            loadingBar.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;display:none;width:30em;height:2.5em;background-color:#595959;border-radius:4em';
            var loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:0;background-color:#64e364;border-radius:4em';
            var loadingPercentage = document.createElement('div');
            loadingPercentage.className = 'loading-percentage';
            loadingPercentage.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-weight:bold;font-size:1.7em';
            loadingBar.appendChild(loadingIndicator);
            loadingBar.appendChild(loadingPercentage);
            document.body.appendChild(loadingBar);
            loadingBar.style.display = 'block';
            var startTime = Date.now();
            var duration = 1000;
            var interval = setInterval(function() {
                var elapsed = Date.now() - startTime;
                var progress = Math.min((elapsed / duration) * 100, 100);
                loadingIndicator.style.width = progress + '%';
                loadingPercentage.textContent = Math.round(progress) + '%';
                if (elapsed >= duration) {
                    clearInterval(interval);
                    setTimeout(function() {
                        loadingBar.style.display = 'none';
                        loadingBar.parentNode.removeChild(loadingBar);
                    }, 250);
                }
            }, 16);
        }
        
        function settingsWatch() {
            if (Lampa.Storage.get('needRebootSettingExit')) {
                var intervalSettings = setInterval(function() {
                    var elementSettings = $('#app > div.settings > div.settings__content.layer--height > div.settings__body > div');
                    if (!elementSettings.length > 0){
                        clearInterval(intervalSettings);
                        showReload('Для полного удаления плагина перезагрузите приложение!');
                    }
                }, 1000)
            }
        }
        
        function itemON(sourceURL, sourceName, sourceAuthor, itemName) {
            if ($('DIV[data-name="' + itemName + '"]').find('.settings-param__status').hasClass('active')) {
                Lampa.Noty.show("Плагин уже установлен!");
            } else if ($('DIV[data-name="' + itemName + '"]').find('.settings-param__status').css('background-color') === 'rgb(255, 165, 0)') {
                Lampa.Noty.show("Плагин уже установлен, но отключен в расширениях!");
            } else {
                if (!Lampa.Storage.get('needReboot')) {
                    var pluginsArray = Lampa.Storage.get('plugins');
                    pluginsArray.push({
                        "author": sourceAuthor,
                        "url": sourceURL,
                        "name": sourceName,
                        "status": 1
                    });
                    Lampa.Storage.set('plugins', pluginsArray);
                    var script = document.createElement('script');
                    script.src = sourceURL;
                    document.getElementsByTagName('head')[0].appendChild(script);
                    showLoadingBar();
                    setTimeout(function() {
                        Lampa.Settings.update();
                        Lampa.Noty.show("Плагин " + sourceName + " успешно установлен");
                    }, 1500);
                    setTimeout(function() {
                        if (nthChildIndex) {
                            var F = document.querySelector("#app > div.settings.animate > div.settings__content.layer--height > div.settings__body > div > div > div > div > div:nth-child(" + nthChildIndex + ")");
                            Lampa.Controller.focus(F);
                            Lampa.Controller.toggle('settings_component');
                        }
                    }, 2000);
                }
            }
        }
        
        function deletePlugin(pluginToRemoveUrl) {
            var plugins = Lampa.Storage.get('plugins');
            var updatedPlugins = plugins.filter(function(obj) {return obj.url !== pluginToRemoveUrl});
            Lampa.Storage.set('plugins', updatedPlugins);
            setTimeout(function() {
                Lampa.Settings.update();
                Lampa.Noty.show("Плагин успешно удален");
            }, 1500);
            setTimeout(function() {
                if (nthChildIndex) {
                    var F = document.querySelector("#app > div.settings.animate > div.settings__content.layer--height > div.settings__body > div > div > div > div > div:nth-child(" + nthChildIndex + ")");
                    Lampa.Controller.focus(F);
                    Lampa.Controller.toggle('settings_component');
                }
            }, 2000);
            Lampa.Storage.set('needRebootSettingExit', true);
            settingsWatch();
        }
        
        function checkPlugin(pluginToCheck) {
            var plugins = Lampa.Storage.get('plugins');
            var checkResult = plugins.filter(function(obj) {return obj.url == pluginToCheck});
            return JSON.stringify(checkResult) !== '[]';
        }
        
        function focus_back(event) {
            var targetElement = event.target;
            var parentElement = targetElement.parentElement;
            var children = Array.from(parentElement.children);
            var index = children.indexOf(targetElement);
            return index + 1;
        }
        
        function updateStatusIndicator(itemName, pluginUrl) {
            var myResult = checkPlugin(pluginUrl);
            var pluginsArray = Lampa.Storage.get('plugins');
            setTimeout(function() {
                var statusDiv = $('div[data-name="' + itemName + '"]').find('.settings-param__status');
                if (statusDiv.length === 0) {
                    $('div[data-name="' + itemName + '"]').append('<div class="settings-param__status one"></div>');
                    statusDiv = $('div[data-name="' + itemName + '"]').find('.settings-param__status');
                }
                var pluginStatus = null;
                for (var i = 0; i < pluginsArray.length; i++) {
                    if (pluginsArray[i].url === pluginUrl) {
                        pluginStatus = pluginsArray[i].status;
                        break;
                    }
                }
                if (myResult && pluginStatus !== 0) {
                    statusDiv.removeClass('active error').addClass('active');
                } else if (pluginStatus === 0) {
                    statusDiv.removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                } else {
                    statusDiv.removeClass('active error').addClass('error');
                }
            }, 100);
        }
        
        function hideInstall() {
            if ($("#hideInstall").length === 0) {
                $('body').append('<div id="hideInstall"><style>div.settings-param__value{opacity:0%!important;display:none;}</style><div>');
            }
        }
        
        function createParam(component, paramName, fieldName, description, pluginUrl, pluginDisplayName, pluginAuthor) {
            Lampa.SettingsApi.addParam({
                component: component,
                param: {
                    name: paramName,
                    type: 'select',
                    values: {
                        1: 'Установить',
                        2: 'Удалить',
                    },
                },
                field: {
                    name: fieldName,
                    description: description
                },
                onChange: function(value) {
                    if (value == '1') {
                        itemON(pluginUrl, pluginDisplayName, pluginAuthor, paramName);
                    }
                    if (value == '2') {
                        deletePlugin(pluginUrl);
                    }
                },
                onRender: function(item) {
                    $('.settings-param__name', item).css('color', '#f3d900');
                    hideInstall();
                    updateStatusIndicator(paramName, pluginUrl);
                    item.on("hover:enter", function(event) {
                        nthChildIndex = focus_back(event);
                    });
                }
            });
        }
        
        // ======================= КОМПОНЕНТЫ (ГРУППИРОВКА ПО ДОМЕНАМ) =======================
        
        Lampa.SettingsApi.addComponent({
            component: 'add_plugin',
            name: 'Мои плагины',
            icon: icon_add_plugin
        });
        
        // -------- 1. https://tvigl.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'tvigl_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 tvigl.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'tvigl_surs_quality', 'Качество Surs', 'Плагин для отображения качества фильмов', 'https://tvigl.github.io/plugins/surs_quality.js', 'Качество Surs', '@tvigl');
        createParam('add_plugin', 'tvigl_tmdb_mod', 'Подборки TMDB (мод)', 'Модифицированные подборки из TMDB', 'https://tvigl.github.io/plugins/tmdb_mod.js', 'Подборки TMDB (мод)', '@tvigl');
        createParam('add_plugin', 'tvigl_new_released', 'Большие постеры с релизами', 'Отображение новых релизов с большими постерами', 'https://tvigl.github.io/plugins/new_released.js', 'Большие постеры с релизами', '@tvigl');
        createParam('add_plugin', 'tvigl_seasons', 'Сезоны', 'Управление сезонами сериалов', 'https://tvigl.github.io/plugins/seasons.js', 'Сезоны', '@tvigl');
        createParam('add_plugin', 'tvigl_cache', 'Кэш', 'Управление кэшем приложения', 'https://tvigl.github.io/plugins/cache.js', 'Кэш', '@tvigl');
        createParam('add_plugin', 'tvigl_source_sort', 'Сортировка источников', 'Сортировка источников контента', 'https://tvigl.github.io/plugins/source_sort.js', 'Сортировка источников', '@tvigl');
        createParam('add_plugin', 'tvigl_drxaos_themes', 'Темы Drxaos', 'Дополнительные темы оформления', 'https://tvigl.github.io/plugins/drxaos_themes.js', 'Темы Drxaos', '@tvigl');
        createParam('add_plugin', 'tvigl_rating_quality', 'Рейтинг качества', 'Отображение рейтинга качества', 'https://tvigl.github.io/plugins/rating-quality.js', 'Рейтинг качества', '@tvigl');
        createParam('add_plugin', 'tvigl_maxsm_ratings', 'Рейтинги Maxsm', 'Дополнительные рейтинги', 'https://tvigl.github.io/plugins/maxsm_ratings.js', 'Рейтинги Maxsm', '@tvigl');
        createParam('add_plugin', 'tvigl_Flixio', 'Тема Flixio', 'Тема оформления Flixio', 'https://tvigl.github.io/plugins/Flixio.js', 'Тема Flixio', '@tvigl');
        createParam('add_plugin', 'tvigl_aloader', 'Aloader', 'Асинхронная загрузка', 'https://tvigl.github.io/plugins/aloader.js', 'Aloader', '@tvigl');
        createParam('add_plugin', 'tvigl_exit', 'Выход', 'Плагин выхода из приложения', 'https://tvigl.github.io/plugins/exit.js', 'Выход', '@tvigl');
        createParam('add_plugin', 'tvigl_vote_colour', 'Цветные оценки', 'Окрашивание оценок в цвета', 'https://tvigl.github.io/plugins/vote_colour.js', 'Цветные оценки', '@tvigl');
        createParam('add_plugin', 'tvigl_rating_omdb', 'Рейтинг OMDB', 'Рейтинг от OMDB', 'https://tvigl.github.io/plugins/rating_omdb.js', 'Рейтинг OMDB', '@tvigl');
        createParam('add_plugin', 'tvigl_TemaV', 'Тема V', 'Тема оформления V', 'https://tvigl.github.io/plugins/TemaV.js', 'Тема V', '@tvigl');
        
        // -------- 2. https://bylampa.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'bylampa_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 bylampa.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'bylampa_filter_content', 'Фильтр контента', 'Фильтрация выводимого контента', 'https://bylampa.github.io/filter_content.js', 'Фильтр контента', '@bylampa');
        createParam('add_plugin', 'bylampa_redirect', 'Смена сервера', 'Смена сервера приложения', 'https://bylampa.github.io/redirect.js', 'Смена сервера', '@bylampa');
        createParam('add_plugin', 'bylampa_rate_on_main', 'Источник рейтинга на главной', 'Смена источника рейтинга на главной', 'https://bylampa.github.io/rate_on_main.js', 'Источник рейтинга на главной', '@bylampa');
        createParam('add_plugin', 'bylampa_start', 'Обход блокировок', 'Плагин для доступа к заблокированным ресурсам', 'https://bylampa.github.io/start.js', 'Обход блокировок', '@bylampa');
        createParam('add_plugin', 'bylampa_my_bookmarks', 'Папки в закладках', 'Создание папок в закладках', 'https://bylampa.github.io/my_bookmarks.js', 'Папки в закладках', '@bylampa');
        createParam('add_plugin', 'bylampa_seas_and_eps', 'Состояние сериала', 'Отображение статуса сериала на главной', 'https://bylampa.github.io/seas_and_eps.js', 'Состояние сериала', '@bylampa');
        createParam('add_plugin', 'bylampa_trailer_off', 'Отключение трейлеров', 'Отключение трейлеров в карточках', 'https://bylampa.github.io/trailer_off.js', 'Отключение трейлеров', '@bylampa');
        createParam('add_plugin', 'bylampa_top', 'Top ByLAMPA', 'Топ контента от ByLAMPA', 'https://bylampa.github.io/top.js', 'Top ByLAMPA', '@bylampa');
        createParam('add_plugin', 'bylampa_free_onl', 'Free Online', 'Бесплатный онлайн просмотр', 'https://bylampa.github.io/free_onl.js', 'Free Online', '@bylampa');
        createParam('add_plugin', 'bylampa_ads', 'Удаление рекламы', 'Блокировка рекламы в приложении', 'https://xiaomishka.github.io/lampa/ads.js', 'Удаление рекламы', '@xiaomishka');
        createParam('add_plugin', 'bylampa_interface_mod', 'Интерфейс мод', 'Модификация интерфейса', 'https://bywolf88.github.io/lampa-plugins/interface_mod.js', 'Интерфейс мод', '@bywolf88');
        createParam('add_plugin', 'bylampa_rus_movie', 'Русские новинки', 'Подборка русских новинок', 'https://bylampa.github.io/rus_movie.js', 'Русские новинки', '@bylampa');
        createParam('add_plugin', 'bylampa_in_quality', 'В качестве', 'Фильмы в высоком качестве', 'https://bylampa.github.io/in_quality.js', 'В качестве', '@bylampa');
        createParam('add_plugin', 'bylampa_snow', 'Снег', 'Анимация падающего снега', 'https://bylampa.github.io/snow.js', 'Снег', '@bylampa');
        createParam('add_plugin', 'bylampa_logo_title', 'Лого вместо названия', 'Замена названия на логотип', 'https://bylampa.github.io/logo_title.js', 'Лого вместо названия', '@bylampa');
        createParam('add_plugin', 'bylampa_cardify', 'Cardify', 'Обновленный вид карточек', 'https://bylampa.github.io/cardify.js', 'Cardify', '@bylampa');
        createParam('add_plugin', 'bylampa_backmenu', 'Меню выход', 'Кастомное меню выхода', 'https://bylampa.github.io/backmenu.js', 'Меню выход', '@bylampa');
        createParam('add_plugin', 'bylampa_themes', 'Мои темы', 'Пользовательские темы', 'https://bylampa.github.io/themes.js', 'Мои темы', '@bylampa');
        createParam('add_plugin', 'bylampa_inter_movie', 'Зарубежные подборки', 'Подборки зарубежных фильмов', 'https://bylampa.github.io/inter_movie.js', 'Зарубежные подборки', '@bylampa');
        createParam('add_plugin', 'bylampa_rate_lampa', 'Рейтинг Lampa', 'Рейтинг на основе оценок пользователей', 'https://bylampa.github.io/rate_lampa.js', 'Рейтинг Lampa', '@bylampa');
        createParam('add_plugin', 'bylampa_old_card_status', 'Статус на старой карточке', 'Статус просмотра на старых карточках', 'https://bylampa.github.io/old_card_status.js', 'Статус на старой карточке', '@bylampa');
        createParam('add_plugin', 'bylampa_anime', 'Аниме TMDB', 'Подборки аниме от TMDB', 'https://bylampa.github.io/anime.js', 'Аниме TMDB', '@bylampa');
        createParam('add_plugin', 'bylampa_color_vote', 'Цветные оценки', 'Цветные оценки в карточках', 'https://bylampa.github.io/color_vote.js', 'Цветные оценки', '@bylampa');
        createParam('add_plugin', 'bylampa_lable_serial', 'Лейбл сериала', 'Замена лейбла TV на Сериал', 'https://bylampa.github.io/lable_serial.js', 'Лейбл сериала', '@bylampa');
        createParam('add_plugin', 'bylampa_full_center', 'Card elems center', 'Центрирование элементов в карточке', 'https://bylampa.github.io/full_center.js', 'Card elems center', '@bylampa');
        createParam('add_plugin', 'bylampa_bylampa_source', 'Источник ByLAMPA', 'Кастомный источник контента', 'https://bylampa.github.io/bylampa_source.js', 'Источник ByLAMPA', '@bylampa');
        createParam('add_plugin', 'bylampa_quality', 'Quality', 'Отметки качества на карточках', 'https://bylampa.github.io/quality.js', 'Quality', '@bylampa');
        createParam('add_plugin', 'bylampa_orig_title', 'Оригинальное название', 'Отображение оригинального названия', 'https://bylampa.github.io/orig_title.js', 'Оригинальное название', '@bylampa');
        createParam('add_plugin', 'bylampa_animated_reaction', 'Анимированные реакции', 'Анимация реакций CUB', 'https://bylampa.github.io/animated_reaction.js', 'Анимированные реакции', '@bylampa');
        createParam('add_plugin', 'bylampa_time2end', 'Time2end', 'Время окончания фильма в плеере', 'https://bylampa.github.io/time2end.js', 'Time2end', '@bylampa');
        createParam('add_plugin', 'bylampa_sisi', 'Клубничка', 'Контент 18+', 'https://bylampa.github.io/sisi.js', 'Клубничка', '@rik');
        createParam('add_plugin', 'bylampa_tmdb_proxy', 'TMDB Proxy ByLAMPA', 'Проксирование постеров TMDB', 'https://bylampa.github.io/tmdb-proxy.js', 'TMDB Proxy ByLAMPA', '@bylampa');
        createParam('add_plugin', 'bylampa_rating', 'Рейтинг КиноПоиск и IMDB', 'Отображение рейтингов КП и IMDB', 'https://bylampa.github.io/rating.js', 'Рейтинг КП и IMDB', '@t_anton');
        createParam('add_plugin', 'bylampa_cub_off', 'Cub Off', 'Отключение элементов CUB Premium', 'https://bylampa.github.io/cub_off.js', 'Cub Off', '@scabrum');
        createParam('add_plugin', 'bylampa_interface', 'Стильный интерфейс', 'Новый стиль интерфейса', 'https://bylampa.github.io/interface.js', 'Стильный интерфейс', '@lampa');
        createParam('add_plugin', 'bylampa_source_add', 'Дополнительные источники', 'Дополнительные источники информации', 'https://bylampa.github.io/source.js', 'Дополнительные источники', '@scabrum');
        createParam('add_plugin', 'bylampa_kp_source', 'Источник КП', 'Добавляет источник КиноПоиск', 'https://bylampa.github.io/kp_source.js', 'Источник КП', '@bylampa');
        createParam('add_plugin', 'bylampa_online_mod', 'Online Mod', 'Онлайн просмотр с балансерами', 'https://bylampa.github.io/online_mod.js', 'Online Mod', '@t_anton');
        createParam('add_plugin', 'bylampa_fx', 'Онлайн Filmix', 'Онлайн просмотр с Filmix', 'https://bylampa.github.io/fx.js', 'Онлайн Filmix', '@rik');
        createParam('add_plugin', 'bylampa_cinema', 'Онлайн Cinema', 'Онлайн просмотр', 'https://bylampa.github.io/cinema.js', 'Онлайн Cinema', '@cinema');
        createParam('add_plugin', 'bylampa_jackett', 'Переключение парсеров', 'Переключение между парсерами Jackett', 'https://bylampa.github.io/jackett.js', 'Переключение парсеров', '@AndreyURL54');
        createParam('add_plugin', 'bylampa_tracks', 'Tracks', 'Замена названий аудиодорожек', 'https://bylampa.github.io/tracks.js', 'Tracks', '@lampa');
        createParam('add_plugin', 'bylampa_etor', 'Настройка торрентов', 'Для LG и Tizen TV', 'https://bylampa.github.io/etor.js', 'Настройка торрентов', '@lampa');
        createParam('add_plugin', 'bylampa_freetorr', 'Free Torrserver', 'Автоподстановка Torrserver', 'https://bylampa.github.io/freetorr.js', 'Free Torrserver', '@scabrum');
        createParam('add_plugin', 'bylampa_tv', 'Hack TV', 'IPTV каналы', 'https://bylampa.github.io/tv.js', 'Hack TV', '@scabrum');
        createParam('add_plugin', 'bylampa_reload', 'Перезагрузка приложения', 'Кнопка перезагрузки', 'https://bylampa.github.io/reload.js', 'Перезагрузка приложения', '@bylampa');
        createParam('add_plugin', 'bylampa_sort_main_menu', 'Sort main menu', 'Сортировка главного меню', 'https://bylampa.github.io/sort_main_menu.js', 'Sort main menu', '@bylampa');
        createParam('add_plugin', 'bylampa_speedtest', 'Speedtest', 'Измерение скорости интернета', 'https://bylampa.github.io/speedtest.js', 'Speedtest', '@AndreyURL54');
        createParam('add_plugin', 'bylampa_cub_sync', 'CUB Sync', 'Синхронизация с CUB', 'https://bylampa.github.io/cub_sync.js', 'CUB Sync', '@levende');
        createParam('add_plugin', 'bylampa_weather', 'Погода', 'Отображение погоды', 'https://bylampa.github.io/weather.js', 'Погода', '@scabrum');
        
        // -------- 3. https://and7ey.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'and7ey_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 and7ey.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'and7ey_noshots', 'No Shots', 'Отключение скриншотов', 'https://and7ey.github.io/lampa/noshots.js', 'No Shots', '@and7ey');
        createParam('add_plugin', 'and7ey_stats', 'Статистика', 'Статистика просмотров', 'https://and7ey.github.io/lampa/stats.js', 'Статистика', '@alukyanov');
        createParam('add_plugin', 'and7ey_head_filter', 'Настройка шапки', 'Настройка элементов шапки', 'https://and7ey.github.io/lampa/head_filter.js', 'Настройка шапки', '@and7ey');
        createParam('add_plugin', 'and7ey_kinopoisk', 'КиноПоиск источник', 'Источник КиноПоиск', 'https://and7ey.github.io/lampa/kinopoisk.js', 'КиноПоиск источник', '@and7ey');
        createParam('add_plugin', 'and7ey_kinopoisk_rating', 'Рейтинг КиноПоиск', 'Рейтинг от КиноПоиск', 'https://and7ey.github.io/lampa/kinopoisk_rating.js', 'Рейтинг КиноПоиск', '@and7ey');
        
        // -------- 4. https://lampame.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'lampame_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 lampame.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'lampame_parser', 'Парсер', 'Парсер контента', 'https://lampame.github.io/main/parser.js', 'Парсер', '@lampame');
        createParam('add_plugin', 'lampame_pubtorr', 'PubTorr', 'Торрент парсер PubTorr', 'https://lampame.github.io/main/pubtorr.js', 'PubTorr', '@lampame');
        createParam('add_plugin', 'lampame_lme', 'Movie Enhancer', 'Дополнительная информация о фильмах', 'https://lampame.github.io/main/lme.js', 'Movie Enhancer', '@lampame');
        createParam('add_plugin', 'lampame_nc', 'Дополнительные категории', 'Категории: Документалки, Концерты, Мультфильмы', 'https://lampame.github.io/main/nc/nc.js', 'Дополнительные категории', '@GwynnBleiidd');
        createParam('add_plugin', 'lampame_shikimori', 'LME Shikimori', 'Информация об аниме с Shikimori', 'https://lampame.github.io/main/shikimori.js', 'LME Shikimori', '@GwynnBleiidd');
        createParam('add_plugin', 'lampame_trakttv', 'TraktTV', 'Интеграция с Trakt.TV', 'https://lampame.github.io/main/trakttv.js', 'TraktTV', '@lme');
        createParam('add_plugin', 'lampame_rradio', 'Радио Record Mod', 'Радио Record с единым списком', 'https://lampame.github.io/main/rradio.js', 'Радио Record Mod', '@GwynnBleiidd');
        createParam('add_plugin', 'lampame_torrentmanager', 'Закачка торрентов', 'Загрузка через qBittorent/Transmission', 'https://lampame.github.io/main/torrentmanager/torrentmanager.js', 'Закачка торрентов', '@feliks');
        createParam('add_plugin', 'lampame_cts', 'Поиск концертов', 'Поиск концертов через Jackett', 'https://lampame.github.io/main/cts.js', 'Поиск концертов', '@GwynnBleiidd');
        createParam('add_plugin', 'lampame_infuseSave', 'Infuse save', 'Сохранение торрентов в Infuse', 'https://lampame.github.io/main/infuseSave.js', 'Infuse save', '@lme');
        
        // -------- 5. https://igorek1986.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'igorek_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 Igorek1986.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'igorek_status', 'Status', 'Статус плагинов', 'https://Igorek1986.github.io/lampa-plugins/status.js', 'Status', '@Igorek1986');
        createParam('add_plugin', 'igorek_np', 'NP', 'Плагин NP', 'https://Igorek1986.github.io/lampa-plugins/np.js', 'NP', '@Igorek1986');
        createParam('add_plugin', 'igorek_myshows', 'MyShows', 'Интеграция с MyShows', 'https://Igorek1986.github.io/lampa-plugins/myshows.js', 'MyShows', '@Igorek1986');
        
        // -------- 6. https://andreyurl54.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'andreyurl_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 andreyurl54.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'andreyurl_tricks', 'Приятные мелочи', 'Скринсейверы, часы в плеере и др.', 'https://andreyurl54.github.io/diesel5/tricks.js', 'Приятные мелочи', '@AndreyURL54');
        createParam('add_plugin', 'andreyurl_diesel', 'Дизель ТВ', 'IPTV каналы', 'https://andreyurl54.github.io/diesel5/diesel.js', 'Дизель ТВ', '@AndreyURL54');
        
        // -------- 7. https://amikdn.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'amikdn_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 amikdn.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'amikdn_rate', 'Рейтинг на карточках Все', 'Рейтинг на всех карточках', 'https://amikdn.github.io/rate.js', 'Рейтинг на карточках Все', '@amikdn');
        
        // -------- 8. https://arst113.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'arst113_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 arst113.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'arst113_newphonemenu', 'Нижняя навигация', 'Нижняя навигация для мобильных', 'https://arst113.github.io/log/NewPhoneMenu.js', 'Нижняя навигация', '@arst113');
        
        // -------- 9. https://cub.rip ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'cubrip_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 cub.rip</div>'
            }
        });
        
        createParam('add_plugin', 'cubrip_etor', 'ETor', 'Торрент плагин', 'https://cub.rip/plugin/etor', 'ETor', '@cub');
        createParam('add_plugin', 'cubrip_tmdb_proxy', 'TMDB Proxy CUB', 'Проксирование постеров', 'https://cub.rip/plugin/tmdb-proxy', 'TMDB Proxy CUB', '@cub');
        createParam('add_plugin', 'cubrip_collections', 'Подборки CUB', 'Коллекции фильмов и сериалов', 'https://cub.rip/plugin/collections', 'Подборки CUB', '@cub');
        createParam('add_plugin', 'cubrip_iptv', 'IPTV CUB', 'IPTV с плейлистами', 'http://cub.red/plugin/iptv', 'IPTV CUB', '@lampa');
        createParam('add_plugin', 'cubrip_radio', 'Радио Record', 'Радио Record', 'http://cub.red/plugin/radio', 'Радио Record', '@lampa');
        
        // -------- 10. https://ipavlin98.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'ipavlin_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 ipavlin98.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'ipavlin_torr_styles', 'Torr Styles', 'Стили для торрентов', 'https://ipavlin98.github.io/lmp-plugins/torr-styles.js', 'Torr Styles', '@ipavlin98');
        createParam('add_plugin', 'ipavlin_series_fix', 'Series Progress Fix', 'Исправление прогресса сериалов', 'https://ipavlin98.github.io/lmp-plugins/series-progress-fix.js', 'Series Progress Fix', '@ipavlin98');
        createParam('add_plugin', 'ipavlin_season_fix', 'Season Fix', 'Исправление сезонов', 'https://ipavlin98.github.io/lmp-plugins/season-fix.js', 'Season Fix', '@ipavlin98');
        
        // -------- 11. https://lampaplugins.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'lampaplugins_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 lampaplugins.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'lampaplugins_torrent_styles', 'Torrent Styles V2', 'Стили для торрентов', 'https://lampaplugins.github.io/store/torrent_styles_v2.js', 'Torrent Styles V2', '@lampaplugins');
        createParam('add_plugin', 'lampaplugins_logo', 'Логотипы вместо названий', 'Замена названий на логотипы', 'https://lampaplugins.github.io/store/logo.js', 'Логотипы вместо названий', '@lampaplugins');
        createParam('add_plugin', 'lampaplugins_p', 'Подборки', 'Коллекции фильмов', 'https://lampaplugins.github.io/store/p.js', 'Подборки', '@lampaplugins');
        createParam('add_plugin', 'lampaplugins_store', 'Store', 'Магазин плагинов', 'https://lampaplugins.github.io/store/store.js', 'Store', '@lampaplugins');
        createParam('add_plugin', 'lampaplugins_o', 'Отзывы и рецензии', 'Отзывы от КиноПоиск', 'https://lampaplugins.github.io/store/o.js', 'Отзывы и рецензии', '@lampaplugins');
        
        // -------- 12. https://plugin.rootu.top ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'rootu_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 plugin.rootu.top</div>'
            }
        });
        
        createParam('add_plugin', 'rootu_rutube', 'Трейлеры Rutube', 'Трейлеры с Rutube', 'https://plugin.rootu.top/rutube.js', 'Трейлеры Rutube', '@rootu');
        createParam('add_plugin', 'rootu_cub_rating', 'Средний рейтинг КУБА', 'Средний рейтинг от CUB', 'https://plugin.rootu.top/cub-rating.js', 'Средний рейтинг КУБА', '@rootu');
        createParam('add_plugin', 'rootu_tmdb', 'TMDB Proxy Rootu', 'Проксирование постеров', 'http://plugin.rootu.top/tmdb.js', 'TMDB Proxy Rootu', '@rootu');
        createParam('add_plugin', 'rootu_trailers', 'Трейлеры Itunes', 'Трейлеры с Itunes', 'https://plugin.rootu.top/trailers.js', 'Трейлеры Itunes', '@rootu');
        createParam('add_plugin', 'rootu_tv', 'TV Rootu', 'ТВ плагин', 'https://plugin.rootu.top/tv.js', 'TV Rootu', '@rootu');
        createParam('add_plugin', 'rootu_ts_preload', 'Визуализация загрузки TS', 'Визуализация загрузки TorrServer', 'https://plugin.rootu.top/ts-preload.js', 'Визуализация загрузки TS', '@rootu');
        createParam('add_plugin', 'rootu_wsoff', 'Wsoff', 'Отключение ошибки безопасности', 'http://plugin.rootu.top/wsoff.js', 'Wsoff', '@rootu');
        
        // -------- 13. https://lampaserg.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'lampaserg_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 lampaserg.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'lampaserg_netflix', 'Netflix Premium Style', 'Стиль Netflix Premium', 'https://lampaserg.github.io/netflix_premium_style.js', 'Netflix Premium Style', '@lampaserg');
        
        // -------- 14. https://maxsmeller.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'maxsmeller_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 maxsmeller.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'maxsmeller_rat', 'Rat', 'Плагин Rat', 'https://maxsmeller.github.io/lampa-plugins/rat.js', 'Rat', '@maxsmeller');
        
        // -------- 15. https://levende.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'levende_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 levende.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'levende_prisma', 'Prisma Collections', 'Коллекции Prisma', 'https://levende.github.io/lampa-plugins/prisma_collections.js?v=2', 'Prisma Collections', '@levende');
        
        // -------- 16. https://plugs.lobs.su ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'lobs_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 plugs.lobs.su</div>'
            }
        });
        
        createParam('add_plugin', 'lobs_pubtorr', 'PubTorr Lobs', 'Торрент парсер', 'https://plugs.lobs.su/pubtorr.js', 'PubTorr Lobs', '@lobs');
        createParam('add_plugin', 'lobs_etor', 'ETor Lobs', 'Торрент плагин', 'https://plugs.lobs.su/etor.js', 'ETor Lobs', '@lobs');
        createParam('add_plugin', 'lobs_kinozal', 'Kinozal', 'Торрент трекер Kinozal', 'https://plugs.lobs.su/kinozal.js', 'Kinozal', '@lobs');
        
        // -------- 17. https://bdvburik.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'bdvburik_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 bdvburik.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'bdvburik_title', 'Title', 'Плагин Title', 'https://bdvburik.github.io/title.js', 'Title', '@bdvburik');
        createParam('add_plugin', 'bdvburik_rezkacomment', 'Комментарии Rezka', 'Комментарии от Rezka', 'https://BDVBurik.github.io/rezkacomment.js', 'Комментарии Rezka', '@BDV_Burik');
        
        // -------- 18. https://tsynik.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'tsynik_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 tsynik.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'tsynik_exit', 'Выход', 'Пункт Выход в главном меню', 'https://tsynik.github.io/lampa/e.js', 'Выход', '@tsynik');
        createParam('add_plugin', 'tsynik_soma', 'Радио SomaFM', 'Альтернативное радио', 'https://tsynik.github.io/lampa/soma.js', 'Радио SomaFM', '@tsynik');
        
        // -------- 19. https://nnmdd.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'nnmdd_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 nnmdd.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'nnmdd_hotkeys', 'Горячие кнопки', 'Управление плеером с пульта', 'https://nnmdd.github.io/lampa_hotkeys/hotkeys.js', 'Горячие кнопки', '@nnmd');
        
        // -------- 20. https://nemiroff.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'nemiroff_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 nemiroff.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'nemiroff_select_weapon', 'Тип управления', 'Выбор типа управления', 'https://nemiroff.github.io/lampa/select_weapon.js', 'Тип управления', '@nemiroff');
        
        // -------- 21. https://nb557.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'nb557_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 nb557.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'nb557_reset_subs', 'Сброс субтитров', 'Сброс настроек субтитров', 'https://nb557.github.io/plugins/reset_subs.js', 'Сброс субтитров', '@t_anton');
        createParam('add_plugin', 'nb557_fix_size', 'Фиксированный размер', 'Изменение размеров интерфейса', 'https://nb557.github.io/plugins/fix_size.js', 'Фиксированный размер', '@t_anton');
        createParam('add_plugin', 'nb557_not_mobile', 'Выключение тача', 'Отключение сенсорного управления', 'https://nb557.github.io/plugins/not_mobile.js', 'Выключение тача', '@t_anton');
        
        // -------- 22. https://mastermagic98.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'mastermagic_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 mastermagic98.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'mastermagic_upcoming', 'Трейлеры', 'Трейлеры на главной странице', 'https://mastermagic98.github.io/l_plugins/upcoming.js', 'Трейлеры', '@myroslav_kuzyshyn');
        
        // -------- 23. https://apxubatop.github.io ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'apxubatop_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 apxubatop.github.io</div>'
            }
        });
        
        createParam('add_plugin', 'apxubatop_bind', 'Бинд кнопок', 'Управление цветными кнопками', 'https://apxubatop.github.io/lmpPlugs/tvbuttontst.js', 'Бинд кнопок', '@Juri_Z');
        
        // -------- 24. http://193.233.134.21 ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'ip193_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 193.233.134.21</div>'
            }
        });
        
        createParam('add_plugin', 'ip193_mult', 'Мультфильмы', 'Замена Аниме на Мульт', 'http://193.233.134.21/plugins/mult.js', 'Мультфильмы', '@AndreyURL54');
        createParam('add_plugin', 'ip193_nots', 'Remove TS', 'Удаление карточек с TS качеством', 'http://193.233.134.21/plugins/nots', 'Remove TS', '@AndreyURL54');
        createParam('add_plugin', 'ip193_setprotect', 'Доступ к настройкам', 'Закрытие настроек паролем', 'http://193.233.134.21/plugins/setprotect', 'Доступ к настройкам', '@AndreyURL54');
        createParam('add_plugin', 'ip193_menusort', 'Сортировка главного меню', 'Редактирование главного меню', 'http://193.233.134.21/plugins/menusort', 'Сортировка главного меню', '@AndreyURL54');
        createParam('add_plugin', 'ip193_checker', 'Поиск локального TorrServera', 'Автопоиск TorrServer', 'http://193.233.134.21/plugins/checker.js', 'Поиск локального TorrServera', '@AndreyURL54');
        
        // -------- 25. http://smotretk.com / http://wtch.ch ----------
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'other_group',
                type: 'title'
            },
            field: {
                name: '<div style="color:#f3d900; font-size:1.2em; padding:0.5em 0;">📁 Другие источники</div>'
            }
        });
        
        createParam('add_plugin', 'other_smotret4k', 'Смотреть 4K', 'Онлайн просмотр в 4K', 'http://smotretk.com/online.js', 'Смотреть 4K', '@showy');
        createParam('add_plugin', 'other_wtch', 'Showy WTCH', 'Онлайн просмотр', 'http://wtch.ch/m', 'Showy WTCH', '@showy');
        createParam('add_plugin', 'other_goldtheme', 'Золотая тема', 'Золотая тема оформления', 'https://bazzzilius.github.io/scripts/gold_theme.js', 'Золотая тема', '@BazZziliuS');
        createParam('add_plugin', 'other_want', 'Старый стиль пунктов', 'Старый стиль Закладки/Нравится/Позже', 'http://github.freebie.tom.ru/want.js', 'Старый стиль пунктов', '@VitalikPVA');
        createParam('add_plugin', 'other_torrents', 'Вторая кнопка Торренты', 'Дополнительная кнопка Торренты', 'https://github.freebie.tom.ru/torrents.js', 'Вторая кнопка Торренты', '@VitalikPVA');
        createParam('add_plugin', 'other_surs', 'Aviamovie Surs', 'Уникальные подборки', 'https://aviamovie.github.io/surs.js', 'Aviamovie Surs', '@pilot_valliko');
        createParam('add_plugin', 'other_cdn_kulik', 'Kulik TV', 'IPTV каналы', 'http://cdn.kulik.uz/cors', 'Kulik TV', '@SawamuraRen');
        
        // ======================= РЕКЛАМА / ИНФО =======================
        
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'add_notice',
                type: 'title'
            },
            field: {
                name: notice
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'add_plugin',
            param: {
                name: 'add_ads',
                type: 'title'
            },
            field: {
                name: ads
            },
            onRender: function(item) {
                setTimeout(function() {
                    $('.settings-param-title').insertAfter($('.settings-param').last());
                }, 0);
            }
        });
        
        // Сдвигаем раздел выше стандартного "Расширения"
        setTimeout(function() {
            $('div[data-component=plugins]').before($('div[data-component=add_plugin]'));
        }, 30);
        
        // Убираем лишние элементы интерфейса
        Lampa.Settings.listener.follow('open', function(e) {
            if (e.name == 'add_plugin') {
                setTimeout(function() {
                    if (document.querySelector("div > span > div > span") && 
                        document.querySelector("div > span > div > span").innerText == '@lampa_plugins_uncensored') {
                        $('div > span:contains("Еще")').parent().remove();
                        $('div > span:contains("Редактировать")').parent().remove();
                        $('div > span:contains("История")').parent().remove();
                        $('div > span:contains("Статус")').parent().remove();
                    }
                }, 0);
            }
        });
        
        
    } // addonStart
    
    if (!!window.appready) addonStart();
    else Lampa.Listener.follow('app', function(e){ if (e.type === 'ready') addonStart(); });
    
})();