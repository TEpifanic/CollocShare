import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/expenses/settlements - Créer un remboursement
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // Récupérer les données de la requête
    const data = await request.json();
    const { colocationId, fromUserId, toUserId, amount, description } = data;

    // Validation des données
    if (!colocationId || !fromUserId || !toUserId || !amount) {
      return NextResponse.json(
        { message: "Données manquantes" },
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

    // Vérifier que les utilisateurs concernés sont membres de la colocation
    const fromUserMembership = await prisma.membership.findFirst({
      where: {
        userId: fromUserId,
        colocationId,
        leftAt: null,
      },
    });

    const toUserMembership = await prisma.membership.findFirst({
      where: {
        userId: toUserId,
        colocationId,
        leftAt: null,
      },
    });

    if (!fromUserMembership || !toUserMembership) {
      return NextResponse.json(
        { message: "Un des utilisateurs n'est pas membre de cette colocation" },
        { status: 400 }
      );
    }

    // Créer une dépense spéciale pour le remboursement
    const settlement = await prisma.$transaction(async (tx) => {
      // Créer une dépense de type remboursement
      const expense = await tx.expense.create({
        data: {
          colocationId,
          paidByUserId: fromUserId,
          amount: parseFloat(amount.toString()),
          description: description || "Remboursement",
          category: "REMBOURSEMENT",
          date: new Date(),
          // @ts-ignore - Ignorer l'erreur de type pour splitType
          splitType: "CUSTOM",
        },
      });

      // Créer un participant pour celui qui reçoit le remboursement
      // @ts-ignore - Ignorer l'erreur de type pour expenseParticipant
      await tx.expenseParticipant.create({
        data: {
          expenseId: expense.id,
          userId: toUserId,
          amount: parseFloat(amount.toString()),
          isPaid: false,
        },
      });

      // Créer l'enregistrement de remboursement
      // @ts-ignore - Ignorer l'erreur de type pour expenseSettlement
      const settlementRecord = await tx.expenseSettlement.create({
        data: {
          expenseId: expense.id,
          colocationId,
          fromUserId,
          toUserId,
          amount: parseFloat(amount.toString()),
        },
      });

      return {
        expense,
        settlement: settlementRecord,
      };
    });

    return NextResponse.json({
      message: "Remboursement créé avec succès",
      data: settlement,
    });
  } catch (error) {
    console.error("Erreur lors de la création du remboursement:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de la création du remboursement",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET /api/expenses/settlements?colocationId=xxx - Récupérer tous les remboursements d'une colocation
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // Récupérer l'ID de la colocation depuis les paramètres de requête
    const { searchParams } = new URL(request.url);
    const colocationId = searchParams.get("colocationId");

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
        expense: true,
      },
      orderBy: {
        expense: {
          date: "desc",
        },
      },
    });

    return NextResponse.json({ settlements });
  } catch (error) {
    console.error("Erreur lors de la récupération des remboursements:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de la récupération des remboursements",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 