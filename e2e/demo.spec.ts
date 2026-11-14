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

  await page.getByRole("link", { name: /Lecture 3: The story of life on Earth/ }).click();
  await expect(page.getByRole("heading", { name: "The story of life on Earth" })).toBeVisible();
  await expect(page.getByText("What you’ll learn")).toBeVisible();

  await page.getByRole("radio", { name: "Standard" }).click();
  await page.getByRole("tab", { name: "Map" }).click();
  await expect(page.getByText("Natural selection", { exact: true }).first()).toBeVisible();
});

test("moth lab runs predict, run and explain", async ({ page }) => {
  await page.goto("/lecture/history-of-life");
  await page.getByRole("link", { name: /Try it: moth lab/ }).click();

  await page.getByRole("radio", { name: "Still about 2 in 100" }).click();
  await page.getByRole("button", { name: /Run the experiment/ }).click();

  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText(/After 50 generations, 9\d% of moths are dark\. They started at 2%\./)).toBeVisible();

  await page.getByRole("radio", { name: "No birds" }).click();
  await page.getByRole("button", { name: "Run again" }).click();
  await expect(page.getByText(/With no birds, nothing is choosing/)).toBeVisible();

  await page.getByRole("button", { name: /Explain it/ }).click();
  await expect(page.getByText(/the experiment says almost all of them/)).toBeVisible();
  await page.getByLabel(/why did dark moths take over/).fill("Birds could not spot dark moths so they survived and passed on their colour");
  await page.getByRole("button", { name: "Check my explanation" }).click();
  await expect(page.getByText(": you mentioned this")).toHaveCount(2);
});

test("skimming the notes offers Sprints, and accepting switches layout", async ({ page }) => {
  await page.goto("/lecture/history-of-life");
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
  for (const path of ["/", "/onboarding", "/dashboard", "/preferences", "/lecture/history-of-life", "/lecture/history-of-life/lab"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/adhd|dyslexi|autis|dyspraxi/i);
  }
});
