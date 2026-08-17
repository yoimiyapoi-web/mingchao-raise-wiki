import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径产物,便于部署到任意静态托管
  base: './',
  build: {
    // 角色详情按需加载,单文件较大,放宽警告阈值
    chunkSizeWarningLimit: 1800,
  },
})
