import { serverStart } from "./server.js";

// Load environment variables
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.INTERNAL_API_KEY || 'ws_secret_key_2025_dad_project_secure';


serverStart(PORT);

console.log(`Socket.io server running on port ${PORT}`);
console.log("Waiting for connections...");
