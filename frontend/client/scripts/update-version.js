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

const iconsDir = path.join(publicDir, 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

const logoPath = path.join(publicDir, 'images/logoSEEMEE1.png')
const icon192Path = path.join(publicDir, 'images/icon-192.png')
const icon512Path = path.join(publicDir, 'images/icon-512.png')
const icon192IconsPath = path.join(publicDir, 'icons/icon-192.png')
const icon512IconsPath = path.join(publicDir, 'icons/icon-512.png')
const appleIconPath = path.join(publicDir, 'apple-touch-icon.png')
const applePrePath = path.join(publicDir, 'apple-touch-icon-precomposed.png')

if (fs.existsSync(logoPath)) {
  fs.copyFileSync(logoPath, appleIconPath)
  fs.copyFileSync(logoPath, applePrePath)
  console.log('🖼️ [LOGO-SYNC] Synced apple-touch icons from logoSEEMEE1.png')
}

// 1. Write version.json
const versionData = {
  version,
  buildTime,
  updatedAt: new Date().toISOString()
}

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2))
console.log(`✅ [AUTO-CACHE-BUMP] Updated public/version.json -> ${version}`)
