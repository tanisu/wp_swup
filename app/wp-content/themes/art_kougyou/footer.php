<footer class="site-footer">
  <div class="site-footer-inner">
    <div class="site-footer-brand">
      <p class="site-footer-logo">Swup Minimal</p>
      <p class="site-footer-tagline">運用しやすく、速い企業サイトを。</p>
      <p class="site-footer-address">
        〒100-0000 東京都千代田区サンプル1-2-3<br>
        TEL 03-0000-0000
      </p>
    </div>
    <div class="site-footer-links">
      <div>
        <p class="site-footer-title">サービス</p>
        <ul>
          <li><a href="<?php echo esc_url(home_url('/service/')); ?>">Web制作</a></li>
          <li><a href="<?php echo esc_url(home_url('/performance/')); ?>">パフォーマンス改善</a></li>
          <li><a href="<?php echo esc_url(home_url('/support/')); ?>">運用サポート</a></li>
        </ul>
      </div>
      <div>
        <p class="site-footer-title">会社情報</p>
        <ul>
          <li><a href="<?php echo esc_url(home_url('/about/')); ?>">会社概要</a></li>
          <li><a href="<?php echo esc_url(home_url('/team/')); ?>">チーム</a></li>
          <li><a href="<?php echo esc_url(home_url('/careers/')); ?>">採用情報</a></li>
        </ul>
      </div>
      <div>
        <p class="site-footer-title">リソース</p>
        <ul>
          <li><a href="<?php echo esc_url(home_url('/posts/')); ?>">ブログ</a></li>
          <li><a href="<?php echo esc_url(home_url('/downloads/')); ?>">資料ダウンロード</a></li>
          <li><a href="<?php echo esc_url(home_url('/contact/')); ?>">お問い合わせ</a></li>
        </ul>
      </div>
    </div>
  </div>
  <div class="site-footer-bottom">
    <p>© <?php echo esc_html(date('Y')); ?> Swup Minimal Inc. All rights reserved.</p>
  </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
