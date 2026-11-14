import { expect, test } from "@playwright/test";

// The pitch journey: rate statements, see scores, open the lecture in the chosen layout.
test("onboarding scores pick the calmer layout and drive the lecture", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /Rate 8 statements/ }).click();

  // High focus and high structure, everything else low.
  for (const value of [4, 4, 0, 0, 0, 0, 4, 4]) {
    await page.getByRole("radio", { name: new RegExp(`^${value} of 4`) }).click();
  }

  await expect(page.getByText("Here’s what we’ll adapt.")).toBeVisible();
  await expect(page.getByText("4 / 4 · high")).toHaveCount(2);
  await expect(page.getByText("Structured", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Go to my dashboard/ }).click();
  await expect(page.getByText("Your needs")).toBeVisible();

  await page.getByRole("link", { name: /Lecture 5: How memory works/ }).click();
  await expect(page.getByRole("heading", { name: "How memory works, and why we forget" })).toBeVisible();
  await expect(page.getByText("What you’ll learn")).toBeVisible();

  await page.getByRole("radio", { name: "Standard" }).click();
  await page.getByRole("tab", { name: "Map" }).click();
  await expect(page.getByText("Spread sessions over days", { exact: true }).first()).toBeVisible();
});

test("no condition labels appear on the main pages", async ({ page }) => {
  for (const path of ["/", "/onboarding", "/dashboard", "/preferences", "/lecture/memory"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/adhd|dyslexi|autis|dyspraxi/i);
  }
});
