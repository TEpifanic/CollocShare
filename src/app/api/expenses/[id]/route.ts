import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/expenses/[id] - Récupérer les détails d'une dépense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de dépense manquant" },
        { status: 400 }
      );
    }

    // Récupérer la dépense avec ses détails
    // @ts-ignore - Ignorer l'erreur de type pour participants
    const expense = await prisma.expense.findUnique({
      where: {
        id: id,
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

    if (!expense) {
      return NextResponse.json(
        { message: "Dépense non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est membre de la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId: expense.colocationId,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Vous n'êtes pas membre de cette colocation" },
        { status: 403 }
      );
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Erreur lors de la récupération de la dépense:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération de la dépense" },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[id] - Mettre à jour une dépense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de dépense manquant" },
        { status: 400 }
      );
    }

    // Récupérer les données de la requête
    const data = await request.json();
    const { 
      amount, 
      description, 
      category, 
      date, 
      participants 
    } = data;

    // Validation des données
    if (!amount || !description || !category || !date) {
      return NextResponse.json(
        { message: "Données manquantes" },
        { status: 400 }
      );
    }

    // Récupérer la dépense existante
    const expense = await prisma.expense.findUnique({
      where: {
        id: id,
      },
      include: {
        participants: true,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { message: "Dépense non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est membre de la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId: expense.colocationId,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Vous n'êtes pas membre de cette colocation" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur est le créateur de la dépense ou un admin
    if (expense.paidByUserId !== session.user.id && membership.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Vous n'êtes pas autorisé à modifier cette dépense" },
        { status: 403 }
      );
    }

    // Mettre à jour la dépense et les participants dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour la dépense
      const updatedExpense = await tx.expense.update({
        where: {
          id: id,
        },
        data: {
          amount: parseFloat(amount.toString()),
          description,
          category,
          date: new Date(date),
        },
      });

      // Si des participants sont fournis, mettre à jour les participants
      if (participants && participants.length > 0) {
        // Supprimer les participants existants
        await tx.expenseParticipant.deleteMany({
          where: {
            expenseId: id,
          },
        });

        // Créer les nouveaux participants
        for (const participant of participants) {
          // @ts-ignore - Ignorer l'erreur de type pour expenseParticipant
          await tx.expenseParticipant.create({
            data: {
              expenseId: id,
              userId: participant.userId,
              amount: parseFloat(participant.amount.toString()),
              isPaid: participant.isPaid || participant.userId === session.user.id,
            },
          });
        }
      }

      return updatedExpense;
    });

    return NextResponse.json({ 
      message: "Dépense mise à jour avec succès", 
      expense: result,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la dépense:", error);
    return NextResponse.json(
      { 
        message: "Une erreur est survenue lors de la mise à jour de la dépense",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Supprimer une dépense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de dépense manquant" },
        { status: 400 }
      );
    }

    // Récupérer la dépense existante
    const expense = await prisma.expense.findUnique({
      where: {
        id: id,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { message: "Dépense non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est membre de la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId: expense.colocationId,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Vous n'êtes pas membre de cette colocation" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur est le créateur de la dépense ou un admin
    if (expense.paidByUserId !== session.user.id && membership.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Vous n'êtes pas autorisé à supprimer cette dépense" },
        { status: 403 }
      );
    }

    // Supprimer la dépense (les participants seront supprimés automatiquement grâce à onDelete: Cascade)
    await prisma.expense.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ 
      message: "Dépense supprimée avec succès", 
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la dépense:", error);
    return NextResponse.json(
      { 
        message: "Une erreur est survenue lors de la suppression de la dépense",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 