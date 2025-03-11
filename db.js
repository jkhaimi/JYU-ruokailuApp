const { Client } = require('pg');
require('dotenv').config(); 

const client = new Client({
  host: process.env.DB_HOST, // Määritä ympäristömuuttuja
  port: process.env.DB_PORT, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => console.log("Connected to database"))
    .catch(err => {
        console.error("Database connection error:", err.message);
        console.error("Error details:", err);
    });

module.exports = client;
