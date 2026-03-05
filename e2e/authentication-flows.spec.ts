import { test, expect } from "@playwright/test"
import { navigateToApp, addRegistry, clearTestData } from "./test-helpers"

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page)
  })

  test("should handle registry authentication with basic auth", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Private Registry")
    await page.getByLabel(/URL/i).fill("https://registry.example.com")

    // Select basic authentication
    await page.getByLabel(/Authentication Type/i).selectOption("basic")

    // Should show username and password fields
    await expect(page.getByLabel(/Username/i)).toBeVisible()
    await expect(page.getByLabel(/Password/i)).toBeVisible()

    // Fill authentication details
    await page.getByLabel(/Username/i).fill("testuser")
    await page.getByLabel(/Password/i).fill("testpass")

    await page.getByRole("button", { name: /Save/i }).click()

    // Should create registry successfully
    await page.waitForURL("/registries")
    await expect(page.getByText("Private Registry")).toBeVisible()
  })

  test("should handle registry authentication with bearer token", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Bearer Registry")
    await page.getByLabel(/URL/i).fill("https://bearer-registry.example.com")

    // Select bearer authentication
    await page.getByLabel(/Authentication Type/i).selectOption("bearer")

    // Should show token field
    await expect(page.getByLabel(/Token|Bearer Token/i)).toBeVisible()

    // Fill token
    await page.getByLabel(/Token|Bearer Token/i).fill("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")

    await page.getByRole("button", { name: /Save/i }).click()

    // Should create registry successfully
    await page.waitForURL("/registries")
    await expect(page.getByText("Bearer Registry")).toBeVisible()
  })

  test("should validate authentication credentials", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Test Registry")
    await page.getByLabel(/URL/i).fill("https://registry.example.com")

    await page.getByLabel(/Authentication Type/i).selectOption("basic")

    // Try to save without credentials
    await page.getByRole("button", { name: /Save/i }).click()

    // Should show validation errors
    await expect(page.getByText(/Username is required|Token is required/i)).toBeVisible()
  })

  test("should handle authentication failures gracefully", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Failing Registry")
    await page.getByLabel(/URL/i).fill("https://invalid-registry.example.com")

    await page.getByLabel(/Authentication Type/i).selectOption("basic")
    await page.getByLabel(/Username/i).fill("wronguser")
    await page.getByLabel(/Password/i).fill("wrongpass")

    await page.getByRole("button", { name: /Save/i }).click()

    // Should handle authentication failure
    await expect(page.getByText(/Authentication failed|Invalid credentials/i)).toBeVisible()
  })

  test("should test registry connectivity during creation", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Connection Test Registry")
    await page.getByLabel(/URL/i).fill("https://registry-1.docker.io") // Valid registry

    await page.getByRole("button", { name: /Test Connection|Verify/i }).click()

    // Should show connection success
    await expect(page.getByText(/Connection successful|Registry accessible/i)).toBeVisible()

    // Then save
    await page.getByRole("button", { name: /Save/i }).click()
    await page.waitForURL("/registries")
    await expect(page.getByText("Connection Test Registry")).toBeVisible()
  })

  test("should update registry authentication", async ({ page }) => {
    // First create a registry
    await addRegistry(page, {
      name: "Auth Update Test",
      url: "https://registry.example.com",
      authType: "none" as const,
    })

    // Navigate to edit
    await page.getByText("Auth Update Test").click()
    await page.getByRole("button", { name: /Edit/i }).click()

    // Update authentication
    await page.getByLabel(/Authentication Type/i).selectOption("basic")
    await page.getByLabel(/Username/i).fill("newuser")
    await page.getByLabel(/Password/i).fill("newpass")

    await page.getByRole("button", { name: /Save/i }).click()

    // Should update successfully
    await expect(page.getByText(/Registry updated|Authentication updated/i)).toBeVisible()
  })

  test("should handle session persistence", async ({ page }) => {
    // Create authenticated registry
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Session Test Registry")
    await page.getByLabel(/URL/i).fill("https://registry.example.com")
    await page.getByLabel(/Authentication Type/i).selectOption("basic")
    await page.getByLabel(/Username/i).fill("sessionuser")
    await page.getByLabel(/Password/i).fill("sessionpass")

    await page.getByRole("button", { name: /Save/i }).click()

    // Refresh page
    await page.reload()

    // Should maintain registry and authentication
    await expect(page.getByText("Session Test Registry")).toBeVisible()

    // Navigate to repositories (should use stored auth)
    await page.getByText("Session Test Registry").click()
    await expect(page.getByText(/Repositories|Loading/i)).toBeVisible()
  })

  test("should handle authentication errors in repository operations", async ({ page }) => {
    // Create registry with invalid credentials
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Auth Error Test")
    await page.getByLabel(/URL/i).fill("https://private-registry.example.com")
    await page.getByLabel(/Authentication Type/i).selectOption("basic")
    await page.getByLabel(/Username/i).fill("invalid")
    await page.getByLabel(/Password/i).fill("invalid")

    await page.getByRole("button", { name: /Save/i }).click()

    // Navigate to repositories
    await page.getByText("Auth Error Test").click()

    // Should show authentication error
    await expect(page.getByText(/Authentication failed|Unauthorized|403/i)).toBeVisible()
  })

  test("should provide authentication help and documentation", async ({ page }) => {
    await page.goto("/registries/new")

    // Should show help text for authentication
    await expect(page.getByText(/How to configure authentication|Authentication help/i)).toBeVisible()

    // Should have links to documentation
    const helpLink = page.getByRole("link", { name: /Learn more|Documentation|Help/i })
    if (await helpLink.isVisible()) {
      // Link should be valid
      const href = await helpLink.getAttribute("href")
      expect(href).toBeTruthy()
    }
  })

  test("should handle different registry types authentication", async ({ page }) => {
    const registryTypes = [
      { name: "Docker Hub", url: "https://registry-1.docker.io", auth: "basic" },
      { name: "GHCR", url: "https://ghcr.io", auth: "bearer" },
      { name: "Harbor", url: "https://harbor.example.com", auth: "basic" },
    ]

    for (const registry of registryTypes) {
      await page.goto("/registries/new")

      await page.getByLabel(/Name/i).fill(`${registry.name} Test`)
      await page.getByLabel(/URL/i).fill(registry.url)

      if (registry.auth === "basic") {
        await page.getByLabel(/Authentication Type/i).selectOption("basic")
        await page.getByLabel(/Username/i).fill("testuser")
        await page.getByLabel(/Password/i).fill("testpass")
      } else if (registry.auth === "bearer") {
        await page.getByLabel(/Authentication Type/i).selectOption("bearer")
        await page.getByLabel(/Token/i).fill("test-token")
      }

      await page.getByRole("button", { name: /Save/i }).click()

      // Should handle each registry type appropriately
      await page.waitForURL("/registries")
      await expect(page.getByText(`${registry.name} Test`)).toBeVisible()
    }
  })
})
