const express = require("express");
const { sendPrompt } = require("../controllers/llmController");

const router = express.Router();

router.post("/send", sendPrompt);

module.exports = router;
