// @name Тема от SERG
// @version 4.6
// @author SERG
// @description Расширенная карточка фильма/сериала с полными метаданными
// @lampa-check Lampa.

(function() {
    'use strict';

    // =================================================================
    // CONFIGURATION
    // =================================================================

    var PLUGIN_VERSION = '4.6';
    var CACHE_TTL = 24 * 60 * 60 * 1000;
    var PROXY_TIMEOUT = 15000;
    var LAMPA_RATING_API = 'https://cubnotrip.top/api/reactions/get/';

    var PROXY_LIST = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ];

    var LANG = (Lampa.Storage.get('language', 'uk') || 'uk').toLowerCase();
    if (LANG === 'ua') LANG = 'uk';
    if (['uk', 'ru', 'en', 'pl'].indexOf(LANG) === -1) LANG = 'en';

    var KP_API_KEYS = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.KP_API_KEYS) || ['5178ab83-699c-4422-937e-f8a759f872ef'];
    var OMDB_API_KEYS = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.OMDB_API_KEYS) || ['73ff4450'];

    var _jacredCache = {};
    var _ratingCache = {};
    var _logoCache = {};
    var _lampaRatingCache = {};
    var _episodesCache = {};

    var STORAGE_KEYS = {
        jacred_cache: 'applecation_jacred_cache',
        rating_cache: 'applecation_rating_cache',
        logo_cache: 'applecation_logo_cache',
        lampa_rating_cache: 'applecation_lampa_rating_cache',
        episodes_cache: 'applecation_episodes_cache'
    };

    // =================================================================
    // DEFAULT SETTINGS
    // =================================================================

    var DEFAULT_SETTINGS = {
        applecation_enabled: true,
        applecation_image_quality: 'original',
        applecation_effects_enabled: true,
        applecation_content_bg: true,
        applecation_content_scale: '100',
        applecation_description_overlay: true,
        applecation_rating_icons: false,
        applecation_ratings_position: 'left',
        applecation_show_quality_badges: true,
        applecation_studios_mode: 'button',
        applecation_info_position: 'left',
        applecation_content_position: 'left',
        applecation_animated_reactions: false,
        applecation_lampa_reaction_icon: false
    };

    function resetToDefaultSettings() {
        try {
            for (var key in DEFAULT_SETTINGS) {
                if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
                    Lampa.Storage.set(key, DEFAULT_SETTINGS[key]);
                }
            }
            Lampa.Noty.show('Настройки темы сброшены до заводских');
            
            setTimeout(function() {
                try {
                    if (Lampa.Activity && Lampa.Activity.active) {
                        var active = Lampa.Activity.active();
                        if (active && active.component === 'full') {
                            Lampa.Activity.backward();
                            setTimeout(function() {
                                location.reload();
                            }, 300);
                            return;
                        }
                    }
                    location.reload();
                } catch (e) {
                    location.reload();
                }
            }, 500);
        } catch (e) {
            console.error('[Тема от SERG] Ошибка сброса настроек:', e);
            Lampa.Noty.show('Ошибка сброса настроек');
        }
    }

    // =================================================================
    // SVG ИКОНКИ
    // =================================================================

    var QUALITY_ICONS = {
        '4K': '<svg viewBox="0 0 311 134" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M291 0C302.046 3.57563e-06 311 8.95431 311 20V114C311 125.046 302.046 134 291 134H20C8.95431 134 0 125.046 0 114V20C0 8.95431 8.95431 0 20 0H291ZM113 20.9092L74.1367 82.1367V97.6367H118.818V114H137.637V97.6367H149.182V81.8633H137.637V20.9092H113ZM162.841 20.9092V114H182.522V87.5459L192.204 75.7275L217.704 114H241.25L206.296 62.5908L240.841 20.9092H217.25L183.75 61.9541H182.522V20.9092H162.841ZM119.182 81.8633H93.9541V81.1367L118.454 42.3633H119.182V81.8633Z" fill="white"/></svg>',
        'FHD': '<svg viewBox="331 0 311 134" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M622 0C633.046 3.57563e-06 642 8.95431 642 20V114C642 125.046 633.046 134 622 134H351C339.954 134 331 125.046 331 114V20C331 8.95431 339.954 0 351 0H622ZM362.341 20.9092V114H382.022V75.5459H419.887V59.3184H382.022V37.1367H423.978V20.9092H362.341ZM437.216 20.9092V114H456.897V75.5459H496.853V114H516.488V20.9092H496.853V59.3184H456.897V20.9092H437.216ZM532.716 20.9092V114H565.716C575.17 114 583.291 112.136 590.079 108.409C596.897 104.682 602.125 99.333 605.762 92.3633C609.428 85.3937 611.262 77.0601 611.262 67.3633C611.262 57.6968 609.428 49.3934 605.762 42.4541C602.125 35.5149 596.928 30.1969 590.171 26.5C583.413 22.7727 575.352 20.9092 565.988 20.9092H532.716ZM564.943 37.7725C570.761 37.7725 575.655 38.8027 579.625 40.8633C583.595 42.9239 586.579 46.1364 588.579 50.5C590.609 54.8636 591.625 60.4847 591.625 67.3633C591.625 74.3026 590.609 79.9694 588.579 84.3633C586.579 88.7269 583.579 91.955 579.579 94.0459C575.609 96.1063 570.715 97.1367 564.897 97.1367H552.397V37.7725H564.943Z" fill="white"/></svg>',
        'HD': '<svg viewBox="662 0 311 134" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M953 0C964.046 3.57563e-06 973 8.95431 973 20V114C973 125.046 964.046 134 953 134H682C670.954 134 662 125.046 662 114V20C662 8.95431 670.954 0 682 0H953ZM731.278 20.9092V114H750.96V75.5459H790.915V114H810.551V20.9092H790.915V59.3184H750.96V20.9092H731.278ZM826.778 20.9092V114H859.778C869.233 114 877.354 112.136 884.142 108.409C890.96 104.682 896.188 99.333 899.824 92.3633C903.491 85.3937 905.324 77.0601 905.324 67.3633C905.324 57.6968 903.491 49.3934 899.824 42.4541C898.188 35.5149 892.991 30.1969 886.233 26.5C879.476 22.7727 871.414 20.9092 862.051 20.9092H826.778ZM859.006 37.7725C864.824 37.7725 869.718 38.8027 873.688 40.8633C877.657 42.9239 880.642 46.1364 882.642 50.5C884.672 54.8636 885.687 60.4847 885.688 67.3633C885.688 74.3026 884.672 79.9694 882.642 84.3633C880.642 88.7269 877.642 91.955 873.642 94.0459C869.672 96.1063 864.778 97.1367 858.96 97.1367H846.46V37.7725H859.006Z" fill="white"/></svg>',
        'TS': '<svg viewBox="0 0 311 134" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="2.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><text x="155.5" y="88" text-anchor="middle" fill="currentColor" font-family="Arial, sans-serif" font-size="64" font-weight="700">TS</text></svg>',
        'Dolby Vision': '<svg viewBox="0 0 1051 393" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,393) scale(0.1,-0.1)" fill="currentColor"><path d="M50 2905 l0 -1017 223 5 c146 4 244 11 287 21 361 85 638 334 753 677 39 116 50 211 44 366 -7 200 -52 340 -163 511 -130 199 -329 344 -574 419 -79 24 -102 26 -327 31 l-243 4 0 -1017z"/><path d="M2436 3904 c-443 -95 -762 -453 -806 -905 -30 -308 86 -611 320 -832 104 -99 212 -165 345 -213 133 -47 253 -64 468 -64 l177 0 0 1015 0 1015 -217 -1 c-152 0 -239 -5 -287 -15z"/><path d="M3552 2908 l3 -1013 425 0 c309 0 443 4 490 13 213 43 407 148 550 299 119 124 194 255 247 428 25 84 27 103 27 270 1 158 -2 189 -22 259 -72 251 -221 458 -424 590 -97 63 -170 97 -288 134 l-85 26 -463 4 -462 3 2 -1013z m825 701 c165 -22 283 -81 404 -199 227 -223 279 -550 133 -831 -70 -133 -176 -234 -319 -304 -132 -65 -197 -75 -490 -75 l-245 0 0 703 c0 387 3 707 7 710 11 11 425 8 510 -4z"/><path d="M7070 2905 l0 -1015 155 0 155 0 0 1015 0 1015 -155 0 -155 0 0 -1015z"/><path d="M7640 2905 l0 -1015 150 0 150 0 0 60 c0 33 2 60 5 60 2 0 33 -15 67 -34 202 -110 433 -113 648 -9 79 38 108 59 180 132 72 71 95 102 134 181 102 207 102 414 1 625 -120 251 -394 411 -670 391 -115 -8 -225 -42 -307 -93 -21 -13 -42 -23 -48 -23 -7 0 -10 125 -10 370 l0 370 -150 0 -150 0 0 -1015z m832 95 c219 -67 348 -310 280 -527 -62 -198 -268 -328 -466 -295 -96 15 -168 52 -235 119 -131 132 -164 311 -87 478 27 60 101 145 158 181 100 63 234 80 350 44z"/><path d="M6035 3286 c-253 -49 -460 -232 -542 -481 -23 -70 -26 -96 -26 -210 0 -114 3 -140 26 -210 37 -113 90 -198 177 -286 84 -85 170 -138 288 -177 67 -22 94 -26 207 -26 113 0 140 4 207 26 119 39 204 92 288 177 87 89 140 174 177 286 22 67 26 99 27 200 1 137 -14 207 -69 320 -134 277 -457 440 -760 381z m252 -284 c117 -37 206 -114 260 -229 121 -253 -38 -548 -321 -595 -258 -43 -503 183 -483 447 20 271 287 457 544 377z"/><path d="M9059 3258 c10 -24 138 -312 285 -642 l266 -598 -72 -162 c-39 -88 -78 -171 -86 -183 -37 -58 -132 -80 -208 -48 l-35 14 -18 -42 c-10 -23 -37 -84 -60 -135 -23 -52 -39 -97 -36 -102 3 -4 40 -23 83 -41 70 -31 86 -34 177 -34 93 0 105 2 167 33 76 37 149 104 180 166 29 57 799 1777 805 1799 5 16 -6 17 -161 15 l-167 -3 -185 -415 c-102 -228 -192 -431 -200 -450 l-15 -35 -201 453 -201 452 -168 0 -168 0 18 -42z"/></g></svg>',
        'HDR': '<svg viewBox="-1 178 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="181.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M27.2784 293V199.909H46.9602V238.318H86.9148V199.909H106.551V293H86.9148V254.545H46.9602V293H27.2784ZM155.778 293H122.778V199.909H156.051C165.415 199.909 173.475 201.773 180.233 205.5C186.991 209.197 192.188 214.515 195.824 221.455C199.491 228.394 201.324 236.697 201.324 246.364C201.324 256.061 199.491 264.394 195.824 271.364C192.188 278.333 186.96 283.682 180.142 287.409C173.354 291.136 165.233 293 155.778 293ZM142.46 276.136H154.96C160.778 276.136 165.672 275.106 169.642 273.045C173.642 270.955 176.642 267.727 178.642 263.364C180.672 258.97 181.688 253.303 181.688 246.364C181.688 239.485 180.672 233.864 178.642 229.5C176.642 225.136 173.657 221.924 169.688 219.864C165.718 217.803 160.824 216.773 155.006 216.773H142.46V276.136ZM215.903 293V199.909H252.631C259.661 199.909 265.661 201.167 270.631 203.682C275.631 206.167 279.434 209.697 282.04 214.273C284.676 218.818 285.994 224.167 285.994 230.318C285.994 236.5 284.661 241.818 281.994 246.273C279.328 250.697 275.464 254.091 270.403 256.455C265.373 258.818 259.282 260 252.131 260H227.54V244.182H248.949C252.706 244.182 255.828 243.667 258.312 242.636C260.797 241.606 262.646 240.061 263.858 238C265.1 235.939 265.722 233.379 265.722 230.318C265.722 227.227 265.1 224.621 263.858 222.5C262.646 220.379 260.782 218.773 258.267 217.682C255.782 216.561 252.646 216 248.858 216H235.585V293H215.903ZM266.176 250.636L289.312 293H267.585L244.949 250.636H266.176Z" fill="currentColor"/></svg>',
        '7.1': '<svg viewBox="-1 368 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="371.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M91.6023 483L130.193 406.636V406H85.2386V389.909H150.557V406.227L111.92 483H91.6023ZM159.545 484.182C156.545 484.182 153.97 483.121 151.818 481C149.697 478.848 148.636 476.273 148.636 473.273C148.636 470.303 149.697 467.758 151.818 465.636C153.97 463.515 156.545 462.455 159.545 462.455C162.455 462.455 165 463.515 167.182 465.636C169.364 467.758 170.455 470.303 170.455 473.273C170.455 475.273 169.939 477.106 168.909 478.773C167.909 480.409 166.591 481.727 164.955 482.727C163.318 483.697 161.515 484.182 159.545 484.182ZM215.045 389.909V483H195.364V408.591H194.818L173.5 421.955V404.5L196.545 389.909H215.045Z" fill="currentColor"/></svg>',
        '5.1': '<svg viewBox="330 368 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="333.5" y="371.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M443.733 484.273C437.309 484.273 431.581 483.091 426.551 480.727C421.551 478.364 417.581 475.106 414.642 470.955C411.703 466.803 410.172 462.045 410.051 456.682H429.142C429.354 460.288 430.869 463.212 433.688 465.455C436.506 467.697 439.854 468.818 443.733 468.818C446.824 468.818 449.551 468.136 451.915 466.773C454.309 465.379 456.172 463.455 457.506 461C458.869 458.515 459.551 455.667 459.551 452.455C459.551 449.182 458.854 446.303 457.46 443.818C456.097 441.333 454.203 439.394 451.778 438C449.354 436.606 446.581 435.894 443.46 435.864C440.733 435.864 438.081 436.424 435.506 437.545C432.96 438.667 430.975 440.197 429.551 442.136L412.051 439L416.46 389.909H473.369V406H432.688L430.278 429.318H430.824C432.46 427.015 434.93 425.106 438.233 423.591C441.536 422.076 445.233 421.318 449.324 421.318C454.93 421.318 459.93 422.636 464.324 425.273C468.718 427.909 472.188 431.53 474.733 436.136C477.278 440.712 478.536 445.985 478.506 451.955C478.536 458.227 477.081 463.803 474.142 468.682C471.233 473.53 467.157 477.348 461.915 480.136C456.703 482.894 450.642 484.273 443.733 484.273ZM500.733 484.182C497.733 484.182 495.157 483.121 493.006 481C490.884 478.848 489.824 476.273 489.824 473.273C489.824 470.303 490.884 467.758 493.006 465.636C495.157 463.515 497.733 462.455 500.733 462.455C503.642 462.455 506.188 463.515 508.369 465.636C510.551 467.758 511.642 470.303 511.642 473.273C511.642 475.273 511.127 477.106 510.097 478.773C509.097 480.409 507.778 481.727 506.142 482.727C504.506 483.697 502.703 484.182 500.733 484.182ZM556.233 389.909V483H536.551V408.591H536.006L514.688 421.955V404.5L537.733 389.909H556.233Z" fill="currentColor"/></svg>',
        '2.0': '<svg viewBox="661 368 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="664.5" y="371.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M722.983 483V468.818L756.119 438.136C758.938 435.409 761.301 432.955 763.21 430.773C765.15 428.591 766.619 426.455 767.619 424.364C768.619 422.242 769.119 419.955 769.119 417.5C769.119 414.773 768.498 412.424 767.256 410.455C766.013 408.455 764.316 406.924 762.165 405.864C760.013 404.773 757.574 404.227 754.847 404.227C751.998 404.227 749.513 404.803 747.392 405.955C745.271 407.106 743.634 408.758 742.483 410.909C741.331 413.061 740.756 415.621 740.756 418.591H722.074C722.074 412.5 723.453 407.212 726.21 402.727C728.968 398.242 732.831 394.773 737.801 392.318C742.771 389.864 748.498 388.636 754.983 388.636C761.65 388.636 767.453 389.818 772.392 392.182C777.362 394.515 781.225 397.758 783.983 401.909C786.741 406.061 788.119 410.818 788.119 416.182C788.119 419.697 787.422 423.167 786.028 426.591C784.665 430.015 782.225 433.818 778.71 438C775.195 442.152 770.241 447.136 763.847 452.955L750.256 466.273V466.909H789.347V483H722.983ZM815.108 484.182C812.108 484.182 809.532 483.121 807.381 481C805.259 478.848 804.199 476.273 804.199 473.273C804.199 470.303 805.259 467.758 807.381 465.636C809.532 463.515 812.108 462.455 815.108 462.455C818.017 462.455 820.563 463.515 822.744 465.636C824.926 467.758 826.017 470.303 826.017 473.273C826.017 475.273 825.502 477.106 824.472 478.773C823.472 480.409 822.153 481.727 820.517 482.727C818.881 483.697 817.078 484.182 815.108 484.182ZM874.483 485.045C866.665 485.015 859.938 483.091 854.301 479.273C848.695 475.455 844.377 469.924 841.347 462.682C838.347 455.439 836.862 446.727 836.892 436.545C836.892 426.394 838.392 417.742 841.392 410.591C844.422 403.439 848.741 398 854.347 394.273C859.983 390.515 866.695 388.636 874.483 388.636C882.271 388.636 888.968 390.515 894.574 394.273C900.21 398.03 904.544 403.485 907.574 410.636C910.604 417.758 912.104 426.394 912.074 436.545C912.074 446.758 910.559 455.485 907.528 462.727C904.528 469.97 900.225 475.5 894.619 479.318C889.013 483.136 882.301 485.045 874.483 485.045ZM874.483 468.727C879.816 468.727 884.074 466.045 887.256 460.682C890.438 455.318 892.013 447.273 891.983 436.545C891.983 429.485 891.256 423.606 889.801 418.909C888.377 414.212 886.347 410.682 883.71 408.318C881.104 405.955 878.028 404.773 874.483 404.773C869.18 404.773 864.938 407.424 861.756 412.727C858.574 418.03 856.968 425.97 856.938 436.545C856.938 443.697 857.65 449.667 859.074 454.455C860.528 459.212 862.574 462.788 865.21 465.182C867.847 467.545 870.938 468.727 874.483 468.727Z" fill="currentColor"/></svg>',
        'DUB': '<svg viewBox="-1 558 313 136" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="561.5" width="306" height="129" rx="17.5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M60.5284 673H27.5284V579.909H60.8011C70.1648 579.909 78.2254 581.773 84.983 585.5C91.7405 589.197 96.9375 594.515 100.574 601.455C104.241 608.394 106.074 616.697 106.074 626.364C106.074 636.061 104.241 644.394 100.574 651.364C96.9375 658.333 91.7102 663.682 84.892 667.409C78.1042 671.136 69.983 673 60.5284 673ZM47.2102 656.136H59.7102C65.5284 656.136 70.4223 655.106 74.392 653.045C78.392 650.955 81.392 647.727 83.392 643.364C85.4223 638.97 86.4375 633.303 86.4375 626.364C86.4375 619.485 85.4223 613.864 83.392 609.5C81.392 605.136 78.4072 601.924 74.4375 599.864C70.4678 597.803 65.5739 596.773 59.7557 596.773H47.2102V656.136ZM178.153 579.909H197.835V640.364C197.835 647.152 196.214 653.091 192.972 658.182C189.759 663.273 185.259 667.242 179.472 670.091C173.684 672.909 166.941 674.318 159.244 674.318C151.517 674.318 144.759 672.909 138.972 670.091C133.184 667.242 128.684 663.273 125.472 658.182C122.259 653.091 120.653 647.152 120.653 640.364V579.909H140.335V638.682C140.335 642.227 141.108 645.379 142.653 648.136C144.229 650.894 146.441 653.061 149.29 654.636C152.138 656.212 155.456 657 159.244 657C163.063 657 166.381 656.212 169.199 654.636C172.047 653.061 174.244 650.894 175.79 648.136C177.366 645.379 178.153 642.227 178.153 638.682V579.909ZM214.028 673V579.909H251.301C258.15 579.909 263.862 580.924 268.438 582.955C273.013 584.985 276.453 587.803 278.756 591.409C281.059 594.985 282.21 599.106 282.21 603.773C282.21 607.409 281.483 610.606 280.028 613.364C278.574 616.091 276.574 618.333 274.028 620.091C271.513 621.818 268.634 623.045 265.392 623.773V624.682C268.938 624.833 272.256 625.833 275.347 627.682C278.468 629.53 280.998 632.121 282.938 635.455C284.877 638.758 285.847 642.697 285.847 647.273C285.847 652.212 284.619 656.621 282.165 660.5C279.741 664.348 276.15 667.394 271.392 669.636C266.634 671.879 260.771 673 253.801 673H214.028ZM233.71 656.909H249.756C255.241 656.909 259.241 655.864 261.756 653.773C264.271 651.652 265.528 648.833 265.528 645.318C265.528 642.742 264.907 640.47 263.665 638.5C262.422 636.53 260.65 634.985 258.347 633.864C256.074 632.742 253.362 632.182 250.21 632.182H233.71V656.909ZM233.71 618.864H248.301C250.998 618.864 253.392 618.394 255.483 617.455C257.604 616.485 259.271 615.121 260.483 613.364C261.725 611.606 262.347 609.5 262.347 607.045C262.347 603.682 261.15 600.97 258.756 598.909C256.392 596.848 253.028 595.818 248.665 595.818H233.71V618.864Z" fill="currentColor"/></svg>'
    };

    // Правильная иконка Lampa (как в Card Overlay)
    var LAMPA_ICON_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 14h-4v-1h4v1zm0-2h-4v-1h4v1z"/></svg>';

    var RATING_ICONS = {
        'Lampa': LAMPA_ICON_SVG,
        'TMDB': '<svg viewBox="0 0 150 150"><defs><linearGradient id="tmdbGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#90cea1"/><stop offset="56%" stop-color="#3cbec9"/><stop offset="100%" stop-color="#00b3e5"/></linearGradient></defs><text x="0" y="50" fill="url(#tmdbGrad)" font-weight="bold" font-size="70">TM</text><text x="0" y="120" fill="url(#tmdbGrad)" font-weight="bold" font-size="70">DB</text></svg>',
        'IMDb': '<svg viewBox="0 0 122.88 122.88"><path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path fill="#000" d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44h-12v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72L98.64,69.6z"/></svg>',
        'Кинопоиск': '<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="150" fill="black"/><path d="M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z" fill="url(#kpGrad)"/><defs><radialGradient id="kpGrad" cx="0" cy="0" r="1" gradientTransform="translate(89.9999 45) rotate(45) scale(296.985)"><stop offset="0.5" stop-color="#FF5500"/><stop offset="1" stop-color="#BBFF00"/></radialGradient></defs></svg>'
    };

    var REACTION_GIFS = {
        'fire': 'https://amikdn.github.io/img/reaction-fire.gif',
        'nice': 'https://amikdn.github.io/img/reaction-nice.gif',
        'think': 'https://amikdn.github.io/img/reaction-think.gif',
        'bore': 'https://amikdn.github.io/img/reaction-bore.gif',
        'shit': 'https://amikdn.github.io/img/reaction-shit.gif'
    };

    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================

    var workingProxy = null;

    function getTmdbKey() {
        try {
            var custom = (Lampa.Storage.get('applecation_tmdb_apikey') || '').trim();
            return custom || (Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '');
        } catch (e) {
            return '';
        }
    }

    function getRandomToken(arr) {
        if (!arr || !arr.length) return '';
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getRatingColor(value) {
        var v = parseFloat(String(value).replace(',', '.'));
        if (isNaN(v) || v <= 0) return '#ffffff';
        if (v <= 3) return '#e74c3c';
        if (v < 6) return '#f39c12';
        if (v < 8) return '#3498db';
        return '#2ecc71';
    }

    function getRatingBackgroundColor(value, isTotal) {
        var v = parseFloat(String(value).replace(',', '.'));
        if (isNaN(v) || v <= 0) return 'rgba(0,0,0,0.7)';
        if (isTotal) {
            return '#FFD700';
        }
        if (v <= 3) return 'rgba(231,76,60,0.8)';
        if (v < 6) return 'rgba(243,156,18,0.8)';
        if (v < 8) return 'rgba(52,152,219,0.8)';
        return 'rgba(46,204,113,0.8)';
    }

    function getAgeColor(pg) {
        if (!pg) return '#ffffff';
        var num = parseInt(pg);
        if (isNaN(num)) return '#ffffff';
        if (num <= 0) return '#4caf50';
        if (num <= 6) return '#8bc34a';
        if (num <= 12) return '#ffeb3b';
        if (num <= 16) return '#ff9800';
        return '#e74c3c';
    }

    function getStatusText(status) {
        var map = {
            'Ended': 'Завершён',
            'Canceled': 'Отменён',
            'Returning Series': 'Онгоинг',
            'In Production': 'В производстве',
            'Planned': 'Запланирован',
            'Pilot': 'Пилотный'
        };
        return map[status] || status || 'Неизвестно';
    }

    function getStatusColor(status) {
        var map = {
            'Ended': 'rgba(46,204,113,0.85)',
            'Canceled': 'rgba(231,76,60,0.85)',
            'Returning Series': 'rgba(243,156,18,0.85)',
            'In Production': 'rgba(52,152,219,0.85)',
            'Planned': 'rgba(155,89,182,0.85)',
            'Pilot': 'rgba(230,126,34,0.85)'
        };
        return map[status] || 'rgba(0,0,0,0.6)';
    }

    function escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // =================================================================
    // CACHE MANAGEMENT
    // =================================================================

    function clearAllCache() {
        try {
            _jacredCache = {};
            _ratingCache = {};
            _logoCache = {};
            _lampaRatingCache = {};
            _episodesCache = {};

            var keys = Object.values(STORAGE_KEYS);
            for (var i = 0; i < keys.length; i++) {
                try {
                    Lampa.Storage.set(keys[i], {});
                } catch (e) {}
            }

            console.log('[Тема от SERG] Весь кэш очищен');
            Lampa.Noty.show('Кэш темы очищен');

            setTimeout(function() {
                try {
                    if (Lampa.Activity && Lampa.Activity.active) {
                        var active = Lampa.Activity.active();
                        if (active && active.component === 'full') {
                            Lampa.Activity.backward();
                            setTimeout(function() {
                                location.reload();
                            }, 300);
                            return;
                        }
                    }
                    location.reload();
                } catch (e) {
                    location.reload();
                }
            }, 500);

        } catch (e) {
            console.error('[Тема от SERG] Ошибка очистки кэша:', e);
            Lampa.Noty.show('Ошибка очистки кэша');
        }
    }

    function saveToStorage(key, data) {
        try {
            var storageKey = STORAGE_KEYS[key];
            if (!storageKey) return;
            var existing = Lampa.Storage.get(storageKey, {});
            if (typeof existing !== 'object') existing = {};
            for (var k in data) {
                if (data.hasOwnProperty(k)) {
                    existing[k] = data[k];
                }
            }
            Lampa.Storage.set(storageKey, existing);
        } catch (e) {}
    }

    function getFromStorage(key, subKey) {
        try {
            var storageKey = STORAGE_KEYS[key];
            if (!storageKey) return null;
            var data = Lampa.Storage.get(storageKey, {});
            if (typeof data !== 'object') return null;
            return data[subKey] || null;
        } catch (e) {
            return null;
        }
    }

    // =================================================================
    // PARSE PG
    // =================================================================

    function parsePG(movie) {
        try {
            if (!movie) return null;
            
            var pg = null;
            var lang = LANG.toUpperCase();
            
            if (movie.content_ratings && movie.content_ratings.results) {
                var find = movie.content_ratings.results.find(function(a) {
                    return a.iso_3166_1 === lang;
                });
                if (!find) {
                    find = movie.content_ratings.results.find(function(a) {
                        return a.iso_3166_1 === 'US';
                    });
                }
                if (find && find.rating) {
                    pg = decodePG(find.rating);
                }
            }
            
            if (!pg && movie.release_dates && movie.release_dates.results) {
                var find = movie.release_dates.results.find(function(a) {
                    return a.iso_3166_1 === lang;
                });
                if (!find) {
                    find = movie.release_dates.results.find(function(a) {
                        return a.iso_3166_1 === 'US';
                    });
                }
                if (find && find.release_dates && find.release_dates.length) {
                    pg = decodePG(find.release_dates[0].certification);
                }
            }
            
            if (!pg && movie.restrict) {
                pg = movie.restrict + '+';
            }
            
            return pg;
            
        } catch (e) {
            console.warn('[Тема от SERG] Ошибка парсинга PG:', e);
            return null;
        }
    }

    function decodePG(rating) {
        if (!rating) return null;
        
        var map = {
            'G': '0+',
            'PG': '6+',
            'PG-13': '13+',
            'R': '17+',
            'NC-17': '18+',
            'TV-Y': '0+',
            'TV-Y7': '7+',
            'TV-G': '3+',
            'TV-PG': '6+',
            'TV-14': '14+',
            'TV-MA': '17+',
            '0': '0+', '1': '1+', '2': '2+', '3': '3+',
            '4': '4+', '5': '5+', '6': '6+', '7': '7+',
            '8': '8+', '9': '9+', '10': '10+', '11': '11+',
            '12': '12+', '13': '13+', '14': '14+', '15': '15+',
            '16': '16+', '17': '17+', '18': '18+'
        };
        
        return map[rating] || rating;
    }

    // =================================================================
    // LAMPA RATINGS
    // =================================================================

    function getLampaRating(movie, callback) {
        try {
            if (!movie || !movie.id) {
                callback(null);
                return;
            }

            var type = movie.name ? 'tv' : 'movie';
            var key = type + '_' + movie.id;
            var cacheKey = key;

            var cached = getFromStorage('lampa_rating_cache', cacheKey);
            if (cached && cached._ts && (Date.now() - cached._ts < CACHE_TTL)) {
                _lampaRatingCache[cacheKey] = cached;
                callback(cached);
                return;
            }

            var network = new Lampa.Reguest();
            network.timeout(PROXY_TIMEOUT);
            
            network.silent(LAMPA_RATING_API + key, function(data) {
                try {
                    if (data && data.result && Array.isArray(data.result)) {
                        var rating = calculateLampaRating(data.result);
                        var result = {
                            rating: rating.rating,
                            medianReaction: rating.medianReaction,
                            reactions: data.result,
                            _ts: Date.now()
                        };
                        _lampaRatingCache[cacheKey] = result;
                        saveToStorage('lampa_rating_cache', { [cacheKey]: result });
                        callback(result);
                    } else {
                        callback(null);
                    }
                } catch (e) {
                    callback(null);
                }
            }, function() {
                callback(null);
            }, false, { timeout: PROXY_TIMEOUT });

        } catch (e) {
            console.error('[Тема от SERG] Ошибка получения рейтинга Lampa:', e);
            callback(null);
        }
    }

    function calculateLampaRating(reactions) {
        try {
            var weightedSum = 0;
            var totalCount = 0;
            var reactionCnt = {};
            var reactionCoef = { fire: 5, nice: 4, think: 3, bore: 2, shit: 1 };

            for (var i = 0; i < reactions.length; i++) {
                var item = reactions[i];
                var count = parseInt(item.counter, 10) || 0;
                var coef = reactionCoef[item.type] || 0;
                weightedSum += count * coef;
                totalCount += count;
                reactionCnt[item.type] = (reactionCnt[item.type] || 0) + count;
            }

            if (totalCount === 0) {
                return { rating: 0, medianReaction: '' };
            }

            var avgRating = weightedSum / totalCount;
            var rating10 = (avgRating - 1) * 2.5;
            var finalRating = rating10 >= 0 ? parseFloat(rating10.toFixed(1)) : 0;

            var medianReaction = '';
            var medianIndex = Math.ceil(totalCount / 2.0);
            var keys = Object.keys(reactionCoef);
            var sortedReactions = keys.sort(function(a, b) {
                return reactionCoef[a] - reactionCoef[b];
            });
            var cumulativeCount = 0;
            
            while (sortedReactions.length && cumulativeCount < medianIndex) {
                medianReaction = sortedReactions.pop();
                cumulativeCount += (reactionCnt[medianReaction] || 0);
            }

            return { rating: finalRating, medianReaction: medianReaction };

        } catch (e) {
            return { rating: 0, medianReaction: '' };
        }
    }

    // =================================================================
    // JACRED QUALITY (Улучшенная версия с подходом Card Overlay)
    // =================================================================

    function fetchWithProxy(url, callback) {
        var network = new Lampa.Reguest();
        network.timeout(PROXY_TIMEOUT);

        network.silent(url, function(data) {
            workingProxy = 'direct';
            callback(null, data);
        }, function() {
            tryProxies(url, callback);
        });
    }

    function tryProxies(url, callback) {
        var proxyList = (workingProxy && workingProxy !== 'direct') ? [workingProxy] : PROXY_LIST;

        function tryProxy(index) {
            if (index >= proxyList.length) {
                callback(new Error('Ни один прокси не сработал'));
                return;
            }
            var p = proxyList[index];
            var target = p.indexOf('url=') > -1 ? p + encodeURIComponent(url) : p + url;

            var xhr = new XMLHttpRequest();
            xhr.open('GET', target, true);
            xhr.timeout = PROXY_TIMEOUT;

            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    workingProxy = p;
                    callback(null, xhr.responseText);
                } else {
                    tryProxy(index + 1);
                }
            };
            xhr.onerror = function() { tryProxy(index + 1); };
            xhr.ontimeout = function() { tryProxy(index + 1); };
            xhr.send();
        }
        tryProxy(0);
    }

    function detectLowQuality(title) {
        if (!title) return false;
        var l = title.toLowerCase();
        var patterns = ['camrip', 'камрип', 'ts', 'telecine', 'telesync', 'upscale', 'tc', 'тс'];
        for (var i = 0; i < patterns.length; i++) {
            if (l.indexOf(patterns[i]) !== -1) {
                return true;
            }
        }
        return false;
    }

    function getBestJacred(card, callback) {
        try {
            if (!card || !card.id) {
                callback(null);
                return;
            }

            var cacheKey = 'jacred_' + card.id;
            var now = Date.now();

            var cached = getFromStorage('jacred_cache', cacheKey);
            if (cached && cached._ts && (now - cached._ts < CACHE_TTL) && cached.resolution) {
                _jacredCache[cacheKey] = cached;
                callback(cached);
                return;
            }

            var title = (card.original_title || card.title || card.name || '').toLowerCase().trim();
            var year = (card.release_date || card.first_air_date || '').substr(0, 4);

            if (!title || !year) {
                var emptyData = { empty: true, _ts: now };
                _jacredCache[cacheKey] = emptyData;
                saveToStorage('jacred_cache', { [cacheKey]: emptyData });
                callback(null);
                return;
            }

            var uniqueId = Lampa.Storage.get('lampac_unic_id', '');
            var requestUrl = 'https://jr.maxvol.pro/api/v2.0/indexers/all/results?apikey=&uid=' + uniqueId + '&year=' + year;
            
            var titlePresent = false;
            if (title && title.length > 0) {
                requestUrl += '&title=' + encodeURIComponent(title);
                titlePresent = true;
            }
            if (card.original_title && card.original_title.length > 0) {
                requestUrl += '&title_original=' + encodeURIComponent(card.original_title);
                titlePresent = true;
            }
            
            if (!titlePresent) {
                callback(null);
                return;
            }

            console.log('[Тема от SERG] Jacred v2: Получение качества для:', title, year);

            fetchWithProxy(requestUrl, function(err, data) {
                if (err || !data) {
                    callback(null);
                    return;
                }

                try {
                    var parsed = typeof data === 'string' ? JSON.parse(data) : data;
                    
                    if (parsed.contents) {
                        try {
                            parsed = JSON.parse(parsed.contents);
                        } catch (e) {}
                    }

                    var results = Array.isArray(parsed) ? parsed : (parsed.Results || []);
                    
                    if (!results || !results.length) {
                        var emptyData = { empty: true, _ts: now };
                        _jacredCache[cacheKey] = emptyData;
                        saveToStorage('jacred_cache', { [cacheKey]: emptyData });
                        callback(null);
                        return;
                    }

                    // === УЛУЧШЕННАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ КАЧЕСТВА ===
                    // Подход Card Overlay: сначала проверяем, есть ли HD релизы
                    
                    var hasHDRelease = results.some(function(item) {
                        var info = item.info || item.Info || {};
                        var quality = info.quality || 0;
                        return quality >= 720;
                    });

                    // Если есть HD релизы - игнорируем TS
                    var filteredResults = results;
                    if (hasHDRelease) {
                        filteredResults = results.filter(function(item) {
                            return !detectLowQuality(item.Title);
                        });
                        console.log('[Тема от SERG] Найдены HD релизы, TS исключены. Осталось:', filteredResults.length);
                    }

                    // Дополнительная проверка по году выпуска (для старых фильмов)
                    var releaseYear = parseInt(year, 10);
                    var currentYear = new Date().getFullYear();
                    var age = currentYear - releaseYear;

                    var best = {
                        resolution: 'SD',
                        hdr: false,
                        dolbyVision: false,
                        sound: null,
                        dub: false,
                        _ts: now
                    };

                    var resOrder = ['SD', 'HD', 'FHD', '2K', '4K'];

                    filteredResults.forEach(function(item) {
                        var titleLower = (item.Title || '').toLowerCase();
                        var info = item.info || item.Info || {};
                        var videotype = (info.videotype || '').toLowerCase();
                        var quality = info.quality || 0;

                        var currentRes = 'SD';
                        
                        // Проверяем на TS только если нет HD релизов
                        if (!hasHDRelease) {
                            if (titleLower.indexOf('cam') >= 0 || titleLower.indexOf('ts') >= 0 || 
                                titleLower.indexOf('tc') >= 0 || titleLower.indexOf('telesync') >= 0 ||
                                titleLower.indexOf('telecine') >= 0 || titleLower.indexOf('camrip') >= 0) {
                                // Если фильм старый (>2 лет) - игнорируем TS метки
                                if (age <= 2) {
                                    currentRes = 'TS';
                                } else {
                                    // Старый фильм - скорее всего есть нормальное качество
                                    return;
                                }
                            }
                        }

                        if (currentRes !== 'TS') {
                            if (quality >= 2160) {
                                currentRes = '4K';
                            } else if (quality >= 1440) {
                                currentRes = '2K';
                            } else if (quality >= 1080) {
                                currentRes = 'FHD';
                            } else if (quality >= 720) {
                                currentRes = 'HD';
                            } else {
                                // Fallback по названию
                                if (titleLower.indexOf('2160') >= 0 || titleLower.indexOf('4k') >= 0) {
                                    currentRes = '4K';
                                } else if (titleLower.indexOf('1440') >= 0 || titleLower.indexOf('2k') >= 0) {
                                    currentRes = '2K';
                                } else if (titleLower.indexOf('1080') >= 0 || titleLower.indexOf('fhd') >= 0) {
                                    currentRes = 'FHD';
                                } else if (titleLower.indexOf('720') >= 0 || titleLower.indexOf('hd') >= 0) {
                                    currentRes = 'HD';
                                }
                            }
                        }

                        if (currentRes === 'TS' && age > 2) {
                            // Старый фильм с TS меткой - игнорируем
                            return;
                        }

                        if (resOrder.indexOf(currentRes) > resOrder.indexOf(best.resolution)) {
                            best.resolution = currentRes;
                        }

                        // HDR / Dolby Vision
                        if (videotype.indexOf('dolby') >= 0 || videotype.indexOf('dv') >= 0 || 
                            titleLower.indexOf('dolby vision') >= 0 || titleLower.indexOf('dovi') >= 0) {
                            best.dolbyVision = true;
                            best.hdr = true;
                        } else if (videotype.indexOf('hdr') >= 0 || titleLower.indexOf('hdr10+') >= 0 || 
                                   titleLower.indexOf('hdr10') >= 0 || titleLower.indexOf('hdr') >= 0) {
                            best.hdr = true;
                        }

                        // Звук
                        if (item.ffprobe && Array.isArray(item.ffprobe)) {
                            var audioTracks = item.ffprobe.filter(function(track) {
                                return track.codec_type === 'audio';
                            });
                            
                            var maxChannels = 0;
                            audioTracks.forEach(function(track) {
                                if (track.channels && track.channels > maxChannels) {
                                    maxChannels = track.channels;
                                }
                            });
                            
                            if (maxChannels >= 8) {
                                best.sound = '7.1';
                            } else if (maxChannels >= 6) {
                                best.sound = '5.1';
                            } else if (maxChannels >= 2) {
                                best.sound = '2.0';
                            }
                            
                            if (!best.dub) {
                                audioTracks.forEach(function(track) {
                                    if (track.tags) {
                                        var language = (track.tags.language || '').toLowerCase();
                                        var trackTitle = (track.tags.title || track.tags.handler_name || '').toLowerCase();
                                        
                                        if (language === 'rus' || language === 'ru' || language === 'russian') {
                                            if (trackTitle.indexOf('dub') >= 0 || trackTitle.indexOf('дубляж') >= 0 || 
                                                trackTitle.indexOf('дублир') >= 0 || trackTitle === 'd') {
                                                best.dub = true;
                                            }
                                        }
                                    }
                                });
                            }
                        }

                        if (!best.dub && titleLower.indexOf('dub') >= 0) {
                            best.dub = true;
                        }
                    });

                    // Если не нашли HD и это старый фильм - ставим HD как fallback
                    if (best.resolution === 'SD' && age > 2) {
                        best.resolution = 'HD';
                    }

                    // Если результат SD, но есть релизы - поднимаем до HD
                    if (best.resolution === 'SD' && results.length > 0 && !hasHDRelease) {
                        best.resolution = 'HD';
                    }

                    _jacredCache[cacheKey] = best;
                    saveToStorage('jacred_cache', { [cacheKey]: best });
                    
                    console.log('[Тема от SERG] Результат Jacred (улучшенный):', best);
                    callback(best);

                } catch (e) {
                    console.error('[Тема от SERG] Ошибка парсинга Jacred:', e);
                    callback(null);
                }
            });

        } catch (e) {
            console.error('[Тема от SERG] Ошибка getBestJacred:', e);
            callback(null);
        }
    }

    // =================================================================
    // RATINGS
    // =================================================================

    function getRatings(movie, callback) {
        try {
            if (!movie || !movie.id) {
                callback({ tmdb: 0, imdb: 0, kinopoisk: 0 });
                return;
            }

            var cacheKey = 'ratings_' + movie.id;
            var now = Date.now();

            var cached = getFromStorage('rating_cache', cacheKey);
            if (cached && cached._ts && (now - cached._ts < CACHE_TTL)) {
                _ratingCache[cacheKey] = cached;
                callback(cached);
                return;
            }

            var result = {
                tmdb: movie.vote_average || 0,
                imdb: 0,
                kinopoisk: 0,
                _ts: now
            };

            var pending = 0;
            var isComplete = false;

            function checkComplete() {
                if (isComplete) return;
                pending--;
                if (pending <= 0) {
                    isComplete = true;
                    _ratingCache[cacheKey] = result;
                    saveToStorage('rating_cache', { [cacheKey]: result });
                    callback(result);
                }
            }

            var imdbId = movie.imdb_id || (movie.external_ids && movie.external_ids.imdb_id);
            if (imdbId) {
                pending++;
                var network = new Lampa.Reguest();
                var omdbUrl = 'https://www.omdbapi.com/?apikey=' + getRandomToken(OMDB_API_KEYS) + '&i=' + imdbId;
                network.silent(omdbUrl, function(data) {
                    if (data && data.imdbRating) {
                        result.imdb = parseFloat(data.imdbRating) || 0;
                    }
                    checkComplete();
                }, function() {
                    checkComplete();
                });
            }

            var kpApiKey = Lampa.Storage.get('rating_kp_api_key', '') || Lampa.Storage.get('source_api_key', '');
            if (!kpApiKey) {
                kpApiKey = getRandomToken(KP_API_KEYS);
            }
            
            if (kpApiKey) {
                pending++;
                getKinopoiskRating(movie, kpApiKey, function(kpRating) {
                    if (kpRating > 0) {
                        result.kinopoisk = kpRating;
                    }
                    checkComplete();
                });
            }

            if (pending === 0) {
                _ratingCache[cacheKey] = result;
                saveToStorage('rating_cache', { [cacheKey]: result });
                callback(result);
            }

        } catch (e) {
            console.error('[Тема от SERG] Ошибка получения рейтингов:', e);
            callback({ tmdb: 0, imdb: 0, kinopoisk: 0 });
        }
    }

    // =================================================================
    // КИНОПОИСК
    // =================================================================

    function getKinopoiskRating(movie, apiKey, callback) {
        try {
            if (!movie || !movie.id) {
                callback(0);
                return;
            }

            var network = new Lampa.Reguest();
            var title = movie.title || movie.name || '';
            var year = (movie.release_date || movie.first_air_date || '').substr(0, 4);
            var originalTitle = movie.original_title || movie.original_name || '';

            if (!title) {
                callback(0);
                return;
            }

            var imdbId = movie.imdb_id || (movie.external_ids && movie.external_ids.imdb_id);
            if (imdbId) {
                var urlById = 'https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + imdbId;
                network.silent(urlById, function(data) {
                    if (data && data.items && data.items.length) {
                        var found = data.items[0];
                        if (found && found.ratingKinopoisk) {
                            callback(parseFloat(found.ratingKinopoisk) || 0);
                            return;
                        }
                    }
                    searchKinopoiskByTitle(title, year, originalTitle, callback);
                }, function() {
                    searchKinopoiskByTitle(title, year, originalTitle, callback);
                }, false, { headers: { 'X-API-KEY': apiKey } });
            } else {
                searchKinopoiskByTitle(title, year, originalTitle, callback);
            }

        } catch (e) {
            console.error('[Тема от SERG] Ошибка получения рейтинга Кинопоиска:', e);
            callback(0);
        }
    }

    function searchKinopoiskByTitle(title, year, originalTitle, callback) {
        try {
            var kpApiKey = Lampa.Storage.get('rating_kp_api_key', '') || Lampa.Storage.get('source_api_key', '');
            if (!kpApiKey) {
                kpApiKey = getRandomToken(KP_API_KEYS);
            }
            if (!kpApiKey) {
                callback(0);
                return;
            }

            var network = new Lampa.Reguest();
            var searchUrl = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(title);

            network.silent(searchUrl, function(data) {
                if (data && data.films && data.films.length) {
                    var results = data.films;
                    
                    function findBestMatch() {
                        if (year) {
                            var yearMatch = results.filter(function(f) {
                                return f.year && String(f.year) === year;
                            });
                            if (yearMatch.length > 0) {
                                if (originalTitle) {
                                    var origMatch = yearMatch.filter(function(f) {
                                        return f.nameOriginal && f.nameOriginal.toLowerCase() === originalTitle.toLowerCase();
                                    });
                                    if (origMatch.length > 0) return origMatch[0];
                                }
                                var titleMatch = yearMatch.filter(function(f) {
                                    return f.nameRu && f.nameRu.toLowerCase() === title.toLowerCase();
                                });
                                if (titleMatch.length > 0) return titleMatch[0];
                                return yearMatch[0];
                            }
                        }
                        
                        if (originalTitle) {
                            var origMatches = results.filter(function(f) {
                                return f.nameOriginal && f.nameOriginal.toLowerCase() === originalTitle.toLowerCase();
                            });
                            if (origMatches.length > 0) return origMatches[0];
                        }
                        
                        var titleMatches = results.filter(function(f) {
                            return f.nameRu && f.nameRu.toLowerCase() === title.toLowerCase();
                        });
                        if (titleMatches.length > 0) return titleMatches[0];
                        
                        var sorted = results.slice().sort(function(a, b) {
                            return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
                        });
                        return sorted[0];
                    }

                    var found = findBestMatch();
                    
                    if (found) {
                        var filmId = found.filmId || found.kinopoiskId;
                        if (filmId) {
                            var detailUrl = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/' + filmId;
                            var detailNetwork = new Lampa.Reguest();
                            detailNetwork.silent(detailUrl, function(detailData) {
                                if (detailData && detailData.ratingKinopoisk) {
                                    callback(parseFloat(detailData.ratingKinopoisk) || 0);
                                } else {
                                    callback(parseFloat(found.rating) || 0);
                                }
                            }, function() {
                                callback(parseFloat(found.rating) || 0);
                            }, false, { headers: { 'X-API-KEY': kpApiKey } });
                            return;
                        }
                        callback(parseFloat(found.rating) || 0);
                    } else {
                        callback(0);
                    }
                } else {
                    callback(0);
                }
            }, function() {
                callback(0);
            }, false, { headers: { 'X-API-KEY': kpApiKey } });

        } catch (e) {
            console.error('[Тема от SERG] Ошибка поиска на Кинопоиске:', e);
            callback(0);
        }
    }

    // =================================================================
    // TMDB LOGO
    // =================================================================

    function fetchLogo(movie, callback) {
        try {
            if (!movie || !movie.id) {
                callback(null);
                return;
            }

            var type = movie.name ? 'tv' : 'movie';
            var cacheKey = type + '_' + movie.id + '_logo';
            var now = Date.now();

            var cached = getFromStorage('logo_cache', cacheKey);
            if (cached && cached._ts && (now - cached._ts < CACHE_TTL)) {
                _logoCache[cacheKey] = cached;
                callback(cached);
                return;
            }

            var lang = LANG;
            var url = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey() + '&language=' + lang);
            var urlAll = Lampa.TMDB.api(type + '/' + movie.id + '/images?api_key=' + getTmdbKey());

            var network = new Lampa.Reguest();
            network.timeout(PROXY_TIMEOUT);

            network.silent(url, function(data) {
                if (data && data.logos && data.logos.length) {
                    var logo = data.logos.find(function(l) { return l.iso_639_1 === lang; }) ||
                              data.logos.find(function(l) { return l.iso_639_1 === 'en'; }) ||
                              data.logos[0];

                    if (logo) {
                        var result = { file_path: logo.file_path, _ts: now };
                        _logoCache[cacheKey] = result;
                        saveToStorage('logo_cache', { [cacheKey]: result });
                        callback(result);
                        return;
                    }
                }

                network.silent(urlAll, function(dataAll) {
                    if (dataAll && dataAll.logos && dataAll.logos.length) {
                        var logo = dataAll.logos.find(function(l) { return l.iso_639_1 === 'en'; }) || dataAll.logos[0];
                        if (logo) {
                            var result = { file_path: logo.file_path, _ts: now };
                            _logoCache[cacheKey] = result;
                            saveToStorage('logo_cache', { [cacheKey]: result });
                            callback(result);
                            return;
                        }
                    }
                    callback(null);
                }, function() {
                    callback(null);
                });

            }, function() {
                callback(null);
            });
        } catch (e) {
            console.error('[Тема от SERG] Ошибка получения логотипа:', e);
            callback(null);
        }
    }

    function getLogoUrl(logo) {
        if (!logo || !logo.file_path) return null;
        return Lampa.TMDB.image('/t/p/original' + logo.file_path);
    }

    // =================================================================
    // OVERRIDE IMAGE API (упрощено, без w600_and_h900_face)
    // =================================================================

    function getImageQuality() {
        var quality = Lampa.Storage.get('applecation_image_quality', 'original');
        return quality;
    }

    function overrideImageApi() {
        try {
            var source = Lampa.Api.sources.tmdb;
            if (!source) return;
            
            var originalImg = source.img;

            source.img = function(path, size) {
                var quality = getImageQuality();
                
                if (quality === 'original') {
                    size = 'original';
                } else if (quality === 'fhd') {
                    size = 'w780';
                } else {
                    size = 'w300';
                }

                return originalImg.call(source, path, size);
            };

            console.log('[Тема от SERG] API изображений переопределен с качеством:', getImageQuality());
        } catch (e) {
            console.error('[Тема от SERG] Ошибка переопределения API изображений:', e);
        }
    }

    // =================================================================
    // ПОЛУЧЕНИЕ ДАННЫХ ЭПИЗОДОВ
    // =================================================================

    var _episodesData = {};

    function captureEpisodesFromFull(e) {
        try {
            if (e.data && e.data.episodes) {
                var key = e.object.method + '_' + e.object.id;
                _episodesData[key] = e.data.episodes;
                console.log('[Тема от SERG] Захвачены данные эпизодов для:', key, e.data.episodes.episodes ? e.data.episodes.episodes.length : 0);
                return true;
            }
            
            if (e.data && e.data.movie && e.data.movie.seasons) {
                var key = e.object.method + '_' + e.object.id;
                var allEpisodes = [];
                if (e.data.movie.seasons && Array.isArray(e.data.movie.seasons)) {
                    e.data.movie.seasons.forEach(function(season) {
                        if (season.episodes && Array.isArray(season.episodes)) {
                            allEpisodes = allEpisodes.concat(season.episodes);
                        }
                    });
                }
                if (allEpisodes.length > 0) {
                    _episodesData[key] = { episodes: allEpisodes };
                    console.log('[Тема от SERG] Захвачены эпизоды из сезонов для:', key, allEpisodes.length);
                    return true;
                }
            }
            
            return false;
        } catch (e) {
            console.warn('[Тема от SERG] Ошибка захвата эпизодов:', e);
            return false;
        }
    }

    function getEpisodesData(movie) {
        if (!movie) return null;
        var type = movie.name ? 'tv' : 'movie';
        if (type !== 'tv') return null;
        var key = type + '_' + movie.id;
        return _episodesData[key] || null;
    }

    // =================================================================
    // FOCUS FIRST BUTTON
    // =================================================================

    function focusFirstButton(render) {
        try {
            var buttons = render.find('.full-start-new__buttons .full-start__button:not(.hidden)');
            if (!buttons.length) return;

            var firstButton = buttons.first();
            
            if (firstButton.hasClass('button--edit-order')) {
                var nextButton = buttons.eq(1);
                if (nextButton.length) {
                    firstButton = nextButton;
                } else {
                    return;
                }
            }

            if (Lampa.Controller && typeof Lampa.Controller.collectionFocus === 'function') {
                Lampa.Controller.collectionFocus(firstButton[0], render.find('.full-start-new__buttons')[0]);
            } else if (typeof firstButton.focus === 'function') {
                firstButton.focus();
            }

            firstButton.addClass('focus');

        } catch (e) {
            console.warn('[Тема от SERG] Ошибка фокуса первой кнопки:', e);
        }
    }

    // =================================================================
    // СТУДИИ - кнопка в ряду с кнопками
    // =================================================================

    function renderStudiosBtn(render, movie) {
        try {
            var container = render.find('.full-start-new__buttons');
            if (!container.length) return;

            var studiosMode = Lampa.Storage.get('applecation_studios_mode', 'button');
            
            container.find('.button--studios').remove();

            var companies = (movie && movie.production_companies && movie.production_companies.length) ?
                movie.production_companies : [];

            if (!companies.length) return;

            if (studiosMode === 'hide') return;

            if (studiosMode === 'button') {
                var btn = $('<div class="full-start__button selector button--studios"></div>');
                btn.html(
                    '<svg viewBox="0 0 24 24" fill="currentColor" style="width:1.2em;height:1.2em;">' +
                        '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>' +
                    '</svg>' +
                    '<span>Студии</span>'
                );
                
                btn.css({
                    'height': $('.full-start__button', render).first().outerHeight() + 'px'
                });

                btn.on('hover:enter', function() {
                    var controllerName = Lampa.Controller.enabled().name;
                    Lampa.Select.show({
                        title: 'Студии',
                        items: companies.map(function(studio) { 
                            return { 
                                title: studio.name || 'Неизвестно', 
                                studio: studio 
                            } 
                        }),
                        onBack: function() {
                            Lampa.Controller.toggle(controllerName);
                            Lampa.Controller.collectionFocus(btn, render);
                        },
                        onSelect: function(action) {
                            if (action.studio && action.studio.id) {
                                Lampa.Activity.push({
                                    url: 'movie',
                                    id: action.studio.id,
                                    title: action.studio.name || '',
                                    component: 'company',
                                    source: 'tmdb',
                                    page: 1
                                });
                            }
                        }
                    });
                });

                container.append(btn);
            }
        } catch (e) {
            console.warn('[Тема от SERG] Ошибка рендера студий:', e);
        }
    }

    // =================================================================
    // СТУДИИ - отдельная строка между meta и ratings
    // =================================================================

    function renderStudiosLine(render, movie) {
        try {
            var studiosMode = Lampa.Storage.get('applecation_studios_mode', 'button');
            
            render.find('.applecation__studios').remove();

            var companies = (movie && movie.production_companies && movie.production_companies.length) ?
                movie.production_companies : [];

            if (!companies.length) return;

            if (studiosMode === 'hide') return;

            var studiosContainer = $('<div class="applecation__studios"></div>');
            studiosContainer.css({
                'display': 'flex',
                'align-items': 'center',
                'flex-wrap': 'wrap',
                'gap': '0.7em',
                'margin': '0 0 0.5em 0',
                'opacity': '0',
                'transform': 'translateY(15px)',
                'transition': 'opacity 0.4s ease-out, transform 0.4s ease-out'
            });

            var contentGroup = render.find('.applecation__content-group');
            var meta = contentGroup.find('.applecation__meta');
            
            if (meta.length) {
                meta.after(studiosContainer);
            } else {
                var firstChild = contentGroup.children().first();
                if (firstChild.length) {
                    firstChild.after(studiosContainer);
                } else {
                    contentGroup.prepend(studiosContainer);
                }
            }

            if (studiosMode === 'show') {
                var limited = companies.slice(0, 3);
                limited.forEach(function(co) {
                    if (!co || !co.id) return;
                    var node = $('<div class="applecation__studio selector" data-id="' + co.id + '" data-name="' + (co.name || '') + '"></div>');
                    node.css({
                        'display': 'inline-flex',
                        'align-items': 'center',
                        'gap': '0.4em',
                        'background': 'rgba(255,255,255,0.08)',
                        'border': '1px solid rgba(255,255,255,0.1)',
                        'border-radius': '0.6em',
                        'padding': '0.25em 0.6em',
                        'cursor': 'pointer',
                        'color': '#ffffff'
                    });

                    if (co.logo_path) {
                        var imgUrl = Lampa.Api.img(co.logo_path, 'h100');
                        node.html('<img src="' + imgUrl + '" title="' + (co.name || '') + '" style="height:1.3em;max-width:120px;width:auto;object-fit:contain;filter:brightness(0) invert(1);" />');
                    } else {
                        node.html('<span class="applecation__studio-name">' + (co.name || '') + '</span>');
                    }

                    node.on('hover:enter click', function() {
                        var id = $(this).data('id');
                        if (!id) return;
                        Lampa.Activity.push({
                            url: 'movie',
                            id: id,
                            title: $(this).data('name') || '',
                            component: 'company',
                            source: 'tmdb',
                            page: 1
                        });
                    });

                    studiosContainer.append(node);
                });
                studiosContainer.addClass('show');
            }

        } catch (e) {
            console.warn('[Тема от SERG] Ошибка рендера студий:', e);
        }
    }

    // =================================================================
    // DOM MODIFICATION
    // =================================================================

    function modifyCardDOM(render, movie) {
        try {
            var isTv = !!(movie.name || movie.original_name || movie.first_air_date || movie.number_of_seasons);

            render.find('.full-start-new__tagline, .full-start__tagline, .tagline, [class*="tagline"]').remove();
            render.find('.full-start-new__head .tagline, .full-start__head .tagline').remove();

            render.find('.full-start-new__head, .full-start-new__details, .full-descr, .full-descr__title, .full-start__head, .full-start-new__reactions').hide();

            var bgEnabled = Lampa.Storage.get('applecation_content_bg', true);
            var scalePercent = parseFloat(Lampa.Storage.get('applecation_content_scale', '100'));
            var contentPosition = Lampa.Storage.get('applecation_content_position', 'left');

            var right = render.find('.full-start-new__right');
            if (!right.length) return;

            var left = right.find('.applecation__left');
            if (!left.length) {
                left = $('<div class="applecation__left"></div>');
                right.prepend(left);
            }

            var logoWrapper = left.find('.applecation__logo-wrapper');
            if (!logoWrapper.length) {
                logoWrapper = $('<div class="applecation__logo-wrapper"><img class="applecation__logo" style="display:none;" /></div>');
                left.prepend(logoWrapper);
            }

            var contentWrapper = left.find('.applecation__content-wrapper');
            if (!contentWrapper.length) {
                contentWrapper = $('<div class="applecation__content-wrapper"></div>');
                left.append(contentWrapper);
            }

            // Создаем wrapper для масштабирования
            var wrapper = $('<div class="applecation__wrapper"></div>');
            var logoHtml = logoWrapper.detach();
            var contentHtml = contentWrapper.detach();
            wrapper.append(logoHtml);
            wrapper.append(contentHtml);
            left.append(wrapper);
            
            wrapper = left.find('.applecation__wrapper');
            logoWrapper = wrapper.find('.applecation__logo-wrapper');
            contentWrapper = wrapper.find('.applecation__content-wrapper');

            // Позиционирование всего блока через wrapper
            var alignMap = {
                'left': 'flex-start',
                'center': 'center',
                'right': 'flex-end'
            };
            left.css({
                'display': 'flex',
                'align-items': alignMap[contentPosition] || 'flex-start',
                'justify-content': contentPosition === 'center' ? 'center' : 'flex-start'
            });
            wrapper.css({
                'max-width': contentPosition === 'center' ? '60%' : '100%',
                'width': '100%',
                'transform-origin': contentPosition === 'right' ? 'right bottom' : 'left bottom',
                'transition': 'transform 0.3s ease'
            });

            contentWrapper.css('position', 'relative');
            contentWrapper.css('z-index', '10');
            contentWrapper.css('max-width', '50vw');

            var contentGroup = $('<div class="applecation__content-group"></div>');
            contentWrapper.wrapInner(contentGroup);
            contentGroup = contentWrapper.find('.applecation__content-group');

            var scaleValue = scalePercent / 100;
            wrapper.css('transform', 'scale(' + scaleValue + ')');
            
            var logoOffset = (scaleValue - 1) * 100;
            logoWrapper.css({
                'transform': 'translateY(-' + (logoOffset * 0.5) + 'px)',
                'transition': 'transform 0.3s ease'
            });

            if (!bgEnabled) {
                contentWrapper.css('background', 'transparent');
                contentWrapper.css('backdrop-filter', 'none');
                contentWrapper.css('-webkit-backdrop-filter', 'none');
                contentWrapper.css('border', 'none');
                contentWrapper.css('box-shadow', 'none');
                contentWrapper.css('background-color', 'transparent');
            } else {
                contentWrapper.css('background', 'rgba(0,0,0,0.3)');
                contentWrapper.css('backdrop-filter', 'blur(10px)');
                contentWrapper.css('-webkit-backdrop-filter', 'blur(10px)');
                contentWrapper.css('border', '1px solid rgba(255,255,255,0.05)');
                contentWrapper.css('box-shadow', '0 4px 20px rgba(0,0,0,0.3)');
                contentWrapper.css('background-color', 'rgba(0,0,0,0.3)');
            }

            var title = render.find('.full-start-new__title');
            if (title.length) {
                title.detach();
                contentGroup.append(title);
                title.show();
            }

            var meta = contentGroup.find('.applecation__meta');
            if (!meta.length) {
                meta = $('<div class="applecation__meta"></div>');
                contentGroup.append(meta);
            }

            var ratings = contentGroup.find('.applecation__ratings');
            if (!ratings.length) {
                ratings = $('<div class="applecation__ratings"></div>');
                contentGroup.append(ratings);
            }

            var reactions = contentGroup.find('.applecation__reactions');
            if (!reactions.length) {
                reactions = $('<div class="applecation__reactions"></div>');
                contentGroup.append(reactions);
            }

            var descWrapper = contentGroup.find('.applecation__description-wrapper');
            if (!descWrapper.length) {
                descWrapper = $('<div class="applecation__description-wrapper"><div class="applecation__description"></div></div>');
                contentGroup.append(descWrapper);
            }

            var info = contentGroup.find('.applecation__info');
            if (!info.length) {
                info = $('<div class="applecation__info"><span class="applecation__info-text"></span><span class="applecation__quality-badges"></span></div>');
                contentGroup.append(info);
            }

            var buttons = contentGroup.find('.full-start-new__buttons');
            if (!buttons.length) {
                buttons = render.find('.full-start-new__buttons');
                if (buttons.length) {
                    buttons.detach();
                    contentGroup.append(buttons);
                }
            }

            render.find('.full-start-new__rate-line').remove();
            render.find('.applecation__right').remove();

            render.addClass('applecation');

            var bg = render.find('.full-start__background:not(.applecation__overlay)');
            if (bg.length && !bg.next('.applecation__overlay').length) {
                bg.after('<div class="full-start__background loaded applecation__overlay"></div>');
            }
            
        } catch (e) {
            console.error('[Тема от SERG] Ошибка модификации DOM:', e);
        }
    }

    // =================================================================
    // ОБНОВЛЕНИЕ МАСШТАБА В РЕАЛЬНОМ ВРЕМЕНИ
    // =================================================================

    function updateContentScale(render) {
        try {
            var wrapper = render.find('.applecation__wrapper');
            if (!wrapper.length) return;

            var scalePercent = parseFloat(Lampa.Storage.get('applecation_content_scale', '100'));
            var scaleValue = scalePercent / 100;
            
            wrapper.css('transform', 'scale(' + scaleValue + ')');
            
            var logoWrapper = wrapper.find('.applecation__logo-wrapper');
            if (logoWrapper.length) {
                var logoOffset = (scaleValue - 1) * 100;
                logoWrapper.css({
                    'transform': 'translateY(-' + (logoOffset * 0.5) + 'px)',
                    'transition': 'transform 0.3s ease'
                });
            }

            var contentWrapper = render.find('.applecation__content-wrapper');
            contentWrapper.css('max-width', '50vw');

            // Позиция всей информации контента
            var contentPosition = Lampa.Storage.get('applecation_content_position', 'left');
            var left = render.find('.applecation__left');
            if (left.length) {
                var alignMap = {
                    'left': 'flex-start',
                    'center': 'center',
                    'right': 'flex-end'
                };
                left.css({
                    'display': 'flex',
                    'align-items': alignMap[contentPosition] || 'flex-start',
                    'justify-content': contentPosition === 'center' ? 'center' : 'flex-start'
                });
                wrapper.css({
                    'max-width': contentPosition === 'center' ? '60%' : '100%',
                    'transform-origin': contentPosition === 'right' ? 'right bottom' : 'left bottom'
                });
            }

            // Позиция рейтингов и реакций
            var ratingsPosition = Lampa.Storage.get('applecation_ratings_position', 'left');
            var ratingsContainer = render.find('.applecation__ratings');
            if (ratingsContainer.length) {
                ratingsContainer.css('justify-content', ratingsPosition === 'center' ? 'center' : 'flex-start');
            }
            var reactionsContainer = render.find('.applecation__reactions');
            if (reactionsContainer.length) {
                reactionsContainer.css('justify-content', ratingsPosition === 'center' ? 'center' : 'flex-start');
            }
            var meta = render.find('.applecation__meta');
            if (meta.length) {
                meta.css('justify-content', ratingsPosition === 'center' ? 'center' : 'flex-start');
            }

            // Позиция бейджей качества/инфо о сезонах
            var infoPosition = Lampa.Storage.get('applecation_info_position', 'left');
            var info = render.find('.applecation__info');
            if (info.length) {
                if (infoPosition === 'center') {
                    info.css('align-items', 'center');
                    info.css('text-align', 'center');
                } else {
                    info.css('align-items', 'flex-start');
                    info.css('text-align', 'left');
                }
            }

            var bgEnabled = Lampa.Storage.get('applecation_content_bg', true);
            if (!bgEnabled) {
                contentWrapper.css('background', 'transparent');
                contentWrapper.css('backdrop-filter', 'none');
                contentWrapper.css('-webkit-backdrop-filter', 'none');
                contentWrapper.css('border', 'none');
                contentWrapper.css('box-shadow', 'none');
                contentWrapper.css('background-color', 'transparent');
            } else {
                contentWrapper.css('background', 'rgba(0,0,0,0.3)');
                contentWrapper.css('backdrop-filter', 'blur(10px)');
                contentWrapper.css('-webkit-backdrop-filter', 'blur(10px)');
                contentWrapper.css('border', '1px solid rgba(255,255,255,0.05)');
                contentWrapper.css('box-shadow', '0 4px 20px rgba(0,0,0,0.3)');
                contentWrapper.css('background-color', 'rgba(0,0,0,0.3)');
            }
            
        } catch (e) {
            console.warn('[Тема от SERG] Ошибка обновления масштаба:', e);
        }
    }

    // =================================================================
    // CONTENT FILLING
    // =================================================================

    function fillContent(render, movie, ratings, lampaData, qualityData) {
        try {
            var isTv = !!(movie.name || movie.original_name || movie.first_air_date || movie.number_of_seasons);
            var descriptionOverlayEnabled = Lampa.Storage.get('applecation_description_overlay', true);
            var ratingsPosition = Lampa.Storage.get('applecation_ratings_position', 'left');
            var infoPosition = Lampa.Storage.get('applecation_info_position', 'left');

            var contentGroup = render.find('.applecation__content-group');
            if (!contentGroup.length) {
                contentGroup = render.find('.applecation__content-wrapper');
            }

            // 1. МЕТА-ИНФОРМАЦИЯ
            var meta = contentGroup.find('.applecation__meta');
            if (meta.length) {
                meta.empty();
                meta.css({
                    'display': 'flex',
                    'flex-wrap': 'wrap',
                    'gap': '0.5em',
                    'margin-bottom': '0.7em',
                    'padding': '0.3em 0',
                    'font-size': '1.0em',
                    'line-height': '1.4',
                    'justify-content': ratingsPosition === 'center' ? 'center' : 'flex-start'
                });

                var date = movie.release_date || movie.first_air_date || '';
                if (date) {
                    var year = date.split('-')[0];
                    meta.append('<span class="applecation__meta-item applecation__meta-year" style="background: #3498db; color: #ffffff; padding: 0.2em 0.6em; border-radius: 0.3em; font-weight: 600; display: inline-block;">' + year + '</span>');
                }

                var runtimeText = '';
                if (isTv) {
                    if (movie.episode_run_time && movie.episode_run_time.length) {
                        var m = movie.episode_run_time[0];
                        runtimeText = m + ' ' + Lampa.Lang.translate('time_m').replace('.', '');
                    }
                } else if (movie.runtime && movie.runtime > 0) {
                    var h = Math.floor(movie.runtime / 60);
                    var mm = movie.runtime % 60;
                    var th = Lampa.Lang.translate('time_h').replace('.', '');
                    var tmm = Lampa.Lang.translate('time_m').replace('.', '');
                    runtimeText = h > 0 ? (h + ' ' + th + ' ' + mm + ' ' + tmm) : (mm + ' ' + tmm);
                }
                
                if (runtimeText) {
                    meta.append('<span class="applecation__meta-item applecation__meta-runtime" style="background: #9b59b6; color: #ffffff; padding: 0.2em 0.6em; border-radius: 0.3em; font-weight: 600; display: inline-block;">⏱ ' + runtimeText + '</span>');
                }

                var typeText = isTv ? 'Сериал' : 'Фильм';
                meta.append('<span class="applecation__meta-item applecation__meta-type" style="background: #2ecc71; color: #ffffff; padding: 0.2em 0.6em; border-radius: 0.3em; font-weight: 600; display: inline-block;">' + typeText + '</span>');

                if (movie.genres && movie.genres.length) {
                    var genres = movie.genres.slice(0, 3).map(function(x) {
                        return Lampa.Utils.capitalizeFirstLetter(x.name);
                    });
                    meta.append('<span class="applecation__meta-item applecation__meta-genres" style="background: #1abc9c; color: #ffffff; padding: 0.2em 0.6em; border-radius: 0.3em; font-weight: 600; display: inline-block;">' + genres.join(' · ') + '</span>');
                }

                if (qualityData && qualityData.resolution) {
                    var qualityText = qualityData.resolution;
                    var qualityColors = {
                        '4K': '#2ecc71',
                        'FHD': '#3498db',
                        'HD': '#f39c12',
                        'TS': '#e74c3c',
                        'SD': '#95a5a6'
                    };
                    var qualityColor = qualityColors[qualityText] || '#34495e';
                    meta.append('<span class="applecation__meta-item applecation__meta-quality" style="background: ' + qualityColor + '; color: #ffffff; padding: 0.2em 0.6em; border-radius: 0.3em; font-weight: 600; display: inline-block;">' + qualityText + '</span>');
                }

                var pg = parsePG(movie);
                if (pg) {
                    var ageColor = getAgeColor(pg);
                    meta.append('<span class="applecation__meta-item applecation__meta-age" style="background: ' + ageColor + '; color: #ffffff; padding: 0.2em 0.6em; border-radius: 0.3em; font-weight: 700; display: inline-block;">' + pg + '</span>');
                }

                meta.addClass('show');
            }

            renderStudiosLine(render, movie);

            // 3. РЕЙТИНГИ
            var ratingsContainer = contentGroup.find('.applecation__ratings');
            if (ratingsContainer.length) {
                ratingsContainer.empty();
                ratingsContainer.css('justify-content', ratingsPosition === 'center' ? 'center' : 'flex-start');

                var ratingItems = [];
                var allRatings = [];

                var useIcons = Lampa.Storage.get('applecation_rating_icons', false);
                var useReactionIcon = Lampa.Storage.get('applecation_lampa_reaction_icon', false);

                if (lampaData && lampaData.rating > 0) {
                    var lampaColor = getRatingColor(lampaData.rating);
                    var lampaBg = getRatingBackgroundColor(lampaData.rating);
                    var icon = '';
                    
                    // Анимированная реакция добавляется дополнительно к иконке/названию
                    if (useReactionIcon && lampaData.medianReaction && REACTION_GIFS[lampaData.medianReaction]) {
                        icon = '<img src="' + REACTION_GIFS[lampaData.medianReaction] + '" style="width:1em;height:1em;object-fit:contain;border-radius:50%;margin-right:0.2em;" />';
                    } else if (useIcons) {
                        icon = RATING_ICONS['Lampa'];
                    }
                    
                    ratingItems.push({
                        source: 'Lampa',
                        value: lampaData.rating,
                        color: lampaColor,
                        bg: lampaBg,
                        icon: icon,
                        useIcon: useIcons || useReactionIcon
                    });
                    allRatings.push(lampaData.rating);
                }

                if (ratings.tmdb > 0) {
                    var tmdbColor = getRatingColor(ratings.tmdb);
                    var tmdbBg = getRatingBackgroundColor(ratings.tmdb);
                    var icon = useIcons ? RATING_ICONS['TMDB'] : '';
                    ratingItems.push({
                        source: 'TMDB',
                        value: ratings.tmdb,
                        color: tmdbColor,
                        bg: tmdbBg,
                        icon: icon,
                        useIcon: useIcons
                    });
                    allRatings.push(ratings.tmdb);
                }

                if (ratings.imdb > 0) {
                    var imdbColor = getRatingColor(ratings.imdb);
                    var imdbBg = getRatingBackgroundColor(ratings.imdb);
                    var icon = useIcons ? RATING_ICONS['IMDb'] : '';
                    ratingItems.push({
                        source: 'IMDb',
                        value: ratings.imdb,
                        color: imdbColor,
                        bg: imdbBg,
                        icon: icon,
                        useIcon: useIcons
                    });
                    allRatings.push(ratings.imdb);
                }

                if (ratings.kinopoisk > 0) {
                    var kpColor = getRatingColor(ratings.kinopoisk);
                    var kpBg = getRatingBackgroundColor(ratings.kinopoisk);
                    var icon = useIcons ? RATING_ICONS['Кинопоиск'] : '';
                    ratingItems.push({
                        source: 'Кинопоиск',
                        value: ratings.kinopoisk,
                        color: kpColor,
                        bg: kpBg,
                        icon: icon,
                        useIcon: useIcons
                    });
                    allRatings.push(ratings.kinopoisk);
                }

                if (allRatings.length > 1) {
                    var sum = 0;
                    for (var i = 0; i < allRatings.length; i++) {
                        sum += allRatings[i];
                    }
                    var avg = sum / allRatings.length;
                    var avgColor = getRatingColor(avg);
                    var avgBg = getRatingBackgroundColor(avg, true);
                    ratingItems.push({
                        source: 'ИТОГ',
                        value: avg,
                        color: '#000',
                        bg: avgBg,
                        isTotal: true
                    });
                }

                ratingItems.forEach(function(item) {
                    var displayValue = item.value.toFixed(1);
                    var extraClass = item.isTotal ? ' applecation__rating-item--total' : '';
                    var iconHtml = '';
                    
                    if (item.useIcon && item.icon) {
                        iconHtml = '<span class="rating-icon" style="width:1.2em;height:1.2em;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">' + item.icon + '</span>';
                    }
                    
                    var sourceText = item.useIcon ? '' : item.source;
                    var textColor = item.isTotal ? '#000' : '#ffffff';
                    
                    ratingsContainer.append(
                        '<div class="applecation__rating-item' + extraClass + '" style="border-color: ' + item.color + '40; background: ' + item.bg + ';">' +
                        iconHtml +
                        '<span class="rating-value" style="color: ' + item.color + ';">' + displayValue + '</span>' +
                        '<span class="rating-source" style="color: ' + textColor + ';">' + sourceText + '</span>' +
                        '</div>'
                    );
                });

                if (ratingItems.length > 0) {
                    ratingsContainer.addClass('show');
                } else {
                    ratingsContainer.hide();
                }
            }

            // 4. РЕАКЦИИ
            var reactionsContainer = contentGroup.find('.applecation__reactions');
            if (reactionsContainer.length) {
                reactionsContainer.empty();
                reactionsContainer.css('justify-content', ratingsPosition === 'center' ? 'center' : 'flex-start');

                var hasReactions = false;
                var useAnimated = Lampa.Storage.get('applecation_animated_reactions', false);

                if (lampaData && lampaData.reactions && Array.isArray(lampaData.reactions) && lampaData.reactions.length > 0) {
                    var emojiMap = {
                        'fire': '🔥', 'nice': '👍', 'think': '🤔',
                        'bore': '😴', 'shit': '💩', 'like': '❤️', 'dislike': '👎'
                    };

                    var sorted = lampaData.reactions.slice().sort(function(a, b) {
                        return (parseInt(b.counter) || 0) - (parseInt(a.counter) || 0);
                    });

                    sorted.forEach(function(reaction) {
                        var count = parseInt(reaction.counter) || 0;
                        if (count === 0) return;
                        
                        var emoji = emojiMap[reaction.type] || '⭐';
                        
                        if (useAnimated && REACTION_GIFS[reaction.type]) {
                            reactionsContainer.append(
                                '<div class="applecation__reaction-item" style="color: #ffffff;">' +
                                '<img src="' + REACTION_GIFS[reaction.type] + '" style="width:1.2em;height:1.2em;object-fit:contain;" />' +
                                '<span class="reaction-count" style="color: #ffffff;">' + count + '</span>' +
                                '</div>'
                            );
                        } else {
                            reactionsContainer.append(
                                '<div class="applecation__reaction-item" style="color: #ffffff;">' +
                                '<span>' + emoji + '</span>' +
                                '<span class="reaction-count" style="color: #ffffff;">' + count + '</span>' +
                                '</div>'
                            );
                        }
                        hasReactions = true;
                    });
                }

                if (hasReactions) {
                    reactionsContainer.addClass('show');
                } else {
                    reactionsContainer.hide();
                }
            }

            // 5. ОПИСАНИЕ
            var descWrapper = contentGroup.find('.applecation__description-wrapper');
            var description = contentGroup.find('.applecation__description');
            if (descWrapper.length && description.length) {
                var text = movie.overview || 'Описание отсутствует';
                description.text(text);
                description.css('color', '#ffffff');

                if (descriptionOverlayEnabled) {
                    descWrapper.off('hover:enter').on('hover:enter', function() {
                        showDescriptionOverlay(movie);
                    });
                    descWrapper.addClass('selector');
                    if (window.Lampa && Lampa.Controller) {
                        try {
                            Lampa.Controller.collectionAppend(descWrapper);
                        } catch (e) {}
                    }
                } else {
                    descWrapper.removeClass('selector');
                    descWrapper.off('hover:enter');
                }
                descWrapper.addClass('show');
            }

            // 6. ИНФОРМАЦИЯ О СЕЗОНАХ
            var info = contentGroup.find('.applecation__info');
            if (info.length) {
                var infoText = info.find('.applecation__info-text');
                if (infoText.length) {
                    infoText.empty();
                    var infoParts = [];

                    if (isTv) {
                        var currentSeason = 0;
                        var currentEpisode = 0;
                        var totalEpisodesInSeason = 0;

                        var lastEpisode = movie.last_episode_to_air;
                        if (lastEpisode) {
                            currentSeason = lastEpisode.season_number || 0;
                            currentEpisode = lastEpisode.episode_number || 0;
                            
                            if (movie.seasons && Array.isArray(movie.seasons)) {
                                for (var i = 0; i < movie.seasons.length; i++) {
                                    if (movie.seasons[i].season_number === currentSeason) {
                                        totalEpisodesInSeason = movie.seasons[i].episode_count || 0;
                                        break;
                                    }
                                }
                            }
                        }

                        if (currentSeason > 0) {
                            var seasonText = 'Сезон ' + currentSeason;
                            if (currentEpisode > 0 && totalEpisodesInSeason > 0) {
                                seasonText += ' · ' + currentEpisode + '/' + totalEpisodesInSeason + ' серий';
                            } else if (currentEpisode > 0) {
                                seasonText += ' · ' + currentEpisode + ' серия';
                            }
                            infoParts.push(
                                '<span class="applecation__season-info" style="background: #2196f3; color: #ffffff; padding: 0.15em 0.5em; border-radius: 0.3em; font-size: 0.8em; font-weight: 600; line-height: 1.3;">' +
                                seasonText +
                                '</span>'
                            );
                        }

                        var totalSeasons = movie.number_of_seasons || 0;
                        var totalEpisodes = movie.number_of_episodes || 0;
                        
                        var totalText = '';
                        if (totalSeasons > 0 && totalEpisodes > 0) {
                            totalText = totalSeasons + ' сез. · ' + totalEpisodes + ' сер.';
                        } else if (totalSeasons > 0) {
                            totalText = totalSeasons + ' сез.';
                        } else if (totalEpisodes > 0) {
                            totalText = totalEpisodes + ' сер.';
                        }

                        if (totalText) {
                            infoParts.push(
                                '<span class="applecation__season-info" style="background: #e74c3c; color: #ffffff; padding: 0.15em 0.5em; border-radius: 0.3em; font-size: 0.8em; font-weight: 600; line-height: 1.3;">' +
                                'Всего: ' + totalText +
                                '</span>'
                            );
                        }

                        if (movie.status) {
                            var statusText = getStatusText(movie.status);
                            var statusColor = getStatusColor(movie.status);
                            infoParts.push(
                                '<span class="applecation__status-info" style="background: ' + statusColor + '; color: #ffffff; padding: 0.15em 0.5em; border-radius: 0.3em; font-size: 0.8em; font-weight: 600; line-height: 1.3;">' +
                                statusText +
                                '</span>'
                            );
                        }
                    }

                    infoText.html(infoParts.join(' '));
                }

                // БЕЙДЖИ КАЧЕСТВА
                var showQualityBadges = Lampa.Storage.get('applecation_show_quality_badges', true);
                var badgesContainer = info.find('.applecation__quality-badges');
                
                if (!badgesContainer.length) {
                    badgesContainer = $('<span class="applecation__quality-badges"></span>');
                    info.append(badgesContainer);
                }
                
                if (!showQualityBadges) {
                    badgesContainer.empty();
                    badgesContainer.hide();
                } else {
                    if (qualityData && !qualityData.empty) {
                        renderBadges(badgesContainer, qualityData);
                        badgesContainer.show();
                    } else {
                        getBestJacred(movie, function(data) {
                            if (data && !data.empty && data.resolution) {
                                renderBadges(badgesContainer, data);
                                badgesContainer.show();
                            } else {
                                badgesContainer.empty();
                                badgesContainer.hide();
                            }
                        });
                    }
                }

                // Позиция info
                if (infoPosition === 'center') {
                    info.css('align-items', 'center');
                    info.css('text-align', 'center');
                } else {
                    info.css('align-items', 'flex-start');
                    info.css('text-align', 'left');
                }

                info.addClass('show');
            }

            renderStudiosBtn(render, movie);

            if (isTv) {
                addEpisodeRuntime(render, movie);
                
                var episodesData = getEpisodesData(movie);
                if (episodesData && episodesData.episodes && episodesData.episodes.length > 0) {
                    processEpisodesWithData(render, episodesData);
                } else {
                    if (movie.seasons && Array.isArray(movie.seasons)) {
                        var allEpisodes = [];
                        movie.seasons.forEach(function(season) {
                            if (season.episodes && Array.isArray(season.episodes)) {
                                allEpisodes = allEpisodes.concat(season.episodes);
                            }
                        });
                        if (allEpisodes.length > 0) {
                            processEpisodesWithData(render, { episodes: allEpisodes });
                        }
                    }
                }
            }

            updateContentScale(render);

        } catch (e) {
            console.error('[Тема от SERG] Ошибка заполнения контента:', e);
        }
    }

    // =================================================================
    // ДЛИТЕЛЬНОСТЬ СЕРИИ
    // =================================================================

    function addEpisodeRuntime(render, movie) {
        try {
            if (!Lampa.Storage.get('lme_averageRuntime', false)) return;
            if (!movie.name && !movie.original_name && !movie.first_air_date) return;
            
            var imdbId = movie.imdb_id || (movie.external_ids && movie.external_ids.imdb_id);
            if (!imdbId) {
                var type = movie.name ? 'tv' : 'movie';
                var url = Lampa.TMDB.api(type + '/' + movie.id + '/external_ids?api_key=' + getTmdbKey());
                var network = new Lampa.Reguest();
                network.silent(url, function(data) {
                    if (data && data.imdb_id) {
                        fetchAverageRuntime(data.imdb_id, render);
                    }
                });
                return;
            }
            
            fetchAverageRuntime(imdbId, render);
            
        } catch (e) {
            console.warn('[Тема от SERG] Ошибка добавления длительности серии:', e);
        }
    }

    function fetchAverageRuntime(imdbId, render) {
        try {
            var network = new Lampa.Reguest();
            var url = 'https://api.tvmaze.com/lookup/shows?imdb=' + imdbId;
            
            network.silent(url, function(response) {
                if (response && response.averageRuntime) {
                    var avgRuntime = response.averageRuntime;
                    var hours = Math.floor(avgRuntime / 60);
                    var minutes = avgRuntime % 60;
                    var formattedRuntime = hours > 0 ? 
                        hours + 'ч ' + minutes + 'м' : 
                        minutes + 'м';
                    
                    var meta = render.find('.applecation__meta');
                    if (meta.length) {
                        var existingRuntime = meta.find('.applecation__meta-runtime-avg');
                        if (existingRuntime.length) {
                            existingRuntime.text('⏱ ' + formattedRuntime);
                        } else {
                            meta.append('<span class="applecation__meta-runtime-avg" style="background: #9b59b6; color: #ffffff; padding: 0.2em 0.6em; border-radius: 0.3em; font-weight: 600; display: inline-block;">⏱ ' + formattedRuntime + '</span>');
                        }
                    }
                }
            }, function() {});
            
        } catch (e) {
            console.warn('[Тема от SERG] Ошибка получения длительности серии:', e);
        }
    }

    // =================================================================
    // ОБРАБОТКА ЭПИЗОДОВ
    // =================================================================

    function processEpisodesWithData(render, episodesData) {
        try {
            if (!episodesData || !episodesData.episodes || !episodesData.episodes.length) {
                return;
            }

            var episodes = render.find('.full-episode');
            if (!episodes.length) {
                return;
            }

            var episodesMap = {};
            episodesData.episodes.forEach(function(ep) {
                var epNum = parseInt(ep.episode_number, 10);
                if (epNum > 0) {
                    episodesMap[epNum] = ep;
                }
            });

            episodes.each(function() {
                var ep = $(this);
                
                if (ep.find('.applecation-episode-overview').length) {
                    return;
                }

                var numEl = ep.find('.full-episode__num');
                if (!numEl.length) {
                    return;
                }

                var numText = numEl.text().trim();
                var episodeNum = 0;
                
                var match = numText.match(/Эпизод\s*(\d+)/i);
                if (match) {
                    episodeNum = parseInt(match[1], 10);
                } else {
                    match = numText.match(/E(\d+)/i);
                    if (match) {
                        episodeNum = parseInt(match[1], 10);
                    } else {
                        match = numText.match(/S\d+[:\s]*E?(\d+)/i);
                        if (match) {
                            episodeNum = parseInt(match[1], 10);
                        } else {
                            var num = parseInt(numText, 10);
                            if (!isNaN(num) && num > 0 && num < 100) {
                                episodeNum = num;
                            }
                        }
                    }
                }

                if (!episodeNum) {
                    return;
                }

                var epData = episodesMap[episodeNum];
                var overview = epData && epData.overview ? epData.overview : '';

                if (!overview) {
                    var epId = ep.data('id') || ep.attr('data-id');
                    if (epId) {
                        var idNum = parseInt(epId, 10);
                        if (idNum > 0) {
                            epData = episodesMap[idNum];
                            overview = epData && epData.overview ? epData.overview : '';
                        }
                    }
                }

                if (!overview) {
                    return;
                }

                var overlay = $('<div class="applecation-episode-overview">' + 
                    '<div class="applecation-episode-overview__text">' + escapeHtml(overview) + '</div>' +
                    '</div>');
                
                overlay.css({
                    'position': 'absolute',
                    'bottom': 'calc(100% + 8px)',
                    'left': '50%',
                    'transform': 'translateX(-50%)',
                    'background': 'rgba(0,0,0,0.92)',
                    'color': '#ffffff',
                    'padding': '0.5em 0.8em',
                    'border-radius': '0.5em',
                    'font-size': '0.7em',
                    'line-height': '1.3',
                    'max-width': '75em',
                    'min-width': '45em',
                    'white-space': 'normal',
                    'word-wrap': 'break-word',
                    'z-index': '100',
                    'display': 'none',
                    'pointer-events': 'none',
                    'backdrop-filter': 'blur(12px)',
                    'border': '1px solid rgba(255,255,255,0.08)',
                    'box-shadow': '0 8px 32px rgba(0,0,0,0.6)',
                    'text-align': 'center',
                    'font-family': 'inherit'
                });

                ep.css('position', 'relative');
                ep.append(overlay);

                var isHovered = false;
                
                ep.on('hover:enter', function() {
                    isHovered = true;
                    overlay.show();
                });

                ep.on('hover:leave', function() {
                    isHovered = false;
                    setTimeout(function() {
                        if (!isHovered) {
                            overlay.hide();
                        }
                    }, 100);
                });

                ep.on('hover:focus', function() {
                    overlay.show();
                });

                ep.on('hover:blur', function() {
                    overlay.hide();
                });
                
                ep.addClass('applecation-episode-has-overview');
            });

        } catch (e) {
            console.error('[Тема от SERG] Ошибка обработки эпизодов:', e);
        }
    }

    function renderBadges(container, qualityData) {
        try {
            if (!container || !container.length) return;
            if (!qualityData || qualityData.empty) return;

            container.empty();
            var hasBadges = false;

            if (qualityData.resolution) {
                var icon = QUALITY_ICONS[qualityData.resolution];
                if (icon) {
                    container.append('<span class="quality-badge quality-badge--icon" style="color: #ffffff;">' + icon + '</span>');
                    hasBadges = true;
                }
            }

            if (qualityData.dolbyVision) {
                var dvIcon = QUALITY_ICONS['Dolby Vision'];
                if (dvIcon) {
                    container.append('<span class="quality-badge quality-badge--icon" style="color: #ffffff;">' + dvIcon + '</span>');
                    hasBadges = true;
                }
            }
            
            if (qualityData.hdr && !qualityData.dolbyVision) {
                var hdrIcon = QUALITY_ICONS['HDR'];
                if (hdrIcon) {
                    container.append('<span class="quality-badge quality-badge--icon" style="color: #ffffff;">' + hdrIcon + '</span>');
                    hasBadges = true;
                }
            } else if (qualityData.hdr && qualityData.dolbyVision) {
                var hdrIcon = QUALITY_ICONS['HDR'];
                if (hdrIcon) {
                    container.append('<span class="quality-badge quality-badge--icon" style="color: #ffffff;">' + hdrIcon + '</span>');
                    hasBadges = true;
                }
            }

            if (qualityData.sound) {
                var soundIcon = QUALITY_ICONS[qualityData.sound];
                if (soundIcon) {
                    container.append('<span class="quality-badge quality-badge--icon" style="color: #ffffff;">' + soundIcon + '</span>');
                    hasBadges = true;
                }
            }

            if (qualityData.dub) {
                var dubIcon = QUALITY_ICONS['DUB'];
                if (dubIcon) {
                    container.append('<span class="quality-badge quality-badge--icon" style="color: #ffffff;">' + dubIcon + '</span>');
                    hasBadges = true;
                }
            }

            if (hasBadges) {
                container.addClass('show');
                container.css('display', 'flex');
            } else {
                container.removeClass('show');
                container.css('display', 'none');
            }

        } catch (e) {
            console.error('[Тема от SERG] Ошибка отрисовки бейджей:', e);
        }
    }

    // =================================================================
    // DESCRIPTION OVERLAY
    // =================================================================

    function showDescriptionOverlay(movie) {
        try {
            var text = movie.overview || 'Описание отсутствует';
            var title = movie.title || movie.name || '';

            $('.applecation-description-overlay').remove();

            var overlay = $(`
                <div class="applecation-description-overlay">
                    <div class="applecation-description-overlay__bg"></div>
                    <div class="applecation-description-overlay__content selector">
                        <div class="applecation-description-overlay__logo"></div>
                        <div class="applecation-description-overlay__title" style="color: #ffffff;">${escapeHtml(title)}</div>
                        <div class="applecation-description-overlay__text" style="color: #ffffff;">${escapeHtml(text)}</div>
                        <div class="applecation-description-overlay__details">
                            <div class="applecation-description-overlay__info">
                                <div class="applecation-description-overlay__info-name" style="color: #ffffff;">Дата выхода</div>
                                <div class="applecation-description-overlay__info-body" style="color: #ffffff;">${movie.release_date || movie.first_air_date || '-'}</div>
                            </div>
                            <div class="applecation-description-overlay__info" ${!movie.budget || movie.budget === 0 ? 'style="display:none;"' : ''}>
                                <div class="applecation-description-overlay__info-name" style="color: #ffffff;">Бюджет</div>
                                <div class="applecation-description-overlay__info-body" style="color: #ffffff;">$${Lampa.Utils.numberWithSpaces(movie.budget || 0)}</div>
                            </div>
                            <div class="applecation-description-overlay__info" ${!movie.production_countries || !movie.production_countries.length ? 'style="display:none;"' : ''}>
                                <div class="applecation-description-overlay__info-name" style="color: #ffffff;">Страны</div>
                                <div class="applecation-description-overlay__info-body" style="color: #ffffff;">${(movie.production_countries || []).map(function(c) { return c.name; }).join(', ')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            $('body').append(overlay);
            setTimeout(function() { overlay.addClass('show'); }, 10);

            var ctrl = {
                toggle: function() {
                    Lampa.Controller.collectionSet(overlay);
                    Lampa.Controller.collectionFocus(overlay.find('.applecation-description-overlay__content'), overlay);
                },
                back: function() {
                    var ol = $('.applecation-description-overlay');
                    if (!ol.length) return;
                    ol.removeClass('show');
                    setTimeout(function() { Lampa.Controller.toggle('content'); }, 300);
                }
            };

            Lampa.Controller.add('applecation_description', ctrl);
            Lampa.Controller.toggle('applecation_description');
        } catch (e) {
            console.error('[Тема от SERG] Ошибка показа описания в оверлее:', e);
        }
    }

    // =================================================================
    // LOGO LOADING
    // =================================================================

    function loadLogo(render, movie) {
        try {
            var logoImg = render.find('.applecation__logo');
            var wrapper = render.find('.applecation__logo-wrapper');
            var titleEl = render.find('.full-start-new__title');

            if (!logoImg.length || !wrapper.length) return;

            fetchLogo(movie, function(logo) {
                try {
                    if (!logo) {
                        titleEl.show();
                        wrapper.addClass('loaded');
                        return;
                    }

                    var logoUrl = getLogoUrl(logo);
                    if (!logoUrl) {
                        titleEl.show();
                        wrapper.addClass('loaded');
                        return;
                    }

                    var img = new Image();
                    img.onload = function() {
                        if (!render.closest('body').length) return;
                        logoImg.attr('src', logoUrl);
                        logoImg.show();
                        wrapper.addClass('loaded');
                        titleEl.hide();

                        var overlay = $('.applecation-description-overlay');
                        if (overlay.length) {
                            overlay.find('.applecation-description-overlay__logo')
                                .html($('<img>').attr('src', logoUrl))
                                .css('display', 'block');
                            overlay.find('.applecation-description-overlay__title')
                                .css('display', 'none');
                        }
                    };
                    img.onerror = function() {
                        titleEl.show();
                        wrapper.addClass('loaded');
                    };
                    img.src = logoUrl;
                } catch (e) {
                    titleEl.show();
                    wrapper.addClass('loaded');
                }
            });
        } catch (e) {
            console.error('[Тема от SERG] Ошибка загрузки логотипа:', e);
        }
    }

    // =================================================================
    // ANIMATIONS
    // =================================================================

    function setupAnimations(render) {
        try {
            var effectsEnabled = Lampa.Storage.get('applecation_effects_enabled', true);
            
            if (!effectsEnabled) {
                render.find('.applecation__meta, .applecation__ratings, .applecation__reactions, .applecation__description-wrapper, .applecation__info').each(function() {
                    $(this).addClass('show');
                    $(this).css('opacity', '1');
                    $(this).css('transform', 'none');
                });
                
                var bg = render.find('.full-start__background:not(.applecation__overlay)');
                if (bg.length && bg.hasClass('loaded')) {
                    bg.addClass('applecation-animated');
                }
                return;
            }

            setTimeout(function() {
                if (!render.closest('body').length) return;

                render.find('.applecation__meta, .applecation__ratings, .applecation__reactions, .applecation__description-wrapper, .applecation__info').each(function() {
                    $(this).addClass('show');
                });

                render.find('.applecation__meta, .applecation__ratings, .applecation__reactions, .applecation__description-wrapper, .applecation__info').css('opacity', '1');
            }, 350);

            var bg = render.find('.full-start__background:not(.applecation__overlay)');
            if (bg.length) {
                if (bg.hasClass('loaded')) {
                    bg.addClass('applecation-animated');
                } else {
                    var interval = setInterval(function() {
                        if (bg.hasClass('loaded')) {
                            clearInterval(interval);
                            bg.addClass('applecation-animated');
                        }
                    }, 100);
                }
            }
        } catch (e) {
            console.error('[Тема от SERG] Ошибка настройки анимаций:', e);
        }
    }

    // =================================================================
    // POSTER SCROLL HANDLER
    // =================================================================

    function setupPosterScrollHandler(render) {
        try {
            var poster = render.find('.full-start__background:not(.applecation__overlay)');
            if (!poster.length) return;

            var scrollBody = render.find('.scroll__body');
            if (!scrollBody.length) return;

            var overlay = render.find('.applecation__overlay');
            if (!overlay.length) {
                overlay = $('<div class="full-start__background loaded applecation__overlay"></div>');
                poster.after(overlay);
            }

            var threshold = 80;

            scrollBody.on('scroll.applecation', function() {
                var scrollTop = $(this).scrollTop();
                
                if (scrollTop > threshold) {
                    poster.css({
                        'filter': 'blur(30px)',
                        'opacity': '0.6',
                        'transition': 'filter 0.4s ease-out, opacity 0.4s ease-out'
                    });
                    overlay.css({
                        'background': 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.9) 100%)',
                        'opacity': '1',
                        'transition': 'opacity 0.4s ease-out'
                    });
                } else {
                    poster.css({
                        'filter': 'none',
                        'opacity': '1',
                        'transition': 'filter 0.4s ease-out, opacity 0.4s ease-out'
                    });
                    overlay.css({
                        'background': 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 25%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.10) 55%, rgba(0,0,0,0.04) 60%, rgba(0,0,0,0) 65%)',
                        'opacity': '1',
                        'transition': 'opacity 0.4s ease-out'
                    });
                }
            });

            render.on('remove.applecation', function() {
                scrollBody.off('scroll.applecation');
            });

        } catch (e) {
            console.warn('[Тема от SERG] Ошибка обработчика скролла постера:', e);
        }
    }

    // =================================================================
    // STYLES
    // =================================================================

    function injectStyles() {
        try {
            $('#applecation_plus_css').remove();

            var css = `
            .applecation { transition: all .3s !important; }
            .applecation .full-start-new__body { height: 80vh !important; min-height: 400px !important; }
            .applecation .full-start-new__right { display: flex !important; align-items: flex-end !important; padding: 0 2em 2em 2em !important; }
            .applecation .full-start-new__left { display: none !important; }
            .applecation .applecation__left { flex: 1 !important; width: 100% !important; position: relative !important; display: flex !important; align-items: flex-start !important; }
            .applecation .applecation__content-wrapper { font-size: 100% !important; max-width: 50vw !important; padding: 1.5em !important; border-radius: 1em !important; position: relative !important; z-index: 10 !important; display: flex !important; flex-direction: column !important; }
            .applecation__wrapper { transition: transform 0.3s ease; width: 100%; }
            .applecation__logo-wrapper { margin-bottom: 0.5em !important; opacity: 0 !important; transform: translateY(20px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__logo-wrapper.loaded { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__logo { display: block !important; max-width: 30vw !important; max-height: 150px !important; width: auto !important; height: auto !important; object-fit: contain !important; object-position: left center !important; filter: drop-shadow(0 2px 10px rgba(0,0,0,0.5)) !important; }
            .applecation .full-start-new__title { font-size: 2.5em !important; font-weight: 700 !important; line-height: 1.2 !important; margin-bottom: 0.3em !important; color: #ffffff !important; text-shadow: 0 2px 10px rgba(0,0,0,0.5) !important; }
            .applecation__meta { display: flex !important; flex-wrap: wrap !important; gap: 0.5em !important; margin-bottom: 0.7em !important; padding: 0.3em 0 !important; font-size: 1.0em !important; line-height: 1.4 !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__meta.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__meta-item { color: #ffffff !important; display: inline-block !important; }
            .applecation__studios { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.7em !important; margin: 0 0 0.5em 0 !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__studios.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__studio { display: inline-flex !important; align-items: center !important; gap: 0.4em !important; background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 0.6em !important; padding: 0.25em 0.6em !important; transition: all 0.2s ease !important; cursor: pointer !important; color: #ffffff !important; }
            .applecation__studio.focus { background: rgba(255,255,255,0.2) !important; border-color: #fff !important; transform: scale(1.05) !important; }
            .applecation__studio img { height: 1.3em !important; max-width: 120px !important; width: auto !important; object-fit: contain !important; filter: brightness(0) invert(1) !important; }
            .applecation__ratings { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.5em !important; margin-bottom: 0.5em !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__ratings.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__rating-item { display: flex !important; align-items: center !important; gap: 0.35em !important; padding: 0.2em 0.6em !important; border-radius: 0.4em !important; background: rgba(0,0,0,0.5) !important; border: 1.5px solid rgba(255,255,255,0.15) !important; font-size: 0.8em !important; font-weight: 600 !important; color: #ffffff !important; line-height: 1 !important; }
            .applecation__rating-item .rating-value { font-size: 1.05em !important; font-weight: 700 !important; }
            .applecation__rating-item .rating-source { font-size: 0.7em !important; opacity: 0.7 !important; margin-left: 0.15em !important; color: #ffffff !important; }
            .applecation__rating-item .rating-icon { margin-right: 0.1em; width: 1.2em; height: 1.2em; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .applecation__rating-item--total { border-color: rgba(255,215,0,0.5) !important; background: #FFD700 !important; }
            .applecation__rating-item--total .rating-value { color: #000 !important; }
            .applecation__rating-item--total .rating-source { color: #000 !important; }
            .applecation__reactions { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.6em !important; margin-bottom: 0.5em !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; }
            .applecation__reactions.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__reaction-item { display: flex !important; align-items: center !important; gap: 0.3em !important; padding: 0.15em 0.5em !important; border-radius: 0.4em !important; background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.08) !important; font-size: 0.85em !important; color: #ffffff !important; line-height: 1 !important; }
            .applecation__reaction-item .reaction-count { font-weight: 600 !important; font-size: 0.9em !important; color: #ffffff !important; }
            .applecation__reaction-item img { border-radius: 50%; width: 1.2em; height: 1.2em; object-fit: contain; }
            .applecation__description-wrapper { background: transparent !important; padding: 0 !important; border-radius: 1em !important; width: fit-content !important; opacity: 0 !important; transform: translateY(15px) !important; transition: padding 0.25s ease, transform 0.25s ease, opacity 0.4s ease-out !important; cursor: pointer !important; }
            .applecation__description-wrapper.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__description-wrapper.focus { background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.18)) !important; padding: 0.15em 0.4em 0 0.7em !important; border-radius: 1em !important; width: fit-content !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35) !important; transform: scale(1.07) translateY(0) !important; }
            .applecation__description { color: #ffffff !important; font-size: 0.95em !important; line-height: 1.5 !important; margin-bottom: 0.5em !important; max-width: 35vw !important; display: -webkit-box !important; -webkit-line-clamp: 4 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; text-overflow: ellipsis !important; }
            .focus .applecation__description { color: #ffffff !important; }
            .applecation__info { color: #ffffff !important; font-size: 0.95em !important; line-height: 1.4 !important; margin-bottom: 0.5em !important; opacity: 0 !important; transform: translateY(15px) !important; transition: opacity 0.4s ease-out, transform 0.4s ease-out !important; display: flex !important; flex-direction: column !important; gap: 0.5em !important; }
            .applecation__info.show { opacity: 1 !important; transform: translateY(0) !important; }
            .applecation__info.align-center { align-items: center !important; text-align: center !important; }
            .applecation__info.align-left { align-items: flex-start !important; text-align: left !important; }
            .applecation__season-info { color: #ffffff !important; }
            .applecation__status-info { color: #ffffff !important; }
            .applecation__quality-badges { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 0.3em !important; margin-top: 0.3em !important; opacity: 0 !important; transform: translateY(10px) !important; transition: opacity 0.3s ease-out, transform 0.3s ease-out !important; }
            .applecation__quality-badges.show { opacity: 1 !important; transform: translateY(0) !important; }
            .quality-badge { display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 0.1em 0.3em !important; border-radius: 0.2em !important; font-size: 0.65em !important; font-weight: 700 !important; line-height: 1.2 !important; color: #ffffff !important; text-transform: uppercase !important; letter-spacing: 0.02em !important; border: 1px solid rgba(255,255,255,0.1) !important; background: rgba(0,0,0,0.4) !important; }
            .quality-badge--icon { background: transparent !important; border: none !important; padding: 0 !important; height: 1.1em !important; color: #ffffff !important; }
            .quality-badge--icon svg { height: 100% !important; width: auto !important; display: block !important; }
            .applecation .full-start-new__buttons { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 0.6em !important; margin-top: 0.5em !important; }
            .applecation .full-start__button { min-height: 2.6em !important; padding: 0.4em 1em !important; border-radius: 0.8em !important; background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.12) !important; color: rgba(255,255,255,0.9) !important; font-size: 0.85em !important; font-weight: 600 !important; transition: all 0.25s ease !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important; }
            .applecation .full-start__button.focus, .applecation .full-start__button.hover { background: rgba(255,255,255,0.18) !important; border-color: rgba(255,255,255,0.3) !important; transform: scale(1.05) !important; }
            .applecation .full-start__button.button--play { background: linear-gradient(135deg, rgba(82,255,179,0.9), rgba(105,183,226,0.9)) !important; border-color: rgba(82,255,179,0.4) !important; color: #000 !important; }
            .applecation .full-start-new__head, .applecation .full-start-new__details, .applecation .full-descr, .applecation .full-descr__title, .applecation .full-start__head, .applecation .full-start-new__reactions, .applecation .full-start-new__rate-line, .applecation .full-start-new__left { display: none !important; }
            
            .applecation-episode-overview {
                position: absolute !important;
                bottom: calc(100% + 8px) !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                background: rgba(0,0,0,0.92) !important;
                color: #ffffff !important;
                padding: 0.5em 0.8em !important;
                border-radius: 0.5em !important;
                font-size: 0.7em !important;
                line-height: 1.3 !important;
                max-width: 75em !important;
                min-width: 45em !important;
                white-space: normal !important;
                word-wrap: break-word !important;
                z-index: 100 !important;
                display: none !important;
                pointer-events: none !important;
                backdrop-filter: blur(12px) !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
                text-align: center !important;
            }
            
            .applecation-episode-overview__text {
                color: #ffffff !important;
                font-size: 0.8em !important;
                line-height: 1.3 !important;
            }
            
            .full-episode.focus .applecation-episode-overview {
                display: block !important;
            }
            
            .full-episode.hover .applecation-episode-overview {
                display: block !important;
            }
            
            .full-start-new__tagline, .full-start__tagline, .tagline, [class*="tagline"] {
                display: none !important;
            }
            
            .button--studios {
                cursor: pointer !important;
            }
            .button--studios.focus {
                background: rgba(255,255,255,0.18) !important;
                border-color: rgba(255,255,255,0.3) !important;
                transform: scale(1.05) !important;
            }
            
            @media screen and (max-width: 720px) { 
                .applecation .full-start-new__body { height: auto !important; min-height: 0 !important; } 
                .applecation .full-start-new__right { display: block !important; padding: 0 1em 1em 1em !important; } 
                .applecation .applecation__content-wrapper { max-width: 100% !important; padding: 1em !important; } 
                .applecation .applecation__description { max-width: none !important; width: 100% !important; -webkit-line-clamp: 3 !important; } 
                .applecation__logo { max-width: 60vw !important; max-height: 80px !important; } 
                .applecation .full-start-new__title { font-size: 1.8em !important; }
                .applecation-episode-overview { max-width: 30em !important; min-width: 20em !important; font-size: 0.6em !important; }
            }
            @media screen and (max-width: 480px) { 
                .applecation .applecation__description { -webkit-line-clamp: 2 !important; } 
                .applecation__logo { max-width: 70vw !important; max-height: 60px !important; } 
                .applecation .full-start-new__title { font-size: 1.4em !important; } 
                .applecation .applecation__meta { font-size: 0.85em !important; } 
                .applecation .applecation__ratings { font-size: 0.8em !important; }
                .applecation-episode-overview { max-width: 20em !important; min-width: 14em !important; font-size: 0.55em !important; }
            }
            `;

            $('head').append('<style id="applecation_plus_css">' + css + '</style>');
            console.log('[Тема от SERG] Стили внедрены');
        } catch (e) {
            console.error('[Тема от SERG] Ошибка внедрения стилей:', e);
        }
    }

    function injectAdditionalStyles() {
        try {
            $('#applecation_plus_extra_css').remove();

            var css = `
            .applecation .applecation__overlay {
                width: 90vw !important;
                background: linear-gradient(to right,
                    rgba(0,0,0,0.85) 0%,
                    rgba(0,0,0,0.50) 25%,
                    rgba(0,0,0,0.25) 45%,
                    rgba(0,0,0,0.10) 55%,
                    rgba(0,0,0,0.04) 60%,
                    rgba(0,0,0,0) 65%
                ) !important;
                pointer-events: none !important;
                z-index: 0 !important;
            }

            .applecation .full-start__background {
                height: calc(100% + 6em) !important;
                left: 0 !important;
                opacity: 0 !important;
                transition: opacity 0.6s ease-out, filter 0.3s ease-out !important;
                animation: none !important;
                transform: none !important;
                will-change: opacity, filter !important;
                image-rendering: auto !important;
                z-index: 0 !important;
            }

            .applecation .full-start__background.loaded:not(.dim) {
                opacity: 1 !important;
                image-rendering: auto !important;
            }

            .applecation .full-start__background.dim {
                filter: blur(30px) !important;
            }

            .applecation .full-start__background.loaded.applecation-animated {
                opacity: 1 !important;
            }

            .applecation-description-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 9999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
                transition: opacity 0.3s ease, visibility 0.3s ease !important;
            }

            .applecation-description-overlay.show {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: all !important;
            }

            .applecation-description-overlay__bg {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                backdrop-filter: blur(100px) !important;
                -webkit-backdrop-filter: blur(100px) !important;
                background: rgba(0,0,0,0.6) !important;
            }

            .applecation-description-overlay__content {
                position: relative !important;
                z-index: 1 !important;
                max-width: 60vw !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
                padding: 2em !important;
                background: rgba(20,20,30,0.9) !important;
                border-radius: 1.2em !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
            }

            .applecation-description-overlay__title {
                font-size: 2em !important;
                font-weight: 600 !important;
                margin-bottom: 1em !important;
                color: #ffffff !important;
                text-align: center !important;
            }

            .applecation-description-overlay__text {
                font-size: 1.2em !important;
                line-height: 1.6 !important;
                color: #ffffff !important;
                white-space: pre-wrap !important;
                margin-bottom: 1.5em !important;
            }

            .applecation-description-overlay__details {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 1.5em !important;
            }

            .applecation-description-overlay__info-name {
                font-size: 0.9em !important;
                opacity: 0.6 !important;
                margin-bottom: 0.3em !important;
                color: #ffffff !important;
            }

            .applecation-description-overlay__info-body {
                font-size: 1.1em !important;
                opacity: 0.9 !important;
                color: #ffffff !important;
            }

            @keyframes applecation-fade-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .applecation .applecation-animate-in {
                animation: applecation-fade-in 0.5s ease forwards !important;
            }
            `;

            $('head').append('<style id="applecation_plus_extra_css">' + css + '</style>');
            console.log('[Тема от SERG] Дополнительные стили внедрены');
        } catch (e) {
            console.error('[Тема от SERG] Ошибка внедрения дополнительных стилей:', e);
        }
    }

    // =================================================================
    // SETTINGS
    // =================================================================

    function addSettings() {
        try {
            if (!Lampa.SettingsApi || !Lampa.SettingsApi.addComponent) return;

            Lampa.SettingsApi.addComponent({
                component: 'applecation_plus',
                name: 'Тема от SERG',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 18l20 12-10 2 2 10-12-24z" fill="currentColor"/><path d="M44 20l6-6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
                after: 'interface'
            });

            // =============================================================
            // КАТЕГОРИЯ: ОСНОВНЫЕ НАСТРОЙКИ
            // =============================================================
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { type: 'title' },
                field: { name: 'Основные настройки' }
            });

            // Включение/отключение плагина
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_enabled', type: 'trigger', default: true },
                field: { name: 'Включить тему', description: 'Полное отключение темы (требуется перезагрузка страницы)' },
                onChange: function(value) {
                    setTimeout(function() {
                        try {
                            if (Lampa.Activity && Lampa.Activity.active) {
                                var active = Lampa.Activity.active();
                                if (active && active.component === 'full') {
                                    Lampa.Activity.backward();
                                    setTimeout(function() {
                                        location.reload();
                                    }, 300);
                                    return;
                                }
                            }
                            location.reload();
                        } catch (e) {
                            location.reload();
                        }
                    }, 300);
                }
            });

            // Сброс настроек
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_reset_settings', type: 'trigger', default: false },
                field: { 
                    name: 'Сбросить настройки', 
                    description: 'Восстановить все настройки темы по умолчанию' 
                },
                onChange: function(value) {
                    if (value === true || value === 'true' || value === 1 || value === '1') {
                        resetToDefaultSettings();
                        setTimeout(function() {
                            try {
                                Lampa.Storage.set('applecation_reset_settings', false);
                            } catch (e) {}
                        }, 100);
                    }
                }
            });

            // Качество изображений
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_image_quality', type: 'select', 
                    values: {
                        'original': 'Оригинальное (4K/8K)',
                        'fhd': 'Full HD (1080p)',
                        'hd': 'HD (720p)'
                    },
                    default: 'original'
                },
                field: { name: 'Качество изображений', description: 'Качество постеров и фонов' },
                onChange: function(value) {
                    overrideImageApi();
                    if (Lampa.Activity && Lampa.Activity.active) {
                        var active = Lampa.Activity.active();
                        if (active && active.component === 'full') {
                            Lampa.Activity.backward();
                            setTimeout(function() {
                                location.reload();
                            }, 300);
                        }
                    }
                }
            });

            // =============================================================
            // КАТЕГОРИЯ: ПОЗИЦИЯ КОНТЕНТА
            // =============================================================
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { type: 'title' },
                field: { name: 'Позиция контента' }
            });

            // 1. Позиция всей информации контента
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { 
                    name: 'applecation_content_position', 
                    type: 'select',
                    values: {
                        'left': 'Слева',
                        'center': 'По центру',
                        'right': 'Справа'
                    },
                    default: 'left'
                },
                field: { 
                    name: 'Позиция всей информации контента', 
                    description: 'Расположение всего блока с информацией (логотип, рейтинги, описание, кнопки)' 
                },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        updateContentScale(render);
                    }
                }
            });

            // 2. Позиция рейтинга и реакций
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { 
                    name: 'applecation_ratings_position', 
                    type: 'select',
                    values: {
                        'left': 'Слева',
                        'center': 'По центру'
                    },
                    default: 'left'
                },
                field: { 
                    name: 'Позиция рейтинга и реакций', 
                    description: 'Расположение рейтингов и реакций внутри блока контента' 
                },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        updateContentScale(render);
                    }
                }
            });

            // 3. Позиция бейджей качества/инфо о сезонах
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { 
                    name: 'applecation_info_position', 
                    type: 'select',
                    values: {
                        'left': 'Слева',
                        'center': 'По центру'
                    },
                    default: 'left'
                },
                field: { 
                    name: 'Позиция бейджей качества/инфо о сезонах и сериях', 
                    description: 'Расположение бейджей качества и информации о сезонах' 
                },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        updateContentScale(render);
                    }
                }
            });

            // =============================================================
            // КАТЕГОРИЯ: РЕЙТИНГИ И РЕАКЦИИ
            // =============================================================
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { type: 'title' },
                field: { name: 'Рейтинги и реакции' }
            });

            // Иконки в рейтингах
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_rating_icons', type: 'trigger', default: false },
                field: { name: 'Иконки вместо текста в рейтингах', description: 'Заменить названия источников на иконки' },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        var movie = render.data('movie');
                        if (movie) {
                            getRatings(movie, function(ratings) {
                                getLampaRating(movie, function(lampaData) {
                                    getBestJacred(movie, function(qualityData) {
                                        fillContent(render, movie, ratings, lampaData, qualityData);
                                    });
                                });
                            });
                        }
                    }
                }
            });

            // Реакция вместо иконки Lampa
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { 
                    name: 'applecation_lampa_reaction_icon', 
                    type: 'trigger', 
                    default: false 
                },
                field: { 
                    name: 'Реакция вместо иконки Lampa', 
                    description: 'Показывать анимированную реакцию рядом с рейтингом Lampa (дополнительно к иконке/названию)' 
                },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        var movie = render.data('movie');
                        if (movie) {
                            getRatings(movie, function(ratings) {
                                getLampaRating(movie, function(lampaData) {
                                    getBestJacred(movie, function(qualityData) {
                                        fillContent(render, movie, ratings, lampaData, qualityData);
                                    });
                                });
                            });
                        }
                    }
                }
            });

            // Анимированные реакции
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { 
                    name: 'applecation_animated_reactions', 
                    type: 'trigger', 
                    default: false 
                },
                field: { 
                    name: 'Анимированные реакции Lampa', 
                    description: 'Показывать анимированные иконки реакций вместо обычных' 
                },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        var movie = render.data('movie');
                        if (movie) {
                            getRatings(movie, function(ratings) {
                                getLampaRating(movie, function(lampaData) {
                                    getBestJacred(movie, function(qualityData) {
                                        fillContent(render, movie, ratings, lampaData, qualityData);
                                    });
                                });
                            });
                        }
                    }
                }
            });

            // =============================================================
            // КАТЕГОРИЯ: КАЧЕСТВО И БЕЙДЖИ
            // =============================================================
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { type: 'title' },
                field: { name: 'Качество и бейджи' }
            });

            // Бейджи качества
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_show_quality_badges', type: 'trigger', default: true },
                field: { name: 'Бейджи качества', description: 'Показывать бейджи качества (4K, HDR, 7.1, DUB)' },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        var movie = render.data('movie');
                        if (movie) {
                            getRatings(movie, function(ratings) {
                                getLampaRating(movie, function(lampaData) {
                                    getBestJacred(movie, function(qualityData) {
                                        fillContent(render, movie, ratings, lampaData, qualityData);
                                    });
                                });
                            });
                        }
                    }
                }
            });

            // =============================================================
            // КАТЕГОРИЯ: СТУДИИ
            // =============================================================
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { type: 'title' },
                field: { name: 'Студии' }
            });

            // Студии
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_studios_mode', type: 'select',
                    values: {
                        'show': 'Показывать студии (до 3-х)',
                        'button': 'Кнопка "Студии" (все студии)',
                        'hide': 'Скрыть студии'
                    },
                    default: 'button'
                },
                field: { name: 'Отображение студий', description: 'Как показывать студии-производители' },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        var movie = render.data('movie');
                        if (movie) {
                            renderStudiosBtn(render, movie);
                            renderStudiosLine(render, movie);
                        }
                    }
                }
            });

            // =============================================================
            // КАТЕГОРИЯ: ОФОРМЛЕНИЕ
            // =============================================================
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { type: 'title' },
                field: { name: 'Оформление' }
            });

            // Эффекты
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_effects_enabled', type: 'trigger', default: true },
                field: { name: 'Включить эффекты', description: 'Отключите для слабых устройств (ускоряет загрузку)' }
            });

            // Фон контента
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_content_bg', type: 'trigger', default: true },
                field: { name: 'Фон контента', description: 'Показывать затемненный фон за блоком информации' },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        updateContentScale(render);
                    }
                }
            });

            // Масштаб контента
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_content_scale', type: 'select', 
                    values: {
                        '80': '80%',
                        '85': '85%',
                        '90': '90%',
                        '95': '95%',
                        '100': '100%',
                        '105': '105%',
                        '110': '110%',
                        '115': '115%',
                        '120': '120%'
                    },
                    default: '100'
                },
                field: { name: 'Масштаб контента', description: 'Размер блока с информацией и кнопками' },
                onChange: function(value) {
                    var render = getActiveFullRender();
                    if (render) {
                        updateContentScale(render);
                    }
                }
            });

            // Описание в оверлее
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_description_overlay', type: 'trigger', default: true },
                field: { name: 'Описание в оверлее', description: 'Показывать описание в отдельном окне при нажатии' }
            });

            // =============================================================
            // КАТЕГОРИЯ: СЛУЖЕБНЫЕ
            // =============================================================
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { type: 'title' },
                field: { name: 'Служебные' }
            });

            // Очистка кэша
            Lampa.SettingsApi.addParam({
                component: 'applecation_plus',
                param: { name: 'applecation_clear_cache', type: 'trigger', default: false },
                field: { 
                    name: 'Очистить кэш темы', 
                    description: 'Очистить все кэшированные данные (рейтинги, качество, реакции) и перезагрузить страницу' 
                },
                onChange: function(value) {
                    if (value === true || value === 'true' || value === 1 || value === '1') {
                        clearAllCache();
                        setTimeout(function() {
                            try {
                                Lampa.Storage.set('applecation_clear_cache', false);
                            } catch (e) {}
                        }, 100);
                    }
                }
            });

        } catch (e) {
            console.error('[Тема от SERG] Ошибка добавления настроек:', e);
        }
    }

    function getActiveFullRender() {
        try {
            var active = Lampa.Activity && Lampa.Activity.active ? Lampa.Activity.active() : null;
            if (!active || active.component !== 'full') return null;
            var render = active.activity && active.activity.render ? active.activity.render() : null;
            return render;
        } catch (e) {
            return null;
        }
    }

    // =================================================================
    // MAIN PLUGIN INIT
    // =================================================================

    function initPlugin() {
        if (window._applecation_plus_initialized) return;
        window._applecation_plus_initialized = true;

        var enabled = Lampa.Storage.get('applecation_enabled', true);
        if (!enabled) {
            console.log('[Тема от SERG] Плагин отключен');
            return;
        }

        console.log('[Тема от SERG] Инициализация v' + PLUGIN_VERSION);

        injectStyles();
        injectAdditionalStyles();

        overrideImageApi();

        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;

            try {
                var activity = e.object && e.object.activity;
                if (!activity || !activity.render) return;

                var render = activity.render();
                if (!render || !render.length) return;

                if (render.data('applecation_plus_processed')) return;
                render.data('applecation_plus_processed', true);
                render.data('movie', e.data.movie);

                var movie = e.data && e.data.movie;
                if (!movie) return;

                captureEpisodesFromFull(e);

                console.log('[Тема от SERG] Обработка карточки для:', movie.title || movie.name);

                render.addClass('applecation');
                modifyCardDOM(render, movie);

                var pending = 3;
                var ratingsData = { tmdb: 0, imdb: 0, kinopoisk: 0 };
                var lampaData = null;
                var qualityData = null;
                var isComplete = false;

                function checkComplete() {
                    if (isComplete) return;
                    pending--;
                    if (pending === 0) {
                        isComplete = true;
                        fillContent(render, movie, ratingsData, lampaData, qualityData);
                        setTimeout(function() {
                            try {
                                focusFirstButton(render);
                            } catch (err) {}
                        }, 600);
                    }
                }

                getRatings(movie, function(ratings) {
                    ratingsData = ratings;
                    checkComplete();
                });

                getLampaRating(movie, function(data) {
                    lampaData = data;
                    checkComplete();
                });

                getBestJacred(movie, function(data) {
                    qualityData = data;
                    checkComplete();
                });

                loadLogo(render, movie);
                setupAnimations(render);

                setTimeout(function() {
                    try {
                        if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') {
                            Lampa.Controller.toggle('full_start');
                        }
                    } catch (err) {}
                }, 300);

                setupPosterScrollHandler(render);

                setTimeout(function() {
                    updateContentScale(render);
                }, 100);

            } catch (err) {
                console.error('[Тема от SERG] Ошибка обработки карточки:', err);
            }
        });

        console.log('[Тема от SERG] Инициализация успешно завершена');
    }

    // =================================================================
    // INIT
    // =================================================================

    function init() {
        try {
            if (typeof Lampa === 'undefined') {
                console.error('[Тема от SERG] Lampa не найдена');
                return;
            }

            console.log('[Тема от SERG] Инициализация v' + PLUGIN_VERSION);

            addSettings();
            initPlugin();

            console.log('[Тема от SERG] Инициализация успешно завершена');

        } catch (err) {
            console.error('[Тема от SERG] Ошибка инициализации:', err);
        }
    }

    // =================================================================
    // START
    // =================================================================

    if (window.appready) {
        init();
    } else if (typeof Lampa !== 'undefined' && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') init();
        });
    } else {
        console.warn('[Тема от SERG] Lampa.Listener не доступен, запуск немедленно');
        init();
    }

})();
