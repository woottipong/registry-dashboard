import { test, expect } from "@playwright/test"

test("uses dark appearance even with an old light preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.addInitScript(() => localStorage.setItem("theme", "light"))
  await page.goto("/login")
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark")
  await expect(page.getByRole("switch", { name: /theme|mode/i })).toHaveCount(0)
  await page.reload()
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark")
})
