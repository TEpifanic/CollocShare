import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/shopping/[id] - Récupérer un article par son ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const id = (await params).id;

    if (!id) {
      return NextResponse.json(
        { message: "ID d'article manquant" },
        { status: 400 }
      );
    }

    // Récupérer l'article avec Prisma
    const item = await prisma.shoppingItem.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        purchasedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        colocation: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { message: "Article non trouvé" },
        { status: 404 }
      );
    }

    // Transformer les données pour faciliter l'utilisation côté client
    const transformedItem = {
      ...item,
      userName: item.user.name,
      purchasedByName: item.purchasedBy?.name,
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération de l'article" },
      { status: 500 }
    );
  }
}

// PUT /api/shopping/[id] - Mettre à jour un article
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const id = (await params).id;
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "ID d'article manquant" },
        { status: 400 }
      );
    }

    // Vérifier que l'article existe
    const existingItem = await prisma.shoppingItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: "Article non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a les droits pour modifier cet article
    if (existingItem.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Vous n'êtes pas autorisé à modifier cet article" },
        { status: 403 }
      );
    }

    // Mettre à jour l'article avec Prisma
    const updatedItem = await prisma.shoppingItem.update({
      where: { id },
      data: {
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
        shared: data.shared,
        needVerification: data.needVerification,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transformer les données pour faciliter l'utilisation côté client
    const transformedItem = {
      ...updatedItem,
      userName: updatedItem.user.name,
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la mise à jour de l'article" },
      { status: 500 }
    );
  }
}

// DELETE /api/shopping/[id] - Supprimer un article
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const id = (await params).id;

    if (!id) {
      return NextResponse.json(
        { message: "ID d'article manquant" },
        { status: 400 }
      );
    }

    // Vérifier que l'article existe
    const existingItem = await prisma.shoppingItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: "Article non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a les droits pour supprimer cet article
    if (existingItem.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Vous n'êtes pas autorisé à supprimer cet article" },
        { status: 403 }
      );
    }

    // Supprimer l'article avec Prisma
    await prisma.shoppingItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la suppression de l'article" },
      { status: 500 }
    );
  }
}

// PATCH /api/shopping/[id]/purchase - Marquer un article comme acheté
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const id = (await params).id;
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "ID d'article manquant" },
        { status: 400 }
      );
    }

    // Vérifier que l'article existe
    const existingItem = await prisma.shoppingItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: "Article non trouvé" },
        { status: 404 }
      );
    }

    // Marquer l'article comme acheté avec Prisma
    const updatedItem = await prisma.shoppingItem.update({
      where: { id },
      data: {
        purchased: true,
        purchasedById: session.user.id,
        purchasedAt: new Date(),
        price: data.price || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        purchasedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transformer les données pour faciliter l'utilisation côté client
    const transformedItem = {
      ...updatedItem,
      userName: updatedItem.user.name,
      purchasedByName: updatedItem.purchasedBy?.name,
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error("Erreur lors du marquage de l'article comme acheté:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors du marquage de l'article comme acheté" },
      { status: 500 }
    );
  }
} 