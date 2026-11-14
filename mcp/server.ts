// Mosaic Simulation Lab as an MCP server (stdio). Lets any MCP client (Claude Desktop, Claude
// Code, the in-app agent) list, build, run and check simulations with the same tested engine.
//
//   npm run mcp            # starts the server on stdio
//
// Environment: ANTHROPIC_API_KEY (optional, enables create_simulation via Claude),
// MOSAIC_URL (base for open_url links, default http://localhost:3000), MOSAIC_AI=off.
// Logs go to stderr only: stdout carries the protocol.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { aiEnabled, askDesign } from "@/lib/ai/claude";
import { checkPrediction, createSimulation, listSimulations, runSimulation, simRef, type ToolDeps } from "@/lib/mcp/tools";

const deps: ToolDeps = {
  ask: aiEnabled() ? askDesign : null,
  baseUrl: process.env.MOSAIC_URL || "http://localhost:3000",
};

const server = new McpServer({ name: "mosaic-simulation-lab", version: "0.1.0" });

/** Wraps a tool so results are JSON text and thrown errors become tool errors the model can read. */
const tool =
  <A>(fn: (args: A) => Promise<unknown>) =>
  async (args: A) => {
    try {
      return { content: [{ type: "text" as const, text: JSON.stringify(await fn(args), null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: (e as Error).message }], isError: true };
    }
  };

server.registerTool(
  "list_simulations",
  {
    title: "List simulations",
    description: "Lists the ready-made science simulations and the tested model templates new ones are built from.",
    annotations: { readOnlyHint: true },
  },
  tool(() => listSimulations(deps)),
);

server.registerTool(
  "create_simulation",
  {
    title: "Create a simulation",
    description:
      "Builds a predict-run-explain simulation for a student's science question. Uses Claude to design it on a tested model when live AI is on, otherwise returns the closest ready-made one. Returns the spec and an open_url for the student.",
    inputSchema: { question: z.string().min(3).max(300).describe("the student's question, e.g. 'Why don't heavier things fall faster?'") },
  },
  tool(({ question }: { question: string }) => createSimulation({ question }, deps)),
);

server.registerTool(
  "run_simulation",
  {
    title: "Run a simulation",
    description: "Runs a simulation with the given slider values and returns its results. Unset sliders keep their starting values.",
    inputSchema: { ...simRef, values: z.record(z.string(), z.number()).optional().describe("slider id → value") },
    annotations: { readOnlyHint: true },
  },
  tool((args: { simulation_id?: string; spec?: unknown; values?: Record<string, number> }) => runSimulation(args)),
);

server.registerTool(
  "check_prediction",
  {
    title: "Check a prediction",
    description:
      "Checks a student's prediction for a simulation (does the result go up, down or stay the same?) against a fair test run by the engine, and returns the explanation and key ideas.",
    inputSchema: { ...simRef, guess: z.enum(["up", "down", "same"]) },
    annotations: { readOnlyHint: true },
  },
  tool((args: { simulation_id?: string; spec?: unknown; guess: "up" | "down" | "same" }) => checkPrediction(args)),
);

server
  .connect(new StdioServerTransport())
  .then(() => console.error(`[mosaic-mcp] ready (live AI ${deps.ask ? "on" : "off"})`))
  .catch((e) => {
    console.error("[mosaic-mcp] failed to start", e);
    process.exit(1);
  });
