import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Reimbursement {
  id: string;
  amount: number;
  date: Date;
  description: string;
  fromUserId: string;
  toUserId: string;
  colocationId: string;
  createdAt: Date;
  updatedAt: Date;
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateReimbursementData {
  amount: number;
  date: Date;
  description: string;
  fromUserId: string;
  toUserId: string;
  colocationId: string;
}

export interface UpdateReimbursementData {
  amount?: number;
  date?: Date;
  description?: string;
}

const getReimbursements = async (colocationId: string): Promise<Reimbursement[]> => {
  try {
    const response = await fetch(`/api/reimbursements?colocationId=${colocationId}`);
    
    if (!response.ok) {
      console.warn(`Erreur lors de la récupération des remboursements: ${response.status} ${response.statusText}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des remboursements:", error);
    return [];
  }
};

const getReimbursementById = async (reimbursementId: string): Promise<Reimbursement> => {
  const response = await fetch(`/api/reimbursements/${reimbursementId}`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du remboursement");
  }
  return response.json();
};

const createReimbursement = async (data: CreateReimbursementData): Promise<Reimbursement> => {
  try {
    console.log("Création d'un remboursement avec les données:", data);
    
    const response = await fetch("/api/reimbursements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur lors de la création du remboursement: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Erreur lors de la création du remboursement: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la création du remboursement:", error);
    throw new Error("Erreur lors de la création du remboursement");
  }
};

const updateReimbursement = async (
  id: string,
  data: UpdateReimbursementData
): Promise<Reimbursement> => {
  try {
    const response = await fetch(`/api/reimbursements/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur lors de la mise à jour du remboursement: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Erreur lors de la mise à jour du remboursement: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la mise à jour du remboursement:", error);
    throw new Error("Erreur lors de la mise à jour du remboursement");
  }
};

const deleteReimbursement = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/reimbursements/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur lors de la suppression du remboursement: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Erreur lors de la suppression du remboursement: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du remboursement:", error);
    throw new Error("Erreur lors de la suppression du remboursement");
  }
};

export const useReimbursements = (colocationId?: string) => {
  const queryClient = useQueryClient();

  const { data: reimbursements = [], isLoading, error, refetch } = useQuery({
    queryKey: ["reimbursements", colocationId],
    queryFn: () => (colocationId ? getReimbursements(colocationId) : Promise.resolve([])),
    enabled: !!colocationId,
    staleTime: 1000 * 60 * 5,
  });

  const createReimbursementMutation = useMutation({
    mutationFn: createReimbursement,
    onSuccess: () => {
      toast.success("Remboursement créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["reimbursements", colocationId] });
      queryClient.invalidateQueries({ queryKey: ["balances", colocationId] });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la création du remboursement:", error);
      toast.error(`Erreur lors de la création du remboursement: ${error.message}`);
    },
  });

  const updateReimbursementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReimbursementData }) =>
      updateReimbursement(id, data),
    onSuccess: () => {
      toast.success("Remboursement mis à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["reimbursements", colocationId] });
      queryClient.invalidateQueries({ queryKey: ["balances", colocationId] });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour du remboursement:", error);
      toast.error(`Erreur lors de la mise à jour du remboursement: ${error.message}`);
    },
  });

  const deleteReimbursementMutation = useMutation({
    mutationFn: deleteReimbursement,
    onSuccess: () => {
      toast.success("Remboursement supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["reimbursements", colocationId] });
      queryClient.invalidateQueries({ queryKey: ["balances", colocationId] });
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la suppression du remboursement:", error);
      toast.error(`Erreur lors de la suppression du remboursement: ${error.message}`);
    },
  });

  return {
    reimbursements,
    isLoading,
    error,
    refetch,
    createReimbursement: createReimbursementMutation.mutateAsync,
    updateReimbursement: updateReimbursementMutation.mutateAsync,
    deleteReimbursement: deleteReimbursementMutation.mutateAsync,
    isCreating: createReimbursementMutation.isPending,
    isUpdating: updateReimbursementMutation.isPending,
    isDeleting: deleteReimbursementMutation.isPending,
  };
};

export default useReimbursements; 