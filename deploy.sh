#!/usr/bin/env bash
set -euo pipefail

# ── Конфигурация ────────────────────────────────────────────
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:?Ошибка: укажите REMOTE_HOST}"
REMOTE_DIR="${REMOTE_DIR:-/opt/magazin-tour}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
REMOTE_PORT="${REMOTE_PORT:-22}"
# SSH-пароль берётся ТОЛЬКО из защищённой переменной окружения (CI secret),
# никогда не зашивается в код репозитория.
SSH_PASSWORD="${SSH_PASSWORD:-}"

# ── Цветной вывод ───────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m   $*"; }
err()   { echo -e "\033[1;31m[ERROR]\033[0m $*"; }

# ── Проверка зависимостей ───────────────────────────────────
command -v docker >/dev/null 2>&1 || { err "Docker не установлен"; exit 1; }
command -v rsync  >/dev/null 2>&1 || { err "rsync не установлен"; exit 1; }

# ── SSH-конфигурация ────────────────────────────────────────
# Если задан SSH_PASSWORD (из защищённого secret/env) — используем sshpass.
# Иначе полагаемся на ключевой доступ (ssh-agent), что тоже является защищённым
# механизмом хранения доступа.
SSH_CMD=(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15)
RSYNC_RSH="ssh -o StrictHostKeyChecking=no"
if [ -n "${SSH_PASSWORD}" ]; then
  command -v sshpass >/dev/null 2>&1 || { err "sshpass не установлен (нужен для SSH по паролю)"; exit 1; }
  export SSHPASS="${SSH_PASSWORD}"
  SSH_CMD=(sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15)
  RSYNC_RSH="sshpass -e ssh -o StrictHostKeyChecking=no"
fi
ssh_run() { "${SSH_CMD[@]}" -p "${REMOTE_PORT}" -l "${REMOTE_USER}" "${REMOTE_HOST}" "$@"; }

# ── Сборка production-образа ─────────────────────────────────
info "Сборка Docker-образа..."
docker build -t magazin-tour:latest -f Dockerfile .

# ── Создание директории на сервере ──────────────────────────
info "Подготовка сервера..."
ssh_run "mkdir -p ${REMOTE_DIR}"

# ── Копирование файлов на сервер ────────────────────────────
info "Копирование файлов на сервер..."
rsync -avz --delete --rsh="${RSYNC_RSH}" \
  "${COMPOSE_FILE}" \
  "${ENV_FILE}" \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# ── Сохранение и передача образа ────────────────────────────
info "Экспорт и передача Docker-образа..."
docker save magazin-tour:latest | bzip2 | \
  ssh_run \
    "bunzip2 | docker load"

# ── Запуск на сервере ───────────────────────────────────────
info "Запуск контейнеров на сервере..."
ssh_run \
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
  ssh_run \
    "cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_FILE} logs --tail=50"
  exit 1
fi

# ── Проверка и исправление схемы DynamoDB ───────────────────
info "Проверка и исправление схемы DynamoDB..."
ssh_run \
  "cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_FILE} exec -T app npm run db:verify"

ok "Деплой завершён успешно!"