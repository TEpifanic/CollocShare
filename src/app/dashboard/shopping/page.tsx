"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ShoppingItem as ShoppingItemType, useShopping } from "@/hooks/useShopping";
import { useColocations } from "@/hooks/useColocations";
import { PlusCircle, Filter, ShoppingCart, Check, Trash2, Edit, UserPlus } from "lucide-react";
import ShoppingItemComponent from "@/components/shopping/ShoppingItem";

export default function ShoppingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItemType | null>(null);
  
  // Formulaire d'ajout
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "",
    category: "",
    shared: false,
    needVerification: false,
  });
  
  // Récupérer la colocation active
  const { useActiveColocationQuery } = useColocations();
  const { data: activeColocation, isLoading: isLoadingColocation } = useActiveColocationQuery();
  
  // Hook de gestion des courses
  const { 
    useShoppingItemsQuery, 
    createShoppingItem, 
    updateShoppingItem, 
    deleteShoppingItem, 
    purchaseShoppingItem,
    isCreating,
    isUpdating,
    isDeleting,
    isPurchasing
  } = useShopping(activeColocation?.id);
  
  // Récupérer les articles
  const { data: items = [], isLoading: isLoadingItems } = useShoppingItemsQuery();
  
  if (!session) {
    router.push("/auth/signin");
    return null;
  }
  
  if (isLoadingColocation) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Liste de courses</h1>
          <div className="flex items-center justify-center h-64">
            <p>Chargement de la colocation...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!activeColocation) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Liste de courses</h1>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p>Vous n'avez pas de colocation active.</p>
            <Button onClick={() => router.push("/dashboard")}>
              Retourner au tableau de bord
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Catégories uniques pour le filtre
  const categories = Array.from(
    new Set(items.map((item: ShoppingItemType) => item.category).filter(Boolean))
  ) as string[];
  
  // Filtrer les articles en fonction de l'onglet actif et des filtres
  const filteredItems = items.filter((item: ShoppingItemType) => {
    // Filtrage par texte
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrage par catégorie
    if (categoryFilter && item.category !== categoryFilter) {
      return false;
    }
    
    // Filtrage par onglet
    switch (activeTab) {
      case "mine":
        return item.userId === session.user.id && !item.purchased;
      case "shared":
        return item.shared && !item.purchased;
      case "needVerification":
        return item.needVerification && !item.purchased;
      case "purchased":
        return item.purchased;
      case "all":
      default:
        return !item.purchased;
    }
  });
  
  // Gérer l'ajout d'un article
  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      toast.error("Veuillez entrer un nom pour l'article");
      return;
    }
    
    try {
      await createShoppingItem({
        ...newItem,
        colocationId: activeColocation.id,
      });
      
      // Réinitialiser le formulaire
      setNewItem({
        name: "",
        quantity: 1,
        unit: "",
        category: "",
        shared: false,
        needVerification: false,
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'article:", error);
    }
  };
  
  // Gérer la mise à jour d'un article
  const handleUpdateItem = async () => {
    if (!editingItem) return;
    
    if (!editingItem.name.trim()) {
      toast.error("Le nom de l'article ne peut pas être vide");
      return;
    }
    
    try {
      console.log("Mise à jour de l'article:", editingItem);
      
      await updateShoppingItem({
        itemId: editingItem.id,
        data: {
          name: editingItem.name,
          quantity: editingItem.quantity,
          unit: editingItem.unit || undefined,
          category: editingItem.category || undefined,
          shared: editingItem.shared,
          needVerification: editingItem.needVerification,
        },
      });
      
      toast.success("Article mis à jour avec succès");
      setShowEditDialog(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'article:", error);
      toast.error("Erreur lors de la mise à jour de l'article");
    }
  };
  
  // Gérer la suppression d'un article
  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Voulez-vous vraiment supprimer cet article ?")) {
      try {
        await deleteShoppingItem(itemId);
      } catch (error) {
        console.error("Erreur lors de la suppression de l'article:", error);
      }
    }
  };
  
  // Gérer l'achat d'un article
  const handlePurchaseItem = async (itemId: string) => {
    try {
      console.log("Marquage de l'article comme acheté:", itemId);
      
      await purchaseShoppingItem({ itemId });
      toast.success("Article marqué comme acheté");
    } catch (error) {
      console.error("Erreur lors du marquage de l'article comme acheté:", error);
      toast.error("Erreur lors du marquage de l'article comme acheté");
    }
  };
  
  // Ouvrir le dialogue d'édition
  const openEditDialog = (item: ShoppingItemType) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };
  
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Liste de courses</h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter un article
            </Button>
          </div>
        </div>
        
        {/* Filtres */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Rechercher un article</Label>
              <Input
                id="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="category">Filtrer par catégorie</Label>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category || ""}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="mine">Mes articles</TabsTrigger>
            <TabsTrigger value="shared">Partagés</TabsTrigger>
            <TabsTrigger value="needVerification">À vérifier</TabsTrigger>
            <TabsTrigger value="purchased">Achetés</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Liste des articles */}
        {isLoadingItems ? (
          <div className="flex items-center justify-center h-64">
            <p>Chargement des articles...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p>Aucun article trouvé.</p>
            <Button onClick={() => setShowAddDialog(true)}>
              Ajouter un article
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item: ShoppingItemType) => (
              <ShoppingItemComponent
                key={item.id}
                item={item}
                onEdit={openEditDialog}
                onDelete={handleDeleteItem}
                onPurchase={handlePurchaseItem}
                isDeleting={isDeleting}
                isPurchasing={isPurchasing}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Dialogue d'ajout d'article */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un article</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel article à la liste de courses.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="col-span-1">
                Nom *
              </Label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="col-span-3"
                placeholder="Ex: Lait"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="col-span-1">
                Quantité
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="col-span-1"
              />
              
              <Label htmlFor="unit" className="col-span-1 text-right">
                Unité
              </Label>
              <Input
                id="unit"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="col-span-1"
                placeholder="Ex: L"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="col-span-1">
                Catégorie
              </Label>
              <Input
                id="category"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="col-span-3"
                placeholder="Ex: Produits laitiers"
              />
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-2">
              <p className="text-sm font-medium mb-2">Options de l'article :</p>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Checkbox
                    id="shared"
                    checked={newItem.shared}
                    onCheckedChange={(checked: boolean | "indeterminate") => 
                      setNewItem({ ...newItem, shared: checked === true })
                    }
                  />
                  <div>
                    <Label htmlFor="shared" className="font-medium">Article partagé</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Les coûts seront répartis entre tous les membres</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Checkbox
                    id="needVerification"
                    checked={newItem.needVerification}
                    onCheckedChange={(checked: boolean | "indeterminate") => 
                      setNewItem({ ...newItem, needVerification: checked === true })
                    }
                  />
                  <div>
                    <Label htmlFor="needVerification" className="font-medium">À vérifier</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Marque l'article comme nécessitant une vérification</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddItem} 
              disabled={isCreating || !newItem.name.trim()}
            >
              {isCreating ? "Ajout en cours..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue d'édition d'article */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
            <DialogDescription>
              Modifiez les informations de cet article.
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="col-span-1">
                  Nom *
                </Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-quantity" className="col-span-1">
                  Quantité
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={editingItem.quantity}
                  onChange={(e) => 
                    setEditingItem({ 
                      ...editingItem, 
                      quantity: parseInt(e.target.value) || 1 
                    })
                  }
                  className="col-span-1"
                />
                
                <Label htmlFor="edit-unit" className="col-span-1 text-right">
                  Unité
                </Label>
                <Input
                  id="edit-unit"
                  value={editingItem.unit || ""}
                  onChange={(e) => 
                    setEditingItem({ 
                      ...editingItem, 
                      unit: e.target.value 
                    })
                  }
                  className="col-span-1"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="col-span-1">
                  Catégorie
                </Label>
                <Input
                  id="edit-category"
                  value={editingItem.category || ""}
                  onChange={(e) => 
                    setEditingItem({ 
                      ...editingItem, 
                      category: e.target.value 
                    })
                  }
                  className="col-span-3"
                />
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-2">
                <p className="text-sm font-medium mb-2">Options de l'article :</p>
                
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Checkbox
                      id="edit-shared"
                      checked={editingItem.shared}
                      onCheckedChange={(checked: boolean | "indeterminate") => 
                        setEditingItem({ 
                          ...editingItem, 
                          shared: checked === true 
                        })
                      }
                    />
                    <div>
                      <Label htmlFor="edit-shared" className="font-medium">Article partagé</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Les coûts seront répartis entre tous les membres</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Checkbox
                      id="edit-needVerification"
                      checked={editingItem.needVerification}
                      onCheckedChange={(checked: boolean | "indeterminate") => 
                        setEditingItem({ 
                          ...editingItem, 
                          needVerification: checked === true 
                        })
                      }
                    />
                    <div>
                      <Label htmlFor="edit-needVerification" className="font-medium">À vérifier</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Marque l'article comme nécessitant une vérification</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateItem} 
              disabled={isUpdating || !editingItem?.name.trim()}
            >
              {isUpdating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
} 