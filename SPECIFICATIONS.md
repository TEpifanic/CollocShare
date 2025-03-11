# Spécifications techniques de CollocShare

## 1. Présentation du projet

### 1.1 Contexte
La colocation est un mode d'habitat de plus en plus répandu, particulièrement chez les étudiants et jeunes actifs. Cependant, la gestion quotidienne d'une colocation (finances, tâches ménagères, courses) reste souvent source de conflits.

### 1.2 Objectif
Développer une plateforme web nommée "CollocShare" qui centralise et automatise la gestion des aspects pratiques d'une colocation.

## 2. Stack technique complète

### 2.1 Frontend
- **Framework principal** : Next.js 15.2.0 (avec App Router)
- **Bibliothèque UI** : React 19.0.0, React DOM 19.0.0
- **Framework CSS** : Tailwind CSS 4.x
- **Composants UI** : Shadcn UI (basé sur Radix UI)
- **Icônes** : Lucide React 0.476.0
- **Utilitaires CSS** :
  - Class Variance Authority 0.7.1 (pour les variantes de composants)
  - clsx 2.1.1 (pour la gestion conditionnelle des classes)
  - tailwind-merge 3.0.2 (pour fusionner les classes Tailwind)

### 2.2 Backend
- **Framework** : Next.js API Routes
- **ORM** : Prisma 6.4.1 avec @prisma/client 6.4.1
- **Base de données** : PostgreSQL
- **Authentification** : NextAuth.js 4.24.11 avec @auth/prisma-adapter 2.8.0
- **Validation de données** : Zod 3.24.2
- **Cryptographie** : bcrypt 5.1.1
- **Emails** : @sendgrid/mail 8.1.4

### 2.3 Gestion d'état
- **Principales fonctionnalités** : React Context + Reducers
- **Fonctionnalités complexes** : Zustand 5.0.3

### 2.4 Qualité et outils de développement
- **Linting** : ESLint 9.x avec eslint-config-next
- **TypeScript** : TypeScript 5.x
- **Analyse de code** : SonarLint 1.1.0
- **Types** : 
  - @types/node
  - @types/react
  - @types/react-dom
  - @types/bcrypt (à installer)

## 3. Fonctionnalités détaillées

### 3.1 Authentification et gestion des utilisateurs
- **Inscription** :
  - Par email/mot de passe
  - Via OAuth (Google)
  - Validation du compte par email
- **Connexion** :
  - Par email/mot de passe
  - Via OAuth (Google)
  - Récupération de mot de passe
- **Profil utilisateur** :
  - Modification des informations personnelles
  - Téléchargement d'avatar
  - Préférences de notifications
- **Sécurité** :
  - Hachage des mots de passe (bcrypt)
  - Session sécurisée (JWT)
  - Protection CSRF
  - Validation des permissions

### 3.2 Gestion des colocations
- **Création de colocation** :
  - Formulaire de création avec paramètres (nom, adresse, etc.)
  - Upload d'image pour la colocation
- **Invitation de colocataires** :
  - Par email avec lien unique
  - Gestion des invitations en attente
- **Paramétrage** :
  - Configuration du nombre de chambres
  - Gestion de l'adresse et informations
  - Paramètres de la colocation
- **Gestion des membres** :
  - Attribution des rôles (admin, membre)
  - Gestion des départs/arrivées de colocataires
  - Historique des membres

### 3.3 Gestion des dépenses
- **Ajout de dépenses** :
  - Interface simple d'ajout
  - Catégorisation (courses, loyer, loisirs, etc.)
  - Support pour dépenses récurrentes
- **Justificatifs** :
  - Téléchargement de factures/reçus
  - Stockage sécurisé
  - Prévisualisation
- **Calcul d'équilibre** :
  - Algorithme de répartition équitable
  - Gestion des pourcentages personnalisés
  - Calcul automatique "qui doit quoi à qui"
- **Visualisation et rapports** :
  - Graphiques de dépenses (par catégorie, par personne)
  - Historique des transactions
  - Export des données (PDF, CSV)

### 3.4 Planning des tâches ménagères
- **Création de tâches** :
  - Tâches personnalisées avec description
  - Fréquence (quotidienne, hebdomadaire, mensuelle)
  - Niveau de priorité
