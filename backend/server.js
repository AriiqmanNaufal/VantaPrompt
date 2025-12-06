const express = require("express");
const dlpRoute = require("./routes/dlpRoute");
const llmRoute = require("./routes/llmRoute");

const app = express();
app.use(express.json());
app.use("/dlp", dlpRoute);
app.use("/llm", llmRoute);

// Placeholder server bootstrap
app.listen(4000, () => {
  console.log("VantaPrompt backend placeholder listening on port 4000");
});
