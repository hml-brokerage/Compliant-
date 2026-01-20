import { test, expect } from '@playwright/test';

/**
 * Basic E2E Health Check Tests
 * These tests verify that the application is running and accessible
 * 
 * Screenshots and console logs are saved to: docs/e2e-screenshots/
 * These are committed to the PR for visual verification
 */

// Store console messages for each test
const consoleMessages: Array<{ type: string; text: string; timestamp: string }> = [];

test.beforeEach(async ({ page }) => {
  // Monitor console messages
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString(),
    };
    consoleMessages.push(message);
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Monitor page errors
  page.on('pageerror', error => {
    const message = {
      type: 'pageerror',
      text: error.message,
      timestamp: new Date().toISOString(),
    };
    consoleMessages.push(message);
    console.log(`[PAGE ERROR] ${error.message}`);
  });
});

test.describe('Health Checks', () => {
  test('backend health endpoint should be accessible', async ({ request }) => {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    
    // Note: Backend uses /api prefix and requires X-API-Version header
    const response = await request.get(`${apiBaseUrl}/api/health`, {
      headers: {
        'X-API-Version': '1',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    // Verify NestJS Terminus returns the expected format
    // According to @nestjs/terminus docs, successful health checks return { status: "ok", ... }
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
    
    // Terminus also includes 'info', 'error', and 'details' objects
    expect(body).toHaveProperty('info');
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('details');
  });

  test('frontend should load successfully', async ({ page, baseURL }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Capture screenshot after page load (saved to docs/e2e-screenshots/)
    await page.screenshot({ 
      path: 'docs/e2e-screenshots/health-checks/01-frontend-loaded.png', 
      fullPage: true 
    });
    
    // Verify the page loaded without critical errors
    // Check that we're on the expected base URL
    if (baseURL) {
      const currentUrl = new URL(page.url());
      const expectedUrl = new URL(baseURL);
      expect(currentUrl.origin).toBe(expectedUrl.origin);
    }
  });

  test('frontend should have proper title or content', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be ready
    await page.waitForLoadState('domcontentloaded');
    
    // Capture screenshot of page content (saved to docs/e2e-screenshots/)
    await page.screenshot({ 
      path: 'docs/e2e-screenshots/health-checks/02-frontend-content.png', 
      fullPage: true 
    });
    
    // Check if the page has loaded some content
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent!.length).toBeGreaterThan(0);
  });
});
