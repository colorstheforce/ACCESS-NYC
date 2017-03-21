<?php
/**
 * Template name: Location Map
 * This is the controller for the map at /locations. Most of the code here is used
 * to build the category/program filter list. First we get a list of program
 * categories. Then we loop over those categories to find the related programs.
 * We only want to list Programs that are reverse-related to a location so we
 * need to do a reverse-relationship query and weed out any programs that are
 * not related.
 */
if ( ! class_exists( 'Timber' ) ) {
  echo 'Timber not activated. Make sure you activate the plugin in <a href="/wp-admin/plugins.php#timber">/wp-admin/plugins.php</a>';
  return;
}

$context = Timber::get_context();

// Get the program categories.
$categories = get_categories(array(
  'post_type' => 'programs',
  'taxonomy' => 'programs',
  'hide_empty' => true
));

$context['filters'] = [];

// Set default language.
global $sitepress;
$default_lang = $sitepress->get_default_language();

// For each program category, get each associated program post and add those
// posts to the page context.
foreach ($categories as $category) {
  $catPosts = get_posts( array(
    'post_type' => 'programs',
    'tax_query' => array(
      array(
          'taxonomy' => 'programs',
          'terms' => $category->term_id,
      )
    )
  ));

  $filteredPosts = [];

  foreach ($catPosts as $catPost) {
    // 'uid' Is used here to get the ID of the English version of the programs
    // so translations work more smoothly.
    $catPost->uid = icl_object_id($catPost->ID, 'post', true, $default_lang);

    // Do a reverse relationship query to see if there is an associated location
    // to this program. If so, add this program to the $filteredPosts array.
    $relatedLocations = get_posts( array(
      'post_type' => 'location',
      'posts_per_page' => 1,
      'meta_query' => array(
        array(
          'key' => 'programs',
          'value' => $catPost->uid,
          'compare' => 'LIKE'
        )
      )
    ));

    if ($relatedLocations) {
      array_push($filteredPosts, $catPost);
    }
  }

  // If this category has filtered posts, add it to the filter array.
  if (count($filteredPosts) > 0) {
    $context['filters'][] = array(
      'category' => array(
        'name' => $category->name,
        'slug' => $category->slug
      ),
      'programs' => $filteredPosts
    );
  }
}

$templates = array( 'locations.twig' );

Timber::render( $templates, $context );
