import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mbjchxsyeqmcctydhybm.supabase.co'
const supabaseKey = 'sb_publishable_42DU8qS9wxFmJlgxasR3Ew_mfStktrn'

// SSR-safe: no servidor Node.js não existe localStorage nem window.
// Passamos undefined como storage e desativamos auto-refresh/detectSessionInUrl
// para evitar crash durante o SSR do TanStack Start.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
  },
})
