import "dotenv/config";
import { readFileSync } from "node:fs";
import { heuristicSituation } from "../packages/mcp-server/src/services/bedrock.js";

interface TestCase {
  id: string;
  description: string;
  channel: "call" | "text" | "email" | "in-person" | "unknown";
  claimed_identity?: string;
  label: "SCAM" | "LEGITIMATE" | "SUSPICIOUS";
}

const cases = JSON.parse(readFileSync(new URL("./test-scams.json", import.meta.url), "utf8")) as TestCase[];
let tp = 0;
let tn = 0;
let fp = 0;
let fn = 0;

for (const testCase of cases) {
  const result = heuristicSituation(testCase.description, testCase.channel, testCase.claimed_identity);
  const predictedScam = result.risk_score >= 61;
  const actualScam = testCase.label === "SCAM";
  if (predictedScam && actualScam) tp += 1;
  else if (!predictedScam && !actualScam) tn += 1;
  else if (predictedScam) fp += 1;
  else fn += 1;
  console.log(`${testCase.id}: score=${result.risk_score}, label=${testCase.label}, correct=${predictedScam === actualScam}`);
}

const precision = tp / (tp + fp) || 0;
const recall = tp / (tp + fn) || 0;
const f1 = (2 * precision * recall) / (precision + recall) || 0;

console.log("\n=== EVALUATION RESULTS ===");
console.log(`Cases:     ${cases.length}`);
console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
console.log(`Recall:    ${(recall * 100).toFixed(1)}%`);
console.log(`F1 Score:  ${(f1 * 100).toFixed(1)}%`);
console.log(`TP:${tp} TN:${tn} FP:${fp} FN:${fn}`);
