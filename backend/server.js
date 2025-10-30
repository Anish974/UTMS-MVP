const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 5000;
const PYTHON_BACKEND_URL = 'http://localhost:5555';

app.use(cors());
app.use(express.json());

async function callPythonBackend(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method: method,
      url: `${PYTHON_BACKEND_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) config.data = data;

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { success: false, message: error.message };
  }
}

// Special function to call python commands scan_ports & auto_connect parsing only last line JSON
function executePython(command) {
  return new Promise((resolve, reject) => {
    const cmd = `python "C:\\Users\\ASUS\\UTMS-MVP\\python-core\\drone_controller.py" ${command}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error);
        return;
      }
      try {
        // Parse only last line for JSON
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  });
}


// Port Scan routed via direct Python script call due to output formatting
app.get('/api/ports/scan', async (req, res) => {
  try {
    const result = await executePython('scan_ports');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Port scan failed: ' + error.message });
  }
});

// Auto-connect routed via direct Python script call due to output formatting
app.post('/api/auto-connect', async (req, res) => {
  try {
    const result = await executePython('auto_connect');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Auto-connect failed: ' + error.message });
  }
});


// Other API proxies to Python backend as normal
// Connection APIs
app.post('/api/connect', async (req, res) => {
  try {
    const result = await callPythonBackend('/connect', 'POST', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/disconnect', async (req, res) => {
  try {
    const result = await callPythonBackend('/disconnect', 'POST');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Telemetry
app.get('/api/telemetry', async (req, res) => {
  try {
    const result = await callPythonBackend('/telemetry');
    res.json(result);
  } catch (error) {
    res.status(500).json({ connected: false, message: error.message });
  }
});

// Flight Controls
app.post('/api/arm', async (req, res) => {
  try {
    const result = await callPythonBackend('/arm', 'POST');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/disarm', async (req, res) => {
  try {
    const result = await callPythonBackend('/disarm', 'POST');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/takeoff', async (req, res) => {
  try {
    const result = await callPythonBackend('/takeoff', 'POST', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/land', async (req, res) => {
  try {
    const result = await callPythonBackend('/land', 'POST');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/mode', async (req, res) => {
  try {
    const result = await callPythonBackend('/mode', 'POST', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/goto', async (req, res) => {
  try {
    const result = await callPythonBackend('/goto', 'POST', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// WebSocket telemetry streaming
wss.on('connection', (ws) => {
  console.log('✅ WebSocket client connected');

  const telemetryInterval = setInterval(async () => {
    try {
      const telemetry = await callPythonBackend('/telemetry');
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(telemetry));
      }
    } catch (error) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ error: 'Telemetry error' }));
      }
    }
  }, 500);

  ws.on('close', () => {
    clearInterval(telemetryInterval);
    console.log('❌ WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UTMS Backend is running' });
});


// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     🚁 UTMS Backend Server Started 🚁       ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ REST API running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket running on ws://localhost:${PORT}`);
  console.log('');
  console.log('Available Endpoints:');
  console.log('  Connection:');
  console.log('    POST /api/connect');
  console.log('    POST /api/disconnect');
  console.log('');
  console.log('  Telemetry:');
  console.log('    GET  /api/telemetry');
  console.log('    WS   ws://localhost:' + PORT);
  console.log('');
  console.log('  Flight Control:');
  console.log('    POST /api/arm');
  console.log('    POST /api/disarm');
  console.log('    POST /api/takeoff');
  console.log('    POST /api/land');
  console.log('    POST /api/mode');
  console.log('    POST /api/goto');
  console.log('');
  console.log('Health Check:');
  console.log('    GET  /api/health');
  console.log('');
});


module.exports = app;
