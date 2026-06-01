/**
 * Build wrapper for Vercel
 * Bypasses npm's path handling issues with spaces in directory names
 */

import { execSync } from 'child_process';

console.log('Starting Vite build...');

try {
  // Use vite directly
  execSync('vite build', {
    stdio: 'inherit',
    shell: true,
  });
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
