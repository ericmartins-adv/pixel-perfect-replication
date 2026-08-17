import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

if (typeof window !== 'undefined' && (!SUPABASE_URL || !SUPABASE_KEY)) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_KEY precisam estar configuradas (.env local ou variáveis de ambiente do Vercel).')
}

// Lazy singleton — createClient só é chamado no browser, nunca no servidor Node.js.
// Durante o SSR, todas as chamadas retornam imediatamente sem efeito.
let _client: SupabaseClient | null = null

function getRealClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return _client
}

// No-op recursivo para SSR: qualquer acesso retorna uma função que retorna
// uma Promise resolvida vazia, ou outro no-op.
function makeNoop(): any {
  const fn: any = () => Promise.resolve({ data: null, error: null })
  return new Proxy(fn, {
    get: () => makeNoop(),
    apply: () => Promise.resolve({ data: null, error: null }),
  })
}

// Proxy transparente: no browser usa o client real, no servidor usa no-op.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop: string) {
    if (typeof window === 'undefined') return makeNoop()
    const client = getRealClient()
    const val = (client as any)[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})
