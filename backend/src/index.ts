import { createApp, logStartup } from "./app.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";

const app = createApp();
logStartup();

app.listen(config.port, () => {
  logger.info("server_listening", { port: config.port, env: config.nodeEnv });
});
