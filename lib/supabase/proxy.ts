import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isProfileComplete } from "@/lib/profile";

const PUBLIC_PATHS = ["/login", "/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const pathname = request.nextUrl.pathname;

  if (!userId) {
    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, handicap")
    .eq("id", userId)
    .single();

  const profileComplete = isProfileComplete(profile);

  if (pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = profileComplete ? "/nueva-ronda" : "/onboarding";
    return NextResponse.redirect(url);
  }

  if (!profileComplete && !pathname.startsWith("/onboarding")) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (profileComplete && pathname.startsWith("/onboarding")) {
    const url = request.nextUrl.clone();
    url.pathname = "/nueva-ronda";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/nueva-ronda";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
