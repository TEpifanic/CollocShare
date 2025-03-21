"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, Users, DollarSign, ShoppingCart, Menu, X, User, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip } from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  tooltip: string
}

// Liste des chemins où la navigation ne doit pas être affichée
const hiddenPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function MainNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentColocationId, setCurrentColocationId] = useState<string | null>(null)

  // Vérifier si la navigation doit être masquée sur le chemin actuel
  const isAuthPage = hiddenPaths.some(path => pathname.startsWith(path)) || 
                    pathname.includes("/(auth)") || 
                    pathname === "/" // Page d'accueil souvent réservée à l'authentification

  // Extraire l'ID de colocation du chemin si présent - toujours exécuter ce hook avant les conditions de retour
  useEffect(() => {
    const matches = pathname.match(/\/colocations\/([^\/]+)/)
    if (matches && matches[1]) {
      setCurrentColocationId(matches[1])
    } else {
      setCurrentColocationId(null)
    }
  }, [pathname])

  // Fermer le menu mobile quand on navigue - toujours exécuter ce hook avant les conditions de retour
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Si c'est une page d'auth ou si l'utilisateur n'est pas connecté, ne pas afficher la navigation
  if (isAuthPage || status !== "authenticated") {
    return null;
  }

  // Navigation items qui dépendent de l'authentification
  const navItems: NavItem[] = [
    {
      title: "Accueil",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      tooltip: "Retour au tableau de bord"
    },
    {
      title: "Mes colocations",
      href: "/colocations",
      icon: <Users className="h-5 w-5" />,
      tooltip: "Gérer mes colocations"
    }
  ]

  // Navigation items qui dépendent d'une colocation active
  const colocationNavItems: NavItem[] = currentColocationId
    ? [
        {
          title: "Dépenses",
          href: `/colocations/${currentColocationId}/expenses`,
          icon: <DollarSign className="h-5 w-5" />,
          tooltip: "Gérer les dépenses partagées"
        },
        {
          title: "Courses",
          href: `/colocations/${currentColocationId}/shopping`,
          icon: <ShoppingCart className="h-5 w-5" />,
          tooltip: "Liste de courses partagée"
        }
      ]
    : []

  return (
    <>
      {/* Navigation mobile */}
      <div className="fixed bottom-0 left-0 z-50 w-full md:hidden">
        <div className="grid h-16 grid-cols-5 bg-background border-t border-border">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          ))}
          
          {/* Afficher uniquement les items de colocation si une colocation est active */}
          {colocationNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          ))}
          
          {/* Bouton de menu pour plus d'options */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors text-muted-foreground hover:text-primary"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
                <span>Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-xl max-h-[85vh] overflow-auto">
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Menu</h3>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Fermer">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </div>
                <div className="grid gap-2">
                  {/* Profil utilisateur */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent"
                  >
                    <User className="h-5 w-5" />
                    <span>Mon profil</span>
                  </Link>
                  
                  {/* Lien de déconnexion */}
                  <Link
                    href="/api/auth/signout"
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent text-destructive"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Déconnexion</span>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Navigation desktop */}
      <div className="hidden md:flex fixed left-0 top-0 flex-col h-screen w-16 border-r border-border z-40">
        <div className="flex flex-col space-y-4 py-4 items-center">
          {navItems.map((item) => (
            <Tooltip key={item.href} text={item.tooltip}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-md transition-colors hover:bg-accent",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
                aria-label={item.title}
              >
                {item.icon}
              </Link>
            </Tooltip>
          ))}

          {/* Séparateur si des éléments de colocation sont présents */}
          {colocationNavItems.length > 0 && (
            <div className="w-8 border-t border-border my-2"></div>
          )}

          {/* Items de navigation de colocation */}
          {colocationNavItems.map((item) => (
            <Tooltip key={item.href} text={item.tooltip}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-md transition-colors hover:bg-accent",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
                aria-label={item.title}
              >
                {item.icon}
              </Link>
            </Tooltip>
          ))}
        </div>

        <div className="mt-auto flex flex-col space-y-4 py-4 items-center">
          <Tooltip text="Mon profil">
            <Link
              href="/profile"
              className="flex h-12 w-12 items-center justify-center rounded-md transition-colors hover:bg-accent text-muted-foreground"
              aria-label="Mon profil"
            >
              <User className="h-5 w-5" />
            </Link>
          </Tooltip>
          <Tooltip text="Déconnexion">
            <Link
              href="/api/auth/signout"
              className="flex h-12 w-12 items-center justify-center rounded-md transition-colors hover:bg-accent text-destructive"
              aria-label="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </Link>
          </Tooltip>
        </div>
      </div>
    </>
  )
} 