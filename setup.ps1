# S2-Sentinel Copilot V3 - Quick Start Script (Windows PowerShell)

Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║         S2-SENTINEL COPILOT V3 - QUICK START SETUP               ║
║                  Howest University Belgium                       ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n🚀 Starting setup...`n" -ForegroundColor Green

# 1. Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = (node --version) 2>&1
    $npmVersion = (npm --version) 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 22+ first." -ForegroundColor Red
    exit 1
}

# 2. Install frontend dependencies
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location web
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# 3. Setup environment file
Write-Host "`n🔧 Setting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ Created .env.local - Please configure your Clerk keys!" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local already exists" -ForegroundColor Yellow
}

# 4. Check if Docker is available (optional)
Write-Host "`n🐳 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = (docker --version) 2>&1
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
    Write-Host "   You can run 'docker-compose up' in infrastructure/ folder" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Docker not found. You'll need to setup PostgreSQL manually." -ForegroundColor Yellow
}

# Done
Write-Host @"

╔══════════════════════════════════════════════════════════════════╗
║                    ✅ SETUP COMPLETE!                            ║
╚══════════════════════════════════════════════════════════════════╝

📝 NEXT STEPS:
───────────────────────────────────────────────────────────────────

1. Configure Clerk Authentication:
   - Create account at: https://clerk.com
   - Get your API keys
   - Update web/.env.local with your keys

2. Setup Database (choose one):

   🐳 Option A: Docker Compose (Recommended)
      cd infrastructure
      docker-compose up --build

   💾 Option B: Local PostgreSQL
      - Install PostgreSQL 16 + pgvector extension
      - Create database: sentinel_v3
      - Update DATABASE_URL in .env.local

3. Initialize Database:
   cd web
   npm run db:generate    # Generate Prisma client
   npm run db:push        # Push schema to database
   npm run db:seed        # Seed with 8 subjects

4. Start Development Server:
   cd web
   npm run dev

5. Access Application:
   🌐 Frontend:  http://localhost:3000
   🔌 Backend:   http://localhost:8000 (if using Docker)
   📊 API Docs:  http://localhost:8000/docs

───────────────────────────────────────────────────────────────────

📚 Documentation: See README.md for detailed guide
🐛 Issues? Check logs or create GitHub issue

Built with ❤️ by MIHx0 for Howest University 🇧🇪

"@ -ForegroundColor Cyan

Set-Location ..
