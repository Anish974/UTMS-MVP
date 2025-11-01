import React, { useState } from 'react';

function ConnectionPanel({ apiUrl }) {
  const [ports, setPorts] = useState([]);
  const [port, setPort] = useState('');
  const [baud, setBaud] = useState(57600);
  const [loading, setLoading] = useState(false);

  const scanPorts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/ports/scan`);
      const data = await response.json();
      if (data.success) {
        setPorts(data.ports);
        if (data.ports.length > 0) {
          setPort(data.ports[0].port);
        }
      }
      alert(`Found ${data.count} COM port(s)`);
    } catch (error) {
      alert('Port scan failed: ' + error.message);
    }
    setLoading(false);
  };

  const autoConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auto-connect`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setPort(data.port);
        alert(`Auto-connected to ${data.port}`);
      } else {
        alert('Auto-connect failed: ' + data.message);
      }
    } catch (error) {
      alert('Auto-connect error: ' + error.message);
    }
    setLoading(false);
  };

  const connect = async () => {
    if (!port) {
      alert('Please select a port');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, baud })
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert('Connection failed: ' + error.message);
    }
    setLoading(false);
  };

  const disconnect = async () => {
    try {
      const response = await fetch(`${apiUrl}/disconnect`, {
        method: 'POST'
      });
      const data = await response.json();
      alert('Disconnected');
    } catch (error) {
      alert('Disconnect failed: ' + error.message);
    }
  };

  return (
    <div className="panel">
      <h2>Connection (Mission Planner Style)</h2>
      
      <button onClick={scanPorts} disabled={loading} className="btn-secondary">
        🔍 Scan Ports
      </button>
      
      <button onClick={autoConnect} disabled={loading} className="btn-secondary">
        ⚡ AUTO Connect
      </button>

      <select value={port} onChange={(e) => setPort(e.target.value)}>
        <option value="">Select Port...</option>
        {ports.map(p => (
          <option key={p.port} value={p.port}>
            {p.port} - {p.description}
          </option>
        ))}
      </select>

      <select value={baud} onChange={(e) => setBaud(e.target.value)}>
        <option value="57600">57600 Baud (Default)</option>
        <option value="115200">115200 Baud</option>
        <option value="9600">9600 Baud</option>
      </select>

      <button onClick={connect} disabled={!port || loading} className="btn-primary">
        Connect
      </button>
      <button onClick={disconnect} className="btn-danger">
        Disconnect
      </button>
    </div>
  );
}

export default ConnectionPanel;
