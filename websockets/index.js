import { serverStart } from "./server.js";
import { config } from "./config.js";

serverStart(config.port);

console.log(`🚀 Socket.io server running on port ${config.port}`);
console.log("⏳ Waiting for connections...");

