<?php get_header(); ?>
<main id="swup" class="swup-transition">
    <p><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></p>
    <?php if (have_posts()) : ?>
        <?php while (have_posts()) : the_post(); ?>
            <article <?php post_class(); ?>>
                <h1><?php the_title(); ?></h1>
                <div>
                    <?php the_content(); ?>
                </div>
                <?php
                $sample_text = function_exists('get_field') ? get_field('test_text') : '';
                $sample_image = function_exists('get_field') ? get_field('test_image') : '';
                ?>
                <?php if (!empty($sample_text)) : ?>
                    <div class="sample-meta-text">
                        <?php echo esc_html($sample_text); ?>
                    </div>
                <?php endif; ?>
                <?php if (!empty($sample_image)) : ?>
                    <div class="sample-meta-image">
                        <?php
                        if (is_array($sample_image)) {
                            $image_id = $sample_image['ID'] ?? 0;
                            $image_url = $sample_image['url'] ?? '';
                            $image_alt = $sample_image['alt'] ?? '';
                            if ($image_id) {
                                echo wp_get_attachment_image($image_id, 'large');
                            } elseif (!empty($image_url)) {
                                echo '<img src="' . esc_url($image_url) . '" alt="' . esc_attr($image_alt) . '">';
                            }
                        } elseif (is_numeric($sample_image)) {
                            echo wp_get_attachment_image((int) $sample_image, 'large');
                        } elseif (is_string($sample_image)) {
                            echo '<img src="' . esc_url($sample_image) . '" alt="">';
                        }
                        ?>
                    </div>
                <?php endif; ?>
            </article>
        <?php endwhile; ?>
    <?php else : ?>
        <p>No samples found.</p>
    <?php endif; ?>
</main>
<?php get_footer(); ?>
