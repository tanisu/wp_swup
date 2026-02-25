<?php get_header(); ?>
<main id="swup" class="swup-transition">
    <p><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></p>
    <h1><?php post_type_archive_title(); ?></h1>
    <?php if (have_posts()) : ?>
        <ul class="archive-sample-grid">
            <?php while (have_posts()) : the_post(); ?>
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
        <?php the_posts_pagination(['class' => 'archive-sample-pagination']); ?>
    <?php else : ?>
        <p>No posts found.</p>
    <?php endif; ?>
</main>
<?php get_footer(); ?>
