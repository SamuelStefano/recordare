import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// db.schema: o catálogo vive em `recordare`, não em `public`. Sem isto o PostgREST
// responde 404 em toda tabela.
export const supabase = createClient(url, key, { db: { schema: 'recordare' } });
