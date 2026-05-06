# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## 📦 Contenu du package

Ton projet est prêt à être déployé ! Voici les fichiers :

```
reeducation-app/
├── index.html          # Application principale (ton code)
├── README.md           # Documentation du projet
├── DEPLOYMENT.md       # Guide de déploiement détaillé
├── package.json        # Configuration du projet
├── vercel.json         # Configuration Vercel
├── .gitignore          # Fichiers à ignorer par Git
└── deploy.sh           # Script automatique de déploiement
```

## ⚡ Déploiement en 3 minutes

### Option 1 : Script automatique (Recommandé)

1. **Télécharge et extrais** le fichier `reeducation-app.zip`

2. **Ouvre ton terminal** dans le dossier extrait :
   ```bash
   cd chemin/vers/reeducation-app
   ```

3. **Exécute le script** :
   ```bash
   ./deploy.sh
   ```

4. Le script va :
   - Initialiser Git
   - Te demander l'URL de ton repo GitHub
   - Pousser ton code automatiquement

5. **Va sur Vercel** : https://vercel.com
   - Connecte-toi avec GitHub
   - Clique sur "New Project"
   - Sélectionne ton repo
   - Clique sur "Deploy"

✅ **C'est fait !** Ton app est en ligne !

### Option 2 : Manuellement (plus de contrôle)

1. **Crée un repo GitHub** :
   - Va sur https://github.com/new
   - Nomme-le `reeducation-hanche`
   - Laisse-le vide (ne coche aucune option)
   - Clique sur "Create repository"

2. **Ouvre ton terminal** dans le dossier `reeducation-app`

3. **Exécute ces commandes** :
   ```bash
   # Initialise Git
   git init
   
   # Configure ton identité (remplace par tes infos)
   git config user.name "Ton Nom"
   git config user.email "ton@email.com"
   
   # Ajoute tous les fichiers
   git add .
   
   # Crée le premier commit
   git commit -m "Initial commit - Phase 1"
   
   # Connecte au repo GitHub (remplace USERNAME par ton nom GitHub)
   git remote add origin https://github.com/USERNAME/reeducation-hanche.git
   
   # Pousse le code
   git branch -M main
   git push -u origin main
   ```

4. **Déploie sur Vercel** :
   - Va sur https://vercel.com
   - "Continue with GitHub"
   - "New Project"
   - Sélectionne `reeducation-hanche`
   - "Deploy"

## 📱 Utiliser l'app sur ton téléphone

Une fois déployée sur Vercel, tu auras une URL comme :
`https://reeducation-hanche-abc123.vercel.app`

### Sur iPhone :
1. Ouvre l'URL dans Safari
2. Appuie sur l'icône de partage
3. "Ajouter à l'écran d'accueil"

### Sur Android :
1. Ouvre l'URL dans Chrome
2. Menu (3 points)
3. "Ajouter à l'écran d'accueil"

## 🔄 Mettre à jour l'app plus tard

Quand tu veux modifier l'app :

```bash
# Modifie tes fichiers...

git add .
git commit -m "Ajout de la Phase 2"
git push

# Vercel redéploie automatiquement ! 🎉
```

## 🆘 Besoin d'aide ?

- Consulte `DEPLOYMENT.md` pour le guide détaillé
- Problème Git ? Vérifie que tu as configuré ton email/nom
- Problème Vercel ? Vérifie que le repo est public ou que Vercel a les permissions

## 🎯 Prochaines étapes

1. ✅ Déployer la Phase 1
2. ⏳ Tester pendant 4 semaines
3. 🚀 Ajouter la Phase 2 quand tu seras prêt

Bon courage avec ta rééducation ! 💪
