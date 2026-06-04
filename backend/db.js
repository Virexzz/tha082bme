const { Pool } = require('pg');
require('dotenv').config();

let connectionConfig;

// 🌟 Check if a single connection string is available (Production/Supabase)
if (process.env.DATABASE_URL) {
    connectionConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            // Required for secure handshaking with cloud databases like Supabase
            rejectUnauthorized: false 
        }
    };
} else {
    // 🏠 Smoothly fall back to individual local environment variables
    connectionConfig = {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_DATABASE || 'postgres',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
        ssl: {
        rejectUnauthorized: false  // ← required for Supabase on Render
    }
    };
}

const pool = new Pool(connectionConfig);

// A precise test to log exactly where the backend is pointing on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failure:', err.stack);
    } else {
        // Evaluate the active host destination dynamically
        const activeHost = connectionConfig.connectionString || connectionConfig.host || '';
        const isCloud = activeHost.includes('supabase') || activeHost.includes('pooler');
        
        const targetHost = isCloud ? 'Supabase Cloud Cluster' : 'Local Engine';
        console.log(`✅ Connected to PostgreSQL successfully! Target: ${targetHost}`);
    }
});

console.log("--- DATABASE ENVIRONMENT DEBUG ---");
console.log("process.env.DATABASE_URL exists?:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL value is:", process.env.DATABASE_URL);
} else {
    console.log("DB_HOST value is:", process.env.DB_HOST);
    console.log("DB_USER value is:", process.env.DB_USER);
}
console.log("----------------------------------");

module.exports = pool;