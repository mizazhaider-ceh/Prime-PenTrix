# 🐳 Docker Setup Guide - Prime-Pentrix V3

Complete guide for running Prime-Pentrix with Docker.

---

## 📋 Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose)
- **Git** (to clone the repository)
- **PowerShell** (Windows) or **Bash** (Linux/Mac)

---

## 🚀 Quick Start

### Windows (PowerShell)

```powershell
cd sentinel-v3

# Start all services
.\docker-start.ps1

# Stop all services
.\docker-stop.ps1

# Restart without rebuild
.\docker-restart.ps1
```

### Linux/Mac (Bash)

```bash
cd sentinel-v3/infrastructure

# Start all services
docker-compose up -d --build

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f
```

---

## 🏗️ Architecture

Prime-Pentrix uses **3 Docker containers**:

1. **primepentrix-postgres** - PostgreSQL 16 + pgvector
   - Port: 5432
   - Database: `primepentrix_v3`
   - Volume: `postgres_data` (persistent storage)

2. **primepentrix-brain** - FastAPI Backend (RAG Engine)
   - Port: 8000
   - API Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

3. **primepentrix-web** - Next.js Frontend
   - Port: 3000
   - Dashboard: http://localhost:3000/dashboard
   - Hot reload enabled (development mode)

**Network:** `primepentrix-network` (bridge)

---

## ⚙️ Configuration

### Environment Variables

#### `infrastructure/docker.env`

```env
# Database (separate URLs for Prisma vs Python)
DATABASE_URL=postgresql://postgres:password@postgres:5432/primepentrix_v3?schema=public
PYTHON_DATABASE_URL=postgresql://postgres:password@postgres:5432/primepentrix_v3

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI APIs
CEREBRAS_API_KEY=your_key
GOOGLE_GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key

# Internal Service URLs (Docker network)
BRAIN_API_URL=http://brain:8000

# External URLs (Browser access)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Important Notes:

1. **Two DATABASE_URLs:**
   - `DATABASE_URL` - For Prisma (with `?schema=public`)
   - `PYTHON_DATABASE_URL` - For psycopg2 (without query params)

2. **Internal vs External URLs:**
   - Containers communicate via service names (`brain`, `postgres`)
   - Browser uses `localhost` URLs

---

## 🔧 First-Time Setup

After running Docker containers for the first time:

### 1. Initialize Database Schema

```bash
docker exec -it primepentrix-web npx prisma db push
```

**Output:**
```
✅ Your database is now in sync with your Prisma schema. Done in 1.54s
```

### 2. Seed Database

```bash
docker exec -it primepentrix-web npx prisma db seed
```

**Output:**
```
✅ Created/Updated: Computer Networks (CS-NET-S2)
✅ Created/Updated: Web Pentesting Fundamentals (CS-PENTEST-S2)
... (6 more subjects)
```

### 3. Verify Database

```bash
docker exec -it primepentrix-postgres psql -U postgres -d primepentrix_v3 -c "\dt"
```

**Expected Tables:**
- analytics
- conversations
- document_chunks
- documents
- global_stats
- messages
- quiz_reviews
- quiz_scores
- study_sessions
- subjects
- tool_history
- users

---

## 📊 Service Management

### Check Status

```bash
cd infrastructure
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f brain
docker-compose logs -f postgres

# Last 50 lines
docker-compose logs --tail=50 web
```

### Restart Individual Service

```bash
docker-compose restart web
docker-compose restart brain
docker-compose restart postgres
```

### Rebuild Specific Service

```bash
# Force rebuild web (Next.js)
docker-compose up -d --build --force-recreate web

# Force rebuild brain (FastAPI)
docker-compose up -d --build --force-recreate brain
```

### Access Container Shell

```bash
# Web container (Node.js)
docker exec -it primepentrix-web sh

# Brain container (Python)
docker exec -it primepentrix-brain bash

