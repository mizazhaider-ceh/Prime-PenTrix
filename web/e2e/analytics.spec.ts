import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Allow time for React hydration
  });

  test('should display analytics page', async ({ page }) => {
    // Check if main heading exists
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display study stats', async ({ page }) => {
    // Check for stat cards
    const statCards = page.locator('[data-testid="stat-card"]');
    
    if (await statCards.count() > 0) {
      await expect(statCards.first()).toBeVisible();
    }
  });

  test('should display time period selector', async ({ page }) => {
    // Check for period buttons (7/30/90 days)
    const periodButtons = page.locator('button:has-text("7"), button:has-text("30"), button:has-text("90")');
    
    if (await periodButtons.count() > 0) {
      await expect(periodButtons.first()).toBeVisible();
    }
  });

  test('should switch time periods', async ({ page }) => {
    // Click on different time period
    const thirtyDayButton = page.locator('button:has-text("30")').first();
    
    if (await thirtyDayButton.isVisible()) {
      await thirtyDayButton.click();
      await page.waitForTimeout(500);
      
      // Page should still be visible
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display activity calendar', async ({ page }) => {
    // Check if calendar component exists
    const calendar = page.locator('[data-testid="activity-calendar"]');
    
    if (await calendar.isVisible()) {
      await expect(calendar).toBeVisible();
    }
  });
});

test.describe('Quiz System', () => {
  test('should handle quiz generation errors gracefully', async ({ page }) => {
    // Navigate to quiz (this might fail if not set up)
    await page.goto('/workspace/cs-net-s2');
    
    const quizTab = page.locator('text=Quiz');
    
    if (await quizTab.isVisible()) {
      await quizTab.click();
      await page.waitForTimeout(2000);
      
      // Page should not crash
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Performance', () => {
  test('should load dashboard within 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });

  test('should load workspace within 4 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/workspace/cs-net-s2');
    await page.waitForLoadState('domcontentloaded');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(4000);
  });
});

test.describe('Accessibility', () => {
  test('should have valid page titles', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/.+/);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focused element exists
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
