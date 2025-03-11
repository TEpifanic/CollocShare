import Link from "next/link";
import { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié | CollocShare",
  description: "Réinitialisez votre mot de passe CollocShare",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Entrez votre adresse email pour recevoir un lien de réinitialisation
        </p>
      </div>
      
      <ForgotPasswordForm />
      
      <div className="text-center">
        <p className="text-sm">
          <Link 
            href="/login" 
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
} 