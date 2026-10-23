import { useCallback, useRef, useState } from "react";

const configuredMcpUrl = import.meta.env.VITE_MCP_URL || import.meta.env.VITE_MCP_SERVER_URL;
const MCP_URL = configuredMcpUrl ? (configuredMcpUrl.endsWith("/mcp") ? configuredMcpUrl : `${configuredMcpUrl}/mcp`) : "/mcp";

interface JsonRpcResponse<T> {
  result?: T;
  error?: { message?: string };
}

export function useMCP() {
  const sessionId = useRef<string>();
  const requestId = useRef(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(async <T,>(body: Record<string, unknown>): Promise<T> => {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        ...(sessionId.current ? { "Mcp-Session-Id": sessionId.current } : {}),
      },
      body: JSON.stringify(body),
    });
    const newSession = response.headers.get("Mcp-Session-Id");
    if (newSession) sessionId.current = newSession;
    if (!response.ok) throw new Error(`Safeword service returned ${response.status}`);
    const text = await response.text();
    if (!text) return {} as T;
    const eventData = text.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).filter(Boolean).pop();
    const payload = eventData || text;
    const parsed = JSON.parse(payload || "{}") as JsonRpcResponse<T>;
    if (parsed.error) throw new Error(parsed.error.message || "MCP request failed");
    return (parsed.result ?? parsed) as T;
  }, []);

  const initialize = useCallback(async () => {
    if (sessionId.current) return;
    await post({
      jsonrpc: "2.0",
      id: requestId.current++,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "safeword-web", version: "1.0.0" },
      },
    });
    await post({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
  }, [post]);

  const callTool = useCallback(async <T,>(name: string, args: Record<string, unknown>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      await initialize();
      const response = await post<{ content?: Array<{ type: string; text?: string }> }>({
        jsonrpc: "2.0",
        id: requestId.current++,
        method: "tools/call",
        params: { name, arguments: args },
      });
      const content = response.content?.find((item) => item.type === "text")?.text;
      if (!content) throw new Error("Safeword returned an empty response");
      return JSON.parse(content) as T;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to reach Safeword";
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, [initialize, post]);

  const clearError = useCallback(() => setError(null), []);
  return { callTool, isLoading, error, clearError };
}

export async function postSetup(values: object) {
  const response = await fetch("/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const result = await response.json() as { message?: string; error?: string };
  if (!response.ok) throw new Error(result.error || "Could not save setup");
  return result;
}

export async function fetchAlerts(userId: string) {
  const response = await fetch(`/alerts/${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error(`Could not load alerts (${response.status})`);
  return (await response.json()) as { alerts: import("../types").AlertRecord[] };
}

export async function updateAlert(alertId: string, status: "APPROVED" | "BLOCKED", userId: string) {
  const response = await fetch(`/alert/${encodeURIComponent(alertId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, userId }),
  });
  const result = await response.json() as { alert?: import("../types").AlertRecord; error?: string };
  if (!response.ok) throw new Error(result.error || "Could not update alert");
  return result.alert;
}
