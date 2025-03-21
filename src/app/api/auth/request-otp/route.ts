import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendOtpEmail } from "@/lib/mail";

// Schéma de validation avec Zod
const requestOtpSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }),
  name: z.string().min(2).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation des données
    const result = requestOtpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Données invalides", errors: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, name } = result.data;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    // Si c'est une tentative de connexion (sans nom) et que l'utilisateur n'existe pas
    if (!existingUser && !name) {
      return NextResponse.json(
        { message: "Aucun compte associé à cette adresse email" },
        { status: 404 }
      );
    }
    
    // Générer un code OTP à 6 chiffres
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Date d'expiration (10 minutes)
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    
    // Supprimer les anciens tokens pour cet email
    await prisma.verificationToken.deleteMany({
      where: { email },
    });
    
    // Créer un nouveau token
    await prisma.verificationToken.create({
      data: {
        email,
        token: otp,
        expires,
      },
    });
    
    if (!existingUser && name) {
      // Si l'utilisateur n'existe pas et qu'un nom est fourni,
      // nous préparons un nouvel utilisateur (qui sera validé après vérification OTP)
      await prisma.user.create({
        data: {
          email,
          name,
        },
      });
    }
    
    // Envoyer l'email avec le code OTP
    let emailSent = false;
    if (process.env.NODE_ENV === 'production') {
      emailSent = await sendOtpEmail(email, otp, name || existingUser?.name || undefined);
    } else {
      // En développement, on peut tester l'envoi d'email ou simplement simuler
      if (process.env.SENDGRID_API_KEY) {
        emailSent = await sendOtpEmail(email, otp, name || existingUser?.name || undefined);
      } else {
        // Simuler l'envoi
        console.log(`[DEV] Code OTP pour ${email}: ${otp}`);
        emailSent = true;
      }
    }
    
    if (!emailSent) {
      return NextResponse.json(
        { message: "Erreur lors de l'envoi de l'email avec le code OTP" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        message: "Code OTP envoyé avec succès", 
        // En développement sans SendGrid, on peut retourner l'OTP pour faciliter les tests
        otp: process.env.NODE_ENV === "development" && !process.env.SENDGRID_API_KEY ? otp : undefined
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Erreur lors de la demande d'OTP:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la demande d'OTP" },
      { status: 500 }
    );
  }
} 