# Production Verification Checklist

**Compliant Insurance Tracking Platform - Production Readiness Verification**

Version: 1.0  
Last Updated: January 2024  
Status: Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Verification](#pre-deployment-verification)
3. [Load Testing Verification](#load-testing-verification)
4. [Security Penetration Testing](#security-penetration-testing)
5. [Disaster Recovery Verification](#disaster-recovery-verification)
6. [Database Backup & Restore Validation](#database-backup--restore-validation)
7. [Secret Management Implementation](#secret-management-implementation)
8. [SSL/TLS Certificate Validation](#ssltls-certificate-validation)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Production Sign-Off Template](#production-sign-off-template)

---

## Overview

This comprehensive checklist ensures the Compliant Platform meets all production requirements before deployment. Each section must be completed and verified by the appropriate team members.

### Production Readiness Criteria

- ✅ **Performance**: p95 < 500ms, p99 < 1s
- ✅ **Security**: OWASP Top 10 compliance, automated scans passing
- ✅ **Reliability**: 99.9% uptime SLA capability
- ✅ **Disaster Recovery**: RTO ≤ 1h, RPO ≤ 15min (API), RPO ≤ 5min (DB)
- ✅ **Monitoring**: Full observability with alerts configured
- ✅ **Documentation**: All runbooks and procedures documented

---

## Pre-Deployment Verification

### 1. Environment Configuration

#### 1.1 Environment Variables Validation

```bash
# Run the automated validation script
node scripts/validate-production-env.js --env-file=.env.production

# Manual verification checklist
```

**Required Environment Variables:**

| Variable | Requirement | Validated | Notes |
|----------|-------------|-----------|-------|
| `NODE_ENV` | Must be "production" | [ ] | |
| `DATABASE_URL` | PostgreSQL with SSL | [ ] | Must include `?sslmode=require` |
| `JWT_SECRET` | ≥32 chars, unique | [ ] | Generated with `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | ≥32 chars, different from JWT_SECRET | [ ] | |
| `JWT_EXPIRATION` | Recommended: 15m-1h | [ ] | |
| `JWT_REFRESH_EXPIRATION` | Recommended: 7d-30d | [ ] | |
| `ENCRYPTION_KEY` | ≥32 chars | [ ] | For field-level encryption |
| `ENCRYPTION_SALT` | ≥16 chars | [ ] | |
| `REDIS_URL` | With password auth | [ ] | Prefer rediss:// (SSL) |
| `CORS_ORIGIN` | Production domains only | [ ] | No localhost |
| `EMAIL_PROVIDER` | sendgrid/aws_ses/smtp | [ ] | |
| `EMAIL_FROM` | Verified sender | [ ] | |
| `ADMIN_EMAIL` | Valid admin email | [ ] | |

**Provider-Specific Variables:**

SendGrid:
- [ ] `SENDGRID_API_KEY` (starts with SG.)

AWS SES:
- [ ] `AWS_SES_REGION`
- [ ] `AWS_SES_ACCESS_KEY`
- [ ] `AWS_SES_SECRET_KEY`

SMTP:
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`

AWS S3 Storage:
- [ ] `AWS_S3_BUCKET`
- [ ] `AWS_S3_REGION`
- [ ] `AWS_S3_ACCESS_KEY`
- [ ] `AWS_S3_SECRET_KEY`

Azure Blob Storage:
- [ ] `AZURE_STORAGE_CONNECTION_STRING`
- [ ] `AZURE_STORAGE_CONTAINER`

#### 1.2 Secrets Management

- [ ] All secrets stored in secure vault (AWS Secrets Manager/Azure Key Vault/HashiCorp Vault)
- [ ] No secrets in version control
- [ ] Secrets rotation policy documented
- [ ] Emergency secret rotation procedure tested

```bash
# Verify no secrets in git history
git log --all --full-history --source --pretty=format:'%H' -- '*.env*' | wc -l
# Should be 0 or only .env.example files

# Check for accidentally committed secrets
git grep -i "password\|secret\|api_key" -- '*.ts' '*.js' | grep -v "\.example"
```

#### 1.3 Configuration Files

- [ ] `.env.production` created with production values
- [ ] `.env.example` updated with all required variables
- [ ] `docker-compose.prod.yml` configured (if using Docker)
- [ ] Kubernetes manifests configured (if using K8s)
- [ ] All placeholder values replaced

### 2. Infrastructure Verification

#### 2.1 Database Setup

```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT version();"

# Verify SSL is enforced
psql "$DATABASE_URL" -c "SHOW ssl;"
# Expected: on

# Check connection pool settings
psql "$DATABASE_URL" -c "SHOW max_connections;"
# Recommended: 100-200 for production

# Verify database size and capacity
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size('compliant_production'));"
```

**Database Checklist:**

- [ ] Database created with appropriate name (e.g., `compliant_production`)
- [ ] SSL/TLS enabled and enforced
- [ ] Connection pooling configured (PgBouncer recommended)
- [ ] Database user has appropriate permissions (not superuser)
- [ ] Database password is strong (20+ characters, complex)
- [ ] Network access restricted to application servers only
- [ ] Monitoring enabled (query performance, connection count)
- [ ] Automated backups configured (next section)

#### 2.2 Redis Configuration

```bash
# Test Redis connection
redis-cli -u "$REDIS_URL" ping
# Expected: PONG

# Check Redis memory
redis-cli -u "$REDIS_URL" INFO memory

# Verify authentication is required
redis-cli -h <redis-host> ping
# Should fail without password
```

**Redis Checklist:**

- [ ] Redis instance deployed (version 6.0+)
- [ ] Password authentication enabled
- [ ] SSL/TLS enabled (if supported)
- [ ] Max memory policy set (e.g., `allkeys-lru`)
- [ ] Persistence configured (AOF + RDB)
- [ ] Network access restricted
- [ ] Monitoring enabled

#### 2.3 Application Servers

**Backend Server:**

```bash
# Build verification
cd packages/backend
pnpm build
# Should complete without errors

# Start production build locally
NODE_ENV=production node dist/main.js
# Should start without errors
```

- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] All dependencies installed
- [ ] Production optimizations enabled
- [ ] Source maps generated (stored securely)
- [ ] Health check endpoint responds: `/api/health`

**Frontend Application:**

```bash
# Build verification
cd packages/frontend
pnpm build
# Should complete without errors

# Verify build output
ls -lh .next/standalone
```

- [ ] Build completes successfully
- [ ] No build warnings (critical)
- [ ] Static assets optimized
- [ ] Environment variables injected correctly
- [ ] SSR/SSG configured appropriately

#### 2.4 Container Images (Docker Deployment)

```bash
# Build Docker images
docker build -t compliant-backend:prod -f packages/backend/Dockerfile .
docker build -t compliant-frontend:prod -f packages/frontend/Dockerfile .

# Scan for vulnerabilities
docker scan compliant-backend:prod
docker scan compliant-frontend:prod

# Verify image size
docker images | grep compliant
# Backend should be < 300MB
# Frontend should be < 200MB
```

**Container Checklist:**

- [ ] Images build successfully
- [ ] Multi-stage builds used for optimization
- [ ] No critical vulnerabilities
- [ ] Health checks configured
- [ ] Non-root user configured
- [ ] Images tagged with version
- [ ] Images pushed to registry

### 3. Dependency Security Audit

```bash
# Run security audit script
./scripts/security-scan.sh

# Manual audit for each package
cd packages/backend
pnpm audit --audit-level=high

cd ../frontend
pnpm audit --audit-level=high

cd ../shared
pnpm audit --audit-level=high
```

**Security Audit Checklist:**

- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities (or documented exceptions)
- [ ] All dependencies up-to-date (or pinned with reason)
- [ ] No deprecated packages in use
- [ ] License compliance verified
- [ ] Supply chain security verified (lockfile committed)

```bash
# Check for outdated packages
pnpm outdated

# Verify lockfile integrity
pnpm install --frozen-lockfile
```

### 4. Code Quality Verification

```bash
# Run linters
pnpm lint

# Run TypeScript checks
pnpm run type-check

# Run tests
pnpm test

# Check test coverage
pnpm test:coverage
```

**Code Quality Checklist:**

- [ ] All linting passes
- [ ] No TypeScript errors
- [ ] Test suite passes (100% critical paths)
- [ ] Code coverage ≥ 80% (critical modules ≥ 90%)
- [ ] No console.log statements in production code
- [ ] No TODO/FIXME comments in critical code
- [ ] Code reviewed and approved

---

## Load Testing Verification

### Performance Requirements

| Metric | Target | Verified | Actual |
|--------|--------|----------|--------|
| API Response Time (p50) | < 200ms | [ ] | ___ms |
| API Response Time (p95) | < 500ms | [ ] | ___ms |
| API Response Time (p99) | < 1000ms | [ ] | ___ms |
| Database Query Time (p95) | < 100ms | [ ] | ___ms |
| Concurrent Users | ≥ 200 | [ ] | ___ |
| Requests/Second | ≥ 500 | [ ] | ___ |
| Error Rate | < 0.1% | [ ] | ___% |
| Memory Usage | Stable | [ ] | Peak: ___MB |
| CPU Usage | < 70% | [ ] | Peak: ___% |

### Load Test Scenarios

See [LOAD_TESTING_GUIDE.md](./LOAD_TESTING_GUIDE.md) for detailed test scripts.

#### Scenario 1: Normal Load Test

```bash
# Run normal load test
k6 run tests/load/normal-load.js

# Verify results
# Expected: All thresholds passing
```

**Verification:**

- [ ] Test completed successfully
- [ ] All endpoints respond within SLA
- [ ] No errors during test
- [ ] Memory stable throughout test
- [ ] Results documented below

**Results:**

```
# Paste K6 results here
```

#### Scenario 2: Peak Load Test

```bash
# Run peak load test (200 concurrent users)
k6 run tests/load/peak-load.js
```

**Verification:**

- [ ] System handles peak load
- [ ] Response times within acceptable limits
- [ ] Error rate < 0.1%
- [ ] Auto-scaling triggered (if configured)
- [ ] Results documented

#### Scenario 3: Stress Test

```bash
# Find system breaking point
k6 run tests/load/stress-test.js
```

**Verification:**

- [ ] Breaking point identified: _____ concurrent users
- [ ] Graceful degradation observed
- [ ] System recovers after load reduction
- [ ] Resource limits documented

#### Scenario 4: Spike Test

```bash
# Test sudden traffic spike
k6 run tests/load/spike-test.js
```

**Verification:**

- [ ] System handles traffic spikes
- [ ] Auto-scaling responds appropriately
- [ ] No cascading failures
- [ ] Recovery time < 5 minutes

#### Scenario 5: Soak Test

```bash
# Run for 2-4 hours
k6 run --duration=2h tests/load/soak-test.js
```

**Verification:**

- [ ] No memory leaks detected
- [ ] Performance stable over time
- [ ] No database connection leaks
- [ ] No gradual degradation

### Database Performance

```bash
# Check slow queries
psql "$DATABASE_URL" -c "
SELECT query, calls, total_time, mean_time, min_time, max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;"

# Check missing indexes
# Run explain analyze on critical queries
```

**Database Performance Checklist:**

- [ ] All critical queries have indexes
- [ ] No queries taking > 1s
- [ ] Connection pool size appropriate
- [ ] Query cache hit rate > 90%
- [ ] No lock contention observed

### Caching Performance

```bash
# Check Redis cache hit rate
redis-cli -u "$REDIS_URL" INFO stats | grep keyspace
```

**Caching Checklist:**

- [ ] Cache hit rate > 80%
- [ ] Cache invalidation working correctly
- [ ] No stale data issues
- [ ] TTL configured appropriately

### CDN Performance (Frontend)

- [ ] Static assets served from CDN
- [ ] Cache headers configured correctly
- [ ] CDN hit rate > 90%
- [ ] Global edge locations active

---

## Security Penetration Testing

### OWASP Top 10 Verification

#### 1. Broken Access Control

**Tests:**

```bash
# Test unauthorized access
curl -X GET https://api.yourdomain.com/api/admin/users
# Expected: 401 Unauthorized

# Test accessing other user's data
TOKEN="<user1-token>"
curl -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/api/contractors/999999
# Expected: 403 Forbidden or 404

# Test privilege escalation
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}' \
  https://api.yourdomain.com/api/users/me
# Expected: 403 Forbidden
```

**Checklist:**

- [ ] JWT authentication required on all protected routes
- [ ] Role-based access control (RBAC) enforced
- [ ] Users cannot access other users' data
- [ ] Users cannot escalate privileges
- [ ] Admin routes protected
- [ ] API endpoints with proper authorization

#### 2. Cryptographic Failures

**Tests:**

```bash
# Verify HTTPS enforcement
curl -I http://api.yourdomain.com
# Expected: Redirect to HTTPS (301)

# Check SSL/TLS version
nmap --script ssl-enum-ciphers -p 443 api.yourdomain.com
# Expected: TLS 1.2+, strong ciphers only

# Test password storage
# Passwords should be hashed with bcrypt (manual code review)
```

**Checklist:**

- [ ] All connections use HTTPS/TLS
- [ ] TLS 1.2+ enforced (TLS 1.0/1.1 disabled)
- [ ] Strong cipher suites only
- [ ] Passwords hashed with bcrypt (cost ≥ 10)
- [ ] Sensitive data encrypted at rest (PII, credentials)
- [ ] JWT secrets are strong (≥32 chars)
- [ ] Field-level encryption for PII (SSN, etc.)

#### 3. Injection Attacks

**Tests:**

```bash
# SQL Injection test
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com'\'' OR 1=1--","password":"test"}' \
  https://api.yourdomain.com/api/auth/login
# Expected: 400 Bad Request or 401 Unauthorized (not SQL error)

# NoSQL Injection test (if using MongoDB)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}' \
  https://api.yourdomain.com/api/auth/login
# Expected: 400 Bad Request

# Command Injection test
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test; rm -rf /"}' \
  https://api.yourdomain.com/api/documents/upload
# Expected: 400 Bad Request (filename validated)
```

**Checklist:**

- [ ] Prisma ORM used (parameterized queries)
- [ ] Input validation on all endpoints (class-validator)
- [ ] Whitelist validation for file uploads
- [ ] No raw SQL queries (or properly parameterized)
- [ ] HTML sanitization for rich text fields
- [ ] Command injection prevention

#### 4. Insecure Design

**Checklist:**

- [ ] Security requirements defined
- [ ] Threat modeling completed
- [ ] Secure development lifecycle followed
- [ ] Security controls for sensitive operations
- [ ] Rate limiting implemented
- [ ] Business logic flaws addressed

#### 5. Security Misconfiguration

**Tests:**

```bash
# Check for exposed debug endpoints
curl https://api.yourdomain.com/debug
# Expected: 404 or disabled

# Check for default credentials
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin"}' \
  https://api.yourdomain.com/api/auth/login
# Expected: Should fail

# Check security headers
curl -I https://api.yourdomain.com
# Should include security headers
```

**Checklist:**

- [ ] NODE_ENV=production
- [ ] Debug mode disabled
- [ ] Stack traces not exposed in responses
- [ ] Unnecessary services disabled
- [ ] Default credentials changed
- [ ] Error messages don't leak info
- [ ] Security headers configured:
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Content-Security-Policy`
  - [ ] `Referrer-Policy`

#### 6. Vulnerable and Outdated Components

**Tests:**

```bash
# Run security audit
./scripts/security-scan.sh

# Check for known vulnerabilities
pnpm audit --audit-level=moderate
```

**Checklist:**

- [ ] All dependencies up-to-date
- [ ] No known vulnerabilities
- [ ] Regular security scanning in CI/CD
- [ ] Dependency update policy documented

#### 7. Identification and Authentication Failures

**Tests:**

```bash
# Test weak password
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123"}' \
  https://api.yourdomain.com/api/auth/register
# Expected: 400 Bad Request (password too weak)

# Test brute force protection
for i in {1..20}; do
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"wrong"}' \
    https://api.yourdomain.com/api/auth/login
done
# Expected: Rate limit triggered after N attempts
```

**Checklist:**

- [ ] Password complexity enforced (min 8 chars, complexity)
- [ ] Rate limiting on authentication endpoints
- [ ] Account lockout after failed attempts
- [ ] Multi-factor authentication available (future)
- [ ] Session management secure
- [ ] JWT expiration enforced
- [ ] Refresh token rotation implemented
- [ ] Password reset flow secure

#### 8. Software and Data Integrity Failures

**Checklist:**

- [ ] Dependencies verified (lockfile integrity)
- [ ] Docker images from trusted sources
- [ ] CI/CD pipeline secure
- [ ] Code signing implemented
- [ ] Auto-update mechanism secure
- [ ] Integrity checks for critical data

#### 9. Security Logging and Monitoring Failures

**Tests:**

```bash
# Check if security events are logged
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"wrong"}' \
  https://api.yourdomain.com/api/auth/login

# Verify in logs (should see failed login attempt)
kubectl logs -f deployment/backend | grep "Failed login"
```

**Checklist:**

- [ ] Authentication events logged
- [ ] Authorization failures logged
- [ ] Critical operations logged (audit log)
- [ ] Logs centralized (CloudWatch, DataDog, etc.)
- [ ] Log retention policy implemented
- [ ] Sensitive data not logged
- [ ] Alerting configured for security events
- [ ] Logs protected from tampering

#### 10. Server-Side Request Forgery (SSRF)

**Tests:**

```bash
# Test SSRF in file upload (URL-based)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}' \
  https://api.yourdomain.com/api/documents/import
# Expected: 400 Bad Request (internal IPs blocked)
```

**Checklist:**

- [ ] URL validation for external resources
- [ ] Internal IP ranges blocked
- [ ] Whitelist of allowed domains
- [ ] Network segmentation in place

### Automated Security Scanning

```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.yourdomain.com \
  -r zap-report.html

# Nikto web scanner
nikto -h https://api.yourdomain.com

# SSL Labs test
# Go to: https://www.ssllabs.com/ssltest/
# Enter: api.yourdomain.com
# Expected grade: A or A+
```

**Automated Scanning Checklist:**

- [ ] OWASP ZAP scan completed (no high/critical)
- [ ] Nikto scan completed
- [ ] SSL Labs grade A or A+
- [ ] Mozilla Observatory grade A or A+
- [ ] Security headers validated

---

## Disaster Recovery Verification

### RTO/RPO Requirements

| Component | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) | Verified |
|-----------|-------------------------------|--------------------------------|----------|
| API Service | 1 hour | 15 minutes | [ ] |
| Database | 1 hour | 5 minutes | [ ] |
| Redis Cache | 30 minutes | Acceptable loss | [ ] |
| File Storage | 1 hour | 1 hour | [ ] |
| Frontend | 30 minutes | 15 minutes | [ ] |

See [DISASTER_RECOVERY_PROCEDURES.md](./DISASTER_RECOVERY_PROCEDURES.md) for detailed procedures.

### DR Test Scenarios

#### Test 1: Database Failure & Recovery

```bash
# Simulate database failure
# Stop database server

# Trigger failover to replica (if using replication)
# Or restore from backup

# Measure time to recovery
# Expected: < 1 hour RTO, < 5 min RPO
```

**Verification:**

- [ ] Backup restoration tested successfully
- [ ] Data loss within RPO
- [ ] Recovery time within RTO
- [ ] Application reconnects automatically
- [ ] No data corruption

#### Test 2: Complete Infrastructure Failure

```bash
# Simulate complete failure
# Deploy to DR region/cluster

# Measure time to recovery
# Expected: < 2 hours for full recovery
```

**Verification:**

- [ ] DR site deployment tested
- [ ] DNS failover working
- [ ] Data replicated to DR site
- [ ] Recovery procedure documented
- [ ] Team trained on procedure

#### Test 3: Data Corruption

```bash
# Simulate data corruption
# Restore to point-in-time before corruption

# Measure recovery
```

**Verification:**

- [ ] Point-in-time recovery working
- [ ] Data integrity verified
- [ ] Recovery time acceptable

### DR Testing Schedule

- [ ] Monthly: Database backup/restore test
- [ ] Quarterly: Full DR failover test
- [ ] Annually: Complete disaster simulation

---

## Database Backup & Restore Validation

### Backup Configuration

#### Automated Backups

**AWS RDS:**

```bash
# Verify automated backups enabled
aws rds describe-db-instances \
  --db-instance-identifier compliant-production \
  --query 'DBInstances[0].BackupRetentionPeriod'
# Expected: ≥ 30 days

# List recent backups
aws rds describe-db-snapshots \
  --db-instance-identifier compliant-production
```

**Azure Database:**

```bash
# Check backup retention
az postgres server show \
  --resource-group compliant-rg \
  --name compliant-production \
  --query backupRetentionDays
# Expected: ≥ 30 days
```

**Self-Managed PostgreSQL:**

```bash
# Verify pg_dump cron job
crontab -l | grep pg_dump

# Expected: Daily backups
# 0 2 * * * pg_dump $DATABASE_URL > /backups/compliant-$(date +\%Y\%m\%d).sql
```

**Backup Checklist:**

- [ ] Automated daily backups configured
- [ ] Backup retention ≥ 30 days
- [ ] Backups stored in separate region
- [ ] Backup encryption enabled
- [ ] Backup monitoring/alerting active
- [ ] Backup integrity verification automated

### Backup Restoration Testing

#### Test 1: Full Database Restore

```bash
# Create test environment
export TEST_DATABASE_URL="postgresql://user:pass@testhost:5432/restore_test"

# Restore latest backup
# AWS RDS
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier compliant-restore-test \
  --db-snapshot-identifier <snapshot-id>

# Azure
az postgres server restore \
  --resource-group compliant-rg \
  --name compliant-restore-test \
  --restore-point-in-time "2024-01-01T00:00:00Z" \
  --source-server compliant-production

# Self-managed
psql $TEST_DATABASE_URL < /backups/compliant-latest.sql
```

**Verification:**

- [ ] Restore completes without errors
- [ ] All tables present
- [ ] Row counts match
- [ ] Indexes created
- [ ] Foreign keys intact
- [ ] Application can connect
- [ ] Sample queries return expected data

```bash
# Verify row counts
psql $TEST_DATABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
"

# Compare with production (should be close)
psql $DATABASE_URL -c "<same query>"
```

#### Test 2: Point-in-Time Recovery (PITR)

```bash
# Restore to specific timestamp
# AWS RDS
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier compliant-production \
  --target-db-instance-identifier compliant-pitr-test \
  --restore-time 2024-01-01T12:00:00Z

# Azure
az postgres server restore \
  --resource-group compliant-rg \
  --name compliant-pitr-test \
  --restore-point-in-time "2024-01-01T12:00:00Z" \
  --source-server compliant-production
```

**Verification:**

- [ ] PITR restore successful
- [ ] Data matches expected state at recovery time
- [ ] Recovery time within RPO (5 minutes)

#### Test 3: Backup Integrity

```bash
# Verify backup can be read
pg_restore --list /backups/compliant-latest.dump

# Expected: List of all database objects

# Test restore to temp database
createdb compliant_integrity_test
pg_restore -d compliant_integrity_test /backups/compliant-latest.dump

# Verify
psql compliant_integrity_test -c "\\dt"
```

**Verification:**

- [ ] Backup file not corrupted
- [ ] All objects restored
- [ ] No errors during restore

### Backup Monitoring

```bash
# Check last backup time
# AWS RDS
aws rds describe-db-snapshots \
  --db-instance-identifier compliant-production \
  --query 'DBSnapshots[0].SnapshotCreateTime'

# Azure
az postgres server show \
  --resource-group compliant-rg \
  --name compliant-production \
  --query earliestRestoreDate
```

**Monitoring Checklist:**

- [ ] Alert if backup fails
- [ ] Alert if backup older than 25 hours
- [ ] Dashboard shows backup status
- [ ] Backup size trend monitored

---

## Secret Management Implementation

### Secret Storage

**AWS Secrets Manager:**

```bash
# Store secrets
aws secretsmanager create-secret \
  --name compliant/production/jwt-secret \
  --secret-string "<generated-secret>"

aws secretsmanager create-secret \
  --name compliant/production/database-password \
  --secret-string "<db-password>"

# Retrieve secrets (in application)
# Use AWS SDK to fetch secrets at runtime
```

**Azure Key Vault:**

```bash
# Store secrets
az keyvault secret set \
  --vault-name compliant-production-kv \
  --name jwt-secret \
  --value "<generated-secret>"

az keyvault secret set \
  --vault-name compliant-production-kv \
  --name database-password \
  --value "<db-password>"

# Grant application access
az keyvault set-policy \
  --name compliant-production-kv \
  --spn <app-service-principal> \
  --secret-permissions get list
```

**HashiCorp Vault:**

```bash
# Store secrets
vault kv put secret/compliant/production/jwt-secret value="<generated-secret>"
vault kv put secret/compliant/production/database password="<db-password>"

# Create policy for application
vault policy write compliant-app -<<EOF
path "secret/data/compliant/production/*" {
  capabilities = ["read", "list"]
}
EOF
```

**Kubernetes Secrets:**

```bash
# Create secrets
kubectl create secret generic compliant-secrets \
  --from-literal=jwt-secret='<generated-secret>' \
  --from-literal=database-password='<db-password>' \
  -n production

# Verify secrets created
kubectl get secrets -n production
kubectl describe secret compliant-secrets -n production
```

**Secret Management Checklist:**

- [ ] All secrets stored in vault (not in env vars directly)
- [ ] Application has IAM/RBAC permissions to access secrets
- [ ] Secrets fetched at application startup
- [ ] Secrets not logged
- [ ] Secrets not exposed in error messages
- [ ] Access to secrets audited

### Secret Rotation

**Rotation Checklist:**

- [ ] Rotation procedure documented
- [ ] Rotation schedule defined (quarterly minimum)
- [ ] Zero-downtime rotation strategy
- [ ] Old secrets invalidated after rotation
- [ ] Rotation tested successfully

```bash
# Test secret rotation procedure
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Store new secret (with version)
aws secretsmanager put-secret-value \
  --secret-id compliant/production/jwt-secret \
  --secret-string "$NEW_SECRET"

# 3. Deploy application update to use new secret
# 4. Verify application functioning
# 5. Monitor for errors

# 6. Remove old secret version after transition period
aws secretsmanager delete-secret \
  --secret-id compliant/production/jwt-secret \
  --recovery-window-in-days 7
```

**Verification:**

- [ ] Rotation completed without downtime
- [ ] Application uses new secrets
- [ ] Old secrets no longer work
- [ ] Users not logged out (JWT rotation strategy)

### Emergency Secret Revocation

**Procedure:**

```bash
# If secret compromised

# 1. Immediately rotate secret
./scripts/emergency-secret-rotation.sh jwt-secret

# 2. Revoke all active sessions (JWT scenario)
redis-cli -u "$REDIS_URL" FLUSHDB

# 3. Force users to re-authenticate
# 4. Review access logs for suspicious activity
# 5. Document incident
```

**Checklist:**

- [ ] Emergency rotation procedure documented
- [ ] 24/7 contact list available
- [ ] Rotation script tested
- [ ] Incident response plan ready

---

## SSL/TLS Certificate Validation

### Certificate Configuration

#### Certificate Acquisition

**Let's Encrypt (Certbot):**

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

**AWS Certificate Manager (ACM):**

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS

# Add DNS validation records
# Certificate auto-renews
```

**Azure App Service:**

```bash
# Managed certificate (auto-renews)
az webapp config ssl create \
  --resource-group compliant-rg \
  --name compliant-api \
  --hostname api.yourdomain.com
```

**Certificate Checklist:**

- [ ] SSL certificate installed
- [ ] Certificate valid for all required domains
- [ ] Certificate not self-signed (production)
- [ ] Certificate chain complete
- [ ] Auto-renewal configured
- [ ] Expiration monitoring enabled

### SSL/TLS Validation Tests

#### Test 1: SSL Configuration

```bash
# Test with OpenSSL
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com

# Check certificate details
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com \
  </dev/null 2>/dev/null | openssl x509 -noout -dates

# Expected:
# notBefore: <issue date>
# notAfter: <expiry date> (> 30 days from now)
```

**Verification:**

- [ ] Certificate valid and not expired
- [ ] Certificate matches domain
- [ ] Certificate chain verifies successfully
- [ ] Certificate issuer trusted

#### Test 2: TLS Version and Ciphers

```bash
# Check TLS versions
nmap --script ssl-enum-ciphers -p 443 api.yourdomain.com

# Test specific TLS versions
openssl s_client -connect api.yourdomain.com:443 -tls1
# Expected: Failure (TLS 1.0 disabled)

openssl s_client -connect api.yourdomain.com:443 -tls1_1
# Expected: Failure (TLS 1.1 disabled)

openssl s_client -connect api.yourdomain.com:443 -tls1_2
# Expected: Success

openssl s_client -connect api.yourdomain.com:443 -tls1_3
# Expected: Success (if supported)
```

**TLS Configuration Checklist:**

- [ ] TLS 1.2 enabled
- [ ] TLS 1.3 enabled (if supported)
- [ ] TLS 1.0 disabled
- [ ] TLS 1.1 disabled
- [ ] SSL v2/v3 disabled
- [ ] Strong ciphers only (no RC4, DES, MD5)
- [ ] Forward secrecy enabled (ECDHE/DHE)

#### Test 3: HTTP to HTTPS Redirect

```bash
# Test HTTP access
curl -I http://api.yourdomain.com
# Expected: 301 Permanent Redirect to https://

curl -I http://www.yourdomain.com
# Expected: 301 Permanent Redirect to https://
```

**Verification:**

- [ ] HTTP redirects to HTTPS (301)
- [ ] HSTS header present
- [ ] All subdomains redirect

#### Test 4: HSTS Configuration

```bash
# Check HSTS header
curl -I https://api.yourdomain.com | grep -i strict-transport-security

# Expected: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**HSTS Checklist:**

- [ ] HSTS header present
- [ ] max-age ≥ 31536000 (1 year)
- [ ] includeSubDomains directive
- [ ] preload directive (consider HSTS preload list)

#### Test 5: SSL Labs Analysis

```bash
# SSL Labs API test
curl -s "https://api.ssllabs.com/api/v3/analyze?host=api.yourdomain.com" | jq .
```

**SSL Labs Checklist:**

- [ ] Overall grade: A or A+
- [ ] Certificate: 100%
- [ ] Protocol Support: 100%
- [ ] Key Exchange: ≥ 90%
- [ ] Cipher Strength: ≥ 90%
- [ ] No major warnings

**Manual test:** Visit https://www.ssllabs.com/ssltest/ and enter domain

#### Test 6: Certificate Monitoring

```bash
# Check certificate expiration
echo | openssl s_client -servername api.yourdomain.com -connect api.yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Calculate days until expiration
EXPIRY=$(echo | openssl s_client -servername api.yourdomain.com -connect api.yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
echo "Certificate expires in $DAYS_LEFT days"

# Expected: > 30 days
```

**Monitoring Checklist:**

- [ ] Certificate expiration monitoring enabled
- [ ] Alert configured for 30 days before expiration
- [ ] Alert configured for 7 days before expiration
- [ ] Auto-renewal verified working
- [ ] Team notified of renewal events

---

## Post-Deployment Verification

### Health Check Verification

```bash
# Check API health
curl -f https://api.yourdomain.com/api/health
# Expected: {"status":"ok","timestamp":"2024-...","services":{"database":"up","redis":"up"}}

# Check with monitoring tool
curl -f https://api.yourdomain.com/api/health/detailed
# Expected: Detailed service status
```

**Health Check Checklist:**

- [ ] `/api/health` returns 200 OK
- [ ] Database connection verified
- [ ] Redis connection verified
- [ ] Health check response time < 100ms
- [ ] Health check integrated with load balancer

### Application Functionality Tests

#### Test 1: Authentication Flow

```bash
# Register new user
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test123!@#",
    "firstName":"Test",
    "lastName":"User",
    "role":"GC_ADMIN"
  }'

# Expected: 201 Created with user object

# Login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test123!@#"
  }'

# Expected: 200 OK with access_token and refresh_token

# Store token
TOKEN="<access_token from response>"

# Verify token works
curl -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/api/auth/profile

# Expected: User profile returned
```

**Verification:**

- [ ] User registration works
- [ ] Login successful
- [ ] JWT token generated
- [ ] Token validates correctly
- [ ] Profile endpoint accessible

#### Test 2: Core Business Logic

```bash
# Create project
curl -X POST https://api.yourdomain.com/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Production Test Project",
    "address":"123 Test St",
    "city":"Test City",
    "state":"TS",
    "zip":"12345",
    "clientName":"Test Client"
  }'

# Expected: 201 Created
PROJECT_ID="<id from response>"

# Create contractor
curl -X POST https://api.yourdomain.com/api/contractors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName":"Test Contractor",
    "contactEmail":"contractor@example.com",
    "contactPhone":"555-1234",
    "address":"456 Contractor Ave",
    "projectId":"'$PROJECT_ID'"
  }'

# Expected: 201 Created
CONTRACTOR_ID="<id from response>"

# Generate COI
curl -X POST https://api.yourdomain.com/api/coi/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractorId":"'$CONTRACTOR_ID'",
    "projectId":"'$PROJECT_ID'"
  }'

