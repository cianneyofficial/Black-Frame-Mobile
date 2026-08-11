import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port);

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

server.on("listening", () => {
  logger.info({ port }, "Server listening");
});
