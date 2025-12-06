import RegexPattern from "../models/RegexPattern.js";

export async function listRegexes(req, res) {
  try {
    const regexes = await RegexPattern.find().sort({ type: 1 }).lean();
    res.json({ success: true, regexes });
  } catch (error) {
    console.error("VantaPrompt: Unable to load regex patterns", error);
    res.status(500).json({ success: false, message: "Unable to load regex patterns" });
  }
}