- **Attribution** :
  - Attribution automatique équitable
  - Attribution manuelle
  - Système de rotation
- **Suivi** :
  - Notifications/rappels
  - Validation des tâches effectuées
  - Historique d'accomplissement
- **Statistiques** :
  - Vue d'ensemble de la participation
  - Équité de la répartition
  - Points d'équilibre

### 3.5 Inventaire et courses
- **Liste de courses** :
  - Ajout d'articles avec quantité
  - Assignation de responsabilité
  - Marquage des éléments achetés
- **Gestion des stocks** :
  - Suivi des produits essentiels
  - Alerte de réapprovisionnement
  - Gestion de la date de péremption
- **Historique** :
  - Historique des achats
  - Statistiques de consommation
  - Suggestions basées sur les habitudes

### 3.6 Calendrier partagé
- **Événements** :
  - Création d'événements (fête, dîner, etc.)
  - Événements récurrents
  - Événements privés/publics
- **Réservation d'espaces** :
  - Réservation des zones communes
  - Gestion des conflits
  - Règles de priorité
- **Signalement d'absences/présences** :
  - Enregistrement des périodes d'absence
  - Notification aux colocataires
  - Impact sur la répartition des tâches
- **Intégration externe** :
  - Synchronisation Google Calendar
  - Synchronisation Apple Calendar
  - Import/export iCal

### 3.7 Communication
- **Messagerie interne** :
  - Chat en temps réel
  - Historique des conversations
  - Notifications
- **Tableau d'annonces** :
  - Annonces importantes
  - Système de priorité
  - Confirmation de lecture
- **Documents partagés** :
  - Upload de documents importants
  - Organisation par catégories
  - Versioning de documents
- **Notifications** :
  - Email (SendGrid)
  - Web Push
  - Préférences personnalisées

## 4. Modèle de données

### 4.1 User
- id: uuid
- email: string (unique)
- password: string (hashed)
- name: string
- avatar: string (URL)
- createdAt: datetime
- updatedAt: datetime
- Relations: memberships, paidExpenses, assignedTasks

### 4.2 Colocation
- id: uuid
- name: string
- address: string
- createdAt: datetime
- updatedAt: datetime
- Relations: memberships, expenses, tasks, shoppingItems, calendarEvents, messages, documents

### 4.3 Membership
- id: uuid
- userId: uuid (foreign key)
- colocationId: uuid (foreign key)
- role: enum (ADMIN, MEMBER)
- joinedAt: datetime
- leftAt: datetime (nullable)
- Relations: user, colocation

### 4.4 Expense
- id: uuid
- colocationId: uuid (foreign key)
- paidByUserId: uuid (foreign key)
- amount: decimal
- description: string
- category: string
- date: datetime
- receipt: string (URL, optional)
- createdAt: datetime
- updatedAt: datetime
- Relations: paidBy (User), colocation

### 4.5 Task
- id: uuid
- colocationId: uuid (foreign key)
- name: string
- description: string
- assignedToUserId: uuid (foreign key, nullable)
- dueDate: datetime
- completed: boolean
- recurring: enum (NONE, DAILY, WEEKLY, MONTHLY)
- createdAt: datetime
- updatedAt: datetime
- Relations: assignedTo (User), colocation

### 4.6 ShoppingItem
- id: uuid
- colocationId: string
- name: string
- quantity: int
- purchased: boolean
- createdAt: datetime
- updatedAt: datetime
- Relations: colocation

### 4.7 CalendarEvent
- id: uuid
- colocationId: string
- title: string
- description: string (nullable)
- startDate: datetime
- endDate: datetime
- createdAt: datetime
- updatedAt: datetime
- Relations: colocation

### 4.8 Message
- id: uuid
- colocationId: string
- senderId: string
- content: string
- createdAt: datetime
- Relations: colocation

### 4.9 Document
- id: uuid
- colocationId: string
- name: string
- url: string
- createdAt: datetime
- updatedAt: datetime
- Relations: colocation

## 5. Architecture et structure du projet

