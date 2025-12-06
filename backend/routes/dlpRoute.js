const express = require("express");
const { checkPrompt } = require("../controllers/dlpController");
const validatePrompt = require("../middlewares/validatePrompt");

const router = express.Router();

router.post("/checkPrompt", validatePrompt, checkPrompt);

module.exports = router;
