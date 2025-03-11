"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserInfo() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="text-center py-2">
        <p className="text-sm text-slate-500">Chargement des informations utilisateur...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="text-center py-2">
        <p className="text-sm text-red-500">Non connecté</p>
      </div>
    );
  }

  // Obtenir les initiales du nom pour l'avatar
  const initials = session.user.name
    ? session.user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : session.user.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex items-center space-x-4 mb-4">
      <Avatar>
        {session.user.image ? (
          <img src={session.user.image} alt={session.user.name || 'Avatar'} />
        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>
      <div>
        {session.user.name && (
          <p className="font-medium">{session.user.name}</p>
        )}
        <p className="text-sm text-slate-500">{session.user.email}</p>
      </div>
    </div>
  );
} 