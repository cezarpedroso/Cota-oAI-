import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_confirmation_link", url.origin),
    );
  }

  const s = await createClient();
  try {
    const { error } = await s.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", url.origin));
    }
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=invalid_confirmation_link", url.origin),
    );
  }

  return NextResponse.redirect(
    new URL("/login?error=invalid_confirmation_link", url.origin),
  );
}
