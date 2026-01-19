#!/usr/bin/env bash
set -euo pipefail

log() { printf "\n==> %s\n" "$*"; }
warn() { printf "\n[WARN] %s\n" "$*"; }

ROOT_DIR="/workspace"
cd "$ROOT_DIR"

log "Post-start: preparing env files"
cp -n packages/backend/.env.example packages/backend/.env || true
cp -n packages/frontend/.env.example packages/frontend/.env.local || true

append_if_missing() {
  local file="$1" key="$2" value="$3"
  if ! grep -qE "^${key}=" "$file"; then
    printf "%s\n" "${key}=${value}" >>"$file"
  fi
}

# Generate simple secrets if missing
rand_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64
  fi
}

append_if_missing packages/backend/.env DATABASE_URL "postgresql://postgres:postgres@postgres:5432/compliant_dev"
append_if_missing packages/backend/.env PORT "3001"
append_if_missing packages/backend/.env JWT_SECRET "$(rand_secret)"
append_if_missing packages/backend/.env JWT_REFRESH_SECRET "$(rand_secret)"
append_if_missing packages/frontend/.env.local NEXT_PUBLIC_API_URL "http://localhost:3001/api"

log "Post-start: pushing Prisma schema"
pnpm db:push || warn "Prisma push failed; verify Postgres is healthy"

log "Post-start: seeding demo data"
pnpm -C packages/backend db:seed || warn "Seed failed or already applied"

log "Post-start: done"
