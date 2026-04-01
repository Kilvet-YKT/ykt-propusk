#!/bin/bash
# generate-env.sh - генерирует .env файл со случайными паролями, если они не заданы

ENV_FILE=".env"
EXAMPLE_FILE=".env.example"

# Если нет .env, копируем из .env.example
if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$EXAMPLE_FILE" ]; then
        cp "$EXAMPLE_FILE" "$ENV_FILE"
        echo "Создан файл $ENV_FILE из шаблона"
    else
        echo "Ошибка: файл $EXAMPLE_FILE не найден"
        exit 1
    fi
fi

# Функция для генерации случайного пароля
generate_password() {
    openssl rand -base64 20 2>/dev/null | tr -d '\n' | tr -d '/+' | cut -c1-20
}

# Проверяем и генерируем пароли
root_pass=$(grep -E "^MYSQL_ROOT_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2)
user_pass=$(grep -E "^MYSQL_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2)

if [ -z "$root_pass" ] || [ "$root_pass" = "root" ]; then
    root_pass=$(generate_password)
    echo "Сгенерирован новый root пароль"
fi

if [ -z "$user_pass" ] || [ "$user_pass" = "password" ]; then
    user_pass=$(generate_password)
    echo "Сгенерирован новый пароль для пользователя"
fi

# Обновляем файл .env
# Используем sed для замены значений
if grep -q "^MYSQL_ROOT_PASSWORD=" "$ENV_FILE"; then
    sed -i "s/^MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$root_pass/" "$ENV_FILE"
else
    echo "MYSQL_ROOT_PASSWORD=$root_pass" >> "$ENV_FILE"
fi

if grep -q "^MYSQL_PASSWORD=" "$ENV_FILE"; then
    sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$user_pass/" "$ENV_FILE"
else
    echo "MYSQL_PASSWORD=$user_pass" >> "$ENV_FILE"
fi

if grep -q "^DB_PASS=" "$ENV_FILE"; then
    sed -i "s/^DB_PASS=.*/DB_PASS=$user_pass/" "$ENV_FILE"
else
    echo "DB_PASS=$user_pass" >> "$ENV_FILE"
fi

echo "Файл .env готов. Пароли сгенерированы."
