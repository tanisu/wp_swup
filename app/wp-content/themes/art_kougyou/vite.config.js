import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  return {
    build: {
      outDir: 'assets/dist',
      emptyOutDir: true,
      sourcemap: mode === 'development',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'assets/src/js/main.js')
        },
        output: {
          entryFileNames: 'js/[name].js',
          chunkFileNames: 'js/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'css/style[extname]';
            }
            return 'assets/[name][extname]';
          }
        }
      }
    }
  };
});
