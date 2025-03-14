import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Stockage temporaire des remboursements (simulation de base de données)
let mockReimbursementsStore: any[] = [];

// GET /api/reimbursements - Récupérer les remboursements
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

    // Récupérer l'ID de colocation depuis les paramètres de requête
    const url = new URL(request.url);
    const colocationId = url.searchParams.get("colocationId");

    if (!colocationId) {
      return NextResponse.json(
        { message: "ID de colocation manquant" },
        { status: 400 }
      );
    }

    // Filtrer les remboursements par colocation
    const filteredReimbursements = mockReimbursementsStore.filter(
      (r) => r.colocationId === colocationId
    );

    console.log(`Remboursements récupérés pour la colocation ${colocationId}:`, filteredReimbursements);
    return NextResponse.json(filteredReimbursements);
  } catch (error) {
    console.error("Erreur lors de la récupération des remboursements:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération des remboursements" },
      { status: 500 }
    );
  }
}

// POST /api/reimbursements - Créer un remboursement
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

    // Récupérer les données du remboursement
    const data = await request.json();
    console.log("Données du remboursement reçues:", data);

    // Vérifier les données requises
    if (!data.colocationId || !data.fromUserId || !data.toUserId || !data.amount) {
      return NextResponse.json(
        { message: "Données de remboursement incomplètes" },
        { status: 400 }
      );
    }

    // Simuler la création d'un remboursement
    const mockReimbursement = {
      id: `reimbursement-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ajouter les informations des utilisateurs (normalement récupérées depuis la base de données)
      fromUser: {
        id: data.fromUserId,
        name: data.description?.split(" de ")[1]?.split(" à ")[0] || "Utilisateur",
        email: `user-${data.fromUserId.substring(0, 5)}@example.com`
      },
      toUser: {
        id: data.toUserId,
        name: data.description?.split(" à ")[1] || "Utilisateur",
        email: `user-${data.toUserId.substring(0, 5)}@example.com`
      }
    };

    // Ajouter le remboursement au stockage temporaire
    mockReimbursementsStore.push(mockReimbursement);
    
    // Limiter le nombre de remboursements stockés (pour éviter les fuites de mémoire)
    if (mockReimbursementsStore.length > 100) {
      mockReimbursementsStore = mockReimbursementsStore.slice(-100);
    }

    console.log("Remboursement créé:", mockReimbursement);
    console.log("Nombre total de remboursements stockés:", mockReimbursementsStore.length);

    // Simuler une mise à jour des soldes (dans une vraie application, cela serait fait dans la base de données)
    // Ici, nous ne faisons rien car les soldes sont gérés par une autre API

    return NextResponse.json(mockReimbursement);
  } catch (error) {
    console.error("Erreur lors de la création du remboursement:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la création du remboursement" },
      { status: 500 }
    );
  }
} 