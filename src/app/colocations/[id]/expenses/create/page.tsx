"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExpenses, CreateExpenseData } from "@/hooks/useExpenses";
import { useColocations } from "@/hooks/useColocations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftIcon, CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "ALIMENTATION",
  "LOYER",
  "FACTURES",
  "COURSES",
  "TRANSPORT",
  "LOISIRS",
  "AUTRE",
];

const CreateExpensePage = () => {
  const params = useParams();
  const router = useRouter();
  const colocationId = params.id as string;

  // Hooks
  const { useCreateExpenseMutation } = useExpenses();
  const { useColocationDetailsQuery } = useColocations();

  // Queries
  const { data: colocation, isLoading: isLoadingColocation } = useColocationDetailsQuery(colocationId);
  const createExpenseMutation = useCreateExpenseMutation();

  // État du formulaire
  const [formData, setFormData] = useState<Partial<CreateExpenseData>>({
    colocationId,
    amount: 0,
    description: "",
    category: "ALIMENTATION",
    date: new Date(),
    paidByUserId: "",
    splitType: "EQUAL",
    participants: [],
  });

  // État pour la date
  const [date, setDate] = useState<Date>(new Date());

  // Mettre à jour les participants lorsque la colocation est chargée
  useEffect(() => {
    if (colocation && colocation.members) {
      // Définir l'utilisateur qui paie comme l'utilisateur actuel par défaut
      const currentUser = colocation.members.find((member) => member.isCurrentUser);
      if (currentUser) {
        setFormData((prev) => ({
          ...prev,
          paidByUserId: currentUser.userId,
        }));
      }

      // Initialiser les participants avec tous les membres actifs
      const activeMembers = colocation.members.filter((member) => !member.leftAt);
      setFormData((prev) => ({
        ...prev,
        participants: activeMembers.map((member) => ({
          userId: member.userId,
          amount: 0, // Sera calculé lors de la soumission
          isPaid: member.isCurrentUser, // Le payeur est considéré comme ayant déjà payé
        })),
      }));
    }
  }, [colocation]);

  // Mettre à jour les montants des participants en fonction du type de répartition
  useEffect(() => {
    if (formData.splitType === "EQUAL" && formData.amount && formData.participants?.length) {
      const amountPerPerson = formData.amount / formData.participants.length;
      setFormData((prev) => ({
        ...prev,
        participants: prev.participants?.map((participant) => ({
          ...participant,
          amount: amountPerPerson,
        })),
      }));
    }
  }, [formData.splitType, formData.amount, formData.participants?.length]);

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
  };

  // Gérer les changements de date
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDate(date);
      setFormData((prev) => ({
        ...prev,
        date,
      }));
    }
  };

  // Gérer les changements de montant pour un participant spécifique (mode CUSTOM)
  const handleParticipantAmountChange = (userId: string, amount: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants?.map((participant) =>
        participant.userId === userId
          ? { ...participant, amount }
          : participant
      ),
    }));
  };

  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    if (!formData.description || !formData.amount || !formData.paidByUserId) {
      return false;
    }

    if (formData.splitType === "CUSTOM") {
      // Vérifier que la somme des montants des participants est égale au montant total
      const totalParticipantsAmount = formData.participants?.reduce(
        (sum, participant) => sum + (participant.amount || 0),
        0
      ) || 0;
      
      return Math.abs(totalParticipantsAmount - formData.amount) < 0.01;
    }

    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createExpenseMutation.mutateAsync(formData as CreateExpenseData);
      router.push(`/colocations/${colocationId}/expenses`);
    } catch (error) {
      console.error("Erreur lors de la création de la dépense:", error);
    }
  };

  // Obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoadingColocation) {
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
        <h1 className="text-2xl font-bold">Nouvelle dépense - {colocation.name}</h1>
        <p className="text-muted-foreground">Ajoutez une nouvelle dépense à partager avec vos colocataires</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de la dépense</CardTitle>
          <CardDescription>Renseignez les informations concernant cette dépense</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ex: Courses au supermarché"
                  required
                />
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
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
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
                      {date ? format(date, "PPP", { locale: fr }) : "Sélectionnez une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="paidByUserId">Payé par</Label>
                <Select
                  value={formData.paidByUserId}
                  onValueChange={(value) => handleSelectChange("paidByUserId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez qui a payé" />
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
                <Label>Type de répartition</Label>
                <RadioGroup
                  value={formData.splitType}
                  onValueChange={(value) => handleSelectChange("splitType", value)}
                  className="flex flex-col space-y-1 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EQUAL" id="split-equal" />
                    <Label htmlFor="split-equal" className="cursor-pointer">Répartition égale</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CUSTOM" id="split-custom" />
                    <Label htmlFor="split-custom" className="cursor-pointer">Répartition personnalisée</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.splitType === "CUSTOM" && (
                <div className="mt-4">
                  <Label>Montants par personne</Label>
                  <div className="space-y-3 mt-2">
                    {formData.participants?.map((participant) => {
                      const member = colocation.members.find((m) => m.userId === participant.userId);
                      if (!member || member.leftAt) return null;
                      
                      return (
                        <div key={participant.userId} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.avatar || ""} alt={member.user.name} />
                            <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                          </Avatar>
                          <span className="flex-grow">{member.user.name}</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={participant.amount || ""}
                            onChange={(e) => handleParticipantAmountChange(participant.userId, parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                          <span>€</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {formData.splitType === "CUSTOM" && (
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total réparti:</span>
                        <span className={
                          Math.abs(
                            (formData.participants?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0) - 
                            (formData.amount || 0)
                          ) < 0.01
                            ? "text-green-600"
                            : "text-red-600"
                        }>
                          {formData.participants?.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2) || "0.00"} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Montant total:</span>
                        <span>{formData.amount?.toFixed(2) || "0.00"} €</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" asChild>
                <Link href={`/colocations/${colocationId}/expenses`}>Annuler</Link>
              </Button>
              <Button type="submit" disabled={!isFormValid() || createExpenseMutation.isPending}>
                {createExpenseMutation.isPending ? "Création en cours..." : "Créer la dépense"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateExpensePage; 