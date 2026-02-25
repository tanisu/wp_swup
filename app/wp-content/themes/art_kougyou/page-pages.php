<?php
/**
 * Template Name: Pages List
 */
get_header();
?>
<main id="swup" class="swup-transition">
    <p><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></p>
    <h1>Pages</h1>
    <?php
    $paged = max(1, (int) get_query_var('paged'));
    $pages_query = new WP_Query([
        'post_type'      => 'page',
        'post_status'    => 'publish',
        'posts_per_page' => (int) get_option('posts_per_page'),
        'paged'          => $paged,
        'orderby'        => 'title',
        'order'          => 'ASC',
    ]);
    ?>
    <?php if ($pages_query->have_posts()) : ?>
        <ul class="archive-sample-grid">
            <?php while ($pages_query->have_posts()) : $pages_query->the_post(); ?>
                <li class="archive-sample-card">
                    <a class="archive-sample-link" href="<?php echo esc_url(get_permalink()); ?>">
                        <p class="archive-sample-date"><?php echo esc_html(get_the_date()); ?></p>
                        <h2 class="archive-sample-title"><?php the_title(); ?></h2>
                        <div class="archive-sample-excerpt">
                            <?php the_excerpt(); ?>
                        </div>
                    </a>
                </li>
            <?php endwhile; ?>
        </ul>
        <?php
        echo paginate_links([
            'total'   => $pages_query->max_num_pages,
            'current' => $paged,
        ]);
        ?>
    <?php else : ?>
        <p>No pages found.</p>
    <?php endif; ?>
    <?php wp_reset_postdata(); ?>
</main>
<?php get_footer(); ?>
