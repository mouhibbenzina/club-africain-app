#!/bin/bash
# =============================================
# Club Africain App - Production Deploy
# =============================================
# Usage:  ./deploy.sh [render|vercel|all|docker]
# =============================================

set -e

MODE=${1:-all}

case $MODE in
  render)
    echo "🚀 Deploying API to Render..."
    echo ""
    echo "  Quick deploy (1 click):"
    echo "  1. Go to https://dashboard.render.com/new/web-service"
    echo "  2. Connect this GitHub repo"
    echo "  3. Set:"
    echo "     - Name: club-africain-api"
    echo "     - Root Directory: server"
    echo "     - Build Command: npm install"
    echo "     - Start Command: node index.js"
    echo "     - Plan: Free"
    echo "  4. Click 'Create Web Service'"
    echo ""
    echo "  Or use render.yaml (blueprint):"
    echo "  https://dashboard.render.com/blueprints"
    ;;

  vercel)
    echo "🚀 Deploying Web to Vercel..."
    echo ""
    if [ ! -d "dist" ]; then
      echo "Building web first..."
      npx expo export --platform web
    fi
    echo "  Option 1: Vercel CLI"
    echo "    npx vercel --prod"
    echo ""
    echo "  Option 2: Manual"
    echo "    1. Go to https://vercel.com/new"
    echo "    2. Upload the dist/ folder"
    echo "    3. Deploy"
    ;;

  all)
    echo "🏟️  Club Africain - Full Production Deploy"
    echo "=========================================="
    echo ""
    echo "  Step 1: Deploy API server"
    echo "  --------------------------"
    echo "  Push server/ to Render:"
    echo "  https://dashboard.render.com/new/web-service"
    echo ""
    echo "  Step 2: Build & deploy web"
    echo "  --------------------------"
    npx expo export --platform web
    echo "  ✅ Web built to dist/"
    echo "  Upload dist/ to Vercel:"
    echo "  https://vercel.com/new"
    echo ""
    echo "  Step 3: Mobile app stores"
    echo "  -------------------------"
    echo "  npx eas build --platform android --profile production"
    echo "  npx eas build --platform ios --profile production"
    echo ""
    echo "  ⚠️  Prerequisites:"
    echo "  - Apple Developer Program (\$99/year)"
    echo "  - Google Play Developer (\$25 one-time)"
    echo "  - Expo account (free): https://expo.dev/signup"
    ;;

  docker)
    echo "🐳 Deploy with Docker..."
    echo "  docker compose up -d"
    echo ""
    echo "  Prerequisites:"
    echo "  - Docker installed on your VPS"
    echo "  - Domain pointed to your VPS IP"
    echo "  - Edit nginx.conf domain name"
    ;;

  *)
    echo "Usage: ./deploy.sh [render|vercel|all|docker]"
    ;;
esac
