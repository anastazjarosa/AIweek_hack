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

test("spacing lab runs predict, run and explain", async ({ page }) => {
  await page.goto("/lecture/memory");
  await page.getByRole("link", { name: /Try it: spacing lab/ }).click();

  await page.getByRole("radio", { name: "All 3 in one evening" }).click();
  await page.getByRole("button", { name: /Run the experiment/ }).click();

  await page.getByLabel(/Days between sessions/).fill("3");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText(/Your plan: 84% remembered on test day\. One evening: 43%/)).toBeVisible();

  await page.getByRole("button", { name: /Explain it/ }).click();
  await expect(page.getByText(/The experiment says spreading out wins/)).toBeVisible();
  await page.getByLabel(/why does spreading out help/).fill("You forget a little in the gap so recalling takes effort");
  await page.getByRole("button", { name: "Check my explanation" }).click();
  await expect(page.getByText(": you mentioned this")).toHaveCount(2);
});

test("skimming the notes offers Sprints, and accepting switches layout", async ({ page }) => {
  await page.goto("/lecture/memory");
  await expect(page.getByRole("tab", { name: "Notes", selected: true })).toBeVisible();

  const card = page.getByRole("dialog", { name: "Layout suggestion" });
  for (let i = 0; i < 20 && !(await card.isVisible()); i++) {
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(150);
  }
  await expect(card).toContainText("You’re moving through the notes quickly.");

  await card.getByRole("button", { name: "Try Sprints" }).click();
  await expect(page.getByRole("radio", { name: "Sprints" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText(/Sprint 1/)).toBeVisible();
});

test("no condition labels appear on the main pages", async ({ page }) => {
  for (const path of ["/", "/onboarding", "/dashboard", "/preferences", "/lecture/memory", "/lecture/memory/lab"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/adhd|dyslexi|autis|dyspraxi/i);
  }
});
