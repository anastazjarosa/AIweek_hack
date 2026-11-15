import { expect, test } from "@playwright/test";

// The redesigned front door and home: one clear next step, the loop, grouped navigation.
test("the landing hero is a working experiment: no air, then with air", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Every lesson,\s*shaped for/ })).toBeVisible();
  await page.getByRole("radio", { name: "Bowling ball" }).click();
  await page.getByRole("button", { name: /Drop them/ }).click();
  await expect(page.getByText("Surprised? Most people are. They land together.")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Both take 2\.02 s/)).toBeVisible();

  await page.getByRole("button", { name: /Now add air/ }).click();
  await page.getByRole("radio", { name: "Bowling ball" }).click();
  await page.getByRole("button", { name: /Drop them/ }).click();
  await expect(page.getByText("You called it. The bowling ball wins.")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("link", { name: /Build one for your own question/ })).toHaveAttribute("href", "/lab");
});

test("a new student gets one next step, and the demo week fills the loop", async ({ page }) => {
  await page.goto("/dashboard");
  const step = page.getByRole("region", { name: "Do heavier things fall faster?" });
  await expect(step).toBeVisible();
  await expect(step.getByRole("link", { name: /Try the experiment/ })).toHaveAttribute("href", "/lab/heavier-falls-faster");
  await expect(page.getByText("Start a streak today")).toBeVisible();
  await expect(page.getByText("First experiment waiting")).toBeVisible();

  await step.getByRole("button", { name: /Load a demo week/ }).click();
  await expect(page.getByRole("link", { name: /Start with 2 minutes/ })).toBeVisible();
  for (const s of ["Focus ~10 min", "7 experiments this week", "Forces and motion needs work", "Physics exam in 12 days"]) {
    await expect(page.getByText(s, { exact: true })).toBeVisible();
  }
  await expect(page.getByText("You are here")).toHaveCount(1);
  await expect(page.getByText(/\d-day streak/)).toBeVisible();
});

test("navigation is grouped by the loop and the layout switch only appears on lectures", async ({ page }) => {
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const group of ["Learn", "Know me", "Plan"]) await expect(nav.getByText(group, { exact: true })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: /layout/i })).toHaveCount(0);

  await nav.getByRole("link", { name: "Lectures" }).click();
  await expect(page.getByRole("heading", { name: "The story of life on Earth" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Lectures" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("radio", { name: "Sprints" }).first()).toBeVisible();
});

test.describe("first visit", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("consent comes before the rating quiz, which can be skipped", async ({ page }) => {
    await page.goto("/onboarding");
    const gate = page.getByRole("dialog", { name: "Your data, in plain words" });
    await expect(gate).toBeVisible();
    await gate.getByRole("radio", { name: "18 or over" }).click();
    await gate.getByRole("button", { name: "Agree and continue" }).click();
    await page.getByRole("button", { name: /Skip: learn from what I do/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
