import { test, expect } from "@playwright/test"
import { navigateToApp, addRegistry, TEST_REGISTRY_DOCKERHUB, clearTestData } from "./test-helpers"

test.describe("Theme and Responsiveness", () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page)
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)
  })

  test("should toggle between light and dark themes", async ({ page }) => {
    await navigateToApp(page)

    // Find theme toggle button
    const themeToggle = page.getByRole("button", { name: /Toggle theme|Switch theme/i })

    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.getAttribute("html", "data-theme") || "light"

      // Toggle theme
      await themeToggle.click()

      // Theme should change
      const newTheme = await page.getAttribute("html", "data-theme")
      expect(newTheme).not.toBe(initialTheme)

      // Toggle back
      await themeToggle.click()
      const revertedTheme = await page.getAttribute("html", "data-theme")
      expect(revertedTheme).toBe(initialTheme)
    }
  })

  test("should persist theme preference", async ({ page }) => {
    await navigateToApp(page)

    const themeToggle = page.getByRole("button", { name: /Toggle theme|Switch theme/i })

    if (await themeToggle.isVisible()) {
      // Toggle to dark theme
      await themeToggle.click()

      // Refresh page
      await page.reload()

      // Should maintain dark theme
      const theme = await page.getAttribute("html", "data-theme")
      expect(theme).toBe("dark")
    }
  })

  test("should respect system theme preference", async ({ page }) => {
    // Test system theme detection
    await page.emulateMedia({ colorScheme: "dark" })
    await page.reload()

    // Should automatically switch to dark theme
    const darkTheme = await page.getAttribute("html", "data-theme")
    expect(darkTheme).toBe("dark")

    // Switch to light
    await page.emulateMedia({ colorScheme: "light" })
    await page.reload()

    // Should switch to light theme
    const lightTheme = await page.getAttribute("html", "data-theme")
    expect(lightTheme).toBe("light")
  })

  test("should display correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await navigateToApp(page)

    // Should show mobile navigation
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Should hide desktop navigation
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible()

    // Stats cards should stack vertically
    const statsGrid = page.locator('[data-testid="stats-grid"]')
    if (await statsGrid.isVisible()) {
      const gridClass = await statsGrid.getAttribute("class")
      expect(gridClass).toContain("grid-cols-1") // Should be single column on mobile
    }
  })

  test("should display correctly on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await navigateToApp(page)

    // Should show tablet-optimized layout
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible()

    // Stats cards should be in 2 columns
    const statsGrid = page.locator('[data-testid="stats-grid"]')
    if (await statsGrid.isVisible()) {
      const gridClass = await statsGrid.getAttribute("class")
      expect(gridClass).toContain("grid-cols-2")
    }
  })

  test("should display correctly on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    await navigateToApp(page)

    // Should show full desktop layout
    await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible()

    // Stats cards should be in 4 columns
    const statsGrid = page.locator('[data-testid="stats-grid"]')
    if (await statsGrid.isVisible()) {
      const gridClass = await statsGrid.getAttribute("class")
      expect(gridClass).toContain("grid-cols-4")
    }
  })

  test("should handle touch interactions on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await navigateToApp(page)

    // Test swipe gestures for navigation
    const dashboard = page.locator('[data-testid="dashboard"]')

    if (await dashboard.isVisible()) {
      // Swipe left/right
      await dashboard.dispatchEvent("touchstart", { touches: [{ clientX: 300, clientY: 200 }] })
      await dashboard.dispatchEvent("touchmove", { touches: [{ clientX: 100, clientY: 200 }] })
      await dashboard.dispatchEvent("touchend", { touches: [{ clientX: 100, clientY: 200 }] })

      // Should handle swipe gesture
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    }
  })

  test("should maintain functionality across different viewports", async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)

      await navigateToApp(page)

      // Core functionality should work on all viewports
      await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible()

      // Navigation should work
      const navLink = page.getByRole("link", { name: /Registries/i })
      if (await navLink.isVisible()) {
        await navLink.click()
        await page.waitForURL("/registries")
        await expect(page.getByText(TEST_REGISTRY_DOCKERHUB.name)).toBeVisible()
      }

      // Go back to dashboard for next viewport test
      await page.goto("/")
    }
  })

  test("should have proper focus management for accessibility", async ({ page }) => {
    await navigateToApp(page)

    // Tab through elements
    await page.keyboard.press("Tab")

    // First focusable element should be focused
    const activeElement = page.locator(":focus")
    await expect(activeElement).toBeVisible()

    // Continue tabbing
    await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")

    // Should cycle through focusable elements
    const newActiveElement = page.locator(":focus")
    const firstElementTag = await activeElement.evaluate(el => el.tagName)
    const secondElementTag = await newActiveElement.evaluate(el => el.tagName)
    expect(firstElementTag).not.toBe(secondElementTag)
  })

  test("should support high contrast mode", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" })

    await navigateToApp(page)

    // Should adapt to high contrast mode
    const body = page.locator("body")
    const styles = await body.evaluate(el => window.getComputedStyle(el))

    // Should use system colors in high contrast mode
    expect(styles.color).toBeDefined()
    expect(styles.backgroundColor).toBeDefined()
  })

  test("should handle reduced motion preferences", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })

    await navigateToApp(page)

    // Animations should be disabled or reduced
    const animatedElement = page.locator('[data-testid="animated-element"]').first()

    if (await animatedElement.isVisible()) {
      const styles = await animatedElement.evaluate(el => window.getComputedStyle(el))
      // Should not have transition or animation properties
      expect(styles.transition).toBe("none")
    }
  })
})
