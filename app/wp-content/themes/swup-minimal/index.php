<?php get_header(); ?>
<main id="swup" class="swup-transition">
<?php
$swup_minimal_posts = get_posts(array(
    'numberposts' => 5,
    'post_status' => 'publish',
));
$swup_minimal_pages = get_pages(array(
    'sort_column' => 'post_title',
    'post_status' => 'publish',
));
$swup_minimal_samples = get_posts(array(
    'numberposts' => 5,
    'post_status' => 'publish',
    'post_type' => 'sample',
));
?>
<?php if (!empty($swup_minimal_posts)) : ?>
    <section>
        <h2>Posts</h2>
        <ul class="home-card-grid">
            <?php foreach ($swup_minimal_posts as $swup_minimal_post) : ?>
                <li class="home-card">
                    <a class="home-card-link" href="<?php echo esc_url(get_permalink($swup_minimal_post)); ?>">
                        <p class="home-card-date"><?php echo esc_html(get_the_date('', $swup_minimal_post)); ?></p>
                        <h3 class="home-card-title"><?php echo esc_html(get_the_title($swup_minimal_post)); ?></h3>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
<?php endif; ?>
<?php if (!empty($swup_minimal_pages)) : ?>
    <section>
        <h2>Pages</h2>
        <ul class="home-card-grid">
            <?php foreach ($swup_minimal_pages as $swup_minimal_page) : ?>
                <li class="home-card">
                    <a class="home-card-link" href="<?php echo esc_url(get_permalink($swup_minimal_page)); ?>">
                        <p class="home-card-date"><?php echo esc_html(get_the_date('', $swup_minimal_page)); ?></p>
                        <h3 class="home-card-title"><?php echo esc_html($swup_minimal_page->post_title); ?></h3>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
<?php endif; ?>
<?php if (!empty($swup_minimal_samples)) : ?>
    <section>
        <h2>Samples</h2>
        <p><a href="<?php echo esc_url(get_post_type_archive_link('sample')); ?>">All Samples</a></p>
        <ul class="home-card-grid">
            <?php foreach ($swup_minimal_samples as $swup_minimal_sample) : ?>
                <li class="home-card">
                    <a class="home-card-link" href="<?php echo esc_url(get_permalink($swup_minimal_sample)); ?>">
                        <p class="home-card-date"><?php echo esc_html(get_the_date('', $swup_minimal_sample)); ?></p>
                        <h3 class="home-card-title"><?php echo esc_html(get_the_title($swup_minimal_sample)); ?></h3>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
<?php endif; ?>
<p><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></p>

</main>
<?php get_footer(); ?>
