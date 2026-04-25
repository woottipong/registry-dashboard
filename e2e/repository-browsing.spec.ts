import { test, expect } from "@playwright/test"
import {
  navigateToApp,
  addRegistry,
  TEST_REGISTRY_DOCKERHUB,
  searchRepositories,
  navigateToRepository,
  waitForLoading,
  clearTestData,
} from "./test-helpers"

test.describe("Repository Browsing", () => {
  test.beforeEach(async ({ page }) => {
    // Clear test data and set up a registry with repositories
    await clearTestData(page)
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)
  })

  test("should display repositories list for a registry", async ({ page }) => {
    await page.goto("/registries")

    // Click on the registry to view repositories
    await page.getByText(TEST_REGISTRY_DOCKERHUB.name).click()

    // Should navigate to repositories page
    await page.waitForURL(/\/registries\/.*\/repos/)
    await waitForLoading(page)

    // Should display repositories or empty state
    await expect(page.getByText(/Repositories|No repositories found/i)).toBeVisible()
  })

  test("should paginate through repositories", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos`)

    // Wait for repositories to load
    await waitForLoading(page)

    // Check if pagination controls are present
    const nextButton = page.getByRole("button", { name: /Next|»/i })
    const prevButton = page.getByRole("button", { name: /Previous|«/i })

    // If repositories exist, test pagination
    if (await nextButton.isVisible()) {
      // Click next page
      await nextButton.click()
      await waitForLoading(page)

      // Should show different repositories or last page
      await expect(page.getByText(/Page \d+|No more repositories/i)).toBeVisible()

      // Go back to previous page
      if (await prevButton.isVisible()) {
        await prevButton.click()
        await waitForLoading(page)
      }
    }
  })

  test("should search repositories by name", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos`)

    // Wait for initial load
    await waitForLoading(page)

    // Search for a specific repository (using a common one)
    await searchRepositories(page, "nginx")

    // Should show filtered results
    await expect(page.getByText(/nginx/i)).toBeVisible()

    // Search for non-existent repository
    await searchRepositories(page, "nonexistent-repo-12345")

    // Should show empty state or no results
    await expect(page.getByText(/No repositories found|No results/i)).toBeVisible()
  })

  test("should display repository metadata", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos`)

    await waitForLoading(page)

    // Find a repository row
    const repoRow = page.locator('[data-testid="repository-row"]').first()

    if (await repoRow.isVisible()) {
      // Should display repository name
      await expect(repoRow.locator('[data-testid="repo-name"]')).toBeVisible()

      // Should display last updated or other metadata
      await expect(repoRow.locator('[data-testid="repo-meta"]')).toBeVisible()

      // Should have action buttons (view tags, etc.)
      await expect(repoRow.locator('[data-testid="repo-actions"]')).toBeVisible()
    }
  })

  test("should navigate to repository details", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos`)

    await waitForLoading(page)

    // Find and click on a repository
    const repoLink = page.locator('[data-testid="repository-link"]').first()

    if (await repoLink.isVisible()) {
      const repoName = await repoLink.textContent()
      await repoLink.click()

      // Should navigate to repository details
      await page.waitForURL(/\/repos\/.*/)
      await expect(page.getByRole("heading", { name: repoName || "" })).toBeVisible()
    }
  })

  test("should handle repository loading states", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos`)

    // Should show loading state initially
    await expect(page.getByTestId("loading-spinner")).toBeVisible()

    // Should hide loading state after data loads
    await waitForLoading(page)
    await expect(page.getByTestId("loading-spinner")).not.toBeVisible()
  })

  test("should handle repository load errors gracefully", async ({ page }) => {
    // Create a registry with invalid URL to simulate error
    const invalidRegistry = {
      name: "Broken Registry",
      url: "http://broken-registry:5000",
      authType: "none" as const,
    }

    await addRegistry(page, invalidRegistry)

    await page.goto(`/registries/${invalidRegistry.name}/repos`)

    // Should show error state
    await expect(page.getByText(/Failed to load repositories|Connection error/i)).toBeVisible()

    // Should provide retry option
    await expect(page.getByRole("button", { name: /Retry|Try Again/i })).toBeVisible()
  })

  test("should sort repositories by different criteria", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos`)

    await waitForLoading(page)

    // Check for sort options
    const sortSelect = page.getByLabel(/Sort by/i)

    if (await sortSelect.isVisible()) {
      // Test different sort options
      await sortSelect.selectOption("name")
      await waitForLoading(page)

      await sortSelect.selectOption("updated")
      await waitForLoading(page)

      // Should maintain sort order
      await expect(page.locator('[data-testid="repository-row"]').first()).toBeVisible()
    }
  })

  test("should filter repositories by various criteria", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos`)

    await waitForLoading(page)

    // Check for filter options
    const filterButton = page.getByRole("button", { name: /Filter|Filters/i })

    if (await filterButton.isVisible()) {
      await filterButton.click()

      // Test filter options (these would be specific to the UI)
      const officialFilter = page.getByLabel(/Official/i)
      if (await officialFilter.isVisible()) {
        await officialFilter.check()
        await waitForLoading(page)
      }
    }
  })

  test("should support keyboard navigation in repository list", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos`)

    await waitForLoading(page)

    // Test keyboard navigation
    await page.keyboard.press("Tab")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    // Should navigate to selected repository
    await page.waitForURL(/\/repos\/.*/)
  })

  test("should handle empty repository state", async ({ page }) => {
    // Create a registry that will have no repositories
    const emptyRegistry = {
      name: "Empty Registry",
      url: "http://empty-registry:5000",
      authType: "none" as const,
    }

    await addRegistry(page, emptyRegistry)

    await page.goto(`/registries/${emptyRegistry.name}/repos`)

    // Should show empty state
    await expect(page.getByText(/No repositories found|Empty registry/i)).toBeVisible()

    // Should provide guidance or next steps
    await expect(page.getByText(/Add your first repository|Get started/i)).toBeVisible()
  })
})
