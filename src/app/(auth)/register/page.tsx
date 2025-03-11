import Link from "next/link";
import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Inscription | CollocShare",
  description: "Créez un compte pour gérer votre colocation",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Créer un compte</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Inscrivez-vous pour commencer à gérer votre colocation
        </p>
      </div>
      
      <RegisterForm />
      
      <div className="text-center">
        <p className="text-sm">
          Vous avez déjà un compte ?{" "}
          <Link 
            href="/login" 
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
} 