### 5.1 Structure des dossiers
```
collocshare/
├── prisma/                # Schéma Prisma et migrations
├── public/                # Fichiers statiques
├── src/
│   ├── app/               # Routes de l'application (App Router)
│   │   ├── api/           # Routes API
│   │   │   ├── auth/      # API d'authentification
│   │   │   ├── colocations/ # API des colocations
│   │   │   ├── expenses/  # API des dépenses
│   │   │   ├── tasks/     # API des tâches
│   │   │   └── ...
│   │   ├── (auth)/        # Pages d'authentification
│   │   │   ├── login/     # Page de connexion
│   │   │   ├── register/  # Page d'inscription
│   │   │   └── ...
│   │   ├── dashboard/     # Dashboard et fonctionnalités principales
│   │   │   ├── expenses/  # Gestion des dépenses
│   │   │   ├── tasks/     # Gestion des tâches
│   │   │   ├── shopping/  # Gestion des courses
│   │   │   ├── calendar/  # Calendrier partagé
│   │   │   └── ...
│   ├── components/        # Composants React réutilisables
│   │   ├── ui/            # Composants UI génériques (Shadcn)
│   │   ├── auth/          # Composants liés à l'authentification
│   │   ├── expenses/      # Composants liés aux dépenses
│   │   ├── tasks/         # Composants liés aux tâches
│   │   └── ...
│   ├── lib/               # Utilitaires et logique partagée
│   │   ├── utils.ts       # Fonctions utilitaires
│   │   ├── auth.ts        # Utilitaires d'authentification
│   │   ├── db.ts          # Client Prisma partagé
│   │   └── ...
│   ├── hooks/             # Hooks React personnalisés
│   ├── types/             # Types TypeScript partagés
│   └── providers/         # Providers React Context
```

### 5.2 Architecture backend
- API Routes organisées par domaine fonctionnel
- Middleware d'authentification centralisé
- Validation des données avec Zod
- Gestion d'erreurs standardisée
- Rate limiting pour les endpoints sensibles

### 5.3 Architecture frontend
- Composants UI réutilisables (Shadcn UI)
- Data fetching optimisé avec SWR ou React Query
- Layout responsive (Mobile First)
- Dark/Light mode
- Gestion d'état avec React Context + Reducers (ou Zustand)

## 6. Phases de développement

### 6.1 MVP (Phase 1) - 4 semaines
- Setup du projet et infrastructure
- Authentification et gestion des utilisateurs
- Création/gestion basique des colocations
- Gestion des dépenses (fonctionnalités essentielles)
- UI/UX de base

### 6.2 Fonctionnalités clés (Phase 2) - 4 semaines
- Planning des tâches ménagères
- Inventaire et courses
- Calendrier partagé (version basique)
- Améliorations UI/UX

### 6.3 Enrichissement (Phase 3) - 3 semaines
- Communication interne
- Partage de documents
- Notifications
- Optimisations et polissage

### 6.4 Finalisation (Phase 4) - 2 semaines
- Tests approfondis
- Documentation
- Déploiement en production
- Préparation pour la présentation portfolio

## 7. Environnements et déploiement

### 7.1 Environnements
- **Développement** : Localhost avec base de données PostgreSQL locale
- **Staging** : Vercel Preview Deployments
- **Production** : Vercel (avec alternative Netlify)

### 7.2 Base de données
- Développement : PostgreSQL local
- Production : PostgreSQL hébergé (à déterminer)

### 7.3 CI/CD
- GitHub Actions pour l'intégration continue
- Déploiement automatique sur Vercel
- Preview deployments pour les PR

## 8. Exigences non fonctionnelles

### 8.1 Performance
- Temps de chargement initial < 2s
- Temps de réponse des API < 300ms
- Lazy loading des composants lourds
- Mise en cache appropriée

### 8.2 Sécurité
- Authentification sécurisée (JWT)
- Hachage des mots de passe (bcrypt)
- Protection CSRF
- Validation des entrées utilisateur (Zod)
- Headers de sécurité (avec next-helmet)

### 8.3 Accessibilité
- Conformité WCAG 2.1 AA
- Support du clavier
- Contraste et lisibilité
- Support des lecteurs d'écran

### 8.4 SEO
- Métadonnées optimisées
- Sitemap XML
- URLs conviviales
- Support des réseaux sociaux (Open Graph, Twitter Cards)

### 8.5 Maintenance
- Documentation complète du code
- Guidelines pour les contributions
- Système de journalisation des erreurs 