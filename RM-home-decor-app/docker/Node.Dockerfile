FROM node:22-alpine

# O Wayfinder executa "php artisan" durante o build do Vite para gerar as
# rotas TypeScript usadas pelo React.
RUN apk add --no-cache \
    php \
    php-bcmath \
    php-curl \
    php-dom \
    php-fileinfo \
    php-mbstring \
    php-openssl \
    php-pdo \
    php-pdo_mysql \
    php-session \
    php-tokenizer \
    php-xml \
    php-xmlwriter

WORKDIR /var/www
