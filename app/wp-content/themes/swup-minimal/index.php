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
?>
<?php if (!empty($swup_minimal_posts)) : ?>
    <nav>
        <ul>
            <?php foreach ($swup_minimal_posts as $swup_minimal_post) : ?>
                <li>
                    <a href="<?php echo esc_url(get_permalink($swup_minimal_post)); ?>">
                        <?php echo esc_html(get_the_title($swup_minimal_post)); ?>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </nav>
<?php endif; ?>
<?php if (!empty($swup_minimal_pages)) : ?>
    <section>
        <h2>Pages</h2>
        <ul>
            <?php foreach ($swup_minimal_pages as $swup_minimal_page) : ?>
                <li>
                    <a class="test-page-link" href="<?php echo esc_url(get_permalink($swup_minimal_page)); ?>">
                        <?php echo esc_html($swup_minimal_page->post_title); ?>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
<?php endif; ?>
<p><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></p>
<?php if (have_posts()) : ?>
    <?php while (have_posts()) : the_post(); ?>
        <article <?php post_class(); ?>>
            <h1><?php the_title(); ?></h1>
            <div>
                <?php the_content(); ?>
            </div>
        </article>
    <?php endwhile; ?>
<?php else : ?>
    <p>No posts found.</p>
<?php endif; ?>
</main>
<?php get_footer(); ?>
