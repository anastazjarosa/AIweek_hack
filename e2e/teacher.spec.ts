import { expect, test } from "@playwright/test";

// Teacher Studio: class misconceptions, AI experiment reviews (human in the loop), Pip's questions.
test.describe.configure({ mode: "serial" });

test("class misconceptions: sample class, privacy threshold, real predictions", async ({ page, request }) => {
  await request.post("/api/teacher/class", { data: { action: "clear-sample" } });
  await page.goto("/teacher");
  await expect(page.getByRole("heading", { name: "Teacher Studio", level: 1 })).toBeVisible();
  await expect(page.getByText(/Anonymous by design/)).toBeVisible();

  await page.getByRole("button", { name: /Load a sample class/ }).click();
  const heavy = page.locator("li", { hasText: "Heavy ball, light ball" });
  await expect(heavy.getByText(/^\d+%$/).first()).toBeVisible(); // about 64%; other tests may add real predictions
  await expect(heavy.getByText(/time to land goes down/i)).toBeVisible();
  await expect(heavy.getByText(/Likely misconception/)).toBeVisible();
  await expect(page.getByText(/1 more experiment has fewer than 5 responses and is hidden/)).toBeVisible();

  // Real student predictions arrive anonymously; the engine decides what was right.
  for (let i = 0; i < 5; i++) await request.post("/api/class/events", { data: { kind: "prediction", simId: "concentration", guess: "same" } });
  expect((await request.post("/api/class/events", { data: { kind: "prediction", simId: "nope", guess: "up" } })).status()).toBe(400);
  await page.getByRole("button", { name: "Clear sample class" }).click();
  await expect(page.locator("li", { hasText: "Crowding the particles" }).getByText("5 responses")).toBeVisible();
});

test("experiment reviews: edit and approve, reject needs a note", async ({ page }) => {
  await page.goto("/teacher");
  await page.getByRole("tab", { name: /Experiment reviews/ }).click();
  await page.getByRole("button", { name: "Add sample AI drafts" }).click();

  const hammer = page.locator("div.rounded-3xl", { hasText: "Would a hammer and a feather land together on the Moon?" }).first();
  await expect(hammer.getByText(/Engine-verified on the free fall model/)).toBeVisible();
  await hammer.getByRole("button", { name: "Edit wording" }).click();
  await hammer.getByLabel("Title").fill("Apollo 15: hammer and feather");
  await hammer.getByRole("button", { name: "Save edits and approve" }).click();
  await expect(page.getByText("Apollo 15: hammer and feather")).toBeVisible();
  await expect(page.locator("li", { hasText: "Apollo 15: hammer and feather" }).getByText("Approved")).toBeVisible();

  const yeast = page.locator("div.rounded-3xl", { hasText: "Why does bread dough rise faster somewhere warm?" }).first();
  await expect(yeast.getByRole("button", { name: "Reject" })).toBeDisabled();
  await yeast.getByLabel("Note for the student").fill("Let's cover microbes next term.");
  await yeast.getByRole("button", { name: "Reject" }).click();
  await expect(page.locator("li", { hasText: "Yeast in warm dough" }).getByText("Rejected")).toBeVisible();
});

test("students wait for approval, then the approved experiment opens", async ({ page, request }) => {
  await request.post("/api/teacher/reviews", { data: { action: "sample" } });
  const { reviews } = await (await request.get("/api/teacher/reviews")).json();
  const pending = reviews.find((r: { status: string; spec: { id: string } }) => r.status === "pending");
  test.skip(!pending, "no pending sample left");
  // Without an API key the agent can't build one live, so the generate response is stubbed as pending.
  await page.route("**/api/sim/generate*", (r) => r.fulfill({ json: { source: "pending", reviewId: pending.id, note: "Your lecturer reviews AI-built experiments before the class uses them." } }));
  await page.goto("/lab/new?q=" + encodeURIComponent(pending.question));
  await expect(page.getByText("Your lecturer is checking this experiment")).toBeVisible();

  await request.post(`/api/teacher/reviews/${pending.id}`, { data: { action: "approve" } });
  await expect(page.getByText("Approved by your lecturer.")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("radiogroup", { name: "Your prediction" })).toBeVisible();
});

test("the approval setting and review API validate input", async ({ request }) => {
  expect((await request.post("/api/teacher/settings", { data: { requireApproval: "yes" } })).status()).toBe(400);
  expect((await request.post("/api/teacher/settings", { data: { requireApproval: true } })).ok()).toBe(true);
  expect((await request.get("/api/teacher/settings").then((r) => r.json())).requireApproval).toBe(true);
  await request.post("/api/teacher/settings", { data: { requireApproval: false } });
  expect((await request.post("/api/teacher/reviews/nope", { data: { action: "approve" } })).status()).toBe(404);
});
