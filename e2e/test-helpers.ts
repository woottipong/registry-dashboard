import { Page, expect } from "@playwright/test"

/**
 * Test utilities and helpers for Registry Dashboard E2E tests
 */

// Registry test data
export const TEST_REGISTRY = {
  name: "Test Registry",
  url: "http://localhost:5000",
  authType: "none" as const,
}

export const TEST_REGISTRY_DOCKERHUB = {
  name: "Docker Hub Test",
  url: "https://registry-1.docker.io",
  authType: "none" as const,
}

/**
 * Navigate to the application and wait for it to load
 */
export async function navigateToApp(page: Page) {
  await page.goto("/")
  await expect(page).toHaveTitle(/Registry Dashboard/)
}

/**
 * Add a registry through the UI
 */
export async function addRegistry(page: Page, registry: typeof TEST_REGISTRY) {
  await page.goto("/registries/new")

  await page.getByLabel(/Name/i).fill(registry.name)
  await page.getByLabel(/URL/i).fill(registry.url)

  if (registry.authType !== "none") {
    // Handle auth configuration if needed
    // This would be expanded based on auth types
  }

  await page.getByRole("button", { name: /Save/i }).click()
  await page.waitForURL("/registries")

  // Verify registry appears in list
  await expect(page.getByText(registry.name)).toBeVisible()
}

/**
 * Delete a registry by name
 */
export async function deleteRegistry(page: Page, registryName: string) {
  await page.goto("/registries")

  // Find the registry row and click delete
  const registryRow = page.locator('[data-testid="registry-row"]').filter({
    hasText: registryName,
  })

  await registryRow.locator('[data-testid="delete-registry"]').click()

  // Confirm deletion
  await page.getByRole("button", { name: /Delete/i }).click()

  // Verify registry is removed
  await expect(page.getByText(registryName)).not.toBeVisible()
}

/**
 * Wait for loading states to complete
 */
export async function waitForLoading(page: Page) {
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('[aria-busy="true"], .animate-pulse')
    return loadingElements.length === 0
  })
}

/**
 * Clear all test data
 */
export async function clearTestData(page: Page) {
  // This would need to be implemented based on how data is stored
  // For now, we'll use the UI to delete registries
  await page.goto("/registries")

  const deleteButtons = page.locator('[data-testid="delete-registry"]')
  const count = await deleteButtons.count()

  for (let i = 0; i < count; i++) {
    await deleteButtons.first().click()
    await page.getByRole("button", { name: /Delete/i }).click()
    await page.waitForTimeout(500) // Wait for deletion to complete
  }
}

/**
 * Search for repositories
 */
export async function searchRepositories(page: Page, query: string) {
  await page.getByPlaceholder(/Search repositories/i).fill(query)
  await page.keyboard.press("Enter")
  await waitForLoading(page)
}

/**
 * Navigate to a specific repository
 */
export async function navigateToRepository(page: Page, registryId: string, repoName: string) {
  await page.goto(`/registries/${registryId}/repos/${repoName}`)
  await expect(page.getByRole("heading", { name: repoName })).toBeVisible()
}

/**
 * Verify dashboard statistics are displayed
 */
export async function verifyDashboardStats(page: Page) {
  await expect(page.getByText(/Registries/i)).toBeVisible()
  await expect(page.getByText(/Repositories/i)).toBeVisible()
  await expect(page.getByText(/Total Tags/i)).toBeVisible()
  await expect(page.getByText(/Storage/i)).toBeVisible()
}
