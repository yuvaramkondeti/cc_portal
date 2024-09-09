const express = require('express');
const cors = require('cors'); // To handle CORS issues
const axios = require('axios');
const { exec } = require('child_process');
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware');
const port = 3000;

app.use(cors()); // Enable CORS

// Replace with your Cruise Control endpoint
//const CRUISE_CONTROL_URL = 'http://localhost:9090';
const proxyTable = {
    'localhost:3000': 'http://localhost:9090', //redirect port 3000 to port XXXX
  };
const proxyMiddleware = createProxyMiddleware({
    target: 'http://localhost:3000',
    router: proxyTable,
    changeOrigin: true
    });

//app.use(proxyMiddleware);

// Example endpoint to fetch Kafka topics
app.get('/run-command', async (req, res) => {
    try {
        /*exec('command', (error, stdout, stderr) => {
        if (error) {
           return res.status(500).json({ error: error.message });
        }
        if (stderr) {
           return res.status(400).json({ error: stderr });
        }
            res.json({ result: stdout });
        });*/
        res.send(`Hi! Server is listening on port ${port}`)

    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
