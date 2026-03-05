import { test, expect } from "@playwright/test"
import {
  navigateToApp,
  addRegistry,
  TEST_REGISTRY_DOCKERHUB,
  verifyDashboardStats,
  waitForLoading,
  clearTestData,
} from "./test-helpers"

test.describe("Dashboard Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page)
  })

  test("should display dashboard with statistics cards", async ({ page }) => {
    await navigateToApp(page)

    // Should display main dashboard
    await expect(page.getByRole("heading", { name: /Dashboard|Registry Dashboard/i })).toBeVisible()

    // Should show statistics cards
    await verifyDashboardStats(page)
  })

  test("should update statistics when registries are added", async ({ page }) => {
    await navigateToApp(page)

    // Initial stats (should be 0 or empty)
    const initialRegistriesCount = await page.getByText(/Registries/).locator("..").locator('[data-testid="stat-value"]').textContent()

    // Add a registry
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)

    // Navigate back to dashboard
    await page.goto("/")

    // Stats should be updated
    await expect(page.getByText("1")).toBeVisible() // Registries count should be 1
  })

  test("should display activity feed", async ({ page }) => {
    await navigateToApp(page)

    // Should show recent activities section
    await expect(page.getByText(/Recent Activities|Activity Feed/i)).toBeVisible()

    // Should display activity items or empty state
    await expect(page.getByText(/No recent activities|Activity list/i)).toBeVisible()
  })

  test("should log activities when performing actions", async ({ page }) => {
    await navigateToApp(page)

    // Initially should have no activities or show empty state
    await expect(page.getByText(/No activities yet|No recent activities/i)).toBeVisible()

    // Perform an action that creates activity
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)

    // Navigate back to dashboard
    await page.goto("/")

    // Should show the registry creation activity
    await expect(page.getByText(/Registry.*created|Added.*registry/i)).toBeVisible()
    await expect(page.getByText(TEST_REGISTRY_DOCKERHUB.name)).toBeVisible()
  })

  test("should display registry status indicators", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)

    await navigateToApp(page)

    // Should show registry status
    await expect(page.getByText(/Online|Offline|Connecting|Error/i)).toBeVisible()

    // Should show registry names
    await expect(page.getByText(TEST_REGISTRY_DOCKERHUB.name)).toBeVisible()
  })

  test("should handle loading states for statistics", async ({ page }) => {
    await navigateToApp(page)

    // Should show loading states initially
    await expect(page.locator('[data-testid="stats-loading"]')).toBeVisible()

    // Should hide loading after data loads
    await waitForLoading(page)
    await expect(page.locator('[data-testid="stats-loading"]')).not.toBeVisible()
  })

  test("should refresh statistics on demand", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)

    await navigateToApp(page)

    // Find refresh button
    const refreshButton = page.getByRole("button", { name: /Refresh|Reload/i })

    if (await refreshButton.isVisible()) {
      await refreshButton.click()

      // Should show loading state during refresh
      await expect(page.locator('[data-testid="refreshing"]')).toBeVisible()

      // Should complete refresh
      await waitForLoading(page)
      await expect(page.locator('[data-testid="refreshing"]')).not.toBeVisible()
    }
  })

  test("should display quick actions or shortcuts", async ({ page }) => {
    await navigateToApp(page)

    // Should show quick action buttons
    await expect(page.getByRole("button", { name: /Add Registry|Create Registry/i })).toBeVisible()

    // Should have navigation links
    await expect(page.getByRole("link", { name: /Registries|Repositories/i })).toBeVisible()
  })

  test("should navigate to registry details from dashboard", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)

    await navigateToApp(page)

    // Click on registry in dashboard
    await page.getByText(TEST_REGISTRY_DOCKERHUB.name).click()

    // Should navigate to registry details
    await page.waitForURL(/\/registries\/.*/)
    await expect(page.getByRole("heading", { name: TEST_REGISTRY_DOCKERHUB.name })).toBeVisible()
  })

  test("should handle error states gracefully", async ({ page }) => {
    // Navigate to dashboard with no backend (simulate error)
    await navigateToApp(page)

    // If there's an error loading stats, should show error state
    const errorElement = page.locator('[data-testid="stats-error"]')

    // This test might need adjustment based on actual error handling
    if (await errorElement.isVisible()) {
      await expect(errorElement).toContainText(/Failed to load|Error loading/i)
      await expect(page.getByRole("button", { name: /Retry|Try Again/i })).toBeVisible()
    }
  })

  test("should display real-time updates", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)

    await navigateToApp(page)

    // Get initial stats
    const initialStats = await page.locator('[data-testid="stat-value"]').first().textContent()

    // Open another tab and add another registry
    const newPage = await page.context().newPage()
    await addRegistry(newPage, {
      name: "Another Registry",
      url: "http://another-registry:5000",
      authType: "none" as const,
    })

    // Go back to original tab
    await page.bringToFront()
    await page.reload()

    // Stats should be updated (this might require real-time updates to work)
    await waitForLoading(page)
    const updatedStats = await page.locator('[data-testid="stat-value"]').first().textContent()

    // Should show updated count (if real-time works)
    expect(updatedStats).not.toBe(initialStats)
  })

  test("should be responsive on different screen sizes", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)

    await navigateToApp(page)

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Should still display stats cards
    await verifyDashboardStats(page)

    // Should have mobile-friendly navigation
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    // Should adapt to tablet layout
    await verifyDashboardStats(page)
  })
})
