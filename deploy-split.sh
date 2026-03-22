#!/bin/bash

echo "🚀 Preparing QuickBreak for split deployment (Render + Vercel)"

# Add all changes
git add .

# Commit changes
git commit -m "feat: prepare for split deployment - backend on Render, frontend on Vercel

- Update CORS for Vercel frontend domain
- Simplify backend to API-only (no static serving)
- Update frontend env vars for production API URL
- Remove debug code and unnecessary files
- Add comprehensive deployment documentation"

# Push to main branch
git push origin main

echo "✅ Changes committed and pushed!"
echo ""
echo "📖 Next steps:"
echo "1. Follow RENDER_VERCEL_DEPLOYMENT.md"
echo "2. Deploy backend to Render first"
echo "3. Update FRONTEND/.env.production with your Render URL"
echo "4. Deploy frontend to Vercel"
echo "5. Update CORS_ORIGIN in Render with your Vercel URL"