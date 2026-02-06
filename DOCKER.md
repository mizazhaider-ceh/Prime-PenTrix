# 🐳 Docker Setup - Prime-Pentrix V3

Run the entire Prime-Pentrix V3 stack (PostgreSQL + Brain API + Next.js Frontend) using Docker.

---

## 🚀 Quick Start

### 1. **Prerequisites**
- Docker Desktop installed and running
- Git (to clone the repo)

### 2. **Start All Services**
```powershell
.\docker-start.ps1
```

This will:
- Build Docker images for Brain API and Next.js Frontend
- Start PostgreSQL 16 with pgvector extension
- Start the Brain API (FastAPI) on port 8000
- Start the Next.js Frontend on port 3000

### 3. **Access the Application**
- 🌐 **Frontend**: http://localhost:3000
- 🧠 **Brain API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 🗄️ **PostgreSQL**: localhost:5432

---

## 📋 Management Scripts

| Script | Purpose |
|--------|---------|
| `docker-start.ps1` | 🚀 Build and start all services |
| `docker-restart.ps1` | ♻️ Restart all services (no rebuild) |
| `docker-stop.ps1` | 🛑 Stop all services |

---

## 🔧 Useful Commands

### View Live Logs
```powershell
cd infrastructure
docker-compose logs -f
```

### View Logs for Specific Service
```powershell
docker-compose logs -f web      # Frontend logs
docker-compose logs -f brain    # Brain API logs
docker-compose logs -f postgres # Database logs
```

### Restart a Single Service
```powershell
docker-compose restart web      # Restart frontend only
docker-compose restart brain    # Restart Brain API only
```

### Rebuild After Code Changes
```powershell
docker-compose up -d --build web    # Rebuild frontend
docker-compose up -d --build brain  # Rebuild Brain API
```

### Execute Commands in Running Container
```powershell
# Run Prisma migrations in the web container
docker exec -it sentinel-web npx prisma migrate dev

# Access PostgreSQL CLI
docker exec -it sentinel-postgres psql -U postgres -d sentinel_v3

# Check Brain API Python dependencies
docker exec -it sentinel-brain pip list
```

### Clean Everything (Nuclear Option)
```powershell
cd infrastructure
docker-compose down -v  # Stop and remove all containers + volumes
```

---

## ⚙️ Configuration

### Environment Variables
Edit `infrastructure/docker.env` to configure:
- Database connection string
- Clerk authentication keys
- AI API keys (Cerebras, Gemini, OpenAI)
- Brain API URL

### Ports
Default ports (can be changed in `docker-compose.yml`):
- **Frontend**: 3000
- **Brain API**: 8000
- **PostgreSQL**: 5432

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Kill processes on specific ports
netstat -ano | findstr ":3000"
taskkill /PID <PID> /F
```

### Frontend Won't Start
```powershell
# Check logs
docker-compose logs web

# Rebuild with no cache
docker-compose build --no-cache web
docker-compose up -d web
```

### Database Connection Issues
```powershell
# Check if PostgreSQL is healthy
docker-compose ps

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### "Module not found" Errors
```powershell
# Rebuild node_modules volume
docker-compose down
docker volume rm infrastructure_web_node_modules
docker-compose up -d --build web
```

---

## 📦 What's Running?

### Services
1. **sentinel-postgres** - PostgreSQL 16 + pgvector
2. **sentinel-brain** - FastAPI backend with RAG engine
3. **sentinel-web** - Next.js 16 frontend

### Volumes (Persistent Data)
- `postgres_data` - Database files
- `brain_cache` - Python package cache
- `web_node_modules` - Node.js dependencies
- `web_next` - Next.js build cache

### Network
- `sentinel-network` - Bridge network connecting all services

---

## 🔄 Development Workflow

### Hot Reload is Enabled
Code changes in `web/` and `brain/` directories automatically trigger rebuilds inside containers.

### Making Database Changes
```powershell
# Create a new Prisma migration
docker exec -it sentinel-web npx prisma migrate dev --name your_migration_name

# Push schema changes without creating migration
docker exec -it sentinel-web npx prisma db push

# Reset database (destructive!)
docker exec -it sentinel-web npx prisma migrate reset
```

### Updating Dependencies

**Frontend (Node.js)**:
```powershell
# Add a package
docker exec -it sentinel-web npm install <package-name>

# Rebuild to update volume
docker-compose up -d --build web
```

**Backend (Python)**:
```powershell
# Add to brain/requirements.txt, then:
docker-compose up -d --build brain
```

---

## 🆚 Docker vs Local Development

| Aspect | Docker | Local (npm/python) |
|--------|--------|--------------------|
| **Setup Time** | Longer initial build | Faster start |
| **Isolation** | ✅ Fully isolated | ⚠️ Uses system packages |
| **Consistency** | ✅ Same on all machines | ⚠️ Can differ |
| **Hot Reload** | ✅ Yes (via volumes) | ✅ Yes |
| **Port Conflicts** | ✅ Rare | ⚠️ Common |
| **Best For** | Production-like, sharing | Quick iterations |

---

## 📝 Notes

- First build takes 5-10 minutes (downloads images, installs dependencies)
- Subsequent starts are much faster (< 30 seconds)
- Volumes persist data between container restarts
- Use `docker-compose down -v` only if you want to reset everything

---

## 🛟 Need Help?

Check the main [README.md](../README.md) for:
- Project overview
- Full architecture details
- Non-Docker setup instructions
- Phase-by-phase development roadmap
