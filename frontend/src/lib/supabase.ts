import { createClient, SupabaseClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

// Valid dummy anon JWT that satisfies all client-side JWT format checks
const FALLBACK_ANON_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6cWZjemN3cW5hbXZlYnZwcnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NTYwMDAsImV4cCI6MjAyNTQzMjAwMH0.c4ca4238a0b923820dcc509a6f75849b'

// Check if key is a secret service key or invalid
const isSecretOrInvalid =
  !rawKey ||
  rawKey.startsWith('sb_secret_') ||
  rawKey.includes('secret') ||
  rawKey.includes('placeholder') ||
  !rawKey.startsWith('eyJ')

const finalUrl = rawUrl.startsWith('http') ? rawUrl : 'https://fzqfczcwqnamvebvprtb.supabase.co'
const finalKey = isSecretOrInvalid ? FALLBACK_ANON_JWT : rawKey

let client: SupabaseClient

try {
  client = createClient(finalUrl, finalKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
} catch (e) {
  console.warn('[Supabase] Initialized with fallback client:', e)
  client = createClient('https://fzqfczcwqnamvebvprtb.supabase.co', FALLBACK_ANON_JWT)
}

export const supabase = client
export const isSupabaseConfigured = !isSecretOrInvalid

