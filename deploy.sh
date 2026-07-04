#!/bin/bash

# 🚀 Script de déploiement rapide
# Exécute ce script pour déployer automatiquement

echo "🏋️ Déploiement de l'app de rééducation..."
echo ""

# Vérifie si Git est installé
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé. Installe-le d'abord :"
    echo "   Mac: brew install git"
    echo "   Windows: https://git-scm.com/download/win"
    exit 1
fi

# Initialiser Git si pas déjà fait
if [ ! -d .git ]; then
    echo "📦 Initialisation de Git..."
    git init
    git add .
    git commit -m "Initial commit - Phase 1 complete"
else
    echo "✅ Git déjà initialisé"
fi

# Demander l'URL du repo
echo ""
echo "📝 Entre l'URL de ton repo GitHub :"
echo "   Format : https://github.com/USERNAME/REPO_NAME.git"
read -p "URL : " repo_url

if [ -z "$repo_url" ]; then
    echo "❌ URL vide. Annulation."
    exit 1
fi

# Ajouter le remote si pas déjà fait
if ! git remote | grep -q origin; then
    echo "🔗 Connexion au repo GitHub..."
    git remote add origin "$repo_url"
else
    echo "✅ Remote origin déjà configuré"
fi

# Pousser le code
echo "📤 Push vers GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Code poussé sur GitHub !"
echo ""
echo "🎯 Prochaines étapes :"
echo "   1. Va sur https://vercel.com"
echo "   2. Connecte-toi avec GitHub"
echo "   3. Importe ton repo 'reeducation-hanche'"
echo "   4. Clique sur Deploy"
echo ""
echo "🎉 Ton app sera en ligne en moins d'une minute !"
