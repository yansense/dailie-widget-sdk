import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    // 1. 库模式打包
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "WidgetEntry", // 全局变量名 (如果是 UMD/IIFE)
      fileName: (format) => `widget.${format}.js`,
      formats: ["es"], // 推荐输出 ES Module
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    minify: true,
  },
  define: {
    // 防止某些库报错
    "process.env": {},
  },
});
