import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const isAuth = !!token;
  
  // Récupération du chemin demandé
  const path = req.nextUrl.pathname;
  
  // Définir les pages publiques (accessibles sans authentification)
  const publicPaths = ["/login", "/register", "/forgot-password", "/error"];
  const isPublicPath = publicPaths.includes(path);
  
  // Gestion des routes d'API auth et OTP
  if (path.startsWith("/api/auth") || path.startsWith("/api/otp")) {
    return NextResponse.next();
  }
  
  // Laisser passer les autres requêtes API si l'utilisateur est authentifié
  if (path.startsWith("/api/") && isAuth) {
    return NextResponse.next();
  }
  
  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  // et essaie d'accéder à une page protégée
  if (!isAuth && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  // Rediriger vers le dashboard si l'utilisateur est déjà authentifié
  // et essaie d'accéder à une page publique comme login/register
  if (isAuth && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  // Correction : rediriger vers le dashboard si l'utilisateur accède à la racine
  if (isAuth && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  // Pour toutes les autres requêtes, continuer
  return NextResponse.next();
}

// Configuration des chemins sur lesquels le middleware sera exécuté
export const config = {
  matcher: [
    // Appliquer à toutes les routes sauf _next, api/auth, et fichiers statiques
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}; 