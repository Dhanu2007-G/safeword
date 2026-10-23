import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerChallengeIdentity } from "./tools/challenge-identity.js";
import { registerGuardianAlert } from "./tools/guardian-alert.js";
import { registerSafeHandoff } from "./tools/safe-handoff.js";
import { registerScreenSituation } from "./tools/screen-situation.js";
import { registerVerifyClaim } from "./tools/verify-claim.js";

export function createServer(): McpServer {
  const server = new McpServer({ name: "safeword-mcp", version: "1.0.0" });
  registerScreenSituation(server);
  registerChallengeIdentity(server);
  registerGuardianAlert(server);
  registerVerifyClaim(server);
  registerSafeHandoff(server);
  return server;
}
