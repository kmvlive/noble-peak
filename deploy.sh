#!/usr/bin/env bash
set -euo pipefail

# ── Конфигурация ────────────────────────────────────────────
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:?Ошибка: укажите REMOTE_HOST}"
REMOTE_DIR="${REMOTE_DIR:-/opt/magazin-tour}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# ── Цветной вывод ───────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m   $*"; }
err()   { echo -e "\033[1;31m[ERROR]\033[0m $*"; }

# ── Проверка зависимостей ───────────────────────────────────
command -v docker >/dev/null 2>&1 || { err "Docker не установлен"; exit 1; }
command -v rsync  >/dev/null 2>&1 || { err "rsync не установлен"; exit 1; }

# ── Сборка production-образа ─────────────────────────────────
info "Сборка Docker-образа..."
docker build -t magazin-tour:latest -f Dockerfile .

# ── Создание директории на сервере ──────────────────────────
info "Подготовка сервера..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}"

# ── Копирование файлов на сервер ────────────────────────────
info "Копирование файлов на сервер..."
rsync -avz --delete \
  "${COMPOSE_FILE}" \
  "${ENV_FILE}" \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# ── Сохранение и передача образа ────────────────────────────
info "Экспорт и передача Docker-образа..."
docker save magazin-tour:latest | bzip2 | \
  ssh "${REMOTE_USER}@${REMOTE_HOST}" \
    "bunzip2 | docker load"

# ── Запуск на сервере ───────────────────────────────────────
info "Запуск контейнеров на сервере..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" \
  "cd ${REMOTE_DIR} && \
   docker compose -f ${COMPOSE_FILE} up -d --force-recreate"

# ── Проверка здоровья ───────────────────────────────────────
info "Ожидание health-check..."
sleep 10
HEALTH_URL="https://${REMOTE_HOST}/api/health"
if curl -sf "${HEALTH_URL}" >/dev/null 2>&1; then
  ok "Сервер запущен и отвечает: ${HEALTH_URL}"
else
  err "Health-check не прошёл. Проверьте контейнеры на сервере."
  ssh "${REMOTE_USER}@${REMOTE_HOST}" \
    "cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_FILE} logs --tail=50"
  exit 1
fi

ok "Деплой завершён успешно!"