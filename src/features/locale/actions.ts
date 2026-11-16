"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { localeCookieName } from "@/lib/locale/server";
import { isLocale, type Locale } from "@/lib/locale/types";

export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) throw new Error("Unsupported locale.");

  (await cookies()).set(localeCookieName, locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("profiles")
      .update({ preferred_locale: locale })
      .eq("id", user.id);
  }
}
