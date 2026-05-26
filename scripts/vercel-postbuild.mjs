/**
 * Post-build: converte dist/ → .vercel/output/ (Vercel Build Output API)
 * O servidor SSR é bundlado com esbuild para incluir todos os node_modules.
 */
import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { build } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// 1. Limpeza
const outDir = resolve(root, '.vercel/output')
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })

// 2. Assets estáticos
mkdirSync(resolve(root, '.vercel/output/static'), { recursive: true })
cpSync(resolve(root, 'dist/client'), resolve(root, '.vercel/output/static'), { recursive: true })
console.log('✓ Assets estáticos copiados')

// 3. Bundla o servidor SSR com esbuild (inclui todos node_modules, exceto built-ins do Node)
const funcDir = resolve(root, '.vercel/output/functions/ssr.func')
mkdirSync(funcDir, { recursive: true })

console.log('⏳ Bundlando servidor SSR...')
await build({
  entryPoints: [resolve(root, 'dist/server/server.js')],
  outfile: resolve(funcDir, 'server-bundle.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  logLevel: 'error',
  external: [
    'node:*',
    'stream', 'fs', 'path', 'os', 'crypto', 'url', 'http', 'https',
    'net', 'tls', 'zlib', 'events', 'util', 'buffer', 'assert',
    'querystring', 'child_process', 'worker_threads', 'perf_hooks',
    'async_hooks', 'readline', 'string_decoder', 'timers', 'dns',
    'domain', 'punycode', 'vm',
  ],
  banner: {
    js: `import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);`,
  },
})
console.log('✓ Servidor bundlado')

// Handler da função SSR
writeFileSync(resolve(funcDir, 'index.js'), `
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))

let _handler = null
async function getHandler() {
  if (_handler) return _handler
  const mod = await import(join(__dirname, 'server-bundle.js'))
  const exp = mod.default ?? mod
  if (typeof exp?.fetch === 'function') {
    _handler = (req) => exp.fetch(req)
  } else if (typeof exp === 'function') {
    _handler = exp
  } else {
    throw new Error('Handler SSR não encontrado. Exports: ' + Object.keys(exp ?? {}).join(', '))
  }
  return _handler
}

export default async function handler(req, res) {
  try {
    const h = await getHandler()
    const proto = req.headers['x-forwarded-proto'] || 'https'
    const host  = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
    const url   = new URL(req.url ?? '/', proto + '://' + host)
    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers ?? {})) {
      if (Array.isArray(v)) v.forEach(x => headers.append(k, x))
      else if (v != null) headers.set(k, String(v))
    }
    let body = null
    if (req.method && !['GET','HEAD'].includes(req.method.toUpperCase())) {
      const chunks = []
      for await (const c of req) chunks.push(c)
      if (chunks.length) body = Buffer.concat(chunks)
    }
    const response = await h(new Request(url.toString(), {
      method: req.method ?? 'GET', headers,
      body: body ?? null,
      duplex: body ? 'half' : undefined,
    }))
    res.statusCode = response.status
    response.headers.forEach((v, k) => res.setHeader(k, v))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (e) {
    console.error('[SSR]', e?.stack ?? e)
    res.statusCode = 500
    res.end('Internal Server Error: ' + (e?.message ?? e))
  }
}
`.trim())

writeFileSync(resolve(funcDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x', handler: 'index.js', launcherType: 'Nodejs',
}, null, 2))
writeFileSync(resolve(funcDir, 'package.json'), JSON.stringify({ type: 'module' }, null, 2))
console.log('✓ Função SSR configurada')

// 4. Roteamento
writeFileSync(resolve(root, '.vercel/output/config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '/assets/(.*)', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/ssr' },
  ],
}, null, 2))
console.log('✓ Roteamento configurado')
console.log('\n✅ .vercel/output/ pronto')
