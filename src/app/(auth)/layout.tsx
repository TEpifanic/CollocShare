import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentification | CollocShare",
  description: "Connectez-vous ou créez un compte pour gérer votre colocation",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* En-tête simple */}
      <header className="py-6 px-4 sm:px-6 flex justify-center border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          CollocShare
        </Link>
      </header>

      {/* Contenu principal centré */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      
      {/* Pied de page simple */}
      <footer className="py-6 px-4 sm:px-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <p>© {new Date().getFullYear()} CollocShare. Tous droits réservés.</p>
      </footer>
    </div>
  );
} 