#!/usr/bin/env node
/**
 * Build wrapper for Vercel
 * Bypasses npm's path handling issues with spaces in directory names
 * Directly invokes vite build using Node's require resolution
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the vite binary path
const viteBin = join(__dirname, 'node_modules', '.bin', 'vite');

console.log('Starting Vite build...');
console.log(`Vite binary: ${viteBin}`);

// Spawn vite build process
const vite = spawn('node', [viteBin, 'build'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

vite.on('close', (code) => {
  process.exit(code);
});

vite.on('error', (err) => {
  console.error('Failed to start build process:', err);
  process.exit(1);
});
