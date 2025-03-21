import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Interface ShoppingItem basée sur le modèle Prisma
export interface ShoppingItem {
  id: string;
  colocationId: string;
  userId: string;
  userName?: string;
  name: string;
  quantity: number;
  unit?: string | null;
  price?: number | null;
  category?: string | null;
  purchased: boolean;
  purchasedById?: string | null;
  purchasedByName?: string | null;
  purchasedAt?: Date | null;
  shared: boolean;
  needVerification: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Type pour les données de création d'article
export interface CreateShoppingItemData {
  name: string;
  quantity?: number;
  unit?: string;
  colocationId: string;
  category?: string;
  shared?: boolean;
  needVerification?: boolean;
}

// Type pour les données de mise à jour d'article
export interface UpdateShoppingItemData {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  shared?: boolean;
  needVerification?: boolean;
  purchased?: boolean;
  price?: number;
}

// Type pour les paramètres de mise à jour d'article
export interface UpdateShoppingItemParams {
  itemId: string;
  data: UpdateShoppingItemData;
}

// Interface pour les paramètres de marquage d'achat
export interface PurchaseShoppingItemParams {
  itemId: string;
  data?: {
    price?: number;
  };
}

// Hook pour gérer les articles de courses
export const useShopping = (colocationId?: string) => {
  const queryClient = useQueryClient();

  // Query pour récupérer les articles de courses
  const useShoppingItemsQuery = () => {
    return useQuery({
      queryKey: ["shopping", colocationId],
      queryFn: async () => {
        if (!colocationId) return [];

        const response = await fetch(`/api/shopping?colocationId=${colocationId}`);
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des articles");
        }
        return response.json();
      },
      enabled: !!colocationId,
    });
  };

  // Mutation pour créer un article
  const createShoppingItemMutation = useMutation({
    mutationFn: async (data: CreateShoppingItemData) => {
      const response = await fetch("/api/shopping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la création de l'article");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Article ajouté avec succès");
      queryClient.invalidateQueries({ queryKey: ["shopping", colocationId] });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la création de l'article:", error);
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour mettre à jour un article
  const updateShoppingItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: UpdateShoppingItemParams) => {
      const response = await fetch(`/api/shopping/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la mise à jour de l'article");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping", colocationId] });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour de l'article:", error);
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour supprimer un article
  const deleteShoppingItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/shopping/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression de l'article");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Article supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["shopping", colocationId] });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la suppression de l'article:", error);
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour marquer un article comme acheté
  const purchaseShoppingItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: PurchaseShoppingItemParams) => {
      const response = await fetch(`/api/shopping/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data || {}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du marquage de l'article comme acheté");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Article marqué comme acheté");
      queryClient.invalidateQueries({ queryKey: ["shopping", colocationId] });
    },
    onError: (error: Error) => {
      console.error("Erreur lors du marquage de l'article comme acheté:", error);
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    useShoppingItemsQuery,
    createShoppingItem: createShoppingItemMutation.mutateAsync,
    updateShoppingItem: updateShoppingItemMutation.mutateAsync,
    deleteShoppingItem: deleteShoppingItemMutation.mutateAsync,
    purchaseShoppingItem: purchaseShoppingItemMutation.mutateAsync,
    isCreating: createShoppingItemMutation.isPending,
    isUpdating: updateShoppingItemMutation.isPending,
    isDeleting: deleteShoppingItemMutation.isPending,
    isPurchasing: purchaseShoppingItemMutation.isPending,
  };
}; 