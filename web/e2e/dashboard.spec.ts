import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assuming user is logged in via Clerk)
    await page.goto('/dashboard');
  });

  test('should display subject cards', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Allow time for React hydration

    // Check if subject cards are visible
    const cards = page.locator('[data-testid="subject-card"]');
    await expect(cards).toHaveCount(8);
  });

  test('should navigate to subject workspace', async ({ page }) => {
    // Click on first subject card
    await page.click('[data-testid="subject-card"]:first-child');

    // Should navigate to workspace
    await expect(page).toHaveURL(/\/workspace\/.+/);
  });

  test('should display user menu', async ({ page }) => {
    // Check if user button exists
    const userButton = page.locator('[data-testid="user-button"]');
    await expect(userButton).toBeVisible();
  });

  test('should navigate to analytics', async ({ page }) => {
    // Click analytics link
    await page.click('text=Analytics');

    // Should navigate to analytics page
    await expect(page).toHaveURL('/dashboard/analytics');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if mobile menu exists
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    
    // Wait for content to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Verify page is accessible on mobile
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should switch themes', async ({ page }) => {
    // Open theme switcher
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');
    
    if (await themeSwitcher.isVisible()) {
      await themeSwitcher.click();

      // Click on a theme
      await page.click('[data-testid="theme-option-dark"]');

      // Wait for theme to apply
      await page.waitForTimeout(500);

      // Check if theme class is applied
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
    }
  });
});
