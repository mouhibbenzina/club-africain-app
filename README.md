# 🏟️ Club Africain CATV Fan App

Application mobile officielle du Club Africain — développée avec React Native (Expo).

## 🚀 Quick Start

```bash
# 1. Lancer l'application
./start.sh
```

Ça démarre automatiquement :
- **API Server** → `http://localhost:3001` (base de données SQLite)
- **Expo Dev Server** → `http://localhost:8081` (QR code pour le téléphone)

## 📱 Fonctionnalités

| Fonctionnalité | Statut |
|---|---|
| Authentification (Login / Register) | ✅ |
| Accueil (solde, match en direct, actions rapides) | ✅ |
| Match en direct (CATV) | ✅ |
| Billetterie (achat, QR code) | ✅ |
| Jeux (prédictions, équipe fantasy, vote joueur) | ✅ |
| Classement (leaderboard) | ✅ |
| Wallet (solde, conversion) | ✅ |
| Boutique Coins (achat de packs) | ✅ |
| Regarder & Gagner (pubs) | ✅ |
| Missions quotidiennes | ✅ |
| Caisse de Don | ✅ |
| Récompenses Saison | ✅ |
| Profil | ✅ |
| Notifications | ✅ |
| Célébration (coins gagnés) | ✅ |

## 🏗️ Architecture

```
club-africain-app/
├── app/              # Screens + Navigation (Expo Router)
│   ├── auth/         # Login / Register
│   ├── (tabs)/       # 5 tabs: Accueil, Live, Tickets, Jeux, Wallet
│   └── (modals)/     # Missions, Don, Récompenses, Profil, Notif, Célébration
├── components/       # Shared UI (BalanceBar, MatchCard, QuickActions...)
├── stores/           # Zustand state management (9 stores)
├── services/         # API client, validation, secure storage
├── server/           # Backend API (Express + SQLite)
│   └── index.js      # REST API sur port 3001
├── database/         # Schéma SQL (pour migration vers Supabase)
└── constants/        # Theme tokens (couleurs, typo, espacements)
```

## 🔐 Design

- `#0D0D0D` — Fond noir
- `#CC0000` — Rouge Club Africain
- `#F5A623` — Or (coins, récompenses)
- `#27AE60` — Vert (prix, succès)
- Bilingue Arabe / Français

## 🗄️ API Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/auth/signin` | Connexion |
| POST | `/auth/signup` | Inscription |
| GET | `/api/matches` | Matchs (live, upcoming, past) |
| GET | `/api/balances` | Solde utilisateur |
| GET | `/api/tickets` | Mes billets |
| POST | `/api/predictions` | Soumettre un pronostic |
| GET/POST | `/api/fantasy_teams` | Mon équipe fantasy |
| POST | `/api/player_votes` | Vote joueur du match |
| GET | `/api/missions` | Missions quotidiennes |
| POST | `/api/missions/claim` | Réclamer mission |
| GET | `/api/transactions` | Historique transactions |
| GET | `/api/notifications` | Notifications |
| GET | `/api/leaderboard` | Classement |
| GET | `/api/coin_packs` | Packs de coins |

## ☁️ Production (Supabase)

Pour passer en production, remplacer le backend local par Supabase :

1. Créer un projet sur https://supabase.com
2. Copier le contenu de `database/schema.sql` dans l'éditeur SQL
3. Mettre les credentials dans `.env` :
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anonyme
   ```

## 📦 Technologies

- **Mobile** : React Native + Expo (SDK 52)
- **Navigation** : Expo Router (file-based)
- **État** : Zustand
- **Backend local** : Express + SQLite
- **Backend prod** : Supabase (PostgreSQL)
- **Stockage sécurisé** : expo-secure-store
- **Icônes** : @expo/vector-icons (Ionicons)
