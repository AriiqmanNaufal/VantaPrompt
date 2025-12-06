import { Router } from "express";
import { checkPrompt } from "../controllers/dlpController.js";
import { validatePrompt } from "../middlewares/validatePrompt.js";

const router = Router();

// Accepts prompts and routes them through validation + controller stub
router.post("/checkPrompt", validatePrompt, checkPrompt);

export default router;
