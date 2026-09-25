const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  root: __dirname,
  publicDir: false,
  build: {
    outDir: 'playtest_dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'versus-playtest.html')
      },
      output: {
        entryFileNames: 'assets/playtest-[name]-[hash].js',
        chunkFileNames: 'assets/playtest-[name]-[hash].js',
        assetFileNames: 'assets/playtest-[name]-[hash][extname]'
      }
    }
  }
});
