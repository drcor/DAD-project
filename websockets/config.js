import dotenv from 'dotenv';

// Load .env file only in development (Kubernetes injects env vars in production)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000/api',
    internalApiKey: process.env.INTERNAL_API_KEY || '',
    nodeEnv: process.env.NODE_ENV || 'development',
};

// Log configuration on startup (hide sensitive data)
console.log('Configuration loaded:');
console.log(`  Environment: ${config.nodeEnv}`);
console.log(`  Port: ${config.port}`);
console.log(`  API Base URL: ${config.apiBaseUrl}`);
console.log(`  Internal API Key: ${config.internalApiKey ? 'Configured' : 'Missing'}`);
