import { test, expect } from "@playwright/test"

test.describe("Registry flow", () => {
  test("dashboard loads and shows empty state when no registries", async ({ page }) => {
    await page.goto("/")

    // Should redirect or show empty state
    await expect(page).toHaveTitle(/Registry Dashboard/)
  })

  test("navigate to add registry page", async ({ page }) => {
    await page.goto("/registries/new")
    await expect(page.getByRole("heading", { name: /Add Registry/i })).toBeVisible()
  })

  test("add local registry form validation", async ({ page }) => {
    await page.goto("/registries/new")

    // Submit without filling required fields
    await page.getByRole("button", { name: /Save/i }).click()

    // Expect validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible()
  })

  test("add a local registry and see it in the list", async ({ page }) => {
    await page.goto("/registries/new")

    await page.getByLabel(/Name/i).fill("Local Test")
    await page.getByLabel(/URL/i).fill("http://localhost:5000")

    await page.getByRole("button", { name: /Save/i }).click()

    // Should redirect to registries list
    await page.waitForURL("/registries")
    await expect(page.getByText("Local Test")).toBeVisible()
  })

  test("command palette opens with ⌘K", async ({ page }) => {
    await page.goto("/")

    await page.keyboard.press("Meta+k")
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible()

    // Close with Escape
    await page.keyboard.press("Escape")
    await expect(page.getByPlaceholder(/Search/i)).not.toBeVisible()
  })

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings")
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible()
    await expect(page.getByText(/Theme/i)).toBeVisible()
  })

  test("repository browser page loads", async ({ page }) => {
    await page.goto("/repos")
    await expect(page).toHaveTitle(/Registry Dashboard/)
  })
})
