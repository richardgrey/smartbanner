(function (win, doc, body, global) {
    'use strict';

    global = win.jQuery || win;

    // Should be defined only once
    if (global.smartBanner) {
        return ;
    }

    var ID_IOS = 'ios',
        ID_ANDROID = 'android',
        ID_SMART_BANNER = '#smartbanner',
        SB_NATIVE_SUPPORT_IOS = 6,
        APPLE_TOUCH_DEFAULT = 'apple-touch-icon.png',

        defaults = {
            type: null,                     // Force OS type of banner
            icon: null,                     // Icon URL. Default from <link rel="apple-touch-icon" href="../..">, then http://<host_name>/apple-touch-icon.png
            title: null,                    // Application title. Default from <title>...</title>
            author: null,                   // Application author. Default from <meta name="author" content="...">, then host name
            price: 'FREE',                  // Price of application
            button: 'VIEW',                 // Button text
            url: null,                      // URL to the app on the market. Will be generated automatically
            inGooglePlay: 'In Google Play', // Google Play market text
            inAppStore: 'On the App Store', // App Store text
            showDelay: 300,                 // Delay before show banner
            animTime: null,                 // Timing for hide animation in second. Set `null` to get it from styles
            daysHidden: 15,                 // How many days to keep banner hidden when it closed by user
            daysRemind: 30,                 //          when user follow link
            verIOS: null,                   // Version of iOS from which banner should be demonstrated
            verAndroid: null                // Version of Android from which banner should be demonstrated
        },

        options,
        smartBanner,
        $smartBanner,
        $smartBannerWrap,
        $placeholder,
        bannerHeight;

    /**
     * Returns first element found in the DOM based on passed CSS-selector. Will search
     * in context child nodes if context provided.
     *
     * @param {String}      selector
     * @param {HTMLElement} [context]
     * @returns {HTMLElement|undefined}
     */
    function $(selector, context) {
        context = context || doc;
        return context.querySelectorAll(selector)[0];
    }

    /**
     * Blend two or more object into first one.
     *
     * @returns {Object}    Changed first object in parameters list.
     */
    function extend() {
        var args = [].slice.call(arguments),
            obj = args.shift(),
            extensionObject,
            key;

        while (extensionObject = args.shift()) {
            for (key in extensionObject) {
                if (extensionObject.hasOwnProperty(key)) {
                    obj[key] = extensionObject[key];
                }
            }
        }

        return obj;
    }

    /**
     * Shortcut for match function
     *
     * @see  http://mzl.la/Z8Xyn4
     * @param {String}  str         Tested string
     * @param {RegExp}  exp         Regular expression to test with
     * @returns {Array|undefined}   Result of String.match fucntion
     */
    function match(str, exp) {
        return str.match(exp);
    }

    /**
     * Bind Event on node.
     *
     * @see http://mzl.la/XYjody
     * @param {HTMLElement|String}  node        If String node will be found with $ function.
     * @param {String}              eventName   Event Name
     * @param {Function}            handler     Function that should be called on event happened
     */
    function on(node, eventName, handler) {
        node.addEventListener(eventName, handler, false);
    }

    /**
     * Returns element atribute value if exist.
     *
     * @see http://mzl.la/12gecZc
     * @param {HTMLElement} node
     * @param {String} attrName
     * @returns {String}
     */
    function getAttr(node, attrName) {
        return node.getAttribute(attrName);
    }

    /**
     * Styling shourtcut
     *
     * @param {HTMLElement}     node    Element to be modified
     * @param {String}          name    Style property name
     * @param {String|Number}   value   Value to set
     */
    function style(node, name, value) {
        node.style[name] = value;
    }

    /**
     * Return cookie value
     *
     * @param {String}      name            Cookie name
     * @returns {undefined|String|Number}   Return `undefined`, if cookie is not found
     */
    function getCookie(name) {
        var cookies = doc.cookie,
            reg = new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"),
            matches = match(cookies, reg);

        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    /**
     * Set cookie to be saved provided count of days.
     *
     * @param {String}  name    Cookie name
     * @param {String}  value   Value of cookie
     * @param {Number}  exdays  Expires term of cookie. In days
     */
    function setCookie(name, value, exdays) {
        var exdate = new Date();
        
        exdate.setDate(exdate.getDate() + exdays);
        value = encodeURIComponent(value) + (exdays ? '; expires=' + exdate.toUTCString() : '');

        doc.cookie = name + '=' + value + '; path=/;';
    }


    /**
     * Find type of banner from user agent. Check version of system.
     *
     * @returns {String|undefined}  Type of banner: 'ios', 'android' or `undefined` if not detected
     */
    function getBannerType() {
        var ua = navigator.userAgent,
            riThing = /iPad|iPhone|iPod/i,
            rSafari = /Safari/i,
            rCriOS = /CriOS/i,
            rAndroid = /Android (\d+(?:\.\d+))/i,
            version;

        if (match(ua, riThing)) {
            // Check webview and native smart banner support (iOS 6+)
            version = +ua.substr(ua.indexOf('OS ') + 3, 3).replace('_', '.');
            if (match(ua, rSafari) && (match(ua, rCriOS) || (version < SB_NATIVE_SUPPORT_IOS && version >= options.verIOS))) {
                return ID_IOS;
            }
        } else {
            version = match(ua, rAndroid);
            if (version && +version[1] >= options.verAndroid) {
                return ID_ANDROID;
            }
        }
    }

    /**
     * Get market ID of application from meta. Meta names should be 'apple-itunes-app' for iOS
     * and 'google-play-app' for Android. They should contain iTunes application ID or Google Play
     * package name in following format:
     *
     *      `app-id=<app-id_or_package-name>`
     *
     * @example
     *      <meta name="apple-itunes-app" content="app-id=544007664">
     *      <meta name="google-play-app" content="app-id=com.google.android.youtube">
     *
     *  Will return for iOS:
     *      544007664
     *
     *  and for Android:
     *      com.google.android.youtube
     *
     * @param {String}  type    Type of banner
     * @returns {String|undefined}   Market ID of application or null if not found
     */
    function getAppId(type) {
        var param = type === ID_ANDROID ? 'google-play-app' : 'apple-itunes-app',
            meta = $('meta[name="' + param + '"]'),
            rAppId = /app-id=([^\s,]+)/,
            match;

        if (!meta) {
            return ;
        }
        match = getAttr(meta, 'content').match(rAppId);

        return match ? match[1] : undefined;
    }

    /**
     * Returns page title.
     *
     * @returns {String}    Part of title before `-` or `|`
     */
    function getTitle() {
        return doc.title.replace(/\s*[|\-·].*$/, '');
    }

    /**
     * Try to find author name from page meta. If not found will return host name as author.
     *
     * @returns {String}
     */
    function getAuthor() {
        var metaAuthor = $('meta[name="author"]');
        return metaAuthor ? getAttr(metaAuthor, 'content') : location.host;
    }

    /**
     * Try to find application icon URL from meta. If not found, will return url of it's 
     * default location, like: //exaple.com/apple-touch-icon.png
     *
     * @returns {String}
     */
    function getIcon() {
        var link = $('link[rel="apple-touch-icon-precomposed"]') || $('link[rel="apple-touch-icon"]'),
            icon;

        if (link) {
            icon = getAttr(link, 'href');
        } else {
            icon = location.origin + '/' + APPLE_TOUCH_DEFAULT;
        }

        return icon;
    }

    /**
     * Returns URL off application on the market
     *
     * @param {String}  type    Type of banner
     * @param {String}  appId   Application ID or package name of application
     * @param {String}  lang    Language of App Store
     * @returns {String}        URL to market
     */
    function getLink(type, appId, lang) {
        var url = type === ID_ANDROID ? 
                    'market://details?id=' : 
                    'https://itunes.apple.com/app/id';
        return url + appId;
    }

    /**
     * Create DOM of smart banner
     *
     * @param {String}  type    Type of banner
     * @returns {HTMLElement}
     */
    function render(type) {
        var inStore = type === ID_ANDROID ? options.inGooglePlay : options.inAppStore,
            div = doc.createElement('div');

        extend(div, {
            id: ID_SMART_BANNER.slice(1),
            className: 'sb sb_' + options.type,
            innerHTML: '<i class="sb__close"></i>' +
                '<a class="sb__wrap" href="' + options.url + '">' +
                    '<b class="sb__btn">' + options.button + '</b>'+
                    '<i class="sb__ico" style="background-image:url(' + options.icon + ')"></i>'+
                    '<span class="sb__info">' +
                        '<b>' + options.title + '</b>' +
                        '<span>' + options.author + '</span>' +
                        '<span>' + (options.price ? options.price + ' &mdash; ' : '') + inStore + '</span>' +
                    '</span>' +
                '</a>'
        });

        return div;
    }

    /**
     * Create DOM of placholder for smart banner
     * 
     * @returns {HTMLElement}
     */
    function createPlaecholder() {
        var div = doc.createElement('div');

        div.className = 'sb-placeholder';
        style(div, 'height', 0);

        return div;
    }

    /**
     * Set animation time. If it provided by options, set transition-duration to elements.
     * If not in options, get it from styles of smart banner, and synchronize placeholder with it.
     */
    function setAnimTiming() {
        var time = options.animTime,
            transitionDuration = 'webkitTransitionDuration';

        if (!time) {
            options.animTime = parseFloat(win.getComputedStyle($smartBanner)[transitionDuration]);
        }
        style($smartBanner, transitionDuration, time + 's');
        style($placeholder, transitionDuration, time + 's');
    }

    /**
     * Bind events on banner elements.
     */
    function bind() {
        on($('.sb__close', $smartBanner), 'click', closeBanner);
        on($('.sb__wrap', $smartBanner), 'click', installApp);
    }

    /**
     * Hide banner and destroy.
     */
    function remove() {
        hide();
        setTimeout(destroy, options.animTime * 1000);
    }

    /**
     * Close banner and save action in cookie.
     */
    function closeBanner() {
        setCookie('smbcls', 'true', options.daysHidden);
        remove();
    }

    /**
     * Set application as viewed on the market, and save action in cookie.
     */
    function installApp() {
        setCookie('smbinstl', 'true', options.daysRemind);
        remove();
    }

    /**
     * Show banner.
     */
    function show() {
        style($smartBanner, 'top', 0);
        style($placeholder, 'height', bannerHeight + 'px');
    }

    /**
     * Hide it.
     */
    function hide() {
        style($smartBanner, 'top', -bannerHeight + 'px');
        style($placeholder, 'height', 0);
    }

    /**
     * Destroy banner from DOM.
     */
    function destroy() {
        body.removeChild($smartBanner);
        body.removeChild($placeholder);
        $smartBanner = $smartBannerWrap = $placeholder = null;
    }

    /**
     * Initialization function.
     */
    function init() {
        var type,
            appId;

        type = options.type || getBannerType();

        // Don't show banner if its not iOS or Android or it was closed or installed,
        // or page opened inside another application.
        if (!type || navigator.standalone || getCookie('smbcls') || getCookie('smbinstl')) {
            return ;
        }

        options.type = type;

        // Find application ID or package name
        appId = getAppId(type);

        if (!appId) {
            return ;
        }

        options.appId = appId;
        options.title = options.title || getTitle();
        options.author = options.author || getAuthor();
        options.icon = options.icon || getIcon();

        // Get URL of application on the market
        options.url = options.url || getLink(type, appId, options.appStoreLang);

        // Create banner
        body.insertBefore(render(type), body.firstChild);

        // Cache link on banner elements in the DOM
        $smartBanner = $(ID_SMART_BANNER);
        $smartBannerWrap = $('.sb__wrap', $smartBanner);

        // Create placeholder
        $placeholder = createPlaecholder();
        body.insertBefore($placeholder, $smartBanner);

        // Find banner height and set correct top position. Calculated only once!
        bannerHeight = $smartBanner.offsetHeight + 2;
        style($smartBanner, 'top', -bannerHeight + 'px');

        // Synchronize animation time
        setAnimTiming();

        // Bind events
        bind();

        // Show banner after timeout
        setTimeout(show, options.showDelay);
    }

    // Main function
    smartBanner = function (opts) {
        // Do not create banner if one already exist
        if (!$smartBanner) {
            options = extend({}, defaults, opts);
            init();
        }
    };

    // API functions
    smartBanner.hide = hide;
    smartBanner.show = show;
    smartBanner.remove = remove;
    smartBanner.destroy = destroy;

    /**
     * Export as jQuery plugin if jQuery exist, or to global scope (as window property) if not.
     */
    global.smartBanner = smartBanner;

    /**
     * Export as AMD module
     */
    if (typeof win.define === 'function' && win.define.amd) {
        win.define('smartbanner', [], function () {
            return smartBanner;
        });
    }
    
}(this, document, document.body));
