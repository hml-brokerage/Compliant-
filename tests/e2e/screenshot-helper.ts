import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Console message for logging
 */
export interface ConsoleMessage {
  timestamp: string;
  type: string;
  text: string;
  location?: string;
}

/**
 * Helper class to capture screenshots at every step of E2E tests
 * Screenshots are saved to test-results/screenshots/ directory
 */
export class ScreenshotHelper {
  private screenshotCounter = 0;
  private screenshotDir: string;
  private testName: string;
  private consoleMessages: ConsoleMessage[] = [];
  private consoleLogPath: string;

  constructor(testName: string) {
    this.testName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    // Save to docs/e2e-screenshots/ so they're committed to the PR
    this.screenshotDir = path.join('docs', 'e2e-screenshots', this.testName);
    this.consoleLogPath = path.join(this.screenshotDir, 'console.log');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * Start monitoring console messages on the page
   * @param page Playwright page object
   */
  startConsoleMonitoring(page: Page): void {
    // Listen to all console events
    page.on('console', async (msg) => {
      const consoleMsg: ConsoleMessage = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location().url,
      };
      
      this.consoleMessages.push(consoleMsg);
      
      // Log to console with color coding
      const icon = this.getConsoleIcon(msg.type());
      console.log(`${icon} [${msg.type().toUpperCase()}] ${msg.text()}`);
      
      // Write to file immediately
      this.writeConsoleLog(consoleMsg);
    });

    // Listen to page errors
    page.on('pageerror', (error) => {
      const consoleMsg: ConsoleMessage = {
        timestamp: new Date().toISOString(),
        type: 'error',
        text: `PAGE ERROR: ${error.message}\n${error.stack}`,
      };
      
      this.consoleMessages.push(consoleMsg);
      console.log(`❌ [PAGE ERROR] ${error.message}`);
      this.writeConsoleLog(consoleMsg);
    });

    // Listen to request failures
    page.on('requestfailed', (request) => {
      const consoleMsg: ConsoleMessage = {
        timestamp: new Date().toISOString(),
        type: 'error',
        text: `REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`,
      };
      
      this.consoleMessages.push(consoleMsg);
      console.log(`🔴 [REQUEST FAILED] ${request.url()}`);
      this.writeConsoleLog(consoleMsg);
    });

    console.log('📡 Console monitoring started');
  }

  /**
   * Get an icon for console message type
   */
  private getConsoleIcon(type: string): string {
    const icons: Record<string, string> = {
      'log': '📝',
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'debug': '🐛',
      'trace': '🔍',
    };
    return icons[type] || '📋';
  }

  /**
   * Write console log to file
   */
  private writeConsoleLog(msg: ConsoleMessage): void {
    const logLine = `[${msg.timestamp}] [${msg.type.toUpperCase()}] ${msg.text}${msg.location ? ` (${msg.location})` : ''}\n`;
    fs.appendFileSync(this.consoleLogPath, logLine);
  }

  /**
   * Capture a screenshot with an auto-incremented number and description
   * @param page Playwright page object
   * @param description Description of the step (e.g., "after-login", "form-filled")
   * @param fullPage Whether to capture the full scrollable page
   */
  async capture(page: Page, description: string, fullPage = false): Promise<void> {
    this.screenshotCounter++;
    const paddedCounter = String(this.screenshotCounter).padStart(3, '0');
    const filename = `${paddedCounter}-${description.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await page.screenshot({ 
      path: filepath, 
      fullPage 
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  /**
   * Get all captured console messages
   */
  getConsoleMessages(): ConsoleMessage[] {
    return this.consoleMessages;
  }

  /**
   * Get console messages by type
   */
  getConsoleMessagesByType(type: string): ConsoleMessage[] {
    return this.consoleMessages.filter(msg => msg.type === type);
  }

  /**
   * Get console summary
   */
  getConsoleSummary(): string {
    const summary = {
      total: this.consoleMessages.length,
      log: this.getConsoleMessagesByType('log').length,
      info: this.getConsoleMessagesByType('info').length,
      warn: this.getConsoleMessagesByType('warn').length,
      error: this.getConsoleMessagesByType('error').length,
      debug: this.getConsoleMessagesByType('debug').length,
    };
    
    return `Console Summary: ${summary.total} messages (${summary.error} errors, ${summary.warn} warnings, ${summary.log} logs, ${summary.info} info, ${summary.debug} debug)`;
  }

  /**
   * Save console summary to file
   */
  saveConsoleSummary(): void {
    const summaryPath = path.join(this.screenshotDir, 'console-summary.txt');
    const summary = `
=== CONSOLE MONITORING SUMMARY ===
Test: ${this.testName}
Generated: ${new Date().toISOString()}

${this.getConsoleSummary()}

Breakdown by Type:
- Errors: ${this.getConsoleMessagesByType('error').length}
- Warnings: ${this.getConsoleMessagesByType('warn').length}
- Logs: ${this.getConsoleMessagesByType('log').length}
- Info: ${this.getConsoleMessagesByType('info').length}
- Debug: ${this.getConsoleMessagesByType('debug').length}

${this.consoleMessages.length > 0 ? '=== ALL MESSAGES ===\n' : ''}${this.consoleMessages.map(msg => 
  `[${msg.timestamp}] [${msg.type.toUpperCase()}] ${msg.text}`
).join('\n')}

=== END OF SUMMARY ===
`;
    
    fs.writeFileSync(summaryPath, summary);
    console.log(`📊 Console summary saved to: ${summaryPath}`);
  }

  /**
   * Get the total number of screenshots captured
   */
  getCount(): number {
    return this.screenshotCounter;
  }

  /**
   * Get the directory where screenshots are saved
   */
  getDirectory(): string {
    return this.screenshotDir;
  }
}

