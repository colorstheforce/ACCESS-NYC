# ACCESS NYC

[ACCESS NYC ↗](http://nyc.gov/accessnyc) provides a mobile-friendly front door for New Yorkers to screen for City, State, and Federal benefit and program eligibility as well as learn how to apply to programs and find local help. The site is for benefits-seeking residents in NYC and accommodates residents...

* With low digital literacy
* With limited technology access, especially those who are mobile dependent
* Who do not speak fluent English
* Who have limited visual capabilities

Learn more about ACCESS NYC at [nyc.gov/opportunity ↗](http://www1.nyc.gov/site/opportunity/portfolio/access-nyc.page).

## Contents

* [Tech](#tech)
* [Local Installation](#local-installation)
    * [Requirements](#requirements)
    * [Installation](#installation)
* [WordPress Site Structure](#wordpress-site-structure)
    * [ACCESS Theme](#access-theme)
        * [Twig Templates](#twig-templates)
        * [Functions](#functions)
        * [Path Helpers](#path-helpers)
        * [Controllers](#controllers)
    * [Plugins](#plugins)
        * [WordPress Admin Plugins](#wordPress-admin-plugins)
        * [Must Use Plugins](#must-use-plugins)
        * [Composer Plugins](#composer-plugins)
* [Using Composer](#using-composer)
* [Using NPM](#using-npm)
* [Debug Browsing](#debug-browsing)
* [Coding Style](#coding-style)
    * [PHP](#php)
    * [Javascript](#javascript)
    * [SCSS](#scss)
* [Security](#security)

## Tech

ACCESS NYC is a publicly available [WordPress ↗](https://wordpress.org/) site hosted on [WP Engine ↗](https://wpengine.com/). Source code is available in this repository. All benefit program information on ACCESS NYC is publicly available through the [Benefits and Programs API ↗](https://data.cityofnewyork.us/Social-Services/Benefits-and-Programs-API/2j8u-wtju) on the City of New York’s Open Data portal.

The ACCESS NYC eligibility screener is a single page web application powered by an API built on the [Drools Business Rules Management System ↗](https://www.drools.org/) hosted on [Amazon Web Services ↗](https://aws.amazon.com/) through the [NYC Department of Information Technology and Telecommunications ↗](http://www.nyc.gov/doitt). The [NYC Benefits Screening API ↗](https://screeningapidocs.cityofnewyork.us) is an open API that allows developers to utilize the rules engine that governs the ACCESS NYC Eligibility Screener.

The [ACCESS NYC Patterns ↗](https://github.com/cityofnewyork/access-nyc-patterns) provide mobile first stylesheets, fonts, icons, and JavaScript-enhanced components that support WCAG AA compliance, and multi-lingual (right-to-left, and left-to-right) layouts. They are distributed as an NPM Package which can be installed in any project.

## Local Installation

### Requirements

* **Virtualization** ([Docker ↗](https://docs.docker.com/compose/wordpress/), [Vagrant ↗](https://www.vagrantup.com/) + Virtualbox, [Local ↗](https://localwp.com/), or other). This WordPress repository can be run in many ways. The product team at NYC Opportunity uses [Docker for Mac ↗](https://www.docker.com/docker-mac) and the [NYCO WordPress Docker Boilerplate ↗](https://github.com/cityofnewyork/nyco-wp-docker-boilerplate) for running and managing the application locally.

* **Composer**. PHP and WordPress plugin dependencies for WordPress core and the ACCESS Theme are managed via Composer. [Learn more about Composer on its website ↗](https://getcomposer.org/).

* **Node and NPM**. The ACCESS Theme uses Node with NPM to manage packages such as Gulp to compile assets for the front-end. Learn more about [Node ↗](https://nodejs.org), [NPM ↗](https://www.npmjs.com/), and [Gulp ↗](https://gulpjs.com/) at their respective websites.

### Installation

This covers standing up the WordPress site after a virtualization method has been chosen with including a server running PHP and a MySQL database. Instructions in the [NYCO WordPress Docker Boilerplate ↗](https://github.com/cityofnewyork/nyco-wp-docker-boilerplate) will cover this process.

**$1** Rename **wp-config-sample.php** to **wp-config.php**. Modify the *MySQL settings*, *Authentication Unique Keys*, *Salts*, and *WordPress debugging mode*. If using the NYCO WordPress Docker Boilerplate, you can use the [**wp-config.php** included in the repository ↗](https://github.com/CityOfNewYork/nyco-wp-docker-boilerplate/blob/master/wp/wp-config.php) but you should still update the salts.

**$2** To get untracked composer packages when you install the site you will need to run the following in the root of the WordPress site where the [**composer.json**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/composer.json) file lives:

    composer install

**$3** This will install plugins included in the Composer package, including **NYCO WordPress Config** (see details in [Configuration](#configuration) below). This plugin includes a sample config that needs to be renamed from **mu-plugins/config/config-sample.yml** to **mu-plugins/config/config.yml**.

## WordPress Site Structure

### Configuration

ACCESS NYC integrates the [NYCO WordPress Config plugin ↗](https://packagist.org/packages/nyco/wp-config) for determining configurations based on the environment. This plugin will pull from an array of variables set in the **mu-plugins/config/config.yml** file and set the appropriate group to environment variables that can be accessed by site functions, templates, and plugins.

### ACCESS Theme

The theme for the site contains all of the php functions, templates, styling, and scripts for the site front-end and can be found in the [**themes**](https://github.com/CityOfNewYork/ACCESS-NYC/tree/master/wp-content/themes/access) directory. This is the only WordPress theme that is compatible with the WordPress site.

* **/acf-json** - [Advanced Custom Fields ↗](https://www.advancedcustomfields.com/pro/) JSON files for syncing custom fields between environments.
* **/assets** - The source for image, style, and script files live in the [**src**](https://github.com/CityOfNewYork/ACCESS-NYC/tree/master/wp-content/themes/access/src) and are compiled to the [**/assets**](https://github.com/CityOfNewYork/ACCESS-NYC/tree/master/wp-content/themes/access/assets) directory. This is done with NPM Scripts in [**package.json**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/wp-content/themes/access/package.json) and tasks in the [GulpFile](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/wp-content/themes/access/gulpfile.babel.js). The theme relies on the [ACCESS NYC Patterns ↗](https://accesspatterns.cityofnewyork.us) for sourcing Stylesheets and JavaScript modules. Refer to the [documentation ↗](https://accesspatterns.cityofnewyork.us) for details on the different patterns and their usage.
* **/blocks** - [Custom Gutenburg Block ↗](https://developer.wordpress.org/block-editor/developers/) source.
* **/controllers** - Site and Post Type controllers that [extend Timber ↗](https://timber.github.io/docs/guides/extending-timber/) and provide processed data to views.
* **/lib** - Theme functions, filters, and other helpers that assist in rendering views.
* **/shortcodes** - Theme [shortcodes ↗](https://codex.wordpress.org/Shortcode) available to the admin.
* **/src** - JavaScript and stylesheet source (described below).
* **/views** - View templates are generally organized on a component level and by site feature and include [Twig](https://twig.symfony.com/), [Underscore.js](https://underscorejs.org/#template), and [Vue.js](https://vuejs.org/v2/guide/single-file-components.html) templates.
  * **/components** - Component pattern templates.
  * **/elements** - Element pattern templates.
  * **/emails** - Email view templates
  * **/jst** - [Underscore templates](https://underscorejs.org/#template) used by twig files are pre-rendered buy Gulp and stored here.
  * **/locations** - Locations feature templates.
  * **/objects** - Object pattern templates.
  * **/partials** - Misc. view template partials.
  * **/programs** - Programs feature templates.
  * **/screener** - Screener feature templates.

#### Twig Templates

The theme is built on [Timber ↗](https://www.upstatement.com/timber/) which uses the [Twig Templating Engine ↗](https://twig.symfony.com/). Templates can be edited in the [**/views**](https://github.com/CityOfNewYork/ACCESS-NYC/tree/master/wp-content/themes/access/views) directory.

#### Functions

The [**functions.php**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/wp-content/themes/access/functions.php) is a proxy used to require and instantiate dependencies for rendering views only. Any other site configuration such as a filter, hook, or action will be found in the [must use plugins directory](#must-use-plugins). Functions available to the theme are stored in the [**lib/functions.php**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/wp-content/themes/access/lib/functions.php) file.

Dependencies include [path helpers](#path-helpers), theme functions, WordPress Gutenberg Blocks, shortcodes, the site controller, and Timber filters.

#### Path Helpers

Path helpers are shorthand functions return path strings for including various dependencies within the theme. They are used throughout theme files and generally accept a single string parameter referencing the filename (without extension) of the dependency.

    require_once ACCESS\controller('programs');

* `ACCESS\lib` -  Return the path to a file in the **/lib** directory.
* `ACCESS\functions` -  Return the path to the **/lib/functions.php** file. No arguments required.
* `ACCESS\controller` -  Return the path to the site or a post type controller from **/controllers** directory.
* `ACCESS\block` -  Return the path to a Gutenburg Block from the **/blocks** directory.
* `ACCESS\require_blocks` - Require all Gutenburg Blocks. No arguments required.
* `ACCESS\shortcode` - Return the path to a shortcode in the **/shortcodes** directory.
* `ACCESS\require_shortcodes` - Require all shortcodes from the **/shortcodes**. No arguments required.

#### Controllers

Site and Post Type controllers [extend Timber functionality ↗](https://timber.github.io/docs/guides/extending-timber/) and make it easy for providing extra or customized context to different views and even the WordPress REST API. Controllers are based on post types and are included in the theme when rendering posts on the homepage, in an archive, or a single view.

Controllers are required using the controller path helper (described above):

    require_once ACCESS\controller('programs');
    require_once ACCESS\controller('alert');

And instantiated (below in a single view):

    $program = new Controller\Programs();

    $context = Timber::get_context();

    $context['post'] = $program;

Instantiated Controllers accept either a post object or post ID argument if used outside of their single view context. The following example intantiates a list of alert posts:

    $context['alerts'] = array_map(function($post) {
      return new Controller\Alert($post);
    }, get_field('alert'));

### Plugins

WordPress Plugins are managed via Composer and the WordPress Admin. They are tracked by the repository to be easily shipped to different environments. Plugins utilized by the WordPress site can be found in the [**plugins**](https://github.com/CityOfNewYork/ACCESS-NYC/tree/master/wp-content/plugins) directory. Key plugins include [Advanced Custom Fields Pro ↗](https://www.advancedcustomfields.com/pro/), [WordPress Multilingual ↗](https://wpml.org/), and the [Gather Content WordPress Integration ↗](https://wordpress.org/plugins/gathercontent-import/). There are a few ways of managing plugins.

#### WordPress Admin Plugins

Not all plugins can be managed by Composer. Specifically [Advanced Custom Fields Pro ↗](https://www.advancedcustomfields.com/pro/) and [WordPress Multilingual ↗](https://wpml.org/). These plugins must be updated by either downloading from their respective sites and adding directly to the **wp-content/plugins** directory or by logging into the *WordPress Admin* and updating via the **/wp-admin/plugins** page.

#### Must Use Plugins

[Must Use Plugins ↗](https://codex.wordpress.org/Must_Use_Plugins) are used to handle most of the custom configuration for the WordPress site including custom post types, plugin configuration, and special plugins that enable additional functionality for major features of the site. Those can be found in the [**mu-plugins**](https://github.com/CityOfNewYork/ACCESS-NYC/tree/master/wp-content/mu-plugins) directory.

Additional configuration and functions can be found in the ACCESS Theme.

#### Composer Plugins

The [**composer.json**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/composer.json) file illustrates which plugins can be managed by Composer. WordPress Plugins can be installed either from [WordPress Packagist ↗](https://wpackagist.org/) or from Packagist via the [Composer Libray Installer ↗](https://github.com/composer/installers). Other php packages that are not plugins and stored in the `/vendor` directory are tracked by git so they can be deployed with the code. See the [**.gitignore**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/.gitignore) file under the "Composer" section to see which ones.

Before installing dependencies the development autoloader should be generated. This will include development dependencies in the autoloader:

    composer run development

Then, to update a single plugin run:

    composer update {{ vendor }}/{{ package }}:{{ version }}

For example:

    composer update wpackagist-plugin/acf-to-rest-api:3.1.0

... will update the *ACF to Rest API* plugin to version 3.1.0. **Once you are done developing generate the production autoloader which will remove development dependencies in the autoloader:**

    composer run predeploy

## Using Composer

In addition to WordPress Plugins, Composer is used to manage third-party dependencies that some plugins rely on as well as provide developer tools for working with PHP applications. The Composer package comes with scripts that can be run via the command:

    composer run {{ script }}

Script        | Description
--------------|-
`development` | Rebuilds the autoloader including development dependencies.
`production`  | Rebuilds the autoloader omitting development dependencies.
`predeploy`   | Rebuilds the autoloader using the `production` script then runs [PHP Code Sniffer ↗](https://github.com/squizlabs/PHP_CodeSniffer) using the `lint` script (described below).
`lint`        | Runs PHP Code Sniffer which will display violations of the standard defined in the [phpcs.xml](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/phpcs.xml) file.
`fix`         | Runs PHP Code Sniffer in fix mode which will attempt to fix violations automatically. It is not necessarily recommended to run this on large scripts because if it fails it will leave a script partially formatted and malformed.
`version`     | Regenerates the **composer.lock** file and rebuilds the autoloader for production.
`deps`        | This is a shorthand for `composer show --tree` for illustrating package dependencies.

By default **/vendor** packages are not tracked by the repository. If a composer package is required by production it needs to be included in the repository so it can be deployed to WP Engine. The [**.gitignore**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/.gitignore) manually includes tracked repositories using the `!` prefix. This does not apply to WordPress plugins.

## Using NPM

NPM is used to manage the assets in the ACCESS Theme. To get started with modifying the theme front-end, navigate to the [**/wp-content/themes/access**](https://github.com/CityOfNewYork/ACCESS-NYC/tree/master/wp-content/themes/access) theme in your terminal and run:

    npm install

This will install all node dependencies in the same directory.

The [**package.json**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/wp-content/themes/access/package.json) contains a proxy configuration that BrowserSync uses to serve from. If the url defined by your virtualization service ([see the requirements section](#requirements)) is different from the default proxy (`http://locahost:8080`), it should be changed to match.

Then run:

    npm run start

To start the development server for asset management. The NPM package comes scripts which can be run via the command:

    npm run {{ script }}

Script        | Description
--------------|-
`gulp`        | Gulp is included as a dependency so this proxy enables running gulp tasks in the [**gulpfile.babel.js**](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/wp-content/themes/access/gulpfile.babel.js) file if it is not globally installed. Any task in the GulpFile can be run with `npm run gulp {{ task name }}`.
`start`       | This is a proxy script for the `development` script below.
`development` | This runs the default Gulp task in development mode `NODE_ENV=development` which watches and compiles assets. Once it runs, it will start a [BrowserSync ↗](https://www.browsersync.io/) server to watch for file changes and reload the proxy set in the package.json `config` object.
`production`  | This runs the default Gulp task in production mode `NODE_ENV=production` which watches assets, compiles assets, and creates a BrowserSync server. The main difference is that production mode uses [ESLint ↗](https://eslint.org/) and will enforce JavaScript writing style.
`predeploy`   | This runs a one-off compilation of assets in production mode.
`scripts`     | This runs a one-off compilation of JavaScript assets in production mode.
`styles`      | This runs a one-off compilation of stylesheet assets in production mode.

## Debug Browsing

The query parameter `?debug=1` to the site URL in any environment to help in debugging front-end issues. This will do a number of things. It will serve a non-minified version of the JavaScript with some logging enabled. It will also allow you to jump around to different steps in the eligibility screener, e.g. `/eligiblity?debug=1#step-8`, and if the web inspector is open will pause the app before and after the screener form is submitted while outputting the data payload and response object respectively.

## Coding Style

### PHP

PHP is linted using [PHP Code Sniffer ↗](https://github.com/squizlabs/PHP_CodeSniffer) with the [PSR-2 standard ↗](https://www.php-fig.org/psr/psr-2/). The configuration can be found in the [phpcs.xml](https://github.com/CityOfNewYork/ACCESS-NYC/blob/master/phpcs.xml). Linting must be done manually using the command:

    composer run lint

PHP Code Sniffer can attempt to fix violations using `composer run fix` but it is not recommended for multiple files or large scripts as it can fail and leave malformed php files.

### Javascript

The JavaScript is written in ES6 syntax. Source files are located in the theme **/src/js** directory. JavaScript is linted by the `gulp lint` task with the ESLint [Google's standards ↗](https://google.github.io/styleguide/javascriptguide.xml). It is transpiled, concatenated, and minified by the `gulp scripts` task, using [Webpack Stream ↗](https://www.npmjs.com/package/webpack-stream).

The main JavaScript dependencies used are [jQuery ↗](http://jquery.com/), [Underscore.js ↗](http://underscorejs.org/), and [Vue.js ↗](https://vuejs.org/).

### SCSS

The theme relies on the [ACCESS NYC Patterns ↗](https://accesspatterns.cityofnewyork.us) for sourcing Stylesheets. Refer to the [documentation ↗](https://accesspatterns.cityofnewyork.us) for details on the different patterns and their usage. The Pattern SCSS files are processed, concatenated, and minified by the gulp styles task.

## Security

The team @ NYC Opportunity actively maintains and releases updates to ensure the security of this site using a combination of practices for WordPress specifically. The [NYCO WordPress Docker Boilerplate README file ↗](https://github.com/cityofnewyork/nyco-wp-docker-boilerplate) documents some of the tools and best practices.

### Reporting a Vulnerability

Please report any vulnerabilities confidentially using the [GitHub Security Advisories Feature](https://github.com/CityOfNewYork/ACCESS-NYC/security/advisories).

---

![The Mayor's Office for Economic Opportunity](NYCMOEO_SecondaryBlue256px.png)

[The Mayor's Office for Economic Opportunity ↗](http://nyc.gov/opportunity) (NYC Opportunity) is committed to sharing open source software that we use in our products. Feel free to ask questions and share feedback. **Interested in contributing?** See our open positions on [buildwithnyc.github.io ↗](http://buildwithnyc.github.io/). Follow our team on [Github ↗](https://github.com/orgs/CityOfNewYork/teams/nycopportunity) (if you are part of the [@cityofnewyork ↗](https://github.com/CityOfNewYork/) organization) or [browse our work on Github ↗](https://github.com/search?q=nycopportunity).