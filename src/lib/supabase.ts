import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mbjchxsyeqmcctydhybm.supabase.co'
const supabaseKey = 'sb_publishable_42DU8qS9wxFmJlgxasR3Ew_mfStktrn'

export const supabase = createClient(supabaseUrl, supabaseKey)
