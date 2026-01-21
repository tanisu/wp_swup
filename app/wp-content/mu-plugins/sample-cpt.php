<?php
/**
 * Plugin Name: Sample CPT (MU)
 * Description: Registers the "sample" custom post type.
 */

add_action('init', function () {
  $labels = [
    'name'               => 'Samples',
    'singular_name'      => 'Sample',
    'add_new'            => 'Add New',
    'add_new_item'       => 'Add New Sample',
    'edit_item'          => 'Edit Sample',
    'new_item'           => 'New Sample',
    'view_item'          => 'View Sample',
    'search_items'       => 'Search Samples',
    'not_found'          => 'No Samples found',
    'not_found_in_trash' => 'No Samples found in Trash',
    'all_items'          => 'All Samples',
    'menu_name'          => 'Samples',
    'name_admin_bar'     => 'Sample',
  ];

  register_post_type('sample', [
    'labels'        => $labels,
    'public'        => true,
    'has_archive'   => true,
    'rewrite'       => ['slug' => 'sample', 'with_front' => false],
    'show_in_rest'  => true,
    'menu_icon'     => 'dashicons-admin-post',
    'supports'      => ['title', 'editor', 'thumbnail', 'excerpt'],
    'query_var'     => 'sample',
  ]);
});

add_action('pre_get_posts', function ($query) {
  if (is_admin() || !$query->is_main_query()) {
    return;
  }

  if ($query->is_post_type_archive('sample')) {
    $query->set('posts_per_page', 10);
  }
});
