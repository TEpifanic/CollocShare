import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { User } from "next-auth";

// Extension du type User pour inclure l'id
interface ExtendedUser extends User {
  id: string;
}

// Extension du type Session.User pour inclure l'id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Constantes pour les durées de session (en secondes)
const DAY_IN_SECONDS = 86400; // 24 heures
const MONTH_IN_SECONDS = 30 * DAY_IN_SECONDS; // 30 jours

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    // Durée maximale d'une session (30 jours)
    maxAge: MONTH_IN_SECONDS,
    // Mise à jour de la session après 24h d'inactivité
    updateAge: DAY_IN_SECONDS,
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/error",
    newUser: "/dashboard",
  },
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otpVerified: { label: "OTP Verified", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || credentials?.otpVerified !== "true") {
          throw new Error("Identifiants manquants ou code OTP non vérifié");
        }

        // L'OTP a déjà été vérifié, récupérer l'utilisateur par email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Utilisateur non trouvé");
        }

        return {
          id: user.id,
          name: user.name || "",
          email: user.email,
          image: user.avatar || "",
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        
        // Vérifier que l'utilisateur existe réellement dans la base de données
        if (session.user.id) {
          const userExists = await prisma.user.findUnique({
            where: { id: session.user.id },
          });
          
          if (!userExists) {
            console.error(`Utilisateur avec ID ${session.user.id} introuvable dans la base de données`);
          }
        } else {
          console.error("ID utilisateur manquant dans le token:", token);
        }
        
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 