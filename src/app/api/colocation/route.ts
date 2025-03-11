import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Schéma de validation pour la création d'une colocation
const createColocationSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  address: z.string().min(5, { message: "L'adresse doit être valide" }),
});

// GET /api/colocation - Liste toutes les colocations de l'utilisateur
export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    
    // Récupérer les colocations de l'utilisateur via ses adhésions
    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        leftAt: null, // Uniquement les adhésions actives
      },
      include: {
        colocation: true,
      },
    });
    
    // Extraire les colocations des adhésions
    const colocations = memberships.map(membership => membership.colocation);
    
    return NextResponse.json({ colocations });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des colocations:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération des colocations" },
      { status: 500 }
    );
  }
}

// POST /api/colocation - Crée une nouvelle colocation
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    
    // Vérifier que l'ID utilisateur est présent
    if (!session.user.id) {
      console.error("ID utilisateur manquant dans la session:", session);
      return NextResponse.json(
        { message: "Session utilisateur incomplète" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    // Validation des données
    const result = createColocationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Données invalides", errors: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, address } = result.data;
    
    try {
      // Vérifier si l'utilisateur existe dans la base de données
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (!user) {
        console.error(`Utilisateur introuvable : ID=${session.user.id}, Email=${session.user.email}`);
        return NextResponse.json(
          { 
            message: "Utilisateur introuvable", 
            details: "Votre compte existe dans la session mais pas dans la base de données. Essayez de vous déconnecter et de vous reconnecter." 
          },
          { status: 404 }
        );
      }
      
      // Créer la colocation avec une transaction pour garantir la cohérence
      const colocation = await prisma.$transaction(async (prismaClient) => {
        // Créer la colocation
        const newColocation = await prismaClient.colocation.create({
          data: {
            name,
            address,
          },
        });
        
        // Créer l'adhésion pour l'utilisateur avec le rôle ADMIN
        await prismaClient.membership.create({
          data: {
            userId: session.user.id,
            colocationId: newColocation.id,
            role: "ADMIN",
          },
        });
        
        return newColocation;
      });
      
      return NextResponse.json(
        { message: "Colocation créée avec succès", colocation },
        { status: 201 }
      );
    } catch (txError) {
      console.error("Erreur dans la transaction:", txError);
      return NextResponse.json(
        { message: "Erreur lors de la création de la colocation ou de l'adhésion" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Erreur lors de la création de la colocation:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la création de la colocation" },
      { status: 500 }
    );
  }
} 