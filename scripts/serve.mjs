/**
 * 本地静态服务器:预览 dist 产物
 * 用法: npm run preview
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
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

createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  let safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  if (safePath === '\\' || safePath === '/' || safePath === '') safePath = 'index.html'
  let filePath = path.join(root, safePath)
  try {
    // 指向目录时回退到 index.html
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
}).listen(port, () => {
  console.log(`预览地址: http://127.0.0.1:${port}/`)
})
