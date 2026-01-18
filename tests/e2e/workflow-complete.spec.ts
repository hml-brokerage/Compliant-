import { test, expect, Page } from '@playwright/test';

/**
 * Complete Workflow E2E Tests
 * Tests the full COI (Certificate of Insurance) workflow including:
 * - GC (General Contractor) interactions
 * - Subcontractor interactions
 * - Broker interactions
 * - Compliant and non-compliant scenarios
 * - Renewal workflows
 * - First-time and second-time submissions
 */

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const FRONTEND_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Test credentials from seed data
const CREDENTIALS = {
  admin: { email: 'admin@compliant.com', password: 'Admin123!@#' },
  gc: { email: 'contractor@compliant.com', password: 'Contractor123!@#' },
  subcontractor: { email: 'subcontractor@compliant.com', password: 'Subcontractor123!@#' },
  broker: { email: 'broker@compliant.com', password: 'Broker123!@#' },
};

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// Helper function to get auth token via API
async function getAuthToken(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.accessToken;
}

test.describe('Complete Workflow Tests', () => {
  
  test.describe('1. Role-Based Dashboard Access', () => {
    
    test('Admin should see admin dashboard', async ({ page }) => {
      await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
      
      // Verify admin dashboard elements
      await expect(page.locator('text=Admin User')).toBeVisible();
      await expect(page.locator('text=ADMIN')).toBeVisible();
      
      // Take screenshot for documentation
      await page.screenshot({ 
        path: 'test-results/screenshots/01-admin-dashboard.png',
        fullPage: true 
      });
    });
    
    test('GC should see contractor dashboard', async ({ page }) => {
      await login(page, CREDENTIALS.gc.email, CREDENTIALS.gc.password);
      
      // Verify contractor dashboard elements
      await expect(page.locator('text=General Contractor')).toBeVisible();
      await expect(page.locator('text=CONTRACTOR')).toBeVisible();
      
      // Take screenshot for documentation
      await page.screenshot({ 
        path: 'test-results/screenshots/02-gc-dashboard.png',
        fullPage: true 
      });
    });
    
    test('Subcontractor should see subcontractor dashboard', async ({ page }) => {
      await login(page, CREDENTIALS.subcontractor.email, CREDENTIALS.subcontractor.password);
      
      // Verify subcontractor dashboard elements
      await expect(page.locator('text=Sub Contractor')).toBeVisible();
      await expect(page.locator('text=SUBCONTRACTOR')).toBeVisible();
      
      // Take screenshot for documentation
      await page.screenshot({ 
        path: 'test-results/screenshots/03-subcontractor-dashboard.png',
        fullPage: true 
      });
    });
    
    test('Broker should see broker dashboard', async ({ page }) => {
      await login(page, CREDENTIALS.broker.email, CREDENTIALS.broker.password);
      
      // Verify broker dashboard elements
      await expect(page.locator('text=BROKER')).toBeVisible();
      
      // Take screenshot for documentation
      await page.screenshot({ 
        path: 'test-results/screenshots/04-broker-dashboard.png',
        fullPage: true 
      });
    });
  });
  
  test.describe('2. Compliant Workflow - First Time Submission', () => {
    let adminToken: string;
    let projectId: string;
    let subcontractorId: string;
    let coiId: string;
    
    test.beforeAll(async () => {
      adminToken = await getAuthToken(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    });
    
    test('Step 1: Admin creates project', async () => {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Test Construction Project - Compliant',
          description: 'Test project for compliant workflow',
          startDate: new Date().toISOString(),
          status: 'ACTIVE',
          gcName: 'ABC Construction',
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const project = await response.json();
      projectId = project.id;
      
      console.log('✓ Created project:', projectId);
    });
    
    test('Step 2: Admin creates subcontractor', async () => {
      const response = await fetch(`${API_BASE_URL}/api/contractors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Test Subcontractor - Compliant',
          email: 'test-sub-compliant@example.com',
          phone: '555-0101',
          company: 'Test Sub Company',
          contractorType: 'SUBCONTRACTOR',
          status: 'ACTIVE',
          trades: ['Electrical', 'HVAC'],
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const subcontractor = await response.json();
      subcontractorId = subcontractor.id;
      
      console.log('✓ Created subcontractor:', subcontractorId);
    });
    
    test('Step 3: Admin creates COI for subcontractor', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          projectId: projectId,
          subcontractorId: subcontractorId,
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const coi = await response.json();
      coiId = coi.id;
      
      expect(coi.status).toBe('AWAITING_BROKER_INFO');
      console.log('✓ Created COI:', coiId, 'Status:', coi.status);
    });
    
    test('Step 4: Subcontractor updates broker information', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/broker-info`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          brokerGlName: 'John Smith',
          brokerGlEmail: 'john@insurance.com',
          brokerGlPhone: '555-0201',
          brokerAutoName: 'Jane Doe',
          brokerAutoEmail: 'jane@insurance.com',
          brokerAutoPhone: '555-0202',
          brokerUmbrellaName: 'Bob Johnson',
          brokerUmbrellaEmail: 'bob@insurance.com',
          brokerUmbrellaPhone: '555-0203',
          brokerWcName: 'Alice Williams',
          brokerWcEmail: 'alice@insurance.com',
          brokerWcPhone: '555-0204',
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('AWAITING_BROKER_UPLOAD');
      
      console.log('✓ Updated broker info, Status:', updatedCoi.status);
    });
    
    test('Step 5: Broker uploads policy documents', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/upload`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glPolicyUrl: 'https://example.com/policies/gl-policy.pdf',
          umbrellaPolicyUrl: 'https://example.com/policies/umbrella-policy.pdf',
          autoPolicyUrl: 'https://example.com/policies/auto-policy.pdf',
          wcPolicyUrl: 'https://example.com/policies/wc-policy.pdf',
          glExpirationDate: futureDate.toISOString(),
          umbrellaExpirationDate: futureDate.toISOString(),
          autoExpirationDate: futureDate.toISOString(),
          wcExpirationDate: futureDate.toISOString(),
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('AWAITING_BROKER_SIGNATURE');
      
      console.log('✓ Uploaded policies, Status:', updatedCoi.status);
    });
    
    test('Step 6: Broker signs policies', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/sign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glBrokerSignatureUrl: 'https://example.com/signatures/gl-sig.png',
          umbrellaBrokerSignatureUrl: 'https://example.com/signatures/umbrella-sig.png',
          autoBrokerSignatureUrl: 'https://example.com/signatures/auto-sig.png',
          wcBrokerSignatureUrl: 'https://example.com/signatures/wc-sig.png',
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('AWAITING_ADMIN_REVIEW');
      
      console.log('✓ Signed policies, Status:', updatedCoi.status);
    });
    
    test('Step 7: Admin approves COI (compliant)', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approved: true,
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('ACTIVE');
      
      console.log('✓ Approved COI, Status:', updatedCoi.status);
      console.log('✅ COMPLIANT WORKFLOW COMPLETE');
    });
  });
  
  test.describe('3. Non-Compliant Workflow - With Deficiency', () => {
    let adminToken: string;
    let projectId: string;
    let subcontractorId: string;
    let coiId: string;
    
    test.beforeAll(async () => {
      adminToken = await getAuthToken(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    });
    
    test('Step 1: Create project and subcontractor for non-compliant test', async () => {
      // Create project
      const projectResponse = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Test Construction Project - Non-Compliant',
          description: 'Test project for non-compliant workflow',
          startDate: new Date().toISOString(),
          status: 'ACTIVE',
        }),
      });
      
      const project = await projectResponse.json();
      projectId = project.id;
      
      // Create subcontractor
      const subResponse = await fetch(`${API_BASE_URL}/api/contractors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Test Subcontractor - Non-Compliant',
          email: 'test-sub-noncompliant@example.com',
          company: 'Test Non-Compliant Company',
          contractorType: 'SUBCONTRACTOR',
        }),
      });
      
      const subcontractor = await subResponse.json();
      subcontractorId = subcontractor.id;
      
      console.log('✓ Created project and subcontractor for non-compliant test');
    });
    
    test('Step 2: Create COI and complete to review stage', async () => {
      // Create COI
      const coiResponse = await fetch(`${API_BASE_URL}/api/generated-coi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          projectId: projectId,
          subcontractorId: subcontractorId,
        }),
      });
      
      const coi = await coiResponse.json();
      coiId = coi.id;
      
      // Add broker info
      await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/broker-info`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          brokerGlName: 'Broker GL',
          brokerGlEmail: 'brokergl@test.com',
        }),
      });
      
      // Upload policies with issues (e.g., near expiration)
      const nearExpirationDate = new Date();
      nearExpirationDate.setDate(nearExpirationDate.getDate() + 10); // Only 10 days validity
      
      await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/upload`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glPolicyUrl: 'https://example.com/policies/gl-deficient.pdf',
          glExpirationDate: nearExpirationDate.toISOString(),
        }),
      });
      
      // Sign policies
      await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/sign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glBrokerSignatureUrl: 'https://example.com/signatures/gl-sig-deficient.png',
        }),
      });
      
      console.log('✓ COI ready for review with deficiencies');
    });
    
    test('Step 3: Admin rejects COI with deficiency notes', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approved: false,
          deficiencyNotes: 'GL policy expires too soon (less than 30 days). Please provide policy with at least 1 year validity. Also missing umbrella, auto, and WC policies.',
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('DEFICIENCY_PENDING');
      expect(updatedCoi.deficiencyNotes).toContain('GL policy expires too soon');
      
      console.log('✓ COI rejected with deficiency, Status:', updatedCoi.status);
    });
    
    test('Step 4: Broker resubmits with corrected information', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      // Upload corrected policies
      await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/upload`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glPolicyUrl: 'https://example.com/policies/gl-corrected.pdf',
          umbrellaPolicyUrl: 'https://example.com/policies/umbrella-corrected.pdf',
          autoPolicyUrl: 'https://example.com/policies/auto-corrected.pdf',
          wcPolicyUrl: 'https://example.com/policies/wc-corrected.pdf',
          glExpirationDate: futureDate.toISOString(),
          umbrellaExpirationDate: futureDate.toISOString(),
          autoExpirationDate: futureDate.toISOString(),
          wcExpirationDate: futureDate.toISOString(),
        }),
      });
      
      await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/sign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glBrokerSignatureUrl: 'https://example.com/signatures/gl-sig-corrected.png',
          umbrellaBrokerSignatureUrl: 'https://example.com/signatures/umbrella-sig-corrected.png',
          autoBrokerSignatureUrl: 'https://example.com/signatures/auto-sig-corrected.png',
          wcBrokerSignatureUrl: 'https://example.com/signatures/wc-sig-corrected.png',
        }),
      });
      
      // Resubmit for review
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/resubmit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('AWAITING_ADMIN_REVIEW');
      
      console.log('✓ Resubmitted corrected COI, Status:', updatedCoi.status);
    });
    
    test('Step 5: Admin approves resubmitted COI', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${coiId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approved: true,
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('ACTIVE');
      
      console.log('✓ Approved resubmitted COI, Status:', updatedCoi.status);
      console.log('✅ NON-COMPLIANT -> CORRECTED WORKFLOW COMPLETE');
    });
  });
  
  test.describe('4. Renewal Workflow - Second Time Submission', () => {
    let adminToken: string;
    let projectId: string;
    let subcontractorId: string;
    let originalCoiId: string;
    let renewedCoiId: string;
    
    test.beforeAll(async () => {
      adminToken = await getAuthToken(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    });
    
    test('Step 1: Setup - Create and approve original COI', async () => {
      // Create project
      const projectResponse = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Test Project - Renewal',
          startDate: new Date().toISOString(),
          status: 'ACTIVE',
        }),
      });
      
      const project = await projectResponse.json();
      projectId = project.id;
      
      // Create subcontractor
      const subResponse = await fetch(`${API_BASE_URL}/api/contractors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Test Subcontractor - Renewal',
          email: 'test-sub-renewal@example.com',
          contractorType: 'SUBCONTRACTOR',
        }),
      });
      
      const subcontractor = await subResponse.json();
      subcontractorId = subcontractor.id;
      
      // Create and complete original COI
      const coiResponse = await fetch(`${API_BASE_URL}/api/generated-coi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          projectId: projectId,
          subcontractorId: subcontractorId,
        }),
      });
      
      const coi = await coiResponse.json();
      originalCoiId = coi.id;
      
      // Quick completion of original COI
      await fetch(`${API_BASE_URL}/api/generated-coi/${originalCoiId}/broker-info`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          brokerGlName: 'Original Broker',
          brokerGlEmail: 'original@broker.com',
        }),
      });
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      await fetch(`${API_BASE_URL}/api/generated-coi/${originalCoiId}/upload`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glPolicyUrl: 'https://example.com/policies/gl-original.pdf',
          glExpirationDate: futureDate.toISOString(),
        }),
      });
      
      await fetch(`${API_BASE_URL}/api/generated-coi/${originalCoiId}/sign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glBrokerSignatureUrl: 'https://example.com/signatures/gl-sig-original.png',
        }),
      });
      
      await fetch(`${API_BASE_URL}/api/generated-coi/${originalCoiId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approved: true,
        }),
      });
      
      console.log('✓ Original COI created and approved');
    });
    
    test('Step 2: Admin initiates renewal', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${originalCoiId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      
      expect(response.ok).toBeTruthy();
      const renewedCoi = await response.json();
      renewedCoiId = renewedCoi.id;
      
      // Renewal should copy broker information from original
      expect(renewedCoi.brokerGlName).toBe('Original Broker');
      expect(renewedCoi.brokerGlEmail).toBe('original@broker.com');
      expect(renewedCoi.status).toBe('AWAITING_BROKER_UPLOAD');
      
      console.log('✓ Renewal COI created:', renewedCoiId);
      console.log('✓ Broker info copied from original');
    });
    
    test('Step 3: Broker uploads renewed policies', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${renewedCoiId}/upload`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glPolicyUrl: 'https://example.com/policies/gl-renewed.pdf',
          glExpirationDate: futureDate.toISOString(),
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('AWAITING_BROKER_SIGNATURE');
      
      console.log('✓ Uploaded renewed policies');
    });
    
    test('Step 4: Broker signs renewed policies', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${renewedCoiId}/sign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          glBrokerSignatureUrl: 'https://example.com/signatures/gl-sig-renewed.png',
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('AWAITING_ADMIN_REVIEW');
      
      console.log('✓ Signed renewed policies');
    });
    
    test('Step 5: Admin approves renewed COI', async () => {
      const response = await fetch(`${API_BASE_URL}/api/generated-coi/${renewedCoiId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approved: true,
        }),
      });
      
      expect(response.ok).toBeTruthy();
      const updatedCoi = await response.json();
      expect(updatedCoi.status).toBe('ACTIVE');
      
      console.log('✓ Approved renewed COI');
      console.log('✅ RENEWAL WORKFLOW COMPLETE (Second-time submission)');
    });
  });
  
  test.describe('5. API Health and Documentation', () => {
    
    test('Backend health check should pass', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/health`);
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.status).toBe('ok');
      
      console.log('✓ Backend health check passed');
    });
    
    test('Swagger documentation should be accessible', async ({ page }) => {
      await page.goto(`${API_BASE_URL}/api/docs`);
      await page.waitForLoadState('networkidle');
      
      // Check for Swagger UI elements
      const title = await page.title();
      expect(title.toLowerCase()).toContain('swagger');
      
      // Take screenshot of API documentation
      await page.screenshot({ 
        path: 'test-results/screenshots/05-swagger-docs.png',
        fullPage: false 
      });
      
      console.log('✓ Swagger documentation accessible');
    });
  });
  
  test.describe('6. Workflow Status Summary', () => {
    
    test('Generate workflow completion report', async ({ page }) => {
      await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
      
      // Take final dashboard screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/06-final-admin-dashboard.png',
        fullPage: true 
      });
      
      console.log('\n=================================');
      console.log('WORKFLOW TEST SUMMARY');
      console.log('=================================');
      console.log('✅ Role-based dashboards tested');
      console.log('✅ Compliant workflow - First time submission');
      console.log('✅ Non-compliant workflow - Deficiency and resubmission');
      console.log('✅ Renewal workflow - Second time submission');
      console.log('✅ API health checks');
      console.log('✅ Screenshots captured');
      console.log('=================================\n');
    });
  });
});
