import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

// Schéma de validation avec Zod
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation des données
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Adresse email invalide" },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    // Ne pas indiquer si l'email existe ou non pour des raisons de sécurité
    // Renvoyer une réponse positive dans tous les cas
    if (!user) {
      return NextResponse.json(
        { message: "Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation." },
        { status: 200 }
      );
    }
    
    // Génération d'un token unique
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    // Date d'expiration (30 minutes)
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
    
    // Dans un environnement de production réel, on stockerait ce token en base de données
    // Et on enverrait un email avec un lien contenant ce token
    console.log(`Token de réinitialisation pour ${email}: ${resetToken}`);
    console.log(`URL de réinitialisation: /reset-password?token=${resetToken}`);
    
    // Simuler l'envoi d'un email
    // Dans une implémentation réelle, vous utiliseriez SendGrid ou un autre service
    /*
    await sendResetPasswordEmail({
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      resetToken,
    });
    */
    
    return NextResponse.json(
      { message: "Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation." },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Erreur lors de la demande de réinitialisation:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la demande de réinitialisation" },
      { status: 500 }
    );
  }
} 