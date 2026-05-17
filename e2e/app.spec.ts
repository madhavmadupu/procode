import { test, expect } from "@playwright/test";

test.describe("ProCode IDE", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the application header", async ({ page }) => {
    await expect(page.getByText("ProCode")).toBeVisible();
  });

  test("should show open folder dialog when no workspace is open", async ({ page }) => {
    await expect(page.getByText("Open Folder")).toBeVisible();
  });

  test("should display activity bar icons", async ({ page }) => {
    const activityBar = page.locator("aside").first();
    await expect(activityBar).toBeVisible();
  });

  test("should open command palette with keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Control+Shift+P");
    await expect(page.getByPlaceholder("Type a command...")).toBeVisible();
  });
});
