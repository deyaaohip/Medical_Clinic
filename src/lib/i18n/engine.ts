import { cookies } from "next/headers";
import { DICTIONARIES, Locale } from "./dictionaries";

const LOCALE_COOKIE_NAME = "med_saas_locale";

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const val = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale;
  if (val === "en" || val === "ar") {
    return val;
  }
  return "en"; // default to English
}

export async function setLocaleCookie(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60, // 1 year
  });
}

export async function getTranslation(locale: Locale) {
  return DICTIONARIES[locale] || DICTIONARIES.en;
}

export function getTranslationSync(locale: Locale) {
  return DICTIONARIES[locale] || DICTIONARIES.en;
}

export function getHtmlDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
