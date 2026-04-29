#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Installing 电脑文件整理助手..."

echo "Installing Python dependencies..."
cd "$PROJECT_DIR/backend"
pip install -r requirements.txt

echo "Installing Node.js dependencies..."
cd "$PROJECT_DIR/frontend"
npm install

echo "Creating required directories..."
mkdir -p "$PROJECT_DIR/backend/trash"
mkdir -p "$PROJECT_DIR/backend/cache/thumbnails"

echo "Done! Run scripts/start.sh to launch."
