<?php get_header(); ?>
<main id="swup" class="swup-transition">
    <section class="not-found">
        <p class="not-found-code">404</p>
        <h1 class="not-found-title">ページが見つかりません</h1>
        <p class="not-found-text">
            URLが変更されたか、入力に誤りがある可能性があります。
        </p>
        <div class="not-found-actions">
            <a class="hero-button primary" href="<?php echo esc_url(home_url('/')); ?>">トップへ戻る</a>
            <a class="hero-button ghost" href="<?php echo esc_url(home_url('/contact/')); ?>">お問い合わせ</a>
        </div>
    </section>
</main>
<?php get_footer(); ?>
