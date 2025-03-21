"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Home, Plus, Settings, Trash2, User, Users, X, DollarSign, ShoppingCart, UserPlus, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Colocation, useColocations } from "@/hooks/useColocations";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";

// Imports pour les modales de confirmation
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ColocPageProps {
  params: {
    id: string;
  };
}

// Type pour un membre de colocation
interface MembreColocation {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ColocPage({ params }: ColocPageProps) {
  const { id } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const [colocation, setColocation] = useState<Colocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membres, setMembres] = useState<MembreColocation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // États pour les modales de confirmation
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; userId: string; name: string } | null>(null);
  const [showDeleteColocationDialog, setShowDeleteColocationDialog] = useState(false);
  
  // Utiliser le hook useColocations pour les mutations
  const { 
    removeMember, 
    isRemovingMember, 
    deleteColocation, 
    isDeletingColocation 
  } = useColocations();

  // Récupérer les détails de la colocation
  useEffect(() => {
    const fetchColocationDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/colocation/${id}`);
        setColocation(response.data.colocation);
        setMembres(response.data.membres || []);
        setIsAdmin(response.data.isAdmin || false);
        setError(null);
      } catch (err) {
        console.error("Erreur lors de la récupération des détails de la colocation:", err);
        setError("Impossible de charger les détails de la colocation");
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchColocationDetails();
  }, [id]);

  // Gérer la suppression d'un membre
  const handleRemoveMember = (membre: MembreColocation) => {
    setMemberToDelete({
      id: membre.id,
      userId: membre.userId,
      name: membre.user.name || membre.user.email || "Ce membre"
    });
    setShowDeleteMemberDialog(true);
  };

  // Confirmer la suppression d'un membre
  const confirmRemoveMember = () => {
    if (!memberToDelete) return;
    
    removeMember(
      { colocationId: id, userId: memberToDelete.userId },
      {
        onSuccess: () => {
          toast.success(`${memberToDelete.name} a été retiré de la colocation`);
          // Mettre à jour la liste des membres localement
          setMembres(membres.filter(m => m.userId !== memberToDelete.userId));
          setShowDeleteMemberDialog(false);
          setMemberToDelete(null);
        },
        onError: (error: any) => {
          console.error("Erreur lors de la suppression du membre:", error);
          const errorMessage = error.response?.data?.message || "Erreur lors de la suppression du membre";
          toast.error(errorMessage);
        }
      }
    );
  };

  // Gérer la suppression de la colocation
  const handleDeleteColocation = () => {
    setShowDeleteColocationDialog(true);
  };

  // Confirmer la suppression de la colocation
  const confirmDeleteColocation = () => {
    deleteColocation(id, {
      onSuccess: () => {
        toast.success("Colocation supprimée avec succès");
        router.push("/colocations");
      },
      onError: (error: any) => {
        console.error("Erreur lors de la suppression de la colocation:", error);
        const errorMessage = error.response?.data?.message || "Erreur lors de la suppression de la colocation";
        toast.error(errorMessage);
      }
    });
  };

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !colocation) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">Erreur</h2>
              <p className="text-red-600">{error || "Impossible de charger les détails de la colocation"}</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/colocations">Retour aux colocations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Améliorer le rendu des fonctionnalités avec des icônes, tooltips et style mobile-first
  const renderFonctionnalitesSection = () => (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Fonctionnalités</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tooltip text="Gérer les dépenses partagées et voir qui doit de l'argent à qui">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Suivez les dépenses partagées et gérez les remboursements entre colocataires.
              </CardDescription>
              <Button asChild className="w-full">
                <Link href={`/colocations/${id}/expenses`}>Gérer les dépenses</Link>
              </Button>
            </CardContent>
          </Card>
        </Tooltip>

        <Tooltip text="Créer et gérer des listes de courses partagées">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Créez des listes de courses communes et marquez les articles achetés.
              </CardDescription>
              <Button asChild className="w-full">
                <Link href={`/colocations/${id}/shopping`}>Gérer les courses</Link>
              </Button>
            </CardContent>
          </Card>
        </Tooltip>

        <Tooltip text="Inviter de nouveaux colocataires à rejoindre cet espace">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Invitez d'autres personnes à rejoindre votre colocation.
              </CardDescription>
              <Button asChild className="w-full">
                <Link href={`/colocations/${id}/inviter`}>Inviter des colocataires</Link>
              </Button>
            </CardContent>
          </Card>
        </Tooltip>
      </div>
    </div>
  );

  // Améliorer la section des membres avec des avatars et badges de rôle
  const renderMembresSection = () => (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Membres ({membres.length})</h2>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {membres.map((membre) => (
              <li key={membre.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src="" alt={membre.user.name || "Utilisateur"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {membre.user.name?.charAt(0) || membre.user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{membre.user.name || membre.user.email}</p>
                      {membre.role === "ADMIN" && (
                        <Tooltip text="Administrateur de la colocation">
                          <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                            Admin
                          </Badge>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{membre.user.email}</p>
                  </div>
                </div>
                {isAdmin && session?.user?.id !== membre.userId && (
                  <Tooltip text="Retirer ce membre de la colocation">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveMember(membre)}
                      aria-label="Retirer ce membre"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
        {isAdmin && (
          <CardFooter className="border-t p-4">
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/colocations/${id}/inviter`} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Inviter des colocataires
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );

  // Améliorer la section des paramètres avec de meilleurs tooltips et organisation visuelle
  const renderSettingsSection = () => (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Paramètres</h2>
      <Card>
        <CardContent className="p-6">
          {isAdmin ? (
            <div className="space-y-6">
              <div className="pb-6 border-b border-border">
                <h3 className="font-medium text-lg mb-2">Informations de la colocation</h3>
                <div className="grid gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nom</p>
                    <p>{colocation?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p>{colocation?.address}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Modifier les informations
                  </Button>
                </div>
              </div>
              
              <div className="pt-2">
                <h3 className="font-medium text-lg mb-2 text-destructive">Zone de danger</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cette action supprimera définitivement la colocation et toutes les données associées. Cette action est irréversible.
                </p>
                <Tooltip text="Supprimer définitivement cette colocation et toutes ses données">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteColocation}
                    className="flex items-center gap-2"
                    disabled={isDeletingColocation}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeletingColocation ? "Suppression..." : "Supprimer la colocation"}
                  </Button>
                </Tooltip>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Vous devez être administrateur pour modifier les paramètres de la colocation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Ajouter les modales de confirmation
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/colocations" className="text-sm text-muted-foreground hover:underline">
              Mes colocations
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <h1 className="text-2xl sm:text-3xl font-bold truncate">
              {colocation?.name || "Colocation"}
            </h1>
          </div>
          <p className="text-muted-foreground">{colocation?.address}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Tooltip text="Inviter des colocataires">
            <Button asChild size="sm" variant="outline" className="flex items-center gap-2">
              <Link href={`/colocations/${id}/inviter`}>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Inviter</span>
              </Link>
            </Button>
          </Tooltip>
          <Tooltip text="Gérer les dépenses">
            <Button asChild size="sm" variant="outline" className="flex items-center gap-2">
              <Link href={`/colocations/${id}/expenses`}>
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Dépenses</span>
              </Link>
            </Button>
          </Tooltip>
          <Tooltip text="Liste de courses">
            <Button asChild className="flex items-center gap-2">
              <Link href={`/colocations/${id}/shopping`}>
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Courses</span>
              </Link>
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <Tabs defaultValue="fonctionnalites" className="space-y-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="fonctionnalites" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Fonctionnalités</span>
          </TabsTrigger>
          <TabsTrigger value="membres" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Membres</span>
            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {membres.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="parametres" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fonctionnalites">
          {renderFonctionnalitesSection()}
        </TabsContent>
        
        <TabsContent value="membres">
          {renderMembresSection()}
        </TabsContent>
        
        <TabsContent value="parametres">
          {renderSettingsSection()}
        </TabsContent>
      </Tabs>
      
      {/* Dialogue de confirmation pour supprimer un membre */}
      <Dialog open={showDeleteMemberDialog} onOpenChange={setShowDeleteMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer un membre</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer {memberToDelete?.name} de la colocation ?
              Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteMemberDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveMember}
              disabled={isRemovingMember}
            >
              {isRemovingMember ? "Suppression..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation pour supprimer la colocation */}
      <Dialog open={showDeleteColocationDialog} onOpenChange={setShowDeleteColocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer la colocation</DialogTitle>
            <DialogDescription>
              Êtes-vous absolument sûr de vouloir supprimer la colocation <strong>{colocation?.name}</strong> ?
              Cette action supprimera définitivement toutes les données associées et est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 p-4 rounded-md text-sm mb-4">
            <p className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Toutes les dépenses, listes de courses et autres données seront supprimées.
                Les autres membres n'auront plus accès à ces informations.
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteColocationDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteColocation}
              disabled={isDeletingColocation}
            >
              {isDeletingColocation ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 