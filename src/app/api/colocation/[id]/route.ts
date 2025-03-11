import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/colocation/[id] - Récupère les détails d'une colocation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur est membre de la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId: id,
        leftAt: null, // Uniquement les adhésions actives
      },
    });
    
    if (!membership) {
      return NextResponse.json(
        { message: "Vous n'êtes pas membre de cette colocation." },
        { status: 403 }
      );
    }
    
    // Récupérer les détails de la colocation
    const colocation = await prisma.colocation.findUnique({
      where: { id },
    });
    
    if (!colocation) {
      return NextResponse.json(
        { message: "Colocation non trouvée" },
        { status: 404 }
      );
    }
    
    // Récupérer les membres de la colocation
    const membres = await prisma.membership.findMany({
      where: {
        colocationId: id,
        leftAt: null, // Uniquement les adhésions actives
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
    
    return NextResponse.json({
      colocation,
      membres,
      isAdmin: membership.role === "ADMIN",
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de la colocation:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération des détails de la colocation" },
      { status: 500 }
    );
  }
}

// DELETE /api/colocation/[id] - Supprimer une colocation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur est administrateur de la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId: id,
        role: "ADMIN",
        leftAt: null, // Uniquement les adhésions actives
      },
    });
    
    if (!membership) {
      return NextResponse.json(
        { message: "Vous devez être administrateur pour supprimer cette colocation." },
        { status: 403 }
      );
    }
    
    // Vérifier que la colocation existe
    const colocation = await prisma.colocation.findUnique({
      where: { id },
    });
    
    if (!colocation) {
      return NextResponse.json(
        { message: "Colocation non trouvée" },
        { status: 404 }
      );
    }
    
    // Supprimer la colocation et toutes les données associées (grâce aux relations onDelete: Cascade)
    await prisma.colocation.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: "Colocation supprimée avec succès",
    });
    
  } catch (error) {
    console.error("Erreur lors de la suppression de la colocation:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la suppression de la colocation" },
      { status: 500 }
    );
  }
} 