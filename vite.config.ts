import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' để build ra chạy được khi nhúng vào webview (file:// hoặc thư mục con)
export default defineConfig({
  base: './',
  plugins: [react()],
});
