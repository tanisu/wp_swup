# WordPress + MySQL + phpMyAdmin (Docker)

ローカル開発用のシンプルな WordPress 環境です。WordPress 本体はコンテナ内の `/var/www/html` を使用し、開発で触るのは `./app/wp-content` に寄せています。

## 初期セットアップ
1. `.env.example` をコピーして `.env` を作成
2. `.env` の値を必要に応じて変更

```sh
cp .env.example .env
```

## 起動
```sh
docker compose up -d
```

## 停止
```sh
docker compose down
```

## 起動確認手順（コマンド）
```sh
docker compose up -d
```

起動後にブラウザで `http://localhost:8000` を開き、WordPress の初期セットアップを行ってください。

## URL一覧
- WordPress: http://localhost:8000
- phpMyAdmin: http://localhost:1234

## データ保存場所
- WordPress の編集対象（テーマ/プラグインなど）: `./app/wp-content`
- DB データ: Docker named volume `db_data`

## 補足
- WordPress 本体（`wp-config.php` など）はコンテナ内で管理します。
- `./app/wp-content` はホスト側から編集可能です。

## テーマ（swup-minimal）
Swup + Vite + SCSS を使った最小テーマです。ビルド成果物（`assets/dist`）のみを WordPress 側で読み込みます。

### テーマのディレクトリ構成
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

### テーマのビルド
```sh
cd app/wp-content/themes/swup-minimal
npm install
npm run dev
# または
npm run build
```

### Swup の確認ポイント
- トップ→固定ページのリンクでフルリロードせず遷移する
- コンソールに `swup content replaced` が出る
- body class と title が遷移後に更新される

### テーマの主要ファイル
- JS エントリ: `app/wp-content/themes/swup-minimal/assets/src/js/main.js`
- SCSS エントリ: `app/wp-content/themes/swup-minimal/assets/src/scss/style.scss`
- ビルド成果物: `app/wp-content/themes/swup-minimal/assets/dist/`
