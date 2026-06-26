#!/usr/bin/env bash
set -euo pipefail

# Setup MinIO for local PropVest development.
# Starts MinIO (if not running), creates bucket, configures CORS.
#
# Usage:  bash scripts/setup-minio.sh
#
# Install dependencies:  brew install minio minio-mc

MINIO_PORT="${MINIO_PORT:-9000}"
MINIO_CONSOLE_PORT="${MINIO_CONSOLE_PORT:-9001}"
MINIO_DATA="${MINIO_DATA:-/tmp/minio-data}"
MINIO_USER="${MINIO_USER:-minioadmin}"
MINIO_PASS="${MINIO_PASS:-minioadmin}"
MINIO_BUCKET="${MINIO_BUCKET:-propvest-media}"
CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:3000}"

echo "==> Checking MinIO server on port $MINIO_PORT..."
if lsof -ti :"$MINIO_PORT" >/dev/null 2>&1; then
  echo "    MinIO already running (PID $(lsof -ti :$MINIO_PORT))"
else
  echo "==> Starting MinIO server..."
  mkdir -p "$MINIO_DATA"
  export MINIO_ROOT_USER="$MINIO_USER" MINIO_ROOT_PASSWORD="$MINIO_PASS"
  nohup minio server "$MINIO_DATA" \
    --address ":$MINIO_PORT" \
    --console-address ":$MINIO_CONSOLE_PORT" \
    > /tmp/minio.log 2>&1 &
  MINIO_PID=$!
  echo "    Started as PID $MINIO_PID"

  # Wait for MinIO to become healthy
  for i in $(seq 1 10); do
    if curl -s "http://localhost:$MINIO_PORT/minio/health/live" >/dev/null 2>&1; then
      echo "    MinIO healthy"
      break
    fi
    if [ "$i" -eq 10 ]; then
      echo "    ERROR: MinIO failed to start. Check /tmp/minio.log"
      exit 1
    fi
    sleep 1
  done
fi

echo "==> Configuring MinIO client (mc)..."
mc alias set local "http://localhost:$MINIO_PORT" "$MINIO_USER" "$MINIO_PASS" >/dev/null 2>&1

echo "==> Creating bucket '$MINIO_BUCKET'..."
mc mb "local/$MINIO_BUCKET" >/dev/null 2>&1 || echo "    Bucket already exists"

echo "==> Setting CORS origin '$CORS_ORIGIN'..."
CORS_EXISTING=$(mc admin config get local/ api 2>/dev/null | grep cors_allow_origin || true)
if echo "$CORS_EXISTING" | grep -q "$CORS_ORIGIN"; then
  echo "    CORS already configured"
else
  mc admin config set local/ api cors_allow_origin="$CORS_ORIGIN" >/dev/null 2>&1
  echo "    CORS applied — restarting MinIO..."
  # Kill and restart so CORS takes effect
  OLD_PID=$(lsof -ti :"$MINIO_PORT")
  kill "$OLD_PID" 2>/dev/null
  sleep 1
  export MINIO_ROOT_USER="$MINIO_USER" MINIO_ROOT_PASSWORD="$MINIO_PASS"
  nohup minio server "$MINIO_DATA" \
    --address ":$MINIO_PORT" \
    --console-address ":$MINIO_CONSOLE_PORT" \
    > /tmp/minio.log 2>&1 &
  for i in $(seq 1 10); do
    if curl -s "http://localhost:$MINIO_PORT/minio/health/live" >/dev/null 2>&1; then
      echo "    MinIO restarted"
      break
    fi
    if [ "$i" -eq 10 ]; then
      echo "    WARNING: MinIO restart may have failed. Check /tmp/minio.log"
    fi
    sleep 1
  done
fi

# Verify CORS
echo "==> Verifying CORS..."
HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "http://localhost:$MINIO_PORT/$MINIO_BUCKET/" \
  -H "Origin: $CORS_ORIGIN" \
  -H 'Access-Control-Request-Method: PUT' \
  -H 'Access-Control-Request-Headers: content-type' 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "204" ]; then
  echo "    CORS preflight OK (204)"
else
  echo "    WARNING: CORS preflight returned $HTTP_STATUS"
fi

echo ""
echo "MinIO ready: http://localhost:$MINIO_PORT"
echo "Console:     http://localhost:$MINIO_CONSOLE_PORT"
echo "Bucket:      $MINIO_BUCKET"
echo "User:        $MINIO_USER / $MINIO_PASS"
