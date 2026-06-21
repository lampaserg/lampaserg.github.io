/**
 * AppleTV+ Pro — расширенная версия Applecation
 * Стиль Apple TV с полными рейтингами, метаданными и развернутыми реакциями
 * Версия 2.2.0
 */

(function() {
    'use strict';

    var PLUGIN_VERSION = '2.2.0';
    var PLUGIN_NAME = 'AppleTV+ Pro';

    // =================================================================
    // Языковые настройки (только русский)
    // =================================================================
    var TRANSLATIONS = {
        show_ratings: 'Показывать рейтинги',
        show_ratings_desc: 'Отображать все рейтинги на странице фильма',
        ratings_display_mode: 'Режим отображения рейтингов',
        ratings_display_mode_desc: 'Как отображать рейтинги',
        ratings_mode_labels: 'Только названия',
        ratings_size: 'Размер рейтингов',
        ratings_size_desc: 'Масштаб рейтингов (иконки + цифры)',
        reactions_size: 'Размер реакций',
        reactions_size_desc: 'Масштаб блока реакций',
        show_reactions: 'Показывать реакции Lampa',
        show_reactions_desc: 'Отображать блок с реакциями под рейтингом',
        show_metadata: 'Показывать метаданные',
        show_metadata_desc: 'Отображать качество, аудио, озвучку и информацию о сезонах',
        metadata_source: 'Источник метаданных',
        metadata_source_desc: 'Откуда получать информацию о качестве и аудио',
        metadata_source_jacred: 'JacRed (парсер)',
        metadata_source_tmdb: 'TMDB (база)',
        metadata_source_both: 'JacRed + TMDB',
        logo_scale: 'Размер логотипа',
        logo_scale_desc: 'Масштаб логотипа фильма',
        text_scale: 'Размер текста',
        text_scale_desc: 'Масштаб текста данных о фильме',
        scale_default: 'По умолчанию',
        spacing_scale: 'Отступы между строками',
        spacing_scale_desc: 'Расстояние между элементами информации',
        settings_title_display: 'Отображение',
        settings_title_scaling: 'Масштабирование',
        reverse_episodes: 'Перевернуть список эпизодов',
        reverse_episodes_desc: 'Показывать эпизоды в обратном порядке (от новых к старым)',
        description_overlay: 'Описание в оверлее',
        description_overlay_desc: 'Показывать описание в отдельном окне при нажатии',
        settings_poster_quality: 'Качество постера',
        settings_poster_quality_desc: 'Выберите качество изображений постеров и фона',
        quality_low: 'Низкое - 720p (HD)',
        quality_medium: 'Среднее - 1080p (FHD)',
        quality_high: 'Высокое - 2160p (4K)',
        loading: 'Загрузка...',
        avg_rating: 'ИТОГ',
        rating_tmdb: 'TMDB',
        rating_imdb: 'IMDB',
        rating_kp: 'Кинопоиск',
        rating_lampa: 'Lampa',
        layout_position: 'Положение контента',
        layout_position_desc: 'Разместить логотип и информацию выше кнопок',
        layout_top: 'Сверху (над кнопками)',
        layout_bottom: 'Снизу (под кнопками)'
    };

    function tr(key) {
        return TRANSLATIONS[key] || key;
    }

    // =================================================================
    // Хранилище настроек
    // =================================================================
    function getSetting(key, defaultValue) {
        var val = Lampa.Storage.get('applecation_' + key);
        return val !== undefined && val !== null ? val : defaultValue;
    }

    function setSetting(key, value) {
        Lampa.Storage.set('applecation_' + key, value);
    }

    // Инициализация настроек
    var defaults = {
        show_ratings: true,
        ratings_display_mode: 'labels',
        ratings_size: 100,
        reactions_size: 100,
        show_reactions: true,
        show_metadata: true,
        metadata_source: 'both',
        logo_scale: 100,
        text_scale: 100,
        spacing_scale: 100,
        poster_quality: 'medium',
        reverse_episodes: true,
        description_overlay: true,
        layout_position: 'top'
    };

    for (var key in defaults) {
        if (getSetting(key) === undefined) {
            setSetting(key, defaults[key]);
        }
    }

    // =================================================================
    // SVG иконки для рейтингов
    // =================================================================
    var SVG_ICONS = {
        tmdb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150"><defs><linearGradient id="tmdbGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#90cea1"/><stop offset="56%" stop-color="#3cbec9"/><stop offset="100%" stop-color="#00b3e5"/></linearGradient><style>.tmdb-text{font-weight:bold;fill:url(#tmdbGrad);text-anchor:start;dominant-baseline:middle;textLength:150;lengthAdjust:spacingAndGlyphs;font-size:70px;}</style></defs><text class="tmdb-text" x="0" y="50" textLength="150" lengthAdjust="spacingAndGlyphs">TM</text><text class="tmdb-text" x="0" y="120" textLength="150" lengthAdjust="spacingAndGlyphs">DB</text></svg>',

        imdb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88"><path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path fill="#000" d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44h-12v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72L98.64,69.6z"/></svg>',

        kp: '<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="kpMask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="300"><circle cx="150" cy="150" r="150" fill="white"/></mask><g mask="url(#kpMask)"><circle cx="150" cy="150" r="150" fill="black"/><path d="M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z" fill="url(#kpGrad)"/></g><defs><radialGradient id="kpGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(89.9999 45) rotate(45) scale(296.985)"><stop offset="0.5" stop-color="#FF5500"/><stop offset="1" stop-color="#BBFF00"/></radialGradient></defs></svg>',

        lampa: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z" fill="currentColor"/></svg>',

        avg: '<svg width="64" height="64" viewBox="10 10 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.4517 11.3659C31.8429 10.7366 32.7589 10.7366 33.1501 11.3659L40.2946 22.8568C40.4323 23.0782 40.651 23.2371 40.9041 23.2996L54.0403 26.5435C54.7598 26.7212 55.0428 27.5923 54.5652 28.1589L45.8445 38.5045C45.6764 38.7039 45.5929 38.961 45.6117 39.221L46.5858 52.7168C46.6392 53.4559 45.8982 53.9942 45.2117 53.7151L32.6776 48.6182C32.4361 48.52 32.1657 48.52 31.9242 48.6182L19.39 53.7151C18.7036 53.9942 17.9626 53.4559 18.016 52.7168L18.9901 39.221C19.0089 38.961 18.9253 38.7039 18.7573 38.5045L10.0366 28.1589C9.559 27.5923 9.84204 26.7212 10.5615 26.5435L23.6977 23.2996C23.9508 23.2371 24.1695 23.0782 24.3072 22.8568L31.4517 11.3659Z" fill="#FFDF6D"/></svg>'
    };

    // =================================================================
    // SVG иконки для метаданных (качество, аудио, озвучка)
    // =================================================================
    var QUALITY_SVGS = {
        '4K': '<svg viewBox="0 0 311 134" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M291 0C302.046 3.57563e-06 311 8.95431 311 20V114C311 125.046 302.046 134 291 134H20C8.95431 134 0 125.046 0 114V20C0 8.95431 8.95431 0 20 0H291ZM113 20.9092L74.1367 82.1367V97.6367H118.818V114H137.637V97.6367H149.182V81.8633H137.637V20.9092H113ZM162.841 20.9092V114H182.522V87.5459L192.204 75.7275L217.704 114H241.25L206.296 62.5908L240.841 20.9092H217.25L183.75 61.9541H182.522V20.9092H162.841ZM119.182 81.8633H93.9541V81.1367L118.454 42.3633H119.182V81.8633Z" fill="white"/></svg>',
        'FHD': '<svg viewBox="331 0 311 134" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M622 0C633.046 3.57563e-06 642 8.95431 642 20V114C642 125.046 633.046 134 622 134H351C339.954 134 331 125.046 331 114V20C331 8.95431 339.954 0 351 0H622ZM362.341 20.9092V114H382.022V75.5459H419.887V59.3184H382.022V37.1367H423.978V20.9092H362.341ZM437.216 20.9092V114H456.897V75.5459H496.853V114H516.488V20.9092H496.853V59.3184H456.897V20.9092H437.216ZM532.716 20.9092V114H565.716C575.17 114 583.291 112.136 590.079 108.409C596.897 104.682 602.125 99.333 605.762 92.3633C609.428 85.3937 611.262 77.0601 611.262 67.3633C611.262 57.6968 609.428 49.3934 605.762 42.4541C602.125 35.5149 596.928 30.1969 590.171 26.5C583.413 22.7727 575.352 20.9092 565.988 20.9092H532.716ZM564.943 37.7725C570.761 37.7725 575.655 38.8027 579.625 40.8633C583.595 42.9239 586.579 46.1364 588.579 50.5C590.609 54.8636 591.625 60.4847 591.625 67.3633C591.625 74.3026 590.609 79.9694 588.579 84.3633C586.579 88.7269 583.579 91.955 579.579 94.0459C575.609 96.1063 570.715 97.1367 564.897 97.1367H552.397V37.7725H564.943Z" fill="white"/></svg>',
        'HD': '<svg viewBox="662 0 311 134" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M953 0C964.046 3.57563e-06 973 8.95431 973 20V114C973 125.046 964.046 134 953 134H682C670.954 134 662 125.046 662 114V20C662 8.95431 670.954 0 682 0H953ZM731.278 20.9092V114H750.96V75.5459H790.915V114H810.551V20.9092H790.915V59.3184H750.96V20.9092H731.278ZM826.778 20.9092V114H859.778C869.233 114 877.354 112.136 884.142 108.409C890.96 104.682 896.188 99.333 899.824 92.3633C903.491 85.3937 905.324 77.0601 905.324 67.3633C905.324 57.6968 903.491 49.3934 899.824 42.4541C896.188 35.5149 890.991 30.1969 884.233 26.5C877.476 22.7727 869.414 20.9092 860.051 20.9092H826.778ZM859.006 37.7725C864.824 37.7725 869.718 38.8027 873.688 40.8633C877.657 42.9239 880.642 46.1364 882.642 50.5C884.672 54.8636 885.687 60.4847 885.688 67.3633C885.688 74.3026 884.672 79.9694 882.642 84.3633C880.642 88.7269 877.642 91.955 873.642 94.0459C869.672 96.1063 864.778 97.1367 858.96 97.1367H846.46V37.7725H859.006Z" fill="white"/></svg>'
    };

    var AUDIO_SVGS = {
        '7.1': '<svg viewBox="-1 368 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="371.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M91.6023 483L130.193 406.636V406H85.2386V389.909H150.557V406.227L111.92 483H91.6023ZM159.545 484.182C156.545 484.182 153.97 483.121 151.818 481C149.697 478.848 148.636 476.273 148.636 473.273C148.636 470.303 149.697 467.758 151.818 465.636C153.97 463.515 156.545 462.455 159.545 462.455C162.455 462.455 165 463.515 167.182 465.636C169.364 467.758 170.455 470.303 170.455 473.273C170.455 475.273 169.939 477.106 168.909 478.773C167.909 480.409 166.591 481.727 164.955 482.727C163.318 483.697 161.515 484.182 159.545 484.182ZM215.045 389.909V483H195.364V408.591H194.818L173.5 421.955V404.5L196.545 389.909H215.045Z" fill="currentColor"/></svg>',
        '5.1': '<svg viewBox="330 368 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="333.5" y="371.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M443.733 484.273C437.309 484.273 431.581 483.091 426.551 480.727C421.551 478.364 417.581 475.106 414.642 470.955C411.703 466.803 410.172 462.045 410.051 456.682H429.142C429.354 460.288 430.869 463.212 433.688 465.455C436.506 467.697 439.854 468.818 443.733 468.818C446.824 468.818 449.551 468.136 451.915 466.773C454.309 465.379 456.172 463.455 457.506 461C458.869 458.515 459.551 455.667 459.551 452.455C459.551 449.182 458.854 446.303 457.46 443.818C456.097 441.333 454.203 439.394 451.778 438C449.354 436.606 446.581 435.894 443.46 435.864C440.733 435.864 438.081 436.424 435.506 437.545C432.96 438.667 430.975 440.197 429.551 442.136L412.051 439L416.46 389.909H473.369V406H432.688L430.278 429.318H430.824C432.46 427.015 434.93 425.106 438.233 423.591C441.536 422.076 445.233 421.318 449.324 421.318C454.93 421.318 459.93 422.636 464.324 425.273C468.718 427.909 472.188 431.53 474.733 436.136C477.278 440.712 478.536 445.985 478.506 451.955C478.536 458.227 477.081 463.803 474.142 468.682C471.233 473.53 467.157 477.348 461.915 480.136C456.703 482.894 450.642 484.273 443.733 484.273ZM500.733 484.182C497.733 484.182 495.157 483.121 493.006 481C490.884 478.848 489.824 476.273 489.824 473.273C489.824 470.303 490.884 467.758 493.006 465.636C495.157 463.515 497.733 462.455 500.733 462.455C503.642 462.455 506.188 463.515 508.369 465.636C510.551 467.758 511.642 470.303 511.642 473.273C511.642 475.273 511.127 477.106 510.097 478.773C509.097 480.409 507.778 481.727 506.142 482.727C504.506 483.697 502.703 484.182 500.733 484.182ZM556.233 389.909V483H536.551V408.591H536.006L514.688 421.955V404.5L537.733 389.909H556.233Z" fill="currentColor"/></svg>',
        '2.0': '<svg viewBox="661 368 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="664.5" y="371.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M722.983 483V468.818L756.119 438.136C758.938 435.409 761.301 432.955 763.21 430.773C765.15 428.591 766.619 426.455 767.619 424.364C768.619 422.242 769.119 419.955 769.119 417.5C769.119 414.773 768.498 412.424 767.256 410.455C766.013 408.455 764.316 406.924 762.165 405.864C760.013 404.773 757.574 404.227 754.847 404.227C751.998 404.227 749.513 404.803 747.392 405.955C745.271 407.106 743.634 408.758 742.483 410.909C741.331 413.061 740.756 415.621 740.756 418.591H722.074C722.074 412.5 723.453 407.212 726.21 402.727C728.968 398.242 732.831 394.773 737.801 392.318C742.771 389.864 748.498 388.636 754.983 388.636C761.65 388.636 767.453 389.818 772.392 392.182C777.362 394.515 781.225 397.758 783.983 401.909C786.741 406.061 788.119 410.818 788.119 416.182C788.119 419.697 787.422 423.167 786.028 426.591C784.665 430.015 782.225 433.818 778.71 438C775.195 442.152 770.241 447.136 763.847 452.955L750.256 466.273V466.909H789.347V483H722.983ZM815.108 484.182C812.108 484.182 809.532 483.121 807.381 481C805.259 478.848 804.199 476.273 804.199 473.273C804.199 470.303 805.259 467.758 807.381 465.636C809.532 463.515 812.108 462.455 815.108 462.455C818.017 462.455 820.563 463.515 822.744 465.636C824.926 467.758 826.017 470.303 826.017 473.273C826.017 475.273 825.502 477.106 824.472 478.773C823.472 480.409 822.153 481.727 820.517 482.727C818.881 483.697 817.078 484.182 815.108 484.182ZM874.483 485.045C866.665 485.015 859.938 483.091 854.301 479.273C848.695 475.455 844.377 469.924 841.347 462.682C838.347 455.439 836.862 446.727 836.892 436.545C836.892 426.394 838.392 417.742 841.392 410.591C844.422 403.439 848.741 398 854.347 394.273C859.983 390.515 866.695 388.636 874.483 388.636C882.271 388.636 888.968 390.515 894.574 394.273C900.21 398.03 904.544 403.485 907.574 410.636C910.604 417.758 912.104 426.394 912.074 436.545C912.074 446.758 910.559 455.485 907.528 462.727C904.528 469.97 900.225 475.5 894.619 479.318C889.013 483.136 882.301 485.045 874.483 485.045ZM874.483 468.727C879.816 468.727 884.074 466.045 887.256 460.682C890.438 455.318 892.013 447.273 891.983 436.545C891.983 429.485 891.256 423.606 889.801 418.909C888.377 414.212 886.347 410.682 883.71 408.318C881.104 405.955 878.028 404.773 874.483 404.773C869.18 404.773 864.938 407.424 861.756 412.727C858.574 418.03 856.968 425.97 856.938 436.545C856.938 443.697 857.65 449.667 859.074 454.455C860.528 459.212 862.574 462.788 865.21 465.182C867.847 467.545 870.938 468.727 874.483 468.727Z" fill="currentColor"/></svg>'
    };

    var DUB_SVG = '<svg viewBox="-1 558 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="561.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M60.5284 673H27.5284V579.909H60.8011C70.1648 579.909 78.2254 581.773 84.983 585.5C91.7405 589.197 96.9375 594.515 100.574 601.455C104.241 608.394 106.074 616.697 106.074 626.364C106.074 636.061 104.241 644.394 100.574 651.364C96.9375 658.333 91.7102 663.682 84.892 667.409C78.1042 671.136 69.983 673 60.5284 673ZM47.2102 656.136H59.7102C65.5284 656.136 70.4223 655.106 74.392 653.045C78.392 650.955 81.392 647.727 83.392 643.364C85.4223 638.97 86.4375 633.303 86.4375 626.364C86.4375 619.485 85.4223 613.864 83.392 609.5C81.392 605.136 78.4072 601.924 74.4375 599.864C70.4678 597.803 65.5739 596.773 59.7557 596.773H47.2102V656.136ZM178.153 579.909H197.835V640.364C197.835 647.152 196.214 653.091 192.972 658.182C189.759 663.273 185.259 667.242 179.472 670.091C173.684 672.909 166.941 674.318 159.244 674.318C151.517 674.318 144.759 672.909 138.972 670.091C133.184 667.242 128.684 663.273 125.472 658.182C122.259 653.091 120.653 647.152 120.653 640.364V579.909H140.335V638.682C140.335 642.227 141.108 645.379 142.653 648.136C144.229 650.894 146.441 653.061 149.29 654.636C152.138 656.212 155.456 657 159.244 657C163.063 657 166.381 656.212 169.199 654.636C172.047 653.061 174.244 650.894 175.79 648.136C177.366 645.379 178.153 642.227 178.153 638.682V579.909ZM214.028 673V579.909H251.301C258.15 579.909 263.862 580.924 268.438 582.955C273.013 584.985 276.453 587.803 278.756 591.409C281.059 594.985 282.21 599.106 282.21 603.773C282.21 607.409 281.483 610.606 280.028 613.364C278.574 616.091 276.574 618.333 274.028 620.091C271.513 621.818 268.634 623.045 265.392 623.773V624.682C268.938 624.833 272.256 625.833 275.347 627.682C278.468 629.53 280.998 632.121 282.938 635.455C284.877 638.758 285.847 642.697 285.847 647.273C285.847 652.212 284.619 656.621 282.165 660.5C279.741 664.348 276.15 667.394 271.392 669.636C266.634 671.879 260.771 673 253.801 673H214.028ZM233.71 656.909H249.756C255.241 656.909 259.241 655.864 261.756 653.773C264.271 651.652 265.528 648.833 265.528 645.318C265.528 642.742 264.907 640.47 263.665 638.5C262.422 636.53 260.65 634.985 258.347 633.864C256.074 632.742 253.362 632.182 250.21 632.182H233.71V656.909ZM233.71 618.864H248.301C250.998 618.864 253.392 618.394 255.483 617.455C257.604 616.485 259.271 615.121 260.483 613.364C261.725 611.606 262.347 609.5 262.347 607.045C262.347 603.682 261.15 600.97 258.756 598.909C256.392 596.848 253.028 595.818 248.665 595.818H233.71V618.864Z" fill="currentColor"/></svg>';

    var HDR_SVG = '<svg viewBox="-1 178 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="181.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M27.2784 293V199.909H46.9602V238.318H86.9148V199.909H106.551V293H86.9148V254.545H46.9602V293H27.2784ZM155.778 293H122.778V199.909H156.051C165.415 199.909 173.475 201.773 180.233 205.5C186.991 209.197 192.188 214.515 195.824 221.455C199.491 228.394 201.324 236.697 201.324 246.364C201.324 256.061 199.491 264.394 195.824 271.364C192.188 278.333 186.96 283.682 180.142 287.409C173.354 291.136 165.233 293 155.778 293ZM142.46 276.136H154.96C160.778 276.136 165.672 275.106 169.642 273.045C173.642 270.955 176.642 267.727 178.642 263.364C180.672 258.97 181.688 253.303 181.688 246.364C181.688 239.485 180.672 233.864 178.642 229.5C176.642 225.136 173.657 221.924 169.688 219.864C165.718 217.803 160.824 216.773 155.006 216.773H142.46V276.136ZM215.903 293V199.909H252.631C259.661 199.909 265.661 201.167 270.631 203.682C275.631 206.167 279.434 209.697 282.04 214.273C284.676 218.818 285.994 224.167 285.994 230.318C285.994 236.5 284.661 241.818 281.994 246.273C279.328 250.697 275.464 254.091 270.403 256.455C265.373 258.818 259.282 260 252.131 260H227.54V244.182H248.949C252.706 244.182 255.828 243.667 258.312 242.636C260.797 241.606 262.646 240.061 263.858 238C265.1 235.939 265.722 233.379 265.722 230.318C265.722 227.227 265.1 224.621 263.858 222.5C262.646 220.379 260.782 218.773 258.267 217.682C255.782 216.561 252.646 216 248.858 216H235.585V293H215.903ZM266.176 250.636L289.312 293H267.585L244.949 250.636H266.176Z" fill="currentColor"/></svg>';

    // =================================================================
    // Вспомогательные функции
    // =================================================================
    function getRatingClass(rating) {
        var r = parseFloat(rating);
        if (isNaN(r) || r <= 0) return '';
        if (r >= 8.0) return 'rate--green';
        if (r >= 6.5) return 'rate--lime';
        if (r >= 5.0) return 'rate--orange';
        return 'rate--red';
    }

    function formatRating(value) {
        var n = parseFloat(value);
        if (isNaN(n) || n <= 0) return '—';
        if (n === 10) return '10';
        return n.toFixed(1);
    }

    function getTmdbKey() {
        var custom = (Lampa.Storage.get('flixio_tmdb_apikey') || '').trim();
        return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
    }

    function isComponentActive(component) {
        return component && !component.__destroyed;
    }

    function waitForBackground(render, callback) {
        var background = render.find('.full-start__background:not(.applecation__overlay)');
        if (!background.length) return callback();
        if (background.hasClass('loaded') && background.hasClass('applecation-animated')) {
            return callback();
        }
        if (background.hasClass('loaded')) {
            return setTimeout(function() {
                background.addClass('applecation-animated');
                callback();
            }, 350);
        }
        var interval = setInterval(function() {
            if (background.hasClass('loaded')) {
                clearInterval(interval);
                setTimeout(function() {
                    background.addClass('applecation-animated');
                    callback();
                }, 650);
            }
        }, 50);
        setTimeout(function() {
            clearInterval(interval);
            if (!background.hasClass('applecation-animated')) {
                background.addClass('applecation-animated');
                callback();
            }
        }, 2000);
    }

    // =================================================================
    // Получение рейтинга Lampa
    // =================================================================
    function getLampaRating(ratingKey) {
        return new Promise(function(resolve) {
            var request = new Lampa.Reguest();
            request.timeout(10000);
            request.silent('https://cubnotrip.top/api/reactions/get/' + ratingKey, function(data) {
                try {
                    if (data && data.result && Array.isArray(data.result)) {
                        var weightedSum = 0, totalCount = 0;
                        var coef = { fire: 5, nice: 4, think: 3, bore: 2, shit: 1 };
                        data.result.forEach(function(item) {
                            var count = parseInt(item.counter, 10) || 0;
                            var c = coef[item.type] || 0;
                            weightedSum += count * c;
                            totalCount += count;
                        });
                        if (totalCount === 0) { resolve(0); return; }
                        var avgRating = weightedSum / totalCount;
                        var rating10 = (avgRating - 1) * 2.5;
                        resolve(rating10 >= 0 ? parseFloat(rating10.toFixed(1)) : 0);
                    } else {
                        resolve(0);
                    }
                } catch (e) {
                    resolve(0);
                }
            }, function() {
                resolve(0);
            }, false);
        });
    }

    // =================================================================
    // Расчет среднего рейтинга
    // =================================================================
    function calculateAverage(ratings) {
        var weights = {
            tmdb: 0.15,
            imdb: 0.35,
            kp: 0.20,
            lampa: 0.30
        };

        var weightedSum = 0;
        var totalWeight = 0;
        var count = 0;

        for (var key in weights) {
            var val = ratings[key];
            if (val && !isNaN(val) && val > 0) {
                weightedSum += val * weights[key];
                totalWeight += weights[key];
                count++;
            }
        }

        if (totalWeight === 0 || count < 2) return null;
        return parseFloat((weightedSum / totalWeight).toFixed(1));
    }

    // =================================================================
    // Получение метаданных через разные источники
    // =================================================================
    function getMetadataFromJacred(movie) {
        return new Promise(function(resolve) {
            if (!movie || !movie.id) { resolve(null); return; }

            var title = (movie.original_title || movie.title || movie.name || '').toLowerCase();
            var year = (movie.release_date || movie.first_air_date || '').substr(0, 4);

            if (!title || !year) { resolve(null); return; }

            // Проверяем кэш
            var cacheKey = 'jacred_meta_' + movie.id;
            try {
                var cached = Lampa.Storage.get(cacheKey);
                if (cached && cached._ts && (Date.now() - cached._ts < 24 * 60 * 60 * 1000)) {
                    resolve(cached);
                    return;
                }
            } catch (e) {}

            var apiUrl = 'https://jr.maxvol.pro/api/v1.0/torrents?search=' + encodeURIComponent(title) + '&year=' + year;

            var proxyList = [
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?url=',
                'https://api.codetabs.com/v1/proxy?quest='
            ];

            function tryProxy(index) {
                if (index >= proxyList.length) {
                    resolve(null);
                    return;
                }
                var proxy = proxyList[index];
                var url = proxy + encodeURIComponent(apiUrl);

                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.timeout = 10000;
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            processJacredData(data);
                        } catch (e) {
                            tryProxy(index + 1);
                        }
                    } else {
                        tryProxy(index + 1);
                    }
                };
                xhr.onerror = function() { tryProxy(index + 1); };
                xhr.ontimeout = function() { tryProxy(index + 1); };
                xhr.send();
            }

            function processJacredData(data) {
                var results = Array.isArray(data) ? data : (data.Results || []);
                if (!results.length) {
                    resolve(null);
                    return;
                }

                var metadata = {
                    quality: null,
                    audio: null,
                    dub: false,
                    hdr: false,
                    seasonInfo: null
                };

                var qualityPriority = ['4K', 'FHD', 'HD', 'SD'];

                results.forEach(function(item) {
                    var t = (item.title || '').toLowerCase();
                    var q = parseInt(item.quality || 0, 10);

                    var currentQuality = null;
                    if (q >= 2160) currentQuality = '4K';
                    else if (q >= 1440) currentQuality = '2K';
                    else if (q >= 1080) currentQuality = 'FHD';
                    else if (q >= 720) currentQuality = 'HD';

                    if (!currentQuality) {
                        if (t.indexOf('4k') >= 0 || t.indexOf('2160') >= 0) currentQuality = '4K';
                        else if (t.indexOf('1080') >= 0 || t.indexOf('fhd') >= 0) currentQuality = 'FHD';
                        else if (t.indexOf('720') >= 0 || t.indexOf('hd') >= 0) currentQuality = 'HD';
                    }

                    if (currentQuality) {
                        var currentIndex = qualityPriority.indexOf(currentQuality);
                        var bestIndex = qualityPriority.indexOf(metadata.quality);
                        if (bestIndex === -1 || currentIndex < bestIndex) {
                            metadata.quality = currentQuality;
                        }
                    }

                    if (t.indexOf('7.1') >= 0) metadata.audio = '7.1';
                    else if (t.indexOf('5.1') >= 0) metadata.audio = '5.1';
                    else if (t.indexOf('2.0') >= 0 && !metadata.audio) metadata.audio = '2.0';

                    if (t.indexOf('ukr') >= 0 || t.indexOf('укр') >= 0 || t.indexOf('ua') >= 0) {
                        metadata.dub = true;
                    }

                    if (t.indexOf('hdr') >= 0 || t.indexOf('dolby vision') >= 0 || t.indexOf('dovi') >= 0) {
                        metadata.hdr = true;
                    }
                });

                // Получаем информацию о сезонах
                if (movie.name && movie.seasons) {
                    var lastEpisode = movie.last_episode_to_air;
                    if (lastEpisode && lastEpisode.season_number) {
                        var seasonNum = lastEpisode.season_number;
                        var episodeNum = lastEpisode.episode_number || '?';
                        var totalEpisodes = '?';
                        for (var i = 0; i < movie.seasons.length; i++) {
                            if (movie.seasons[i].season_number === seasonNum && movie.seasons[i].episode_count) {
                                totalEpisodes = movie.seasons[i].episode_count;
                                break;
                            }
                        }
                        metadata.seasonInfo = seasonNum + ' сезон ' + episodeNum + '/' + totalEpisodes + ' серий';
                    } else {
                        var seasons = Lampa.Utils.countSeasons(movie);
                        if (seasons) {
                            var t = [2, 0, 1, 1, 1, 2];
                            var forms = ['сезон', 'сезона', 'сезонов'];
                            metadata.seasonInfo = seasons + ' ' + forms[seasons % 100 > 4 && seasons % 100 < 20 ? 2 : t[Math.min(seasons % 10, 5)]];
                        }
                    }
                }

                metadata._ts = Date.now();
                try {
                    Lampa.Storage.set(cacheKey, metadata);
                } catch (e) {}

                resolve(metadata);
            }

            tryProxy(0);
        });
    }

    function getMetadataFromTmdb(movie) {
        return new Promise(function(resolve) {
            if (!movie || !movie.id) { resolve(null); return; }

            var metadata = {
                quality: null,
                audio: null,
                dub: false,
                hdr: false,
                seasonInfo: null
            };

            // Информация о сезонах
            if (movie.name && movie.seasons) {
                var lastEpisode = movie.last_episode_to_air;
                if (lastEpisode && lastEpisode.season_number) {
                    var seasonNum = lastEpisode.season_number;
                    var episodeNum = lastEpisode.episode_number || '?';
                    var totalEpisodes = '?';
                    for (var i = 0; i < movie.seasons.length; i++) {
                        if (movie.seasons[i].season_number === seasonNum && movie.seasons[i].episode_count) {
                            totalEpisodes = movie.seasons[i].episode_count;
                            break;
                        }
                    }
                    metadata.seasonInfo = seasonNum + ' сезон ' + episodeNum + '/' + totalEpisodes + ' серий';
                } else {
                    var seasons = Lampa.Utils.countSeasons(movie);
                    if (seasons) {
                        var t = [2, 0, 1, 1, 1, 2];
                        var forms = ['сезон', 'сезона', 'сезонов'];
                        metadata.seasonInfo = seasons + ' ' + forms[seasons % 100 > 4 && seasons % 100 < 20 ? 2 : t[Math.min(seasons % 10, 5)]];
                    }
                }
            }

            resolve(metadata);
        });
    }

    function getMetadata(movie) {
        var source = getSetting('metadata_source', 'both');

        return new Promise(function(resolve) {
            var result = {
                quality: null,
                audio: null,
                dub: false,
                hdr: false,
                seasonInfo: null
            };

            var promises = [];

            if (source === 'jacred' || source === 'both') {
                promises.push(getMetadataFromJacred(movie).then(function(data) {
                    if (data) {
                        if (data.quality) result.quality = data.quality;
                        if (data.audio) result.audio = data.audio;
                        if (data.dub) result.dub = data.dub;
                        if (data.hdr) result.hdr = data.hdr;
                        if (data.seasonInfo) result.seasonInfo = data.seasonInfo;
                    }
                }));
            }

            if (source === 'tmdb' || source === 'both') {
                promises.push(getMetadataFromTmdb(movie).then(function(data) {
                    if (data && data.seasonInfo) {
                        result.seasonInfo = data.seasonInfo;
                    }
                }));
            }

            Promise.all(promises).then(function() {
                resolve(result);
            });
        });
    }

    // =================================================================
    // Формирование строки с метаданными (без года)
    // =================================================================
    function buildMetadataString(metadata) {
        var parts = [];

        // Сезон и серии (для сериалов)
        if (metadata.seasonInfo) {
            parts.push(metadata.seasonInfo);
        }

        // Качество
        if (metadata.quality) {
            parts.push(metadata.quality);
        }

        // HDR
        if (metadata.hdr) {
            parts.push('HDR');
        }

        // Аудио
        if (metadata.audio) {
            parts.push(metadata.audio);
        }

        // Озвучка
        if (metadata.dub) {
            parts.push('DUB');
        }

        return parts;
    }

    // =================================================================
    // Переопределение Lampa.Api.img (качество постера)
    // =================================================================
    function overrideImageApi() {
        var source = Lampa.Api.sources.tmdb;
        var originalImg = source.img;

        source.img = function(path, size) {
            var quality = getSetting('poster_quality', 'medium');
            var isFace = typeof size === 'string' && size.indexOf('_face') !== -1;
            var isBackdrop = ['w300', 'w780', 'w1280', 'original'].indexOf(size) !== -1 && !isFace;

            var useCustomSize = false;

            if (!isFace && !isBackdrop) {
                if (quality === 'low') {
                    size = isFace ? 'w276_and_h350_face' : 'w300';
                    useCustomSize = true;
                } else if (quality === 'medium') {
                    size = isFace ? 'w600_and_h900_face' : 'w780';
                    useCustomSize = true;
                } else if (quality === 'high') {
                    size = 'original';
                    useCustomSize = true;
                }
            }

            if (isBackdrop) {
                if (quality === 'low' || quality === 'medium') {
                    size = 'w1280';
                    useCustomSize = true;
                } else if (quality === 'high') {
                    size = 'original';
                    useCustomSize = true;
                }
            }

            if (!useCustomSize && size === 'w1280') {
                var posterSize = Lampa.Storage.field('poster_size');
                var map = { w200: 'w780', w300: 'w1280', w500: 'original' };
                size = map[posterSize] || 'w1280';
            }

            if (!useCustomSize && size === 'w300') {
                var posterSize2 = Lampa.Storage.field('poster_size');
                var map2 = { w200: 'w300', w300: 'w780', w500: 'w780' };
                size = map2[posterSize2] || 'w300';
            }

            if (!useCustomSize && isFace && size === 'w500') {
                size = 'w600_and_h900_face';
            }

            return originalImg.call(source, path, size);
        };
    }

    // =================================================================
    // Основная логика
    // =================================================================
    function initPlugin() {
        if (!Lampa.Platform.screen('tv')) {
            console.log('AppleTV+ Pro: TV mode only');
            return;
        }

        overrideImageApi();
        overrideFullStartTemplate();
        injectStyles();
        addSettings();
        patchEpisodes();
        patchButtonWrap();

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                handleFullEvent(e);
            }
        });

        applyInitialSettings();
        console.log('AppleTV+ Pro v' + PLUGIN_VERSION + ' initialized');
    }

    // =================================================================
    // Патч для автопереноса кнопок
    // =================================================================
    function patchButtonWrap() {
        if (window.applecation_button_wrap_patched) return;
        window.applecation_button_wrap_patched = true;

        var style = document.createElement('style');
        style.id = 'applecation_button_wrap';
        style.textContent = `
            .full-start-new__buttons {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 0.5em !important;
                margin-top: 0.5em !important;
            }
            .full-start-new__buttons .full-start__button {
                flex: 0 0 auto !important;
                margin: 0 !important;
            }
            @media (max-width: 720px) {
                .full-start-new__buttons {
                    justify-content: center !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // =================================================================
    // Переопределение шаблона страницы фильма
    // =================================================================
    function overrideFullStartTemplate() {
        var layoutPosition = getSetting('layout_position', 'top');

        // Рейтинги (только названия)
        var ratingsHtml = '<div class="applecation__ratings">' +
            '<div class="full-start__rate rate--tmdb hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_tmdb') + '</div></div>' +
            '<div class="full-start__rate rate--imdb hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_imdb') + '</div></div>' +
            '<div class="full-start__rate rate--kp hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_kp') + '</div></div>' +
            '<div class="full-start__rate rate--lampa hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('rating_lampa') + '</div></div>' +
            '<div class="full-start__rate rate--avg hide"><div class="rating-icon"></div><div class="rating-value"></div><div class="rating-label">' + tr('avg_rating') + '</div></div>' +
            '</div>';

        // Реакции
        var reactionsHtml = '<div class="full-start-new__reactions selector applecation-reactions">' +
            '<div>#{reactions_none}</div>' +
            '</div>';

        // Метаданные (без года)
        var metadataHtml = '<div class="applecation__metadata"></div>';

        // Год (стандартный от Lampa)
        var yearHtml = '<div class="applecation__year"></div>';

        // Контентная часть (логотип + информация)
        var contentHtml = 
            '<div class="applecation__logo"></div>' +
            '<div class="applecation__content-wrapper">' +
                '<div class="full-start-new__title" style="display: none;">{title}</div>' +
                '<div class="applecation__meta">' +
                    '<div class="applecation__meta-left">' +
                        '<span class="applecation__network"></span>' +
                        '<span class="applecation__meta-text"></span>' +
                        '<div class="full-start__pg hide"></div>' +
                    '</div>' +
                '</div>' +
                ratingsHtml +
                reactionsHtml +
                metadataHtml +
                '<div class="applecation__description-wrapper">' +
                    '<div class="applecation__description"></div>' +
                '</div>' +
                '<div class="applecation__info"></div>' +
            '</div>';

        // Кнопки
        var buttonsHtml = 
            '<div class="full-start-new__buttons">' +
                '<div class="full-start__button selector button--play">' +
                    '<svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="14" cy="14.5" r="13" stroke="currentColor" stroke-width="2.7"/>' +
                        '<path d="M18.0739 13.634C18.7406 14.0189 18.7406 14.9811 18.0739 15.366L11.751 19.0166C11.0843 19.4015 10.251 18.9204 10.251 18.1506L10.251 10.8494C10.251 10.0796 11.0843 9.5985 11.751 9.9834L18.0739 13.634Z" fill="currentColor"/>' +
                    '</svg>' +
                    '<span>#{title_watch}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--book">' +
                    '<svg width="21" height="32" viewBox="0 0 21 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M2 1.5H19C19.2761 1.5 19.5 1.72386 19.5 2V27.9618C19.5 28.3756 19.0261 28.6103 18.697 28.3595L12.6212 23.7303C11.3682 22.7757 9.63183 22.7757 8.37885 23.7303L2.30302 28.3595C1.9739 28.6103 1.5 28.3756 1.5 27.9618V2C1.5 1.72386 1.72386 1.5 2 1.5Z" stroke="currentColor" stroke-width="2.5"/>' +
                    '</svg>' +
                    '<span>#{settings_input_links}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--reaction">' +
                    '<svg width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M37.208 10.9742C37.1364 10.8013 37.0314 10.6441 36.899 10.5117C36.7666 10.3794 36.6095 10.2744 36.4365 10.2028L12.0658 0.108375C11.7166 -0.0361828 11.3242 -0.0361227 10.9749 0.108542C10.6257 0.253206 10.3482 0.530634 10.2034 0.879836L0.108666 25.2507C0.0369593 25.4236 3.37953e-05 25.609 2.3187e-08 25.7962C-3.37489e-05 25.9834 0.0368249 26.1688 0.108469 26.3418C0.180114 26.5147 0.28514 26.6719 0.417545 26.8042C0.54995 26.9366 0.707139 27.0416 0.880127 27.1131L17.2452 33.8917C17.5945 34.0361 17.9869 34.0361 18.3362 33.8917L29.6574 29.2017C29.8304 29.1301 29.9875 29.0251 30.1199 28.8928C30.2523 28.7604 30.3573 28.6032 30.4289 28.4303L37.2078 12.065C37.2795 11.8921 37.3164 11.7068 37.3164 11.5196C37.3165 11.3325 37.2796 11.1471 37.208 10.9742ZM20.425 29.9407L21.8784 26.4316L25.3873 27.885L20.425 29.9407ZM28.3407 26.0222L21.6524 23.252C21.3031 23.1075 20.9107 23.1076 20.5615 23.2523C20.2123 23.3969 19.9348 23.6743 19.79 24.0235L17.0194 30.7123L3.28783 25.0247L12.2918 3.28773L34.0286 12.2912L28.3407 26.0222Z" fill="currentColor"/>' +
                        '<path d="M25.3493 16.976L24.258 14.3423L16.959 17.3666L15.7196 14.375L13.0859 15.4659L15.4161 21.0916L25.3493 16.976Z" fill="currentColor"/>' +
                    '</svg>' +
                    '<span>#{title_reactions}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--subscribe hide">' +
                    '<svg width="25" height="30" viewBox="0 0 25 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M6.01892 24C6.27423 27.3562 9.07836 30 12.5 30C15.9216 30 18.7257 27.3562 18.981 24H15.9645C15.7219 25.6961 14.2632 27 12.5 27C10.7367 27 9.27804 25.6961 9.03542 24H6.01892Z" fill="currentColor"/>' +
                        '<path d="M3.81972 14.5957V10.2679C3.81972 5.41336 7.7181 1.5 12.5 1.5C17.2819 1.5 21.1803 5.41336 21.1803 10.2679V14.5957C21.1803 15.8462 21.5399 17.0709 22.2168 18.1213L23.0727 19.4494C24.2077 21.2106 22.9392 23.5 20.9098 23.5H4.09021C2.06084 23.5 0.792282 21.2106 1.9273 19.4494L2.78317 18.1213C3.46012 17.0709 3.81972 15.8462 3.81972 14.5957Z" stroke="currentColor" stroke-width="2.5"/>' +
                    '</svg>' +
                    '<span>#{title_subscribe}</span>' +
                '</div>' +
                '<div class="full-start__button selector button--options">' +
                    '<svg width="38" height="10" viewBox="0 0 38 10" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<circle cx="4.88968" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                        '<circle cx="18.9746" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                        '<circle cx="33.0596" cy="4.98563" r="4.75394" fill="currentColor"/>' +
                    '</svg>' +
                '</div>' +
            '</div>';

        // Сборка шаблона в зависимости от положения
        var bodyContent;
        if (layoutPosition === 'top') {
            bodyContent = contentHtml + buttonsHtml;
        } else {
            bodyContent = buttonsHtml + contentHtml;
        }

        var template = '<div class="full-start-new applecation">\n' +
            '    <div class="full-start-new__body">\n' +
            '        <div class="full-start-new__left hide">\n' +
            '            <div class="full-start-new__poster">\n' +
            '                <img class="full-start-new__img full--poster" />\n' +
            '            </div>\n' +
            '        </div>\n' +
            '        <div class="full-start-new__right">\n' +
            '            <div class="applecation__left">\n' +
            '                ' + bodyContent + '\n' +
            '                <div class="full-start-new__head" style="display: none;"></div>\n' +
            '                <div class="full-start-new__details" style="display: none;"></div>\n' +
            '            </div>\n' +
            '            <div class="applecation__right">\n' +
            '                <div class="full-start-new__rate-line">\n' +
            '                    <div class="full-start__status hide"></div>\n' +
            '                </div>\n' +
            '                <div class="rating--modss" style="display: none;"></div>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '    <div class="hide buttons--container">\n' +
            '        <div class="full-start__button view--torrent hide">\n' +
            '            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">\n' +
            '                <path d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z" fill="currentColor"/>\n' +
            '            </svg>\n' +
            '            <span>#{full_torrents}</span>\n' +
            '        </div>\n' +
            '        <div class="full-start__button selector view--trailer">\n' +
            '            <svg height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
            '                <path fill-rule="evenodd" clip-rule="evenodd" d="M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z" fill="currentColor"/>\n' +
            '            </svg>\n' +
            '            <span>#{full_trailers}</span>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';

        Lampa.Template.add('full_start_new', template);
        Lampa.Template.add('applecation_overlay', '\n            <div class="applecation-description-overlay">\n                <div class="applecation-description-overlay__bg"></div>\n                <div class="applecation-description-overlay__content selector">\n                    <div class="applecation-description-overlay__logo"></div>\n                    <div class="applecation-description-overlay__title">{title}</div>\n                    <div class="applecation-description-overlay__text">{text}</div>\n                    <div class="applecation-description-overlay__details">\n                        <div class="applecation-description-overlay__info">\n                            <div class="applecation-description-overlay__info-name">#{full_date_of_release}</div>\n                            <div class="applecation-description-overlay__info-body">{relise}</div>\n                        </div>\n                        <div class="applecation-description-overlay__info applecation--budget">\n                            <div class="applecation-description-overlay__info-name">#{full_budget}</div>\n                            <div class="applecation-description-overlay__info-body">{budget}</div>\n                        </div>\n                        <div class="applecation-description-overlay__info applecation--countries">\n                            <div class="applecation-description-overlay__info-name">#{full_countries}</div>\n                            <div class="applecation-description-overlay__info-body">{countries}</div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        ');
    }

    // =================================================================
    // Обработка события full
    // =================================================================
    function handleFullEvent(e) {
        var activity = e.object && e.object.activity;
        if (!activity || !activity.render) return;

        var render = activity.render();
        if (!render || !render.length) return;

        activity.__destroyed = false;
        var oldDestroy = activity.destroy;
        activity.destroy = function() {
            activity.__destroyed = true;
            if (oldDestroy) oldDestroy.apply(activity, arguments);
        };

        render.addClass('applecation');
        applyScaling();

        var bg = render.find('.full-start__background:not(.applecation__overlay)');
        if (bg.length && !bg.next('.applecation__overlay').length) {
            bg.after('<div class="full-start__background loaded applecation__overlay"></div>');
        }

        var movie = e.data && e.data.movie;
        if (!movie) return;

        fillMeta(render, movie);
        loadMetadata(render, movie);
        fillDescription(render, movie);
        fillInfo(render, movie);
        loadLogo(render, movie);
        loadRatings(render, movie);
        applyRatingsDisplayMode(render);
        setupScrollDim(render);
        applyMarquee(render);

        waitForBackground(render, function() {
            if (!isComponentActive(activity)) return;
            render.find('.applecation__meta').addClass('show');
            render.find('.applecation__description-wrapper').addClass('show');
            render.find('.applecation__info').addClass('show');
            render.find('.applecation__ratings').addClass('show');
        });
    }

    // =================================================================
    // Заполнение мета-информации
    // =================================================================
    function fillMeta(render, movie) {
        var metaText = render.find('.applecation__meta-text');
        if (!metaText.length) return;

        var parts = [];
        parts.push(movie.name ? 'Сериал' : 'Фильм');

        if (movie.genres && movie.genres.length) {
            var genres = movie.genres.slice(0, 2).map(function(g) {
                return Lampa.Utils.capitalizeFirstLetter(g.name);
            });
            parts = parts.concat(genres);
        }

        metaText.html(parts.join(' · '));

        var networkNode = render.find('.applecation__network');
        if (networkNode.length) {
            var logo = null;
            if (movie.networks && movie.networks.length && movie.networks[0].logo_path) {
                logo = movie.networks[0];
            } else if (movie.production_companies && movie.production_companies.length && movie.production_companies[0].logo_path) {
                logo = movie.production_companies[0];
            }

            if (logo) {
                var imgUrl = Lampa.Api.img(logo.logo_path, 'w200');
                networkNode.html('<img src="' + imgUrl + '" alt="' + logo.name + '">');
            } else {
                networkNode.remove();
            }
        }
    }

    // =================================================================
    // Загрузка метаданных
    // =================================================================
    function loadMetadata(render, movie) {
        if (!getSetting('show_metadata', true)) {
            render.find('.applecation__metadata').empty();
            return;
        }

        var metadataEl = render.find('.applecation__metadata');
        if (!metadataEl.length) return;

        metadataEl.html('<span class="metadata-loading">' + tr('loading') + '</span>');

        getMetadata(movie).then(function(metadata) {
            var parts = buildMetadataString(metadata);
            if (parts.length) {
                var html = '';
                parts.forEach(function(part) {
                    var icon = '';
                    if (part === '4K' || part === 'FHD' || part === 'HD') {
                        icon = QUALITY_SVGS[part] || '';
                    } else if (part === '7.1' || part === '5.1' || part === '2.0') {
                        icon = AUDIO_SVGS[part] || '';
                    } else if (part === 'DUB') {
                        icon = DUB_SVG;
                    } else if (part === 'HDR') {
                        icon = HDR_SVG;
                    } else {
                        // Информация о сезонах и другие текстовые метки
                        html += '<span class="metadata-badge metadata-text">' + part + '</span>';
                        return;
                    }

                    if (icon) {
                        html += '<span class="metadata-badge">' + icon + '</span>';
                    } else {
                        html += '<span class="metadata-badge metadata-text">' + part + '</span>';
                    }
                });

                metadataEl.html(html);
            } else {
                metadataEl.empty();
            }
        });
    }

    // =================================================================
    // Заполнение описания
    // =================================================================
    function fillDescription(render, movie) {
        var text = movie.overview || '';
        var descEl = render.find('.applecation__description');
        if (descEl.length) descEl.text(text);

        var wrap = render.find('.applecation__description-wrapper');
        if (!wrap.length) return;

        wrap.off('hover:enter');
        $('.applecation-description-overlay').remove();

        if (!text || !getSetting('description_overlay', true)) return;

        var title = movie.title || movie.name;
        var dateStr = (movie.release_date || movie.first_air_date || '') + '';
        var rel = dateStr.length > 3 ? Lampa.Utils.parseTime(dateStr).full : (dateStr.length > 0 ? dateStr : 'Неизвестно');
        var budget = '$ ' + Lampa.Utils.numberWithSpaces(movie.budget || 0);
        var countries = (movie.production_countries || []).map(function(c) {
            var key = 'country_' + c.iso_3166_1.toLowerCase();
            var t = Lampa.Lang.translate(key);
            return t !== key ? t : c.name;
        }).join(', ');

        var overlay = $(Lampa.Template.get('applecation_overlay', {
            title: title,
            text: text,
            relise: rel,
            budget: budget,
            countries: countries
        }));

        if (!movie.budget || movie.budget === 0) overlay.find('.applecation--budget').remove();
        if (!countries) overlay.find('.applecation--countries').remove();

        $('body').append(overlay);
        overlay.data('controller-created', false);

        wrap.addClass('selector');
        if (Lampa.Controller && Lampa.Controller.collectionAppend) {
            Lampa.Controller.collectionAppend(wrap);
        }

        wrap.on('hover:enter', function() {
            var el = $('.applecation-description-overlay');
            if (!el.length) return;

            setTimeout(function() { el.addClass('show'); }, 10);

            if (!el.data('controller-created') && Lampa.Controller) {
                var ctrl = {
                    toggle: function() {
                        Lampa.Controller.collectionSet(el);
                        Lampa.Controller.collectionFocus(el.find('.applecation-description-overlay__content'), el);
                    },
                    back: function() {
                        var ol = $('.applecation-description-overlay');
                        if (!ol.length) return;
                        ol.removeClass('show');
                        setTimeout(function() { Lampa.Controller.toggle('content'); }, 300);
                    }
                };
                Lampa.Controller.add('applecation_description', ctrl);
                el.data('controller-created', true);
            }

            if (Lampa.Controller) Lampa.Controller.toggle('applecation_description');
        });
    }

    // =================================================================
    // Заполнение информации (без года, он уже есть в метаданных)
    // =================================================================
    function fillInfo(render, movie) {
        var info = render.find('.applecation__info');
        if (!info.length) return;

        var parts = [];

        if (movie.name) {
            if (movie.episode_run_time && movie.episode_run_time.length) {
                var m = movie.episode_run_time[0];
                var tm = Lampa.Lang.translate('time_m').replace('.', '');
                parts.push(m + ' ' + tm);
            }
        } else if (movie.runtime && movie.runtime > 0) {
            var h = Math.floor(movie.runtime / 60);
            var mm = movie.runtime % 60;
            var th = Lampa.Lang.translate('time_h').replace('.', '');
            var tmm = Lampa.Lang.translate('time_m').replace('.', '');
            parts.push(h > 0 ? (h + ' ' + th + ' ' + mm + ' ' + tmm) : (mm + ' ' + tmm));
        }

        info.html(parts.length ? parts.join(' · ') : '');
    }

    // =================================================================
    // Загрузка логотипа
    // =================================================================
    function loadLogo(render, movie) {
        var logo = render.find('.applecation__logo');
        var titleEl = render.find('.full-start-new__title');
        if (!logo.length) return;

        var done = false;
        var timer = setTimeout(function() {
            if (done) return;
            done = true;
            titleEl.show();
            logo.addClass('loaded');
        }, 3000);

        var type = movie.name ? 'tv' : 'movie';
        var lang = Lampa.Storage.get('language', 'ru') || 'ru';
        var url = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey() + '&language=' + lang);
        var urlAll = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey());

        function getLogoSize() {
            var quality = getSetting('poster_quality', 'medium');
            if (quality === 'low') return 'w300';
            if (quality === 'medium') return 'w500';
            return 'original';
        }

        function applyLogo(data) {
            if (done) return;
            if (!render.closest('body').length) return;

            var filePath = data && data.logos && data.logos[0] && data.logos[0].file_path;
            if (filePath) {
                var imgUrl = Lampa.TMDB.image('/t/p/' + getLogoSize() + filePath);
                var img = new Image();
                img.onload = function() {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    if (!render.closest('body').length) return;

                    logo.html('<img src="' + imgUrl + '" alt="" />');

                    waitForBackground(render, function() {
                        if (!render.closest('body').length) return;
                        logo.addClass('loaded');
                    });

                    var overlay = $('.applecation-description-overlay');
                    if (overlay.length) {
                        overlay.find('.applecation-description-overlay__logo')
                            .html($('<img>').attr('src', imgUrl))
                            .css('display', 'block');
                        overlay.find('.applecation-description-overlay__title').css('display', 'none');
                    }
                };
                img.onerror = function() {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    titleEl.show();
                    waitForBackground(render, function() {
                        if (!render.closest('body').length) return;
                        logo.addClass('loaded');
                    });
                };
                img.src = imgUrl;
            } else {
                done = true;
                clearTimeout(timer);
                titleEl.show();
                waitForBackground(render, function() {
                    if (!render.closest('body').length) return;
                    logo.addClass('loaded');
                });
            }
        }

        $.get(url, function(data) {
            if (data && data.logos && data.logos.length) {
                applyLogo(data);
            } else {
                $.get(urlAll, function(dataAll) {
                    applyLogo(dataAll || data);
                }).fail(function() {
                    applyLogo(data);
                });
            }
        }).fail(function() {
            if (done) return;
            done = true;
            clearTimeout(timer);
            titleEl.show();
            waitForBackground(render, function() {
                if (!render.closest('body').length) return;
                logo.addClass('loaded');
            });
        });
    }

    // =================================================================
    // Загрузка рейтингов
    // =================================================================
    function loadRatings(render, movie) {
        if (!getSetting('show_ratings', true)) {
            render.find('.applecation__ratings').addClass('hide');
            return;
        }

        var rateLine = render.find('.applecation__ratings');
        if (!rateLine.length) return;

        var ratings = {
            tmdb: movie.vote_average || 0,
            imdb: movie.imdb_rating || 0,
            kp: movie.kp_rating || 0,
            lampa: 0
        };

        var ratingElements = {
            tmdb: rateLine.find('.rate--tmdb'),
            imdb: rateLine.find('.rate--imdb'),
            kp: rateLine.find('.rate--kp'),
            lampa: rateLine.find('.rate--lampa'),
            avg: rateLine.find('.rate--avg')
        };

        function updateRatingElement(el, value, iconSvg) {
            if (!el.length) return;

            var formatted = formatRating(value);
            var colorClass = getRatingClass(value);

            var iconEl = el.find('.rating-icon');
            if (iconEl.length && iconSvg) {
                iconEl.html(iconSvg);
            }

            var valEl = el.find('.rating-value');
            if (valEl.length) {
                valEl.text(formatted);
                valEl.removeClass('rate--green rate--lime rate--orange rate--red');
                if (colorClass) {
                    valEl.addClass(colorClass);
                }
            }

            if (value > 0) {
                el.removeClass('hide');
            } else {
                el.addClass('hide');
            }
        }

        updateRatingElement(ratingElements.tmdb, ratings.tmdb, SVG_ICONS.tmdb);

        if (ratings.imdb > 0) {
            updateRatingElement(ratingElements.imdb, ratings.imdb, SVG_ICONS.imdb);
        }
        if (ratings.kp > 0) {
            updateRatingElement(ratingElements.kp, ratings.kp, SVG_ICONS.kp);
        }

        var type = movie.name ? 'tv' : 'movie';
        var ratingKey = type + '_' + movie.id;

        getLampaRating(ratingKey).then(function(lampaRating) {
            if (lampaRating > 0) {
                ratings.lampa = lampaRating;
                updateRatingElement(ratingElements.lampa, lampaRating, SVG_ICONS.lampa);
            }

            var avg = calculateAverage(ratings);
            if (avg !== null) {
                updateRatingElement(ratingElements.avg, avg, SVG_ICONS.avg);
            }

            applyRatingsDisplayMode(render);
        });

        setTimeout(function() {
            if (ratingElements.lampa.hasClass('hide')) {
                var avg = calculateAverage(ratings);
                if (avg !== null) {
                    updateRatingElement(ratingElements.avg, avg, SVG_ICONS.avg);
                }
                applyRatingsDisplayMode(render);
            }
        }, 5000);
    }

    // =================================================================
    // Применение режима отображения рейтингов (только названия)
    // =================================================================
    function applyRatingsDisplayMode(render) {
        var mode = getSetting('ratings_display_mode', 'labels');
        var ratings = render.find('.applecation__ratings');

        ratings.find('.full-start__rate').each(function() {
            var el = $(this);
            var icon = el.find('.rating-icon');
            var label = el.find('.rating-label');

            // Всегда показываем только названия
            icon.hide();
            label.show();
        });
    }

    // =================================================================
    // Настройка скролла
    // =================================================================
    function setupScrollDim(render) {
        var bg = render.find('.full-start__background:not(.applecation__overlay)')[0];
        var scroll = render.find('.scroll__body')[0];
        if (!bg || !scroll) return;

        var dim = false;
        var desc = Object.getOwnPropertyDescriptor(scroll.style, '-webkit-transform') ||
                   Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'webkitTransform');

        Object.defineProperty(scroll.style, '-webkit-transform', {
            set: function(v) {
                if (v) {
                    var s = v.indexOf(',') + 1;
                    var e = v.indexOf(',', s);
                    if (s > 0 && e > s) {
                        var isDown = parseFloat(v.substring(s, e)) < 0;
                        if (isDown !== dim) {
                            dim = isDown;
                            bg.classList.toggle('dim', isDown);
                        }
                    }
                }
                if (desc && desc.set) desc.set.call(this, v);
                else this.setProperty('-webkit-transform', v);
            },
            get: function() {
                return desc && desc.get ? desc.get.call(this) : this.getPropertyValue('-webkit-transform');
            },
            configurable: true
        });
    }

    // =================================================================
    // Бегущая строка для актеров
    // =================================================================
    function applyMarquee(render) {
        var names = render.find('.full-person__name');

        names.each(function() {
            var n = $(this);
            if (n.hasClass('marquee-processed')) {
                var t = n.find('span').first().text();
                if (t) {
                    n.text(t);
                    n.removeClass('marquee-processed marquee-active');
                    n.css('--marquee-duration', '');
                }
            }
        });

        setTimeout(function() {
            names.each(function() {
                var n = $(this);
                var txt = n.text().trim();
                if (!txt) return;

                if (n[0].scrollWidth > n[0].clientWidth + 1) {
                    var dur = Math.min(Math.max(0.25 * txt.length, 5), 20);
                    n.addClass('marquee-processed marquee-active');
                    n.css('--marquee-duration', dur + 's');

                    var s1 = $('<span>').text(txt);
                    var s2 = $('<span>').text(txt);
                    var inner = $('<div class="marquee__inner">').append(s1).append(s2);
                    n.empty().append(inner);
                } else {
                    n.addClass('marquee-processed');
                }
            });
        }, 100);
    }

    // =================================================================
    // Масштабирование
    // =================================================================
    function applyScaling() {
        var logoScale = parseInt(getSetting('logo_scale', 100));
        var textScale = parseInt(getSetting('text_scale', 100));
        var spacingScale = parseInt(getSetting('spacing_scale', 100));
        var ratingsSize = parseInt(getSetting('ratings_size', 100));
        var reactionsSize = parseInt(getSetting('reactions_size', 100));

        $('style[data-id="applecation_scales"]').remove();

        var css = '<style data-id="applecation_scales">\n' +
            '.applecation .applecation__logo img {\n' +
            '    max-width: ' + (35 * logoScale / 100) + 'vw !important;\n' +
            '    max-height: ' + (180 * logoScale / 100) + 'px !important;\n' +
            '}\n' +
            '.applecation .applecation__content-wrapper {\n' +
            '    font-size: ' + textScale + '% !important;\n' +
            '}\n' +
            '.applecation .full-start-new__title {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__meta {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings {\n' +
            '    margin-bottom: ' + (0.3 * spacingScale / 100) + 'em !important;\n' +
            '    gap: ' + (0.8 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings .full-start__rate {\n' +
            '    gap: ' + (0.4 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings .rating-icon {\n' +
            '    width: ' + (1.4 * ratingsSize / 100) + 'em !important;\n' +
            '    height: ' + (1.4 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings .rating-value {\n' +
            '    font-size: ' + (0.95 * ratingsSize / 100) + 'em !important;\n' +
            '    padding: ' + (0.1 * ratingsSize / 100) + 'em ' + (0.4 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__ratings .rating-label {\n' +
            '    font-size: ' + (0.7 * ratingsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation-reactions {\n' +
            '    gap: ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '    margin-top: ' + (0.2 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation-reactions .reaction {\n' +
            '    gap: ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '    padding: ' + (0.2 * reactionsSize / 100) + 'em ' + (0.6 * reactionsSize / 100) + 'em ' + (0.2 * reactionsSize / 100) + 'em ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation-reactions .reaction__icon {\n' +
            '    width: ' + (1.8 * reactionsSize / 100) + 'em !important;\n' +
            '    height: ' + (1.8 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation-reactions .reaction__count {\n' +
            '    font-size: ' + (0.85 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__description {\n' +
            '    max-width: ' + (35 * textScale / 100) + 'vw !important;\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__info {\n' +
            '    margin-bottom: ' + (0.5 * spacingScale / 100) + 'em !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata {\n' +
            '    gap: ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '    margin: ' + (0.3 * reactionsSize / 100) + 'em 0 ' + (0.5 * spacingScale / 100) + 'em 0 !important;\n' +
            '}\n' +
            '.applecation .applecation__metadata .metadata-badge {\n' +
            '    height: ' + (1.2 * reactionsSize / 100) + 'em !important;\n' +
            '    padding: ' + (0.1 * reactionsSize / 100) + 'em ' + (0.3 * reactionsSize / 100) + 'em !important;\n' +
            '}\n' +
            '</style>';

        $('body').append(css);
    }

    // =================================================================
    // Патчинг эпизодов
    // =================================================================
    function patchEpisodes() {
        if (window.applecation_episodes_patched) return;
        window.applecation_episodes_patched = true;

        if (!Lampa.Utils || typeof Lampa.Utils.createInstance !== 'function') return;

        var originalCreateInstance = Lampa.Utils.createInstance;

        Lampa.Utils.createInstance = function(component, data, settings, params) {
            var isEpisodes = false;
            try {
                if (data && data.results && Array.isArray(data.results) && data.results.length) {
                    var count = 0;
                    for (var i = 0; i < data.results.length; i++) {
                        var item = data.results[i];
                        if (item && (
                            typeof item.episode_number === 'number' ||
                            typeof item.season_number === 'number' ||
                            item.comeing ||
                            item.air_date
                        )) {
                            count++;
                        }
                    }
                    if (count >= 3) isEpisodes = true;
                }
            } catch (e) {}

            if (isEpisodes && getSetting('reverse_episodes', true)) {
                try {
                    var results = data.results || [];
                    var coming = [];
                    var regular = [];

                    for (var j = 0; j < results.length; j++) {
                        if (results[j] && results[j].comeing) {
                            coming.push(results[j]);
                        } else {
                            regular.push(results[j]);
                        }
                    }

                    regular.sort(function(a, b) {
                        return (a.episode_number || 0) - (b.episode_number || 0);
                    });

                    data.results = regular.concat(coming);
                } catch (e) {}
            }

            var result = originalCreateInstance.call(this, component, data, settings, params);

            if (isEpisodes && result && result.scroll && typeof result.scroll.append === 'function') {
                var originalAppend = result.scroll.append.bind(result.scroll);
                result.scroll.append = function(element) {
                    var el = element instanceof jQuery ? element[0] : element;
                    if (el && el.classList && el.classList.contains('card-more')) {
                        return originalAppend(element);
                    }

                    var body = typeof result.scroll.body === 'function' ? result.scroll.body(true) : null;
                    if (body) {
                        var moreBtn = body.querySelector('.card-more');
                        if (moreBtn && el && el !== moreBtn) {
                            body.insertBefore(el, moreBtn);
                            return;
                        }
                    }

                    return originalAppend(element);
                };
            }

            return result;
        };
    }

    // =================================================================
    // Применение начальных настроек
    // =================================================================
    function applyInitialSettings() {
        if (!getSetting('show_ratings', true)) {
            $('body').addClass('applecation--hide-ratings');
        }

        applyScaling();

        $('.applecation__ratings').each(function() {
            applyRatingsDisplayMode($(this).closest('.full-start-new'));
        });
    }

    // =================================================================
    // Инжект стилей
    // =================================================================
    function injectStyles() {
        var css = `
        <style id="applecation_styles">
            .applecation { transition: all .3s; }
            .applecation .full-start-new__body { height: 80vh; }
            .applecation .full-start-new__right { display: flex; align-items: flex-end; }
            .applecation .full-start-new__title { font-size: 2.5em; font-weight: 700; line-height: 1.2; margin-bottom: 0.5em; text-shadow: 0 0 .1em rgba(0,0,0,0.3); }
            
            .applecation__logo { margin-bottom: 0.5em; opacity: 0; transform: translateY(20px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
            .applecation__logo.loaded { opacity: 1; transform: translateY(0); }
            .applecation__logo img { display: block; max-width: 35vw; max-height: 180px; width: auto; height: auto; object-fit: contain; object-position: left center; }
            
            .applecation__content-wrapper { font-size: 100%; }
            
            .applecation__meta { display: flex; align-items: center; color: #fff; font-size: 1.1em; margin-bottom: 0.5em; line-height: 1; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; transition-delay: 0.05s; }
            .applecation__meta.show { opacity: 1; transform: translateY(0); }
            .applecation__meta-left { display: flex; align-items: center; line-height: 1; }
            .applecation__network { display: inline-flex; align-items: center; line-height: 1; }
            .applecation__network img { display: block; max-height: 0.8em; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
            .applecation__meta-text { margin-left: 1em; line-height: 1; }
            .applecation__meta .full-start__pg { margin: 0 0 0 0.6em; padding: 0.2em 0.5em; font-size: 0.85em; font-weight: 600; border: 1.5px solid rgba(255,255,255,0.4); border-radius: 0.3em; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.9); line-height: 1; vertical-align: middle; }
            
            .applecation__ratings { display: flex; align-items: center; flex-wrap: wrap; gap: 0.8em; margin-bottom: 0.3em; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; transition-delay: 0.08s; }
            .applecation__ratings.show { opacity: 1; transform: translateY(0); }
            .applecation__ratings .full-start__rate { display: flex !important; align-items: center !important; gap: 0.4em !important; margin: 0 !important; padding: 0 !important; background: none !important; }
            .applecation__ratings .full-start__rate.hide { display: none !important; }
            .applecation__ratings .rating-icon { width: 1.4em; height: 1.4em; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
            .applecation__ratings .rating-icon svg { width: 100%; height: 100%; display: block; }
            .applecation__ratings .rating-value { font-size: 0.95em; font-weight: 700; line-height: 1; color: #fff; padding: 0.1em 0.4em; border-radius: 0.3em; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); }
            .applecation__ratings .rating-value.rate--green { color: #4caf50; border-color: rgba(76,175,80,0.3); background: rgba(76,175,80,0.15); }
            .applecation__ratings .rating-value.rate--lime { color: #cddc39; border-color: rgba(205,220,57,0.3); background: rgba(205,220,57,0.15); }
            .applecation__ratings .rating-value.rate--orange { color: #ff9800; border-color: rgba(255,152,0,0.3); background: rgba(255,152,0,0.15); }
            .applecation__ratings .rating-value.rate--red { color: #f44336; border-color: rgba(244,67,54,0.3); background: rgba(244,67,54,0.15); }
            .applecation__ratings .rating-label { font-size: 0.7em; opacity: 0.6; color: #fff; margin-left: 0.1em; }
            
            .applecation-reactions { margin-top: 0.2em !important; display: flex !important; flex-wrap: wrap !important; gap: 0.3em !important; }
            .applecation-reactions > div { display: block !important; }
            .applecation-reactions .reaction { display: flex !important; align-items: center !important; gap: 0.3em !important; background: rgba(255,255,255,0.08) !important; border-radius: 2em !important; padding: 0.2em 0.6em 0.2em 0.3em !important; }
            .applecation-reactions .reaction__icon { width: 1.8em !important; height: 1.8em !important; border-radius: 50% !important; background: rgba(0,0,0,0.3) !important; padding: 0.3em !important; }
            .applecation-reactions .reaction__icon img { width: 100% !important; height: 100% !important; object-fit: contain !important; }
            .applecation-reactions .reaction__count { font-size: 0.85em !important; font-weight: 600 !important; color: #fff !important; }
            
            .applecation__metadata { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3em; margin: 0.3em 0 0.5em 0; }
            .applecation__metadata .metadata-badge { display: inline-flex; align-items: center; height: 1.2em; padding: 0.1em 0.3em; border-radius: 0.2em; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); }
            .applecation__metadata .metadata-badge svg { height: 100%; width: auto; display: block; }
            .applecation__metadata .metadata-text { font-size: 0.7em; color: rgba(255,255,255,0.7); font-weight: 500; }
            .applecation__metadata .metadata-loading { font-size: 0.7em; color: rgba(255,255,255,0.4); }
            
            .applecation__description-wrapper { background-color: transparent; padding: 0; border-radius: 1em; width: fit-content; opacity: 0; transform: translateY(15px); transition: padding 0.25s ease, transform 0.25s ease, opacity 0.4s ease-out; transition-delay: 0.1s; }
            .applecation__description-wrapper.show { opacity: 1; transform: translateY(0); }
            .applecation__description-wrapper.focus { background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.18)); padding: .15em .4em 0 .7em; border-radius: 1em; width: fit-content; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35); transform: scale(1.07) translateY(0); transition-delay: 0s; }
            .applecation__description { color: rgba(255,255,255,0.6); font-size: 0.95em; line-height: 1.5; margin-bottom: 0.5em; max-width: 35vw; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
            .focus .applecation__description { color: rgba(255,255,255,0.92); }
            
            .applecation__info { color: rgba(255,255,255,0.75); font-size: 1em; line-height: 1.4; margin-bottom: 0.5em; opacity: 0; transform: translateY(15px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; transition-delay: 0.15s; }
            .applecation__info.show { opacity: 1; transform: translateY(0); }
            
            .applecation__left { flex-grow: 1; }
            .applecation__right { display: flex; align-items: center; flex-shrink: 0; position: relative; }
            
            .applecation .full-start-new__rate-line { margin: 0; height: 0; overflow: hidden; opacity: 0; pointer-events: none; }
            
            .full-start__background { height: calc(100% + 6em); left: 0 !important; opacity: 0 !important; transition: opacity 0.6s ease-out, filter 0.3s ease-out !important; animation: none !important; transform: none !important; will-change: opacity, filter; }
            .full-start__background.loaded:not(.dim) { opacity: 1 !important; }
            .full-start__background.dim { filter: blur(30px); }
            .full-start__background.loaded.applecation-animated { opacity: 1 !important; }
            body:not(.menu--open) .full-start__background { mask-image: none; }
            body.advanced--animation:not(.no--animation) .full-start__background.loaded { animation: none !important; }
            
            .applecation__overlay { width: 90vw; background: linear-gradient(to right, rgba(0,0,0,0.792) 0%, rgba(0,0,0,0.504) 25%, rgba(0,0,0,0.264) 45%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0.043) 60%, rgba(0,0,0,0) 65%); }
            
            .applecation-description-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.3s ease, visibility 0.3s ease; }
            .applecation-description-overlay.show { opacity: 1; visibility: visible; pointer-events: all; }
            .applecation-description-overlay__bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; backdrop-filter: blur(100px); }
            .applecation-description-overlay__content { position: relative; z-index: 1; max-width: 60vw; max-height: 90vh; overflow-y: auto; }
            .applecation-description-overlay__logo { text-align: center; margin-bottom: 1.5em; display: none; }
            .applecation-description-overlay__logo img { max-width: 40vw; max-height: 150px; width: auto; height: auto; object-fit: contain; }
            .applecation-description-overlay__title { font-size: 2em; font-weight: 600; margin-bottom: 1em; color: #fff; text-align: center; }
            .applecation-description-overlay__text { font-size: 1.2em; line-height: 1.6; color: rgba(255,255,255,0.9); white-space: pre-wrap; margin-bottom: 1.5em; }
            .applecation-description-overlay__details { display: flex; flex-wrap: wrap; margin: -1em; }
            .applecation-description-overlay__details > * { margin: 1em; }
            .applecation-description-overlay__info-name { font-size: 1.1em; margin-bottom: 0.5em; opacity: 0.7; }
            .applecation-description-overlay__info-body { font-size: 1.2em; }
            
            .applecation .full-person { display: flex !important; flex-direction: column !important; align-items: center !important; width: 10.7em !important; background: none !important; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: transform; animation: none !important; margin-left: 0; }
            .applecation .full-person.focus { transform: scale(1.08) translateY(-6px) !important; z-index: 10; }
            .applecation .full-person__photo { position: relative !important; width: 9.4em !important; height: 9.4em !important; margin: 0 0 .3em 0 !important; border-radius: 50% !important; overflow: hidden !important; background: rgba(255,255,255,0.05) !important; flex-shrink: 0 !important; transition: box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: transform, box-shadow, backdrop-filter; animation: none !important; }
            .applecation .full-person__photo img { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 50% !important; }
            .applecation .full-person__photo::before { content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: opacity; z-index: 2; box-shadow: inset 2px 2px 1px rgba(255,255,255,0.30), inset -2px -2px 2px rgba(255,255,255,0.30); }
            .applecation .full-person__photo::after { content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: opacity; z-index: 3; background: radial-gradient(circle at center, transparent 58%, rgba(255,255,255,0.22) 75%, rgba(255,255,255,0.38) 90%), radial-gradient(120% 85% at 18% 10%, rgba(255,255,255,0.35), rgba(255,255,255,0.10) 38%, transparent 62%); mix-blend-mode: screen; }
            .applecation .full-person.focus .full-person__photo::before,
            .applecation .full-person.focus .full-person__photo::after { opacity: 1; }
            .applecation .full-person.focus .full-person__photo::after { opacity: 0.9; }
            
            .applecation .full-person__body { display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; width: 100% !important; padding: 0 0.3em !important; }
            .applecation .full-person__name { font-size: 1em !important; font-weight: 600 !important; color: #fff !important; line-height: 1.3 !important; width: 100% !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; position: relative !important; }
            .applecation .full-person__name.marquee-active { text-overflow: clip !important; mask-image: linear-gradient(to right, #000 92%, transparent 100%); -webkit-mask-image: linear-gradient(to right, #000 92%, transparent 100%); }
            .applecation .full-person.focus .full-person__name.marquee-active { mask-image: linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%); }
            .applecation .marquee__inner { display: inline-block; white-space: nowrap; }
            .applecation .marquee__inner span { padding-right: 2.5em; display: inline-block; }
            .applecation .full-person.focus .full-person__name.marquee-active .marquee__inner { animation: marquee var(--marquee-duration, 5s) linear infinite; }
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            
            .applecation .full-person__role { font-size: 0.8em !important; font-weight: 400 !important; color: rgba(255,255,255,0.5) !important; line-height: 1.3 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; width: 100% !important; margin-top: 0; }
            .applecation .full-person.focus .full-person__role { color: rgb(255,255,255) !important; }
            
            .applecation .full-episode--small { width: 20em !important; height: auto !important; margin-right: 1.5em !important; background: none !important; display: flex !important; flex-direction: column !important; transition: transform 0.3s !important; }
            .applecation .full-episode--small.focus { transform: scale(1.02); }
            .applecation .full-episode__img { padding-bottom: 56.25% !important; border-radius: 0.8em !important; margin-bottom: 1em !important; background-color: rgba(255,255,255,0.05) !important; position: relative !important; overflow: visible !important; }
            .applecation .full-episode__img img { border-radius: 0.8em !important; object-fit: cover !important; }
            .applecation .full-episode__time { position: absolute; bottom: 0.8em; left: 0.8em; background: rgba(0,0,0,0.6); padding: 0.2em 0.5em; border-radius: 0.4em; font-size: 0.75em; font-weight: 600; color: #fff; backdrop-filter: blur(5px); z-index: 2; }
            .applecation .full-episode__time:empty { display: none; }
            .applecation .full-episode__body { position: static !important; display: flex !important; flex-direction: column !important; background: none !important; padding: 0 0.5em !important; opacity: 0.6; transition: opacity 0.3s; }
            .applecation .full-episode.focus .full-episode__body { opacity: 1; }
            .applecation .full-episode__num { font-size: 0.75em !important; font-weight: 600 !important; text-transform: uppercase !important; color: rgba(255,255,255,0.4) !important; margin-bottom: 0.2em !important; letter-spacing: 0.05em !important; }
            .applecation .full-episode__name { font-size: 1.1em !important; font-weight: 600 !important; color: #fff !important; margin-bottom: 0.4em !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; line-height: 1.4 !important; padding-bottom: 0.1em !important; }
            .applecation .full-episode__overview { font-size: 0.85em !important; line-height: 1.4 !important; color: rgba(255,255,255,0.5) !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; margin-bottom: 0.6em !important; height: 2.8em !important; }
            .applecation .full-episode__date { font-size: 0.8em !important; color: rgba(255,255,255,0.3) !important; }
            
            @media screen and (max-width: 720px) {
                .applecation .full-start-new__body { height: auto !important; min-height: 0 !important; }
                .applecation .full-start-new__right { display: block !important; }
                .applecation .applecation__right { display: none !important; }
                .applecation .applecation__left { width: 100% !important; max-width: none !important; }
                .applecation .applecation__content-wrapper { width: 100% !important; }
                .applecation .applecation__description-wrapper { width: 100% !important; }
                .applecation .applecation__description { max-width: none !important; width: 100% !important; }
            }
        </style>`;

        $('body').append(css);
    }

    // =================================================================
    // Настройки
    // =================================================================
    function addSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: 'applecation_settings',
            name: 'AppleTV+ Pro',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 18l20 12-10 2 2 10-12-24z" fill="currentColor"/><path d="M44 20l6-6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>'
        });

        // Качество постера
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_poster_quality',
                type: 'select',
                values: {
                    low: tr('quality_low') + ' - 1280x720',
                    medium: tr('quality_medium') + ' - 1920x1080',
                    high: tr('quality_high') + ' - 3840x2160'
                },
                default: 'medium'
            },
            field: {
                name: tr('settings_poster_quality'),
                description: tr('settings_poster_quality_desc')
            },
            onChange: function(value) {
                setSetting('poster_quality', value);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: { type: 'title' },
            field: { name: tr('settings_title_display') }
        });

        // Показывать рейтинги
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_ratings',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('show_ratings'),
                description: tr('show_ratings_desc')
            },
            onChange: function(value) {
                setSetting('show_ratings', value);
                if (value) {
                    $('body').removeClass('applecation--hide-ratings');
                } else {
                    $('body').addClass('applecation--hide-ratings');
                }
            }
        });

        // Режим отображения рейтингов (только названия)
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_ratings_display_mode',
                type: 'select',
                values: {
                    labels: tr('ratings_mode_labels')
                },
                default: 'labels'
            },
            field: {
                name: tr('ratings_display_mode'),
                description: tr('ratings_display_mode_desc')
            },
            onChange: function(value) {
                setSetting('ratings_display_mode', value);
                $('.applecation__ratings').each(function() {
                    applyRatingsDisplayMode($(this).closest('.full-start-new'));
                });
            }
        });

        // Размер рейтингов
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_ratings_size',
                type: 'select',
                values: {
                    50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%',
                    100: tr('scale_default') + ' (100%)',
                    110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%'
                },
                default: '100'
            },
            field: {
                name: tr('ratings_size'),
                description: tr('ratings_size_desc')
            },
            onChange: function(value) {
                setSetting('ratings_size', parseInt(value, 10));
                applyScaling();
            }
        });

        // Размер реакций
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_reactions_size',
                type: 'select',
                values: {
                    50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%',
                    100: tr('scale_default') + ' (100%)',
                    110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%'
                },
                default: '100'
            },
            field: {
                name: tr('reactions_size'),
                description: tr('reactions_size_desc')
            },
            onChange: function(value) {
                setSetting('reactions_size', parseInt(value, 10));
                applyScaling();
            }
        });

        // Показывать реакции
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_reactions',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('show_reactions'),
                description: tr('show_reactions_desc')
            },
            onChange: function(value) {
                setSetting('show_reactions', value);
                if (value) {
                    $('.applecation-reactions').show();
                } else {
                    $('.applecation-reactions').hide();
                }
            }
        });

        // Показывать метаданные
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_show_metadata',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('show_metadata'),
                description: tr('show_metadata_desc')
            },
            onChange: function(value) {
                setSetting('show_metadata', value);
            }
        });

        // Источник метаданных
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_metadata_source',
                type: 'select',
                values: {
                    jacred: tr('metadata_source_jacred'),
                    tmdb: tr('metadata_source_tmdb'),
                    both: tr('metadata_source_both')
                },
                default: 'both'
            },
            field: {
                name: tr('metadata_source'),
                description: tr('metadata_source_desc')
            },
            onChange: function(value) {
                setSetting('metadata_source', value);
            }
        });

        // Положение контента
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_layout_position',
                type: 'select',
                values: {
                    top: tr('layout_top'),
                    bottom: tr('layout_bottom')
                },
                default: 'top'
            },
            field: {
                name: tr('layout_position'),
                description: tr('layout_position_desc')
            },
            onChange: function(value) {
                setSetting('layout_position', value);
                Lampa.Activity.back();
            }
        });

        // Реверс эпизодов
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_reverse_episodes',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('reverse_episodes'),
                description: tr('reverse_episodes_desc')
            },
            onChange: function(value) {
                setSetting('reverse_episodes', value);
            }
        });

        // Описание в оверлее
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_description_overlay',
                type: 'trigger',
                default: true
            },
            field: {
                name: tr('description_overlay'),
                description: tr('description_overlay_desc')
            },
            onChange: function(value) {
                setSetting('description_overlay', value);
            }
        });

        // Масштабирование
        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: { type: 'title' },
            field: { name: tr('settings_title_scaling') }
        });

        var scaleValues = {50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%', 100: tr('scale_default') + ' (100%)', 110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%', 160: '160%', 170: '170%', 180: '180%', 200: '200%', 250: '250%', 300: '300%'};

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_logo_scale',
                type: 'select',
                values: scaleValues,
                default: '100'
            },
            field: {
                name: tr('logo_scale'),
                description: tr('logo_scale_desc')
            },
            onChange: function(value) {
                setSetting('logo_scale', parseInt(value, 10));
                applyScaling();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_text_scale',
                type: 'select',
                values: scaleValues,
                default: '100'
            },
            field: {
                name: tr('text_scale'),
                description: tr('text_scale_desc')
            },
            onChange: function(value) {
                setSetting('text_scale', parseInt(value, 10));
                applyScaling();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'applecation_settings',
            param: {
                name: 'applecation_spacing_scale',
                type: 'select',
                values: {50: '50%', 60: '60%', 70: '70%', 80: '80%', 90: '90%', 100: tr('scale_default') + ' (100%)', 110: '110%', 120: '120%', 130: '130%', 140: '140%', 150: '150%', 160: '160%', 170: '170%', 180: '180%', 200: '200%', 250: '250%', 300: '300%'},
                default: '100'
            },
            field: {
                name: tr('spacing_scale'),
                description: tr('spacing_scale_desc')
            },
            onChange: function(value) {
                setSetting('spacing_scale', parseInt(value, 10));
                applyScaling();
            }
        });
    }

    // =================================================================
    // Регистрация плагина
    // =================================================================
    var pluginInfo = {
        type: 'other',
        version: PLUGIN_VERSION,
        name: PLUGIN_NAME,
        description: 'Стиль Apple TV с полными рейтингами, метаданными и развернутыми реакциями',
        author: 'AppleTV+ Pro Team',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 18l20 12-10 2 2 10-12-24z" fill="currentColor"/><path d="M44 20l6-6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>'
    };

    if (Lampa.Manifest && Lampa.Manifest.plugins) {
        Lampa.Manifest.plugins['applecation_pro'] = pluginInfo;
    }

    // =================================================================
    // Запуск
    // =================================================================
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                initPlugin();
            }
        });
    }

})();
