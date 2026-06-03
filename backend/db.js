const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool using variables from your .env file
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// A quick test to make sure it successfully connects on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failure:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL successfully!');
    }
});

module.exports = pool;