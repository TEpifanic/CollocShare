import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validation pour les articles de courses
const shoppingItemSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  quantity: z.number().int().positive().default(1),
  unit: z.string().optional(),
  price: z.number().positive().optional(),
  category: z.string().optional(),
  shared: z.boolean().default(false),
  needVerification: z.boolean().default(false),
  colocationId: z.string().min(1, "L'ID de colocation est requis"),
});

// GET /api/shopping - Récupérer tous les articles d'une colocation
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // Récupérer l'ID de la colocation depuis les paramètres d'URL
    const searchParams = request.nextUrl.searchParams;
    const colocationId = searchParams.get("colocationId");

    if (!colocationId) {
      return NextResponse.json(
        { message: "ID de colocation requis" },
        { status: 400 }
      );
    }

    // Vérifier l'appartenance à la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId: colocationId,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Vous n'êtes pas membre de cette colocation" },
        { status: 403 }
      );
    }

    // Récupérer tous les articles de la colocation
    const items = await prisma.shoppingItem.findMany({
      where: {
        colocationId: colocationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        purchasedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformer les données pour inclure le nom d'utilisateur directement
    const transformedItems = items.map(item => ({
      ...item,
      userName: item.user.name,
      purchasedByName: item.purchasedBy?.name,
    }));

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération des articles" },
      { status: 500 }
    );
  }
}

// POST /api/shopping - Créer un nouvel article
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { colocationId, name, quantity, unit, category, shared, needVerification } = data;

    if (!colocationId || !name) {
      return NextResponse.json(
        { message: "Colocation ID et nom de l'article requis" },
        { status: 400 }
      );
    }

    // Vérifier l'appartenance à la colocation
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        colocationId: colocationId,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "Vous n'êtes pas membre de cette colocation" },
        { status: 403 }
      );
    }

    // Créer un nouvel article avec Prisma
    const newItem = await prisma.shoppingItem.create({
      data: {
        name,
        quantity: quantity || 1,
        unit: unit || null,
        category: category || null,
        shared: shared || false,
        needVerification: needVerification || false,
        purchased: false,
        userId: session.user.id,
        colocationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Ajouter le nom d'utilisateur directement
    const transformedItem = {
      ...newItem,
      userName: newItem.user.name,
    };

    return NextResponse.json(transformedItem, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'article:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la création de l'article" },
      { status: 500 }
    );
  }
} 