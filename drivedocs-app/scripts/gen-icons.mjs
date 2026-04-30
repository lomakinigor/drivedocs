import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dir, '../public')
const svgPath = join(publicDir, 'app-icon-source.svg')
const svgBuffer = readFileSync(svgPath)

const targets = [
  { file: 'pwa-64x64.png',              size: 64  },
  { file: 'pwa-192x192.png',            size: 192 },
  { file: 'pwa-512x512.png',            size: 512 },
  { file: 'apple-touch-icon-180x180.png', size: 180 },
  { file: 'maskable-icon-512x512.png',  size: 512 },
]

for (const { file, size } of targets) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, file))
  console.log(`✓ ${file}`)
}

// favicon.svg — just copy the source
import { copyFileSync } from 'fs'
copyFileSync(svgPath, join(publicDir, 'favicon.svg'))
console.log('✓ favicon.svg')

// favicon.ico — 32x32 PNG wrapped (browsers accept PNG-in-ICO)
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon.ico'))
console.log('✓ favicon.ico')

console.log('\nВсе иконки сгенерированы.')
