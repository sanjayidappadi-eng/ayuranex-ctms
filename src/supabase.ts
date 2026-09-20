import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://tqkyuplluoxwyhpzustl.supabase.co";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_mzCP0wOSpfErwTqr4SUG-Q_3JR0nQaW";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);