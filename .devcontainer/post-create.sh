#!/usr/bin/env bash
set -euo pipefail

echo "Setting up No Gods Above cloud workspace..."

if [ -f tools/sprite-agent/package-lock.json ]; then
  npm --prefix tools/sprite-agent ci
elif [ -f tools/sprite-agent/package.json ]; then
  npm --prefix tools/sprite-agent install
fi

if [ -f tools/nga-forge/frontend/package-lock.json ]; then
  npm --prefix tools/nga-forge/frontend ci
elif [ -f tools/nga-forge/frontend/package.json ]; then
  npm --prefix tools/nga-forge/frontend install
fi

if [ -f tools/nga-forge/backend/requirements.txt ]; then
  python -m pip install --user -r tools/nga-forge/backend/requirements.txt
fi

echo "Ready. Run: npm run dev:game"
