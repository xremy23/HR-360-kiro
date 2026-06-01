#!/usr/bin/env node
/**
 * Build wrapper for Vercel
 * Bypasses npm's path handling issues with spaces in directory names
 */

import { build } from 'vite';

console.log('Starting Vite build...');

try {
  await build();
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
