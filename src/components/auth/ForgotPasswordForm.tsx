"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Appel à l'API pour demander un lien de réinitialisation
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue");
      }
      
      // Réinitialisation demandée avec succès
      setSuccess(true);
      
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };
  
  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-md text-center">
            <p className="font-medium">Vérifiez votre boîte de réception !</p>
            <p className="text-sm mt-1">
              Si un compte existe avec l'email {email}, nous vous avons envoyé un lien 
              pour réinitialiser votre mot de passe.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2 pt-0">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 