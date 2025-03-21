import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/colocation/active - Récupérer la colocation active de l'utilisateur
export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Vous devez être connecté" }, { status: 401 });
    }

    // Récupérer l'utilisateur connecté
    const userId = session.user.id;
    
    // Rechercher la première colocation active de l'utilisateur
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        leftAt: null, // Membre actif (n'a pas quitté)
      },
      orderBy: {
        joinedAt: 'desc', // La plus récente en premier
      },
      include: {
        colocation: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ colocation: null }, { status: 200 });
    }

    // Récupérer les membres de la colocation
    const members = await prisma.membership.findMany({
      where: {
        colocationId: membership.colocationId,
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

    // Transformer le format des membres pour correspondre à l'interface attendue
    const formattedMembers = members.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      leftAt: member.leftAt,
      isCurrentUser: member.userId === userId,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
      },
    }));

    // Construire l'objet colocation avec les membres
    const colocation = {
      ...membership.colocation,
      members: formattedMembers,
    };

    return NextResponse.json({ colocation }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération de la colocation active:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération de la colocation active" },
      { status: 500 }
    );
  }
} 