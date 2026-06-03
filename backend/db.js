const { Pool } = require('pg');
require('dotenv').config();

// 🌟 Check if a single connection string is available (Production/Supabase)
// Otherwise, smoothly fall back to your individual local .env variables
const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for secure handshaking with cloud databases like Supabase
        }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      };

const pool = new Pool(connectionConfig);

// A quick test to make sure it successfully connects on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failure:', err.stack);
    } else {
        const targetHost = process.env.DATABASE_URL ? 'Supabase Cloud Cluster' : 'Local Engine';
        console.log(`✅ Connected to PostgreSQL successfully! Target: ${targetHost}`);
    }
});

module.exports = pool;