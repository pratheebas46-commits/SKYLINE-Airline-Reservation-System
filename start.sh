#!/usr/bin/env bash
# ==============================================================================
# Domestic Railway Reservation System - Master Startup Script
# Starts Database Initialization, Python Flask Backend, and React Frontend
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "======================================================================"
echo "    DOMESTIC RAILWAY RESERVATION SYSTEM (ACADEMIC MCA PROJECT)        "
echo "======================================================================"
echo "[1/4] Checking Python and Node.js environment..."
python3 --version
node -v
npm -v

echo ""
echo "[2/4] Initializing Database (MySQL / SQLite fallback)..."
python3 init_mysql_db.py || true
python3 backend/seed_data.py || true

echo ""
echo "[3/4] Starting Local Python Flask Backend on http://127.0.0.1:5000..."
# Kill any existing server on port 5000
fuser -k 5000/tcp 2>/dev/null || true

# Run Flask backend in background
python3 backend/app.py > backend/flask.log 2>&1 &
BACKEND_PID=$!
echo "      -> Backend started with PID $BACKEND_PID (logs: backend/flask.log)"

# Wait for backend to be healthy
for i in {1..10}; do
  if curl -s http://127.0.0.1:5000/health > /dev/null; then
    echo "      -> Backend is online and healthy!"
    break
  fi
  sleep 1
done

echo ""
echo "[4/4] Starting React Frontend on http://localhost:3000..."
echo "      Frontend proxies /api/* calls automatically to backend."
echo "======================================================================"

# Handle clean exit on Ctrl+C
trap "echo 'Stopping background servers...'; kill $BACKEND_PID 2>/dev/null || true; exit 0" INT TERM

npm run dev
