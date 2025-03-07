const { Client } = require('pg');
require('dotenv').config(); 

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,        
  user: process.env.DB_USER || 'postgres', 
  password: process.env.DB_PASSWORD || 'salasana',
  database: process.env.DB_NAME || 'ruokailudb',
});

client.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error", err.stack));

module.exports = client;
