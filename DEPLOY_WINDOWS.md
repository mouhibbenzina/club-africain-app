# 🏟️ Club Africain App — Déploiement depuis Windows

## 1. Installer les outils nécessaires

### A. Git pour Windows
- Télécharger : https://git-scm.com/download/win
- Installer avec les options par défaut
- Après installation, ouvrir **Git Bash** (chercher dans le menu Démarrer)

### B. Node.js
- Télécharger : https://nodejs.org (version 20 LTS)
- Installer — tout laisser par défaut

---

## 2. Créer le dépôt GitHub

1. Aller sur https://github.com
2. Se connecter ou créer un compte
3. Cliquer sur le bouton vert **"New"** (en haut à gauche)
4. Remplir :
   - **Repository name** : `club-africain-app`
   - **Public** (coché)
   - Ne rien cocher d'autre
5. Cliquer sur **"Create repository"**
6. **Ne pas fermer la page** — les commandes s'affichent

---

## 3. Copier le projet et le pousser sur GitHub

### A. Copier le projet depuis une clé USB ou un transfert
- Copier le dossier `club-africain-app` sur ton PC Windows
- Dans Git Bash, aller dans le dossier :
  ```bash
  cd /c/Users/TonNom/Chemin/vers/club-africain-app
  ```

### B. Connecter et pousser vers GitHub
```bash
git remote add origin https://github.com/TON_UTILISATEUR/club-africain-app.git
git branch -M main
git push -u origin main
```
> ⚠️ Remplace `TON_UTILISATEUR` par ton nom d'utilisateur GitHub

---

## 4. Déployer l'API sur Render

1. Aller sur https://dashboard.render.com
2. Créer un compte (gratuit, sans carte bleue)
3. Cliquer sur **"New +"** → **"Web Service"**
4. Cliquer sur **"Connect account"** à côté de GitHub
5. Autoriser Render à voir tes dépôts
6. Sélectionner `club-africain-app`
7. Configurer :
   - **Name** : `club-africain-api`
   - **Root Directory** : `server`
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `node index.js`
   - **Plan** : **Free** ($0/month)
8. Cliquer sur **"Create Web Service"**
9. Attendre 2-3 minutes que ça déploie
10. Une fois fini, Render donne une URL : `https://club-africain-api.onrender.com`
11. **Copier cette URL**

---

## 5. Déployer le site web sur Vercel

### Option A : Avec Git (recommandé)
1. Aller sur https://vercel.com
2. Créer un compte (gratuit, connexion avec GitHub)
3. Cliquer sur **"Add New..."** → **"Project"**
4. Trouver `club-africain-app` et cliquer sur **"Import"**
5. **Framework Preset** : laisser `Create React App` ou `Other`
6. **Root Directory** : laisser vide
7. Cliquer sur **"Deploy"**
8. Vercel donne une URL : `https://club-africain-app.vercel.app`

### Option B : Sans Git (glisser-déposer)
1. Aller sur https://vercel.com
2. Cliquer sur **"Deploy"** sans rien sélectionner
3. Glisser le dossier `dist/` du projet dans la zone prévue
4. Attendre 30 secondes — le site est en ligne

---

## 6. Connecter l'app à l'API en ligne

1. Dans le projet, ouvrir `services/localApi.ts` avec Notepad ou VS Code
2. Trouver la ligne :
   ```ts
   const PROD_API = 'https://api.clubafricain.tn'
   ```
3. Remplacer par l'URL Render :
   ```ts
   const PROD_API = 'https://club-africain-api.onrender.com'
   ```
4. Sauvegarder le fichier

### Repousser la modification sur GitHub
```bash
git add services/localApi.ts
git commit -m "Update API URL to Render"
git push
```
> Render se met à jour automatiquement après le push

---

## 7. Tester l'application

- **Site web** : ouvrir l'URL Vercel dans le navigateur
- **API** : ouvrir l'URL Render + `/api/matches` pour vérifier
  - Exemple : `https://club-africain-api.onrender.com/api/matches`
  - Tu dois voir les matchs en format JSON

---

## 8. (Optionnel) Créer un build APK pour Android

Seulement si tu veux installer l'app sur ton téléphone Android :

1. Installer l'application **Expo Go** depuis le Play Store
2. Dans Git Bash :
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform android --profile preview
   ```
3. Expo te donne un fichier `.apk` à télécharger et installer

---

## 9. (Optionnel) Acheter un nom de domaine

Pour avoir `clubafricain.tn` au lieu de `.vercel.app` :

1. Aller sur https://gandi.net ou https://tn.domain.com
2. Chercher `clubafricain.tn`
3. Acheter (~20-30 DT/an)
4. Configurer les DNS pour pointer vers Vercel/Render

---

## 📝 Résumé des URLs finales

| Service | URL |
|---------|-----|
| Site web | `https://club-africain-app.vercel.app` |
| API | `https://club-africain-api.onrender.com` |
| GitHub | `https://github.com/TON_UTILISATEUR/club-africain-app` |

---

## ❓ Problèmes fréquents

**"git n'est pas reconnu"**
→ Installer Git pour Windows et redémarrer Git Bash

**"node n'est pas reconnu"**
→ Installer Node.js et redémarrer Git Bash

**L'API Render met du temps à répondre**
→ Normal en gratuit : l'API "s'endort" après 15 min sans activité.
Le premier appel prend 30 secondes, puis ça va vite.

**Le site Vercel affiche une page blanche**
→ Vérifier que le dossier déployé est bien `dist/` (Option B)
ou que Root Directory est vide (Option A)
