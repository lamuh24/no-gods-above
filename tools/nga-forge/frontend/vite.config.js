import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three", "three/examples/jsm/loaders/GLTFLoader.js", "three/examples/jsm/controls/OrbitControls.js"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
