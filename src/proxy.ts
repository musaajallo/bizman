import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/africs", "/clients"];
const authRoutes = ["/sign-in", "/sign-up"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isSignedIn = !!req.auth;

  // Signed-in users hitting auth pages → redirect to dashboard
  if (authRoutes.some((r) => pathname.startsWith(r)) && isSignedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated users hitting protected pages → redirect to sign-in
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isSignedIn) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next|api/auth|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