# Expected: 201 Created with PDF URL
```

**Verification:**

- [ ] Projects can be created
- [ ] Contractors can be added
- [ ] COI can be generated
- [ ] Hold Harmless auto-generated
- [ ] PDF documents created successfully

#### Test 3: File Upload

```bash
# Upload COI document
curl -X POST https://api.yourdomain.com/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-coi.pdf" \
  -F "contractorId=$CONTRACTOR_ID" \
  -F "documentType=COI"

# Expected: 200 OK with document URL

# Download document
curl -O https://api.yourdomain.com/api/documents/<document-id> \
  -H "Authorization: Bearer $TOKEN"

# Verify file downloaded correctly
```

**Verification:**

- [ ] File upload successful
- [ ] File stored correctly (S3/Azure/local)
- [ ] File download works
- [ ] File security (can't access other users' files)

#### Test 4: Email Notifications

**Verification:**

- [ ] Welcome email sent on registration
- [ ] COI upload notification sent
- [ ] Renewal reminders working
- [ ] Email templates render correctly
- [ ] Unsubscribe links work

#### Test 5: Scheduled Tasks

```bash
# Check cron jobs are running
# View logs for scheduled tasks

# Backend logs
kubectl logs -f deployment/backend | grep "CRON"
# or
docker logs compliant-backend | grep "CRON"

