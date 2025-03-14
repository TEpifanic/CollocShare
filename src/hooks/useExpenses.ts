import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Types
export interface Expense {
  id: string;
  colocationId: string;
  paidByUserId: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  receipt?: string | null;
  splitType?: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  paidBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  participants?: ExpenseParticipant[];
}

export interface ExpenseParticipant {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  isPaid: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface Settlement {
  id: string;
  expenseId: string;
  colocationId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  toUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  expense?: Expense;
}

export interface Balance {
  members: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    balance: number;
  }>;
  balances: Record<string, Record<string, number>>;
  optimizedSettlements: Array<{
    fromUser: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    toUser: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    amount: number;
  }>;
}

export interface CreateExpenseData {
  colocationId: string;
  amount: number;
  description: string;
  category: string;
  date: Date | string;
  paidByUserId: string;
  splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  participants?: Array<{
    userId: string;
    amount: number;
    isPaid?: boolean;
  }>;
}

export interface CreateSettlementData {
  colocationId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
}

export type ExpenseSplitType = "EQUAL" | "CUSTOM";

export interface ExpenseParticipant {
  id?: string;
  userId: string;
  amount: number;
  isPaid?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: Date;
  description?: string;
  payerId: string;
  colocationId: string;
  splitType: ExpenseSplitType;
  participants: ExpenseParticipant[];
  createdAt: Date;
  updatedAt: Date;
  payer?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface UpdateExpenseData {
  id: string;
  title?: string;
  amount?: number;
  date?: Date;
  description?: string;
  payerId?: string;
  splitType?: ExpenseSplitType;
  participants?: ExpenseParticipant[];
}

// Hook principal
export const useExpenses = () => {
  const queryClient = useQueryClient();

  // Récupérer les dépenses d'une colocation
  const getExpenses = async (colocationId: string) => {
    try {
      const response = await axios.get(`/api/expenses?colocationId=${colocationId}`);
      return response.data.expenses;
    } catch (error) {
      console.error('Erreur lors de la récupération des dépenses:', error);
      throw error;
    }
  };

  // Récupérer les détails d'une dépense
  const getExpenseDetails = async (expenseId: string) => {
    try {
      const response = await axios.get(`/api/expenses/${expenseId}`);
      return response.data.expense;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la dépense:', error);
      throw error;
    }
  };

  // Créer une nouvelle dépense
  const createExpense = async (data: CreateExpenseData) => {
    try {
      const response = await axios.post('/api/expenses', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la dépense:', error);
      throw error;
    }
  };

  // Mettre à jour une dépense
  const updateExpense = async ({ id, ...data }: CreateExpenseData & { id: string }) => {
    try {
      const response = await axios.put(`/api/expenses/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dépense:', error);
      throw error;
    }
  };

  // Supprimer une dépense
  const deleteExpense = async (id: string) => {
    try {
      const response = await axios.delete(`/api/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error);
      throw error;
    }
  };

  // Créer un remboursement
  const createSettlement = async (data: CreateSettlementData) => {
    try {
      const response = await axios.post('/api/expenses/settlements', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du remboursement:', error);
      throw error;
    }
  };

  // Récupérer les remboursements d'une colocation
  const getSettlements = async (colocationId: string) => {
    try {
      const response = await axios.get(`/api/expenses/settlements?colocationId=${colocationId}`);
      return response.data.settlements;
    } catch (error) {
      console.error('Erreur lors de la récupération des remboursements:', error);
      throw error;
    }
  };

  // Récupérer les soldes entre membres
  const getBalances = async (colocationId: string) => {
    try {
      const response = await axios.get(`/api/expenses/balance/${colocationId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des soldes:', error);
      throw error;
    }
  };

  // Query pour récupérer les dépenses
  const useExpensesQuery = (colocationId: string) => {
    return useQuery({
      queryKey: ['expenses', colocationId],
      queryFn: () => getExpenses(colocationId),
      enabled: !!colocationId,
    });
  };

  // Query pour récupérer les détails d'une dépense
  const useExpenseDetailsQuery = (expenseId: string) => {
    return useQuery({
      queryKey: ['expense', expenseId],
      queryFn: () => getExpenseDetails(expenseId),
      enabled: !!expenseId,
    });
  };

  // Query pour récupérer les remboursements
  const useSettlementsQuery = (colocationId: string) => {
    return useQuery({
      queryKey: ['settlements', colocationId],
      queryFn: () => getSettlements(colocationId),
      enabled: !!colocationId,
    });
  };

  // Query pour récupérer les soldes
  const useBalancesQuery = (colocationId: string) => {
    return useQuery({
      queryKey: ['balances', colocationId],
      queryFn: () => getBalances(colocationId),
      enabled: !!colocationId,
    });
  };

  // Mutation pour créer une dépense
  const useCreateExpenseMutation = () => {
    return useMutation({
      mutationFn: createExpense,
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['expenses', variables.colocationId] });
        queryClient.invalidateQueries({ queryKey: ['balances', variables.colocationId] });
        toast.success('Dépense créée avec succès');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création de la dépense');
      },
    });
  };

  // Mutation pour mettre à jour une dépense
  const useUpdateExpenseMutation = () => {
    return useMutation({
      mutationFn: updateExpense,
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['expenses', variables.colocationId] });
        queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['balances', variables.colocationId] });
        toast.success('Dépense mise à jour avec succès');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de la dépense');
      },
    });
  };

  // Mutation pour supprimer une dépense
  const useDeleteExpenseMutation = (colocationId: string) => {
    return useMutation({
      mutationFn: deleteExpense,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['expenses', colocationId] });
        queryClient.invalidateQueries({ queryKey: ['balances', colocationId] });
        toast.success('Dépense supprimée avec succès');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la dépense');
      },
    });
  };

  // Mutation pour créer un remboursement
  const useCreateSettlementMutation = () => {
    return useMutation({
      mutationFn: createSettlement,
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['settlements', variables.colocationId] });
        queryClient.invalidateQueries({ queryKey: ['balances', variables.colocationId] });
        toast.success('Remboursement créé avec succès');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création du remboursement');
      },
    });
  };

  return {
    // Queries
    useExpensesQuery,
    useExpenseDetailsQuery,
    useSettlementsQuery,
    useBalancesQuery,
    
    // Mutations
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
    useCreateSettlementMutation,
    
    // Fonctions directes
    getExpenses,
    getExpenseDetails,
    createExpense,
    updateExpense,
    deleteExpense,
    createSettlement,
    getSettlements,
    getBalances,
  };
}; 