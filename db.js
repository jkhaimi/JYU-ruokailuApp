const { Client } = require('pg');
require('dotenv').config(); 

const client = new Client({
  host: 'jyu-ruokailuapp-db.ctssok4qcnhk.eu-north-1.rds.amazonaws.com',
  port: 5432,        
  user: 'postgres', 
  password: 'MRwest19!!',
  database: 'ruokailudb',
  ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => console.log("Connected to database"))
    .catch(err => {
        console.error("Database connection error:", err.message);
        console.error("Error details:", err);
    });


module.exports = client;