# Expected: Daily renewal reminder job executing
```

**Verification:**

- [ ] Renewal reminders scheduled (daily 6 AM)
- [ ] Token cleanup scheduled (daily 2 AM)
- [ ] Jobs executing successfully
- [ ] No errors in cron logs

### Performance Verification

```bash
# Measure response time
time curl https://api.yourdomain.com/api/health

# Expected: < 200ms

# Load test with small load
ab -n 100 -c 10 https://api.yourdomain.com/api/health

# Expected: 
# - All requests successful
# - Mean response time < 200ms
```

**Performance Checklist:**

- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] Caching working correctly
- [ ] CDN serving static assets
- [ ] Resource usage within limits

### Monitoring & Alerting Verification

**Monitoring Checklist:**

- [ ] Application metrics visible (APM dashboard)
- [ ] Server metrics visible (CPU, memory, disk)
- [ ] Database metrics visible (connections, queries)
- [ ] Error tracking active (Sentry/similar)
- [ ] Logs centralized and searchable
- [ ] Uptime monitoring active

**Alerting Checklist:**

- [ ] Downtime alert configured
- [ ] Error rate threshold alert (> 1%)
- [ ] Response time alert (p95 > 1s)
- [ ] Database connection alert
- [ ] High CPU/memory alert
- [ ] SSL certificate expiration alert
- [ ] Alert channels configured (email, Slack, PagerDuty)
- [ ] Test alert sent and received

### Frontend Verification

```bash
# Test frontend loads
curl -I https://app.yourdomain.com
# Expected: 200 OK

