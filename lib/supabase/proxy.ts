import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = [/^\/dashboard(?:\/|$)/, /^\/onboarding(?:\/|$)/];
const AUTH_PAGES = new Set(["/login", "/signup"]);

/** Host segment used in `sb-<ref>-auth-token` cookies (see @supabase/ssr). */
function supabaseCookieRef(supabaseUrl: string): string {
  const host = new URL(supabaseUrl).hostname;
  if (host === "127.0.0.1" || host === "localhost") return "127";
  return host.split(".")[0] ?? host;
}

/** Drop auth cookies from other Supabase projects (common after switching local ↔ hosted). */
function pruneForeignSupabaseCookies(request: NextRequest, supabaseUrl: string): string[] {
  const keepPrefix = `sb-${supabaseCookieRef(supabaseUrl)}-`;
  const stale: string[] = [];
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-") && !name.startsWith(keepPrefix)) {
      stale.push(name);
      request.cookies.delete(name);
    }
  }
  return stale;
}

function supabaseCookieByteSize(request: NextRequest): number {
  let bytes = 0;
  for (const { name, value } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) bytes += name.length + value.length + 2;
  }
  return bytes;
}

/** Node rejects requests above ~16KB of Cookie header (HTTP 431) before proxy runs. */
function pruneOversizedSupabaseCookies(request: NextRequest): string[] {
  const stale: string[] = [];
  const cookieHeader = request.headers.get("cookie") ?? "";
  const headerBytes = new TextEncoder().encode(cookieHeader).length;
  const sbBytes = supabaseCookieByteSize(request);
  const tooLarge = headerBytes > 14_000 || sbBytes > 10_000;
  if (!tooLarge) return stale;

  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) {
      stale.push(name);
      request.cookies.delete(name);
    }
  }
  return stale;
}

function expireCookies(response: NextResponse, names: string[]) {
  for (const name of names) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const staleSupabaseCookies = Array.from(
    new Set([...pruneForeignSupabaseCookies(request, url), ...pruneOversizedSupabaseCookies(request)]),
  );

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((pattern) => pattern.test(path));

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const redirect = copyCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
    expireCookies(redirect, staleSupabaseCookies);
    return redirect;
  }

  if (user && AUTH_PAGES.has(path)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    const redirect = copyCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
    expireCookies(redirect, staleSupabaseCookies);
    return redirect;
  }

  expireCookies(supabaseResponse, staleSupabaseCookies);
  return supabaseResponse;
}
