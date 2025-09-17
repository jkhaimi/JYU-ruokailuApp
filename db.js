const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // Required for Supabase pooler
});

client.connect()
  .then(() => console.log("✅ Connected to database via Supabase pooler"))
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
  });

module.exports = client;
