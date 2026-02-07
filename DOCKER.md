# Docker Setup — Prime PenTrix V3

Run the entire Prime PenTrix V3 stack with a single command: **PostgreSQL 16 + pgvector**, **FastAPI Brain API**, and **Next.js 16 Frontend**.

---

## Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Docker Desktop | 4.x+ (running) |
| Git | Any recent version |

### 1. Configure Environment

Copy the example env file and fill in your API keys:

```powershell
cp infrastructure/docker.env.example infrastructure/docker.env
```

Required keys in `docker.env`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk OAuth public key |
| `CLERK_SECRET_KEY` | Clerk OAuth secret key |
| `CEREBRAS_API_KEY` | Primary AI provider |
| `GEMINI_API_KEY` | Fallback AI provider |
| `OPENAI_API_KEY` | Optional — used for embeddings |

### 2. Start All Services

```powershell
.\docker-start.ps1
```

This builds and launches three containers:
- **primepentrix-postgres** — PostgreSQL 16 with pgvector on port 5432
- **primepentrix-brain** — FastAPI RAG engine on port 8000
- **primepentrix-web** — Next.js 16 frontend on port 3000

### 3. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Brain API | http://localhost:8000 |
| Brain API Docs | http://localhost:8000/docs |
| PostgreSQL | `localhost:5432` (user: `postgres`, db: `primepentrix_v3`) |

---

## Management Scripts

| Script | Purpose |
|--------|---------|
| `docker-start.ps1` | Build and start all services |
| `docker-restart.ps1` | Restart all services (no rebuild) |
| `docker-stop.ps1` | Stop all services |

---

## Useful Commands

### View Logs

```powershell
cd infrastructure

# All services
docker-compose logs -f

# Single service
docker-compose logs -f web       # Frontend
docker-compose logs -f brain     # Brain API
docker-compose logs -f postgres  # Database
```

### Restart a Single Service

```powershell
cd infrastructure
docker-compose restart web       # Restart frontend only
docker-compose restart brain     # Restart Brain API only
```

### Rebuild After Code Changes

```powershell
cd infrastructure
docker-compose up -d --build web    # Rebuild frontend
docker-compose up -d --build brain  # Rebuild Brain API
```

### Execute Commands in Containers

```powershell
# Run Prisma migrations
docker exec -it primepentrix-web npx prisma migrate dev

# Access PostgreSQL CLI
docker exec -it primepentrix-postgres psql -U postgres -d primepentrix_v3

# Check Brain API dependencies
docker exec -it primepentrix-brain pip list
```

### Clean Everything (Nuclear Option)

```powershell
cd infrastructure
docker-compose down -v   # Stops containers, removes volumes — ALL DATA LOST
```

---

## Configuration

### Ports

Defaults (editable in `infrastructure/docker-compose.yml`):

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Brain API (FastAPI) | 8000 |
| PostgreSQL | 5432 |

### Volumes (Persistent Data)

| Volume | Purpose |
|--------|---------|
| `postgres_data` | Database files |
| `brain_cache` | Python package cache |
| `web_node_modules` | Node.js dependencies |
| `web_next` | Next.js build cache |

### Network

All three services communicate over a Docker bridge network called `primepentrix-network`.

---

## Development Workflow

### Hot Reload

Code changes in `web/` and `brain/` directories are volume-mounted, so hot reload works automatically inside the containers.

### Database Migrations

```powershell
# Create a new Prisma migration
docker exec -it primepentrix-web npx prisma migrate dev --name your_migration_name

# Push schema changes without migration file
docker exec -it primepentrix-web npx prisma db push

# Reset database (destructive)
docker exec -it primepentrix-web npx prisma migrate reset
```

### Updating Dependencies

**Frontend (Node.js):**

```powershell
docker exec -it primepentrix-web npm install <package-name>
docker-compose up -d --build web
```

**Backend (Python):**

```powershell
# Edit brain/requirements.txt, then:
cd infrastructure
docker-compose up -d --build brain
```

---

## Docker vs Local Development

| Aspect | Docker | Local (`npm` / `python`) |
|--------|--------|----|
| Setup time | Longer initial build (~5-10 min) | Faster start |
| Isolation | Fully isolated | Uses system packages |
| Consistency | Identical on all machines | Can differ between environments |
| Hot reload | Yes (via volume mounts) | Yes |
| Port conflicts | Rare | Common |
| Best for | Production-like testing, sharing | Quick iterations, debugging |

---

## Troubleshooting

### Port Already in Use

```powershell
netstat -ano | findstr ":3000"
taskkill /PID <PID> /F
```

### Frontend Won't Start

```powershell
docker-compose logs web
docker-compose build --no-cache web
docker-compose up -d web
```

### Database Connection Issues

```powershell
docker-compose ps                 # Check if postgres is healthy
docker-compose restart postgres   # Restart database
docker-compose logs postgres      # Check logs
```

### "Module not found" Errors

```powershell
cd infrastructure
docker-compose down
docker volume rm infrastructure_web_node_modules
docker-compose up -d --build web
```

### First Build Timing

- Initial build: **5-10 minutes** (downloads images, installs dependencies)
- Subsequent starts: **< 30 seconds** (cached layers)
- Volumes persist data between container restarts

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────┐
│                 Docker Compose                        │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  postgres    │  │   brain     │  │    web       │ │
│  │  (pgvector)  │  │  (FastAPI)  │  │  (Next.js)  │ │
│  │  :5432       │  │  :8000      │  │  :3000      │ │
│  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                 │                │         │
│         └─────────────────┴────────────────┘         │
│                primepentrix-network                   │
└───────────────────────────────────────────────────────┘
```

---

## See Also

- [README.md](README.md) — Project overview and full documentation
- [docs/QUICK-START.md](docs/QUICK-START.md) — Local development setup
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design deep-dive
