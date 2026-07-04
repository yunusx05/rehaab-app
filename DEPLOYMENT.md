# 🚀 Guide de Déploiement GitHub + Vercel

## Étape 1 : Créer un compte GitHub (si pas déjà fait)

1. Va sur https://github.com
2. Clique sur "Sign up"
3. Crée ton compte

## Étape 2 : Créer un nouveau repository GitHub

1. Une fois connecté, clique sur le **+** en haut à droite
2. Sélectionne **"New repository"**
3. Remplis les informations :
   - **Repository name** : `reeducation-hanche` (ou ce que tu veux)
   - **Description** : "Application de rééducation hanche"
   - **Public** ou **Private** : à ton choix
   - **NE COCHE PAS** "Initialize this repository with a README"
4. Clique sur **"Create repository"**

## Étape 3 : Installer Git (si pas déjà fait)

### Sur Mac :
```bash
# Vérifie si Git est installé
git --version

# Si pas installé, utilise Homebrew
brew install git
```

### Sur Windows :
Télécharge et installe depuis : https://git-scm.com/download/win

## Étape 4 : Pousser ton code sur GitHub

Ouvre ton terminal et navigue vers le dossier du projet, puis exécute :

```bash
# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Phase 1 complete"

# Connecter ton repo local à GitHub
# Remplace USERNAME et REPO_NAME par tes infos
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Pousser le code
git branch -M main
git push -u origin main
```

**Exemple concret :**
```bash
git remote add origin https://github.com/yunusbrand/reeducation-hanche.git
```

## Étape 5 : Déployer sur Vercel

### Option A : Via l'interface web (Recommandé - Plus facile)

1. Va sur https://vercel.com
2. Clique sur **"Sign Up"** et choisis **"Continue with GitHub"**
3. Autorise Vercel à accéder à ton GitHub
4. Clique sur **"New Project"**
5. Trouve ton repo `reeducation-hanche` et clique sur **"Import"**
6. Laisse les paramètres par défaut :
   - Framework Preset : **Other**
   - Build Command : (laisse vide)
   - Output Directory : (laisse vide)
7. Clique sur **"Deploy"**
8. Attends 30-60 secondes ⏳
9. **C'est fait ! 🎉** Tu obtiens une URL du type : `https://reeducation-hanche.vercel.app`

### Option B : Via le CLI Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

## Étape 6 : Tester ton application

1. Ouvre l'URL fournie par Vercel
2. Teste sur ton téléphone
3. Ajoute-la à ton écran d'accueil :
   - **iPhone** : Safari → Partager → "Sur l'écran d'accueil"
   - **Android** : Chrome → Menu → "Ajouter à l'écran d'accueil"

## 🔄 Faire des mises à jour

Quand tu veux modifier l'app :

```bash
# Modifier tes fichiers...

# Ajouter les changements
git add .

# Créer un commit
git commit -m "Ajout de la Phase 2"

# Pousser sur GitHub
git push

# Vercel redéploie automatiquement ! 🚀
```

## 🎯 URLs utiles

- **Ton repo GitHub** : `https://github.com/USERNAME/reeducation-hanche`
- **Dashboard Vercel** : `https://vercel.com/dashboard`
- **Ton app déployée** : `https://reeducation-hanche.vercel.app` (exemple)

## ⚙️ Paramètres Vercel avancés (optionnel)

Dans le dashboard Vercel → Settings :

- **Domains** : Ajoute ton propre nom de domaine
- **Environment Variables** : Ajoute des variables d'environnement si besoin
- **Git Integration** : Configure les branches de déploiement

## 🆘 Problèmes courants

### "Permission denied" lors du git push
```bash
# Configure ton GitHub token ou SSH key
# Voir : https://docs.github.com/en/authentication
```

### Vercel ne détecte pas les changements
```bash
# Force un nouveau déploiement
vercel --prod --force
```

### L'app ne s'affiche pas correctement
- Vérifie que `index.html` est bien à la racine du projet
- Ouvre la console du navigateur (F12) pour voir les erreurs

## 🎉 C'est tout !

Ton app est maintenant en ligne et accessible depuis n'importe où ! 📱

---

**Besoin d'aide ?** Contacte-moi ou consulte :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation GitHub](https://docs.github.com)
