# 🔐 Security Setup Guide

## Quick Start - Generate Your Secrets

### Step 1: Generate a Strong Database Password

**Option A - Using OpenSSL (Linux/macOS/WSL):**
```bash
openssl rand -base64 32
```

**Option B - Using Python:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Option C - Using PowerShell (Windows):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Step 2: Generate Brain API Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 3: Setup Environment Files

#### For Local Development

1. **Copy the root `.env.example`:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and replace placeholders:**
   ```bash
   # Database
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/primepentrix_v3
   
   # Brain API Security
   BRAIN_API_KEY=YOUR_BRAIN_API_KEY_HERE
   
   # OpenAI
   OPENAI_API_KEY=sk-your-openai-api-key
   
   # Clerk (from clerk.com dashboard)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. **Copy Docker environment template:**
   ```bash
   cp infrastructure/.env.example infrastructure/docker.env
   ```

4. **Edit `infrastructure/docker.env` with the SAME secrets:**
   ```bash
   POSTGRES_PASSWORD=YOUR_PASSWORD_HERE
   BRAIN_API_KEY=YOUR_BRAIN_API_KEY_HERE
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@postgres:5432/primepentrix_v3
   ```

### Step 4: Verify Security

**Run this verification script:**
```bash
# Check if secrets are set
python3 << 'EOF'
import os
from pathlib import Path

def check_env_file(filepath):
    if not Path(filepath).exists():
        print(f"❌ {filepath} not found!")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
        
    issues = []
    if 'REPLACE_WITH_STRONG_PASSWORD' in content:
        issues.append('Default password placeholder found')
    if 'REPLACE_WITH_RANDOM_API_KEY' in content:
        issues.append('Default API key placeholder found')
    if 'password@' in content.lower():
        issues.append('Weak password "password" detected')
    
    if issues:
        print(f"⚠️  {filepath}:")
        for issue in issues:
            print(f"   - {issue}")
        return False
    else:
        print(f"✅ {filepath} looks good")
        return True

print("🔍 Checking environment files...\n")
env_ok = check_env_file('.env')
docker_env_ok = check_env_file('infrastructure/docker.env')

if env_ok and docker_env_ok:
    print("\n✅ All security checks passed!")
else:
    print("\n❌ Please fix the issues above before deploying")
EOF
```

### Step 5: Start Services

**Option A - Docker (Recommended for Production):**
```bash
cd infrastructure
docker-compose up -d
```

**Option B - Local Development:**
```bash
# Terminal 1 - Brain API
cd brain
python -m venv venv
source venv/bin/activate  # Linux/macOS
# OR: .\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py

# Terminal 2 - Web Frontend
cd web
npm install
npx prisma generate
npx prisma db push
npm run dev
```

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] Strong passwords generated (min 32 chars)
- [ ] API keys generated and stored securely
- [ ] `.env` files NOT committed to git
- [ ] `DEBUG=false` in all environments
- [ ] Port mappings removed from `docker-compose.yml`
- [ ] HTTPS configured (reverse proxy + Let's Encrypt)
- [ ] Database backups scheduled
- [ ] Monitoring/logging configured

### Security Hardening
- [ ] Enable rate limiting in middleware
- [ ] Configure CSP headers
- [ ] Set up WAF (Cloudflare/AWS WAF)
- [ ] Enable audit logging
- [ ] Configure secrets manager (AWS Secrets Manager / HashiCorp Vault)
- [ ] Set up automated security scanning

### Post-Deployment
- [ ] Test authentication flows
- [ ] Verify API key protection works
- [ ] Check CORS restrictions
- [ ] Test rate limiting
- [ ] Monitor error logs
- [ ] Schedule security review (90 days)

---

## Troubleshooting

### "DATABASE_URL is not set!" Error

**Cause:** Brain API can't find `.env` file or DATABASE_URL is empty

**Fix:**
```bash
# Check if .env exists in brain/ directory
ls -la brain/.env

# If missing, copy from example
cp .env.example .env

# Edit and set proper DATABASE_URL
nano .env
```

### "Invalid API key" Error

**Cause:** Web backend not sending correct `BRAIN_API_KEY`

**Fix:**
```bash
# Verify BRAIN_API_KEY matches in both files
grep BRAIN_API_KEY .env
grep BRAIN_API_KEY infrastructure/docker.env

# They should be identical
```

### "Connection refused" to Brain API

**Cause:** Brain API not running or wrong URL

**Fix:**
```bash
# Check Brain API is running
curl http://localhost:8000/health

# Or in Docker
docker logs primepentrix-brain

# Verify NEXT_PUBLIC_BRAIN_API_URL in web/.env
echo $NEXT_PUBLIC_BRAIN_API_URL
# Should be: http://localhost:8000 (local) or http://brain:8000 (Docker)
```

### Docker: "port is already allocated"

**Cause:** Another service using port 3000, 8000, or 5432

**Fix:**
```bash
# Find what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/macOS

# Kill the process or change the port in docker-compose.yml
```

---

## Security FAQ

### Q: Do I need to restart after changing .env?
**A:** Yes. Docker: `docker-compose restart`. Local: stop and restart the service.

### Q: How often should I rotate API keys?
**A:** Every 90 days, or immediately if compromised.

### Q: Can I use the same password for dev and production?
**A:** NO. Always use different secrets for each environment.

### Q: Where should I store production secrets?
**A:** Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) or encrypted environment variables.

### Q: Is it safe to commit .env.example?
**A:** Yes, but ensure it contains ONLY placeholder values, never real secrets.

### Q: How do I know if my instance is secure?
**A:** Run the verification script above, check SECURITY.md, and perform regular penetration testing.

---

## Need Help?

- 📖 Read [SECURITY.md](./SECURITY.md) for complete security documentation
- 🐛 Found a vulnerability? Create a **private** GitHub security advisory
- 💬 Questions? Open a GitHub discussion

**Remember:** Security is not a one-time setup. Review and update regularly!
