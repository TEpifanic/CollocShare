"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useExpenses, ExpenseSplitType, ExpenseParticipant, Expense } from "@/hooks/useExpenses";
import { useColocations } from "@/hooks/useColocations";
import { cn, getActiveMembers } from "@/lib/utils";

// Type pour les participants pendant l'édition
interface EditExpenseParticipant {
  id?: string;
  userId: string;
  amount: number;
  isPaid?: boolean;
}

export default function ExpenseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const colocationId = params.id as string;
  const expenseId = params.expenseId as string;
  
  const { useExpenseDetailsQuery, useUpdateExpenseMutation, useDeleteExpenseMutation } = useExpenses();
  const { useColocationDetailsQuery } = useColocations();
  
  const { data: expense, isLoading: isLoadingExpense, refetch: refetchExpense } = useExpenseDetailsQuery(expenseId);
  const { data: colocation, isLoading: isLoadingColocation, refetch: refetchColocation } = useColocationDetailsQuery(colocationId);
  const updateExpenseMutation = useUpdateExpenseMutation();
  const deleteExpenseMutation = useDeleteExpenseMutation(colocationId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitType, setSplitType] = useState<ExpenseSplitType>("EQUAL");
  const [participants, setParticipants] = useState<EditExpenseParticipant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialiser le formulaire avec les données de la dépense
  useEffect(() => {
    if (expense) {
      console.log("Données de dépense chargées:", expense);
      setTitle(expense.title || expense.description);
      setAmount(expense.amount.toString());
      setDate(new Date(expense.date));
      setDescription(expense.description || "");
      setPayerId(expense.payerId || expense.paidByUserId);
      setSplitType(expense.splitType || "EQUAL");
      
      // S'assurer que les participants existent avant de les mapper
      if (expense.participants && expense.participants.length > 0) {
        console.log("Participants de la dépense:", expense.participants);
        setParticipants((expense.participants || []).map((p: ExpenseParticipant) => ({
          id: p.id,
          userId: p.userId,
          amount: p.amount,
          isPaid: p.isPaid || false
        })));
      } else {
        console.log("Aucun participant trouvé dans la dépense");
      }
    }
  }, [expense]);
  
  // Déboguer les données de colocation
  useEffect(() => {
    if (colocation) {
      console.log("Données de colocation chargées:", colocation);
      console.log("Membres de la colocation:", colocation.members);
      
      // Vérifier si les membres sont undefined
      if (colocation.members === undefined) {
        console.error("ERREUR: La propriété 'members' est undefined dans l'objet colocation");
        console.log("Structure complète de l'objet colocation:", JSON.stringify(colocation, null, 2));
      } else if (!Array.isArray(colocation.members)) {
        console.error("ERREUR: La propriété 'members' n'est pas un tableau");
        console.log("Type de colocation.members:", typeof colocation.members);
      } else if (colocation.members.length === 0) {
        console.error("ERREUR: Le tableau 'members' est vide");
      } else {
        // Vérifier comment les membres sont filtrés
        const membersWithLeftAt = colocation.members.filter(member => member.leftAt !== null && member.leftAt !== undefined);
        const membersWithoutLeftAt = colocation.members.filter(member => member.leftAt === null || member.leftAt === undefined);
        
        console.log("Membres avec leftAt:", membersWithLeftAt);
        console.log("Membres sans leftAt (actifs):", membersWithoutLeftAt);
      }
    }
  }, [colocation]);
  
  // Mettre à jour les montants des participants lorsque le montant total ou le type de partage change
  useEffect(() => {
    if (isEditing && participants.length > 0 && amount && splitType === "EQUAL") {
      const totalAmount = parseFloat(amount);
      const amountPerPerson = totalAmount / participants.length;
      
      setParticipants(participants.map(participant => ({
        ...participant,
        amount: parseFloat(amountPerPerson.toFixed(2)),
      })));
    }
  }, [amount, splitType, participants.length, isEditing]);
  
  // Calculer le montant restant à répartir pour le partage personnalisé
  const calculateRemainingAmount = () => {
    if (!amount) return 0;
    
    const totalAmount = parseFloat(amount);
    const allocatedAmount = participants.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : parseFloat(p.amount as any)), 0);
    
    return parseFloat((totalAmount - allocatedAmount).toFixed(2));
  };
  
  const remainingAmount = calculateRemainingAmount();
  
  // Mettre à jour le montant d'un participant
  const handleParticipantAmountChange = (userId: string, newAmount: string) => {
    const numericAmount = newAmount === "" ? 0 : parseFloat(newAmount);
    console.log(`Mise à jour du montant pour ${userId}: ${numericAmount}`);
    
    setParticipants(participants.map(participant => 
      participant.userId === userId 
        ? { ...participant, amount: numericAmount } 
        : participant
    ));
  };
  
  // Mettre à jour le statut de paiement d'un participant
  const handleParticipantPaidChange = (userId: string, isPaid: boolean) => {
    setParticipants(participants.map(participant => 
      participant.userId === userId 
        ? { ...participant, isPaid } 
        : participant
    ));
  };
  
  // Valider le formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = "Le titre est requis";
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Le montant doit être supérieur à 0";
    }
    
    if (!payerId) {
      newErrors.payerId = "Le payeur est requis";
    }
    
    if (splitType === "CUSTOM" && Math.abs(remainingAmount) > 0.01) {
      newErrors.participants = "La somme des montants doit être égale au montant total";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await updateExpenseMutation.mutateAsync({
        id: expenseId,
        colocationId,
        amount: parseFloat(amount),
        description: title,
        category: expense?.category || "AUTRE",
        date,
        paidByUserId: payerId,
        splitType: "CUSTOM",
        participants: participants.map(p => ({
          userId: p.userId,
          amount: p.amount,
          isPaid: p.isPaid || false
        }))
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la dépense:", error);
    }
  };
  
  // Supprimer la dépense
  const handleDelete = async () => {
    try {
      await deleteExpenseMutation.mutateAsync(expenseId);
      router.push(`/colocations/${colocationId}/expenses`);
    } catch (error) {
      console.error("Erreur lors de la suppression de la dépense:", error);
    }
  };
  
  if (isLoadingExpense || isLoadingColocation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chargement...</p>
      </div>
    );
  }
  
  if (!expense || !colocation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>Dépense ou colocation non trouvée</p>
        <div className="flex flex-col gap-2 mt-4">
          <Button variant="outline" onClick={() => {
            refetchExpense();
            refetchColocation();
          }}>
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
            <Link href={`/colocations/${colocationId}/expenses`}>Retour aux dépenses</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Utiliser la fonction utilitaire pour obtenir les membres actifs
  const activeMembers = getActiveMembers(colocation.members);
  console.log("Membres actifs détectés:", activeMembers);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href={`/colocations/${colocationId}/expenses`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux dépenses
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{isEditing ? "Modifier la dépense" : (expense.title || expense.description)}</h1>
          <p className="text-muted-foreground">
            {isEditing 
              ? `Modifier les détails de la dépense` 
              : `Créée le ${format(new Date(expense.createdAt), "dd MMMM yyyy", { locale: fr })}`
            }
          </p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette dépense ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Tous les détails de cette dépense seront définitivement supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      
      <Card>
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Modifier la dépense</CardTitle>
              <CardDescription>
                Modifiez les informations concernant cette dépense
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Courses, Internet, Loyer..."
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (€) <span className="text-red-500">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails supplémentaires sur cette dépense..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payerId">Payé par <span className="text-red-500">*</span></Label>
                <Select value={payerId} onValueChange={setPayerId}>
                  <SelectTrigger id="payerId" className={errors.payerId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payerId && <p className="text-sm text-red-500">{errors.payerId}</p>}
              </div>
              
              <div className="space-y-4">
                <Label>Type de partage <span className="text-red-500">*</span></Label>
                <RadioGroup value={splitType} onValueChange={(value) => setSplitType(value as ExpenseSplitType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EQUAL" id="equal" />
                    <Label htmlFor="equal">Partage égal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CUSTOM" id="custom" />
                    <Label htmlFor="custom">Montants personnalisés</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Participants</Label>
                  {splitType === "CUSTOM" && (
                    <p className={cn(
                      "text-sm",
                      Math.abs(remainingAmount) > 0.01 ? "text-red-500" : "text-green-500"
                    )}>
                      Restant: {remainingAmount.toFixed(2)} €
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  {participants.length > 0 ? (
                    participants.map((participant) => {
                      const member = activeMembers.find(m => m.userId === participant.userId);
                      
                      return (
                        <div key={participant.userId} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-2">
                            <span>{member?.user?.name || `Utilisateur ${participant.userId}`}</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                id={`paid-${participant.userId}`}
                                checked={participant.isPaid}
                                onChange={(e) => handleParticipantPaidChange(participant.userId, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor={`paid-${participant.userId}`} className="text-sm">Payé</Label>
                            </div>
                          </div>
                          {splitType === "EQUAL" ? (
                            <span>{parseFloat(participant.amount as any).toFixed(2)} €</span>
                          ) : (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={participant.amount || ""}
                              onChange={(e) => handleParticipantAmountChange(participant.userId, e.target.value)}
                              className="w-24 text-right"
                            />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground">Aucun participant trouvé pour cette dépense.</p>
                  )}
                </div>
                
                {errors.participants && (
                  <p className="text-sm text-red-500">{errors.participants}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={updateExpenseMutation.isPending}>
                {updateExpenseMutation.isPending ? "Mise à jour en cours..." : "Enregistrer les modifications"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{expense.title || expense.description}</CardTitle>
                  <CardDescription>
                    {format(new Date(expense.date), "dd MMMM yyyy", { locale: fr })}
                  </CardDescription>
                </div>
                <Badge className="text-lg px-3 py-1">{parseFloat(expense.amount as any).toFixed(2)} €</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {expense.description && expense.title && (
                <div className="space-y-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-muted-foreground">{expense.description}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="font-medium">Payé par</h3>
                <p>{expense.payer?.name || expense.paidBy?.name}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Type de partage</h3>
                <p>{expense.splitType === "EQUAL" ? "Partage égal" : "Montants personnalisés"}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium">Participants</h3>
                <div className="space-y-2">
                  {(expense.participants || []).length > 0 ? (
                    (expense.participants || []).map((participant: ExpenseParticipant) => {
                      const member = colocation.members?.find(m => m.userId === participant.userId);
                      
                      return (
                        <div key={participant.userId} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-2">
                            <span>{member?.user?.name || `Utilisateur ${participant.userId}`}</span>
                            {participant.isPaid && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Payé
                              </Badge>
                            )}
                          </div>
                          <span className="font-medium">{parseFloat(participant.amount as any).toFixed(2)} €</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground">Aucun participant trouvé pour cette dépense.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
} 