import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";
import { sendInvitationEmail } from "@/lib/mail";
import { Prisma } from "@prisma/client";

// Schéma de validation pour l'invitation
const inviteSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }),
  colocationId: z.string().uuid({ message: "ID de colocation invalide" }),
});

// POST /api/colocation/invite - Inviter quelqu'un à rejoindre une colocation
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
    
    const body = await req.json();
    
    // Validation des données
    const result = inviteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Données invalides", errors: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, colocationId } = result.data;
    
    // Vérifier que l'utilisateur est membre de la colocation avec un rôle ADMIN
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId,
        role: "ADMIN",
        leftAt: null,
      },
    });
    
    if (!membership) {
      return NextResponse.json(
        { message: "Non autorisé. Vous devez être administrateur de cette colocation." },
        { status: 403 }
      );
    }
    
    // Vérifier si la colocation existe
    const colocation = await prisma.colocation.findUnique({
      where: { id: colocationId },
    });
    
    if (!colocation) {
      return NextResponse.json(
        { message: "Colocation non trouvée" },
        { status: 404 }
      );
    }
    
    // Vérifier si l'utilisateur existe déjà et s'il est déjà membre
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: {
            colocationId,
            leftAt: null,
          },
        },
      },
    });
    
    if (existingUser && existingUser.memberships.length > 0) {
      return NextResponse.json(
        { message: "Cette personne est déjà membre de la colocation" },
        { status: 400 }
      );
    }
    
    // Configuration du délai avant de pouvoir renvoyer une invitation (en secondes)
    const delayBeforeResend = process.env.INVITATION_RESEND_DELAY_SECONDS || '3600'; // 1 heure par défaut
    
    // Vérifier s'il y a déjà une invitation en attente pour cet email avec une requête SQL directe
    const existingInvitations = await prisma.$queryRaw`
      SELECT * FROM "Invitation" 
      WHERE "email" = ${email} 
      AND "colocationId" = ${colocationId} 
      AND "status" = 'pending' 
      AND "expiresAt" > NOW()
      AND "createdAt" > NOW() - INTERVAL '${delayBeforeResend} seconds'
    `;
    
    // Vérifier si des invitations récentes ont été trouvées (moins de X secondes)
    if (Array.isArray(existingInvitations) && existingInvitations.length > 0) {
      // Convertir en nombre de minutes pour l'affichage
      const delayInMinutes = Math.ceil(parseInt(delayBeforeResend) / 60);
      const timeUnit = delayInMinutes === 1 ? 'minute' : 'minutes';
      
      return NextResponse.json(
        { 
          message: `Une invitation a été envoyée récemment à cette adresse email. Veuillez attendre ${delayInMinutes} ${timeUnit} avant de renvoyer une invitation.` 
        },
        { status: 400 }
      );
    }
    
    // Vérifier s'il existe une invitation plus ancienne pour la mettre à jour
    const olderInvitations = await prisma.$queryRaw`
      SELECT * FROM "Invitation" 
      WHERE "email" = ${email} 
      AND "colocationId" = ${colocationId} 
      AND "status" = 'pending' 
      AND "expiresAt" > NOW()
    `;
    
    // Générer un token unique pour l'invitation
    const token = crypto.randomBytes(32).toString("hex");
    
    // Définir une date d'expiration (7 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    let invitation;
    
    // Si une invitation plus ancienne existe, la mettre à jour au lieu d'en créer une nouvelle
    if (Array.isArray(olderInvitations) && olderInvitations.length > 0) {
      const oldInvitation = olderInvitations[0];
      
      console.log(`Mise à jour d'une invitation existante pour ${email} (ID: ${oldInvitation.id})`);
      
      // Mettre à jour l'invitation existante
      await prisma.$executeRaw`
        UPDATE "Invitation"
        SET "token" = ${token}, "expiresAt" = ${expiresAt}, "createdAt" = NOW()
        WHERE "id" = ${oldInvitation.id}
      `;
      
      // Récupérer l'invitation mise à jour
      const updatedInvitation = await prisma.$queryRaw`
        SELECT * FROM "Invitation" WHERE "id" = ${oldInvitation.id}
      `;
      
      invitation = Array.isArray(updatedInvitation) ? updatedInvitation[0] : null;
    } else {
      // Créer une nouvelle invitation
      const newInvitation = await prisma.$queryRaw`
        INSERT INTO "Invitation" ("id", "email", "colocationId", "token", "status", "createdAt", "expiresAt")
        VALUES (gen_random_uuid(), ${email}, ${colocationId}, ${token}, 'pending', NOW(), ${expiresAt})
        RETURNING *
      `;
      
      invitation = Array.isArray(newInvitation) ? newInvitation[0] : null;
    }
    
    if (!invitation) {
      throw new Error("Échec de la création ou mise à jour de l'invitation");
    }
    
    // URL d'invitation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/join-colocation/${token}`;
    
    // Logs supplémentaires pour vérifier l'URL d'invitation
    console.log(`NEXT_PUBLIC_APP_URL configuré: ${appUrl}`);
    console.log(`URL d'invitation complète: ${inviteUrl}`);
    
    // Envoyer l'email d'invitation avec SendGrid
    console.log(`Tentative d'envoi d'invitation à ${email} pour la colocation "${colocation.name}"`);
    console.log(`URL d'invitation: ${inviteUrl}`);
    
    const emailSent = await sendInvitationEmail(
      email, 
      inviteUrl,
      colocation.name,
      session.user.name || session.user.email || "Un membre de CollocShare"
    );
    
    if (!emailSent) {
      console.error(`Échec d'envoi de l'invitation par email à ${email}`);
      console.error(`Vérifiez votre configuration SendGrid:`);
      console.error(`- SENDGRID_API_KEY est configurée: ${!!process.env.SENDGRID_API_KEY}`);
      console.error(`- SENDGRID_FROM_EMAIL est configurée: ${!!process.env.SENDGRID_FROM_EMAIL}`);
      console.error(`- NEXT_PUBLIC_APP_URL est configurée: ${!!process.env.NEXT_PUBLIC_APP_URL}`);
      
      // On continue même si l'email n'a pas été envoyé pour permettre
      // à l'administrateur de partager le lien manuellement si nécessaire
    } else {
      console.log(`Invitation envoyée avec succès à ${email}`);
    }
    
    return NextResponse.json(
      { 
        message: emailSent 
          ? "Invitation envoyée avec succès" 
          : "Invitation créée mais l'email n'a pas pu être envoyé", 
        invitation,
        emailSent,
        isResend: Array.isArray(olderInvitations) && olderInvitations.length > 0
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'invitation:", error);
    
    // Vérifier si c'est une erreur spécifique à PostgreSQL
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Erreur Prisma: Code ${error.code}, ${error.message}`);
      return NextResponse.json(
        { 
          message: "Erreur lors de l'opération avec la base de données", 
          details: `Code d'erreur: ${error.code}` 
        },
        { status: 500 }
      );
    }
    
    // Vérifier si c'est une erreur de validation
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error(`Erreur de validation Prisma: ${error.message}`);
      return NextResponse.json(
        { message: "Erreur de validation des données" },
        { status: 400 }
      );
    }
    
    // Si c'est une erreur type Error standard
    if (error instanceof Error) {
      console.error(`Détails de l'erreur:`, error.message);
      if (error.stack) {
        console.error(`Stack trace:`, error.stack);
      }
    }
    
    return NextResponse.json(
      { message: "Une erreur est survenue lors de l'envoi de l'invitation" },
      { status: 500 }
    );
  }
} 