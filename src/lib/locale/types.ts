export const locales = ["pt-BR", "en"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return value === "pt-BR" || value === "en";
}
