set shell := ["bash", "-lc"]

default:
  @just --list

dev:
  docker compose up -d db
  bun run dev

db-up:
  docker compose up -d db

db-down:
  docker compose down

db-logs:
  docker compose logs -f db

start:
  just dev

build:
  docker compose up -d db
  bun run build
