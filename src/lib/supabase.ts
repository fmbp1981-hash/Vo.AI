import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for browser/frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to get authenticated client with user session
export function getSupabaseClient(accessToken?: string) {
    if (accessToken) {
        return createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        })
    }
    return supabase
}

// Export types for convenience
export type { SupabaseClient } from '@supabase/supabase-js'
