import { Router } from "express";
import mongoose from "mongoose";
import { checkPrompt } from "../controllers/dlpController.js";
import { validatePrompt } from "../middlewares/validatePrompt.js";
import { logWarning } from "../controllers/warningController.js";
import { listRegexes } from "../controllers/regexController.js";
import { logSubmittedRedFlag, logPromptSubmission } from "../controllers/submittedRedFlagController.js";

const router = Router();

// Accepts prompts and routes them through validation + controller stub
router.post("/checkPrompt", validatePrompt, checkPrompt);
router.post("/logWarning", logWarning);
router.post("/submittedRedFlag", logSubmittedRedFlag);
router.post("/submitPrompt", logPromptSubmission);
router.get("/regexes", listRegexes);

router.get("/db-status", (_req, res) => {
  const ready = mongoose.connection.readyState;
  res.json({
    status: ready === 1 ? "connected" : "disconnected",
    readyState: ready,
  });
});

export default router;
