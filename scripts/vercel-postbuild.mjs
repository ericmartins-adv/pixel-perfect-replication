/**
 * Post-build script: converte dist/client/ para .vercel/output/ como SPA.
 * Não há função SSR — o app é client-side only (todos os dados exigem auth).
 */
import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// 1. Limpeza
const outDir = resolve(root, '.vercel/output')
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })

// 2. Copia assets do cliente
mkdirSync(resolve(root, '.vercel/output/static'), { recursive: true })
cpSync(resolve(root, 'dist/client'), resolve(root, '.vercel/output/static'), { recursive: true })
console.log('✓ Assets estáticos copiados')

// 3. Roteamento SPA: todos os caminhos → index.html
const config = {
  version: 3,
  routes: [
    {
      src: '/assets/(.*)',
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      continue: true,
    },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
}
writeFileSync(resolve(root, '.vercel/output/config.json'), JSON.stringify(config, null, 2))
console.log('✓ Config SPA criado')
console.log('\n✅ Vercel output pronto em .vercel/output/')
