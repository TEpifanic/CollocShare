import Link from "next/link";
import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Connexion | CollocShare",
  description: "Connectez-vous à votre compte CollocShare",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Connexion</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Connectez-vous pour accéder à votre colocation
        </p>
      </div>
      
      <LoginForm />
      
      <div className="text-center space-y-2">
        <p className="text-sm">
          Vous n'avez pas de compte ?{" "}
          <Link 
            href="/register" 
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Créer un compte
          </Link>
        </p>
        <p className="text-sm">
          <Link 
            href="/forgot-password" 
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </div>
  );
} 