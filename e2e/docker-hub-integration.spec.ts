import { test, expect } from "@playwright/test"
import {
  navigateToApp,
  addRegistry,
  deleteRegistry,
  searchRepositories,
  navigateToRepository,
  waitForLoading,
  clearTestData,
} from "./test-helpers"

test.describe("Docker Hub Integration", () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page)
  })

  test("should add Docker Hub registry with auto-detection", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Docker Hub")
    await page.getByLabel(/URL/i).fill("https://registry-1.docker.io")

    // Provider should auto-detect as dockerhub
    await expect(page.getByRole("combobox", { name: /Provider/i })).toHaveValue("dockerhub")

    // Auth type should default to basic for Docker Hub
    await expect(page.getByRole("radio", { name: /Basic/i })).toBeChecked()

    // Namespace should default to library
    await expect(page.getByLabel(/Namespace/i)).toHaveValue("library")

    await page.getByRole("button", { name: /Save/i }).click()
    await page.waitForURL("/registries")

    await expect(page.getByText("Docker Hub")).toBeVisible()
  })

  test("should browse Docker Hub public repositories", async ({ page }) => {
    // Add Docker Hub registry
    await addRegistry(page, {
      name: "Docker Hub Public",
      url: "https://registry-1.docker.io",
      authType: "none" as const,
    })

    await page.goto(`/registries/Docker Hub Public/repos`)
    await waitForLoading(page)

    // Should display public repositories
    await expect(page.getByText(/nginx|alpine|ubuntu/i)).toBeVisible()

    // Should show repository metadata
    const repoCard = page.locator('[data-testid="repository-row"]').first()
    await expect(repoCard).toBeVisible()

    // Should display star counts, pull counts, etc.
    await expect(repoCard.locator('[data-testid="repo-stars"], [data-testid="repo-pulls"]')).toBeVisible()
  })

  test("should search Docker Hub repositories", async ({ page }) => {
    await addRegistry(page, {
      name: "Docker Hub Search",
      url: "https://registry-1.docker.io",
      authType: "none" as const,
    })

    await page.goto(`/registries/Docker Hub Search/repos`)
    await waitForLoading(page)

    // Search for nginx
    await searchRepositories(page, "nginx")

    // Should show nginx-related results
    await expect(page.getByText(/nginx/i)).toBeVisible()

    // Should not show unrelated repositories
    await expect(page.getByText(/alpine/i)).not.toBeVisible()
  })

  test("should display repository tags with pagination", async ({ page }) => {
    await addRegistry(page, {
      name: "Docker Hub Tags",
      url: "https://registry-1.docker.io",
      authType: "none" as const,
    })

    // Navigate to nginx repository
    await page.goto(`/registries/Docker Hub Tags/repos/library/nginx`)
    await waitForLoading(page)

    // Should display tags
    await expect(page.getByText(/Tags|latest/i)).toBeVisible()

    // Should show tag information
    const tagRow = page.locator('[data-testid="tag-row"]').first()
    if (await tagRow.isVisible()) {
      await expect(tagRow.locator('[data-testid="tag-name"]')).toBeVisible()
      await expect(tagRow.locator('[data-testid="tag-size"]')).toBeVisible()
      await expect(tagRow.locator('[data-testid="tag-created"]')).toBeVisible()
    }
  })

  test("should view manifest details for Docker Hub images", async ({ page }) => {
    await addRegistry(page, {
      name: "Docker Hub Manifest",
      url: "https://registry-1.docker.io",
      authType: "none" as const,
    })

    // Navigate to a specific tag
    await page.goto(`/registries/Docker Hub Manifest/repos/library/nginx/manifest/latest`)
    await waitForLoading(page)

    // Should display manifest information
    await expect(page.getByText(/Manifest|Digest|Layers/i)).toBeVisible()

    // Should show manifest structure
    await expect(page.getByText(/schemaVersion|mediaType/i)).toBeVisible()
  })

  test("should handle authentication with personal access token", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Docker Hub PAT")
    await page.getByLabel(/URL/i).fill("https://registry-1.docker.io")

    // Select basic auth (for PAT)
    await page.getByLabel(/Authentication Type/i).selectOption("basic")

    // Fill in PAT credentials
    await page.getByLabel(/Username/i).fill("testuser")
    await page.getByLabel(/Password/i).fill("dckr_pat_test_token_here")

    await page.getByRole("button", { name: /Save/i }).click()
    await page.waitForURL("/registries")

    // Should successfully create registry
    await expect(page.getByText("Docker Hub PAT")).toBeVisible()
  })

  test("should gracefully handle authentication failures", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Docker Hub Invalid")
    await page.getByLabel(/URL/i).fill("https://registry-1.docker.io")

    await page.getByLabel(/Authentication Type/i).selectOption("basic")
    await page.getByLabel(/Username/i).fill("invaliduser")
    await page.getByLabel(/Password/i).fill("invalidpassword")

    await page.getByRole("button", { name: /Save/i }).click()
    await page.waitForURL("/registries")

    // Should still create registry but with limited functionality
    await expect(page.getByText("Docker Hub Invalid")).toBeVisible()

    // Try to access repositories
    await page.getByText("Docker Hub Invalid").click()
    await page.waitForURL(/\/repos/)

    // Should show public repositories (fallback behavior)
    await expect(page.getByText(/nginx|alpine/i)).toBeVisible()
  })

  test("should support different namespaces on Docker Hub", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Docker Hub Namespace")
    await page.getByLabel(/URL/i).fill("https://registry-1.docker.io")
    await page.getByLabel(/Namespace/i).fill("bitnami")

    await page.getByRole("button", { name: /Save/i }).click()
    await page.waitForURL("/registries")

    await page.getByText("Docker Hub Namespace").click()
    await page.waitForURL(/\/repos/)
    await waitForLoading(page)

    // Should show repositories from bitnami namespace
    await expect(page.getByText(/bitnami/i)).toBeVisible()
  })

  test("should handle rate limiting gracefully", async ({ page }) => {
    await addRegistry(page, {
      name: "Docker Hub Rate Limit",
      url: "https://registry-1.docker.io",
      authType: "none" as const,
    })

    await page.goto(`/registries/Docker Hub Rate Limit/repos`)
    await waitForLoading(page)

    // Make multiple rapid requests (this might trigger rate limiting)
    for (let i = 0; i < 10; i++) {
      await page.reload()
      await waitForLoading(page)
    }

    // Should handle rate limiting gracefully
    await expect(page.getByText(/Rate limit exceeded|Too many requests/i)).toBeVisible()
  })

  test("should provide helpful guidance for Docker Hub setup", async ({ page }) => {
    await page.goto("/registries/new")

    // Select Docker Hub provider
    await page.getByLabel(/Provider/i).selectOption("dockerhub")

    // Should show helpful information
    await expect(page.getByText(/Docker Hub|Personal Access Token/i)).toBeVisible()

    // Should provide links or information about PAT creation
    const helpText = page.getByText(/Personal Access Token|Create token/i)
    if (await helpText.isVisible()) {
      await expect(helpText).toContainText(/docker.com|hub.docker.com/i)
    }
  })

  test("should integrate Docker Hub data with dashboard", async ({ page }) => {
    await addRegistry(page, {
      name: "Dashboard Docker Hub",
      url: "https://registry-1.docker.io",
      authType: "none" as const,
    })

    await navigateToApp(page)

    // Dashboard should reflect Docker Hub data
    await expect(page.getByText("Dashboard Docker Hub")).toBeVisible()

    // Stats should update with Docker Hub repositories
    const registriesCount = await page.locator('[data-testid="stat-value"]').first().textContent()
    expect(parseInt(registriesCount || "0")).toBeGreaterThan(0)
  })

  test("should clean up Docker Hub registry", async ({ page }) => {
    await addRegistry(page, {
      name: "Cleanup Test",
      url: "https://registry-1.docker.io",
      authType: "none" as const,
    })

    // Clean up the test registry
    await deleteRegistry(page, "Cleanup Test")

    // Should be removed from dashboard
    await navigateToApp(page)
    await expect(page.getByText("Cleanup Test")).not.toBeVisible()
  })
})
