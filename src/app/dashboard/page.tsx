import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/auth/LogoutButton";
import UserInfo from "@/components/auth/UserInfo";
import { HomeIcon, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Bienvenue sur CollocShare</h1>
      
      <p className="text-slate-600 dark:text-slate-300 mb-8">
        CollocShare est une application qui simplifie la gestion de votre colocation.
        Partagez les dépenses, organisez les tâches ménagères et gérez vos courses en commun.
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Commencez avec CollocShare</h2>
        <p className="text-blue-700 mb-3">
          Pour utiliser CollocShare, vous devez d'abord créer ou rejoindre une colocation. 
          C'est l'espace partagé où vous et vos colocataires pourrez gérer vos activités communes.
        </p>
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Link href="/colocations">
            <Users className="mr-2 h-5 w-5" />
            Gérer mes colocations
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Finances partagées</CardTitle>
            <CardDescription>Suivez les dépenses et équilibrez les comptes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Enregistrez facilement les dépenses et voyez qui doit quoi à qui.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tâches ménagères</CardTitle>
            <CardDescription>Organisez et répartissez les tâches</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Créez des tâches récurrentes et assurez-vous que chacun fait sa part.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Liste de courses</CardTitle>
            <CardDescription>Gérez vos achats en commun</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Ajoutez des articles à acheter et cochez-les une fois achetés.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prochaines étapes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">1. Créez ou rejoignez une colocation</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                  Commencez par créer votre colocation ou rejoignez-en une existante.
                </p>
                <Button asChild className="flex items-center gap-2">
                  <Link href="/colocations">
                    <HomeIcon className="h-4 w-4" />
                    Gérer mes colocations
                  </Link>
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">2. Invitez vos colocataires</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Envoyez des invitations à vos colocataires pour qu'ils rejoignent votre espace.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">3. Commencez à utiliser les fonctionnalités</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Ajoutez des dépenses, créez des tâches et gérez vos courses ensemble.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Votre compte</CardTitle>
          </CardHeader>
          <CardContent>
            <UserInfo />
            
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Les options de gestion de compte et de profil seront 
              bientôt disponibles.
            </p>
            
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center mt-8 text-sm text-slate-500">
        <p>Cette page est en développement. Plus de fonctionnalités seront ajoutées prochainement.</p>
      </div>
    </div>
  );
} 