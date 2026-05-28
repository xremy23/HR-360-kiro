#!/bin/bash
set -e

echo "Building web console..."
cd web
npm install
npx vite build
cd ..

echo "Build complete!"

