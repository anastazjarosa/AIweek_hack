import { expect, test, type Page } from "@playwright/test";

// Demo profile from the brief: focus 4, structure (predictability) 3, everything else 1.
const DEMO_PROFILE = {
  scores: { focus: 4, processing: 1, organising: 1, predictability: 3 },
  prefs: { format: null, voiceInput: false, calmTheme: false },
  view: "sprints",
  interest: "trains",
};

async function startBlock(page: Page) {
  await page.addInitScript((p) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.clear();
      localStorage.setItem("mosaic-profile-v1", JSON.stringify(p));
      sessionStorage.setItem("seeded", "1");
    }
  }, DEMO_PROFILE);
  await page.clock.install();
  await page.goto("/lecture/history-of-life");
  await page.getByRole("button", { name: "Start focus session" }).click();
  await page.getByRole("button", { name: /Start 10-minute block/ }).click();
}

/** Advance the demo clock while "using" the page, so idle detection doesn't pause the block. */
async function studyFor(page: Page, realSeconds: number) {
  for (let i = 0; i < realSeconds; i++) {
    await page.mouse.move(500 + (i % 2) * 10, 300);
    await page.clock.runFor(1000);
  }
}

const pip = (page: Page) => page.getByRole("button", { name: /Pip, your study buddy/ }).locator("svg");

test("Pip reacts to block start, urge, break and return, and a full break unlocks an outfit", async ({ page }) => {
  test.setTimeout(60_000);
  await startBlock(page);

  await expect(page.getByText(/Block 1: 10 minutes on Deep time/)).toBeVisible();
  // High structure: minimal movement. High focus: no idle breathing during the block.
  await expect(pip(page)).toHaveAttribute("data-motion", "minimal");
  await expect(pip(page)).not.toHaveClass(/pip-breathe/);

  // Drifting off (the existing idle signal) is the urge moment: Pop names it, Pip answers.
  await page.clock.runFor(7000);
  await expect(page.getByText(/That's the unpredictable-reward pull talking!/)).toBeVisible();
  await expect(page.getByText(/Put it in another room, face down\. \d+ minutes? left, then a break\./)).toBeVisible();

  await studyFor(page, 32);
  await expect(page.getByText("Break time. Look away from the screen and stretch. I'll keep your place.")).toBeVisible();
  await expect(pip(page)).toHaveClass(/pip-move-stretch/);

  await page.clock.runFor(16_000);
  await page.getByRole("button", { name: "I'm back", exact: true }).click();
  await expect(page.getByText("Welcome back! You stayed away for the whole break.")).toBeVisible();
  await expect(pip(page)).toHaveClass(/pip-move-wave/);

  await page.clock.runFor(2500);
  const reveal = page.getByRole("dialog", { name: "A surprise for Pip" });
  await reveal.getByRole("button", { name: "Open the box" }).click();
  await expect(page.getByRole("heading", { name: /Pip got a/ })).toBeVisible();
  await page.getByRole("button", { name: "Wear it now" }).click();

  await page.goto("/wardrobe");
  await expect(page.getByText("1 of 5 found so far.")).toBeVisible();
  await expect(page.getByText("Mystery outfit")).toHaveCount(4);
});

test("tapping Pip opens the chat and explains the section another way", async ({ page }) => {
  await startBlock(page);
  await page.getByRole("button", { name: /Pip, your study buddy/ }).click();
  const chat = page.getByRole("dialog", { name: "Chat with Pip" });
  await chat.getByRole("button", { name: "Explain this another way" }).click();
  await expect(chat.getByText(/in three small steps/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(chat).toBeHidden();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("Pip never moves; the face carries the state", async ({ page }) => {
    test.setTimeout(60_000);
    await startBlock(page);
    await expect(pip(page)).toHaveAttribute("data-motion", "none");
    await studyFor(page, 32);
    await expect(page.getByText(/^Break time\./)).toBeVisible();
    const arm = pip(page).locator(".pip-arm-l");
    await expect(arm).toHaveCSS("animation-name", "none");
    await expect(arm).toHaveCSS("transform", "matrix(0.882948, -0.469472, 0.469472, 0.882948, 0, 0)"); // still the sitting pose
  });
});
