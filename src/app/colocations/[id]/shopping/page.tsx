"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, ShoppingCart, Filter, Check, Trash2, Edit, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { useColocations } from "@/hooks/useColocations";
import { useShopping, ShoppingItem } from "@/hooks/useShopping";

export default function ShoppingPage() {
  const params = useParams();
  const router = useRouter();
  const colocationId = params.id as string;
  const { data: session } = useSession();
  
  // Hooks pour les données
  const { useColocationDetailsQuery } = useColocations();
  const { 
    useShoppingItemsQuery, 
    createShoppingItem, 
    updateShoppingItem, 
    deleteShoppingItem, 
    purchaseShoppingItem,
    isCreating,
    isDeleting,
    isUpdating,
    isPurchasing
  } = useShopping(colocationId);
  
  const { data: colocation, isLoading: isLoadingColocation } = useColocationDetailsQuery(colocationId);
  const { data: shoppingItems = [], isLoading: isLoadingItems, refetch: refetchItems } = useShoppingItemsQuery();
  
  // État local
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPurchased, setShowPurchased] = useState<boolean>(false);
  const [showShared, setShowShared] = useState<boolean>(true);
  const [showPersonal, setShowPersonal] = useState<boolean>(true);
  const [showVerification, setShowVerification] = useState<boolean>(true);
  
  // État pour le dialogue d'ajout d'article
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<string>("");
  const [newItemShared, setNewItemShared] = useState<boolean>(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  
  // État pour le dialogue d'édition d'article
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  
  // Filtrer les articles
  const filteredItems = shoppingItems.filter((item: ShoppingItem) => {
    // Filtrer par statut d'achat
    if (!showPurchased && item.purchased) {
      return false;
    }
    
    // Filtrer par recherche
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtrer par type d'article
    if (
      (!showShared && item.shared) ||
      (!showPersonal && !item.shared && !item.needVerification) ||
      (!showVerification && item.needVerification)
    ) {
      return false;
    }
    
    // Filtrer par onglet actif
    if (activeTab === "my-items" && item.userId !== session?.user?.id) {
      return false;
    }
    
    if (activeTab === "shared" && !item.shared) {
      return false;
    }
    
    if (activeTab === "verification" && !item.needVerification) {
      return false;
    }
    
    return true;
  });
  
  // Trier les articles
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Trier par statut d'achat (non achetés en premier)
    if (a.purchased !== b.purchased) {
      return a.purchased ? 1 : -1;
    }
    
    // Puis par date de création (plus récents en premier)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Fonction pour ajouter un nouvel article
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast.error("Le nom de l'article ne peut pas être vide");
      return;
    }
    
    try {
      await createShoppingItem({
        name: newItemName.trim(),
        quantity: newItemQuantity,
        unit: newItemUnit.trim() || undefined,
        colocationId,
        shared: newItemShared,
      });
      
      // Réinitialiser le formulaire
      setNewItemName("");
      setNewItemQuantity(1);
      setNewItemUnit("");
      setNewItemShared(false);
      setIsAddDialogOpen(false);
      
      // Actualiser la liste
      refetchItems();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'article:", error);
      toast.error("Erreur lors de l'ajout de l'article");
    }
  };
  
  // Fonction pour supprimer un article
  const handleDeleteItem = async (item: ShoppingItem) => {
    // Vérifier que l'utilisateur est le propriétaire de l'article
    if (item.userId !== session?.user?.id) {
      toast.error("Vous ne pouvez pas supprimer cet article");
      return;
    }
    
    try {
      await deleteShoppingItem(item.id);
      toast.success("Article supprimé");
      refetchItems();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'article:", error);
      toast.error("Erreur lors de la suppression de l'article");
    }
  };
  
  // Fonction pour marquer un article comme acheté
  const handlePurchaseItem = async (item: ShoppingItem) => {
    try {
      const price = window.prompt("Prix de l'article (optionnel):");
      const priceValue = price ? parseFloat(price) : undefined;
      
      if (price && isNaN(priceValue!)) {
        toast.error("Le prix doit être un nombre");
        return;
      }
      
      await purchaseShoppingItem({
        itemId: item.id,
        data: { price: priceValue }
      });
      
      toast.success("Article marqué comme acheté");
      refetchItems();
    } catch (error) {
      console.error("Erreur lors du marquage de l'article comme acheté:", error);
      toast.error("Erreur lors du marquage de l'article comme acheté");
    }
  };
  
  // Fonction pour mettre à jour le partage d'un article
  const handleToggleShared = async (item: ShoppingItem) => {
    // Vérifier que l'utilisateur est le propriétaire de l'article
    if (item.userId !== session?.user?.id) {
      toast.error("Vous ne pouvez pas modifier cet article");
      return;
    }
    
    try {
      await updateShoppingItem({
        itemId: item.id,
        data: { shared: !item.shared }
      });
      
      toast.success(`Article marqué comme ${!item.shared ? "partagé" : "personnel"}`);
      refetchItems();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'article:", error);
      toast.error("Erreur lors de la mise à jour de l'article");
    }
  };
  
  // Fonction pour ouvrir le dialogue d'édition
  const handleOpenEditDialog = (item: ShoppingItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };
  
  // Fonction pour mettre à jour un article
  const handleUpdateItem = async () => {
    if (!editingItem) return;
    
    try {
      await updateShoppingItem({
        itemId: editingItem.id,
        data: {
          name: editingItem.name,
          quantity: editingItem.quantity,
          unit: editingItem.unit || undefined,
          shared: editingItem.shared,
          needVerification: editingItem.needVerification
        }
      });
      
      toast.success("Article mis à jour avec succès");
      setIsEditDialogOpen(false);
      setEditingItem(null);
      refetchItems();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'article:", error);
      toast.error("Erreur lors de la mise à jour de l'article");
    }
  };
  
  // Si chargement en cours
  if (isLoadingColocation || isLoadingItems) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chargement...</p>
      </div>
    );
  }
  
  // Si la colocation n'existe pas
  if (!colocation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>Colocation non trouvée</p>
        <Button className="mt-4" onClick={() => router.push("/colocations")}>
          Retour aux colocations
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Liste de courses - {colocation.name}</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un article
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un article à la liste</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nom</Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: Lait, Pain..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unité</Label>
                <Input
                  id="unit"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: kg, L, pièce..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shared" className="text-right">Partagé</Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="shared"
                    checked={newItemShared}
                    onCheckedChange={setNewItemShared}
                  />
                  <Label htmlFor="shared">Cet article est partagé avec la colocation</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button onClick={handleAddItem} disabled={isCreating || !newItemName.trim()}>
                {isCreating ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un article..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-purchased"
                  checked={showPurchased}
                  onCheckedChange={setShowPurchased}
                />
                <Label htmlFor="show-purchased">Afficher les articles achetés</Label>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-shared"
                  checked={showShared}
                  onCheckedChange={setShowShared}
                />
                <Label htmlFor="show-shared">Articles partagés</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-personal"
                  checked={showPersonal}
                  onCheckedChange={setShowPersonal}
                />
                <Label htmlFor="show-personal">Articles personnels</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-verification"
                  checked={showVerification}
                  onCheckedChange={setShowVerification}
                />
                <Label htmlFor="show-verification">Articles à vérifier</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="my-items">Mes articles</TabsTrigger>
          <TabsTrigger value="shared">Partagés</TabsTrigger>
          <TabsTrigger value="verification">À vérifier</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <ShoppingItemsList 
            items={sortedItems} 
            onDelete={handleDeleteItem}
            onPurchase={handlePurchaseItem}
            onToggleShared={handleToggleShared}
            onEdit={handleOpenEditDialog}
            currentUserId={session?.user?.id}
            isDeleting={isDeleting}
            isPurchasing={isPurchasing}
            isUpdating={isUpdating}
          />
        </TabsContent>
        
        <TabsContent value="my-items" className="mt-6">
          <ShoppingItemsList 
            items={sortedItems} 
            onDelete={handleDeleteItem}
            onPurchase={handlePurchaseItem}
            onToggleShared={handleToggleShared}
            onEdit={handleOpenEditDialog}
            currentUserId={session?.user?.id}
            isDeleting={isDeleting}
            isPurchasing={isPurchasing}
            isUpdating={isUpdating}
          />
        </TabsContent>
        
        <TabsContent value="shared" className="mt-6">
          <ShoppingItemsList 
            items={sortedItems} 
            onDelete={handleDeleteItem}
            onPurchase={handlePurchaseItem}
            onToggleShared={handleToggleShared}
            onEdit={handleOpenEditDialog}
            currentUserId={session?.user?.id}
            isDeleting={isDeleting}
            isPurchasing={isPurchasing}
            isUpdating={isUpdating}
          />
        </TabsContent>
        
        <TabsContent value="verification" className="mt-6">
          <ShoppingItemsList 
            items={sortedItems} 
            onDelete={handleDeleteItem}
            onPurchase={handlePurchaseItem}
            onToggleShared={handleToggleShared}
            onEdit={handleOpenEditDialog}
            currentUserId={session?.user?.id}
            isDeleting={isDeleting}
            isPurchasing={isPurchasing}
            isUpdating={isUpdating}
          />
        </TabsContent>
      </Tabs>
      
      {/* Dialogue d'édition d'article */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Nom</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-quantity" className="text-right">Quantité</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unit" className="text-right">Unité</Label>
                <Input
                  id="edit-unit"
                  value={editingItem.unit || ""}
                  onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                  className="col-span-3"
                  placeholder="Ex: kg, L, pièce..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-shared" className="text-right">Partagé</Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="edit-shared"
                    checked={editingItem.shared}
                    onCheckedChange={(checked) => setEditingItem({...editingItem, shared: checked})}
                  />
                  <Label htmlFor="edit-shared">Cet article est partagé avec la colocation</Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-verification" className="text-right">À vérifier</Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="edit-verification"
                    checked={editingItem.needVerification}
                    onCheckedChange={(checked) => setEditingItem({...editingItem, needVerification: checked})}
                  />
                  <Label htmlFor="edit-verification">Cet article nécessite une vérification</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleUpdateItem} disabled={isUpdating || !editingItem?.name.trim()}>
              {isUpdating ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant pour afficher la liste des articles
interface ShoppingItemsListProps {
  items: ShoppingItem[];
  onDelete: (item: ShoppingItem) => void;
  onPurchase: (item: ShoppingItem) => void;
  onToggleShared: (item: ShoppingItem) => void;
  onEdit: (item: ShoppingItem) => void;
  currentUserId?: string;
  isDeleting: boolean;
  isPurchasing: boolean;
  isUpdating: boolean;
}

function ShoppingItemsList({ 
  items, 
  onDelete, 
  onPurchase,
  onToggleShared,
  onEdit,
  currentUserId,
  isDeleting,
  isPurchasing,
  isUpdating
}: ShoppingItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Aucun article</h3>
        <p className="text-muted-foreground">Ajoutez des articles à votre liste de courses.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className={item.purchased ? "opacity-60" : ""}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${item.purchased ? "line-through" : ""}`}>
                    {item.name}
                  </h3>
                  {item.shared && (
                    <Badge variant="outline" className="text-xs">Partagé</Badge>
                  )}
                  {item.needVerification && (
                    <Badge variant="outline" className="text-xs bg-yellow-100">À vérifier</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} {item.unit ? item.unit : "unité(s)"}
                  {item.price && ` - ${item.price.toFixed(2)}€`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ajouté par {item.userName}
                  {item.purchased && item.purchasedByName && ` • Acheté par ${item.purchasedByName}`}
                </p>
              </div>
              <div className="flex gap-2">
                {!item.purchased && item.userId === currentUserId && (
                  <>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onEdit(item)}
                      disabled={isUpdating}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onToggleShared(item)}
                      disabled={isUpdating}
                    >
                      {item.shared ? (
                        <UserPlus className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      <span className="sr-only">{item.shared ? "Rendre personnel" : "Partager"}</span>
                    </Button>
                  </>
                )}
                {item.userId === currentUserId && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onDelete(item)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 