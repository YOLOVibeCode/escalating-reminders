# Port Assignment Summary

> **Status**: ✅ **FINALIZED**  
> **Date**: December 2024  
> **Decision**: All services use **38XX port range** - This is FINAL and STABLE

---

## Final Port Assignments

### Application Services

| Service | Port | URL | Status |
|---------|------|-----|--------|
| **Web App** | **3800** | `http://localhost:3800` | ✅ FINAL |
| **API** | **3801** | `http://localhost:3801/v1` | ✅ FINAL |

### Infrastructure Services

| Service | Port | URL | Status |
|---------|------|-----|--------|
| PostgreSQL | 3802 | `postgresql://postgres:postgres@localhost:3802/escalating_reminders` | ✅ FINAL |
| Redis | 3803 | `redis://localhost:3803` | ✅ FINAL |
| Prisma Studio | 3804 | `http://localhost:3804` | ✅ FINAL |
| Storybook | 3805 | `http://localhost:3805` | ✅ FINAL |
| BullMQ Dashboard | 3806 | `http://localhost:3806` | 🔒 Reserved |
| MailHog UI | 3810 | `http://localhost:3810` | ✅ FINAL |
| MailHog SMTP | 3811 | `localhost:3811` | ✅ FINAL |

---

## Port Assignment Policy

### ✅ Standardized Ports

- **All services use 38XX range** - Consistent and intentional
- **Ports are FINAL** - No changes planned
- **All references updated** - Code, configs, docs, tests
- **Documentation is authoritative** - PORT-ASSIGNMENTS.md is source of truth

### 🔒 Stability Guarantee

These port assignments have been:
- ✅ Standardized across the entire codebase
- ✅ Documented in all relevant files
- ✅ Configured in all Docker files
- ✅ Set as defaults in all environment variables
- ✅ Used consistently in all E2E tests
- ✅ Referenced in all documentation

**These ports will NOT change.** They are stable and final.

---

## Verification

All port references have been verified:

```bash
# Application ports
grep -r "3800\|3801" apps/ infrastructure/ --include="*.ts" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml"

# Infrastructure ports  
grep -r "3802\|3803\|3810\|3811" infrastructure/ --include="*.yml" --include="*.yaml"

# Documentation
grep -r "localhost:380" docs/ --include="*.md"
```

---

## Migration History

1. **Initial**: All services in 38XX range ✅
2. **Temporary**: Attempted 68XX for applications (reverted) ❌
3. **Final**: All services back to 38XX range ✅ **CURRENT**

**Decision**: Keep all services in 38XX range for consistency and simplicity.

---

## Important Notes

- ⚠️ **Do NOT change these ports** without updating ALL references
- 📚 **PORT-ASSIGNMENTS.md** is the authoritative source
- 🔍 **Search codebase** before changing any port
- ✅ **All tests use these ports** - Changing ports breaks tests
- 🐳 **Docker configs use these ports** - Changing ports breaks infrastructure

---

*Port assignments are FINAL and STABLE. Use PORT-ASSIGNMENTS.md as the authoritative reference.*
