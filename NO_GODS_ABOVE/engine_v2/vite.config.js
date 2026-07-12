const { defineConfig } = require('vite');

module.exports = defineConfig({
  root: __dirname,
  publicDir: 'public',
  server: { host: '127.0.0.1', port: 5176 },
  preview: { host: '127.0.0.1', port: 4176 },
  build: { outDir: 'debug_dist', emptyOutDir: true }
});