# Check for console errors
# Manual: Open browser dev tools
```

**Frontend Checklist:**

- [ ] Application loads successfully
- [ ] No console errors
- [ ] Authentication working
- [ ] API calls successful (no CORS errors)
- [ ] Forms submit correctly
- [ ] File uploads work
- [ ] Responsive design works
- [ ] Performance acceptable (Lighthouse score)

### Database Verification

```bash
# Check database status
psql "$DATABASE_URL" -c "SELECT version();"

# Check connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check table sizes
psql "$DATABASE_URL" -c "
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

**Database Checklist:**

- [ ] All migrations applied
- [ ] Database responsive
- [ ] Connection pool healthy
- [ ] No missing indexes
- [ ] Backups running successfully

---

## Production Sign-Off Template

### Deployment Information

- **Deployment Date:** ___________________
- **Deployed By:** ___________________
- **Version/Tag:** ___________________
- **Environment:** Production
- **Deployment Method:** [ ] Docker [ ] Kubernetes [ ] PaaS [ ] Other: _____

### Pre-Deployment Verification

| Category | Status | Verified By | Date |
|----------|--------|-------------|------|
| Environment Configuration | [ ] Pass [ ] Fail | __________ | _______ |
| Infrastructure Setup | [ ] Pass [ ] Fail | __________ | _______ |
| Security Audit | [ ] Pass [ ] Fail | __________ | _______ |
| Code Quality | [ ] Pass [ ] Fail | __________ | _______ |
| Database Migrations | [ ] Pass [ ] Fail | __________ | _______ |

