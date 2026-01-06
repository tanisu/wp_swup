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
