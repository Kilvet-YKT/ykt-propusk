.PHONY: help init up down logs clean

help:
	@echo "Доступные команды:"
	@echo "  make init   - сгенерировать .env файл с паролями"
	@echo "  make up     - запустить контейнеры"
	@echo "  make down   - остановить контейнеры"
	@echo "  make logs   - показать логи"
	@echo "  make clean  - остановить и удалить контейнеры и тома"

init:
	chmod +x generate-env.sh
	./generate-env.sh

up: init
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v
