// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/supabase/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Initialize the Supabase client with type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
