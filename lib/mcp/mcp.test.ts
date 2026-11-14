import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";
import { checkPrediction, createSimulation, listSimulations, runSimulation } from "@/lib/mcp/tools";
import { findSim, library } from "@/lib/sim/library";
import { decodeSpec, encodeSpec, shareUrl } from "@/lib/sim/share";
import { checkSpec } from "@/lib/sim/spec";

const deps = { ask: null, baseUrl: "https://mosaic.example" };

describe("share links", () => {
  it("round-trip every library spec, including non-ASCII text", () => {
    for (const s of library) expect(decodeSpec(encodeSpec(s))).toEqual(s);
    const unicode = { ...library[0], title: "Fällt schwer schneller? 2 m/s² · ✓" };
    expect(decodeSpec(encodeSpec(unicode))).toEqual(unicode);
  });

  it("are URL safe and reject garbage", () => {
    expect(encodeSpec(library[0])).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSpec("not base64 at all!!")).toBeNull();
    expect(checkSpec(decodeSpec("e30")).ok).toBe(false); // "{}"
    expect(shareUrl(library[0], "https://x.test/")).toMatch(/^https:\/\/x\.test\/lab\/s\?d=/);
  });
});

describe("MCP tools", () => {
  it("list_simulations returns the library, templates and open links", async () => {
    const r = await listSimulations(deps);
    expect(r.simulations).toHaveLength(library.length);
    expect(r.templates.map((t) => t.id)).toContain("reaction");
    expect(r.simulations[0].open_url).toMatch(/^https:\/\/mosaic\.example\/lab\/s\?d=/);
  });

  it("create_simulation falls back to the library offline", async () => {
    const r = await createSimulation({ question: "Do heavier things fall faster?" }, deps);
    expect(r).toMatchObject({ source: "library", simulation: { id: "heavier-falls-faster" } });
    expect(await createSimulation({ question: "best pizza topping" }, deps)).toMatchObject({ source: "none" });
  });

  it("run_simulation applies values and rejects unknown sliders", async () => {
    const r = await runSimulation({ simulation_id: "throwing-on-the-moon", values: { gravity: 1.6 } });
    expect(r.results.find((x) => x.id === "maxHeight")!.value).toBeCloseTo(62.5, 0);
    await expect(runSimulation({ simulation_id: "catalyst", values: { colour: 1 } })).rejects.toThrow(/Unknown parameter/);
    await expect(runSimulation({ simulation_id: "nope" })).rejects.toThrow(/Unknown simulation_id/);
  });

  it("run_simulation accepts a full spec and rejects an invalid one", async () => {
    const spec = findSim("catalyst")!;
    expect((await runSimulation({ spec })).simulation).toBe("catalyst");
    await expect(runSimulation({ spec: { ...spec, template: "volcano" } })).rejects.toThrow(/Invalid spec/);
  });

  it("check_prediction uses the engine's fair test", async () => {
    const r = await checkPrediction({ simulation_id: "heavier-falls-faster", guess: "down" });
    expect(r).toMatchObject({ correct: false, actual: "same" });
    expect(r.summary).toBe("Time to land stays about the same: 2.02 s → 2.02 s.");
  });
});

describe("MCP server over stdio", () => {
  it("lists its tools and answers a call", { timeout: 30_000 }, async () => {
    const root = fileURLToPath(new URL("../..", import.meta.url));
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("../../node_modules/tsx/dist/cli.mjs", import.meta.url)), "mcp/server.ts"],
      cwd: root,
      env: { ...(process.env as Record<string, string>), MOSAIC_AI: "off" },
      stderr: "ignore",
    });
    const client = new Client({ name: "mosaic-test", version: "0.0.0" });
    await client.connect(transport);
    try {
      const { tools } = await client.listTools();
      expect(tools.map((t) => t.name).sort()).toEqual(["check_prediction", "create_simulation", "list_simulations", "run_simulation"]);
      const res = await client.callTool({ name: "check_prediction", arguments: { simulation_id: "catalyst", guess: "up" } });
      const text = (res.content as { type: string; text: string }[])[0].text;
      expect(JSON.parse(text)).toMatchObject({ correct: true, actual: "up" });
      const bad = await client.callTool({ name: "run_simulation", arguments: { simulation_id: "nope" } });
      expect(bad.isError).toBe(true);
    } finally {
      await client.close();
    }
  });
});
