import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.TEST_EMAIL || "admin@stockflow.com";
const ADMIN_PASSWORD = process.env.TEST_PASSWORD || "admin123";

test("login with valid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 10000 });
});

test("login with invalid credentials shows error", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "wrong@email.com");
  await page.fill('input[name="password"]', "wrongpass");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Credenciales inválidas")).toBeVisible();
});

test("redirects to dashboard when already authenticated", async ({ page }) => {
  // Login first
  await page.goto("/login");
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 10000 });

  // Try to go back to login — should redirect to dashboard
  await page.goto("/login");
  await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 10000 });
});
