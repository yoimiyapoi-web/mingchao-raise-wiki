/**
 * 开发模式:Rollup 监听源码变更并自动重建,同时启动本地服务器
 * 用法: npm run dev
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  let safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  if (safePath === '\\' || safePath === '/' || safePath === '') safePath = 'index.html'
  let filePath = path.join(dist, safePath)
  try {
    let target = filePath
    try {
      const info = await stat(filePath)
      if (info.isDirectory()) target = path.join(filePath, 'index.html')
    } catch {
      target = filePath
    }
    const data = await readFile(target)
    const ext = path.extname(target).toLowerCase()
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    res.end(data)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not Found')
  }
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用,请先关闭占用进程或设置 PORT 环境变量换端口。`)
  } else {
    console.error('服务器启动失败:', err.message)
  }
  child?.kill('SIGTERM')
  process.exit(1)
})

server.listen(port, () => {
  console.log(`开发地址: http://127.0.0.1:${port}/`)
})

const rollupBin = path.join(root, 'node_modules', 'rollup', 'dist', 'bin', 'rollup')
let child = spawn(process.execPath, [rollupBin, '-c', '--watch'], {
  cwd: root,
  stdio: 'inherit',
})

function shutdown() {
  child.kill('SIGTERM')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
