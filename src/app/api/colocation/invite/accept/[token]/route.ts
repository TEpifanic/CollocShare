import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/colocation/invite/accept/[token] - Accepter une invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    console.log(`🔍 Traitement de l'acceptation d'invitation avec token: ${params.token}`);
    
    // Vérifier l'authentification
    console.log("🔐 Vérification de l'authentification...");
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("❌ Utilisateur non authentifié");
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    
    console.log(`✅ Utilisateur authentifié: ${session.user.email} (ID: ${session.user.id})`);
    
    const { token } = params;

    if (!token) {
      console.log("❌ Token d'invitation manquant");
      return NextResponse.json(
        { message: "Token d'invitation manquant" },
        { status: 400 }
      );
    }

    console.log("📊 Recherche de l'invitation...");

    try {
      // Rechercher l'invitation avec Prisma
      const invitation = await prisma.invitation.findFirst({
        where: {
          token: token,
        },
        include: {
          colocation: true,
        },
      });
      
      console.log(`📊 Résultat de la recherche:`, invitation);

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

      // Vérifier si l'email de l'invitation correspond à celui de l'utilisateur connecté
      console.log(`📧 Comparaison des emails: ${session.user.email?.toLowerCase()} vs ${invitation.email.toLowerCase()}`);
      
      if (session.user.email && session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        console.log("❌ Emails ne correspondent pas");
        return NextResponse.json(
          { 
            message: "Cette invitation est destinée à une autre adresse email. " +
                   "Veuillez vous connecter avec le compte associé à l'adresse " + invitation.email 
          },
          { status: 403 }
        );
      }

      console.log("🔍 Vérification si l'utilisateur est déjà membre...");
      
      // Vérifier si l'utilisateur est déjà membre de la colocation
      const existingMembership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          colocationId: invitation.colocationId,
          leftAt: null,
        },
      });
      
      console.log(`📊 Résultat de la recherche de membership:`, existingMembership);

      if (existingMembership) {
        console.log("❌ Utilisateur déjà membre");
        return NextResponse.json(
          { message: "Vous êtes déjà membre de cette colocation" },
          { status: 400 }
        );
      }
      
      console.log("✅ L'utilisateur n'est pas encore membre, procédons à l'acceptation");

      try {
        // Vérifier si l'utilisateur a déjà été membre de cette colocation (mais a quitté)
        const previousMembership = await prisma.membership.findFirst({
          where: {
            userId: session.user.id,
            colocationId: invitation.colocationId,
            leftAt: { not: null }, // A quitté précédemment
          },
        });

        console.log("🔍 Vérification d'une adhésion précédente:", previousMembership);

        // Utiliser une transaction Prisma pour garantir l'atomicité des opérations
        const result = await prisma.$transaction(async (tx) => {
          // Mettre à jour le statut de l'invitation
          const updatedInvitation = await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: "accepted" },
          });
          
          let membership;
          
          if (previousMembership) {
            // Si l'utilisateur a déjà été membre, mettre à jour son adhésion existante
            console.log("🔄 Réactivation d'une adhésion précédente");
            membership = await tx.membership.update({
              where: { id: previousMembership.id },
              data: {
                leftAt: null,
                joinedAt: new Date(),
              },
            });
          } else {
            // Sinon, créer une nouvelle adhésion
            console.log("➕ Création d'une nouvelle adhésion");
            try {
              membership = await tx.membership.create({
                data: {
                  userId: session.user.id,
                  colocationId: invitation.colocationId,
                  role: "MEMBER",
                  joinedAt: new Date(),
                },
              });
            } catch (createError) {
              console.error("❌ Erreur lors de la création du membership:", createError);
              
              // Vérifier à nouveau si un membership existe déjà (race condition)
              const doubleCheck = await tx.membership.findFirst({
                where: {
                  userId: session.user.id,
                  colocationId: invitation.colocationId,
                },
              });
              
              if (doubleCheck) {
                console.log("⚠️ Membership trouvé lors de la double vérification:", doubleCheck);
                
                // Si le membership existe mais a un leftAt, le réactiver
                if (doubleCheck.leftAt) {
                  membership = await tx.membership.update({
                    where: { id: doubleCheck.id },
                    data: { leftAt: null, joinedAt: new Date() },
                  });
                } else {
                  // Sinon, utiliser le membership existant
                  membership = doubleCheck;
                }
              } else {
                // Si aucun membership n'est trouvé, propager l'erreur
                throw createError;
              }
            }
          }
          
          return { updatedInvitation, membership };
        });
        
        console.log("✅ Transaction réussie:", result);

        // Retourner les informations de la colocation rejointe
        const response = {
          message: "Vous avez rejoint la colocation avec succès",
          colocationId: invitation.colocationId,
          colocationName: invitation.colocation.name,
        };
        
        console.log(`✅ Opération réussie, réponse:`, response);
        
        return NextResponse.json(response);
      } catch (dbUpdateError) {
        console.error("❌ Erreur lors de la mise à jour de la BD:", dbUpdateError);
        return NextResponse.json(
          { 
            message: "Erreur lors de la mise à jour des données",
            error: dbUpdateError instanceof Error ? dbUpdateError.message : String(dbUpdateError)
          },
          { status: 500 }
        );
      }
    } catch (invitationError) {
      console.error("❌ Erreur lors de la recherche de l'invitation:", invitationError);
      return NextResponse.json(
        { 
          message: "Erreur lors de la recherche de l'invitation", 
          error: invitationError instanceof Error ? invitationError.message : String(invitationError) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Erreur globale lors de l'acceptation de l'invitation:", error);
    // Ajouter des détails d'erreur pour le débogage
    const errorDetails = {
      message: "Une erreur est survenue lors de l'acceptation de l'invitation",
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