### Performance Testing

| Test Type | Result | P95 Latency | P99 Latency | Verified By |
|-----------|--------|-------------|-------------|-------------|
| Normal Load | [ ] Pass [ ] Fail | ____ms | ____ms | __________ |
| Peak Load | [ ] Pass [ ] Fail | ____ms | ____ms | __________ |
| Stress Test | [ ] Pass [ ] Fail | Breaking point: ____ users | | __________ |
| Spike Test | [ ] Pass [ ] Fail | Recovery: ____min | | __________ |
| Soak Test | [ ] Pass [ ] Fail | Duration: ____h | | __________ |

**Performance Requirements Met:** [ ] Yes [ ] No

### Security Testing

| OWASP Category | Status | Critical Issues | Verified By |
|----------------|--------|-----------------|-------------|
| Access Control | [ ] Pass [ ] Fail | _____ | __________ |
| Cryptographic Failures | [ ] Pass [ ] Fail | _____ | __________ |
| Injection | [ ] Pass [ ] Fail | _____ | __________ |
| Insecure Design | [ ] Pass [ ] Fail | _____ | __________ |
| Security Misconfiguration | [ ] Pass [ ] Fail | _____ | __________ |
| Vulnerable Components | [ ] Pass [ ] Fail | _____ | __________ |
| Auth Failures | [ ] Pass [ ] Fail | _____ | __________ |
| Data Integrity | [ ] Pass [ ] Fail | _____ | __________ |
| Logging Failures | [ ] Pass [ ] Fail | _____ | __________ |
| SSRF | [ ] Pass [ ] Fail | _____ | __________ |

