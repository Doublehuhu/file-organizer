#!/bin/bash
# 启动电脑文件整理助手

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Starting 电脑文件整理助手..."

# 启动后端
echo "Starting backend (http://localhost:8721)..."
cd "$PROJECT_DIR/backend"
python run.py &
BACKEND_PID=$!
sleep 2

# 启动前端
echo "Starting frontend (http://localhost:5173)..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend API:  http://localhost:8721"
echo "API Docs:     http://localhost:8721/docs"
echo "Frontend:     http://localhost:5173"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
