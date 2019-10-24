<?php

/**
 * Return a localized reading friendly string of the enviroment.
 * @param  string $env The environment string to return if uknown.
 * @return string      The localized reading friendly string.
 */
function environment_string($env = 'Unkown') {
  switch (WP_ENV) {
    case 'accessnyc':
      $env = __('Production');
      break;
    case 'accessnycstage':
      $env = __('Staging');
      break;
    case 'accessnycdemo':
      $env = __('Demo');
      break;
    case 'accessnyctest':
      $env = __('Testing');
      break;
    case 'development':
      $env = __('Development');
      break;
  }

  return $env;
}

/**
 * Enqueue a hashed script based on it's name.
 * Enqueue the minified version based on debug mode.
 * @param  [string]  $name The name of the script source.
 * @param  [boolean] $cors Add the crossorigin="anonymous" attribute.
 * @return null
 */
function enqueue_script($name, $cors = false) {
  require_once ABSPATH . '/vendor/nyco/wp-assets/dist/script.php';
  $script = Nyco\Enqueue\script($name);

  if ($cors) {
    add_crossorigin_attr($name);
  }
}

/**
 * Helper to add cross origin anonymous attribute to scripts.
 * @param [string] $name The name of the script.
 */
function add_crossorigin_attr($name) {
  $name = end(explode('/', $name));
  add_filter('script_loader_tag', function ($tag, $handle) use ($name) {
    if ($name === $handle) {
      return str_replace(' src', ' crossorigin="anonymous" src', $tag);
    }
  }, 10, 2);
}

/**
 * Enqueue a hashed style based on it's name and language prefix.
 * @param  [string] $name the name of the stylesheet source
 * @return null
 */
function enqueue_language_style($name) {
  require_once ABSPATH . '/vendor/nyco/wp-assets/dist/style.php';

  $languages = array('ar', 'ko', 'ur', 'zh-hant');
  $lang = (!in_array(ICL_LANGUAGE_CODE, $languages))
  ? 'default' : ICL_LANGUAGE_CODE;

  $style = Nyco\Enqueue\style("assets/styles/$name-$lang");
}

/**
 * Validate params through regex
 * @param  string $namespace The namespace of the parameter
 * @param  string $subject   The string to validate
 * @return string            Returns blank string if false, parameter if valid
 */
function validate_params($namespace, $subject) {
  $patterns = array(
    'programs' => '/^[A-Z0-9,]*$/',
    'categories' => '/^[a-z,-]*$/',
    'date' => '/^[0-9]*$/',
    'guid' => '/^[a-zA-Z0-9]{13,13}$/',
    'step' => '/^[a-z,-]*$/'
  );
  preg_match($patterns[$namespace], $subject, $matches);

  return (isset($matches[0])) ? $matches[0] : ''; // fail silently
}

/**
 * Creates a shareable url along with valid hash
 * @param  array $params Requires programs, categories, date, guid, share_link
 * @return array         0; the url 1; the hash
 */
function share_data($params) {
  $query = array();
  $data = array();

  // Gets the URL Parameters for the search value,
  if (isset($params['programs'])) {
    $query['programs'] = validate_params(
      'programs', urldecode(htmlspecialchars($params['programs']))
    );
  }

  if (isset($params['categories'])) {
    $query['categories'] = validate_params(
      'categories', urldecode(htmlspecialchars($params['categories']))
    );
  }

  if (isset($params['date'])) {
    $query['date'] = validate_params(
      'date', urldecode(htmlspecialchars($params['date']))
    );
  }

  if (isset($params['guid'])) {
    $query['guid'] = validate_params(
      'guid', urldecode(htmlspecialchars($params['guid']))
    );
  }

  // Build query
  $http_query = http_build_query($query);
  $http_query = (isset($http_query)) ? '?'.$http_query : '';
  $url = home_url().$params['path'].$http_query;
  $hash = \SMNYC\hash($url);

  return array('url' => $url, 'hash' => $hash, 'query' => $query);
}

/**
 * Get the environment variable from config
 * @param  string $value The key for the environment variable
 * @return string        The environment variable
 */
function get_env($value) {
  return $_ENV[$value];
}