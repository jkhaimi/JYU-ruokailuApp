export default async function handler(req, res) {
    const backendUrl = "http://ec2-51-20-10-127.eu-north-1.compute.amazonaws.com:5001" + req.url;
    
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method !== "GET" ? JSON.stringify(req.body) : null,
    });
  
    const data = await response.json();
    res.status(response.status).json(data);
  }
  