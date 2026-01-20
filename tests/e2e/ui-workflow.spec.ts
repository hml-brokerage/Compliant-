import { test, expect } from '@playwright/test';
import { ScreenshotHelper } from './screenshot-helper';

/**
 * UI Workflow E2E Tests with Screenshots
 * 
 * This test suite demonstrates the complete user interface workflows
 * with screenshots captured at every step for visual verification.
 * 
 * Each test captures:
 * - Initial page load
 * - Form interactions
 * - Navigation between pages
 * - Data display
 * - Error states
 * - Success states
 * 
 * Screenshots are saved to: test-results/screenshots/[test-name]/
 */

test.describe('UI Workflow Tests with Screenshots', () => {
  
  test('Complete frontend navigation and layout verification', async ({ page }) => {
    const screenshots = new ScreenshotHelper('frontend-navigation');
    screenshots.startConsoleMonitoring(page);
    
    // Step 1: Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, 'homepage-initial-load', true);
    
    // Step 2: Check page title and content
    const title = await page.title();
    console.log(`Page title: ${title}`);
    await screenshots.capture(page, 'homepage-with-title');
    
    // Step 3: Look for common UI elements
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    await screenshots.capture(page, 'homepage-body-content', true);
    
    // Step 4: Check for any navigation elements
    const hasNavigation = await page.locator('nav').count() > 0;
    if (hasNavigation) {
      console.log('✓ Navigation found');
      await screenshots.capture(page, 'navigation-visible');
    }
    
    // Step 5: Check for any forms
    const formCount = await page.locator('form').count();
    console.log(`Forms found: ${formCount}`);
    if (formCount > 0) {
      await screenshots.capture(page, 'forms-detected');
    }
    
    // Step 6: Check for any buttons
    const buttonCount = await page.locator('button').count();
    console.log(`Buttons found: ${buttonCount}`);
    if (buttonCount > 0) {
      await screenshots.capture(page, 'buttons-detected');
    }
    
    // Step 7: Check for any links
    const linkCount = await page.locator('a').count();
    console.log(`Links found: ${linkCount}`);
    if (linkCount > 0) {
      await screenshots.capture(page, 'links-detected');
    }
    
    // Final screenshot
    await screenshots.capture(page, 'final-state', true);
    
    // Save console summary
    screenshots.saveConsoleSummary();
    
    console.log(`\n✅ Test completed with ${screenshots.getCount()} screenshots`);
    console.log(`📁 Screenshots saved to: ${screenshots.getDirectory()}`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Login page workflow (if exists)', async ({ page }) => {
    const screenshots = new ScreenshotHelper('login-workflow');
    screenshots.startConsoleMonitoring(page);
    
    // Try to find and navigate to login page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, 'initial-page', true);
    
    // Common login page routes
    const loginRoutes = ['/login', '/auth/login', '/signin', '/sign-in'];
    let loginPageFound = false;
    
    for (const route of loginRoutes) {
      try {
        const response = await page.goto(route);
        if (response && response.ok()) {
          loginPageFound = true;
          await page.waitForLoadState('networkidle');
          await screenshots.capture(page, `login-page-found-${route.replace(/\//g, '-')}`, true);
          console.log(`✓ Login page found at: ${route}`);
          
          // Look for login form elements
          const emailInput = await page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
          const passwordInput = await page.locator('input[type="password"]').first();
          const submitButton = await page.locator('button[type="submit"], button:has-text("login"), button:has-text("sign in")').first();
          
          if (await emailInput.count() > 0) {
            await screenshots.capture(page, 'login-form-email-field');
          }
          
          if (await passwordInput.count() > 0) {
            await screenshots.capture(page, 'login-form-password-field');
          }
          
          if (await submitButton.count() > 0) {
            await screenshots.capture(page, 'login-form-submit-button');
          }
          
          break;
        }
      } catch (error) {
        // Route doesn't exist, try next
        continue;
      }
    }
    
    if (!loginPageFound) {
      console.log('ℹ️  Login page not found at common routes, checking homepage for login link');
      await page.goto('/');
      await screenshots.capture(page, 'homepage-checking-for-login-link', true);
    }
    
    await screenshots.capture(page, 'final-state', true);
    screenshots.saveConsoleSummary();
    console.log(`\n✅ Test completed with ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Responsive design verification', async ({ page }) => {
    const screenshots = new ScreenshotHelper('responsive-design');
    screenshots.startConsoleMonitoring(page);
    
    // Test different viewport sizes
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'laptop', width: 1366, height: 768 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await screenshots.capture(page, `viewport-${viewport.name}-${viewport.width}x${viewport.height}`, true);
      console.log(`✓ Captured ${viewport.name} view (${viewport.width}x${viewport.height})`);
      
      // Wait a bit for any responsive animations
      await page.waitForTimeout(500);
    }
    
    screenshots.saveConsoleSummary();
    console.log(`\n✅ Test completed with ${screenshots.getCount()} screenshots across ${viewports.length} viewports`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Dark mode / Theme verification (if applicable)', async ({ page }) => {
    const screenshots = new ScreenshotHelper('theme-verification');
    screenshots.startConsoleMonitoring(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, 'initial-theme', true);
    
    // Check for theme toggle button
    const themeToggleSelectors = [
      'button[aria-label*="theme"]',
      'button[aria-label*="dark"]',
      'button[aria-label*="light"]',
      '[data-theme-toggle]',
      '.theme-toggle',
      '#theme-toggle',
    ];
    
    for (const selector of themeToggleSelectors) {
      const toggleButton = page.locator(selector).first();
      if (await toggleButton.count() > 0) {
        console.log(`✓ Theme toggle found: ${selector}`);
        await screenshots.capture(page, 'before-theme-toggle');
        
        await toggleButton.click();
        await page.waitForTimeout(500); // Wait for theme transition
        await screenshots.capture(page, 'after-theme-toggle', true);
        
        // Toggle back
        await toggleButton.click();
        await page.waitForTimeout(500);
        await screenshots.capture(page, 'theme-toggled-back', true);
        
        break;
      }
    }
    
    screenshots.saveConsoleSummary();
    console.log(`\n✅ Test completed with ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Error state verification', async ({ page }) => {
    const screenshots = new ScreenshotHelper('error-states');
    screenshots.startConsoleMonitoring(page);
    
    // Try to navigate to non-existent route
    await page.goto('/this-route-definitely-does-not-exist-404');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, '404-page-not-found', true);
    
    // Check if there's a 404 page
    const has404Content = await page.locator('text=/404|not found|page not found/i').count() > 0;
    if (has404Content) {
      console.log('✓ 404 error page detected');
    }
    
    await screenshots.capture(page, 'error-page-final', true);
    screenshots.saveConsoleSummary();
    console.log(`\n✅ Test completed with ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Performance and loading states', async ({ page }) => {
    const screenshots = new ScreenshotHelper('loading-states');
    screenshots.startConsoleMonitoring(page);
    
    // Navigate and capture loading state
    const navigationPromise = page.goto('/');
    await screenshots.capture(page, 'during-navigation');
    await navigationPromise;
    
    await screenshots.capture(page, 'after-navigation', true);
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, 'network-idle', true);
    
    // Check for any loading indicators
    const loadingIndicators = await page.locator('[data-loading], .loading, .spinner, [role="progressbar"]').count();
    if (loadingIndicators > 0) {
      console.log(`✓ Loading indicators found: ${loadingIndicators}`);
      await screenshots.capture(page, 'loading-indicators-present');
    }
    
    screenshots.saveConsoleSummary();
    console.log(`\n✅ Test completed with ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Accessibility features verification', async ({ page }) => {
    const screenshots = new ScreenshotHelper('accessibility-features');
    screenshots.startConsoleMonitoring(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, 'initial-page', true);
    
    // Check for skip to content link
    const skipLink = await page.locator('a[href="#main"], a[href="#content"], .skip-to-content').count();
    if (skipLink > 0) {
      console.log('✓ Skip to content link found');
      await screenshots.capture(page, 'skip-link-present');
    }
    
    // Check for ARIA landmarks
    const mainLandmark = await page.locator('main, [role="main"]').count();
    const navLandmark = await page.locator('nav, [role="navigation"]').count();
    
    console.log(`ARIA Landmarks - main: ${mainLandmark}, nav: ${navLandmark}`);
    await screenshots.capture(page, 'aria-landmarks-checked', true);
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await screenshots.capture(page, 'first-tab-focus');
    
    await page.keyboard.press('Tab');
    await screenshots.capture(page, 'second-tab-focus');
    
    screenshots.saveConsoleSummary();
    console.log(`\n✅ Test completed with ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });
});
