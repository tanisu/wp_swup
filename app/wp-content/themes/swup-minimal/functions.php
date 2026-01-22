<?php

define('SWUP_MINIMAL_VERSION', '1.0');

function swup_minimal_setup_theme() {
    add_theme_support('title-tag');
}
add_action('after_setup_theme', 'swup_minimal_setup_theme');

add_filter('show_admin_bar', '__return_false');

function swup_minimal_enqueue_assets() {
    $theme_uri = get_template_directory_uri();

    wp_enqueue_style(
        'swup-minimal-style',
        $theme_uri . '/assets/dist/css/style.css',
        array(),
        SWUP_MINIMAL_VERSION
    );

    wp_enqueue_script(
        'swup-minimal-main',
        $theme_uri . '/assets/dist/js/main.js',
        array(),
        SWUP_MINIMAL_VERSION,
        true
    );
}
add_action('wp_enqueue_scripts', 'swup_minimal_enqueue_assets');
