"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Filter, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useColocations } from "@/hooks/useColocations";
import { useBalances, UserBalance, UserDebt } from "@/hooks/useBalances";
import { useReimbursements } from "@/hooks/useReimbursements";
import { useSession } from "next-auth/react";

export default function ExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const colocationId = params.id as string;
  const { data: session } = useSession();
  
  const { useExpensesQuery } = useExpenses();
  const { useColocationDetailsQuery } = useColocations();
  const { useBalancesQuery } = useBalances();
  const { createReimbursement, isCreating, reimbursements, isLoading: isLoadingReimbursements, refetch: refetchReimbursements } = useReimbursements(colocationId);
  
  const { data: expenses, isLoading: isLoadingExpenses } = useExpensesQuery(colocationId);
  const { data: colocation, isLoading: isLoadingColocation, refetch: refetchColocation } = useColocationDetailsQuery(colocationId);
  const { data: balances, isLoading: isLoadingBalances, refetch: refetchBalances } = useBalancesQuery(colocationId);
  
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterMonth, setFilterMonth] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [showBalances, setShowBalances] = useState<boolean>(true);
  
  // Filtrer les dépenses
  const filteredExpenses = expenses?.filter((expense: Expense) => {
    if (filterDate) {
      const expenseDate = new Date(expense.date);
      return expenseDate.toDateString() === filterDate.toDateString();
    }
    
    if (filterMonth) {
      const [year, month] = filterMonth.split("-");
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === parseInt(year) && 
             expenseDate.getMonth() === parseInt(month) - 1;
    }
    
    return true;
  });
  
  // Trier les dépenses
  const sortedExpenses = filteredExpenses?.sort((a: Expense, b: Expense) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    switch (sortBy) {
      case "date-asc":
        return dateA.getTime() - dateB.getTime();
      case "date-desc":
        return dateB.getTime() - dateA.getTime();
      case "amount-asc":
        return parseFloat(a.amount as any) - parseFloat(b.amount as any);
      case "amount-desc":
        return parseFloat(b.amount as any) - parseFloat(a.amount as any);
      default:
        return dateB.getTime() - dateA.getTime();
    }
  });
  
  // Générer les options de mois pour le filtre
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Générer les options pour les 12 derniers mois
    for (let i = 0; i < 12; i++) {
      const month = currentMonth - i;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month < 0 ? month + 12 : month;
      
      const date = new Date(year, adjustedMonth, 1);
      const value = `${year}-${adjustedMonth + 1}`;
      const label = format(date, "MMMM yyyy", { locale: fr });
      
      options.push({ value, label });
    }
    
    return options;
  };
  
  const monthOptions = generateMonthOptions();
  
  const clearFilters = () => {
    setFilterDate(undefined);
    setFilterMonth(undefined);
  };
  
  // Fonction pour marquer une dette comme remboursée
  const handleMarkDebtAsPaid = async (debt: UserDebt) => {
    try {
      const confirmed = window.confirm(
        `Confirmer le remboursement de ${debt.amount.toFixed(2)}€ de ${debt.fromUserName} à ${debt.toUserName} ?`
      );

      if (!confirmed) return;

      // Afficher un toast de chargement
      const loadingToast = toast.loading("Création du remboursement en cours...");

      console.log(`Tentative de remboursement: ${debt.fromUserName} -> ${debt.toUserName} (${debt.amount}€)`);
      
      const result = await createReimbursement({
        amount: debt.amount,
        date: new Date(),
        description: `Remboursement de ${debt.fromUserName} à ${debt.toUserName}`,
        fromUserId: debt.fromUserId,
        toUserId: debt.toUserId,
        colocationId: colocationId,
      });

      // Fermer le toast de chargement
      toast.dismiss(loadingToast);
      
      console.log("Remboursement créé avec succès:", result);
      toast.success("Remboursement créé avec succès");

      // Attendre un court instant pour permettre aux API de se mettre à jour
      await new Promise(resolve => setTimeout(resolve, 500));

      // Rafraîchir les données
      console.log("Actualisation des soldes et des remboursements...");
      await refetchBalances();
      await refetchReimbursements();
      
      // Vérifier si les soldes ont été mis à jour
      if (balances?.debts && balances.debts.some(d => 
        d.fromUserId === debt.fromUserId && 
        d.toUserId === debt.toUserId && 
        Math.abs(d.amount - debt.amount) < 0.01)) {
        console.log("La dette est toujours présente après actualisation. Forçage d'une seconde actualisation...");
        // Forcer une seconde actualisation après un délai plus long
        setTimeout(async () => {
          await refetchBalances();
          await refetchReimbursements();
        }, 1500);
      }
    } catch (error) {
      console.error("Erreur lors de la création du remboursement:", error);
      toast.error("Erreur lors de la création du remboursement");
    }
  };

  // Fonction pour marquer toutes les dettes comme remboursées
  const handleMarkAllDebtsAsPaid = async () => {
    try {
      if (!balances?.debts || balances.debts.length === 0) {
        toast.info("Aucune dette à rembourser");
        return;
      }

      const confirmed = window.confirm(
        `Confirmer le remboursement de toutes les dettes (${balances.debts.length}) ?`
      );

      if (!confirmed) return;

      // Afficher un toast de chargement
      const loadingToast = toast.loading("Création des remboursements en cours...");

      let successCount = 0;
      let errorCount = 0;

      // Traiter chaque dette individuellement
      for (const debt of balances.debts) {
        try {
          console.log(`Tentative de remboursement: ${debt.fromUserName} -> ${debt.toUserName} (${debt.amount}€)`);
          
          const result = await createReimbursement({
            amount: debt.amount,
            date: new Date(),
            description: `Remboursement de ${debt.fromUserName} à ${debt.toUserName}`,
            fromUserId: debt.fromUserId,
            toUserId: debt.toUserId,
            colocationId: colocationId,
          });
          
          console.log("Remboursement créé avec succès:", result);
          successCount++;
        } catch (error) {
          console.error(`Erreur lors du remboursement de ${debt.fromUserName} à ${debt.toUserName}:`, error);
          errorCount++;
        }
      }

      // Fermer le toast de chargement
      toast.dismiss(loadingToast);

      if (successCount > 0) {
        toast.success(`${successCount} remboursement(s) créé(s) avec succès`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} remboursement(s) ont échoué`);
      }

      // Attendre un court instant pour permettre aux API de se mettre à jour
      await new Promise(resolve => setTimeout(resolve, 500));

      // Rafraîchir les données
      console.log("Actualisation des soldes et des remboursements...");
      await refetchBalances();
      await refetchReimbursements();
      
      // Vérifier si les soldes ont été mis à jour
      if (balances?.debts && balances.debts.length > 0) {
        console.log("Les dettes sont toujours présentes après actualisation. Forçage d'une seconde actualisation...");
        // Forcer une seconde actualisation après un délai plus long
        setTimeout(async () => {
          await refetchBalances();
          await refetchReimbursements();
        }, 1500);
      }
    } catch (error) {
      console.error("Erreur lors de la création des remboursements:", error);
      toast.error(`Erreur lors de la création des remboursements: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };
  
  // Fonction pour actualiser les soldes
  const handleRefreshBalances = () => {
    refetchBalances();
    refetchReimbursements();
  };

  // Fonction pour actualiser les remboursements
  const handleRefreshReimbursements = () => {
    refetchReimbursements();
  };
  
  // Fonction pour forcer la vérification des remboursements
  const handleForceCheckReimbursements = async () => {
    try {
      // Afficher un toast de chargement
      const loadingToast = toast.loading("Vérification des remboursements en cours...");
      
      console.log("Forçage de la vérification des remboursements...");
      
      // Récupérer les remboursements
      const reimbursementsResponse = await fetch(`/api/reimbursements?colocationId=${colocationId}`);
      const reimbursements = await reimbursementsResponse.json();
      
      console.log("Remboursements récupérés:", reimbursements);
      
      // Fermer le toast de chargement
      toast.dismiss(loadingToast);
      
      if (Array.isArray(reimbursements) && reimbursements.length > 0) {
        toast.success(`${reimbursements.length} remboursement(s) trouvé(s)`);
      } else {
        toast.info("Aucun remboursement trouvé");
      }
      
      // Rafraîchir les données
      await refetchBalances();
      await refetchReimbursements();
      
      // Afficher un message de confirmation
      toast.success("Vérification terminée");
    } catch (error) {
      console.error("Erreur lors de la vérification des remboursements:", error);
      toast.error("Erreur lors de la vérification des remboursements");
    }
  };
  
  // Afficher les données de soldes dans la console pour débogage
  useEffect(() => {
    if (balances) {
      console.log("Données de soldes chargées:", balances);
    } else if (isLoadingBalances) {
      console.log("Chargement des soldes en cours...");
    } else {
      console.error("Erreur lors du chargement des soldes");
    }
  }, [balances, isLoadingBalances]);
  
  if (isLoadingColocation || isLoadingExpenses || isLoadingBalances) {
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
        <div className="flex flex-col gap-2 mt-4">
          <Button variant="outline" onClick={() => refetchColocation()}>
            Actualiser les données
          </Button>
          <Button 
            variant="default" 
            onClick={() => {
              // Forcer une requête API directe
              fetch(`/api/colocation/${colocationId}`)
                .then(res => res.json())
                .then(data => {
                  console.log("Données récupérées directement de l'API:", data);
                  alert("Vérifiez la console pour les données récupérées directement de l'API");
                  refetchColocation();
                })
                .catch(err => {
                  console.error("Erreur lors de la récupération directe:", err);
                  alert("Erreur lors de la récupération directe: " + err.message);
                });
            }}
          >
            Forcer la récupération des membres
          </Button>
          <Button asChild>
            <Link href="/colocations">Retour aux colocations</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{colocation.name} - Dépenses</h1>
          <p className="text-muted-foreground">
            Gérez les dépenses partagées de votre colocation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
            {showDebug ? "Masquer le débogage" : "Afficher le débogage"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? "Masquer les soldes" : "Afficher les soldes"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshBalances}>
            Actualiser les soldes
          </Button>
          <Button asChild>
            <Link href={`/colocations/${colocationId}/expenses/new`}>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle dépense
            </Link>
          </Button>
        </div>
      </div>
      
      {showBalances && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Résumé des soldes</CardTitle>
            <CardDescription>
              Qui doit de l'argent à qui ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshBalances}
              >
                Actualiser les soldes
              </Button>
            </div>
            {balances ? (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Soldes des membres */}
                <div>
                  <h3 className="font-medium mb-2">Soldes actuels</h3>
                  <div className="space-y-2">
                    {balances.userBalances && balances.userBalances.length > 0 ? (
                      balances.userBalances.map((member: UserBalance) => (
                        <div key={member.userId} className="flex justify-between items-center p-3 border rounded-md">
                          <div className="flex items-center gap-2">
                            {member.userId === session?.user?.id && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Vous
                              </Badge>
                            )}
                            <span>{member.userName}</span>
                          </div>
                          <Badge 
                            className={
                              member.balance > 0 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : member.balance < 0 
                                  ? "bg-red-100 text-red-800 border-red-200" 
                                  : ""
                            }
                          >
                            {member.balance > 0 ? "+" : ""}{typeof member.balance === 'string' ? parseFloat(member.balance).toFixed(2) : member.balance.toFixed(2)} €
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Aucun solde disponible</p>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>
                      <span className="inline-block w-3 h-3 rounded-full bg-green-100 mr-1"></span> 
                      Solde positif : on vous doit de l'argent
                    </p>
                    <p>
                      <span className="inline-block w-3 h-3 rounded-full bg-red-100 mr-1"></span> 
                      Solde négatif : vous devez de l'argent
                    </p>
                  </div>
                </div>
                
                {/* Remboursements recommandés */}
                <div>
                  <h3 className="font-medium mb-2">Remboursements recommandés</h3>
                  {balances.debts && balances.debts.length > 0 ? (
                    <div className="space-y-2">
                      {balances.debts.map((debt: UserDebt, index: number) => {
                        const isUserInvolved = debt.fromUserId === session?.user?.id || debt.toUserId === session?.user?.id;
                        const isUserPaying = debt.fromUserId === session?.user?.id;
                        const isUserReceiving = debt.toUserId === session?.user?.id;
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between p-3 border rounded-md ${isUserInvolved ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={isUserPaying ? 'font-semibold' : ''}>
                                {isUserPaying ? 'Vous' : debt.fromUserName}
                              </span>
                              <ArrowRight className="h-4 w-4" />
                              <span className={isUserReceiving ? 'font-semibold' : ''}>
                                {isUserReceiving ? 'Vous' : debt.toUserName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>{typeof debt.amount === 'string' ? parseFloat(debt.amount).toFixed(2) : debt.amount.toFixed(2)} €</Badge>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMarkDebtAsPaid(debt)}
                                disabled={isCreating}
                              >
                                <Check className="h-4 w-4 mr-1" /> Marquer comme remboursé
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun remboursement nécessaire</p>
                  )}
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {balances.debts && balances.debts.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleMarkAllDebtsAsPaid}
                          disabled={isCreating}
                        >
                          {isCreating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Marquer toutes les dettes comme remboursées
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Impossible de charger les soldes</p>
                <Button 
                  variant="outline" 
                  onClick={handleRefreshBalances}
                >
                  Réessayer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {showDebug && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations de débogage</CardTitle>
            <CardDescription>Détails techniques pour résoudre les problèmes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Colocation</h3>
                <p><strong>ID:</strong> {colocationId}</p>
                <p><strong>Nom:</strong> {colocation.name}</p>
                <p><strong>Membres disponibles:</strong> {colocation.members ? colocation.members.length : 'undefined'}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Soldes</h3>
                <p><strong>État du chargement:</strong> {isLoadingBalances ? 'En cours' : balances ? 'Chargé' : 'Erreur'}</p>
                <p><strong>Données disponibles:</strong> {balances ? 'Oui' : 'Non'}</p>
                {balances && (
                  <>
                    <p><strong>Nombre de soldes utilisateurs:</strong> {balances.userBalances?.length || 0}</p>
                    <p><strong>Nombre de dettes:</strong> {balances.debts?.length || 0}</p>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRefreshBalances}
                      >
                        Forcer le rechargement des soldes
                      </Button>
                    </div>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium">Données brutes:</h4>
                      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(balances, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
              
              <div>
                <h3 className="font-medium">Actions</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchColocation()}
                  >
                    Actualiser les données
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefreshBalances}
                  >
                    Actualiser les soldes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleMarkAllDebtsAsPaid}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Marquer toutes les dettes comme remboursées
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleForceCheckReimbursements}
                  >
                    Forcer la vérification des remboursements
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">Structure de l'objet colocation</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(colocation, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex items-center gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrer par date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={setFilterDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par mois" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (récent → ancien)</SelectItem>
            <SelectItem value="date-asc">Date (ancien → récent)</SelectItem>
            <SelectItem value="amount-desc">Montant (élevé → bas)</SelectItem>
            <SelectItem value="amount-asc">Montant (bas → élevé)</SelectItem>
          </SelectContent>
        </Select>
        
        {(filterDate || filterMonth) && (
          <Button variant="ghost" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        )}
      </div>
      
      {sortedExpenses && sortedExpenses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedExpenses.map((expense: Expense) => (
            <Link 
              key={expense.id} 
              href={`/colocations/${colocationId}/expenses/${expense.id}`}
              className="block"
            >
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="truncate">{expense.title || expense.description}</CardTitle>
                    <Badge>{parseFloat(expense.amount as any).toFixed(2)} €</Badge>
                  </div>
                  <CardDescription>
                    {format(new Date(expense.date), "dd MMMM yyyy", { locale: fr })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {expense.description && expense.title && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {expense.description}
                    </p>
                  )}
                  <div className="mt-2">
                    <p className="text-sm">
                      Payé par: <span className="font-medium">{expense.payer?.name || expense.paidBy?.name}</span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full">
                    <p className="text-sm text-muted-foreground mb-1">
                      {(expense.participants || []).length} participant{(expense.participants || []).length > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Type: {expense.splitType === "EQUAL" ? "Partage égal" : "Montants personnalisés"}
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Aucune dépense trouvée</p>
          <Button asChild>
            <Link href={`/colocations/${colocationId}/expenses/new`}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter une dépense
            </Link>
          </Button>
        </div>
      )}
      
      {/* Section des remboursements récents */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Remboursements récents</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshReimbursements}
          >
            Actualiser les remboursements
          </Button>
        </div>
        
        {isLoadingReimbursements ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : reimbursements && reimbursements.length > 0 ? (
          <div className="space-y-4">
            {reimbursements.map((reimbursement) => (
              <div key={reimbursement.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {reimbursement.fromUser.name} a remboursé {reimbursement.amount.toFixed(2)}€ à {reimbursement.toUser.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(reimbursement.date), "dd MMMM yyyy", { locale: fr })}
                    {reimbursement.description && ` - ${reimbursement.description}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border rounded-lg">
            <p className="text-gray-500">Aucun remboursement récent</p>
          </div>
        )}
      </div>
    </div>
  );
}