import { test, expect } from "@playwright/test"
import {
  navigateToApp,
  addRegistry,
  deleteRegistry,
  TEST_REGISTRY,
  TEST_REGISTRY_DOCKERHUB,
  clearTestData,
  waitForLoading,
} from "./test-helpers"

test.describe("Registry Management", () => {
  test.beforeEach(async ({ page }) => {
    // Clear test data before each test
    await clearTestData(page)
  })

  test("should display empty state when no registries exist", async ({ page }) => {
    await navigateToApp(page)

    // Should show empty state message
    await expect(page.getByText(/No registries configured/i)).toBeVisible()
  })

  test("should create a new registry successfully", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY)

    // Verify success notification
    await expect(page.getByText(/Registry created successfully/i)).toBeVisible()

    // Verify registry details are displayed
    await expect(page.getByText(TEST_REGISTRY.name)).toBeVisible()
    await expect(page.getByText(TEST_REGISTRY.url)).toBeVisible()
  })

  test("should validate required fields when creating registry", async ({ page }) => {
    await page.goto("/registries/new")

    // Try to submit without filling required fields
    await page.getByRole("button", { name: /Save/i }).click()

    // Should show validation errors
    await expect(page.getByText(/Name is required/i)).toBeVisible()
    await expect(page.getByText(/URL is required/i)).toBeVisible()
  })

  test("should validate URL format", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Test Registry")
    await page.getByLabel(/URL/i).fill("invalid-url")

    await page.getByRole("button", { name: /Save/i }).click()

    // Should show URL validation error
    await expect(page.getByText(/Please enter a valid URL/i)).toBeVisible()
  })

  test("should list all registries with their status", async ({ page }) => {
    // Add multiple registries
    await addRegistry(page, TEST_REGISTRY)
    await addRegistry(page, TEST_REGISTRY_DOCKERHUB)

    await page.goto("/registries")

    // Should display both registries
    await expect(page.getByText(TEST_REGISTRY.name)).toBeVisible()
    await expect(page.getByText(TEST_REGISTRY_DOCKERHUB.name)).toBeVisible()

    // Should show status indicators
    await expect(page.getByText(/Online|Offline|Unknown/i)).toBeVisible()
  })

  test("should update registry configuration", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY)

    // Navigate to registry details/edit
    await page.getByText(TEST_REGISTRY.name).click()
    await page.getByRole("button", { name: /Edit/i }).click()

    // Update registry name
    const updatedName = "Updated Test Registry"
    await page.getByLabel(/Name/i).fill(updatedName)

    await page.getByRole("button", { name: /Save/i }).click()

    // Verify update
    await expect(page.getByText(updatedName)).toBeVisible()
    await expect(page.getByText(/Registry updated successfully/i)).toBeVisible()
  })

  test("should delete registry with confirmation", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY)

    // Delete the registry
    await deleteRegistry(page, TEST_REGISTRY.name)

    // Verify deletion success
    await expect(page.getByText(/Registry deleted successfully/i)).toBeVisible()
    await expect(page.getByText(TEST_REGISTRY.name)).not.toBeVisible()
  })

  test("should prevent deletion of registry with active connections", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY)

    // Navigate to registry and simulate active connection
    await page.getByText(TEST_REGISTRY.name).click()

    // Try to delete (this might need to be mocked or simulated)
    await page.getByRole("button", { name: /Delete/i }).click()

    // Should show warning or prevent deletion
    await expect(page.getByText(/Cannot delete registry with active connections/i)).toBeVisible()
  })

  test("should handle registry connection errors gracefully", async ({ page }) => {
    // Add registry with invalid URL
    const invalidRegistry = {
      name: "Invalid Registry",
      url: "http://invalid-registry-url:5000",
      authType: "none" as const,
    }

    await addRegistry(page, invalidRegistry)

    // Navigate to registry details
    await page.getByText(invalidRegistry.name).click()

    // Should show connection error state
    await expect(page.getByText(/Connection failed|Offline/i)).toBeVisible()
  })

  test("should support different authentication types", async ({ page }) => {
    await page.goto("/registries/new")

    // Test basic auth configuration
    await page.getByLabel(/Name/i).fill("Private Registry")
    await page.getByLabel(/URL/i).fill("https://private-registry.example.com")

    // Select basic auth
    await page.getByLabel(/Authentication/i).selectOption("basic")

    // Should show username/password fields
    await expect(page.getByLabel(/Username/i)).toBeVisible()
    await expect(page.getByLabel(/Password/i)).toBeVisible()

    // Fill auth details
    await page.getByLabel(/Username/i).fill("testuser")
    await page.getByLabel(/Password/i).fill("testpass")

    await page.getByRole("button", { name: /Save/i }).click()

    // Verify registry is created
    await page.waitForURL("/registries")
    await expect(page.getByText("Private Registry")).toBeVisible()
  })

  test("should navigate between registry list and details", async ({ page }) => {
    await addRegistry(page, TEST_REGISTRY)

    // Navigate to registry details
    await page.getByText(TEST_REGISTRY.name).click()

    // Should show registry details page
    await expect(page.getByRole("heading", { name: TEST_REGISTRY.name })).toBeVisible()

    // Navigate back to list
    await page.getByRole("button", { name: /Back/i }).click()

    // Should be back on registries list
    await expect(page.getByText(TEST_REGISTRY.name)).toBeVisible()
  })
})
