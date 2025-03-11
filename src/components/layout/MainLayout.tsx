import Link from "next/link";
import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Layout principal pour les pages authentifiées
 * Inclut une barre de navigation et une barre latérale
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Barre de navigation */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              CollocShare
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="py-2 px-3 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Tableau de bord
            </Link>
            <Link 
              href="/dashboard/expenses" 
              className="py-2 px-3 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Dépenses
            </Link>
            <Link 
              href="/dashboard/tasks" 
              className="py-2 px-3 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Tâches
            </Link>
            <Link 
              href="/dashboard/shopping" 
              className="py-2 px-3 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Courses
            </Link>
          </nav>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
              <span className="sr-only">Notifications</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            <div className="relative">
              <button className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                <span className="sr-only">Profil</span>
                <span className="text-xs font-medium">US</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Contenu principal avec sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Barre latérale (visible uniquement sur desktop) */}
        <aside className="hidden md:block w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4">
          <nav>
            <div className="mb-4">
              <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Colocation
              </div>
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/dashboard" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    Vue d'ensemble
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/members" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    Membres
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/settings" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    Paramètres
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="mb-4">
              <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Gestion
              </div>
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/dashboard/expenses" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    Dépenses
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/tasks" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    Tâches
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/shopping" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    Courses
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/calendar" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    Calendrier
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Communication
              </div>
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/dashboard/messages" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    Messages
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/documents" 
                    className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    Documents
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        {/* Contenu principal */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 