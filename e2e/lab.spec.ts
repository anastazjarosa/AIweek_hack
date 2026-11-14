import { expect, test } from "@playwright/test";

// Simulation Lab: gallery → one simulation through predict, run (fair test) and explain.
test("gallery lists all three subjects and links to the moth lab", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Simulation Lab" }).click();
  await expect(page.getByRole("heading", { name: "Simulation Lab", level: 1 })).toBeVisible();
  for (const subject of ["Physics", "Chemistry", "Biology"]) {
    await expect(page.getByRole("heading", { name: subject })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /The peppered moth/ })).toHaveAttribute("href", "/lecture/history-of-life/lab");
});

test("heavier-falls-faster runs predict, a fair test and explain", async ({ page }) => {
  await page.goto("/lab");
  await page.getByRole("link", { name: /Do heavier things fall faster\?/ }).first().click();

  // Predict: the common wrong answer.
  await page.getByRole("radio", { name: "Time to land goes down" }).click();
  await page.getByRole("button", { name: /Run the experiment/ }).click();

  // Run 1 at 1 kg, then Run 2 at 10 kg.
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByText("2.02 s").first()).toBeVisible();
  await page.getByRole("button", { name: /Set it for me/ }).click();
  await expect(page.getByLabel("Mass")).toHaveValue("10");
  await page.getByRole("button", { name: "Run again" }).click();
  await expect(page.getByText("was 2.02 s").first()).toBeVisible();
  await expect(page.getByText("Last run")).toBeVisible();

  await page.getByRole("button", { name: /Explain it/ }).click();
  await expect(page.getByText(/In a fair test it stays about the same: 2\.02 s → 2\.02 s/)).toBeVisible();
  await expect(page.getByText(/A lot of people think/)).toBeVisible();

  await page.getByLabel(/why did that happen/).fill("Gravity pulls harder but it is harder to speed up");
  await page.getByRole("button", { name: "Compare with the explanation" }).click();
  await expect(page.getByText(/Galileo argued this/)).toBeVisible();
  const idea = page.getByRole("checkbox", { name: /Gravity pulls harder/ });
  await idea.click();
  await expect(idea).toHaveAttribute("aria-checked", "true");
});

test("changing another slider prompts a fair test", async ({ page }) => {
  await page.goto("/lab/hotter-reacts-faster");
  await page.getByRole("radio", { name: /goes down/ }).click();
  await page.getByRole("button", { name: /Run the experiment/ }).click();
  await page.getByLabel("Concentration").fill("1.5");
  await expect(page.getByText(/For a fair test, change only temperature/)).toBeVisible();
  await page.getByRole("button", { name: "Reset the others" }).click();
  await expect(page.getByLabel("Concentration")).toHaveValue("1");
});

test("every library simulation page renders", async ({ page }) => {
  await page.goto("/lab");
  const hrefs = await page.locator('a[href^="/lab/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThanOrEqual(10);
  for (const href of hrefs) {
    await page.goto(href);
    await expect(page.getByRole("radiogroup", { name: "Your prediction" })).toBeVisible();
  }
});