**Security Requirements Met:** [ ] Yes [ ] No

**SSL Labs Grade:** ______

### Disaster Recovery

| Test | RTO Requirement | RPO Requirement | Actual RTO | Actual RPO | Status |
|------|-----------------|-----------------|------------|------------|--------|
| Database Restore | 1 hour | 5 minutes | _________ | _________ | [ ] Pass |
| Full Infrastructure | 2 hours | 15 minutes | _________ | _________ | [ ] Pass |
| Point-in-Time Recovery | 1 hour | 5 minutes | _________ | _________ | [ ] Pass |

**DR Requirements Met:** [ ] Yes [ ] No

### Post-Deployment Verification

| Check | Status | Verified By | Notes |
|-------|--------|-------------|-------|
| Health Endpoint | [ ] Pass [ ] Fail | __________ | _______ |
| Authentication | [ ] Pass [ ] Fail | __________ | _______ |
| Core Business Logic | [ ] Pass [ ] Fail | __________ | _______ |
| File Upload/Download | [ ] Pass [ ] Fail | __________ | _______ |
| Email Notifications | [ ] Pass [ ] Fail | __________ | _______ |
| Scheduled Tasks | [ ] Pass [ ] Fail | __________ | _______ |
| Monitoring & Alerts | [ ] Pass [ ] Fail | __________ | _______ |
| Frontend Application | [ ] Pass [ ] Fail | __________ | _______ |

