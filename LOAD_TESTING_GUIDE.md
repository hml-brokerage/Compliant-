# Load Testing Guide

**Compliant Insurance Tracking Platform - Comprehensive Load Testing Guide**

Version: 1.0  
Last Updated: January 2024  
Performance Target: p95 < 500ms, p99 < 1s

---

## Table of Contents

1. [Overview](#overview)
2. [K6 Installation & Setup](#k6-installation--setup)
3. [Test Infrastructure Requirements](#test-infrastructure-requirements)
4. [Test Scenarios](#test-scenarios)
5. [Performance Baselines & Thresholds](#performance-baselines--thresholds)
6. [Infrastructure Sizing Recommendations](#infrastructure-sizing-recommendations)
7. [Troubleshooting Performance Issues](#troubleshooting-performance-issues)
8. [Results Reporting Template](#results-reporting-template)

---

## Overview

This guide provides comprehensive load testing procedures for the Compliant Insurance Tracking Platform using K6, an open-source load testing tool.

### Performance Goals

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time (p50) | < 200ms | < 300ms |
| API Response Time (p95) | < 500ms | < 750ms |
| API Response Time (p99) | < 1000ms | < 1500ms |
| Error Rate | < 0.1% | < 1% |
| Throughput | ≥ 500 req/s | ≥ 300 req/s |
| Concurrent Users | ≥ 200 | ≥ 100 |

### Why Load Testing?

- **Validate Performance**: Ensure system meets SLA requirements
- **Identify Bottlenecks**: Find performance issues before production
- **Capacity Planning**: Determine infrastructure requirements
- **Prevent Outages**: Avoid performance-related failures
- **Build Confidence**: Demonstrate production readiness

---

## K6 Installation & Setup

### Installation Options

#### Option 1: Package Manager (Recommended)

**macOS (Homebrew):**
```bash
brew install k6
```

**Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Option 2: Docker

```bash
# Pull K6 image
docker pull grafana/k6:latest

# Run K6 test
docker run --rm -v $(pwd):/scripts grafana/k6:latest run /scripts/test.js
```

### Verify Installation

```bash
k6 version
# Expected output: k6 v0.48.0 (or newer)
```

### Project Setup

```bash
# Create load testing directory
mkdir -p tests/load
cd tests/load
```

### Environment Configuration

Create a `.env.load-test` file:

```bash
# API Configuration
API_BASE_URL=https://api-staging.yourdomain.com

# Test User Credentials
TEST_EMAIL=loadtest@example.com
TEST_PASSWORD=LoadTest123!@#

# Performance Targets
TARGET_RPS=500
MAX_DURATION=30m
WARM_UP_DURATION=30s

# Thresholds
MAX_P95_MS=500
MAX_P99_MS=1000
MAX_ERROR_RATE=0.001
```

---

## Test Infrastructure Requirements

### Test Environment

**Staging Environment:**
- Mirror of production infrastructure
- Isolated from production data
- Dedicated test database
- Separate Redis instance

**Load Generator:**
- Separate server from application
- CPU: 4+ cores
- RAM: 8GB+ minimum
- Network: High bandwidth, low latency

### Network Considerations

```bash
# Test network connectivity
ping api-staging.yourdomain.com

# Test latency
curl -w "@curl-format.txt" -o /dev/null -s https://api-staging.yourdomain.com/api/health
```

---

## Test Scenarios

### Scenario 1: Normal Load Test

**Objective:** Validate system performance under expected normal traffic.

**Test Parameters:**
- Virtual Users (VUs): 50 concurrent
- Duration: 5 minutes
- Ramp-up: 30 seconds

**File:** `tests/load/normal-load.js`

```javascript
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.API_BASE_URL || 'https://api-staging.yourdomain.com';

// Custom metrics
const loginDuration = new Trend('login_duration');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up to 50 users
    { duration: '4m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.001'],
  },
};

export function setup() {
  console.log('Starting Normal Load Test');
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  return { startTime: new Date().toISOString() };
}

export default function() {
  // Authentication
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'loadtest@example.com',
    password: __ENV.TEST_PASSWORD || 'LoadTest123!@#',
  });

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'got access token': (r) => r.json('access_token') !== undefined,
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return;
  }

  const token = loginRes.json('access_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Get user profile
  const profileRes = http.get(`${BASE_URL}/api/auth/profile`, { headers });
  check(profileRes, {
    'profile retrieved': (r) => r.status === 200,
  }) || errorRate.add(1);

  // List projects
  const projectsRes = http.get(`${BASE_URL}/api/projects`, { headers });
  check(projectsRes, {
    'projects listed': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Create project
  const projectPayload = JSON.stringify({
    name: `Load Test Project ${Date.now()}`,
    address: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    zip: '12345',
    clientName: 'Test Client',
  });

  const createRes = http.post(
    `${BASE_URL}/api/projects`,
    projectPayload,
    { headers }
  );

  check(createRes, {
    'project created': (r) => r.status === 201,
  }) || errorRate.add(1);

  // Think time
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

export function teardown(data) {
  console.log('Normal Load Test completed');
  console.log(`Started at: ${data.startTime}`);
}
```

**Run the test:**

```bash
k6 run tests/load/normal-load.js
k6 run --out json=results/normal-load.json tests/load/normal-load.js
```

**Success Criteria:**
- ✅ Error rate < 0.1%
- ✅ p95 < 500ms
- ✅ p99 < 1000ms
- ✅ No 5xx errors
- ✅ Memory stable
- ✅ CPU < 70%

---

### Scenario 2: Peak Load Test

**Objective:** Validate performance under peak traffic.

**Test Parameters:**
- Virtual Users: 200 concurrent
- Duration: 10 minutes
- Gradual ramp-up

**File:** `tests/load/peak-load.js`

```javascript
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.API_BASE_URL || 'https://api-staging.yourdomain.com';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },    // Peak
    { duration: '4m', target: 200 },    // Maintain peak
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<750', 'p(99)<1500'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function() {
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'loadtest@example.com',
    password: __ENV.TEST_PASSWORD || 'LoadTest123!@#',
  });

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    return;
  }

  const token = loginRes.json('access_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Mix of operations
  const operations = ['projects', 'contractors', 'coi', 'documents'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  http.get(`${BASE_URL}/api/${operation}`, { headers });

  sleep(Math.random() * 2 + 1);
}
```

---

### Scenario 3: Stress Test

**Objective:** Find the system's breaking point.

**Test Parameters:**
- Start: 50 VUs
- Increment: +50 VUs every 2 minutes
- Continue until error rate > 10%

**File:** `tests/load/stress-test.js`

```javascript
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.API_BASE_URL || 'https://api-staging.yourdomain.com';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 150 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 250 },
    { duration: '2m', target: 300 },
    { duration: '2m', target: 350 },
    { duration: '2m', target: 400 },
    { duration: '2m', target: 450 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(50)<5000'],
    'http_req_failed': ['rate<0.5'],
  },
};

export default function() {
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'loadtest@example.com',
    password: __ENV.TEST_PASSWORD || 'LoadTest123!@#',
  });

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    console.log(`Login failed at ${__VU} VUs`);
    return;
  }

  const token = loginRes.json('access_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  const healthRes = http.get(`${BASE_URL}/api/health`, { headers });
  
  if (healthRes.status !== 200) {
    console.log(`Health check failed at ${__VU} VUs`);
  }

  sleep(1);
}
```

---

### Scenario 4: Spike Test

**Objective:** Test sudden traffic spikes.

**Test Parameters:**
- Baseline: 20 VUs
- Spike to: 200 VUs instantly
- Duration: 30 seconds

**File:** `tests/load/spike-test.js`

```javascript
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.API_BASE_URL || 'https://api-staging.yourdomain.com';

export const options = {
  stages: [
    { duration: '2m', target: 20 },     // Baseline
    { duration: '0s', target: 200 },    // Instant spike!
    { duration: '30s', target: 200 },   // Hold spike
    { duration: '0s', target: 20 },     // Drop
    { duration: '2m', target: 20 },     // Recovery
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
  },
};

export default function() {
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'loadtest@example.com',
    password: __ENV.TEST_PASSWORD || 'LoadTest123!@#',
  });

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    return;
  }

  const token = loginRes.json('access_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  http.get(`${BASE_URL}/api/health`, { headers });
  http.get(`${BASE_URL}/api/projects`, { headers });

  sleep(Math.random() * 2 + 1);
}
```

---

### Scenario 5: Soak Test

**Objective:** Detect memory leaks over extended periods.

**Test Parameters:**
- VUs: 100 concurrent (constant)
- Duration: 2-4 hours
- All API endpoints

**File:** `tests/load/soak-test.js`

```javascript
import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.API_BASE_URL || 'https://api-staging.yourdomain.com';

export const options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '2h', target: 100 },    // Soak for 2 hours
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.001'],
  },
};

const operations = ['auth', 'projects', 'contractors', 'coi', 'documents'];

export default function() {
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'loadtest@example.com',
    password: __ENV.TEST_PASSWORD || 'LoadTest123!@#',
  });

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    return;
  }

  const token = loginRes.json('access_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Random operation
  const op = operations[Math.floor(Math.random() * operations.length)];

  if (op === 'auth') {
    http.get(`${BASE_URL}/api/auth/profile`, { headers });
  } else if (op === 'projects') {
    http.get(`${BASE_URL}/api/projects`, { headers });
    
    // Occasionally create
    if (Math.random() < 0.1) {
      const payload = JSON.stringify({
        name: `Soak Test ${Date.now()}`,
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip: '90210',
        clientName: 'Test Client',
      });
      http.post(`${BASE_URL}/api/projects`, payload, { headers });
    }
  } else {
    http.get(`${BASE_URL}/api/${op}`, { headers });
  }

  sleep(Math.random() * 5 + 2); // 2-7 seconds
}
```

---

## Performance Baselines & Thresholds

### Response Time Targets

| Endpoint Category | p50 | p95 | p99 |
|-------------------|-----|-----|-----|
| Health Check | 20ms | 50ms | 100ms |
| Authentication | 150ms | 300ms | 500ms |
| List Operations | 100ms | 200ms | 400ms |
| Create Operations | 200ms | 400ms | 800ms |
| File Upload | 500ms | 1500ms | 3000ms |
| PDF Generation | 800ms | 2000ms | 4000ms |

### Throughput Targets

| Metric | Minimum | Target | Peak |
|--------|---------|--------|------|
| Requests/sec | 300 | 500 | 800 |
| Auth Requests/sec | 50 | 80 | 120 |
| Read Operations/sec | 200 | 350 | 600 |
| Write Operations/sec | 50 | 70 | 80 |

### Resource Limits

**Application Server:**
- CPU: < 70% average
- Memory: < 80% allocated
- Connections: < 1000

**Database:**
- CPU: < 70%
- Memory: < 85%
- Connections: < 100
- Query p95: < 100ms

**Redis:**
- Memory: < 75%
- CPU: < 50%
- Hit rate: > 80%

---

## Infrastructure Sizing Recommendations

### Baseline (100 users)

**Application:**
- Instances: 2
- CPU: 2 vCPU each
- Memory: 4GB each

**Database:**
- Type: db.t3.medium
- CPU: 2 vCPU
- Memory: 4GB
- Storage: 100GB SSD

**Redis:**
- Type: cache.t3.medium
- Memory: 4GB

**Cost:** ~$180/month (AWS)

### Scaling (200 users)

**Application:**
- Instances: 3-4
- CPU: 2 vCPU each
- Memory: 4-8GB each

**Database:**
- Type: db.t3.large
- Memory: 8GB
- Read replicas: Consider

**Cost:** ~$300-400/month

### Enterprise (500+ users)

**Application:**
- Instances: 6-10
- CPU: 4 vCPU each
- Memory: 8GB each
- Auto-scaling enabled

**Database:**
- Type: db.r5.xlarge
- CPU: 4 vCPU
- Memory: 32GB
- Read replicas: 2

**Redis:**
- Type: cache.r5.large
- Memory: 13GB
- Multi-AZ replication

**Cost:** ~$1200-2000/month

### Auto-Scaling Rules

**Scale Up:**
- CPU > 70% for 5 min
- Memory > 80% for 5 min
- Latency p95 > 1s for 5 min

**Scale Down:**
- CPU < 30% for 15 min
- Memory < 50% for 15 min
- Latency p95 < 300ms for 15 min

**Limits:**
- Min instances: 2
- Max instances: 20
- Cool-down: 5 minutes

---

## Troubleshooting Performance Issues

### High Response Times

**Symptoms:** p95 > 1s or p99 > 2s

**Investigation:**

1. Check K6 output for slow endpoints
2. Database query analysis:
   ```sql
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   WHERE mean_time > 100
   ORDER BY mean_time DESC
   LIMIT 20;
   ```
3. Application logs for slow requests
4. CPU/memory usage during test

**Common Fixes:**
- Add database indexes
- Optimize N+1 queries
- Implement caching
- Scale horizontally

### High Error Rate

**Symptoms:** Error rate > 1%

**Investigation:**

1. Group errors by status code
2. Check application logs
3. Database connection count
4. Rate limiting logs

**Common Causes:**
- Connection exhaustion
- Rate limiting
- Timeouts
- Application bugs

### Memory Leaks

**Symptoms:** Memory increases over time

**Investigation:**

1. Monitor memory usage:
   ```bash
   kubectl top pods
   ```
2. Take heap snapshots
3. Check for unclosed connections

**Common Fixes:**
- Fix event listener leaks
- Clear intervals/timers
- Close database connections
- Implement cache eviction

---

## Results Reporting Template

### Load Test Report

**Test Information:**
- Date: ___________________
- Tester: ___________________
- Environment: [ ] Staging [ ] Production
- Test Type: [ ] Normal [ ] Peak [ ] Stress [ ] Spike [ ] Soak
- Duration: ___________________

**System Configuration:**
- Application Instances: _____
- Database: _____________________
- Redis: ________________________

**Test Results:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Concurrent Users | ____ | ____ | [ ] Pass |
| Requests/Second | ____ | ____ | [ ] Pass |
| Response Time (p50) | < 200ms | ____ms | [ ] Pass |
| Response Time (p95) | < 500ms | ____ms | [ ] Pass |
| Response Time (p99) | < 1000ms | ____ms | [ ] Pass |
| Error Rate | < 0.1% | ____% | [ ] Pass |
| Total Requests | ____ | ____ | [ ] Pass |
| Failed Requests | 0 | ____ | [ ] Pass |

**Resource Utilization:**

| Resource | Average | Peak | Status |
|----------|---------|------|--------|
| Application CPU | ____% | ____% | [ ] Normal |
| Application Memory | ____% | ____% | [ ] Normal |
| Database CPU | ____% | ____% | [ ] Normal |
| Database Memory | ____% | ____% | [ ] Normal |
| Redis Memory | ____% | ____% | [ ] Normal |

**Issues Found:**

1. Issue: ______________________________
   - Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
   - Action: ____________________________

**Recommendations:**

1. _________________________________________
2. _________________________________________
3. _________________________________________

**Conclusion:**

[ ] **PASS** - System meets all performance requirements  
[ ] **PASS WITH WARNINGS** - Minor issues found  
[ ] **FAIL** - Does not meet requirements  

**Sign-off:**

- Tester: _______________________ Date: _______
- Reviewed by: __________________ Date: _______

---

**Document Version:** 1.0  
**Last Updated:** ___________________

## Advanced K6 Features

### Custom Metrics and Tags

```javascript
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

// Define custom metrics
const customCounter = new Counter('custom_counter');
const customTrend = new Trend('custom_trend');
const customRate = new Rate('custom_rate');
const customGauge = new Gauge('custom_gauge');

export default function() {
  // Increment counter
  customCounter.add(1);
  
  // Add value to trend
  customTrend.add(150);
  
  // Add success/failure to rate
  customRate.add(true);  // or false
  
  // Set gauge value
  customGauge.add(100);
}
```

### Using Tags for Analysis

```javascript
import http from 'k6/http';

export default function() {
  // Tag individual requests
  http.get('https://api.yourdomain.com/api/projects', {
    tags: { name: 'ProjectsList', endpoint: 'projects' }
  });
  
  http.get('https://api.yourdomain.com/api/contractors', {
    tags: { name: 'ContractorsList', endpoint: 'contractors' }
  });
}
```

### Thresholds with Custom Logic

```javascript
export const options = {
  thresholds: {
    // Abort test if error rate exceeds 10%
    'http_req_failed': [
      { threshold: 'rate<0.1', abortOnFail: true }
    ],
    
    // Multiple thresholds
    'http_req_duration': [
      'p(95)<500',
      'p(99)<1000',
      'max<3000',
    ],
    
    // Tagged thresholds
    'http_req_duration{endpoint:projects}': ['p(95)<400'],
    'http_req_duration{endpoint:contractors}': ['p(95)<350'],
  },
};
```

---

## K6 Cloud Integration

### Running Tests in K6 Cloud

```bash
# Sign up at k6.io/cloud

# Login
k6 login cloud

# Run test in cloud
k6 cloud tests/load/normal-load.js

# Stream results to cloud while running locally
k6 run --out cloud tests/load/normal-load.js
```

### Benefits of K6 Cloud

- **Distributed Load Generation**: Run from multiple global locations
- **Real-time Dashboards**: Visual analysis of results
- **Performance Trending**: Track performance over time
- **Team Collaboration**: Share results with team
- **Alert Integration**: Notifications for failed tests

---

## Continuous Load Testing in CI/CD

### GitHub Actions Example

```yaml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install K6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Normal Load Test
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
        run: |
          k6 run --out json=results.json tests/load/normal-load.js
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
      
      - name: Check Thresholds
        run: |
          # Parse results and fail if thresholds not met
          if grep -q "✗" results.json; then
            echo "Load test failed - thresholds not met"
            exit 1
          fi
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    triggers {
        cron('H 2 * * *')  // Daily at 2 AM
    }
    
    environment {
        API_BASE_URL = credentials('api-base-url')
        TEST_EMAIL = credentials('load-test-email')
        TEST_PASSWORD = credentials('load-test-password')
    }
    
    stages {
        stage('Install K6') {
            steps {
                sh 'curl -L https://github.com/grafana/k6/releases/download/v0.48.0/k6-v0.48.0-linux-amd64.tar.gz | tar xvz'
                sh 'sudo mv k6-v0.48.0-linux-amd64/k6 /usr/local/bin/'
            }
        }
        
        stage('Run Load Test') {
            steps {
                sh 'k6 run --out json=results.json tests/load/normal-load.js'
            }
        }
        
        stage('Archive Results') {
            steps {
                archiveArtifacts artifacts: 'results.json', fingerprint: true
            }
        }
        
        stage('Publish Results') {
            steps {
                // Publish to Grafana, InfluxDB, or other monitoring
                sh 'curl -X POST http://influxdb:8086/write?db=k6 --data-binary @results.json'
            }
        }
    }
    
    post {
        failure {
            emailext (
                subject: "Load Test Failed: ${env.JOB_NAME}",
                body: "Load test failed. Check Jenkins for details.",
                to: "devops@yourdomain.com"
            )
        }
    }
}
```

---

## Monitoring and Visualization

### InfluxDB + Grafana Setup

**Install InfluxDB:**

```bash
# Docker
docker run -d --name influxdb \
  -p 8086:8086 \
  -v influxdb-data:/var/lib/influxdb \
  influxdb:1.8

# Create database
curl -X POST http://localhost:8086/query --data-urlencode "q=CREATE DATABASE k6"
```

**Install Grafana:**

```bash
# Docker
docker run -d --name grafana \
  -p 3000:3000 \
  -v grafana-data:/var/lib/grafana \
  grafana/grafana

# Access at http://localhost:3000
# Default credentials: admin/admin
```

**Run K6 with InfluxDB Output:**

```bash
k6 run --out influxdb=http://localhost:8086/k6 tests/load/normal-load.js
```

**Grafana Dashboard:**

1. Add InfluxDB as data source
2. Import K6 dashboard (ID: 2587)
3. Customize panels as needed

### Prometheus + Grafana

```bash
# Run K6 with Prometheus remote write
k6 run --out experimental-prometheus-rw tests/load/normal-load.js

# Configure prometheus.yml
scrape_configs:
  - job_name: 'k6'
    static_configs:
      - targets: ['localhost:5656']
```

---

## Best Practices

### 1. Test Environment Isolation

- **Don't** test against production
- **Do** use staging environment that mirrors production
- **Do** use separate test database
- **Do** isolate test data

### 2. Realistic Test Scenarios

- Model actual user behavior
- Include think time between requests
- Vary request patterns
- Test all critical user flows

### 3. Gradual Ramp-up

```javascript
// Good: Gradual ramp-up
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Warm-up
    { duration: '5m', target: 50 },   // Steady state
    { duration: '1m', target: 0 },    // Cool-down
  ],
};

// Bad: Instant load
export const options = {
  stages: [
    { duration: '0s', target: 100 },  // Too sudden
  ],
};
```

### 4. Monitor During Tests

- Watch application metrics in real-time
- Monitor database performance
- Check error logs
- Observe resource utilization

### 5. Consistent Testing Schedule

- Run tests regularly (daily/weekly)
- Test before major releases
- Establish performance baselines
- Track trends over time

### 6. Document Everything

- Record test configurations
- Save test results
- Document issues found
- Track performance improvements

---

## Common Pitfalls to Avoid

### 1. Testing from Same Network

**Problem:** Testing from same network as application gives unrealistic results.

**Solution:** Run load generator from separate network/location.

### 2. Not Warming Up

**Problem:** Cold starts skew initial results.

**Solution:** Include warm-up period before measurement.

### 3. Ignoring Caching

**Problem:** Tests with cached data don't reflect real-world performance.

**Solution:** Clear caches or use varied test data.

### 4. Single Endpoint Focus

**Problem:** Only testing one endpoint misses overall system behavior.

**Solution:** Test complete user flows and multiple endpoints.

### 5. Not Monitoring Resources

**Problem:** Can't identify bottlenecks without resource monitoring.

**Solution:** Monitor CPU, memory, database, network during tests.

### 6. Unrealistic Think Time

**Problem:** No delays between requests creates unrealistic load.

**Solution:** Add realistic sleep/think time between operations.

### 7. Testing Production

**Problem:** Load testing production can cause outages.

**Solution:** **NEVER** load test production. Use staging.

---

## Glossary

**Virtual User (VU):** Simulated concurrent user in K6 test

**RPS (Requests Per Second):** Number of requests sent per second

**Latency:** Time between request sent and response received

**Throughput:** Number of requests processed per second

**p50 (Median):** 50% of requests faster than this value

**p95:** 95% of requests faster than this value

**p99:** 99% of requests faster than this value

**Ramp-up:** Gradual increase in load

**Ramp-down:** Gradual decrease in load

**Steady State:** Period of constant load

**Think Time:** Delay between user actions

**Error Rate:** Percentage of failed requests

**SLA (Service Level Agreement):** Performance commitments

**RTO (Recovery Time Objective):** Maximum downtime allowed

**RPO (Recovery Point Objective):** Maximum data loss allowed

---

## Additional Resources

### Official Documentation

- K6 Documentation: https://k6.io/docs/
- K6 Examples: https://k6.io/docs/examples/
- K6 Cloud: https://k6.io/cloud/

### Community Resources

- K6 Community Forum: https://community.k6.io/
- K6 GitHub: https://github.com/grafana/k6
- K6 Slack: https://k6.io/slack

### Related Tools

- **Grafana**: Visualization and dashboards
- **InfluxDB**: Time-series database for metrics
- **Prometheus**: Monitoring and alerting
- **Apache Bench (ab)**: Simple HTTP load testing
- **JMeter**: Java-based load testing tool
- **Gatling**: Scala-based load testing

### Performance Testing Books

- "The Art of Application Performance Testing" by Ian Molyneaux
- "Performance Testing Guidance for Web Applications" by Microsoft
- "Web Load Testing for Dummies" by Scott Barber

---

## Appendix: Sample Test Data

### Test Users

```json
[
  {
    "email": "loadtest1@example.com",
    "password": "LoadTest123!",
    "role": "GC_ADMIN"
  },
  {
    "email": "loadtest2@example.com",
    "password": "LoadTest456!",
    "role": "CONTRACTOR"
  },
  {
    "email": "loadtest3@example.com",
    "password": "LoadTest789!",
    "role": "GC_USER"
  }
]
```

### Sample Projects

```json
[
  {
    "name": "Downtown Office Complex",
    "address": "100 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "clientName": "Acme Corporation"
  },
  {
    "name": "Residential Tower",
    "address": "200 Market Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90012",
    "clientName": "BuildCo LLC"
  }
]
```

### Sample Contractors

```json
[
  {
    "companyName": "Elite Electrical Services",
    "contactEmail": "contact@elite-electric.com",
    "contactPhone": "555-0100",
    "address": "300 Industrial Way"
  },
  {
    "companyName": "Premier Plumbing Co",
    "contactEmail": "info@premier-plumbing.com",
    "contactPhone": "555-0200",
    "address": "400 Service Road"
  }
]
```

---

**Document Changelog:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-01 | Initial release | DevOps Team |

---

**Review Schedule:**

- **Quarterly Review**: Update thresholds and baselines
- **After Major Releases**: Re-run all test scenarios
- **When Performance Issues Occur**: Update troubleshooting section

---

**Feedback and Improvements:**

Submit feedback or suggestions to: devops@yourdomain.com

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Next Review:** April 2024  
**Document Owner:** DevOps/Performance Engineering Team
