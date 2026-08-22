import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Supabase JS SDK blocks keys starting with 'sb_secret_' in the browser to prevent security leaks
const isSecretKey = typeof supabaseAnonKey === 'string' && (supabaseAnonKey.startsWith('sb_secret_') || supabaseAnonKey.includes('secret'))

if (isSecretKey) {
  console.warn(
    '[Supabase Security Warning] A Secret Service Key (sb_secret_...) was provided in frontend VITE_SUPABASE_ANON_KEY. ' +
    'The browser requires the "anon public" key from Supabase Dashboard -> Settings -> API. ' +
    'Falling back to demo mode to prevent browser crashes.'
  )
}

const safeUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co'
const safeKey = isSecretKey || !supabaseAnonKey ? 'placeholder-anon-key' : supabaseAnonKey

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
