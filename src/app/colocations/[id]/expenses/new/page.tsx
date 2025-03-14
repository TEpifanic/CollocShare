"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses, ExpenseSplitType, ExpenseParticipant } from "@/hooks/useExpenses";
import { useColocations } from "@/hooks/useColocations";
import { useSession } from "next-auth/react";
import { cn, getActiveMembers } from "@/lib/utils";

// Type pour les participants pendant la création
interface NewExpenseParticipant {
  userId: string;
  amount: number;
}

export default function NewExpensePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const colocationId = params.id as string;
  
  const { useCreateExpenseMutation } = useExpenses();
  const { useColocationDetailsQuery } = useColocations();
  
  const { data: colocation, isLoading: isLoadingColocation, refetch: refetchColocation } = useColocationDetailsQuery(colocationId);
  const createExpenseMutation = useCreateExpenseMutation();
  
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitType, setSplitType] = useState<ExpenseSplitType>("EQUAL");
  const [participants, setParticipants] = useState<NewExpenseParticipant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
  
  // Initialiser le payeur avec l'utilisateur connecté
  useEffect(() => {
    if (session?.user?.id) {
      setPayerId(session.user.id);
    }
  }, [session]);
  
  // Initialiser les participants lorsque les données de la colocation sont chargées
  useEffect(() => {
    if (colocation?.members && colocation.members.length > 0) {
      // Utiliser la fonction utilitaire pour obtenir les membres actifs
      const activeMembers = getActiveMembers(colocation.members);
      console.log("Initialisation des participants avec les membres actifs:", activeMembers);
      
      if (activeMembers.length > 0) {
        const initialParticipants = activeMembers.map(member => ({
          userId: member.userId,
          amount: 0,
        }));
        
        setParticipants(initialParticipants);
      }
    }
  }, [colocation]);
  
  // Mettre à jour les montants des participants lorsque le montant total ou le type de partage change
  useEffect(() => {
    if (participants.length > 0 && amount) {
      const totalAmount = parseFloat(amount);
      
      if (splitType === "EQUAL") {
        const amountPerPerson = totalAmount / participants.length;
        
        setParticipants(participants.map(participant => ({
          ...participant,
          amount: parseFloat(amountPerPerson.toFixed(2)),
        })));
      } else if (splitType === "CUSTOM" && participants.every(p => p.amount === 0)) {
        // Initialiser les montants personnalisés uniquement si tous sont à zéro
        setParticipants(participants.map(participant => ({
          ...participant,
          amount: 0,
        })));
      }
    }
  }, [amount, splitType, participants.length]);
  
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
    
    setParticipants(participants.map(participant => 
      participant.userId === userId 
        ? { ...participant, amount: numericAmount } 
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
      await createExpenseMutation.mutateAsync({
        colocationId,
        amount: parseFloat(amount),
        description: title,
        category: "AUTRE",
        date,
        paidByUserId: payerId,
        splitType,
        participants: participants.map(p => ({
          userId: p.userId,
          amount: p.amount,
          isPaid: false
        }))
      });
      
      router.push(`/colocations/${colocationId}/expenses`);
    } catch (error) {
      console.error("Erreur lors de la création de la dépense:", error);
    }
  };
  
  if (isLoadingColocation) {
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
  
  // Utiliser la fonction utilitaire pour obtenir les membres actifs
  const activeMembers = getActiveMembers(colocation.members);
  console.log("Membres actifs détectés:", activeMembers);
  
  // Vérifier si nous avons des membres actifs
  if (activeMembers.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild className="mr-4">
            <Link href={`/colocations/${colocationId}/expenses`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux dépenses
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nouvelle dépense</h1>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Aucun membre actif</CardTitle>
            <CardDescription>
              Vous ne pouvez pas créer de dépense car il n'y a pas de membres actifs dans cette colocation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Détails de débogage :</p>
              <div className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                <p><strong>ID de la colocation :</strong> {colocationId}</p>
                <p><strong>Nom de la colocation :</strong> {colocation.name}</p>
                <p><strong>Membres disponibles :</strong> {colocation.members ? colocation.members.length : 'undefined'}</p>
                <p><strong>Structure de l'objet colocation :</strong></p>
                <pre>{JSON.stringify(colocation, null, 2)}</pre>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => refetchColocation()}
                >
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
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={`/colocations/${colocationId}/expenses`}>Retour aux dépenses</Link>
            </Button>
            <Button asChild>
              <Link href={`/colocations/${colocationId}`}>Gérer les membres</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href={`/colocations/${colocationId}/expenses`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux dépenses
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouvelle dépense</h1>
          <p className="text-muted-foreground">
            Ajouter une nouvelle dépense pour {colocation.name}
          </p>
        </div>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Détails de la dépense</CardTitle>
            <CardDescription>
              Renseignez les informations concernant cette dépense
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
                      {member.user.name || `Utilisateur ${member.userId}`}
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
                        <span>{member?.user?.name || `Utilisateur ${participant.userId}`}</span>
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
                  <p className="text-muted-foreground">Aucun participant trouvé. Veuillez vérifier les membres de la colocation.</p>
                )}
              </div>
              
              {errors.participants && (
                <p className="text-sm text-red-500">{errors.participants}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href={`/colocations/${colocationId}/expenses`}>Annuler</Link>
            </Button>
            <Button type="submit" disabled={createExpenseMutation.isPending || participants.length === 0}>
              {createExpenseMutation.isPending ? "Création en cours..." : "Créer la dépense"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 