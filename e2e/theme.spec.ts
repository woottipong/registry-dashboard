import { test, expect } from "@playwright/test"

test.describe("Theme toggle", () => {
  test("settings page theme buttons are present", async ({ page }) => {
    await page.goto("/settings")

    await expect(page.getByRole("button", { name: /Dark/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Light/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /System/i })).toBeVisible()
  })

  test("can switch to light theme", async ({ page }) => {
    await page.goto("/settings")

    await page.getByRole("button", { name: /Light/i }).click()

    // html element should have class 'light' applied (next-themes)
    await expect(page.locator("html")).toHaveAttribute("class", /light/)
  })
})
