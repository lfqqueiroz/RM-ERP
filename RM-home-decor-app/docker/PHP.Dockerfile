FROM php:8.4-fpm

# Instala dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    git \
    curl \
    default-mysql-client \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev

# Limpa o cache do gerenciador de pacotes
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Instala extensões nativas do PHP requeridas pelo Laravel
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Copia o Composer oficial atualizado para dentro do container
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
