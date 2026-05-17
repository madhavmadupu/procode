import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
    },
    resolve: {
      alias: {
        "@main": path.resolve(__dirname, "src/main"),
      },
    },
  },
  preload: {
    build: {
      outDir: "dist/preload",
      lib: {
        entry: "src/main/preload/index.ts",
      },
    },
  },
  renderer: {
    root: "src/renderer",
    build: {
      outDir: "../../dist/renderer",
    },
    resolve: {
      alias: {
        "@renderer": path.resolve(__dirname, "src/renderer"),
      },
    },
    plugins: [react()],
    css: {
      postcss: "./postcss.config.js",
    },
  },
});
