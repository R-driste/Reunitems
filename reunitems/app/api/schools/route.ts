import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log("Schools route: SUPABASE_URL=", SUPABASE_URL?.substring(0, 20), "SERVICE_ROLE exists=", !!SERVICE_ROLE);

const svc = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { name, slug } = body;
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    // If no slug provided, generate one from name with random suffix to ensure uniqueness
    if (!slug) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${randomSuffix}`;
    }

    console.log("Creating school:", { name, slug });
    const { data, error } = await svc.from('schools').insert([{ name, slug }]).select();
    if (error) {
      console.error("School insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Schools route error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
