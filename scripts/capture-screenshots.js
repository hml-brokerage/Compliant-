/**
 * Screenshot Capture Script
 * 
 * This script captures screenshots of every page in the Compliant Platform.
 * It logs in using the provided credentials and navigates through all pages
 * for different user roles (admin, gc, broker, subcontractor).
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001/api';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');

// Test credentials
const TEST_EMAIL = 'miriamsabel@insuretrack.onmicrosoft.com';
const TEST_PASSWORD = '260Hooper';

// All pages to capture by role
const PAGES = {
  public: [
    { name: 'home', url: '/', description: 'Home Page' },
    { name: 'login', url: '/login', description: 'Login Page' },
  ],
  dashboard: [
    { name: 'dashboard', url: '/dashboard', description: 'Main Dashboard' },
  ],
  admin: [
    { name: 'admin-coi-reviews', url: '/admin/coi-reviews', description: 'Admin - COI Reviews' },
    { name: 'admin-contractors-new', url: '/admin/contractors/new', description: 'Admin - New Contractor' },
    { name: 'admin-general-contractors', url: '/admin/general-contractors', description: 'Admin - General Contractors List' },
    { name: 'admin-projects', url: '/admin/projects', description: 'Admin - Projects List' },
    { name: 'admin-projects-new', url: '/admin/projects/new', description: 'Admin - New Project' },
  ],
  gc: [
    { name: 'gc-compliance', url: '/gc/compliance', description: 'GC - Compliance Dashboard' },
    { name: 'gc-projects', url: '/gc/projects', description: 'GC - Projects List' },
    { name: 'gc-subcontractors', url: '/gc/subcontractors', description: 'GC - Subcontractors List' },
  ],
  broker: [
    { name: 'broker-documents', url: '/broker/documents', description: 'Broker - Documents' },
    { name: 'broker-upload', url: '/broker/upload', description: 'Broker - Upload Documents' },
  ],
  subcontractor: [
    { name: 'subcontractor-broker', url: '/subcontractor/broker', description: 'Subcontractor - Broker Portal' },
    { name: 'subcontractor-compliance', url: '/subcontractor/compliance', description: 'Subcontractor - Compliance' },
    { name: 'subcontractor-projects', url: '/subcontractor/projects', description: 'Subcontractor - Projects' },
  ],
};

async function waitForNetworkIdle(page, timeout = 3000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (e) {
    // Continue if timeout - some pages might have long-polling
    console.log('  ⚠️  Network idle timeout (continuing anyway)');
  }
}

async function captureScreenshot(page, filename, description) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${filename}.png`);
  
  try {
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    await waitForNetworkIdle(page, 2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    
    console.log(`✅ ${description}: ${screenshotPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to capture ${description}: ${error.message}`);
    return false;
  }
}

async function tryLogin(page) {
  try {
    console.log('\n🔐 Attempting login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    // Fill in login form
    await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    await waitForNetworkIdle(page);
    
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error(`❌ Login failed: ${error.message}`);
    return false;
  }
}

async function captureAllPages() {
  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log('🚀 Starting Screenshot Capture');
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOTS_DIR}`);
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  
  let totalCaptured = 0;
  let totalFailed = 0;

  try {
    // Capture public pages (before login)
    console.log('\n📸 Capturing Public Pages...');
    for (const pageInfo of PAGES.public) {
      try {
        await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'domcontentloaded' });
        const success = await captureScreenshot(page, pageInfo.name, pageInfo.description);
        if (success) totalCaptured++;
        else totalFailed++;
      } catch (error) {
        console.error(`❌ Failed to navigate to ${pageInfo.url}: ${error.message}`);
        totalFailed++;
      }
    }

    // Try to login
    const loginSuccess = await tryLogin(page);
    
    if (loginSuccess) {
      // Capture dashboard
      console.log('\n📸 Capturing Dashboard...');
      for (const pageInfo of PAGES.dashboard) {
        try {
          await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'domcontentloaded' });
          const success = await captureScreenshot(page, pageInfo.name, pageInfo.description);
          if (success) totalCaptured++;
          else totalFailed++;
        } catch (error) {
          console.error(`❌ Failed to navigate to ${pageInfo.url}: ${error.message}`);
          totalFailed++;
        }
      }

      // Capture admin pages
      console.log('\n📸 Capturing Admin Pages...');
      for (const pageInfo of PAGES.admin) {
        try {
          await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'domcontentloaded' });
          const success = await captureScreenshot(page, pageInfo.name, pageInfo.description);
          if (success) totalCaptured++;
          else totalFailed++;
        } catch (error) {
          console.error(`❌ Failed to navigate to ${pageInfo.url}: ${error.message}`);
          totalFailed++;
        }
      }

      // Capture GC pages
      console.log('\n📸 Capturing GC Pages...');
      for (const pageInfo of PAGES.gc) {
        try {
          await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'domcontentloaded' });
          const success = await captureScreenshot(page, pageInfo.name, pageInfo.description);
          if (success) totalCaptured++;
          else totalFailed++;
        } catch (error) {
          console.error(`❌ Failed to navigate to ${pageInfo.url}: ${error.message}`);
          totalFailed++;
        }
      }

      // Capture Broker pages
      console.log('\n📸 Capturing Broker Pages...');
      for (const pageInfo of PAGES.broker) {
        try {
          await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'domcontentloaded' });
          const success = await captureScreenshot(page, pageInfo.name, pageInfo.description);
          if (success) totalCaptured++;
          else totalFailed++;
        } catch (error) {
          console.error(`❌ Failed to navigate to ${pageInfo.url}: ${error.message}`);
          totalFailed++;
        }
      }

      // Capture Subcontractor pages
      console.log('\n📸 Capturing Subcontractor Pages...');
      for (const pageInfo of PAGES.subcontractor) {
        try {
          await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'domcontentloaded' });
          const success = await captureScreenshot(page, pageInfo.name, pageInfo.description);
          if (success) totalCaptured++;
          else totalFailed++;
        } catch (error) {
          console.error(`❌ Failed to navigate to ${pageInfo.url}: ${error.message}`);
          totalFailed++;
        }
      }
    } else {
      console.log('\n⚠️  Could not login - skipping authenticated pages');
      console.log('💡 Make sure the backend is running and the credentials are correct');
    }

  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Screenshot Capture Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully captured: ${totalCaptured} screenshots`);
  console.log(`❌ Failed: ${totalFailed} screenshots`);
  console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
  console.log('='.repeat(60));
}

// Run the script
captureAllPages()
  .then(() => {
    console.log('\n✨ Screenshot capture completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