### Sign-Off

#### Development Team

- **Name:** _______________________________
- **Role:** _______________________________
- **Signature:** _______________________________
- **Date:** _______________________________

#### DevOps/Infrastructure Team

- **Name:** _______________________________
- **Role:** _______________________________
- **Signature:** _______________________________
- **Date:** _______________________________

#### Security Team

- **Name:** _______________________________
- **Role:** _______________________________
- **Signature:** _______________________________
- **Date:** _______________________________

#### Product Owner/Manager

- **Name:** _______________________________
- **Role:** _______________________________
- **Signature:** _______________________________
- **Date:** _______________________________

### Deployment Decision

**[ ] APPROVED FOR PRODUCTION**

**[ ] NOT APPROVED - Issues to Address:**

___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

### Rollback Plan

**Rollback Trigger Conditions:**
- [ ] Error rate > 1%
- [ ] API response time p95 > 2s
- [ ] Database connection failures
- [ ] Critical functionality broken

**Rollback Procedure:**

1. ___________________________________________________________
2. ___________________________________________________________
3. ___________________________________________________________

**Previous Version:** _______________________________
**Rollback Owner:** _______________________________
**Rollback Time Estimate:** _______________________________

### Post-Deployment Monitoring

**Monitoring Period:** First 24 hours critical, 72 hours extended

