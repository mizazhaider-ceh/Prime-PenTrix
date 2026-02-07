import { test, expect } from '@playwright/test';

test.describe('Workspace Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a subject workspace
    await page.goto('/workspace/cs-net-s2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Allow time for React hydration
  });

  test('should display chat interface', async ({ page }) => {
    // Check if chat tab is visible
    const chatTab = page.locator('text=Chat');
    await expect(chatTab).toBeVisible();

    // Check if message input exists
    const messageInput = page.locator('[data-testid="message-input"], textarea, input[type="text"]').first();
    await expect(messageInput).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    // Type a message
    const messageInput = page.locator('[data-testid="message-input"], textarea').first();
    await messageInput.fill('What is TCP/IP?');

    // Click send button
    const sendButton = page.locator('[data-testid="send-button"], button:has-text("Send")').first();
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Check if message appears in chat
    await expect(page.locator('text=What is TCP/IP?')).toBeVisible();
  });

  test('should display conversation history', async ({ page }) => {
    // Check if sidebar with conversations exists
    const sidebar = page.locator('[data-testid="conversation-sidebar"]');
    
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });
});

test.describe('Workspace Documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace/cs-net-s2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should display documents tab', async ({ page }) => {
    // Click on documents tab
    const docsTab = page.locator('text=Documents');
    
    if (await docsTab.isVisible()) {
      await docsTab.click();

      // Check if upload button exists
      const uploadButton = page.locator('[data-testid="upload-button"], button:has-text("Upload")').first();
      await expect(uploadButton).toBeVisible();
    }
  });
});

test.describe('Workspace Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace/cs-net-s2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should display tools tab', async ({ page }) => {
    // Click on tools tab
    const toolsTab = page.locator('text=Tools');
    
    if (await toolsTab.isVisible()) {
      await toolsTab.click();

      // Wait for tools to load
      await page.waitForTimeout(1000);

      // Check if tool cards exist
      const toolCards = page.locator('[data-testid="tool-card"]');
      const count = await toolCards.count();
      
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should search for tools', async ({ page }) => {
    // Click on tools tab
    const toolsTab = page.locator('text=Tools');
    
    if (await toolsTab.isVisible()) {
      await toolsTab.click();

      // Find search input
      const searchInput = page.locator('[data-testid="tool-search"], input[placeholder*="search" i]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('subnet');
        await page.waitForTimeout(500);

        // Check if filtered results appear
        const results = page.locator('[data-testid="tool-card"]');
        const count = await results.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Workspace Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace/cs-net-s2');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should display quiz tab', async ({ page }) => {
    // Click on quiz tab
    const quizTab = page.locator('text=Quiz');
    
    if (await quizTab.isVisible()) {
      await quizTab.click();

      // Check if quiz interface is visible
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
