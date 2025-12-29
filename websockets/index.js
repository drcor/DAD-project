import { serverStart } from "./server.js";

// Load environment variables
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.INTERNAL_API_KEY || 'ws_secret_key_2025_dad_project_secure';

console.log('[Environment] Loading environment variables');
console.log('[Environment] Current working directory:', process.cwd());
console.log('[Environment] PORT:', PORT);
console.log('[Environment] INTERNAL_API_KEY:', API_KEY ? '***' + API_KEY.slice(-8) : 'NOT SET');
console.log('[Environment] API_BASE_URL:', process.env.API_BASE_URL || 'http://localhost:8000/api');

serverStart(PORT);

console.log(`Socket.io server running on port ${PORT}`);
console.log("Waiting for connections...");
