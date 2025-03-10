const { Client } = require('pg');
require('dotenv').config(); 

const client = new Client({
  host: process.env.DB_HOST || 'jyu-ruokailuapp-db.ctssok4qcnhk.eu-north-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,        
  user: process.env.DB_USER || 'postgres', 
  password: process.env.DB_PASSWORD || 'salasana',
  database: process.env.DB_NAME || 'ruokailudb',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error", err.stack));

module.exports = client;
