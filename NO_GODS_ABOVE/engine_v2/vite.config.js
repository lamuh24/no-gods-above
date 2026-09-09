const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  root: __dirname,
  // Replay fixtures used by the debug runtime must survive every clean production build.
  publicDir: 'public',
  server: { host: '127.0.0.1', port: 5176, fs: { allow: [path.resolve(__dirname, '..', '..')] } },
  preview: { host: '127.0.0.1', port: 4176 },
  build: {
    outDir: 'debug_dist',
    emptyOutDir: true,
    rollupOptions: {
      // Version the review bundle namespace so a rebuilt local playtest cannot reuse stale module
      // responses from an earlier animation-coverage pass in the in-app browser.
      output: {
        entryFileNames: 'assets/full-animation-v1-[name]-[hash].js',
        chunkFileNames: 'assets/full-animation-v1-[name]-[hash].js',
        assetFileNames: 'assets/full-animation-v1-[name]-[hash][extname]'
      },
      input: {
        debug: path.resolve(__dirname, 'index.html'),
        graybox: path.resolve(__dirname, 'graybox.html'),
        sandbox: path.resolve(__dirname, 'sandbox.html'),
        lamuhLegacySandbox: path.resolve(__dirname, 'lamuh-legacy-sandbox.html'),
        lamuhLegacyReview: path.resolve(__dirname, 'lamuh-v1-v2-review.html'),
        juggleLab: path.resolve(__dirname, 'juggle-lab.html'),
        tribunalPlaytest: path.resolve(__dirname, 'tribunal-playtest.html'),
        versusPlaytest: path.resolve(__dirname, 'versus-playtest.html')
      }
    }
  }
});
