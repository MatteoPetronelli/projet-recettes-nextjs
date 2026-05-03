# API & Frontend de Recettes

Une application full-stack complète pour créer, partager et découvrir des recettes de cuisine, développée avec un backend Express.js sur-mesure et un frontend Next.js moderne.

---

## Fonctionnalités

- **Authentification sécurisée :** Inscription, connexion et gestion de session via JWT (JSON Web Tokens) et hachage des mots de passe avec Bcrypt  
- **Gestion des recettes (CRUD) :** Création, modification, visualisation et suppression de recettes  
- **Upload d'images local :** Système sécurisé avec Multer, incluant la suppression automatique des images orphelines  
- **Interactions sociales :** Notation (1 à 5 étoiles), commentaires et favoris  
- **Confidentialité :** Recettes publiques ou privées  
- **Base de données autonome :** Utilisation de fichiers `.json` via le système de fichiers Node.js  

---

## Stack Technique

### Backend (`/server`)
- **Framework :** Node.js avec Express.js  
- **Langage :** TypeScript  
- **Sécurité :** Helmet, CORS, Express Rate Limit  
- **Stockage :** Fichiers locaux (`data/recipes.json`, `data/users.json`, `/uploads`)  
- **Validation :** Zod  
- **Développement :** Nodemon, ts-node (rechargement à chaud)  

### Frontend (`/src`)
- **Framework :** Next.js (App Router)  
- **Langage :** TypeScript  
- **Style :** Tailwind CSS  
- **UI :** Composants optimisés + gestion des images (Next/Image, Unsplash)  

---

## Structure du Projet

```text
projet-recettes/
├── public/                 # Assets statiques Next.js
├── src/                    # Code source Frontend
│   ├── app/                # Pages et routes
│   ├── components/         # Composants React
│   └── types/              # Types TypeScript
├── server/                 # Backend Express
│   ├── controllers/        # Logique métier
│   ├── data/               # Données JSON
│   ├── middlewares/        # Sécurité et protections
│   ├── routes/             # Endpoints API
│   ├── schemas/            # Validation Zod
│   └── uploads/            # Images uploadées
├── next.config.ts          # Configuration Next.js
└── package.json            # Dépendances
```

---

## Installation et Lancement

### Backend

```bash
cd server
npm install
npm run dev
```

Le serveur démarre par défaut sur : **http://localhost:4000**

---

### Frontend

```bash
npm install
npm run dev
```

L'application est accessible sur : **http://localhost:3000**

---

## Variables d'Environnement

Créez un fichier `.env` dans `/server` :

```env
PORT=4000
JWT_SECRET=votre_cle_secrete_ultra_securisee_ici
```

Assurez-vous que la clé JWT est longue, unique et sécurisée.

---
