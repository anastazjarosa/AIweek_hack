import { expect, test } from "@playwright/test";

// Learning profile (Part 4) and study planner (Part 5).
test("an experiment is recorded in the learning event log", async ({ page }) => {
  await page.goto("/lab/catalyst");
  await page.getByRole("radio", { name: /goes up/ }).click();
  await page.getByRole("button", { name: /Run the experiment/ }).click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("button", { name: /Set it for me/ }).click();
  await page.getByRole("button", { name: "Run again" }).click();
  await page.getByRole("button", { name: /Explain it/ }).click();
  await page.getByRole("button", { name: "Show me the answer" }).click();
  await expect(page.getByRole("link", { name: "what works for you" })).toBeVisible();

  const events = await page.evaluate(() => JSON.parse(localStorage.getItem("mosaic-events-v1") ?? "[]"));
  expect(events.map((e: { t: string }) => e.t)).toEqual(["prediction", "experiment_run", "experiment_run", "explanation"]);
  expect(events[0]).toMatchObject({ topic: "reactions", sim: "catalyst", correct: true });
  expect(events[3]).toMatchObject({ wrote: false });
});

test("the profile shows findings with evidence and applies a suggestion only when asked", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByText("Not enough to go on yet.")).toBeVisible();
  await page.getByRole("button", { name: /Load a demo week/ }).click();

  await expect(page.getByText("You focus best in blocks of about 10 minutes.")).toBeVisible();
  await expect(page.getByText(/You learn most by doing/)).toBeVisible();
  await expect(page.getByText("Practice questions are working for you.")).toBeVisible();
  await expect(page.getByText("Forces and motion").first()).toBeVisible();
  await expect(page.getByText(/needs more time/).first()).toBeVisible();

  const card = page.locator("li", { hasText: "Shorter study blocks" });
  await card.getByRole("button", { name: "Use this" }).click();
  await expect(card.getByText("In use")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("mosaic-profile-v1") ?? "{}"));
  expect(saved.scores.focus).toBe(3);
});

test("the planner builds a plan from exams and the profile, with a 2-minute first step", async ({ page }) => {
  await page.goto("/planner");
  await expect(page.getByText("Add an exam and today’s first step appears here.")).toBeVisible();
  await page.getByRole("button", { name: /Load demo exams/ }).click();

  await expect(page.getByText("Tiny first step")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your plan" })).toBeVisible();
  // Focus span of ~10 minutes from the demo week sizes the sessions.
  await expect(page.getByRole("link", { name: /· 10 min$/ }).first()).toBeVisible();
  await expect(page.getByText(/Physics exam \(Forces and motion\) in 12 days/)).toBeVisible();
  await expect(page.getByText(/History of life: \d+% → \d+% right/)).toBeVisible();
  await expect(page.getByRole("radio", { name: /Staying on task · suggested/ })).toBeVisible();

  await page.getByRole("button", { name: /Start with 2 minutes/ }).click();
  await expect(page.getByText(/^[12]:\d\d$/)).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();

  await page.getByRole("button", { name: /Remove Chemistry|Remove Reaction rates/ }).click();
  await expect(page.getByText("Reaction rates", { exact: true })).toHaveCount(0);
});

test("no condition labels appear on the profile or planner", async ({ page }) => {
  await page.goto("/planner");
  await page.getByRole("button", { name: /Load demo exams/ }).click();
  for (const path of ["/planner", "/profile", "/lab"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/adhd|dyslexi|autis|dyspraxi|disorder|diagnos/i);
  }
});
