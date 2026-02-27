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

### Swup の確認ポイント
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

## お問い合わせフォーム実装メモ（art_kougyou）
現在のお問い合わせ機能は、`art_kougyou` テーマ内の以下で構成しています。

### ページとテンプレート対応
- `/contact/`（固定ページ）: `template-contact-form.php`（入力ページ）
- `/contact/confirm/`（固定ページ）: `template-contact-confirm.php`（確認ページ）
- `/contact/send/`（エンドポイント）: `inc/contact.php` 内の `swup_minimal_handle_contact_send_route()`
- `/contact/thanks/`（固定ページ）: `template-contact-thanks.php`（送信完了ページ）

### 主な実装ファイル
- 共通ロジック（バリデーション、メール送信、セッション管理、管理画面設定）  
  `app/wp-content/themes/art_kougyou/inc/contact.php`
- テーマ読込元  
  `app/wp-content/themes/art_kougyou/functions.php`

### 項目を増やす方法
項目追加は `swup_minimal_contact_fields()` を編集します。  
定義を追加すると、以下が連動します。

- 入力フォーム表示（`template-contact-form.php`）
- 確認画面表示（`template-contact-confirm.php`）
- バリデーション（必須判定・型チェック）
- メール本文（管理者向け / 自動返信）

対応している入力タイプ:
- `text`
- `email`
- `textarea`
- `select`
- `radio`
- `checkbox`（複数選択）

### 項目定義例
```php
'budget' => array(
    'label' => 'ご予算',
    'required' => false,
    'input_type' => 'select',
    'options' => array(
        'under-100' => '100万円未満',
        '100-300' => '100万円〜300万円',
        'over-300' => '300万円以上',
    ),
),
```

### 管理者向け通知先メール
`設定 > 一般 > お問い合わせ受信メールアドレス` が設定されていればそれを優先し、未設定時は `管理者メールアドレス` を使用します。
