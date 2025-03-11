import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schéma de validation avec Zod
const verifyOtpSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }),
  otp: z.string().length(6, { message: "Le code OTP doit contenir 6 chiffres" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation des données
    const result = verifyOtpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Données invalides", errors: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, otp } = result.data;
    
    // Récupérer le token de vérification
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        email,
        token: otp,
        expires: {
          gt: new Date(),
        },
      },
    });
    
    if (!verificationToken) {
      return NextResponse.json(
        { message: "Code OTP invalide ou expiré" },
        { status: 400 }
      );
    }
    
    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }
    
    // Supprimer le token vérifié
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });
    
    return NextResponse.json(
      { 
        message: "Code OTP vérifié avec succès",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Erreur lors de la vérification d'OTP:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la vérification d'OTP" },
      { status: 500 }
    );
  }
} 