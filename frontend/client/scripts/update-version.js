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

const logoPath = path.join(publicDir, 'images/logoSEEMEE1.png')
const icon192Path = path.join(publicDir, 'images/icon-192.png')
const icon512Path = path.join(publicDir, 'images/icon-512.png')
const appleIconPath = path.join(publicDir, 'apple-touch-icon.png')
const applePrePath = path.join(publicDir, 'apple-touch-icon-precomposed.png')

if (fs.existsSync(logoPath)) {
  fs.copyFileSync(logoPath, icon192Path)
  fs.copyFileSync(logoPath, icon512Path)
  fs.copyFileSync(logoPath, appleIconPath)
  fs.copyFileSync(logoPath, applePrePath)
  console.log('🖼️ [LOGO-SYNC] Synced logoSEEMEE1.png to PWA icons (192, 512, apple-touch)')
}

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
