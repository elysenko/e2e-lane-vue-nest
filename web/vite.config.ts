import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// `base` MUST match the k8s ingress sub-path — all assets are served under
// /e2e-lane-vue-nest/. The build command is `npx vite build` (see web/Dockerfile.frontend
// and colossus.stack.json) and passes NO --base flag, so it is baked in here directly.
// vue-router derives its base from import.meta.env.BASE_URL, which equals this value.
export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: { outDir: 'dist' },
  server: {
    // Dev only: emulate the ingress rewrite /e2e-lane-vue-nest/api/* -> backend /api/*.
    proxy: {
      '/e2e-lane-vue-nest/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/e2e-lane-vue-nest/, ''),
      },
    },
  },
});
