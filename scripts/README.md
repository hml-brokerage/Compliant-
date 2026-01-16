# Security Scan Script

This script performs security audits on the Compliant Platform codebase before deployment.

## Usage

```bash
# Run security scan
./scripts/security-scan.sh
```

## What It Checks

1. **NPM Audit**: Scans all packages (backend, frontend, shared) for high and critical vulnerabilities
2. **Hardcoded Secrets**: Searches for potential hardcoded passwords, API keys, and tokens
3. **Environment Files**: Verifies that .env.example files exist

## Exit Codes

- `0`: All security checks passed
- `1`: Security vulnerabilities found or checks failed

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run Security Scan
  run: |
    chmod +x scripts/security-scan.sh
    ./scripts/security-scan.sh
```

## Requirements

- `pnpm`: Package manager
- `jq` (optional): For better audit output formatting

## Bug Fixes

### v1.1 - Fixed AUDIT_FAILED Flag Bug

**Issue**: When audit failures occurred, the global `FAILED` flag was not being set, allowing deployments with vulnerabilities to proceed.

**Fix**: Updated `run_audit()` function to directly set `FAILED=1` when package audits fail.

```bash
# Fixed implementation:
if ! pnpm audit --audit-level=high --json > /tmp/audit-${package_name}.json 2>&1; then
    echo -e "${RED}✗ Security vulnerabilities found in ${package_name}${NC}"
    # FIX: Set global FAILED flag when audit fails
    FAILED=1
fi
```

This ensures that when any package has audit failures, the script properly exits with code 1, preventing insecure code from being deployed.

## Testing

Test the script locally:

```bash
# Should pass on clean codebase
./scripts/security-scan.sh
echo $? # Should be 0

# Test failure scenario by temporarily adding a vulnerable package
cd packages/backend
pnpm add old-vulnerable-package@1.0.0
cd ../..
./scripts/security-scan.sh
echo $? # Should be 1
```
