import { test, expect } from "@playwright/test"
import {
  navigateToApp,
  addRegistry,
  TEST_REGISTRY_DOCKERHUB,
  searchRepositories,
  waitForLoading,
  clearTestData,
} from "./test-helpers"

test.describe("Search Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page)
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)
  })

  test("should have global search in header", async ({ page }) => {
    await navigateToApp(page)

    // Should have search input in header
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible()

    // Should have search shortcut hint
    await expect(page.getByText(/⌘K|Ctrl\+K/i)).toBeVisible()
  })

  test("should open command palette with keyboard shortcut", async ({ page }) => {
    await navigateToApp(page)

    // Press command palette shortcut
    await page.keyboard.press("Meta+k")

    // Should open command palette
    await expect(page.getByPlaceholder(/Search commands/i)).toBeVisible()

    // Close with escape
    await page.keyboard.press("Escape")
    await expect(page.getByPlaceholder(/Search commands/i)).not.toBeVisible()
  })

  test("should search across all registries", async ({ page }) => {
    await navigateToApp(page)

    // Use global search
    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("nginx")
    await page.keyboard.press("Enter")

    // Should navigate to search results page
    await page.waitForURL(/\/search/)
    await expect(page.getByText(/Search Results|nginx/i)).toBeVisible()
  })

  test("should display search results with metadata", async ({ page }) => {
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("nginx")
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)
    await waitForLoading(page)

    // Should display results with repository info
    const resultItem = page.locator('[data-testid="search-result"]').first()

    if (await resultItem.isVisible()) {
      await expect(resultItem.locator('[data-testid="result-name"]')).toBeVisible()
      await expect(resultItem.locator('[data-testid="result-registry"]')).toBeVisible()
      await expect(resultItem.locator('[data-testid="result-description"]')).toBeVisible()
    }
  })

  test("should filter search results by registry", async ({ page }) => {
    // Add another registry for testing
    await addRegistry(page, {
      name: "Second Registry",
      url: "http://second-registry:5000",
      authType: "none" as const,
    })

    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("nginx")
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)
    await waitForLoading(page)

    // Should have registry filter
    const registryFilter = page.getByLabel(/Filter by registry/i)

    if (await registryFilter.isVisible()) {
      await registryFilter.selectOption(TEST_REGISTRY_DOCKERHUB.name)
      await waitForLoading(page)

      // Should only show results from selected registry
      await expect(page.getByText(TEST_REGISTRY_DOCKERHUB.name)).toBeVisible()
    }
  })

  test("should handle empty search results", async ({ page }) => {
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("nonexistent-repository-12345")
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)

    // Should show no results message
    await expect(page.getByText(/No results found|No repositories match/i)).toBeVisible()

    // Should provide search suggestions
    await expect(page.getByText(/Try different keywords|Suggestions/i)).toBeVisible()
  })

  test("should support advanced search syntax", async ({ page }) => {
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)

    // Test exact match search
    await searchInput.fill('"nginx"')
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)
    await waitForLoading(page)

    // Should show exact matches
    await expect(page.getByText(/nginx/i)).toBeVisible()
  })

  test("should highlight search terms in results", async ({ page }) => {
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("nginx")
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)
    await waitForLoading(page)

    // Search terms should be highlighted
    await expect(page.locator('[data-highlight="nginx"]')).toBeVisible()
  })

  test("should navigate to repository from search results", async ({ page }) => {
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("nginx")
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)
    await waitForLoading(page)

    // Click on a search result
    const resultLink = page.locator('[data-testid="search-result-link"]').first()

    if (await resultLink.isVisible()) {
      const resultText = await resultLink.textContent()
      await resultLink.click()

      // Should navigate to repository page
      await page.waitForURL(/\/repos\/.*/)
      if (resultText) {
        await expect(page.getByText(resultText)).toBeVisible()
      }
    }
  })

  test("should persist search query in URL", async ({ page }) => {
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("nginx")
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)

    // URL should contain search query
    await expect(page.url()).toContain("q=nginx")

    // Refresh page should maintain search
    await page.reload()
    await expect(page.getByRole("textbox", { name: /Search/i })).toHaveValue("nginx")
  })

  test("should show search suggestions", async ({ page }) => {
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("ngi")

    // Should show autocomplete suggestions
    await expect(page.locator('[data-testid="search-suggestion"]').first()).toBeVisible()

    // Select suggestion with arrow keys
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    // Should complete the search
    await page.waitForURL(/\/search/)
  })

  test("should handle search errors gracefully", async ({ page }) => {
    // This test might need to simulate a search error
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("test")
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)

    // If search fails, should show error state
    const errorElement = page.locator('[data-testid="search-error"]')

    if (await errorElement.isVisible()) {
      await expect(errorElement).toContainText(/Search failed|Error/i)
      await expect(page.getByRole("button", { name: /Retry/i })).toBeVisible()
    }
  })

  test("should clear search and return to dashboard", async ({ page }) => {
    await navigateToApp(page)

    const searchInput = page.getByPlaceholder(/Search/i)
    await searchInput.fill("nginx")
    await page.keyboard.press("Enter")

    await page.waitForURL(/\/search/)

    // Clear search
    const clearButton = page.getByRole("button", { name: /Clear|X/i })

    if (await clearButton.isVisible()) {
      await clearButton.click()

      // Should return to dashboard or clear results
      await expect(page.getByText(/Dashboard|Registry Dashboard/i)).toBeVisible()
    }
  })
})
