<?php
/**
 * Template Name: Posts List
 */
get_header();
?>
<main id="swup" class="swup-transition">
    <p><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></p>
    <h1>Posts</h1>
    <?php
    $paged = max(1, (int) get_query_var('paged'));
    $posts_query = new WP_Query([
        'post_type'      => 'post',
        'post_status'    => 'publish',
        'posts_per_page' => (int) get_option('posts_per_page'),
        'paged'          => $paged,
    ]);
    ?>
    <?php if ($posts_query->have_posts()) : ?>
        <ul class="archive-sample-grid">
            <?php while ($posts_query->have_posts()) : $posts_query->the_post(); ?>
                <li class="archive-sample-card">
                    <a class="archive-sample-link" href="<?php echo esc_url(get_permalink()); ?>">
                        <p class="archive-sample-date"><?php echo esc_html(get_the_date()); ?></p>
                        <h2 class="archive-sample-title"><?php the_title(); ?></h2>
                    </a>
                </li>
            <?php endwhile; ?>
        </ul>
        <?php
        echo paginate_links([
            'total'   => $posts_query->max_num_pages,
            'current' => $paged,
        ]);
        ?>
    <?php else : ?>
        <p>No posts found.</p>
    <?php endif; ?>
    <?php wp_reset_postdata(); ?>
</main>
<?php get_footer(); ?>
