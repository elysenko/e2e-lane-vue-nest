import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// build.outDir dist is the ui_build publish contract (publish_vue_vite_build copies
// dist/ verbatim); --base is passed on the CLI by the pipeline — do not hardcode base here.
export default defineConfig({
  plugins: [vue()],
  build: { outDir: 'dist' },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
});
