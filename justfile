set shell := ["bash", "-lc"]

default:
  @just --list

dev:
  @if systemctl is-active --quiet ngrok 2>/dev/null; then \
    echo "=================================================="; \
    echo "  WARNING: System-level ngrok service is active."; \
    echo "  Please run this in your shell to prevent port conflicts:"; \
    echo "  sudo systemctl stop ngrok"; \
    echo "=================================================="; \
  fi
  @if ! systemctl --user list-unit-files | grep -q "^ngrok.service"; then \
    echo "Registering user systemd service for ngrok..."; \
    systemctl --user daemon-reload; \
    systemctl --user enable ngrok; \
  fi
  @echo "Restarting ngrok service to refresh tunnels..."
  @systemctl --user restart ngrok
  @echo "Checking for old Kratos server instance on port 3003..."
  @PID=$(lsof -t -i:3003 || true); \
  if [ -n "$PID" ]; then \
    echo "Found old instance (PID: $PID). Terminating..."; \
    kill -9 $PID || true; \
    sleep 1; \
  fi
  @echo "Launching Kratos database..."
  docker compose up -d db
  @echo "Waiting for ngrok tunnel details..."
  @for i in {1..6}; do \
    URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*' | head -n 1); \
    if [ -n "$URL" ]; then \
      echo "=================================================="; \
      echo "  ACCESS FROM OTHER MACHINES VIA NGROK:"; \
      echo "  $URL"; \
      echo "=================================================="; \
      break; \
    fi; \
    sleep 1; \
  done
  @echo "Starting Kratos dev server..."
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
