import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Interface pour les participants personnalisés
interface CustomParticipant {
  userId: string;
  amount: string | number;
}

// GET /api/expenses - Récupérer toutes les dépenses d'une colocation
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

    // Récupérer le paramètre colocationId de la requête
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
        colocationId: colocationId,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Vous n'êtes pas membre de cette colocation" },
        { status: 403 }
      );
    }

    // Récupérer toutes les dépenses de la colocation avec les détails du payeur
    // @ts-ignore - Ignorer l'erreur de type pour participants
    const expenses = await prisma.expense.findMany({
      where: {
        colocationId: colocationId,
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
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Erreur lors de la récupération des dépenses:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération des dépenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Créer une nouvelle dépense
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
    const { 
      colocationId, 
      amount, 
      description, 
      category, 
      date, 
      splitType = "EQUAL", 
      participants 
    } = data;

    // Validation des données
    if (!colocationId || !amount || !description || !category || !date) {
      return NextResponse.json(
        { message: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est membre de la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId: colocationId,
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
        colocationId: colocationId,
        leftAt: null,
      },
      select: {
        userId: true,
      },
    });

    const memberIds = members.map(member => member.userId);

    // Créer la dépense et les participants dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer la dépense
      // @ts-ignore - Ignorer l'erreur de type pour splitType
      const expense = await tx.expense.create({
        data: {
          colocationId,
          paidByUserId: session.user.id,
          amount: parseFloat(amount.toString()),
          description,
          category,
          date: new Date(date),
          splitType,
        },
      });

      // Déterminer les montants pour chaque participant
      let participantsData = [];

      if (splitType === "EQUAL") {
        // Répartition égale entre tous les membres
        const amountPerPerson = parseFloat(amount.toString()) / memberIds.length;
        
        participantsData = memberIds.map(userId => ({
          expenseId: expense.id,
          userId,
          amount: amountPerPerson,
          isPaid: userId === session.user.id, // Le payeur a déjà "payé" sa part
        }));
      } else if (splitType === "CUSTOM" && participants && participants.length > 0) {
        // Répartition personnalisée
        participantsData = (participants as CustomParticipant[]).map(participant => ({
          expenseId: expense.id,
          userId: participant.userId,
          amount: parseFloat(participant.amount.toString()),
          isPaid: participant.userId === session.user.id,
        }));
      } else {
        throw new Error("Type de répartition non valide ou participants manquants");
      }

      // Créer les participants un par un
      // @ts-ignore - Ignorer l'erreur de type pour expenseParticipant
      for (const participant of participantsData) {
        await tx.expenseParticipant.create({
          data: participant
        });
      }

      return {
        expense,
        participantsData,
      };
    });

    return NextResponse.json({ 
      message: "Dépense créée avec succès", 
      expense: result.expense,
      participants: result.participantsData,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la dépense:", error);
    return NextResponse.json(
      { 
        message: "Une erreur est survenue lors de la création de la dépense",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 