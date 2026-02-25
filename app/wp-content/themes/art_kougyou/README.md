# swup-minimal (Vite build)

## Commands
```sh
npm install
npm run dev
npm run build
```

## WordPressでの確認
- WordPress: http://localhost:8000
- ブラウザのコンソールで "vite main loaded" が出ることを確認
- Swup が読み込めていれば "swup initialized" と遷移時 "swup content replaced" が出る
- body class と head（titleなど）が遷移後に更新されることを確認
- `data-swup-preload` を付けたリンクがあれば先読みされる

## テーマのディレクトリ構成
```
app/wp-content/themes/swup-minimal/
  functions.php
  index.php
  single.php
  page.php
  header.php
  footer.php
  package.json
  vite.config.js
  assets/
    src/
      scss/style.scss
      js/main.js
    dist/
      css/style.css
      js/main.js
```

## テーマの主要ファイル
- JS エントリ: `app/wp-content/themes/swup-minimal/assets/src/js/main.js`
- SCSS エントリ: `app/wp-content/themes/swup-minimal/assets/src/scss/style.scss`
- ビルド成果物: `app/wp-content/themes/swup-minimal/assets/dist/`
