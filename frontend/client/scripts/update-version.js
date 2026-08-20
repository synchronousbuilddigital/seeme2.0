import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publicDir = path.join(__dirname, '../public')
const versionPath = path.join(publicDir, 'version.json')
const swPath = path.join(publicDir, 'sw.js')

const buildTime = Date.now()
const version = `v1.0.${buildTime}`

// 1. Write version.json
const versionData = {
  version,
  buildTime,
  updatedAt: new Date().toISOString()
}

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2))
console.log(`✅ [AUTO-CACHE-BUMP] Updated public/version.json -> ${version}`)

// 2. Bump CACHE_NAME in sw.js
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8')
  swContent = swContent.replace(/const CACHE_NAME = 'seemee-client-pwa-[^']+'/, `const CACHE_NAME = 'seemee-client-pwa-${version}'`)
  fs.writeFileSync(swPath, swContent)
  console.log(`✅ [AUTO-CACHE-BUMP] Updated public/sw.js CACHE_NAME -> seemee-client-pwa-${version}`)
}
