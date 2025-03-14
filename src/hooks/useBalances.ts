import { useQuery } from "@tanstack/react-query";

export interface UserBalance {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  balance: number;
}

export interface UserDebt {
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  fromUserImage?: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  toUserImage?: string;
  amount: number;
}

export interface BalanceSummary {
  userBalances: UserBalance[];
  debts: UserDebt[];
}

// Fonction pour vérifier si des remboursements existent pour une colocation
const checkReimbursements = async (colocationId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/reimbursements?colocationId=${colocationId}`);
    
    if (response.ok) {
      const reimbursements = await response.json();
      console.log(`Vérification des remboursements pour la colocation ${colocationId}:`, reimbursements);
      
      return Array.isArray(reimbursements) && reimbursements.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification des remboursements:", error);
    return false;
  }
};

const getBalances = async (colocationId: string): Promise<BalanceSummary> => {
  try {
    // Vérifier d'abord si des remboursements existent
    const hasReimbursements = await checkReimbursements(colocationId);
    console.log(`La colocation ${colocationId} a-t-elle des remboursements?`, hasReimbursements);
    
    // Essayer d'abord l'API principale
    const response = await fetch(`/api/expenses/balance/${colocationId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Données brutes de l'API principale:", data);
      
      // Vérifier le format des données
      if (data.members) {
        console.log("Format des soldes dans l'API principale:");
        data.members.forEach((member: any, index: number) => {
          console.log(`Membre ${index}:`, member.id, member.name, "Balance:", member.balance, "Type:", typeof member.balance);
          
          // Vérifier si le montant est aberrant
          if (typeof member.balance === 'string' && member.balance.length > 4) {
            console.warn(`Montant potentiellement en centimes pour ${member.name}: ${member.balance}`);
          }
        });
      }
      
      if (data.optimizedSettlements) {
        console.log("Format des remboursements dans l'API principale:");
        data.optimizedSettlements.forEach((settlement: any, index: number) => {
          console.log(`Remboursement ${index}:`, settlement.fromUser.id, "->", settlement.toUser.id, "Montant:", settlement.amount, "Type:", typeof settlement.amount);
          
          // Vérifier si le montant est aberrant
          if (typeof settlement.amount === 'string' && settlement.amount.length > 4) {
            console.warn(`Montant potentiellement en centimes pour remboursement: ${settlement.amount}`);
          }
        });
      }
      
      // Vérifier si les données semblent être en centimes
      let isCentsFormat = false;
      if (data.members && data.members.length > 0) {
        const balances = data.members.map((m: any) => typeof m.balance === 'string' ? parseFloat(m.balance) : m.balance);
        const maxBalance = Math.max(...balances.map(Math.abs));
        if (maxBalance > 1000) {
          console.warn(`Montants probablement en centimes, valeur max: ${maxBalance}`);
          isCentsFormat = true;
        }
      }
      
      // Adapter les données au format attendu
      const adaptedData = adaptApiDataToBalanceSummary(data);
      
      // Si les montants semblent être en centimes, les diviser par 100
      if (isCentsFormat) {
        console.log("Conversion des montants de centimes en euros");
        adaptedData.userBalances = adaptedData.userBalances.map(balance => ({
          ...balance,
          balance: balance.balance / 100
        }));
        
        adaptedData.debts = adaptedData.debts.map(debt => ({
          ...debt,
          amount: debt.amount / 100
        }));
      }
      
      // Si des remboursements existent, réinitialiser les soldes et les dettes
      if (hasReimbursements) {
        console.log("Des remboursements existent, réinitialisation des soldes et des dettes");
        adaptedData.userBalances = adaptedData.userBalances.map(balance => ({
          ...balance,
          balance: 0
        }));
        
        adaptedData.debts = [];
      }
      
      console.log("Données finales après adaptation:", adaptedData);
      return adaptedData;
    }
    
    console.warn("L'API principale des soldes a échoué, essai de l'API de secours...");
    
    // Si l'API principale échoue, essayer l'API de secours
    const fallbackResponse = await fetch(`/api/balances/${colocationId}`);
    
    if (!fallbackResponse.ok) {
      throw new Error("Erreur lors de la récupération des soldes");
    }
    
    const fallbackData = await fallbackResponse.json();
    console.log("Données brutes de l'API de secours:", fallbackData);
    
    // L'API de secours renvoie déjà les données au bon format
    return adaptApiDataToBalanceSummary(fallbackData);
  } catch (error) {
    console.error("Erreur lors de la récupération des soldes:", error);
    throw error;
  }
};

