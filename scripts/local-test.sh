#!/usr/bin/env bash
set -euo pipefail

log() { printf "\n==> %s\n" "$*"; }
warn() { printf "\n[WARN] %s\n" "$*"; }

# Detect project root
ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

log "Compliant Platform: local test runner"

# Ensure Node.js >= 20 and pnpm are available
have_cmd() { command -v "$1" >/dev/null 2>&1; }

install_node_pnpm() {
  if have_cmd node && have_cmd npm; then
    log "Node.js found: $(node -v)"
  else
    warn "Node.js not found. Attempting installation."
    if have_cmd apt; then
      log "Installing Node.js via apt (requires sudo)."
      sudo apt update
      sudo apt install -y curl ca-certificates
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt install -y nodejs
    elif have_cmd dnf; then
      log "Installing Node.js via dnf (requires sudo)."
      sudo dnf install -y nodejs npm
    elif have_cmd yum; then
      log "Installing Node.js via yum (requires sudo)."
      sudo yum install -y nodejs npm
    elif have_cmd apk; then
      log "Installing Node.js via apk (may require sudo)."
      (sudo apk add --no-cache nodejs npm || apk add --no-cache nodejs npm)
    else
      warn "No supported package manager found. Falling back to nvm."
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
      # shellcheck disable=SC1090
      . "$HOME/.nvm/nvm.sh"
      nvm install 20
    fi
  fi

  if have_cmd pnpm; then
    log "pnpm found: $(pnpm -v)"
  else
    log "Installing pnpm@8 globally via npm."
    npm install -g pnpm@8
  fi
}

install_node_pnpm

# Prepare environment files
log "Preparing environment files (.env)"
cp -n packages/backend/.env.example packages/backend/.env || true
cp -n packages/frontend/.env.example packages/frontend/.env.local || true

# Ensure mandatory backend envs exist
append_if_missing() {
  local file="$1" key="$2" value="$3"
  if ! grep -qE "^${key}=" "$file"; then
    printf "%s\n" "${key}=${value}" >>"$file"
    log "Set ${key} in $(realpath --relative-to="$ROOT_DIR" "$file")"
  fi
}

gen_secret() {
  if have_cmd openssl; then
    openssl rand -hex 32
  else
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64
  fi
}

append_if_missing packages/backend/.env DATABASE_URL "postgresql://postgres:postgres@localhost:5432/compliant_dev"
append_if_missing packages/backend/.env JWT_SECRET "$(gen_secret)"
append_if_missing packages/backend/.env JWT_REFRESH_SECRET "$(gen_secret)"
append_if_missing packages/backend/.env PORT "3001"

append_if_missing packages/frontend/.env.local NEXT_PUBLIC_API_URL "http://localhost:3001/api"

# Start PostgreSQL via Docker if available
if have_cmd docker; then
  log "Ensuring PostgreSQL container is running"
  if ! docker ps --format '{{.Names}}' | grep -q '^compliant-postgres$'; then
    (docker run --name compliant-postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=compliant_dev \
      -p 5432:5432 -d postgres:15 || docker start compliant-postgres)
  fi
  # wait for readiness
  log "Waiting for PostgreSQL to become ready"
  for i in {1..30}; do
    if docker exec compliant-postgres pg_isready -U postgres >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
else
  warn "Docker not found. Ensure PostgreSQL is running locally on 5432."
fi

# Install workspace dependencies
log "Installing monorepo dependencies (pnpm install)"
pnpm install

# Build shared package (if needed by backend/frontend)
log "Building shared package"
pnpm -C packages/shared build || true

# Prisma setup: generate client, push schema, seed
log "Setting up database schema (Prisma)"
pnpm db:push
log "Seeding database with demo data"
pnpm -C packages/backend db:seed || warn "Seed failed or already applied; continuing"

# Install Playwright browsers
log "Installing Playwright browsers"
pnpm exec playwright install

# Optional: quick health check after starting servers via webServer
log "Running Playwright E2E tests"
pnpm exec playwright test

log "Running unit tests (turbo run test)"
pnpm test || warn "Unit tests reported failures"

log "All test tasks completed. Reports (if any) are in ./playwright-report and ./coverage."
