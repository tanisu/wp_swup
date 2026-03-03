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

起動後にブラウザで `http://localhost:8001` を開き、WordPress の初期セットアップを行ってください。

## URL一覧
- WordPress: http://localhost:8001
- phpMyAdmin: http://localhost:1235

※ 別プロジェクトで 8000/1234 を使用している場合は、本プロジェクトは 8001/1235 で起動します（`docker-compose.yml` で変更済み）。

## データ保存場所
- WordPress の編集対象（テーマ/プラグインなど）: `./app/wp-content`
- DB データ: Docker named volume `db_data`

## 補足
- WordPress 本体（`wp-config.php` など）はコンテナ内で管理します。
- `./app/wp-content` はホスト側から編集可能です。

### アップロード上限の調整（ローカル）
ローカル環境でメディアアップロード上限を上げたい場合は、`php/uploads.ini` を編集します。

現在は `docker-compose.yml` の `wordpress` サービスで以下をマウントしています。

- `./php/uploads.ini:/usr/local/etc/php/conf.d/uploads.ini`

設定変更後はコンテナを再起動してください。

```sh
docker compose down
docker compose up -d
```

## デプロイ（レンタルサーバー向けメモ）
- テーマ `swup-minimal` は `npm run build` 後の `assets/dist` を含めてアップロードしてください。
- `node_modules` や `assets/src` などの開発用ファイルはアップロード不要です（`DEPLOY_EXCLUDE.md` 参照）。
- MUプラグイン（`app/wp-content/mu-plugins/sample-cpt.php`）と ACF プラグインもサーバーに配置してください。

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

### NPMスクリプト一覧（swup-minimal）
`app/wp-content/themes/swup-minimal/package.json` で定義している主なコマンドです。

- `npm run 起動`（`npm run wp:up`）: Docker の WordPress 環境を起動（プレビューもこちら）
- `npm run 停止`（`npm run wp:down`）: Docker の WordPress 環境を停止
- `npm run 自動ビルド(ウォッチ)`（`npm run dev`）: ファイル変更を監視しながら `assets/dist` を再ビルド
- `npm run ライブプレビュー（保存でブラウザ更新）`: 上記に加え Browser Sync で **PHP / ビルド成果物の変更時にブラウザを自動更新**（要: 先に `npm run サーバー起動` で Docker 起動し、表示は Browser Sync の URL 例: http://localhost:3000 を開く）
- `npm run 本番ビルド`（`npm run build`）: `assets/dist` を1回ビルドして終了
- `npm run 開発サーバー（SCSSソースマップ用）`: Vite の dev サーバーを起動。**ブラウザの検証で SCSS のファイル・行が表示される**（下記参照）

### ブラウザの検証で SCSS の場所を表示する
開発者ツールの「スタイル」で、どの SCSS ファイルの何行目かを見たい場合は、**Vite の開発サーバー** を併用します。

**方法A: ライブプレビュー（推奨）**  
`npm run ライブプレビュー（保存でブラウザ更新）` で **http://localhost:3000/** を開いているときは、**別ターミナルで** 次を実行してください。

```sh
cd app/wp-content/themes/swup-minimal
npm run 開発サーバー（SCSSソースマップ用）
```

この状態で **http://localhost:3000/** のまま開発者ツールを開くと、スタイルの右に **`assets/src/scss/style.scss` の行番号** が表示されます（`?vite=1` は不要です）。

**方法B: ?vite=1 を付けて開く**  
ライブプレビューを使わない場合は、次の手順でも同じように SCSS の場所を確認できます。

1. **Docker で WordPress を起動**（未起動なら）  
   `npm run サーバー起動（プレビューもこちら）`

2. **テーマで Vite 開発サーバーを起動**  
   ```sh
   cd app/wp-content/themes/swup-minimal
   npm run 開発サーバー（SCSSソースマップ用）
   ```

3. **サイトを開くときに `?vite=1` を付ける**  
   例: `http://localhost:8001/?vite=1`

4. 開発者ツールの「要素」→「スタイル」で、**`assets/src/scss/style.scss` の行番号** が表示されます。

※ 通常のプレビュー（Vite 開発サーバーを起動していない、かつ localhost:3000 以外で開いている）では、ビルド済みの `assets/dist` を参照します。
- トップ→固定ページのリンクでフルリロードせず遷移する
- コンソールに `swup content replaced` が出る
- body class と title が遷移後に更新される

### 遷移アニメーション（オーバーレイ）
現在は `@swup/js-plugin` を使い、以下の流れでページ遷移しています。

1. `out`: 画面下からオーバーレイ矩形を上げて現在ページを覆う
2. コンテンツを差し替え
3. `in`: オーバーレイ矩形を上へ抜いて新しいページを表示

編集箇所は `app/wp-content/themes/swup-minimal/assets/src/js/main.js` です。

- オーバーレイの見た目を変える: `getTransitionLayer()` を編集
  - 例: `layer.style.background` の変更、画像要素の追加
- 遷移の動き（速度・イージング・移動量）を変える: `new SwupJsPlugin({ animations: [...] })` 内の `out` / `in` を編集

変更後はビルド成果物に反映してください。

```sh
cd app/wp-content/themes/swup-minimal
npm run build
```

### テーマの主要ファイル
- JS エントリ: `app/wp-content/themes/swup-minimal/assets/src/js/main.js`
- SCSS エントリ: `app/wp-content/themes/swup-minimal/assets/src/scss/style.scss`
- ビルド成果物: `app/wp-content/themes/swup-minimal/assets/dist/`
