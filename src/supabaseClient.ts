import { createClient } from '@supabase/supabase-js'

// Zadejte vaši URL adresu ze sekce Data API
const supabaseUrl = 'https://ayxejfyjsrpbqlnufuxj.supabase.co'

// Zkopírujte váš Publishable key ze stránky API Keys
const supabaseAnonKey = 'sb_publishable_Pg3VfuIQgv5_YpxjBPhcyQ_vtEVnAMe'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)