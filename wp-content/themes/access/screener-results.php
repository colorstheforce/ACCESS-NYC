<?php

/**
 * Template Name: Eligibility Screener Results
 *
 * This controls the view at /elgibility/screener. It expects a few URL
 * parameters.
 *   programs: a comma separated list of program codes
 *   categories: a comma separated list of category slugs
 *   date: a UNIX timestamp of when the screener was completed
 *   guid: a unique user ID provided in the Drools Proxy response
 *
 * The screener results list is composed of programs listed in the programs
 * parameter. They are organized into "programs you are interested in" and
 * "other programs you qualify for" based on the categories. In the sidebar of
 * the screener, there are options to share the results via SMS or email via a
 * form. Parameters for that form are created via a hash based on the URL
 * parameters.
 *
 * TODO: This page was originally spec'd to display a line of copy that said
 * "these results are valid as of SOME_DATE" which would be based on the date
 * parameter.
 *
 * @author Blue State Digital
 */

require_once ACCESS\controller('programs');
require_once ACCESS\controller('alert');

/**
 * Enqueue
 */

// Main
enqueue_language_style('style');

// Integrations
enqueue_inline('rollbar');
enqueue_inline('webtrends');
enqueue_inline('data-layer');
enqueue_inline('google-optimize');
enqueue_inline('google-analytics');
enqueue_inline('google-tag-manager');

// Main
enqueue_script('screener');

/**
 * Context
 */

$context = Timber::get_context();

$programBlob = '';

$categoryBlob = '';

$query = array();

// Gets the URL Parameters for the search value,
if (isset($_GET['programs'])) {
  $programBlob = validate_params('programs', urldecode(htmlspecialchars($_GET['programs'])));
  $context['resultPrograms'] = explode(',', $programBlob);
  $query['programs'] = $programBlob;
} else {
  $context['resultPrograms'] = '';
}

if (isset($_GET['categories'])) {
  $categoryBlob = validate_params('categories', urldecode(htmlspecialchars($_GET['categories'])));
  $context['resultCategories'] = explode(',', $categoryBlob);
  $query['categories'] = $categoryBlob;
} else {
  $context['resultCategories'] = '';
}

if (isset($_GET['date'])) {
  $dateBlob = validate_params('date', urldecode(htmlspecialchars($_GET['date'])));
  $context['resultDate'] = $dateBlob;
  $query['date'] = $dateBlob;
} else {
  $context['resultDate'] = '';
}

if (isset($_GET['guid'])) {
  $guidBlob = validate_params('guid', urldecode(htmlspecialchars($_GET['guid'])));
  $context['guid'] = $guidBlob;
  $query['guid'] = $guidBlob;
} else {
  $context['guid'] = '';
}

$selectedProgramArgs = array(
  'post_type' => 'programs',
  'tax_query' => array(
    array(
      'taxonomy' => 'programs',
      'field' => 'slug',
      'terms' => $context['resultCategories']
    )
  ),
  'posts_per_page' => -1,
  'meta_key' => 'program_code',
  'meta_value' => $context['resultPrograms']
);

$additionalProgramArgs = array(
  'post_type' => 'programs',
  'tax_query' => array(
    array(
      'taxonomy' => 'programs',
      'field' => 'slug',
      'terms' => $context['resultCategories'],
      'operator' => 'NOT IN'
    )
  ),
  'posts_per_page' => -1,
  'meta_key' => 'program_code',
  'meta_value' => $context['resultPrograms']
);

// Rebuild the query from entity stripped params
$get = $query;
$query = http_build_query($query);
$query = (isset($query)) ? '?'.$query : '';

// Share by email/sms fields.
$context['shareAction'] = admin_url('admin-ajax.php');

$context['shareUrl'] = home_url() . '/eligibility/results/' . $query;

$context['shareHash'] = \SMNYC\hash($context['shareUrl']);

$context['getParams'] = $get; // pass safe parameters

$context['selectedPrograms'] = array_map(function($post) {
    return new Controller\Programs($post);
}, Timber::get_posts($selectedProgramArgs));

$context['additionalPrograms'] = array_map(function($post) {
    return new Controller\Programs($post);
}, Timber::get_posts($additionalProgramArgs));

/**
 * Alerts
 */

if (get_field('alert')) {
  $context['alerts'] = get_field('alert');
} else {
  $alerts = Timber::get_posts(array(
    'post_type' => 'alert',
    'posts_per_page' => -1
  ));

  $context['alerts'] = array_filter($alerts, function($p) {
    return in_array('screener', array_values($p->custom['location']));
  });
}

// Extend alerts with Timber Post Controller
$context['alerts'] = array_map(function($post) {
  return new Controller\Alert($post);
}, $context['alerts']);

/**
 * Render the view
 */

Timber::render('screener/results.twig', $context);
