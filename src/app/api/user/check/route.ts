import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/user/check - Vérifie si l'utilisateur de la session existe dans la base de données
export async function GET() {
  try {
    // Récupérer la session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur existe dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });
    
    if (!user) {
      console.error(`Utilisateur introuvable : ID=${session.user.id}, Email=${session.user.email}`);
      return NextResponse.json(
        { 
          message: "Utilisateur introuvable", 
          details: "Votre compte existe dans la session mais pas dans la base de données. Reconnectez-vous pour résoudre ce problème."
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: "Utilisateur valide",
      user: {
        id: user.id,
        email: user.email,
      }
    });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la vérification de l'utilisateur" },
      { status: 500 }
    );
  }
} 