import "dotenv/config";
import { randomUUID } from "node:crypto";
import express, { type Request, type Response } from "express";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { listAlerts, saveSetup, updateAlertStatus } from "./services/dynamodb.js";
import type { SetupInput } from "./types/index.js";

export const app = express();
app.use(express.json({ limit: "256kb" }));
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Accept, Mcp-Session-Id");
  res.header("Access-Control-Expose-Headers", "Mcp-Session-Id");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  try {
    const sessionId = getHeader(req, "mcp-session-id");
    if (!sessionId || !transports.has(sessionId)) {
      if (!isInitializeRequest(req.body)) {
        res.status(400).json({ error: "Expected an MCP InitializeRequest for a new session" });
        return;
      }
      const newSessionId = randomUUID();
      let transport: StreamableHTTPServerTransport;
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (initializedSessionId): void => {
          transports.set(initializedSessionId, transport);
        },
      });
      transport.onclose = () => transports.delete(newSessionId);
      await createServer().connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }
    await transports.get(sessionId)?.handleRequest(req, res, req.body);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = getHeader(req, "mcp-session-id");
  const transport = sessionId ? transports.get(sessionId) : undefined;
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  try {
    await transport.handleRequest(req, res);
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/mcp", async (req, res) => {
  const sessionId = getHeader(req, "mcp-session-id");
  const transport = sessionId ? transports.get(sessionId) : undefined;
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  try {
    await transport.handleRequest(req, res);
    transports.delete(sessionId as string);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "safeword-mcp", protocol_version: "2025-11-25" }));

app.post("/setup", async (req, res) => {
  const parsed = parseSetup(req.body);
  if (!parsed) {
    res.status(400).json({ error: "user_id, guardian_name, question, and answer_hint are required" });
    return;
  }
  await saveSetup(parsed);
  res.status(201).json({ success: true, user_id: parsed.user_id, configured: true, message: "Guardian and safe word saved." });
});

app.get("/alerts/:userId", async (req, res) => {
  res.json({ alerts: await listAlerts(req.params.userId) });
});

app.patch("/alert/:alertId", async (req, res) => {
  const status = req.body?.status ?? req.body?.action;
  if (status !== "APPROVED" && status !== "BLOCKED") {
    res.status(400).json({ error: "status must be APPROVED or BLOCKED" });
    return;
  }
  const alert = await updateAlertStatus(req.params.alertId, status, typeof req.body?.userId === "string" ? req.body.userId : undefined);
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json({ alert });
});

function getHeader(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function parseSetup(body: unknown): SetupInput | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  const question = typeof value.safe_word_question === "string" ? value.safe_word_question : value.question;
  const answer = typeof value.safe_word_answer === "string" ? value.safe_word_answer : value.answer_hint;
  if (
    typeof value.user_id !== "string" || !value.user_id ||
    typeof value.guardian_name !== "string" || !value.guardian_name ||
    typeof question !== "string" || !question ||
    typeof answer !== "string" || !answer
  ) return null;
  return {
    user_id: value.user_id as string,
    user_name: typeof value.user_name === "string" && value.user_name ? value.user_name : value.user_id as string,
    guardian_name: value.guardian_name as string,
    guardian_phone: typeof value.guardian_phone === "string" ? value.guardian_phone : "",
    safe_word_question: question,
    safe_word_answer: answer,
    ...(typeof value.sns_endpoint === "string" && value.sns_endpoint ? { sns_endpoint: value.sns_endpoint } : {}),
  };
}

function handleError(res: Response, error: unknown): void {
  if (res.headersSent) return;
  res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
}

const port = Number(process.env.PORT ?? 3000);
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Safeword MCP server listening on http://localhost:${port}`);
    console.log(`MCP endpoint: http://localhost:${port}/mcp`);
  });
}
