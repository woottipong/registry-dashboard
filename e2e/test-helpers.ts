import { Page, expect } from "@playwright/test"

/**
 * Test utilities and helpers for Registry Dashboard E2E tests
 */

// Test configuration
const TEST_CONFIG = {
  timeouts: {
    navigation: 10000,
    action: 5000,
    loading: 15000,
  },
  retries: {
    deleteOperation: 3,
  },
} as const

// Registry test data with unique identifiers
export const createTestRegistry = (name: string, url: string, authType: "none" | "basic" | "bearer" = "none") => ({
  name: `${name}-${Date.now()}`, // Make names unique
  url,
  authType,
})

export const TEST_REGISTRY = createTestRegistry("Test Registry", "http://localhost:5000")
export const TEST_REGISTRY_DOCKERHUB = createTestRegistry("Docker Hub Test", "https://registry-1.docker.io")

/**
 * Navigate to the application and wait for it to load with better error handling
 */
export async function navigateToApp(page: Page) {
  try {
    await page.goto("/", { waitUntil: "networkidle", timeout: TEST_CONFIG.timeouts.navigation })
    await expect(page).toHaveTitle(/Registry Dashboard/, { timeout: TEST_CONFIG.timeouts.action })
  } catch (error) {
    throw new Error(`Failed to navigate to app: ${error instanceof Error ? error.message : error}`)
  }
}

/**
 * Add a registry through the UI with better error handling and validation
 */
export async function addRegistry(page: Page, registry: ReturnType<typeof createTestRegistry>) {
  try {
    await page.goto("/registries/new", { waitUntil: "networkidle" })

    await page.getByLabel(/Name/i).fill(registry.name)
    await page.getByLabel(/URL/i).fill(registry.url)

    if (registry.authType !== "none") {
      await page.getByLabel(/Authentication Type/i).selectOption(registry.authType)
      // Add auth configuration if needed
    }

    await page.getByRole("button", { name: /Save/i }).click()
    await page.waitForURL("/registries", { timeout: TEST_CONFIG.timeouts.navigation })

    // Verify registry appears in list with retry
    await expect(page.getByText(registry.name)).toBeVisible({ timeout: TEST_CONFIG.timeouts.action })
  } catch (error) {
    throw new Error(`Failed to add registry ${registry.name}: ${error instanceof Error ? error.message : error}`)
  }
}

/**
 * Delete a registry by name with better error handling and retries
 */
export async function deleteRegistry(page: Page, registryName: string) {
  let lastError: unknown

  for (let attempt = 1; attempt <= TEST_CONFIG.retries.deleteOperation; attempt++) {
    try {
      await page.goto("/registries", { waitUntil: "networkidle" })

      // Wait for registries to load
      await page.waitForTimeout(1000)

      // Find the registry row and click delete
      const registryRow = page.locator('[data-testid="registry-row"]').filter({
        hasText: registryName,
      })

      // Wait for the row to be visible
      await expect(registryRow).toBeVisible({ timeout: TEST_CONFIG.timeouts.action })

      const deleteButton = registryRow.locator('[data-testid="delete-registry"], [aria-label*="delete"], button:has-text("Delete")').first()
      await expect(deleteButton).toBeVisible({ timeout: TEST_CONFIG.timeouts.action })
      await deleteButton.click()

      // Confirm deletion
      const confirmButton = page.getByRole("button", { name: /Delete|Confirm/i }).first()
      await expect(confirmButton).toBeVisible({ timeout: TEST_CONFIG.timeouts.action })
      await confirmButton.click()

      // Wait for deletion to complete and verify
      await page.waitForTimeout(1000)
      await expect(page.getByText(registryName)).not.toBeVisible({ timeout: TEST_CONFIG.timeouts.action })

      return // Success
    } catch (error) {
      lastError = error
      console.warn(`Delete attempt ${attempt} failed for registry ${registryName}:`, error)

      if (attempt < TEST_CONFIG.retries.deleteOperation) {
        await page.waitForTimeout(1000 * attempt) // Exponential backoff
      }
    }
  }

  throw new Error(`Failed to delete registry ${registryName} after ${TEST_CONFIG.retries.deleteOperation} attempts: ${lastError instanceof Error ? lastError.message : lastError}`)
}

/**
 * Wait for loading states to complete with better detection
 */
export async function waitForLoading(page: Page) {
  try {
    await page.waitForFunction(() => {
      // Check for common loading indicators
      const loadingElements = document.querySelectorAll('[aria-busy="true"], .animate-pulse, .loading, [data-loading="true"]')
      const skeletonElements = document.querySelectorAll('[data-skeleton], .skeleton')
      return loadingElements.length === 0 && skeletonElements.length === 0
    }, { timeout: TEST_CONFIG.timeouts.loading })
  } catch (error) {
    console.warn("Loading detection timed out, continuing test:", error)
  }
}

/**
 * Clear all test data with better reliability
 */
export async function clearTestData(page: Page) {
  try {
    await page.goto("/registries", { waitUntil: "networkidle" })

    // Wait for page to stabilize
    await page.waitForTimeout(2000)

    let hasRegistries = true
    let attempts = 0
    const maxAttempts = 10

    while (hasRegistries && attempts < maxAttempts) {
      attempts++

      try {
        // Look for delete buttons with multiple selectors
        const deleteButtons = page.locator(`
          [data-testid="delete-registry"],
          button[aria-label*="delete" i],
          button:has-text("Delete"),
          button:has-text("Remove")
        `)

        const count = await deleteButtons.count()

        if (count === 0) {
          hasRegistries = false
          break
        }

        console.log(`Found ${count} registries to delete, deleting first one...`)

        // Delete first available registry
        const firstDeleteButton = deleteButtons.first()
        await expect(firstDeleteButton).toBeVisible({ timeout: 5000 })
        await firstDeleteButton.click()

        // Confirm deletion
        const confirmButton = page.getByRole("button", { name: /Delete|Confirm|Remove/i }).first()
        await expect(confirmButton).toBeVisible({ timeout: 5000 })
        await confirmButton.click()

        // Wait for deletion to complete
        await page.waitForTimeout(2000)

      } catch (error) {
        console.warn(`Error during registry cleanup attempt ${attempts}:`, error)
        await page.waitForTimeout(1000)
      }
    }

    if (hasRegistries) {
      console.warn(`Could not clean up all test data after ${maxAttempts} attempts`)
    }

  } catch (error) {
    console.error("Failed to clear test data:", error)
    throw error
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
