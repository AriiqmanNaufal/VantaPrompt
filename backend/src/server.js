import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { registerRetentionJob } from "./workers/retentionJob.js";

const start = async () => {
  await connectDatabase();
  registerRetentionJob();

  app.listen(env.port, () => {
    console.log(`Dashboard backend listening on port ${env.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start dashboard backend", err);
  process.exit(1);
});
