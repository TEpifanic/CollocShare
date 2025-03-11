import { prisma } from '@/lib/db';

/**
 * Hook personnalisé pour accéder au client Prisma
 * Utilisation: const prismaClient = usePrisma();
 */
export const usePrisma = () => {
  return prisma;
}; 