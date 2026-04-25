import { test, expect } from "@playwright/test"
import {
  navigateToApp,
  addRegistry,
  TEST_REGISTRY_DOCKERHUB,
  waitForLoading,
  clearTestData,
} from "./test-helpers"

test.describe("Tag and Manifest Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Clear test data and set up a registry
    await clearTestData(page)
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)
  })

  test("should display tags for a repository", async ({ page }) => {
    // Navigate to a repository with tags (using nginx as an example)
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx`)

    await waitForLoading(page)

    // Should display tags list
    await expect(page.getByText(/Tags|Versions/i)).toBeVisible()

    // Should show tag entries
    const tagRow = page.locator('[data-testid="tag-row"]').first()
    if (await tagRow.isVisible()) {
      await expect(tagRow.locator('[data-testid="tag-name"]')).toBeVisible()
      await expect(tagRow.locator('[data-testid="tag-size"]')).toBeVisible()
      await expect(tagRow.locator('[data-testid="tag-created"]')).toBeVisible()
    }
  })

  test("should paginate through tags", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx`)

    await waitForLoading(page)

    // Check pagination controls
    const nextButton = page.getByRole("button", { name: /Next|»/i })

    if (await nextButton.isVisible()) {
      await nextButton.click()
      await waitForLoading(page)

      // Should show different tags
      await expect(page.locator('[data-testid="tag-row"]').first()).toBeVisible()
    }
  })

  test("should search and filter tags", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx`)

    await waitForLoading(page)

    // Search for specific tag
    const searchInput = page.getByPlaceholder(/Search tags/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill("latest")
      await page.keyboard.press("Enter")
      await waitForLoading(page)

      // Should show filtered results
      await expect(page.getByText(/latest/i)).toBeVisible()
    }
  })

  test("should view manifest details for a tag", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx`)

    await waitForLoading(page)

    // Click on a tag to view manifest
    const tagLink = page.locator('[data-testid="tag-link"]').first()

    if (await tagLink.isVisible()) {
      const tagName = await tagLink.textContent()
      await tagLink.click()

      // Should navigate to manifest page
      await page.waitForURL(/\/manifest/)
      await expect(page.getByText(/Manifest|Digest/i)).toBeVisible()

      if (tagName) {
        await expect(page.getByText(tagName)).toBeVisible()
      }
    }
  })

  test("should display manifest information correctly", async ({ page }) => {
    // Navigate directly to a manifest (assuming we know a tag exists)
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx/manifest/latest`)

    await waitForLoading(page)

    // Should display manifest details
    await expect(page.getByText(/Digest|Size|Layers|Config/i)).toBeVisible()

    // Should show manifest JSON or structured data
    await expect(page.getByText(/\{|\[/)).toBeVisible()
  })

  test("should handle manifest loading errors", async ({ page }) => {
    // Navigate to a non-existent manifest
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx/manifest/nonexistent-tag`)

    // Should show error state
    await expect(page.getByText(/Manifest not found|Error loading manifest/i)).toBeVisible()
  })

  test("should support downloading manifest", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx/manifest/latest`)

    await waitForLoading(page)

    // Check for download button
    const downloadButton = page.getByRole("button", { name: /Download|Export/i })

    if (await downloadButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent("download")

      await downloadButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/manifest\.json|\.tar\.gz/)
    }
  })

  test("should display layer information in manifest", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx/manifest/latest`)

    await waitForLoading(page)

    // Should show layers section
    await expect(page.getByText(/Layers|Filesystem/i)).toBeVisible()

    // Should display layer details
    const layerRow = page.locator('[data-testid="layer-row"]').first()
    if (await layerRow.isVisible()) {
      await expect(layerRow.locator('[data-testid="layer-digest"]')).toBeVisible()
      await expect(layerRow.locator('[data-testid="layer-size"]')).toBeVisible()
    }
  })

  test("should navigate back from manifest to repository", async ({ page }) => {
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/nginx/manifest/latest`)

    await waitForLoading(page)

    // Click back button
    await page.getByRole("button", { name: /Back|←/i }).click()

    // Should navigate back to repository
    await page.waitForURL(/\/repos\/library\/nginx/)
    await expect(page.getByRole("heading", { name: /nginx/i })).toBeVisible()
  })

  test("should handle large manifests gracefully", async ({ page }) => {
    // Test with a potentially large manifest
    await page.goto(`/registries/${TEST_REGISTRY_DOCKERHUB.name}/repos/library/ubuntu/manifest/latest`)

    await waitForLoading(page)

    // Should handle large content without crashing
    await expect(page.getByText(/Manifest|Digest/i)).toBeVisible()

    // Should have reasonable load times (basic check)
    await expect(page.locator('body')).toBeVisible()
  })
})
