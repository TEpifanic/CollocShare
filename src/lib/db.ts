import { PrismaClient } from '@prisma/client';

// Déclaration pour le type global afin d'éviter les multiples instances de PrismaClient en développement
declare global {
  var prisma: PrismaClient | undefined;
}

// Utilisation d'une instance globale pour éviter les problèmes de hot reloading en développement
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Assignation à global uniquement en développement
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 