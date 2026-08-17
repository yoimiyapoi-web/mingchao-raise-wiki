import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { babel } from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import replace from '@rollup/plugin-replace'
import { readFileSync } from 'node:fs'

// 收集所有 .css 并输出为单个样式文件
function cssBundle() {
  let css = ''
  return {
    name: 'css-bundle',
    transform(code, id) {
      if (id.endsWith('.css')) {
        css += `${code}\n`
        return { code: 'export default {}', map: null }
      }
      return null
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'assets/app.css', source: css })
    },
  }
}

// 生成 index.html,自动引用带哈希的产物
function htmlTemplate() {
  return {
    name: 'html-template',
    generateBundle(_options, bundle) {
      const js = Object.keys(bundle).find(
        (file) => file.startsWith('assets/') && file.endsWith('.js'),
      )
      const css = Object.keys(bundle).find(
        (file) => file.startsWith('assets/') && file.endsWith('.css'),
      )
      const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="鸣潮角色养成 Wiki:角色图鉴、养成材料、养成计算器,数据同步自库街区官方 Wiki。" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <title>鸣潮养成 Wiki</title>
    ${css ? `<link rel="stylesheet" href="./${css}" />` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${js}"></script>
  </body>
</html>
`
      this.emitFile({ type: 'asset', fileName: 'index.html', source: html })
    },
  }
}

// 复制站点图标
function copyFavicon() {
  return {
    name: 'copy-favicon',
    generateBundle() {
      const source = readFileSync(new URL('./public/favicon.svg', import.meta.url), 'utf8')
      this.emitFile({ type: 'asset', fileName: 'favicon.svg', source })
    },
  }
}

export default {
  input: 'src/main.jsx',
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: 'assets/app-[hash].js',
    chunkFileNames: 'assets/[name]-[hash].js',
    assetFileNames: 'assets/[name]-[hash][extname]',
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    nodeResolve({ browser: true, extensions: ['.js', '.jsx', '.json'] }),
    commonjs(),
    json(),
    babel({
      babelHelpers: 'bundled',
      presets: [['@babel/preset-react', { runtime: 'automatic' }]],
      extensions: ['.jsx', '.js'],
    }),
    cssBundle(),
    htmlTemplate(),
    copyFavicon(),
    terser(),
  ],
}
