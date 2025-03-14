import { NextRequest, NextResponse } from "next/server";

// GET /api/balances - Redirection vers l'API principale des soldes
export async function GET(request: NextRequest) {
  try {
    // Récupérer l'ID de colocation depuis les paramètres de requête
    const url = new URL(request.url);
    const colocationId = url.searchParams.get("colocationId");
    
    if (!colocationId) {
      return NextResponse.json(
        { message: "ID de colocation manquant" },
        { status: 400 }
      );
    }
    
    // Rediriger vers l'API principale des soldes
    const response = await fetch(`${url.origin}/api/expenses/balance/${colocationId}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { message: "Erreur lors de la récupération des soldes" },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Erreur lors de la récupération des soldes:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération des soldes" },
      { status: 500 }
    );
  }
} 