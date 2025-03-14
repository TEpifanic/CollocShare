"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useReimbursements, Reimbursement, UpdateReimbursementData } from "@/hooks/useReimbursements";
import { useBalances, UserBalance, UserDebt } from "@/hooks/useBalances";
import { useColocations } from "@/hooks/useColocations";
import { useSession } from "next-auth/react";

// Étendre l'interface Reimbursement pour inclure isCompleted
interface ExtendedReimbursement extends Reimbursement {
  isCompleted?: boolean;
}

export default function ReimbursementsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const colocationId = params.id as string;
  
  const { useReimbursementsQuery, useUpdateReimbursementMutation } = useReimbursements();
  const { useBalancesQuery } = useBalances();
  const { useColocationDetailsQuery } = useColocations();
  
  const { data: reimbursements, isLoading: isLoadingReimbursements } = useReimbursementsQuery(colocationId);
  const { data: balances, isLoading: isLoadingBalances } = useBalancesQuery(colocationId);
  const { data: colocation, isLoading: isLoadingColocation } = useColocationDetailsQuery(colocationId);
  
  const updateReimbursementMutation = useUpdateReimbursementMutation();
  
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Filtrer les remboursements
  const filteredReimbursements = reimbursements?.filter((reimbursement: ExtendedReimbursement) => 
    showCompleted ? true : !reimbursement.isCompleted
  );
  
  // Trier les remboursements par date (plus récent en premier)
  const sortedReimbursements = filteredReimbursements?.sort((a: ExtendedReimbursement, b: ExtendedReimbursement) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Marquer un remboursement comme complété
  const handleMarkAsCompleted = async (reimbursementId: string) => {
    try {
      await updateReimbursementMutation.mutateAsync({
        id: reimbursementId,
        isCompleted: true
      } as UpdateReimbursementData);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du remboursement:", error);
    }
  };
  
  if (isLoadingColocation || isLoadingReimbursements || isLoadingBalances) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chargement...</p>
      </div>
    );
  }
  
  if (!colocation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>Colocation non trouvée</p>
        <Button asChild className="mt-4">
          <Link href="/colocations">Retour aux colocations</Link>
        </Button>
      </div>
    );
  }
  
  // Trouver les dettes pour l'utilisateur connecté
  const userDebts = balances?.debts?.filter((debt: UserDebt) => 
    debt.fromUserId === session?.user?.id || debt.toUserId === session?.user?.id
  ) || [];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{colocation.name} - Remboursements</h1>
          <p className="text-muted-foreground">
            Gérez les remboursements entre colocataires
          </p>
        </div>
        <Button asChild>
          <Link href={`/colocations/${colocationId}/reimbursements/new`}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau remboursement
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Soldes et dettes */}
        <Card>
          <CardHeader>
            <CardTitle>Soldes actuels</CardTitle>
            <CardDescription>
              Résumé des soldes entre colocataires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {balances?.userBalances.map((member: UserBalance) => (
              <div key={member.userId} className="flex justify-between items-center p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  {member.userImage && (
                    <img 
                      src={member.userImage} 
                      alt={member.userName} 
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{member.userName}</span>
                </div>
                <Badge 
                  className={member.balance > 0 ? "bg-green-100 text-green-800" : member.balance < 0 ? "bg-red-100 text-red-800" : ""}
                >
                  {member.balance.toFixed(2)} €
                </Badge>
              </div>
            ))}
            
            <Separator className="my-4" />
            
            <h3 className="font-medium mb-2">Remboursements recommandés</h3>
            {balances?.debts.length ? (
              <div className="space-y-2">
                {balances.debts.map((debt: UserDebt, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      <span>{debt.fromUserName}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{debt.toUserName}</span>
                    </div>
                    <Badge>{debt.amount.toFixed(2)} €</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun remboursement nécessaire</p>
            )}
          </CardContent>
        </Card>
        
        {/* Mes dettes */}
        <Card>
          <CardHeader>
            <CardTitle>Mes remboursements</CardTitle>
            <CardDescription>
              Remboursements qui vous concernent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userDebts && userDebts.length > 0 ? (
              <div className="space-y-4">
                {userDebts.map((debt: UserDebt, index: number) => {
                  const isDebtor = debt.fromUserId === session?.user?.id;
                  
                  return (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          {isDebtor ? (
                            <p>Vous devez rembourser <span className="font-medium">{debt.toUserName}</span></p>
                          ) : (
                            <p><span className="font-medium">{debt.fromUserName}</span> doit vous rembourser</p>
                          )}
                        </div>
                        <Badge className={isDebtor ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                          {debt.amount.toFixed(2)} €
                        </Badge>
                      </div>
                      
                      {isDebtor && (
                        <Button 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => router.push(`/colocations/${colocationId}/reimbursements/new?fromUserId=${debt.fromUserId}&toUserId=${debt.toUserId}&amount=${debt.amount}`)}
                        >
                          Marquer comme remboursé
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun remboursement vous concernant</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Historique des remboursements</h2>
          <Button variant="outline" onClick={() => setShowCompleted(!showCompleted)}>
            {showCompleted ? "Masquer les remboursements complétés" : "Afficher tous les remboursements"}
          </Button>
        </div>
        
        {sortedReimbursements && sortedReimbursements.length > 0 ? (
          <div className="space-y-4">
            {sortedReimbursements.map((reimbursement: ExtendedReimbursement) => (
              <Card key={reimbursement.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{reimbursement.description || "Remboursement"}</CardTitle>
                      <CardDescription>
                        {format(new Date(reimbursement.createdAt), "dd MMMM yyyy", { locale: fr })}
                      </CardDescription>
                    </div>
                    <Badge className={reimbursement.isCompleted ? "bg-green-100 text-green-800" : ""}>
                      {reimbursement.amount.toFixed(2)} €
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reimbursement.fromUser?.name}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-medium">{reimbursement.toUser?.name}</span>
                    </div>
                    <Badge variant="outline" className={reimbursement.isCompleted ? "bg-green-50 text-green-700" : ""}>
                      {reimbursement.isCompleted ? "Complété" : "En attente"}
                    </Badge>
                  </div>
                </CardContent>
                {!reimbursement.isCompleted && reimbursement.fromUser?.id === session?.user?.id && (
                  <CardFooter>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleMarkAsCompleted(reimbursement.id)}
                      disabled={updateReimbursementMutation.isPending}
                    >
                      Marquer comme remboursé
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucun remboursement trouvé</p>
            <Button asChild>
              <Link href={`/colocations/${colocationId}/reimbursements/new`}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter un remboursement
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 