"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useColocations } from "@/hooks/useColocations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { ChevronLeft, Send } from "lucide-react";
import Link from "next/link";
import axios from "axios";

interface InviterPageProps {
  params: {
    id: string;
  };
}

export default function InviterPage({ params }: InviterPageProps) {
  // Capture l'ID en dehors de toute fonction qui pourrait être réexécutée
  // lors du rendu pour éviter l'avertissement concernant params
  const colocationId = params.id;
  
  const router = useRouter();
  const { inviteUser, isInviting, inviteError } = useColocations();
  const [email, setEmail] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }
    
    try {
      await inviteUser(
        { email, colocationId },
        {
          onSuccess: (data) => {
            if (data.emailSent) {
              if (data.isResend) {
                toast.success("Invitation renvoyée avec succès");
              } else {
                toast.success("Invitation envoyée avec succès");
              }
            } else {
              toast.success(
                "Invitation créée, mais l'email n'a pas pu être envoyé. " +
                "Vous pouvez partager le lien manuellement.", 
                { duration: 6000 }
              );
            }
            setEmail("");
          },
          onError: (error: unknown) => {
            console.error("Erreur lors de l'envoi de l'invitation:", error);
            if (axios.isAxiosError(error) && error.response?.data?.message) {
              toast.error(error.response.data.message);
            } else {
              toast.error("Erreur lors de l'envoi de l'invitation");
            }
          },
        }
      );
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation:", error);
      toast.error("Erreur lors de l'envoi de l'invitation");
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/colocations/${colocationId}`} className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour à la colocation
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Inviter des colocataires</h1>
        <p className="text-slate-500 mt-2">
          Envoyez des invitations aux personnes avec qui vous souhaitez partager votre colocation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Envoyer une invitation</CardTitle>
          <CardDescription>
            Un email sera envoyé avec un lien pour rejoindre votre colocation.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleInvite}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                required
              />
            </div>
            
            <div className="mt-4 text-sm text-slate-500 space-y-2 border-t pt-4">
              <p className="font-medium">Informations importantes :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Les invitations expirent après 7 jours</li>
                <li>Si l'invitation n'est pas reçue, elle peut être renvoyée après un court délai</li>
                <li>Vous pouvez annuler les invitations à tout moment depuis les paramètres</li>
                <li>L'invité doit créer un compte s'il n'en a pas déjà un</li>
              </ul>
              
              <p className="font-medium mt-4">Problèmes avec l'email ?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Vérifiez que l'adresse email est correcte</li>
                <li>Demandez à la personne de vérifier son dossier spam/indésirables</li>
                <li>Attendez quelques minutes avant de renvoyer l'invitation</li>
                <li>Si le problème persiste, contactez le support</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isInviting || !email}
              className="flex items-center"
            >
              {isInviting ? (
                "Envoi en cours..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 