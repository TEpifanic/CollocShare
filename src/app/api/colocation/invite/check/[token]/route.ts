import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/colocation/invite/check/[token] - Vérifier la validité d'une invitation
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    console.log(`🔍 Vérification de l'invitation avec token: ${params.token}`);
    
    const { token } = params;

    if (!token) {
      console.log("❌ Token d'invitation manquant");
      return NextResponse.json(
        { message: "Token d'invitation manquant" },
        { status: 400 }
      );
    }

    console.log("📊 Exécution de la requête SQL pour rechercher l'invitation");
    
    try {
      // Utiliser une requête Prisma standard au lieu de SQL brut pour plus de fiabilité
      const invitation = await prisma.invitation.findFirst({
        where: {
          token: token,
        },
        include: {
          colocation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      console.log(`📊 Résultat de la requête:`, invitation);

      // Vérifier si l'invitation existe
      if (!invitation) {
        console.log("❌ Invitation non trouvée");
        return NextResponse.json(
          { message: "Invitation non trouvée" },
          { status: 404 }
        );
      }

      console.log(`✅ Invitation trouvée: ${invitation.id} pour ${invitation.email}`);

      // Vérifier si l'invitation est expirée
      const expiresAt = new Date(invitation.expiresAt);
      const now = new Date();
      
      console.log(`📅 Date d'expiration: ${expiresAt.toISOString()}, Date actuelle: ${now.toISOString()}`);
      
      if (expiresAt < now) {
        console.log("❌ Invitation expirée");
        return NextResponse.json(
          { message: "Cette invitation a expiré" },
          { status: 400 }
        );
      }

      // Vérifier si l'invitation est en attente
      console.log(`📋 Statut de l'invitation: ${invitation.status}`);
      
      if (invitation.status !== "pending") {
        console.log("❌ Invitation non valide (statut n'est pas 'pending')");
        return NextResponse.json(
          { message: "Cette invitation n'est plus valide" },
          { status: 400 }
        );
      }

      // Retourner les informations de l'invitation
      const response = {
        id: invitation.id,
        email: invitation.email,
        colocation: {
          id: invitation.colocation.id,
          name: invitation.colocation.name
        },
        expiresAt: invitation.expiresAt,
      };
      
      console.log(`✅ Retour des informations d'invitation:`, response);
      
      return NextResponse.json(response);
    } catch (sqlError) {
      console.error("❌ Erreur lors de la vérification de l'invitation:", sqlError);
      return NextResponse.json(
        { message: "Erreur lors de l'accès à la base de données", error: String(sqlError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Erreur globale lors de la vérification de l'invitation:", error);
    // Ajouter des détails d'erreur pour le débogage
    const errorDetails = {
      message: "Une erreur est survenue lors de la vérification de l'invitation",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    
    console.error("Détails de l'erreur:", errorDetails);
    
    return NextResponse.json(
      errorDetails,
      { status: 500 }
    );
  }
} 