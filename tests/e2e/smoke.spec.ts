import { test, expect } from "@playwright/test";

test("landing loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});

test("health endpoint", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
});

test("robots.txt present", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBeTruthy();
});

test("sitemap.xml present", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBeTruthy();
});
