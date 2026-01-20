# End-to-End Browser Testing

This directory contains screenshots and console logs from E2E browser tests using Playwright.

## 📸 Screenshots

All E2E test screenshots are automatically saved here and committed to the PR for visual verification.

### Directory Structure

```
docs/e2e-screenshots/
├── health-checks/           # Basic health check test screenshots
├── frontend-navigation/     # Frontend navigation and layout tests
├── login-workflow/          # Login page workflow tests
├── responsive-design/       # Responsive design across viewports
├── theme-verification/      # Dark/light theme tests
├── error-states/           # Error page tests
├── loading-states/         # Loading indicators and performance
├── accessibility-features/ # Accessibility features tests
└── [test-name]/            # Each test creates its own directory
    ├── 001-step-name.png   # Screenshot at each step
    ├── 002-next-step.png
    ├── ...
    ├── console.log         # Raw console output
    └── console-summary.txt # Console message summary
```

## 📊 Console Monitoring

Each test monitors and logs:
- ✅ Console logs
- ℹ️ Info messages
- ⚠️ Warnings
- ❌ Errors
- 🐛 Debug messages
- 🔴 Request failures
- ❌ Page errors

Console logs are saved alongside screenshots for debugging.

## 🎯 Test Coverage

### Health Checks (`health.spec.ts`)
- Backend API health endpoint verification
- Frontend page load and rendering
- Content verification

### UI Workflow Tests (`ui-workflow.spec.ts`)
1. **Frontend Navigation** - Complete navigation and layout verification
2. **Login Workflow** - Login page discovery and form detection
3. **Responsive Design** - Tests across desktop, laptop, tablet, and mobile viewports
4. **Theme Verification** - Dark/light mode toggle testing
5. **Error States** - 404 and error page handling
6. **Loading States** - Performance and loading indicators
7. **Accessibility** - ARIA landmarks, skip links, keyboard navigation

### Complete Workflow Tests (`complete-workflow.spec.ts`)
- Comprehensive COI workflow API tests
- Multi-role user interactions
- Status transition verification

## 🚀 Running Tests Locally

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium
```

### Run All E2E Tests
```bash
pnpm test:e2e
```

### Run with UI Mode (Interactive)
```bash
pnpm test:e2e:ui
```

### Run in Headed Mode (See Browser)
```bash
pnpm test:e2e:headed
```

### Debug Tests
```bash
pnpm test:e2e:debug
```

### View Test Report
```bash
pnpm test:e2e:report
```

## 📋 Screenshot Configuration

Screenshots are configured in `playwright.config.ts`:
```typescript
use: {
  screenshot: 'on',        // Capture on every action
  video: 'on',            // Record video of all tests
  trace: 'on-first-retry', // Detailed trace on retry
}
```

## 🔍 Viewing Screenshots in PR

All screenshots are automatically:
1. Captured during test execution
2. Saved to `docs/e2e-screenshots/`
3. Committed to the repository
4. Visible in PR diffs for review

To view screenshots:
- Check the `docs/e2e-screenshots/` directory in the PR
- Each test has its own subdirectory
- Screenshots are numbered sequentially (001-, 002-, etc.)
- Console logs are in `console.log` and `console-summary.txt`

## 🐛 Debugging Failed Tests

When a test fails:

1. **Check Screenshots** - Visual evidence of what went wrong
2. **Review Console Logs** - Look for JavaScript errors
3. **Check Console Summary** - See error/warning counts
4. **View Video Recording** - Available in `test-results/`
5. **Check Trace** - Detailed execution trace in `test-results/`

## 📝 Adding New Tests

To add new E2E tests with screenshots:

```typescript
import { test, expect } from '@playwright/test';
import { ScreenshotHelper } from './screenshot-helper';

test('My new test', async ({ page }) => {
  // Create screenshot helper
  const screenshots = new ScreenshotHelper('my-new-test');
  
  // Start console monitoring
  screenshots.startConsoleMonitoring(page);
  
  // Navigate to page
  await page.goto('/');
  await screenshots.capture(page, 'initial-load', true);
  
  // ... your test steps ...
  await screenshots.capture(page, 'after-action');
  
  // Save console summary
  screenshots.saveConsoleSummary();
  
  console.log(`Test completed with ${screenshots.getCount()} screenshots`);
  console.log(screenshots.getConsoleSummary());
});
```

## 🎭 CI/CD Integration

E2E tests run automatically in GitHub Actions:
- ✅ On every push to main/develop
- ✅ On every pull request
- ✅ Daily at 2 AM UTC (scheduled)
- ✅ On manual trigger (workflow_dispatch)

See `.github/workflows/e2e-tests.yml` for configuration.

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Configuration](../../playwright.config.ts)
- [GitHub Workflow](../../.github/workflows/e2e-tests.yml)
- [Main README](../../README.md#-testing)
