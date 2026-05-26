/**
 * Post-build script: converte a saída do Vite (dist/) para o
 * formato Vercel Build Output API (.vercel/output/).
 *
 * Estrutura gerada:
 *   .vercel/output/static/              ← assets do cliente (JS, CSS, SVG…)
 *   .vercel/output/functions/ssr.func/  ← função SSR Node.js 20
 *   .vercel/output/config.json          ← regras de roteamento
 */

import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// ── 1. Limpeza ────────────────────────────────────────────────────────────────
const outDir = resolve(root, '.vercel/output')
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })

// ── 2. Estáticos (dist/client → .vercel/output/static) ───────────────────────
mkdirSync(resolve(root, '.vercel/output/static'), { recursive: true })
cpSync(resolve(root, 'dist/client'), resolve(root, '.vercel/output/static'), { recursive: true })
console.log('✓ Assets estáticos copiados')

// ── 3. Função SSR ─────────────────────────────────────────────────────────────
const funcDir = resolve(root, '.vercel/output/functions/ssr.func')
mkdirSync(funcDir, { recursive: true })

// Copia o servidor Node.js inteiro para dentro do pacote da função
cpSync(resolve(root, 'dist/server'), resolve(funcDir, 'dist/server'), { recursive: true })
console.log('✓ Servidor copiado para o pacote da função')

// Handler da função — TanStack Start exporta um handler Fetch API como default export
// A função é: (request: Request) => Promise<Response>
const handlerCode = `
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let _handler = null
async function getHandler() {
  if (!_handler) {
    const mod = await import(join(__dirname, 'dist/server/server.js'))
    // TanStack Start exporta a função handler como default
    // Pode ser: mod.default, mod.default.fetch, ou mod.fetch
    const exp = mod.default ?? mod
    if (typeof exp?.fetch === 'function') {
      // Objeto com método fetch (ex: Hono, H3 wrapped)
      _handler = (req) => exp.fetch(req)
    } else if (typeof exp === 'function') {
      // Função direta (request: Request) => Response — padrão TanStack Start
      _handler = exp
    } else {
      throw new Error('Formato de handler SSR não reconhecido: ' + typeof exp)
    }
  }
  return _handler
}

export default async function handler(req, res) {
  try {
    const fetchHandler = await getHandler()

    // Converte Node.js IncomingMessage → Fetch Request
    const proto = req.headers['x-forwarded-proto'] || 'https'
    const host  = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
    const url   = new URL(req.url ?? '/', \`\${proto}://\${host}\`)

    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers ?? {})) {
      if (Array.isArray(v)) v.forEach(x => headers.append(k, x))
      else if (v != null) headers.set(k, String(v))
    }

    let body
    if (req.method && !['GET', 'HEAD'].includes(req.method.toUpperCase())) {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      if (chunks.length) body = Buffer.concat(chunks)
    }

    const fetchRequest = new Request(url.toString(), {
      method: req.method ?? 'GET',
      headers,
      body: body ?? null,
      duplex: body ? 'half' : undefined,
    })

    // Chama o handler Fetch API do TanStack Start
    const response = await fetchHandler(fetchRequest)

    res.statusCode = response.status
    response.headers.forEach((v, k) => res.setHeader(k, v))
    const buf = Buffer.from(await response.arrayBuffer())
    res.end(buf)
  } catch (e) {
    console.error('[SSR Error]', e)
    res.statusCode = 500
    res.end('Internal Server Error: ' + e.message)
  }
}
`.trimStart()

writeFileSync(resolve(funcDir, 'index.js'), handlerCode)
console.log('✓ Handler da função criado')

// Configuração da função (runtime Node.js 20, ESM)
writeFileSync(resolve(funcDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  launcherType: 'Nodejs',
}, null, 2))

// package.json para marcar como ESM dentro do pacote
writeFileSync(resolve(funcDir, 'package.json'), JSON.stringify({ type: 'module' }, null, 2))
console.log('✓ Configuração da função criada')

// ── 4. Rotas ──────────────────────────────────────────────────────────────────
const config = {
  version: 3,
  routes: [
    // Cache longo para assets com hash
    {
      src: '/assets/(.*)',
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      continue: true,
    },
    // Serve arquivos estáticos que existam
    { handle: 'filesystem' },
    // Tudo o mais → SSR
    { src: '/(.*)', dest: '/ssr' },
  ],
}
writeFileSync(resolve(root, '.vercel/output/config.json'), JSON.stringify(config, null, 2))
console.log('✓ Config de roteamento criado')

console.log('\n✅ Vercel output pronto em .vercel/output/')
