# CollocShare

Une application web moderne pour la gestion des aspects pratiques d'une colocation : finances, tâches ménagères, courses, et plus encore.

## Fonctionnalités principales

- **Gestion des dépenses** : Suivi des dépenses, calcul des équilibres financiers
- **Planning des tâches ménagères** : Attribution automatique des tâches, système de rotation équitable
- **Inventaire et courses** : Liste de courses collaborative, gestion des stocks
- **Calendrier partagé** : Visualisation des événements, réservation d'espaces communs
- **Communication** : Messagerie interne, tableau d'annonces, notifications

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Base de données** : PostgreSQL avec Prisma ORM
- **Styling** : Tailwind CSS avec Shadcn UI
- **Authentification** : NextAuth.js / Auth.js
- **Notifications** : SendGrid (email) + Web Push API
- **Gestion d'état** : React Context + Reducers (ou Zustand si nécessaire)

## Installation

1. Cloner le dépôt :
   ```
   git clone https://github.com/votre-utilisateur/collocshare.git
   cd collocshare
   ```

2. Installer les dépendances :
   ```
   npm install
   ```

3. Installer les dépendances manquantes pour Shadcn UI :
   ```
   npm install clsx tailwind-merge @radix-ui/react-slot lucide-react
   ```

4. Configurer les variables d'environnement :
   Créez un fichier `.env` à la racine du projet avec les informations suivantes :
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/collocshare?schema=public"
   NEXTAUTH_SECRET="votre_secret_nextauth"
   NEXTAUTH_URL="http://localhost:3000"
   SENDGRID_API_KEY="votre_clé_api_sendgrid"
   GOOGLE_CLIENT_ID="votre_client_id_google"
   GOOGLE_CLIENT_SECRET="votre_client_secret_google"
   ```

5. Initialiser la base de données :
   ```
   npx prisma db push
   ```

6. Démarrer le serveur de développement :
   ```
   npm run dev
   ```

## Structure du projet

```
collocshare/
├── prisma/                # Schéma Prisma et migrations
├── public/                # Fichiers statiques
├── src/
│   ├── app/               # Routes de l'application (App Router)
│   │   ├── api/           # Routes API
│   │   ├── (auth)/        # Pages d'authentification
│   │   ├── dashboard/     # Dashboard et fonctionnalités principales
│   │   ├── components/    # Composants React réutilisables
│   │   ├── lib/           # Utilitaires et logique partagée
│   │   ├── hooks/         # Hooks React personnalisés
│   │   ├── types/         # Types TypeScript partagés
│   │   ├── providers/     # Providers React Context
```

## Workflow de développement

1. Créer une nouvelle branche pour chaque fonctionnalité
2. Suivre les conventions de commits
3. Soumettre une pull request pour la revue de code
4. Merger dans la branche principale après approbation

## Licence

MIT
