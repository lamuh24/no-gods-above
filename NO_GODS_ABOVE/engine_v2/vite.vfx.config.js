const path = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  root: __dirname,
  publicDir: false,
  server: {
    host: "127.0.0.1",
    port: 4195,
    strictPort: true,
    fs: { allow: [path.resolve(__dirname, "..", "..") ] }
  },
  preview: { host: "127.0.0.1", port: 4196 },
  build: {
    outDir: "vfx_dist",
    emptyOutDir: true,
    rollupOptions: {
      input: { vfxLab: path.resolve(__dirname, "vfx-lab.html") }
    }
  }
});
