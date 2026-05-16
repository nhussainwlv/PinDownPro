import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { defaultLocale, locales } from "@/i18n/config";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
});

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.includes("/dashboard")) {
    const session = await auth();
    if (!session?.user) {
      const locale = pathname.split("/")[1];
      const signInPath = locales.includes(locale as (typeof locales)[number])
        ? `/${locale}/auth/signin`
        : "/auth/signin";
      return NextResponse.redirect(new URL(signInPath, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
