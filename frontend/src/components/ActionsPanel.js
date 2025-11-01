import React, { useState } from 'react';

function ActionsPanel({ apiUrl, telemetry }) {
  const [altitude, setAltitude] = useState(10);

  const arm = async () => {
    try {
      const response = await fetch(`${apiUrl}/arm`, { method: 'POST' });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert('Arm failed');
    }
  };

  const disarm = async () => {
    try {
      const response = await fetch(`${apiUrl}/disarm`, { method: 'POST' });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert('Disarm failed');
    }
  };

  const takeoff = async () => {
    try {
      const response = await fetch(`${apiUrl}/takeoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altitude })
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert('Takeoff failed');
    }
  };

  const land = async () => {
    try {
      const response = await fetch(`${apiUrl}/land`, { method: 'POST' });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert('Land failed');
    }
  };

  return (
    <div className="panel">
      <h2>Actions</h2>
      <div>
        <button onClick={arm} disabled={telemetry.armed} className="btn-primary">
          ARM
        </button>
        <button onClick={disarm} disabled={!telemetry.armed} className="btn-danger">
          DISARM
        </button>
      </div>
      <div style={{marginTop: '15px'}}>
        <input
          type="number"
          value={altitude}
          onChange={(e) => setAltitude(e.target.value)}
          min="1"
          max="50"
          placeholder="Altitude (m)"
        />
        <button onClick={takeoff} disabled={!telemetry.armed} className="btn-secondary">
          TAKEOFF
        </button>
        <button onClick={land} disabled={!telemetry.armed} className="btn-warning">
          LAND
        </button>
      </div>
    </div>
  );
}

export default ActionsPanel;
