import { expect, test, type Page } from "@playwright/test";

// Learning patterns: the big picture. Different learners get the same lesson in different shapes.
test("the landing page shows one lesson reshaped for each kind of learner", async ({ page }) => {
  await page.goto("/");
  const picker = page.getByRole("radiogroup", { name: "Learning pattern" });
  await expect(page.getByText("“I need to know why, not just what.”")).toBeVisible();
  await expect(page.getByText("Go deeper", { exact: true })).toBeVisible();

  await picker.getByRole("radio", { name: "Quick answers" }).click();
  await expect(page.getByText("Key points", { exact: true })).toBeVisible();
  await picker.getByRole("radio", { name: "Listener" }).click();
  await expect(page.getByText("0:24 / 1:05")).toBeVisible();
  await picker.getByRole("radio", { name: "Short bursts" }).click();
  await expect(page.getByText(/10-minute block, sized to your real focus/)).toBeVisible();
});

test("the profile shows the learning mix with evidence", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: /Load a demo week/ }).click();
  const mix = page.getByRole("region", { name: "Your learning mix" });
  for (const name of ["Deep diver", "Hands-on", "Fast mover", "Practice-lover", "Short bursts"]) {
    await expect(mix.getByText(name, { exact: true })).toBeVisible();
  }
  await expect(mix.getByText("Why we think so:").first()).toBeVisible();
});

/** Seeds three earlier experiments where the student did (or didn't) write explanations. */
async function seedExplanations(page: Page, wrote: boolean) {
  await page.addInitScript((w) => {
    if (sessionStorage.getItem("seeded")) return;
    const ev = [0, 1, 2].map((i) => ({ t: "explanation", at: Date.now() - 864e5 + i, topic: "forces", sim: `earlier-${i}`, wrote: w, ideas: w ? 2 : null, total: 3 }));
    localStorage.setItem("mosaic-events-v1", JSON.stringify(ev));
    sessionStorage.setItem("seeded", "1");
  }, wrote);
}

async function reachExplain(page: Page) {
  await page.goto("/lab/catalyst");
  await page.getByRole("radio", { name: /goes up/ }).click();
  await page.getByRole("button", { name: /Run the experiment/ }).click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("button", { name: /Set it for me/ }).click();
  await page.getByRole("button", { name: "Run again" }).click();
  await page.getByRole("button", { name: /Explain it/ }).click();
  await page.getByRole("button", { name: "Show me the answer" }).click();
}

test("a quick-answer learner gets the key ideas first", async ({ page }) => {
  await seedExplanations(page, false);
  await reachExplain(page);
  await expect(page.getByText("Key ideas first, because you like getting to the point.")).toBeVisible();
  await expect(page.getByText("Read the full explanation")).toBeVisible();
  await expect(page.getByText(/A catalyst offers a different route/)).toBeHidden();
  await page.getByText("Read the full explanation").click();
  await expect(page.getByText(/A catalyst offers a different route/)).toBeVisible();
});

test("a deep diver gets the full why and a challenge", async ({ page }) => {
  await seedExplanations(page, true);
  await reachExplain(page);
  await expect(page.getByText(/The full why, plus a challenge/)).toBeVisible();
  await expect(page.getByText(/A catalyst offers a different route/)).toBeVisible();
  await expect(page.getByText("Go deeper", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Test my idea" }).click();
  await expect(page.getByRole("button", { name: /Run again/ })).toBeVisible();
});
