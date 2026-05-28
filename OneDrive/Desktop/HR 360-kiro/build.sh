#!/bin/bash
set -e

echo "Building web console..."
cd web
npm install
npm run build
cd ..

echo "Build complete!"
