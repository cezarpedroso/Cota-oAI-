import "server-only";
import { cookies } from "next/headers";
import { isLocale, type Locale } from "./types";

export const localeCookieName = "cotacaoai-locale";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(localeCookieName)?.value;
  return isLocale(value) ? value : "pt-BR";
}
