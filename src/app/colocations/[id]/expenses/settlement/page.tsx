"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExpenses, CreateSettlementData } from "@/hooks/useExpenses";
import { useColocations } from "@/hooks/useColocations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import Link from "next/link";

const SettlementPage = () => {
  const params = useParams();
  const router = useRouter();
  const colocationId = params.id as string;

  // Hooks
  const { useCreateSettlementMutation, useBalancesQuery } = useExpenses();
  const { useColocationDetailsQuery } = useColocations();

  // Queries
  const { data: colocation, isLoading: isLoadingColocation } = useColocationDetailsQuery(colocationId);
  const { data: balances, isLoading: isLoadingBalances } = useBalancesQuery(colocationId);
  const createSettlementMutation = useCreateSettlementMutation();

  // État du formulaire
  const [formData, setFormData] = useState<Partial<CreateSettlementData>>({
    colocationId,
    fromUserId: "",
    toUserId: "",
    amount: 0,
    description: "Remboursement",
  });

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  // Gérer les changements de sélection
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si on sélectionne un débiteur et qu'il y a des suggestions de remboursement
    if (name === "fromUserId" && balances?.optimizedSettlements) {
      // Trouver les remboursements suggérés pour ce débiteur
      const suggestedSettlements = balances.optimizedSettlements.filter(
        (settlement) => settlement.fromUser.id === value
      );

      // S'il y a une suggestion, pré-remplir le destinataire et le montant
      if (suggestedSettlements.length > 0) {
        const suggestion = suggestedSettlements[0];
        setFormData((prev) => ({
          ...prev,
          toUserId: suggestion.toUser.id,
          amount: suggestion.amount,
        }));
      }
    }
  };

  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    return (
      !!formData.fromUserId &&
      !!formData.toUserId &&
      !!formData.amount &&
      formData.amount > 0 &&
      formData.fromUserId !== formData.toUserId
    );
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createSettlementMutation.mutateAsync(formData as CreateSettlementData);
      router.push(`/colocations/${colocationId}/expenses`);
    } catch (error) {
      console.error("Erreur lors de la création du remboursement:", error);
    }
  };

  // Utiliser une suggestion de remboursement
  const handleUseSuggestion = (suggestion: any) => {
    setFormData({
      colocationId,
      fromUserId: suggestion.fromUser.id,
      toUserId: suggestion.toUser.id,
      amount: suggestion.amount,
      description: "Remboursement",
    });
  };

  // Obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Formatage des montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (isLoadingColocation || isLoadingBalances) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!colocation) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold">Colocation non trouvée</h1>
        <p>La colocation que vous recherchez n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
        <Button asChild className="mt-4">
          <Link href="/colocations">Retour aux colocations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild className="mb-2">
          <Link href={`/colocations/${colocationId}/expenses`}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Retour aux dépenses
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nouveau remboursement - {colocation.name}</h1>
        <p className="text-muted-foreground">Enregistrez un remboursement entre membres de la colocation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Détails du remboursement</CardTitle>
            <CardDescription>Renseignez les informations concernant ce remboursement</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fromUserId">Qui rembourse ?</Label>
                  <Select
                    value={formData.fromUserId}
                    onValueChange={(value) => handleSelectChange("fromUserId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez qui rembourse" />
                    </SelectTrigger>
                    <SelectContent>
                      {colocation.members
                        .filter((member) => !member.leftAt)
                        .map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.user.avatar || ""} alt={member.user.name} />
                                <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                              </Avatar>
                              <span>{member.user.name}</span>
                              {member.isCurrentUser && <span className="text-xs text-muted-foreground">(Vous)</span>}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="toUserId">Qui reçoit le remboursement ?</Label>
                  <Select
                    value={formData.toUserId}
                    onValueChange={(value) => handleSelectChange("toUserId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez qui reçoit" />
                    </SelectTrigger>
                    <SelectContent>
                      {colocation.members
                        .filter((member) => !member.leftAt && member.userId !== formData.fromUserId)
                        .map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.user.avatar || ""} alt={member.user.name} />
                                <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                              </Avatar>
                              <span>{member.user.name}</span>
                              {member.isCurrentUser && <span className="text-xs text-muted-foreground">(Vous)</span>}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Montant (€)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount || ""}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder="Ex: Remboursement pour les courses"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" asChild>
                  <Link href={`/colocations/${colocationId}/expenses`}>Annuler</Link>
                </Button>
                <Button type="submit" disabled={!isFormValid() || createSettlementMutation.isPending}>
                  {createSettlementMutation.isPending ? "Création en cours..." : "Enregistrer le remboursement"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {balances && balances.optimizedSettlements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Remboursements suggérés</CardTitle>
              <CardDescription>Suggestions pour équilibrer les comptes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balances.optimizedSettlements.map((settlement, index) => (
                  <div key={index} className="flex flex-col gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={settlement.fromUser.avatar || ""} alt={settlement.fromUser.name} />
                          <AvatarFallback>{getInitials(settlement.fromUser.name)}</AvatarFallback>
                        </Avatar>
                        <ArrowRightIcon className="h-4 w-4" />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={settlement.toUser.avatar || ""} alt={settlement.toUser.name} />
                          <AvatarFallback>{getInitials(settlement.toUser.name)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="font-semibold">{formatAmount(settlement.amount)}</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{settlement.fromUser.name}</span> doit{" "}
                      <span className="font-semibold">{formatAmount(settlement.amount)}</span> à{" "}
                      <span className="font-medium">{settlement.toUser.name}</span>
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUseSuggestion(settlement)}
                      className="mt-1"
                    >
                      Utiliser cette suggestion
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettlementPage; 