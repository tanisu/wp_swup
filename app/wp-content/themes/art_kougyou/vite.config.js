import { defineConfig } from 'vite';
import { resolve, dirname, basename } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import * as sass from 'sass';

function emitCssSourceMapForWatchBuild(inputPath) {
  return {
    name: 'emit-css-sourcemap-for-watch-build',
    apply: 'build',
    closeBundle() {
      const cssPath = resolve(__dirname, 'assets/dist/css/style.css');
      const mapPath = cssPath + '.map';
      const result = sass.compile(inputPath, {
        style: 'expanded',
        sourceMap: true,
        sourceMapIncludeSources: true
      });

      mkdirSync(dirname(cssPath), { recursive: true });
      writeFileSync(
        cssPath,
        result.css + `\n/*# sourceMappingURL=${basename(mapPath)} */\n`,
        'utf8'
      );
      if (result.sourceMap) {
        writeFileSync(mapPath, JSON.stringify(result.sourceMap), 'utf8');
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  const styleScssEntry = resolve(__dirname, 'assets/src/scss/style.scss');

  return {
    plugins: [emitCssSourceMapForWatchBuild(styleScssEntry)],
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          sourceMap: true
        }
      }
    },
    build: {
      outDir: 'assets/dist',
      emptyOutDir: mode !== 'development',
      // SCSS までたどれるよう、buildでも map を出力する
      sourcemap: true,
      // 開発モード時は CSS 圧縮を止めて、エディタ上の参照を安定させる
      cssMinify: isDevelopment ? false : undefined,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'assets/src/js/main.js'),
          style: styleScssEntry
        },
        output: {
          entryFileNames: 'js/[name].js',
          chunkFileNames: 'js/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'css/[name][extname]';
            }
            return 'assets/[name][extname]';
          }
        }
      }
    }
  };
});
