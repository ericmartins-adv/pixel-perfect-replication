/**
 * Post-build script: converte a saída do Vite (dist/) para o
 * formato Vercel Build Output API (.vercel/output/).
 *
 * O Vite SSR externaliza node_modules, então usamos esbuild para criar
 * um bundle completamente auto-contido para a função Vercel.
 *
 * Estrutura gerada:
 *   .vercel/output/static/              ← assets do cliente (JS, CSS, SVG…)
 *   .vercel/output/functions/ssr.func/  ← função SSR Node.js 20 (bundled)
 *   .vercel/output/config.json          ← regras de roteamento
 */

import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { build } from 'esbuild'

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

// Bundla o servidor TanStack Start com todas as dependências (esbuild)
// Isso resolve o problema de node_modules não estarem disponíveis na função
console.log('⏳ Bundlando servidor SSR com esbuild...')
await build({
  entryPoints: [resolve(root, 'dist/server/server.js')],
  outfile: resolve(funcDir, 'server-bundle.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  // Apenas módulos built-in do Node.js são externos
  external: [
    'node:*',
    // Módulos nativos sem prefixo node: para compatibilidade
    'stream', 'fs', 'path', 'os', 'crypto', 'url', 'http', 'https',
    'net', 'tls', 'zlib', 'events', 'util', 'buffer', 'assert',
    'querystring', 'child_process', 'worker_threads', 'perf_hooks',
    'async_hooks', 'readline', 'string_decoder', 'timers', 'dns',
    'domain', 'punycode', 'vm',
  ],
  // Permite imports dinâmicos (necessário para TanStack Start)
  splitting: false,
  // Evita warnings de top-level await
  logLevel: 'warning',
  // Permite require() em contexto ESM caso algum pacote antigo use CJS
  banner: {
    js: `
import { createRequire as __createRequire } from 'module';
const require = __createRequire(import.meta.url);
`.trim(),
  },
})
console.log('✓ Servidor bundlado com sucesso')

// Handler da função — importa o bundle auto-contido
const handlerCode = `
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let _handler = null
async function getHandler() {
  if (!_handler) {
    const mod = await import(join(__dirname, 'server-bundle.js'))
    // TanStack Start exporta: export default { fetch: (req: Request) => Response }
    const exp = mod.default ?? mod
    if (typeof exp?.fetch === 'function') {
      _handler = (req) => exp.fetch(req)
    } else if (typeof exp === 'function') {
      _handler = exp
    } else {
      const keys = Object.keys(exp ?? {}).join(', ')
      throw new Error('Formato de handler SSR não reconhecido. Exports: ' + keys)
    }
  }
  return _handler
}

export default async function handler(req, res) {
  try {
    const fetchHandler = await getHandler()

    const proto = req.headers['x-forwarded-proto'] || 'https'
    const host  = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
    const url   = new URL(req.url ?? '/', \`\${proto}://\${host}\`)

    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers ?? {})) {
      if (Array.isArray(v)) v.forEach(x => headers.append(k, x))
      else if (v != null) headers.set(k, String(v))
    }

    let body = null
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

    const response = await fetchHandler(fetchRequest)

    res.statusCode = response.status
    response.headers.forEach((v, k) => res.setHeader(k, v))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (e) {
    console.error('[SSR Error]', e?.message ?? e)
    console.error(e?.stack)
    res.statusCode = 500
    res.end('Internal Server Error: ' + (e?.message ?? String(e)))
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
