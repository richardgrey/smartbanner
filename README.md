# Smart Banner #
Smart banner for Android and iOS < 6.

## Usage ##
If jQuery used, smartBanner will be applied as plugin, and could be run with `$.smartBanner([options])`. 
In another case it will be appended to global scope, so could be used as `smartBanner([options])`.

### Options
 * `type` — Force OS type of banner: `ios` or `android`.
 * `icon` — Link to icon picture. Default from <link rel="apple-touch-icon" href="../..">, then http://<host_name>/apple-touch-icon.png
 * `title` — Application title. Default from `<title>...</title>`.
 * `author` — Application author. Default from `<meta name="author" content="...">`, then host name.
 * `url` — URL to the application on the market. Will be generated automatically.
 * `price` — Default: 'FREE'. Price of application.
 * `button` — Default: 'VIEW'. Text on button.
 * `inGooglePlay` — Default: 'In Google Play'.
 * `inAppStore` — Default: 'On the App Store'.
 * `showDelay` — Default: 300 [ms].
 * `animTime` — Timing for hide animation in second. Set `null` to get it from styles.
 * `daysHidden` — Default: 15. How many days to keep banner hidden when it closed by user.
 * `daysRemind` — Default: 30.          when user follow link.
 * `verIOS` — Version of iOS from which banner should be demonstrated.
 * `verAndroid` — Version of Android from which banner should be demonstrated.

##### Inpired by
http://jasny.github.io/jquery.smartbanner/