"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useColocations } from "@/hooks/useColocations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HomeIcon, PlusCircleIcon, Users } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";

export default function ColocationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { colocations, isLoading, isError, createColocation, isCreating } = useColocations();
  const [showNewColocationForm, setShowNewColocationForm] = useState(false);
  const [newColocation, setNewColocation] = useState({ name: "", address: "" });
  const [sessionValid, setSessionValid] = useState(true);

  // Vérification de l'utilisateur au chargement de la page
  useEffect(() => {
    if (session?.user) {
      console.log("Session utilisateur disponible:", {
        id: session.user.id, 
        email: session.user.email
      });
      
      // Vérifier si l'utilisateur existe dans la base de données
      const checkUserExists = async () => {
        try {
          const response = await axios.get("/api/user/check");
          console.log("Vérification utilisateur réussie:", response.data);
        } catch (error: any) {
          console.error("Erreur lors de la vérification de l'utilisateur:", error);
          
          // Si l'utilisateur n'existe pas (status 404), proposer déconnexion
          if (error.response && error.response.status === 404) {
            setSessionValid(false);
            toast.error(
              "Votre session fait référence à un utilisateur qui n'existe plus dans la base de données. Cliquez sur 'Reconnecter' pour résoudre ce problème."
            );
          }
        }
      };
      
      checkUserExists();
    } else if (status !== "loading") {
      console.log("Session utilisateur non disponible ou incomplète");
    }
  }, [session, status]);

  // Fonction pour déconnecter l'utilisateur et le rediriger vers la page de login
  const handleReconnect = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  const handleCreateColocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newColocation.name || !newColocation.address) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    try {
      await createColocation(newColocation, {
        onSuccess: (data) => {
          toast.success("Colocation créée avec succès");
          setNewColocation({ name: "", address: "" });
          setShowNewColocationForm(false);
          
          // Redirection éventuelle vers la page de la colocation
          router.push(`/colocations/${data.id}`);
        },
        onError: (error: any) => {
          console.error("Détails de l'erreur:", error);
          
          // Afficher un message d'erreur personnalisé selon le type d'erreur
          if (error.response) {
            // La requête a été faite et le serveur a répondu avec un code d'état qui est en dehors de la plage 2xx
            const errorMessage = error.response.data?.message || "Erreur du serveur";
            toast.error(`Erreur: ${errorMessage}`);
            console.error("Réponse du serveur:", error.response.data);
            console.error("Statut:", error.response.status);
          } else if (error.request) {
            // La requête a été faite mais aucune réponse n'a été reçue
            toast.error("Aucune réponse du serveur. Vérifiez votre connexion internet.");
            console.error("Requête sans réponse:", error.request);
          } else {
            // Une erreur s'est produite lors de la configuration de la requête
            toast.error("Erreur lors de la création de la colocation");
            console.error("Erreur de configuration:", error.message);
          }
        }
      });
    } catch (error: any) {
      console.error("Erreur non gérée:", error);
      toast.error("Erreur inattendue lors de la création de la colocation");
      
      // Afficher plus de détails dans la console pour le débogage
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
  };

  // Si la session n'est pas valide, afficher un message d'erreur
  if (!sessionValid && status !== "loading") {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-bold text-red-700 mb-4">Session invalide détectée</h2>
          <p className="text-red-600 mb-6">
            Votre session fait référence à un utilisateur qui n'existe plus dans la base de données. 
            Cela peut se produire après une réinitialisation de la base de données.
          </p>
          <Button onClick={handleReconnect} className="bg-red-600 hover:bg-red-700">
            Reconnecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Vos colocations</h1>
        <Button 
          onClick={() => setShowNewColocationForm(!showNewColocationForm)}
          className="flex items-center gap-2"
        >
          <PlusCircleIcon size={18} />
          {showNewColocationForm ? "Annuler" : "Nouvelle colocation"}
        </Button>
      </div>

      {/* Formulaire pour créer une nouvelle colocation */}
      {showNewColocationForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Créer une nouvelle colocation</CardTitle>
            <CardDescription>
              Remplissez les informations ci-dessous pour créer votre colocation
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateColocation}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la colocation</Label>
                <Input
                  id="name"
                  value={newColocation.name}
                  onChange={(e) => setNewColocation({ ...newColocation, name: e.target.value })}
                  placeholder="Ex: Appartement Montparnasse"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={newColocation.address}
                  onChange={(e) => setNewColocation({ ...newColocation, address: e.target.value })}
                  placeholder="Ex: 123 rue de Paris, 75000 Paris"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                disabled={isCreating || !newColocation.name || !newColocation.address}
              >
                {isCreating ? "Création en cours..." : "Créer la colocation"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Liste des colocations */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Chargement de vos colocations...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-red-500">Erreur lors du chargement de vos colocations</p>
          <Button onClick={() => router.refresh()} className="mt-4">
            Réessayer
          </Button>
        </div>
      ) : colocations.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-medium">Vous n'avez pas encore de colocation</h3>
          <p className="mt-2 text-slate-500">
            Créez votre première colocation pour commencer à partager vos dépenses et tâches.
          </p>
          <Button
            onClick={() => setShowNewColocationForm(true)}
            className="mt-4"
          >
            Créer une colocation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colocations.map((colocation) => (
            <Card key={colocation.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>{colocation.name}</CardTitle>
                <CardDescription>{colocation.address}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Ici, nous pourrions ajouter des statistiques ou informations sur la colocation */}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/colocations/${colocation.id}/inviter`}>
                    Inviter
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/colocations/${colocation.id}`}>
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Accéder
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 