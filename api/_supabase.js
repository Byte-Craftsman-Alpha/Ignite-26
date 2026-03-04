import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    db: { schema: process.env.SUPABASE_DB_SCHEMA },
    ...(process.env.SUPABASE_SERVICE_ROLE_KEY
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          },
        }
      : {}),
  }
);

export default supabase;
