FROM postgres:15-alpine

# 必要なパッケージをインストール
RUN apk add --no-cache \
    bash \
    curl \
    ca-certificates

# 作業ディレクトリを設定
WORKDIR /app

# PostgreSQLクライアント（psql）は基本イメージに含まれています

# コンテナ起動時のデフォルトコマンド
CMD ["bash"]

# PostgreSQLのデフォルトポートを公開
EXPOSE 5432
