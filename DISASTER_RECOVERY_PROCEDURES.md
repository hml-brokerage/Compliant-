# Disaster Recovery Procedures

**Compliant Insurance Tracking Platform - Comprehensive DR Procedures**

Version: 1.0  
Last Updated: 2024  
RTO/RPO: API (1h/15min), Database (1h/5min)

---

## Table of Contents

1. [Overview](#overview)
2. [RTO/RPO Definitions](#rtorpo-definitions)
3. [Disaster Scenarios & Recovery](#disaster-scenarios--recovery)
   - [Scenario 1: Complete Infrastructure Failure](#scenario-1-complete-infrastructure-failure)
   - [Scenario 2: Database Corruption/Loss](#scenario-2-database-corruptionloss)
   - [Scenario 3: Security Breach](#scenario-3-security-breach)
   - [Scenario 4: Data Center Failure](#scenario-4-data-center-failure)
   - [Scenario 5: Application Crash](#scenario-5-application-crash)
4. [Communication Plans](#communication-plans)
5. [DR Testing Schedule](#dr-testing-schedule)
6. [Emergency Contact List](#emergency-contact-list)
7. [Recovery Runbooks](#recovery-runbooks)

---

## Overview

This document provides detailed disaster recovery procedures for the Compliant Insurance Tracking Platform. It defines recovery time objectives (RTO), recovery point objectives (RPO), and step-by-step procedures for recovering from various disaster scenarios.

### Disaster Recovery Goals

- **Minimize Downtime**: Restore services within defined RTO
- **Minimize Data Loss**: Keep data loss within RPO limits
- **Maintain Data Integrity**: Ensure no data corruption
- **Clear Communication**: Keep stakeholders informed
- **Document Everything**: Log all recovery actions

### DR Team Roles

| Role | Responsibilities | Primary | Backup |
|------|------------------|---------|--------|
| **Incident Commander** | Overall coordination, decisions | CTO | VP Engineering |
| **Technical Lead** | Technical recovery execution | Lead DevOps | Senior DevOps |
| **Database Admin** | Database recovery | DBA Lead | Senior DBA |
| **Security Lead** | Security incident response | CISO | Security Engineer |
| **Communications** | Stakeholder updates | Product Manager | Customer Success |
| **Documentation** | Log all actions | Operations Manager | DevOps Engineer |

---

## RTO/RPO Definitions

### Recovery Time Objective (RTO)

**Definition:** Maximum acceptable time to restore service after a disaster.

| Component | RTO | Justification |
|-----------|-----|---------------|
| **API Service** | 1 hour | Core functionality must be restored quickly |
| **Database** | 1 hour | Critical data access required |
| **Redis Cache** | 30 minutes | Can rebuild cache, non-critical |
| **File Storage** | 1 hour | Documents needed for operations |
| **Frontend Application** | 30 minutes | Quick deployment from CDN |
| **Email Service** | 2 hours | Can be delayed slightly |
| **Background Jobs** | 2 hours | Non-urgent processing |

### Recovery Point Objective (RPO)

**Definition:** Maximum acceptable data loss measured in time.

| Component | RPO | Backup Strategy |
|-----------|-----|----------------|
| **Database** | 5 minutes | Continuous backup + WAL archiving |
| **API Service** | 15 minutes | Stateless (no data loss) |
| **File Storage** | 1 hour | Continuous S3 replication |
| **Redis Cache** | Acceptable loss | Can be rebuilt from database |
| **Application Logs** | 1 minute | Centralized logging (CloudWatch/DataDog) |
| **Audit Logs** | 0 (no loss acceptable) | Immediate write to immutable storage |

### Disaster Classification

**Severity 1 (Critical):**
- Complete service outage
- Data center failure
- Security breach with data exposure
- Database corruption affecting all data

**Severity 2 (High):**
- Partial service outage (>50% users affected)
- Single region failure with failover available
- Database corruption affecting subset of data
- Application crashes affecting core functionality

**Severity 3 (Medium):**
- Minor service degradation
- Non-critical component failure
- Performance issues affecting user experience
- Background job failures

---

## Disaster Scenarios & Recovery

### Scenario 1: Complete Infrastructure Failure

**Description:** Entire infrastructure (application, database, cache) becomes unavailable due to cloud provider outage, network failure, or catastrophic event.

**RTO:** 2 hours  
**RPO:** 15 minutes  

#### Detection

**Symptoms:**
- All health checks failing
- No response from any endpoint
- Monitoring alerts firing across all services
- Users reporting complete inability to access platform

**Verification:**

\`\`\`bash
# Check if API is responding
curl -f https://api.yourdomain.com/api/health
# Expected if down: Connection refused or timeout

# Check from multiple locations
curl -f https://api.yourdomain.com/api/health --resolve api.yourdomain.com:443:1.2.3.4
# Test from monitoring service, different regions

# Verify it's not just DNS
nslookup api.yourdomain.com
dig api.yourdomain.com

# Check cloud provider status page
# AWS: https://status.aws.amazon.com/
# Azure: https://status.azure.com/
# GCP: https://status.cloud.google.com/
\`\`\`

#### Immediate Actions (First 5 Minutes)

1. **Declare Incident** (Incident Commander)
   ```bash
   # Log incident start time
   echo "INCIDENT START: $(date -Iseconds)" >> incident.log
   echo "TYPE: Complete Infrastructure Failure" >> incident.log
   echo "SEVERITY: 1 (Critical)" >> incident.log
   ```

2. **Assemble DR Team** (Incident Commander)
   - Page on-call personnel
   - Start conference bridge
   - Begin incident log

3. **Communication** (Communications Lead)
   ```bash
   # Post status page update
   curl -X POST https://api.statuspage.io/v1/pages/PAGE_ID/incidents \
     -H "Authorization: OAuth YOUR_TOKEN" \
     -d '{
       "incident": {
         "name": "Platform Unavailable",
         "status": "investigating",
         "impact_override": "critical",
         "body": "We are investigating a complete service outage."
       }
     }'
   ```

   - Update status page: "Investigating"
   - Send email to customers: "Service Disruption"
   - Post to social media if applicable

4. **Verify Scope** (Technical Lead)
   - Confirm all regions affected
   - Check if issue is internal or cloud provider
   - Verify backup systems status

#### Recovery Steps

**Option A: Primary Infrastructure Recovery** (If cause is fixable)

1. **Identify Root Cause** (Technical Lead + Cloud Provider)
   \`\`\`bash
   # Check cloud provider status
   aws health describe-events --filter eventTypeCategories=issue
   
   # Check recent deployments
   git log --since="2 hours ago" --oneline
   
   # Check infrastructure changes
   terraform show | grep modified
   \`\`\`

2. **Fix Infrastructure** (Based on cause)
   \`\`\`bash
   # If network issue
   aws ec2 describe-route-tables
   aws ec2 describe-security-groups
   
   # If compute issue
   aws ec2 describe-instances --filters "Name=tag:Environment,Values=production"
   
   # If database issue
   aws rds describe-db-instances --db-instance-identifier compliant-prod
   \`\`\`

3. **Restart Services in Order:**
   \`\`\`bash
   # 1. Database first
   aws rds start-db-instance --db-instance-identifier compliant-prod
   # Wait for available status
   aws rds wait db-instance-available --db-instance-identifier compliant-prod
   
   # 2. Redis
   aws elasticache reboot-cache-cluster --cache-cluster-id compliant-redis
   
   # 3. Application servers
   kubectl rollout restart deployment/backend -n production
   kubectl rollout status deployment/backend -n production
   
   # 4. Frontend
   kubectl rollout restart deployment/frontend -n production
   
   # 5. Background workers
   kubectl rollout restart deployment/workers -n production
   \`\`\`

4. **Verify Recovery:**
   \`\`\`bash
   # Health checks
   curl https://api.yourdomain.com/api/health
   
   # Test authentication
   curl -X POST https://api.yourdomain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   
   # Test database
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   
   # Test file storage
   aws s3 ls s3://compliant-production/
   
   # Check logs for errors
   kubectl logs -f deployment/backend -n production --tail=100
   \`\`\`

**Option B: Failover to DR Region** (If primary region unrecoverable)

1. **Initiate Failover** (Incident Commander approval required)
   \`\`\`bash
   # Update DNS to point to DR region
   # Using Route53
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456 \
     --change-batch '{
       "Changes": [{
         "Action": "UPSERT",
         "ResourceRecordSet": {
           "Name": "api.yourdomain.com",
           "Type": "A",
           "AliasTarget": {
             "HostedZoneId": "Z789012",
             "DNSName": "api-dr.us-west-2.elb.amazonaws.com",
             "EvaluateTargetHealth": false
           }
         }
       }]
     }'
   
   # Wait for DNS propagation (5-10 minutes)
   watch -n 10 'dig api.yourdomain.com'
   \`\`\`

2. **Start DR Services:**
   \`\`\`bash
   # DR Region: us-west-2 (if primary was us-east-1)
   export AWS_REGION=us-west-2
   
   # Promote read replica to primary
   aws rds promote-read-replica \
     --db-instance-identifier compliant-prod-replica-west
   
   # Start application in DR region
   kubectl config use-context dr-west-2
   kubectl scale deployment/backend --replicas=3 -n production
   kubectl scale deployment/frontend --replicas=2 -n production
   kubectl scale deployment/workers --replicas=2 -n production
   
   # Verify services
   kubectl get pods -n production
   kubectl logs -f deployment/backend -n production
   \`\`\`

3. **Data Verification:**
   \`\`\`bash
   # Connect to DR database
   psql $DR_DATABASE_URL -c "SELECT version();"
   
   # Verify data freshness
   psql $DR_DATABASE_URL -c "
     SELECT 
       MAX(created_at) as latest_user,
       MAX(updated_at) as latest_update
     FROM users;
   "
   # Should be within RPO (5 minutes)
   
   # Check replication lag
   psql $DR_DATABASE_URL -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"
   \`\`\`

4. **Enable DR Redis:**
   \`\`\`bash
   # Start Redis in DR region
   aws elasticache create-cache-cluster \
     --cache-cluster-id compliant-redis-dr \
     --engine redis \
     --cache-node-type cache.t3.medium \
     --num-cache-nodes 1
   
   # Update application config
   kubectl set env deployment/backend REDIS_URL=$DR_REDIS_URL -n production
   \`\`\`

5. **Full System Test:**
   \`\`\`bash
   # Run smoke tests
   cd tests/smoke
   npm run test:smoke
   
   # Or manual tests
   curl https://api.yourdomain.com/api/health
   curl https://api.yourdomain.com/api/projects -H "Authorization: Bearer $TOKEN"
   \`\`\`

#### Post-Recovery

1. **Data Loss Assessment:**
   \`\`\`bash
   # Compare last backup timestamp with current time
   BACKUP_TIME=$(aws rds describe-db-snapshots \
     --db-instance-identifier compliant-prod \
     --query 'DBSnapshots[0].SnapshotCreateTime' \
     --output text)
   
   echo "Backup time: $BACKUP_TIME"
   echo "Current time: $(date -Iseconds)"
   
   # Calculate data loss window
   # Should be within RPO (5 minutes for database)
   \`\`\`

2. **Verify Critical Data:**
   \`\`\`sql
   -- Check recent transactions
   SELECT COUNT(*), DATE_TRUNC('minute', created_at) 
   FROM audit_log 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY DATE_TRUNC('minute', created_at)
   ORDER BY 2 DESC;
   
   -- Verify no data corruption
   SELECT COUNT(*) FROM users WHERE email IS NULL;  -- Should be 0
   SELECT COUNT(*) FROM projects WHERE name IS NULL;  -- Should be 0
   \`\`\`

3. **Update Status:**
   ```bash
   # Mark incident as resolved
   curl -X PATCH https://api.statuspage.io/v1/pages/PAGE_ID/incidents/INCIDENT_ID \
     -H "Authorization: OAuth YOUR_TOKEN" \
     -d '{
       "incident": {
         "status": "resolved",
         "body": "All services have been restored. Root cause analysis will follow."
       }
     }'
   ```

4. **Monitor Closely:**
   - Watch error rates for next 4 hours
   - Monitor performance metrics
   - Check for any anomalies
   - Be ready to rollback if issues appear

#### Expected Timeline

| Phase | Duration | Total Elapsed |
|-------|----------|---------------|
| Detection & Initial Response | 5 min | 5 min |
| Assessment & Decision | 10 min | 15 min |
| DR Activation | 30 min | 45 min |
| Service Restoration | 45 min | 90 min |
| Verification & Testing | 20 min | 110 min |
| **Total RTO** | | **<2 hours** |

---

### Scenario 2: Database Corruption/Loss

**Description:** Database becomes corrupted or inaccessible, requiring restoration from backup.

**RTO:** 1 hour  
**RPO:** 5 minutes  

#### Detection

**Symptoms:**
- Database queries failing
- Data integrity errors
- Application errors: "relation does not exist"
- Unusual database behavior

**Verification:**

\`\`\`bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Check database status
aws rds describe-db-instances \
  --db-instance-identifier compliant-prod \
  --query 'DBInstances[0].DBInstanceStatus'

# Check for corruption
psql $DATABASE_URL -c "
  SELECT datname, pg_size_pretty(pg_database_size(datname))
  FROM pg_database
  WHERE datname = current_database();
"

# Check table integrity
psql $DATABASE_URL -c "
  SELECT tablename, n_live_tup, n_dead_tup
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC
  LIMIT 10;
"

# Look for error logs
aws rds download-db-log-file-portion \
  --db-instance-identifier compliant-prod \
  --log-file-name error/postgresql.log.2024-01-18
\`\`\`

#### Immediate Actions

1. **Stop Write Traffic** (Prevent further corruption)
   \`\`\`bash
   # Scale down application to read-only mode
   kubectl set env deployment/backend READ_ONLY_MODE=true -n production
   
   # Or completely stop writes
   kubectl scale deployment/backend --replicas=0 -n production
   
   # Update status page
   echo "Database maintenance in progress - read-only mode"
   \`\`\`

2. **Assess Damage:**
   \`\`\`sql
   -- Check affected tables
   SELECT schemaname, tablename, last_vacuum, last_analyze
   FROM pg_stat_user_tables
   WHERE n_dead_tup > 1000;
   
   -- Check for missing data
   SELECT COUNT(*) FROM critical_table;
   
   -- Verify foreign key constraints
   SELECT conname, conrelid::regclass AS table_name
   FROM pg_constraint
   WHERE contype = 'f' AND convalidated = false;
   \`\`\`

3. **Determine Recovery Method:**
   - **Minor corruption**: VACUUM FULL, REINDEX
   - **Table corruption**: Restore from snapshot
   - **Complete loss**: Full database restore

#### Recovery Steps

**Option A: Minor Corruption (VACUUM/REINDEX)**

\`\`\`bash
# Connect to database
psql $DATABASE_URL

# VACUUM affected tables
VACUUM FULL VERBOSE users;
VACUUM FULL VERBOSE projects;

# Reindex
REINDEX TABLE users;
REINDEX TABLE projects;

# Analyze for query planner
ANALYZE;

# Verify
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM projects;
\`\`\`

**Option B: Restore from Latest Snapshot**

\`\`\`bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier compliant-prod \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# Choose latest snapshot
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
  --db-instance-identifier compliant-prod \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text)

echo "Restoring from: $LATEST_SNAPSHOT"

# Create new instance from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier compliant-prod-restored \
  --db-snapshot-identifier $LATEST_SNAPSHOT \
  --db-instance-class db.t3.large \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name compliant-subnet-group \
  --publicly-accessible false

# Wait for restore to complete (10-30 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier compliant-prod-restored

# Get new endpoint
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier compliant-prod-restored \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "New database endpoint: $NEW_ENDPOINT"
\`\`\`

**Option C: Point-in-Time Recovery (PITR)**

\`\`\`bash
# Restore to 10 minutes before corruption
TARGET_TIME=$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S)

aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier compliant-prod \
  --target-db-instance-identifier compliant-prod-pitr \
  --restore-time $TARGET_TIME \
  --db-instance-class db.t3.large

# Wait for completion
aws rds wait db-instance-available \
  --db-instance-identifier compliant-prod-pitr
\`\`\`

#### Switchover to Restored Database

\`\`\`bash
# 1. Stop application
kubectl scale deployment/backend --replicas=0 -n production
kubectl scale deployment/workers --replicas=0 -n production

# 2. Verify restored database
psql postgresql://user:pass@$NEW_ENDPOINT:5432/compliant -c "SELECT version();"
psql postgresql://user:pass@$NEW_ENDPOINT:5432/compliant -c "SELECT COUNT(*) FROM users;"

# 3. Update application config
kubectl set env deployment/backend \
  DATABASE_URL=postgresql://user:pass@$NEW_ENDPOINT:5432/compliant -n production

# 4. Restart application
kubectl scale deployment/backend --replicas=3 -n production
kubectl scale deployment/workers --replicas=2 -n production

# 5. Verify application
kubectl logs -f deployment/backend -n production --tail=50
curl https://api.yourdomain.com/api/health
\`\`\`

#### Data Reconciliation

\`\`\`bash
# Compare old and new database
# Save old database endpoint for reference
OLD_DB=$DATABASE_URL
NEW_DB=postgresql://user:pass@$NEW_ENDPOINT:5432/compliant

# Compare row counts
psql $OLD_DB -c "SELECT COUNT(*) as old_count FROM users;" > /tmp/old_counts.txt
psql $NEW_DB -c "SELECT COUNT(*) as new_count FROM users;" > /tmp/new_counts.txt

# Identify missing data (created after snapshot)
psql $OLD_DB -c "
  SELECT id, email, created_at 
  FROM users 
  WHERE created_at > (SELECT MAX(created_at) FROM users_restored);
" > /tmp/missing_users.txt

# Manual data recovery may be needed for transactions in the gap
\`\`\`

#### Post-Recovery

1. **Decommission Old Database** (After verification period)
   \`\`\`bash
   # Take final snapshot for forensics
   aws rds create-db-snapshot \
     --db-instance-identifier compliant-prod \
     --db-snapshot-identifier compliant-prod-corrupted-final
   
   # Delete old instance
   aws rds delete-db-instance \
     --db-instance-identifier compliant-prod \
     --skip-final-snapshot
   
   # Rename restored instance
   aws rds modify-db-instance \
     --db-instance-identifier compliant-prod-restored \
     --new-db-instance-identifier compliant-prod \
     --apply-immediately
   \`\`\`

2. **Root Cause Analysis:**
   - Review database logs
   - Check for application bugs
   - Verify infrastructure issues
   - Document findings

---

### Scenario 3: Security Breach

**Description:** Unauthorized access detected, potential data breach.

**RTO:** Immediate containment, 2-4 hours for full recovery  
**RPO:** 0 (no data loss, but potential data exposure)  

#### Detection

**Indicators:**
- Suspicious login attempts
- Unauthorized API calls
- Unusual data access patterns
- Security alerts from monitoring
- User reports of unauthorized activity

**Verification:**

\`\`\`bash
# Check recent logins
psql $DATABASE_URL -c "
  SELECT user_id, ip_address, created_at, user_agent
  FROM audit_log
  WHERE event_type = 'login'
  AND created_at > NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC;
"

# Check for unusual API activity
kubectl logs deployment/backend -n production | grep -E "401|403|404" | tail -100

# Check for data exports
psql $DATABASE_URL -c "
  SELECT user_id, COUNT(*), MAX(created_at)
  FROM audit_log
  WHERE event_type IN ('data_export', 'bulk_read')
  AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 100;
"

# Check AWS CloudTrail for suspicious activity
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin \
  --max-results 50
\`\`\`

#### Immediate Containment (First 15 Minutes)

1. **Isolate Affected Systems:**
   \`\`\`bash
   # Block suspicious IP addresses
   aws ec2 authorize-security-group-ingress \
     --group-id sg-12345678 \
     --protocol tcp --port 443 \
     --cidr 0.0.0.0/0 --description "Block all temporarily"
   
   # Or use WAF
   aws wafv2 create-ip-set \
     --name BlockedIPs \
     --scope REGIONAL \
     --ip-address-version IPV4 \
     --addresses 1.2.3.4/32 5.6.7.8/32
   
   # Disable compromised user accounts
   psql $DATABASE_URL -c "
     UPDATE users 
     SET status = 'suspended', 
         updated_at = NOW(),
         suspension_reason = 'Security incident'
     WHERE id IN (SELECT DISTINCT user_id FROM suspicious_activity);
   "
   \`\`\`

2. **Revoke All Active Sessions:**
   \`\`\`bash
   # Flush Redis (invalidates all JWT tokens)
   redis-cli -u $REDIS_URL FLUSHDB
   
   # Confirm
   redis-cli -u $REDIS_URL DBSIZE
   # Should return 0
   
   # Force all users to re-authenticate
   echo "All users will need to log in again"
   \`\`\`

3. **Enable Enhanced Logging:**
   \`\`\`bash
   # Increase log level
   kubectl set env deployment/backend LOG_LEVEL=debug -n production
   
   # Enable audit logging for all actions
   kubectl set env deployment/backend AUDIT_ALL_REQUESTS=true -n production
   
   # Stream logs to security tool
   kubectl logs -f deployment/backend -n production | tee /var/log/security-incident.log
   \`\`\`

4. **Notify Authorities:**
   - Inform security team
   - Alert legal team
   - Prepare for potential breach disclosure
   - Contact law enforcement if warranted

#### Investigation (First Hour)

1. **Preserve Evidence:**
   \`\`\`bash
   # Take snapshots of all systems
   aws ec2 create-snapshot --volume-id vol-12345678 --description "Security incident evidence"
   aws rds create-db-snapshot --db-instance-identifier compliant-prod --db-snapshot-identifier security-incident-$(date +%Y%m%d)
   
   # Export all logs
   kubectl logs deployment/backend -n production --since=24h > /tmp/backend-logs-incident.txt
   kubectl logs deployment/frontend -n production --since=24h > /tmp/frontend-logs-incident.txt
   
   # Export audit logs
   psql $DATABASE_URL -c "\copy (SELECT * FROM audit_log WHERE created_at > NOW() - INTERVAL '24 hours') TO '/tmp/audit-logs-incident.csv' CSV HEADER"
   
   # Secure evidence
   tar czf evidence-$(date +%Y%m%d-%H%M%S).tar.gz /tmp/*incident*
   aws s3 cp evidence-*.tar.gz s3://compliant-security-evidence/ --sse AES256
   \`\`\`

2. **Determine Scope:**
   \`\`\`sql
   -- Identify affected users
   SELECT DISTINCT user_id, ip_address, user_agent, created_at
   FROM audit_log
   WHERE created_at BETWEEN $BREACH_START AND $BREACH_END
   ORDER BY created_at;
   
   -- Check what data was accessed
   SELECT table_name, COUNT(*) as access_count
   FROM audit_log
   WHERE user_id IN (SELECT user_id FROM compromised_accounts)
   AND created_at BETWEEN $BREACH_START AND $BREACH_END
   GROUP BY table_name;
   
   -- Check for data exfiltration
   SELECT user_id, endpoint, COUNT(*) as requests
   FROM audit_log
   WHERE event_type = 'read'
   AND created_at BETWEEN $BREACH_START AND $BREACH_END
   GROUP BY user_id, endpoint
   HAVING COUNT(*) > 1000;
   \`\`\`

3. **Identify Attack Vector:**
   - SQL injection?
   - Stolen credentials?
   - API vulnerability?
   - Social engineering?
   - Insider threat?

#### Remediation

1. **Patch Vulnerability:**
   \`\`\`bash
   # If application vulnerability
   git checkout develop
   git pull origin develop
   # Apply security patch
   git commit -m "Security patch for vulnerability XYZ"
   git push origin develop
   
   # Deploy hotfix
   ./scripts/hotfix-deploy.sh
   
   # Verify fix
   npm run test:security
   \`\`\`

2. **Rotate All Secrets:**
   \`\`\`bash
   # Generate new secrets
   NEW_JWT_SECRET=$(openssl rand -base64 32)
   NEW_DB_PASSWORD=$(openssl rand -base64 32)
   NEW_ENCRYPTION_KEY=$(openssl rand -base64 32)
   
   # Update in secrets manager
   aws secretsmanager put-secret-value \
     --secret-id compliant/production/jwt-secret \
     --secret-string "$NEW_JWT_SECRET"
   
   aws secretsmanager put-secret-value \
     --secret-id compliant/production/db-password \
     --secret-string "$NEW_DB_PASSWORD"
   
   # Update database password
   psql $DATABASE_URL -c "ALTER USER compliant_app WITH PASSWORD '$NEW_DB_PASSWORD';"
   
   # Update Kubernetes secrets
   kubectl create secret generic compliant-secrets \
     --from-literal=jwt-secret=$NEW_JWT_SECRET \
     --from-literal=db-password=$NEW_DB_PASSWORD \
     --dry-run=client -o yaml | kubectl apply -f - -n production
   
   # Restart application to use new secrets
   kubectl rollout restart deployment/backend -n production
   \`\`\`

3. **Strengthen Security:**
   \`\`\`bash
   # Enable MFA for all admin accounts
   # Implement IP whitelisting
   # Add rate limiting
   # Enable additional monitoring
   
   # Update security group rules
   aws ec2 authorize-security-group-ingress \
     --group-id sg-12345678 \
     --protocol tcp --port 443 \
     --source-group sg-87654321  # Only allow from approved sources
   
   # Enable AWS GuardDuty if not already
   aws guardduty create-detector --enable
   \`\`\`

#### User Notification

\`\`\`bash
# Send breach notification email (if required by law)
# Template:

cat > breach-notification.txt << 'EOF'
Subject: Important Security Notice

Dear Valued Customer,

We are writing to inform you of a security incident that may have affected your account...

What Happened:
[Brief description]

What Information Was Involved:
[List of data types]

What We Are Doing:
- All systems have been secured
- We have rotated all security credentials
- Enhanced monitoring has been implemented
- Law enforcement has been notified

What You Should Do:
1. Change your password immediately
2. Enable two-factor authentication
3. Review your account activity
4. Monitor for suspicious activity

We take your privacy seriously...

Sincerely,
Compliant Security Team
EOF

# Send via email service
# python scripts/send-breach-notification.py --template breach-notification.txt
\`\`\`

#### Post-Incident

1. **Full Security Audit:**
   - Review all access controls
   - Audit all user permissions
   - Review code for vulnerabilities
   - Penetration testing
   - Security training for team

2. **Compliance:**
   - Document incident for compliance (GDPR, HIPAA, etc.)
   - File required breach notifications
   - Prepare for potential audits

3. **Lessons Learned:**
   - Conduct post-mortem
   - Update security procedures
   - Implement additional safeguards
   - Train team on new procedures

---

### Scenario 4: Data Center Failure

**Description:** Entire data center or availability zone becomes unavailable.

**RTO:** 1 hour (with multi-AZ/region setup)  
**RPO:** 5 minutes (with replication)  

#### Detection

\`\`\`bash
# Check availability zones
aws ec2 describe-availability-zones --region us-east-1

# Check instance status
aws ec2 describe-instance-status \
  --instance-ids $(aws ec2 describe-instances \
    --filters "Name=tag:Environment,Values=production" \
    --query 'Reservations[*].Instances[*].InstanceId' \
    --output text)

# Check RDS status
aws rds describe-db-instances \
  --query 'DBInstances[*].[DBInstanceIdentifier,AvailabilityZone,DBInstanceStatus]'
\`\`\`

#### Immediate Actions

1. **Verify Multi-AZ is Working:**
   \`\`\`bash
   # RDS should auto-failover to standby
   aws rds describe-db-instances \
     --db-instance-identifier compliant-prod \
     --query 'DBInstances[0].MultiAZ'
   # Should be true
   
   # Check if failover occurred
   aws rds describe-events \
     --source-identifier compliant-prod \
     --source-type db-instance \
     --duration 60
   \`\`\`

2. **Failover Application to Different AZ:**
   \`\`\`bash
   # Kubernetes should auto-reschedule pods
   kubectl get pods -n production -o wide
   # Check which AZ pods are in
   
   # If manual intervention needed
   kubectl drain node-in-failed-az --ignore-daemonsets --delete-emptydir-data
   kubectl get pods -n production  # Should be rescheduled
   \`\`\`

#### Recovery

Usually automatic with proper multi-AZ setup. Manual steps if needed:

\`\`\`bash
# Force reschedule pods
kubectl delete pods -n production -l app=backend

# Verify new pods are in different AZ
kubectl get pods -n production -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,AZ:.spec.nodeSelector

# Update load balancer if needed
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --health-check-enabled
\`\`\`

---

### Scenario 5: Application Crash

**Description:** Application repeatedly crashing, unable to start.

**RTO:** 30 minutes  
**RPO:** None (stateless application)  

#### Detection

\`\`\`bash
# Check pod status
kubectl get pods -n production
# STATUS: CrashLoopBackOff

# Check recent logs
kubectl logs deployment/backend -n production --tail=100

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'
\`\`\`

#### Diagnosis

\`\`\`bash
# View detailed logs
kubectl logs deployment/backend -n production --previous

# Check resource usage
kubectl top pods -n production

# Describe pod for more details
kubectl describe pod backend-xxxxx-yyyyy -n production

# Common issues:
# - OOM (Out of Memory)
# - Missing environment variables
# - Database connection failure
# - Dependency unavailable
\`\`\`

#### Recovery

**Option A: Rollback to Previous Version**

\`\`\`bash
# Check deployment history
kubectl rollout history deployment/backend -n production

# Rollback to previous version
kubectl rollout undo deployment/backend -n production

# Or rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=5 -n production

# Monitor rollout
kubectl rollout status deployment/backend -n production

# Verify
curl https://api.yourdomain.com/api/health
\`\`\`

**Option B: Fix and Redeploy**

\`\`\`bash
# If missing environment variable
kubectl set env deployment/backend MISSING_VAR=value -n production

# If resource limits too low
kubectl set resources deployment/backend \
  --limits=cpu=2000m,memory=4Gi \
  --requests=cpu=1000m,memory=2Gi \
  -n production

# If configuration issue
kubectl edit configmap backend-config -n production
kubectl rollout restart deployment/backend -n production
\`\`\`

**Option C: Emergency Hotfix**

\`\`\`bash
# Build and deploy hotfix
git checkout main
git pull origin main
# Make fix
git commit -m "Hotfix: resolve application crash"
git tag v1.2.3-hotfix1
git push origin v1.2.3-hotfix1

# Build image
docker build -t compliant-backend:v1.2.3-hotfix1 .
docker push compliant-backend:v1.2.3-hotfix1

# Deploy
kubectl set image deployment/backend \
  backend=compliant-backend:v1.2.3-hotfix1 \
  -n production

# Monitor
kubectl rollout status deployment/backend -n production
\`\`\`

---

## Communication Plans

### Internal Communication

**Incident Start:**

\`\`\`
To: Engineering Team, Management
Subject: [P1 INCIDENT] Platform Outage - $(date)

INCIDENT: Complete Infrastructure Failure
SEVERITY: P1 (Critical)
STARTED: $(date -Iseconds)
STATUS: Investigating

IMPACT: All users unable to access platform

ACTIONS:
- DR team assembled
- Investigation in progress
- Status page updated

BRIDGE: https://zoom.us/j/emergency
SLACK: #incident-$(date +%Y%m%d)

Updates every 15 minutes.
\`\`\`

**Incident Updates (Every 15-30 minutes):**

\`\`\`
UPDATE $(date +%H:%M):
- Identified root cause: [description]
- Started recovery procedure
- ETA for resolution: [time]
\`\`\`

**Incident Resolution:**

\`\`\`
RESOLVED $(date -Iseconds)

INCIDENT: Complete Infrastructure Failure
DURATION: [X hours Y minutes]
RESOLUTION: [Brief description]

DATA LOSS: [Within RPO / None]
IMPACT: [Number of users affected]

POST-MORTEM: Scheduled for [date/time]

All systems operational.
\`\`\`

### External Communication

**Status Page Updates:**

1. **Investigating** (First 5 minutes)
   ```
   We are investigating reports of service unavailability.
   Updates will be posted as they become available.
   ```

2. **Identified** (After diagnosis)
   ```
   We have identified the issue and are working on a resolution.
   Expected resolution time: [time]
   ```

3. **Monitoring** (After fix)
   ```
   The issue has been resolved and services are being restored.
   We are monitoring the situation.
   ```

4. **Resolved** (Full recovery)
   ```
   All services have been fully restored.
   We apologize for any inconvenience.
   A full incident report will be provided within 48 hours.
   ```

### Customer Notification Templates

**Email Template:**

\`\`\`
Subject: Service Disruption Update - Compliant Platform

Dear Valued Customer,

We experienced a service disruption today affecting access to the Compliant platform.

TIMELINE:
- Incident Start: [time]
- Issue Identified: [time]
- Service Restored: [time]
- Total Downtime: [duration]

CAUSE:
[Brief, non-technical explanation]

IMPACT:
- You may have been unable to access the platform
- No data was lost
- All data remains secure

RESOLUTION:
[What was done to fix it]

PREVENTION:
[What we're doing to prevent future occurrences]

We apologize for any inconvenience this may have caused. If you have any questions or concerns, please contact our support team.

Sincerely,
Compliant Team
\`\`\`

---

## DR Testing Schedule

### Monthly Tests

**First Monday of each month:**

1. **Database Backup Verification** (30 minutes)
   \`\`\`bash
   # Restore latest backup to test environment
   ./scripts/test-database-restore.sh
   
   # Verify data integrity
   ./scripts/verify-backup-integrity.sh
   
   # Document results
   echo "$(date): Monthly backup test - PASS" >> dr-test-log.txt
   \`\`\`

2. **Application Deployment Test** (15 minutes)
   - Deploy to staging from scratch
   - Verify all services start correctly
   - Run smoke tests

### Quarterly Tests

**First week of each quarter:**

1. **Full DR Failover Test** (2-4 hours)
   - Simulate complete primary region failure
   - Failover to DR region
   - Run full test suite
   - Measure actual RTO/RPO
   - Document lessons learned

2. **Security Incident Simulation** (2 hours)
   - Tabletop exercise with team
   - Practice communication procedures
   - Review and update runbooks

### Annual Tests

**Once per year:**

1. **Complete Disaster Simulation** (Full day)
   - Unannounced DR drill
   - Test all disaster scenarios
   - Involve all stakeholders
   - External audit participation
   - Comprehensive report

2. **DR Plan Review and Update**
   - Review all procedures
   - Update contact information
   - Verify all documentation current
   - Test all escalation paths
   - Update RTO/RPO if needed

### Test Documentation Template

\`\`\`
DR TEST REPORT

Date: ___________________
Test Type: [ ] Monthly [ ] Quarterly [ ] Annual
Scenario: ___________________
Led by: ___________________

OBJECTIVES:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

RESULTS:
[ ] PASS [ ] FAIL [ ] PARTIAL

TIMELINE:
- Test Start: _________
- Issue Detected: _________
- Recovery Complete: _________
- Test End: _________
- **Actual RTO: _________** (Target: _________)
- **Actual RPO: _________** (Target: _________)

ISSUES FOUND:
1. Issue: _________________________________
   Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
   Action: _________________________________

2. Issue: _________________________________
   Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
   Action: _________________________________

IMPROVEMENTS IDENTIFIED:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

ACTION ITEMS:
- [ ] Update DR procedures (Owner: ______, Due: ______)
- [ ] Fix issue #1 (Owner: ______, Due: ______)
- [ ] Schedule training (Owner: ______, Due: ______)

PARTICIPANTS:
- __________________ (Role: _____________)
- __________________ (Role: _____________)
- __________________ (Role: _____________)

SIGN-OFF:
DR Manager: ______________________ Date: ______
IT Director: ______________________ Date: ______
\`\`\`

---

## Emergency Contact List

### On-Call Rotation

| Week | Primary On-Call | Secondary On-Call | Escalation |
|------|----------------|-------------------|------------|
| Week 1 | John Doe (555-0101) | Jane Smith (555-0102) | CTO (555-0100) |
| Week 2 | Jane Smith (555-0102) | Bob Johnson (555-0103) | CTO (555-0100) |
| Week 3 | Bob Johnson (555-0103) | Alice Williams (555-0104) | CTO (555-0100) |
| Week 4 | Alice Williams (555-0104) | John Doe (555-0101) | CTO (555-0100) |

### Key Personnel

| Role | Name | Phone | Email | Backup |
|------|------|-------|-------|--------|
| **Incident Commander** | [CTO Name] | 555-0100 | cto@company.com | 555-0199 |
| **Technical Lead** | [DevOps Lead] | 555-0110 | devops@company.com | 555-0111 |
| **Database Admin** | [DBA Name] | 555-0120 | dba@company.com | 555-0121 |
| **Security Lead** | [CISO Name] | 555-0130 | security@company.com | 555-0131 |
| **Communications** | [PM Name] | 555-0140 | pm@company.com | 555-0141 |
| **Legal** | [General Counsel] | 555-0150 | legal@company.com | 555-0151 |

### External Contacts

| Service | Contact | Phone | Email | Account # |
|---------|---------|-------|-------|-----------|
| **AWS Support** | Premium Support | 1-800-AWS-SUPPORT | aws@company.com | 123456789 |
| **Database Vendor** | PostgreSQL Support | 1-800-POSTGRES | db@company.com | PG-12345 |
| **Monitoring Service** | DataDog | 1-866-329-4466 | support@datadoghq.com | DD-67890 |
| **CDN Provider** | Cloudflare | 1-888-993-5273 | support@cloudflare.com | CF-11111 |
| **Email Provider** | SendGrid | 1-877-SENDGRID | support@sendgrid.com | SG-22222 |

### Escalation Path

**Level 1:** On-call engineer (Response: 15 minutes)  
**Level 2:** Technical lead (Response: 30 minutes)  
**Level 3:** Incident commander/CTO (Response: 1 hour)  
**Level 4:** CEO (Critical incidents only)  

---

## Recovery Runbooks

### Runbook Template

Each recovery procedure should follow this template:

\`\`\`markdown
# [Procedure Name]

## Overview
Brief description of when to use this procedure.

## Prerequisites
- Access credentials required
- Tools needed
- Knowledge required

## Estimated Time
[X] minutes/hours

## Steps

### 1. [Step Name]
Detailed instructions...

\`\`\`bash
# Commands to run
\`\`\`

**Expected Output:**
\`\`\`
Output that indicates success
\`\`\`

**If it fails:**
- Troubleshooting step 1
- Troubleshooting step 2

### 2. [Next Step]
...

## Verification
How to confirm procedure completed successfully.

## Rollback
How to undo if needed.

## Notes
Additional context or gotchas.
\`\`\`

### Quick Reference: Common Commands

\`\`\`bash
# Check system status
kubectl get pods -n production
kubectl get services -n production
aws rds describe-db-instances
aws elasticache describe-cache-clusters

# View logs
kubectl logs -f deployment/backend -n production --tail=100
aws logs tail /aws/lambda/function-name --follow

# Restart services
kubectl rollout restart deployment/backend -n production
aws ecs update-service --service backend --force-new-deployment

# Database operations
psql $DATABASE_URL -c "SELECT version();"
aws rds reboot-db-instance --db-instance-identifier compliant-prod

# Secrets management
aws secretsmanager get-secret-value --secret-id compliant/production/jwt-secret
kubectl get secrets -n production

# Monitoring
curl https://api.yourdomain.com/api/health
aws cloudwatch get-metric-statistics --metric-name CPUUtilization

# DNS
dig api.yourdomain.com
nslookup api.yourdomain.com

# Network
traceroute api.yourdomain.com
curl -I https://api.yourdomain.com
\`\`\`

---

## Appendix A: DR Checklist

### Pre-Disaster Preparation

- [ ] DR plan documented and up-to-date
- [ ] All team members trained on procedures
- [ ] Contact lists current
- [ ] Backup systems tested monthly
- [ ] Multi-AZ/region deployment configured
- [ ] Automated failover tested
- [ ] Monitoring and alerting configured
- [ ] Status page ready
- [ ] Communication templates prepared
- [ ] Legal/compliance requirements understood

### During Disaster

- [ ] Incident declared
- [ ] Team assembled
- [ ] Communication started
- [ ] Status page updated
- [ ] Root cause identified
- [ ] Recovery initiated
- [ ] Actions documented
- [ ] Stakeholders informed

### After Recovery

- [ ] Services verified
- [ ] Data integrity checked
- [ ] Performance monitored
- [ ] Status page updated (resolved)
- [ ] Customers notified
- [ ] Post-mortem scheduled
- [ ] Lessons learned documented
- [ ] Procedures updated

---

## Appendix B: Post-Mortem Template

\`\`\`markdown
# Post-Mortem: [Incident Name]

**Date of Incident:** [Date]  
**Date of Post-Mortem:** [Date]  
**Attendees:** [List]  

## Executive Summary

Brief overview of what happened and impact.

## Timeline

| Time | Event |
|------|-------|
| HH:MM | Incident detected |
| HH:MM | Team assembled |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Service restored |
| HH:MM | Incident closed |

## Impact

- **Duration:** [X hours Y minutes]
- **Users Affected:** [Number/Percentage]
- **Data Loss:** [None / Within RPO]
- **Revenue Impact:** [$X estimated]

## Root Cause

Detailed explanation of what caused the incident.

## Detection

How was the incident detected? Could it have been detected sooner?

## Resolution

What steps were taken to resolve the incident?

## What Went Well

- [Thing 1]
- [Thing 2]

## What Didn't Go Well

- [Thing 1]
- [Thing 2]

## Lessons Learned

1. [Lesson 1]
2. [Lesson 2]

## Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action 1] | [Name] | [Date] | [ ] |
| [Action 2] | [Name] | [Date] | [ ] |

## Prevention

What can we do to prevent this from happening again?

1. [Prevention measure 1]
2. [Prevention measure 2]
\`\`\`

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Next Review:** April 2024  
**Document Owner:** DevOps/Infrastructure Team

---

**Emergency Hotline:** 1-800-XXX-XXXX  
**DR Email:** dr-team@yourdomain.com  
**Status Page:** https://status.yourdomain.com
