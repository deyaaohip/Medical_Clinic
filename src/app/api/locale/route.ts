import { NextResponse } from "next/server";
import { setLocaleCookie } from "@/lib/i18n/engine";
import { Locale } from "@/lib/i18n/dictionaries";

export async function POST(request: Request) {
  try {
    const { locale } = await request.json();
    if (locale === "en" || locale === "ar") {
      await setLocaleCookie(locale as Locale);
      return NextResponse.json({ success: true, locale });
    }
    return NextResponse.json({ success: false, error: "Invalid locale" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to set locale" }, { status: 500 });
  }
}