// Fonction pour adapter les données de l'API au format attendu
function adaptApiDataToBalanceSummary(apiData: any): BalanceSummary {
  console.log("Adaptation des données brutes:", apiData);
  
  // Si les données sont déjà au bon format, les renvoyer telles quelles
  if (apiData.userBalances && apiData.debts) {
    // S'assurer que les montants sont des nombres
    const userBalances = apiData.userBalances.map((balance: any) => {
      // Convertir la balance en nombre
      let numericBalance = typeof balance.balance === 'string' 
        ? parseFloat(balance.balance) 
        : balance.balance;
      
      // Vérifier si le montant est aberrant (trop grand)
      if (Math.abs(numericBalance) > 1000) {
        console.warn(`Montant aberrant détecté pour ${balance.userName}: ${numericBalance}`);
        // Diviser par 100 pour corriger les montants en centimes
        numericBalance = numericBalance / 100;
      }
      
      return {
        ...balance,
        balance: numericBalance
      };
    });
    
    const debts = apiData.debts.map((debt: any) => {
      // Convertir le montant en nombre
      let numericAmount = typeof debt.amount === 'string' 
        ? parseFloat(debt.amount) 
        : debt.amount;
      
      // Vérifier si le montant est aberrant (trop grand)
      if (Math.abs(numericAmount) > 1000) {
        console.warn(`Montant aberrant détecté pour remboursement de ${debt.fromUserName} à ${debt.toUserName}: ${numericAmount}`);
        // Diviser par 100 pour corriger les montants en centimes
        numericAmount = numericAmount / 100;
      }
      
      return {
        ...debt,
        amount: numericAmount
      };
    });
    
    return { userBalances, debts };
  }
  
  // Sinon, adapter les données
  const userBalances: UserBalance[] = apiData.members?.map((member: any) => {
    // Convertir la balance en nombre
    let numericBalance = typeof member.balance === 'string' 
      ? parseFloat(member.balance) 
      : member.balance;
    
    // Vérifier si le montant est aberrant (trop grand)
    if (Math.abs(numericBalance) > 1000) {
      console.warn(`Montant aberrant détecté pour ${member.name}: ${numericBalance}`);
      // Diviser par 100 pour corriger les montants en centimes
      numericBalance = numericBalance / 100;
    }
    
    return {
      userId: member.id,
      userName: member.name,
      userEmail: member.email,
      userImage: member.avatar,
      balance: numericBalance
    };
  }) || [];
  
  const debts: UserDebt[] = apiData.optimizedSettlements?.map((settlement: any) => {
    // Convertir le montant en nombre
    let numericAmount = typeof settlement.amount === 'string' 
      ? parseFloat(settlement.amount) 
      : settlement.amount;
    
    // Vérifier si le montant est aberrant (trop grand)
    if (Math.abs(numericAmount) > 1000) {
      console.warn(`Montant aberrant détecté pour remboursement de ${settlement.fromUser.name} à ${settlement.toUser.name}: ${numericAmount}`);
      // Diviser par 100 pour corriger les montants en centimes
      numericAmount = numericAmount / 100;
    }
    
    return {
      fromUserId: settlement.fromUser.id,
      fromUserName: settlement.fromUser.name,
      fromUserEmail: settlement.fromUser.email,
      fromUserImage: settlement.fromUser.avatar,
      toUserId: settlement.toUser.id,
      toUserName: settlement.toUser.name,
      toUserEmail: settlement.toUser.email,
      toUserImage: settlement.toUser.avatar,
      amount: numericAmount
    };
  }) || [];
  
  const result = {
    userBalances,
    debts
  };
  
  console.log("Données adaptées:", result);
  return result;
}

export const useBalances = () => {
  const useBalancesQuery = (colocationId: string) => {
    return useQuery({
      queryKey: ["balances", colocationId],
      queryFn: () => getBalances(colocationId),
      enabled: !!colocationId,
      retry: 2, // Réessayer 2 fois en cas d'échec
      staleTime: 1000 * 60 * 5, // Considérer les données comme fraîches pendant 5 minutes
    });
  };

  return {
    useBalancesQuery,
  };
};

export default useBalances; 