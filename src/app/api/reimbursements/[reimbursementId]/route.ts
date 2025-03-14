import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/reimbursements/[reimbursementId] - Récupérer un remboursement
export async function GET(
  request: NextRequest,
  { params }: { params: { reimbursementId: string } }
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

    const { reimbursementId } = params;

    if (!reimbursementId) {
      return NextResponse.json(
        { message: "ID de remboursement manquant" },
        { status: 400 }
      );
    }

    // Simuler un remboursement
    const mockReimbursement = {
      id: reimbursementId,
      amount: 10,
      date: new Date(),
      description: "Remboursement simulé",
      fromUserId: "user-1",
      toUserId: "user-2",
      colocationId: "colocation-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      fromUser: {
        id: "user-1",
        name: "Utilisateur 1",
        email: "user1@example.com"
      },
      toUser: {
        id: "user-2",
        name: "Utilisateur 2",
        email: "user2@example.com"
      }
    };

    return NextResponse.json(mockReimbursement);
  } catch (error) {
    console.error("Erreur lors de la récupération du remboursement:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération du remboursement" },
      { status: 500 }
    );
  }
}

// PUT /api/reimbursements/[reimbursementId] - Mettre à jour un remboursement
export async function PUT(
  request: NextRequest,
  { params }: { params: { reimbursementId: string } }
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

    const { reimbursementId } = params;
    const data = await request.json();

    if (!reimbursementId) {
      return NextResponse.json(
        { message: "ID de remboursement manquant" },
        { status: 400 }
      );
    }

    // Simuler la mise à jour d'un remboursement
    const mockReimbursement = {
      id: reimbursementId,
      amount: data.amount || 10,
      date: data.date || new Date(),
      description: data.description || "Remboursement simulé",
      fromUserId: "user-1",
      toUserId: "user-2",
      colocationId: "colocation-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      fromUser: {
        id: "user-1",
        name: "Utilisateur 1",
        email: "user1@example.com"
      },
      toUser: {
        id: "user-2",
        name: "Utilisateur 2",
        email: "user2@example.com"
      }
    };

    return NextResponse.json(mockReimbursement);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du remboursement:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la mise à jour du remboursement" },
      { status: 500 }
    );
  }
}

// DELETE /api/reimbursements/[reimbursementId] - Supprimer un remboursement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reimbursementId: string } }
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

    const { reimbursementId } = params;

    if (!reimbursementId) {
      return NextResponse.json(
        { message: "ID de remboursement manquant" },
        { status: 400 }
      );
    }

    // Simuler la suppression d'un remboursement
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du remboursement:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la suppression du remboursement" },
      { status: 500 }
    );
  }
} 