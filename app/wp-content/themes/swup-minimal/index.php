<?php get_header(); ?>
<main id="swup" class="swup-transition">
<div class="hero-bleed">
<section class="hero">
    <div class="hero-content">
        <p class="hero-eyebrow">Reliable Web Solutions</p>
        <h1 class="hero-title">
            企業の成長を支える、<span class="hero-title-break">スピード重視のWeb体験</span>
        </h1>
        <p class="hero-lead">
            WordPressとSwupで、更新しやすく、表示も軽いサイト運用を実現します。
            小さく始めて、必要な機能だけを段階的に拡張できます。
        </p>
        <div class="hero-actions">
            <a class="hero-button primary" href="<?php echo esc_url(home_url('/contact/')); ?>">お問い合わせ</a>
            <a class="hero-button ghost" href="<?php echo esc_url(home_url('/downloads/')); ?>">資料ダウンロード</a>
        </div>
        <div class="hero-metrics">
            <div>
                <p class="hero-metric-value">99.9%</p>
                <p class="hero-metric-label">稼働率</p>
            </div>
            <div>
                <p class="hero-metric-value">48h</p>
                <p class="hero-metric-label">最短初期構築</p>
            </div>
            <div>
                <p class="hero-metric-value">120+</p>
                <p class="hero-metric-label">導入社数</p>
            </div>
        </div>
    </div>
    <div class="hero-panel">
        <div class="hero-card">
            <p class="hero-card-label">Latest Update</p>
            <h2 class="hero-card-title">運用レポートの自動化に対応</h2>
            <p class="hero-card-text">週次のアクセス集計を自動化し、担当者の作業時間を削減します。</p>
        </div>
        <div class="hero-card">
            <p class="hero-card-label">Performance</p>
            <h2 class="hero-card-title">平均LCP 1.2s</h2>
            <p class="hero-card-text">画像最適化とSwup遷移で、体感速度を改善。</p>
        </div>
    </div>
</section>
</div>
<?php
$swup_minimal_posts = get_posts(array(
    'numberposts' => 5,
    'post_status' => 'publish',
));
$swup_minimal_pages = get_pages(array(
    'sort_column' => 'post_title',
    'post_status' => 'publish',
    'exclude' => array_filter(array(
        (int) get_option('page_for_posts'),
        (int) get_option('page_on_front'),
    )),
));
$swup_minimal_pages = array_values(array_filter(
    $swup_minimal_pages,
    function ($page) {
        $template = get_page_template_slug($page->ID);
        if (in_array($template, ['page-posts.php', 'page-pages.php'], true)) {
            return false;
        }
        if (in_array($page->post_name, ['posts', 'pages'], true)) {
            return false;
        }
        return true;
    }
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
        <p><a href="<?php echo esc_url(home_url('/posts/')); ?>">All Posts</a></p>
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
        <p><a href="<?php echo esc_url(home_url('/pages/')); ?>">All Pages</a></p>
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
