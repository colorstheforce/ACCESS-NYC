<?php
/**
 * Template anem: Program detail page.
 */

$context = Timber::get_context();

// Gets the url parameter on the page for navigating each section.
if (isset($_GET['step'])) {
  $context['step'] = $_GET['step'];
} else {
  $context['step'] = '';
}

$post = Timber::get_post();
$templates = array( 'single-' . $post->ID . '.twig', 'single-' . $post->post_type . '.twig', 'single.twig' );
$context['post'] = $post;

// Share by email/sms fields.
$context['shareAction'] = admin_url( 'admin-ajax.php' );
$context['shareUrl'] = \SMNYC\get_current_url();
$context['shareHash'] = \SMNYC\hash($context['shareUrl']);

Timber::render( $templates, $context );
