"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Provider pour TanStack Query qui enveloppe l'application
 * Gère les requêtes, les caches et les états de chargement
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  // Création d'une nouvelle instance de QueryClient pour chaque session
  // Cela empêche le partage de cache entre les utilisateurs en prod
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Configuration par défaut pour toutes les requêtes
        staleTime: 60 * 1000, // 1 minute avant qu'une requête soit considérée comme obsolète
        retry: 1, // Nombre de tentatives en cas d'échec
        refetchOnWindowFocus: process.env.NODE_ENV === 'production', // Uniquement en prod
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 