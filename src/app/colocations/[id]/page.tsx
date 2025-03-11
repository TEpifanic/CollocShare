"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Home, Plus, Settings, Trash2, User, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Colocation, useColocations } from "@/hooks/useColocations";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

// Imports pour les modales de confirmation
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  // Section des membres avec bouton de suppression
  const renderMembresSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Membres</span>
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/colocations/${id}/inviter`} className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Inviter
              </Link>
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {membres.length} {membres.length > 1 ? "membres" : "membre"} dans cette colocation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {membres.map((membre) => (
            <li key={membre.userId} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {membre.user.name ? membre.user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{membre.user.name || "Utilisateur"}</p>
                  <p className="text-sm text-slate-500">{membre.user.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 mr-2">
                  {membre.role === "ADMIN" ? "Admin" : "Membre"}
                </span>
                {isAdmin && membre.userId !== session?.user?.id && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveMember(membre)}
                    title="Retirer ce membre"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  // Ajouter un bouton de suppression de la colocation dans les paramètres
  const renderSettingsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de la colocation</CardTitle>
        <CardDescription>
          Gérez les paramètres de votre colocation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Informations générales</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-slate-500">Nom:</span>
              <p>{colocation.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-500">Adresse:</span>
              <p>{colocation.address}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-500">Créée le:</span>
              <p>{new Date(colocation.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium text-red-600 mb-2">Zone de danger</h3>
            <p className="text-sm text-slate-500 mb-4">
              Ces actions sont irréversibles. Soyez prudent.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleDeleteColocation}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer cette colocation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Ajouter les modales de confirmation
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/colocations" className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              Retour aux colocations
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{colocation.name}</h1>
          <p className="text-slate-500">{colocation.address}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {/* Contenu principal */}
              <Card>
                <CardHeader>
                  <CardTitle>Bienvenue dans votre colocation</CardTitle>
                  <CardDescription>
                    Gérez facilement votre vie en colocation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Contenu de la colocation...</p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              {/* Sidebar avec les membres */}
              {renderMembresSection()}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="members">
          {renderMembresSection()}
        </TabsContent>
        
        <TabsContent value="settings">
          {renderSettingsSection()}
        </TabsContent>
      </Tabs>

      {/* Modale de confirmation pour supprimer un membre */}
      <Dialog open={showDeleteMemberDialog} onOpenChange={setShowDeleteMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer {memberToDelete?.name} de cette colocation ?
              Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteMemberDialog(false)}
              disabled={isRemovingMember}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRemoveMember}
              disabled={isRemovingMember}
            >
              {isRemovingMember ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation pour supprimer la colocation */}
      <Dialog open={showDeleteColocationDialog} onOpenChange={setShowDeleteColocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              <p className="mb-2">
                Êtes-vous sûr de vouloir supprimer définitivement la colocation <strong>{colocation.name}</strong> ?
              </p>
              <p className="mb-2">
                Cette action est irréversible et entraînera la suppression de :
              </p>
              <ul className="list-disc pl-5 mb-4 text-sm">
                <li>Toutes les dépenses partagées</li>
                <li>Toutes les tâches ménagères</li>
                <li>Toutes les listes de courses</li>
                <li>Tous les messages et documents</li>
                <li>Toutes les invitations en attente</li>
              </ul>
              <p className="font-medium text-red-600">
                Pour confirmer, veuillez cliquer sur le bouton "Supprimer définitivement".
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteColocationDialog(false)}
              disabled={isDeletingColocation}
            >
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