**Team On-Call:**
- **Primary:** _______________________ (Phone: _______________)
- **Secondary:** _______________________ (Phone: _______________)
- **Escalation:** _______________________ (Phone: _______________)

**Monitoring Dashboard:** _______________________________
**Incident Response Plan:** _______________________________

---

## Appendix A: Quick Reference Commands

### Environment Validation
```bash
node scripts/validate-production-env.js --env-file=.env.production
```

### Security Scan
```bash
./scripts/security-scan.sh
```

### Database Operations
```bash
# Migrations
pnpm prisma migrate deploy

# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240101.sql
```

### Health Checks
```bash
curl https://api.yourdomain.com/api/health
```

### View Logs
```bash
# Docker
docker logs -f compliant-backend

# Kubernetes
kubectl logs -f deployment/backend -n production
```

### SSL Certificate Check
```bash
echo | openssl s_client -servername api.yourdomain.com \
  -connect api.yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

---

## Appendix B: Emergency Contacts

### Production Support Team

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Lead Developer | __________ | __________ | __________ |
| DevOps Lead | __________ | __________ | __________ |
| Security Lead | __________ | __________ | __________ |
| Database Admin | __________ | __________ | __________ |
| Product Owner | __________ | __________ | __________ |

### External Support

| Service | Contact | Support URL |
|---------|---------|-------------|
| Cloud Provider | __________ | __________ |
| Email Service | __________ | __________ |
| Monitoring Service | __________ | __________ |
| CDN Provider | __________ | __________ |

### Escalation Path

1. **Level 1:** On-call developer (Response: 15 minutes)
2. **Level 2:** DevOps lead (Response: 30 minutes)
3. **Level 3:** CTO/Technical Director (Response: 1 hour)

---

**Document Version:** 1.0  
**Last Review Date:** ___________________  
**Next Review Date:** ___________________  
**Document Owner:** ___________________
