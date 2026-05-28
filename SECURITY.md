# 🔐 Security & Credentials Management Guide

**Document Version**: 1.0  
**Last Updated**: 2026-05-28  
**Maintained By**: z88865092-art  
**Classification**: Internal Production

---

## 📑 Table of Contents

1. [Credential Management Strategy](#credential-management-strategy)
2. [GitHub Secrets Configuration](#github-secrets-configuration)
3. [Vercel Environment Variables](#vercel-environment-variables)
4. [API Key Rotation Procedures](#api-key-rotation-procedures)
5. [Secret Scanning & Compliance](#secret-scanning--compliance)
6. [Emergency Credential Revocation](#emergency-credential-revocation)
7. [Audit Trail & Logging](#audit-trail--logging)

---

## Credential Management Strategy

### ✅ What Gets Stored as Secrets

| Credential | Storage | Rotation | Access |
|------------|---------|----------|--------|
| VERCEL_TOKEN | GitHub Secrets | 90 days | CI/CD Pipeline |
| VERCEL_ORG_ID | GitHub Secrets | Never | CI/CD Pipeline |
| VERCEL_PROJECT_ID | GitHub Secrets | Never | CI/CD Pipeline |
| API_KEY (if applicable) | GitHub Secrets | 60 days | Backend only |
| DATABASE_URL | Vercel Env Vars | 90 days | Backend runtime |
| ENCRYPTION_KEY | GitHub Secrets | 180 days | Sensitive operations |

### ❌ What Should NEVER Be Stored

```javascript
// ❌ WRONG: Hardcoded in source
const API_KEY = "sk_live_abc123"

// ❌ WRONG: In .env file committed to git
echo "API_KEY=sk_live_abc123" >> .env
git add .env

// ❌ WRONG: In environment variable without encryption
export SECRET=my-secret-value

// ✅ RIGHT: In GitHub Secrets only
${{ secrets.API_KEY }}
```

---

## GitHub Secrets Configuration

### Step 1: Create Secrets

Go to: `https://github.com/z88865092-art/artifacts-jarvis-dashboard/settings/secrets/actions`

```bash
# Secret 1: Vercel Authentication Token
Name: VERCEL_TOKEN
Value: [Generated from https://vercel.com/account/tokens]
Scope: Used by GitHub Actions to deploy to Vercel

# Secret 2: Vercel Organization ID
Name: VERCEL_ORG_ID
Value: [From https://vercel.com/account/general]
Scope: Identifies your Vercel organization

# Secret 3: Vercel Project ID
Name: VERCEL_PROJECT_ID
Value: [From Vercel Dashboard → Project Settings]
Scope: Identifies the specific project for deployment

# Secret 4: API Base URL (if using external API)
Name: VITE_API_URL
Value: https://artifacts-api-server.vercel.app
Scope: Frontend uses this to call backend API
```

### Step 2: Verify Secrets Are Not Exposed

```bash
# Check that secrets are masked in GitHub Actions logs
# ❌ WRONG (shows value):
echo "Token: ${{ secrets.VERCEL_TOKEN }}"

# ✅ RIGHT (value is masked):
vercel deploy --token ${{ secrets.VERCEL_TOKEN }}
```

### Step 3: Access Secrets in Workflows

```yaml
# In .github/workflows/main.yml
jobs:
  deploy:
    steps:
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        run: vercel deploy --prod
```

---

## Vercel Environment Variables

### Setup Runtime Environment Variables

Go to: Vercel Dashboard → artifacts-jarvis-dashboard → Settings → Environment Variables

```
# Production Variables
Name: VITE_API_URL
Value: https://artifacts-api-server.vercel.app
Environment: Production

Name: NODE_ENV
Value: production
Environment: Production
```

### Key Differences

| Type | Storage | Usage | Visibility |
|------|---------|-------|------------|
| GitHub Secrets | GitHub | CI/CD builds | Hidden from logs |
| Vercel Env Vars | Vercel | Runtime | Visible in Vercel UI (masked in preview) |
| Local .env | Local machine | Development | Never committed |

---

## API Key Rotation Procedures

### Rotation Schedule

```
┌─────────────────────────────────────────────────────────┐
│                 CREDENTIAL ROTATION CALENDAR             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Every 60 Days (High-Risk):                            │
│  • Database credentials (DATABASE_URL)                 │
│  • Third-party API keys                                │
│  • Session encryption keys                             │
│                                                         │
│  Every 90 Days (Standard):                             │
│  • VERCEL_TOKEN                                        │
│  • OAuth access tokens                                 │
│  • Service account keys                                │
│                                                         │
│  Every 180 Days (Low-Risk):                            │
│  • Encryption keys (non-critical)                      │
│  • Static API endpoints                                │
│                                                         │
│  Never (Stable):                                       │
│  • VERCEL_ORG_ID                                       │
│  • VERCEL_PROJECT_ID                                   │
│  • Public configuration                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### How to Rotate VERCEL_TOKEN (Example)

**Step 1: Generate New Token**
```bash
# Go to: https://vercel.com/account/tokens
# Click "Create"
# Set expiration: 90 days from today
# Copy new token
```

**Step 2: Update GitHub Secret**
```bash
# Go to: https://github.com/z88865092-art/artifacts-jarvis-dashboard/settings/secrets/actions
# Click on VERCEL_TOKEN
# Click "Update"
# Paste new token
# Click "Update secret"
```

**Step 3: Verify Rotation**
```bash
# Push a test commit to trigger CI/CD
git commit --allow-empty -m "chore: test credential rotation"
git push origin main

# Check GitHub Actions:
# https://github.com/z88865092-art/artifacts-jarvis-dashboard/actions
# Deployment should succeed with new token
```

**Step 4: Revoke Old Token**
```bash
# Go back to: https://vercel.com/account/tokens
# Find the old token
# Click delete/revoke
```

**Step 5: Log Rotation**
```bash
# Add entry to rotation log
echo "VERCEL_TOKEN rotated: $(date)" >> SECURITY_AUDIT.log
```

---

## Secret Scanning & Compliance

### Automated Secret Detection

GitHub automatically scans for exposed secrets:

```bash
# Enable in repository:
# Settings → Security → Secret scanning
# ✅ Secret scanning: ENABLED
# ✅ Push protection: ENABLED
```

**If GitHub detects exposed secrets:**

```bash
# 1. GitHub sends alert
# 2. You receive email notification
# 3. Check: Security → Secret scanning
# 4. Verify it's a false positive or real leak
# 5. If real: Immediately revoke in Vercel
# 6. Generate new token
# 7. Update GitHub Secret
```

### Manual Secret Scan

```bash
# Install TruffleHog for local scanning
npm install -g trufflesecurity/trufflehog

# Scan repository
trufflehog filesystem . --json

# If secrets found: STOP and revoke immediately
```

---

## Emergency Credential Revocation

### If You Suspect Compromise

**Immediate Actions (Within 5 minutes):**

```bash
# 1. Revoke compromised token
# Go to: https://vercel.com/account/tokens → Delete

# 2. Check Vercel deployment logs
# https://vercel.com/dashboard → Deployments
# Look for unauthorized deployments

# 3. Generate new token immediately
# https://vercel.com/account/tokens → Create
# Expiration: 30 days (shorter, for emergency)

# 4. Update GitHub Secret
# https://github.com/.../settings/secrets/actions → Update VERCEL_TOKEN

# 5. Verify deployment works
git commit --allow-empty -m "chore: emergency credential rotation"
git push origin main
# Watch GitHub Actions succeed
```

**Follow-up Actions (Within 24 hours):**

```bash
# 1. Review git history for suspicious commits
git log --oneline -20

# 2. Check for unexpected changes
git diff HEAD~20..HEAD

# 3. Review GitHub Actions logs
# https://github.com/.../actions
# Look for unusual deployments

# 4. Enable GitHub audit log monitoring
# https://github.com/.../settings/audit-log

# 5. Document incident
echo "Emergency credential revocation: $(date)" >> SECURITY_INCIDENTS.log
echo "Reason: [suspected compromise / accidental exposure]" >> SECURITY_INCIDENTS.log
echo "Token: VERCEL_TOKEN" >> SECURITY_INCIDENTS.log
echo "Actions taken: Revoked and regenerated" >> SECURITY_INCIDENTS.log
```

---

## Audit Trail & Logging

### Credential Access Logging

**GitHub Actions Audit Log:**
```bash
# View all secret access:
# Go to: https://github.com/z88865092-art/.../settings/audit-log
# Filter by: "secret"
# See: Who accessed what, when
```

**Create Manual Audit Log:**

```bash
# Create file: CREDENTIAL_AUDIT.md
cat > CREDENTIAL_AUDIT.md << 'EOF'
# Credential Access & Rotation Log

| Date | Credential | Action | Reason | Approver |
|------|-----------|--------|--------|----------|
| 2026-05-28 | VERCEL_TOKEN | Created | Initial setup | z88865092-art |
| 2026-08-28 | VERCEL_TOKEN | Rotated | 90-day rotation | z88865092-art |
| 2026-11-28 | VERCEL_TOKEN | Rotated | 90-day rotation | z88865092-art |

EOF
```

### Incident Response Template

```bash
cat > SECURITY_INCIDENTS.log << 'EOF'
# Security Incident Log

[INCIDENT #001]
Date: 2026-05-28
Type: [Credential exposure / Unauthorized access / Compromise suspected]
Credential: [VERCEL_TOKEN / DATABASE_URL / API_KEY]
Description: [What happened]
Discovery Method: [GitHub alert / Manual scan / User report]
Time to Revoke: [Time from discovery to revocation]
Status: [Resolved / Under investigation]
Actions Taken:
  1. Revoked compromised credential
  2. Generated replacement
  3. Updated all references
  4. Reviewed access logs
Lessons Learned: [What to improve]

EOF
```

---

## Best Practices Checklist

✅ **Always**
- Store secrets in GitHub Secrets, never in code
- Rotate credentials on schedule
- Log all rotations
- Use GitHub Secret scanning
- Enable push protection
- Mask secrets in logs
- Review access logs monthly
- Document incidents

❌ **Never**
- Commit .env files
- Paste secrets in Slack/Email
- Share credentials via unencrypted channels
- Hardcode secrets in source code
- Disable secret scanning
- Use same secret for multiple systems
- Ignore GitHub security alerts
- Leave secrets exposed in logs

---

## Emergency Contacts & Procedures

If you suspect security breach:

1. **Immediate**: Revoke all credentials
2. **Within 5 min**: Generate replacements
3. **Within 1 hour**: Review logs
4. **Within 24 hours**: Document incident
5. **Within 1 week**: Implement preventive measures

---

## Related Documentation

- [GitHub Secrets API](https://docs.github.com/en/rest/actions/secrets)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Last Security Audit**: 2026-05-28  
**Next Scheduled Rotation**: 2026-08-28 (VERCEL_TOKEN)  
**Next Review Date**: 2026-06-28
