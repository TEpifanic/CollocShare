"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi du code OTP");
      }
      
      setOtpSent(true);
      setShowOtpForm(true);
      
      // En développement, nous pré-remplissons le code OTP retourné par l'API
      if (data.otp) {
        setOtp(data.otp);
      }
      
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // D'abord vérifier l'OTP avec notre API
      const verifyResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp,
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || "Code OTP invalide ou expiré");
      }
      
      // Si l'OTP est valide, utiliser la fonction signIn pour se connecter
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        otpVerified: "true", // Indique que l'OTP a été vérifié
      });
      
      if (result?.error) {
        throw new Error(result.error || "Échec de l'authentification");
      }
      
      // Redirection si tout est bon
      router.push("/dashboard");
      router.refresh();
      
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {!showOtpForm ? (
        <form onSubmit={handleRequestOtp}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Envoi en cours..." : "Créer un compte"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {otpSent && (
                <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-md text-sm">
                  Un code de vérification a été envoyé à {formData.email}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="otp">Code de vérification</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500">
                  Saisissez le code à 6 chiffres envoyé à votre adresse email
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Vérification en cours..." : "Vérifier et créer le compte"}
              </Button>
              
              <Button
                type="button"
                variant="link"
                className="text-sm"
                onClick={() => setShowOtpForm(false)}
                disabled={isLoading}
              >
                Modifier les informations
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
} 