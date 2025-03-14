import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Filtre les membres actifs d'une colocation (ceux qui n'ont pas quitté)
 * @param members Liste des membres de la colocation
 * @returns Liste des membres actifs
 */
export function getActiveMembers(members: Array<{ leftAt: string | null | undefined } & Record<string, any>> | undefined) {
  if (!members || !Array.isArray(members)) {
    return [];
  }
  
  // Un membre est considéré comme actif si leftAt est null, undefined ou une chaîne vide
  return members.filter(member => {
    // Vérifier si le membre existe et a la propriété leftAt
    if (!member) return false;
    
    // Considérer comme actif si leftAt est null, undefined ou chaîne vide
    return !member.leftAt || member.leftAt === "";
  });
} 