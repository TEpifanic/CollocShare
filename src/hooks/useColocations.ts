import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Colocation {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    leftAt: string | null;
    isCurrentUser: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    }
  }>;
}

export interface CreateColocationData {
  name: string;
  address: string;
}

export interface InviteUserData {
  email: string;
  colocationId: string;
}

export interface RemoveMemberData {
  colocationId: string;
  userId: string;
}

export const useColocations = () => {
  const queryClient = useQueryClient();

  // Récupérer les colocations de l'utilisateur
  const getColocations = async (): Promise<Colocation[]> => {
    const response = await axios.get("/api/colocation");
    return response.data.colocations;
  };

  // Récupérer les détails d'une colocation spécifique
  const getColocationDetails = async (colocationId: string): Promise<Colocation> => {
    const response = await axios.get(`/api/colocation/${colocationId}`);
    
    // Correction du problème: l'API renvoie les membres sous la clé 'membres' (en français)
    // mais notre interface attend 'members' (en anglais)
    const colocation = response.data.colocation;
    const membres = response.data.membres;
    
    console.log("Données brutes de l'API:", response.data);
    console.log("Membres récupérés de l'API:", membres);
    
    // Ajouter les membres à l'objet colocation
    if (membres && Array.isArray(membres)) {
      colocation.members = membres.map(membre => ({
        ...membre,
        isCurrentUser: membre.user.id === (queryClient.getQueryData(["user"]) as any)?.id
      }));
    } else {
      console.error("Aucun membre trouvé dans la réponse de l'API ou format incorrect");
      colocation.members = [];
    }
    
    return colocation;
  };

  // Mutation pour créer une nouvelle colocation
  const createColocation = async (data: CreateColocationData): Promise<Colocation> => {
    console.log("Tentative de création d'une colocation:", data);
    
    try {
      const response = await axios.post("/api/colocation", data);
      console.log("Réponse création colocation réussie:", response.data);
      return response.data.colocation;
    } catch (error: any) {
      console.error("Erreur lors de la création de la colocation:", error);
      if (error.response) {
        console.error("Détails de l'erreur serveur:", {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  };

  // Mutation pour inviter un utilisateur à rejoindre une colocation
  const inviteUser = async (data: InviteUserData): Promise<any> => {
    try {
      const response = await axios.post("/api/colocation/invite", data);
      console.log("Réponse invitation:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur d'invitation:", error);
      throw error;
    }
  };

  // Mutation pour supprimer un membre d'une colocation
  const removeMember = async ({ colocationId, userId }: RemoveMemberData): Promise<any> => {
    try {
      const response = await axios.delete(`/api/colocation/${colocationId}/member/${userId}`);
      console.log("Réponse suppression membre:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la suppression du membre:", error);
      throw error;
    }
  };

  // Mutation pour supprimer une colocation
  const deleteColocation = async (colocationId: string): Promise<any> => {
    try {
      const response = await axios.delete(`/api/colocation/${colocationId}`);
      console.log("Réponse suppression colocation:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la suppression de la colocation:", error);
      throw error;
    }
  };

  // Requête pour récupérer les colocations
  const colocationsQuery = useQuery({
    queryKey: ["colocations"],
    queryFn: getColocations,
  });

  // Fonction pour créer une requête de détails de colocation
  const useColocationDetailsQuery = (colocationId: string) => {
    return useQuery({
      queryKey: ["colocation", colocationId],
      queryFn: () => getColocationDetails(colocationId),
      enabled: !!colocationId,
    });
  };

  // Mutation pour créer une colocation
  const createColocationMutation = useMutation({
    mutationFn: createColocation,
    onSuccess: () => {
      // Invalider le cache de colocations pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: ["colocations"] });
    },
  });

  // Mutation pour inviter un utilisateur
  const inviteUserMutation = useMutation({
    mutationFn: inviteUser,
  });

  // Mutation pour supprimer un membre
  const removeMemberMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      // Invalider le cache de la colocation spécifique et des colocations
      queryClient.invalidateQueries({ queryKey: ["colocations"] });
    },
  });

  // Mutation pour supprimer une colocation
  const deleteColocationMutation = useMutation({
    mutationFn: deleteColocation,
    onSuccess: () => {
      // Invalider le cache des colocations
      queryClient.invalidateQueries({ queryKey: ["colocations"] });
    },
  });

  return {
    colocations: colocationsQuery.data || [],
    isLoading: colocationsQuery.isLoading,
    isError: colocationsQuery.isError,
    error: colocationsQuery.error,
    
    createColocation: createColocationMutation.mutate,
    isCreating: createColocationMutation.isPending,
    createError: createColocationMutation.error,
    
    inviteUser: inviteUserMutation.mutate,
    isInviting: inviteUserMutation.isPending,
    inviteError: inviteUserMutation.error,
    
    removeMember: removeMemberMutation.mutate,
    isRemovingMember: removeMemberMutation.isPending,
    removeMemberError: removeMemberMutation.error,
    
    deleteColocation: deleteColocationMutation.mutate,
    isDeletingColocation: deleteColocationMutation.isPending,
    deleteColocationError: deleteColocationMutation.error,
    
    // Ajouter la fonction pour récupérer les détails d'une colocation
    useColocationDetailsQuery,
  };
}; 