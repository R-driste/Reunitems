"use client";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";

export function useSupabaseClient() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    )
  );
  return supabase;
}

export default useSupabaseClient;
