set shell := ["bash", "-lc"]

default:
  @just --list

dev:
  @if systemctl is-active --quiet ngrok 2>/dev/null; then \
    echo "Stopping conflicting system-level ngrok service (may require sudo password)..."; \
    sudo systemctl stop ngrok || true; \
    sudo systemctl disable ngrok || true; \
  fi
  @if ! systemctl --user list-unit-files | grep -q "^ngrok.service"; then \
    echo "Registering user systemd service for ngrok..."; \
    systemctl --user daemon-reload; \
    systemctl --user enable ngrok; \
  fi
  @PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()'); \
  echo "Assigned dynamic port: $PORT"; \
  sed -i "s/addr: .*/addr: $PORT/" /home/mudoker/.config/ngrok/ngrok.yml; \
  echo "Restarting ngrok service to bind to port $PORT..."; \
  systemctl --user restart ngrok; \
  echo "Checking for old Kratos server instance on port $PORT..."; \
  PID=$(lsof -t -i:$PORT || true); \
  if [ -n "$PID" ]; then \
    echo "Found old instance (PID: $PID). Terminating..."; \
    kill -9 $PID || true; \
    sleep 1; \
  fi; \
  echo "Launching Kratos database..."; \
  docker compose up -d db; \
  echo "Waiting for ngrok tunnel details..."; \
  for i in {1..6}; do \
    URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*' | head -n 1); \
    if [ -n "$URL" ]; then \
      echo "=================================================="; \
      echo "  ACCESS FROM OTHER MACHINES VIA NGROK:"; \
      echo "  $URL"; \
      echo "=================================================="; \
      break; \
    fi; \
    sleep 1; \
  done; \
  echo "Starting Kratos dev server on port $PORT..."; \
  PORT=$PORT bun run dev

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
