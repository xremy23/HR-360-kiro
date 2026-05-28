#!/usr/bin/env node
/**
 * Build wrapper for Vercel - Mobile App
 * Exports Expo web app for deployment
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Expo web build...');

// Spawn expo export process
const expo = spawn('npx', ['expo', 'export', '--platform', 'web'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

expo.on('close', (code) => {
  process.exit(code);
});

expo.on('error', (err) => {
  console.error('Failed to start build process:', err);
  process.exit(1);
});
