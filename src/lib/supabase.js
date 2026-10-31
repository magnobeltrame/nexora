import { createClient } from '@supabase/supabase-js';

// A chave "publishable" pode ficar no código do app: ela é pública por natureza.
// A proteção dos dados vem das regras (RLS) que criamos nas tabelas.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://wfuttjznskzvxgpalxlr.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Jgyrv-de7yCFOdScIfMcWA_tTOIUb7S';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
