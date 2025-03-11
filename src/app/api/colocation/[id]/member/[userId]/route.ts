import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE /api/colocation/[id]/member/[userId] - Supprimer un membre d'une colocation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const { id: colocationId, userId: memberToRemoveId } = params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur est administrateur de la colocation
    const currentUserMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId,
        role: "ADMIN",
        leftAt: null, // Uniquement les adhésions actives
      },
    });
    
    if (!currentUserMembership) {
      return NextResponse.json(
        { message: "Vous devez être administrateur pour supprimer un membre." },
        { status: 403 }
      );
    }
    
    // Vérifier que le membre à supprimer existe
    const memberToRemove = await prisma.membership.findFirst({
      where: {
        userId: memberToRemoveId,
        colocationId,
        leftAt: null, // Uniquement les adhésions actives
      },
    });
    
    if (!memberToRemove) {
      return NextResponse.json(
        { message: "Ce membre n'existe pas ou a déjà quitté la colocation." },
        { status: 404 }
      );
    }
    
    // Si le membre à supprimer est un administrateur, vérifier qu'il reste au moins un autre administrateur
    if (memberToRemove.role === "ADMIN") {
      const adminCount = await prisma.membership.count({
        where: {
          colocationId,
          role: "ADMIN",
          leftAt: null,
        },
      });
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { message: "Impossible de supprimer le dernier administrateur de la colocation." },
          { status: 400 }
        );
      }
    }
    
    // Supprimer le membre (mettre à jour leftAt plutôt que de supprimer l'enregistrement)
    const updatedMembership = await prisma.membership.update({
      where: {
        id: memberToRemove.id,
      },
      data: {
        leftAt: new Date(),
      },
    });
    
    return NextResponse.json({
      message: "Membre supprimé avec succès",
      membership: updatedMembership,
    });
    
  } catch (error) {
    console.error("Erreur lors de la suppression du membre:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la suppression du membre" },
      { status: 500 }
    );
  }
} 