# Postgres container
docker exec -it primepentrix-postgres bash
```

---

## 🗄️ Database Management

### Access PostgreSQL

```bash
docker exec -it primepentrix-postgres psql -U postgres -d primepentrix_v3
```

### Run SQL Commands

```bash
# List all tables
docker exec -it primepentrix-postgres psql -U postgres -d primepentrix_v3 -c "\dt"

# Count subjects
docker exec -it primepentrix-postgres psql -U postgres -d primepentrix_v3 -c "SELECT COUNT(*) FROM subjects;"

# View all subjects
docker exec -it primepentrix-postgres psql -U postgres -d primepentrix_v3 -c "SELECT code, name FROM subjects;"
```

### Backup Database

```bash
docker exec primepentrix-postgres pg_dump -U postgres primepentrix_v3 > backup.sql
```

### Restore Database

```bash
docker exec -i primepentrix-postgres psql -U postgres primepentrix_v3 < backup.sql
```

---

## 🧹 Cleanup

### Stop & Remove Containers

```bash
cd infrastructure

# Stop containers (keeps data)
docker-compose down

# Stop & remove volumes (DELETES DATA!)
docker-compose down -v

# Stop & remove images
docker-compose down --rmi all
```

### Remove Unused Docker Resources

```bash
# Remove unused containers, networks, images
docker system prune

# Remove everything (including volumes)
docker system prune -a --volumes
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `port is already allocated`

**Solutions:**
1. Stop conflicting service:
   ```bash
   # Check what's using port 3000
   netstat -ano | findstr :3000
   # Kill process (Windows)
   taskkill /F /PID <PID>
   ```

2. Change port in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # External:Internal
   ```

### Container Keeps Restarting

```bash
# Check logs for errors
docker-compose logs --tail=100 web

# Common issues:
# 1. DATABASE_URL not set
# 2. Missing Clerk keys
# 3. Node modules issue
```

### Database Connection Failed

**Brain API Error:** `connection to server at "postgres" failed`

**Solutions:**
1. Check postgres is running:
   ```bash
   docker-compose ps postgres
   ```

2. Verify DATABASE_URL in docker.env

3. Ensure database exists:
   ```bash
   docker exec -it primepentrix-postgres psql -U postgres -c "\l"
   ```

### Hot Reload Not Working

**Issue:** Code changes don't reflect in browser

**Solution:**
```bash
# Volumes are mounted correctly, but try:
docker-compose restart web

# Or rebuild:
docker-compose up -d --build web
```

---

## 🔍 Health Checks

### Check All Services

```bash
# Frontend
curl http://localhost:3000

# Backend API
curl http://localhost:8000/health

# Database
docker exec primepentrix-postgres pg_isready -U postgres
```

### Expected Responses

**Brain API Health:**
```json
{
  "status": "healthy",
  "services": {
    "fastapi": "running",
    "rag_engine": "RAGEngine(bm25=0 docs, embeddings=configured)",
    "openai_configured": true,
    "embedding_model": "text-embedding-3-small",
    "embedding_dim": 1536
  }
}
```

---

## 📈 Performance Tips

### Development Optimization

1. **Use named volumes** (already configured)
   - `web_node_modules` - Faster npm installs
   - `web_next` - Preserves Next.js cache
   - `brain_cache` - Caches pip packages

2. **Limit resources** (optional):
   ```yaml
   services:
     web:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

3. **Use BuildKit:**
   ```bash
   DOCKER_BUILDKIT=1 docker-compose build
   ```

---

## 🚀 Production Deployment

### Environment Changes

1. Change `target` in web service:
   ```yaml
   web:
     build:
       target: production  # Instead of development
   ```

2. Set production environment:
   ```env
   NODE_ENV=production
   ```

3. Remove volume mounts (use image code):
   ```yaml
   # Comment out in production
   # volumes:
   #   - ../web:/app
   ```

### Build Production Image

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 Additional Resources

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [FastAPI Docker](https://fastapi.tiangolo.com/deployment/docker/)

---

**Built with ❤️ for the Howest CS Engineering community**
