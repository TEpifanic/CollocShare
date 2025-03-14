"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReimbursements, CreateReimbursementData } from "@/hooks/useReimbursements";
import { useColocations } from "@/hooks/useColocations";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function NewReimbursementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const colocationId = params.id as string;
  
  // Récupérer les paramètres de l'URL s'ils existent
  const fromUserIdParam = searchParams.get("fromUserId");
  const toUserIdParam = searchParams.get("toUserId");
  const amountParam = searchParams.get("amount");
  
  const { useCreateReimbursementMutation } = useReimbursements();
  const { useColocationDetailsQuery } = useColocations();
  
  const { data: colocation, isLoading: isLoadingColocation } = useColocationDetailsQuery(colocationId);
  const createReimbursementMutation = useCreateReimbursementMutation();
  
  const [amount, setAmount] = useState(amountParam || "");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [fromUserId, setFromUserId] = useState(fromUserIdParam || "");
  const [toUserId, setToUserId] = useState(toUserIdParam || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialiser le payeur avec l'utilisateur connecté si aucun paramètre n'est fourni
  useEffect(() => {
    if (!fromUserIdParam && session?.user?.id) {
      setFromUserId(session.user.id);
    }
  }, [session, fromUserIdParam]);
  
  // Valider le formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Le montant doit être supérieur à 0";
    }
    
    if (!fromUserId) {
      newErrors.fromUserId = "Le payeur est requis";
    }
    
    if (!toUserId) {
      newErrors.toUserId = "Le bénéficiaire est requis";
    }
    
    if (fromUserId === toUserId) {
      newErrors.toUserId = "Le payeur et le bénéficiaire doivent être différents";
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
      const reimbursementData: CreateReimbursementData = {
        amount: parseFloat(amount as string),
        date,
        description: description || "Remboursement",
        fromUserId,
        toUserId,
        colocationId
      };
      
      await createReimbursementMutation.mutateAsync(reimbursementData);
      
      router.push(`/colocations/${colocationId}/reimbursements`);
    } catch (error) {
      console.error("Erreur lors de la création du remboursement:", error);
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
  
  const activeMembers = colocation.members?.filter(member => !member.leftAt) || [];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href={`/colocations/${colocationId}/reimbursements`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux remboursements
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouveau remboursement</h1>
          <p className="text-muted-foreground">
            Enregistrer un remboursement entre colocataires
          </p>
        </div>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Détails du remboursement</CardTitle>
            <CardDescription>
              Renseignez les informations concernant ce remboursement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                placeholder="Détails supplémentaires sur ce remboursement..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromUserId">Payé par <span className="text-red-500">*</span></Label>
              <Select value={fromUserId} onValueChange={setFromUserId}>
                <SelectTrigger id="fromUserId" className={errors.fromUserId ? "border-red-500" : ""}>
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
              {errors.fromUserId && <p className="text-sm text-red-500">{errors.fromUserId}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toUserId">Payé à <span className="text-red-500">*</span></Label>
              <Select value={toUserId} onValueChange={setToUserId}>
                <SelectTrigger id="toUserId" className={errors.toUserId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {activeMembers.map((member) => (
                    <SelectItem 
                      key={member.userId} 
                      value={member.userId}
                      disabled={member.userId === fromUserId}
                    >
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.toUserId && <p className="text-sm text-red-500">{errors.toUserId}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href={`/colocations/${colocationId}/reimbursements`}>Annuler</Link>
            </Button>
            <Button type="submit" disabled={createReimbursementMutation.isPending}>
              {createReimbursementMutation.isPending ? "Création en cours..." : "Créer le remboursement"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 