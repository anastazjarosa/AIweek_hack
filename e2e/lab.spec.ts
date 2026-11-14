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

// The e2e server runs without an API key, so these cover the offline path the demo falls back to.
test("asking a question offline opens the closest ready-made experiment", async ({ page }) => {
  await page.goto("/lab");
  await page.getByLabel("Ask for any experiment").fill("Why does milk go off faster when it's warm?");
  await page.getByRole("button", { name: /Build it/ }).click();
  await expect(page).toHaveURL(/\/lab\/new\?q=/);
  await expect(page.getByRole("status")).toContainText("closest ready-made experiment");
  await expect(page.getByRole("heading", { name: "Does heat speed up a reaction?" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Your prediction" })).toBeVisible();
});

test("an unrelated question explains what the lab can't do", async ({ page }) => {
  await page.goto("/lab/new?q=" + encodeURIComponent("Who won the 1966 World Cup?"));
  await expect(page.getByText("The lab can’t build that one yet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ask something else" })).toHaveAttribute("href", "/lab");
});

test("the AI routes validate their input", async ({ request }) => {
  const short = await request.post("/api/sim/generate", { data: { question: "x" } });
  expect(short.status()).toBe(400);
  const long = await request.post("/api/sim/generate", { data: { question: "x".repeat(301) } });
  expect(long.status()).toBe(400);
  const badSpec = await request.post("/api/sim/feedback", { data: { spec: { id: "nope" }, guess: "up", explanation: "because" } });
  expect(badSpec.status()).toBe(400);
  const ok = await request.post("/api/sim/generate", { data: { question: "Do heavier things fall faster?" } });
  expect(await ok.json()).toMatchObject({ source: "library", spec: { id: "heavier-falls-faster" } });
});

// The live AI screens, with the two API responses stubbed in the browser (no key in CI).
test("AI-built experiment and AI feedback render", async ({ page, request }) => {
  const base = await (await request.post("/api/sim/generate", { data: { question: "Do heavier things fall faster?" } })).json();
  const spec = { ...base.spec, id: "ai-heavy-light", title: "Heavy or light: who lands first?" };
  await page.route("**/api/sim/generate", (r) => r.fulfill({ json: { source: "ai", spec } }));
  await page.route("**/api/sim/feedback", (r) =>
    r.fulfill({
      json: {
        source: "ai",
        feedback: { ideas: [true, false, false], misconception: false, feedback: "You spotted that gravity pulls harder. What else is different about a heavier ball?" },
      },
    }),
  );

  await page.goto("/lab/new?q=" + encodeURIComponent("Do heavier things fall faster?"));
  await expect(page.getByRole("status")).toContainText("Built for your question by the AI.");
  await expect(page.getByRole("heading", { name: "Heavy or light: who lands first?" })).toBeVisible();

  await page.getByRole("radio", { name: "Time to land goes down" }).click();
  await page.getByRole("button", { name: /Run the experiment/ }).click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("button", { name: /Set it for me/ }).click();
  await page.getByRole("button", { name: "Run again" }).click();
  await page.getByRole("button", { name: /Explain it/ }).click();
  await page.getByLabel(/why did that happen/).fill("Gravity pulls harder on it");
  await page.getByRole("button", { name: "Compare with the explanation" }).click();

  await expect(page.getByText("Feedback on your explanation")).toBeVisible();
  await expect(page.getByText(/What else is different about a heavier ball\?/)).toBeVisible();
  await expect(page.getByText("Ideas in your explanation")).toBeVisible();
  await expect(page.getByText(": in your explanation", { exact: true })).toHaveCount(1);

  // Editing the answer offers fresh feedback.
  await page.getByLabel(/why did that happen/).fill("Gravity pulls harder but it is harder to speed up");
  await expect(page.getByRole("button", { name: "Get feedback on my new answer" })).toBeVisible();
});

test("shared links open the experiment, and broken links say so", async ({ page, request }) => {
  const list = await (await request.post("/api/sim/generate", { data: { question: "How does a catalyst work?" } })).json();
  const d = Buffer.from(JSON.stringify(list.spec)).toString("base64url");
  await page.goto(`/lab/s?d=${d}`);
  await expect(page.getByRole("heading", { name: list.spec.title, level: 1 })).toBeVisible();
  await page.goto("/lab/s?d=broken");
  await expect(page.getByText("This experiment link doesn’t work.")).toBeVisible();
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
