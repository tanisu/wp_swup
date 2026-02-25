import { defineConfig } from 'vite';
import { resolve, dirname, relative, sep, basename } from 'path';
import { mkdirSync, writeFileSync, readdirSync, statSync } from 'fs';
import * as sass from 'sass';

function collectScssEntries(rootDir) {
  const entries = {};

  function walk(currentDir) {
    const items = readdirSync(currentDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = resolve(currentDir, item.name);
      if (item.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!item.isFile() || !item.name.endsWith('.scss')) {
        continue;
      }

      // _partial.scss はビルドエントリから除外
      if (item.name.startsWith('_')) {
        continue;
      }

      const relPath = relative(rootDir, fullPath);
      const name = relPath
        .replace(new RegExp(`\\${sep}`, 'g'), '/')
        .replace(/\.scss$/, '');
      entries[name] = fullPath;
    }
  }

  if (statSync(rootDir).isDirectory()) {
    walk(rootDir);
  }

  return entries;
}

function emitCssSourceMapForWatchBuild(mode, scssEntries) {
  return {
    name: 'emit-css-sourcemap-for-watch-build',
    apply: 'build',
    closeBundle() {
      for (const [name, inputPath] of Object.entries(scssEntries)) {
        const cssPath = resolve(__dirname, `assets/dist/css/${name}.css`);
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
    }
  };
}

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  const scssRoot = resolve(__dirname, 'assets/src/scss');
  const scssEntries = collectScssEntries(scssRoot);

  return {
    plugins: [emitCssSourceMapForWatchBuild(mode, scssEntries)],
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
          ...scssEntries
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
