import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/expenses/balance/[colocationId] - Récupérer les soldes entre membres
export async function GET(
  request: NextRequest,
  { params }: { params: { colocationId: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const { colocationId } = params;

    if (!colocationId) {
      return NextResponse.json(
        { message: "ID de colocation manquant" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est membre de la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Vous n'êtes pas membre de cette colocation" },
        { status: 403 }
      );
    }

    // Récupérer tous les membres actifs de la colocation
    const members = await prisma.membership.findMany({
      where: {
        colocationId,
        leftAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Récupérer toutes les dépenses de la colocation
    // @ts-ignore - Ignorer l'erreur de type pour participants
    const expenses = await prisma.expense.findMany({
      where: {
        colocationId,
      },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Récupérer tous les remboursements de la colocation
    // @ts-ignore - Ignorer l'erreur de type pour expenseSettlement
    const settlements = await prisma.expenseSettlement.findMany({
      where: {
        colocationId,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Calculer les soldes entre membres
    const balances: Record<string, Record<string, number>> = {};
    const userBalances: Record<string, number> = {};

    // Initialiser les soldes à 0 pour tous les membres
    members.forEach((member) => {
      balances[member.userId] = {};
      userBalances[member.userId] = 0;
      
      members.forEach((otherMember) => {
        if (member.userId !== otherMember.userId) {
          balances[member.userId][otherMember.userId] = 0;
        }
      });
    });

    // Calculer les soldes à partir des dépenses
    expenses.forEach((expense) => {
      const payerId = expense.paidByUserId;
      
      // Ignorer les dépenses sans participants
      if (!expense.participants || expense.participants.length === 0) {
        return;
      }

      expense.participants.forEach((participant) => {
        const participantId = participant.userId;
        
        // Si le participant n'est pas le payeur, il doit de l'argent au payeur
        if (participantId !== payerId) {
          // Ajouter au solde du participant envers le payeur
          balances[participantId][payerId] += participant.amount;
          
          // Soustraire du solde du payeur envers le participant
          balances[payerId][participantId] -= participant.amount;
          
          // Mettre à jour les soldes globaux
          userBalances[payerId] += participant.amount;
          userBalances[participantId] -= participant.amount;
        }
      });
    });

    // Prendre en compte les remboursements
    settlements.forEach((settlement) => {
      const fromUserId = settlement.fromUserId;
      const toUserId = settlement.toUserId;
      const amount = settlement.amount;
      
      // Mettre à jour les soldes entre les deux utilisateurs
      balances[fromUserId][toUserId] -= amount;
      balances[toUserId][fromUserId] += amount;
      
      // Mettre à jour les soldes globaux
      userBalances[fromUserId] -= amount;
      userBalances[toUserId] += amount;
    });

    // Simplifier les soldes (ne garder que les soldes positifs)
    const simplifiedBalances: Record<string, Record<string, number>> = {};
    
    members.forEach((member) => {
      simplifiedBalances[member.userId] = {};
      
      members.forEach((otherMember) => {
        if (member.userId !== otherMember.userId) {
          const balance = balances[member.userId][otherMember.userId];
          
          // Ne garder que les soldes positifs (ce que l'utilisateur doit aux autres)
          if (balance > 0) {
            simplifiedBalances[member.userId][otherMember.userId] = balance;
          }
        }
      });
    });

    // Préparer les données de réponse
    const result = {
      members: members.map((member) => ({
        ...member.user,
        balance: userBalances[member.userId],
      })),
      balances: simplifiedBalances,
      // Optimiser les remboursements (algorithme de simplification des dettes)
      optimizedSettlements: calculateOptimizedSettlements(balances, members),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors du calcul des soldes:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors du calcul des soldes",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Fonction pour calculer les remboursements optimisés
function calculateOptimizedSettlements(
  balances: Record<string, Record<string, number>>,
  members: any[]
) {
  // Créer un tableau de soldes nets pour chaque membre
  const netBalances: { userId: string; balance: number; user: any }[] = [];
  
  members.forEach((member) => {
    let netBalance = 0;
    
    // Calculer le solde net (ce que le membre doit - ce qu'on lui doit)
    Object.keys(balances[member.userId]).forEach((otherUserId) => {
      netBalance += balances[member.userId][otherUserId];
    });
    
    netBalances.push({
      userId: member.userId,
      balance: netBalance,
      user: member.user,
    });
  });
  
  // Trier les membres par solde (du plus négatif au plus positif)
  netBalances.sort((a, b) => a.balance - b.balance);
  
  const settlements: {
    fromUser: any;
    toUser: any;
    amount: number;
  }[] = [];
  
  // Tant qu'il y a des soldes non nuls
  while (netBalances.length > 1 && Math.abs(netBalances[0].balance) > 0.01) {
    const debtor = netBalances[0]; // Celui qui doit le plus d'argent (solde négatif)
    const creditor = netBalances[netBalances.length - 1]; // Celui à qui on doit le plus (solde positif)
    
    // Montant du remboursement (minimum entre ce que le débiteur doit et ce que le créditeur doit recevoir)
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    
    if (amount > 0) {
      // Ajouter le remboursement à la liste
      settlements.push({
        fromUser: debtor.user,
        toUser: creditor.user,
        amount: parseFloat(amount.toFixed(2)),
      });
      
      // Mettre à jour les soldes
      debtor.balance += amount;
      creditor.balance -= amount;
    }
    
    // Retirer les membres dont le solde est nul (ou presque)
    if (Math.abs(debtor.balance) < 0.01) {
      netBalances.shift();
    }
    
    if (netBalances.length > 0 && Math.abs(netBalances[netBalances.length - 1].balance) < 0.01) {
      netBalances.pop();
    }
    
    // Retrier le tableau après les modifications
    netBalances.sort((a, b) => a.balance - b.balance);
  }
  
  return settlements;
} 