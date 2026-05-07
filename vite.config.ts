import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// SECURITY NOTE: Never use `define` to inject env vars that lack the VITE_
// prefix. The `define` pattern bypasses Vite's built-in secret safety —
// it injects the value directly into the production bundle regardless of
// naming, making it readable by anyone who inspects the built JS.
//
// If Gemini AI features are needed client-side:
//   1. Name the var  VITE_GEMINI_API_KEY  in .env.local
//   2. Read it via   import.meta.env.VITE_GEMINI_API_KEY
//   3. Accept that client-side API keys are visible to the browser.
//
// Preferred: call Gemini from a server function (Cloud Function / Edge)
// that reads the key from process.env and never exposes it to the bundle.

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify — file watching is disabled to prevent flickering.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
