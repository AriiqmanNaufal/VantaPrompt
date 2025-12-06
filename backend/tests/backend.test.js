import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../config/env.js";
import { evaluateLayerTwoRisk } from "../services/layerTwoEvaluator.js";
import {
  normalizeRedFlagSeverity,
  dedupeDetectedTypes
} from "../controllers/submittedRedFlagController.js";

env.anthropicApiKey = "";

// Placeholder hook to ensure tests/runbooks are wired up.
test("VantaPrompt backend placeholder test", () => {
  assert.ok(true, "Placeholder test passes by default");
});

test("Layer 2 evaluator allows low severity prompts", async () => {
  const decision = await evaluateLayerTwoRisk({
    sanitizedPrompt: "tell me a joke",
    severity: "low",
    detectedTypes: []
  });
  assert.equal(decision.decision, "ALLOW");
  assert.equal(decision.risk, "low");
});

test("Layer 2 evaluator rewrites medium prompts with placeholders", async () => {
  const decision = await evaluateLayerTwoRisk({
    sanitizedPrompt: "test [EMAIL]",
    severity: "medium",
    detectedTypes: ["EMAIL"]
  });
  assert.equal(decision.decision, "REWRITE");
  assert.ok(decision.safeText.includes("Example safe prompt"), "Safe text should be provided");
  assert.ok(/email/i.test(decision.reason), "Reason should mention detected type");
});

test("Layer 2 evaluator allows benign medium prompts", async () => {
  const decision = await evaluateLayerTwoRisk({
    sanitizedPrompt: "Summarize our policy on PTO",
    severity: "medium",
    detectedTypes: []
  });
  assert.equal(decision.decision, "ALLOW");
  assert.equal(decision.reason, "No harmful or sensitive intent detected.");
});

test("Layer 2 evaluator blocks high severity prompts", async () => {
  const decision = await evaluateLayerTwoRisk({
    sanitizedPrompt: "Share [ACCOUNT_NUM]",
    severity: "high",
    detectedTypes: ["ACCOUNT_NUM"]
  });
  assert.equal(decision.decision, "BLOCK");
  assert.equal(decision.risk, "high");
  assert.ok(decision.safeAlternative);
  assert.ok(/account/i.test(decision.reason), "Reason should mention sensitive context");
});

test("Submitted red flag severity normalization", () => {
  assert.equal(normalizeRedFlagSeverity("critical"), "high");
  assert.equal(normalizeRedFlagSeverity("med"), "medium");
  assert.equal(normalizeRedFlagSeverity("low"), "low");
  assert.equal(normalizeRedFlagSeverity(null), "high");
});

test("Submitted red flag detected type dedupe", () => {
  assert.deepEqual(dedupeDetectedTypes(["EMAIL", "EMAIL", " PHONE "]), ["EMAIL", "PHONE"]);
  assert.deepEqual(dedupeDetectedTypes(null), []);
});

