import { expect, test } from "@playwright/test";

// Consent, privacy and phone navigation (Part 6).
test.describe("without consent", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("under-18s need a parent or guardian before the app opens", async ({ page }) => {
    await page.goto("/dashboard");
    const gate = page.getByRole("dialog", { name: "Your data, in plain words" });
    await expect(gate).toBeVisible();
    await expect(gate).toContainText("never diagnoses");

    await gate.getByRole("radio", { name: "13 to 15" }).click();
    const agree = gate.getByRole("button", { name: "Agree and continue" });
    await expect(agree).toBeDisabled();
    await gate.getByLabel(/parent or guardian has read this/).check();
    await agree.click();
    await expect(gate).toBeHidden();

    await page.reload();
    await expect(page.getByRole("dialog", { name: "Your data, in plain words" })).toHaveCount(0);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("mosaic-consent-v1") ?? "null"));
    expect(saved).toMatchObject({ ageBand: "13-15", guardian: true, version: 1 });
  });

  test("adults agree without the guardian box, and the privacy page is readable first", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("You haven't agreed yet.", { exact: false })).toBeVisible();
    await page.goto("/lab");
    await page.getByRole("radio", { name: "18 or over" }).click();
    await expect(page.getByLabel(/parent or guardian/)).toHaveCount(0);
    await page.getByRole("button", { name: "Agree and continue" }).click();
    await expect(page.getByRole("heading", { name: "Simulation Lab", level: 1 })).toBeVisible();
  });
});

test("the privacy page lists every stored key, exports and deletes everything", async ({ page }) => {
  await page.goto("/planner");
  await page.getByRole("button", { name: /Load demo exams/ }).click();
  await page.goto("/privacy");
  for (const key of ["mosaic-profile-v1", "mosaic-events-v1", "mosaic-planner-v1", "mosaic-session-v1", "mosaic-consent-v1"]) {
    await expect(page.getByText(key, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(/You agreed on .*, age 16 or 17, with a parent or guardian's agreement/)).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("mosaic-my-data.json");

  await page.getByRole("button", { name: "Delete all my data" }).click();
  await page.getByRole("button", { name: "Yes, delete it" }).click();
  await page.waitForURL("/");
  const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("mosaic-")));
  expect(left).toEqual([]);
});

test("the dashboard plan follows the planner once exams are added", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Add exam dates for a plan built around you/ })).toBeVisible();
  await page.goto("/planner");
  await page.getByRole("button", { name: /Load demo exams/ }).click();
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Practise: Forces and motion/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the study planner" })).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("every section is reachable from the top navigation", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Study planner" }).click();
    await expect(page.getByRole("heading", { name: "Study planner", level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Study planner" })).toHaveAttribute("aria-current", "page");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
