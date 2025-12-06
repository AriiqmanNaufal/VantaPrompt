import { Router } from "express";
import { sendToLLM } from "../controllers/llmController.js";
import { validatePrompt } from "../middlewares/validatePrompt.js";

const router = Router();

// Forwards validated prompts to the placeholder LLM proxy layer
router.post("/sendToLLM", validatePrompt, sendToLLM);

export default router;
