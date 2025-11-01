import React from 'react';

function FlightDataPanel({ telemetry }) {
  const mode = telemetry.mode || 'N/A';
  const armed = telemetry.armed || false;
  const alt = typeof telemetry.alt === 'number' ? telemetry.alt : 0;
  const groundspeed = typeof telemetry.groundspeed === 'number' ? telemetry.groundspeed : 0;
  const battery = typeof telemetry.battery_remaining === 'number' ? telemetry.battery_remaining : 0;
  const satellites = typeof telemetry.satellites === 'number' ? telemetry.satellites : 0;

  return (
    <div className="panel">
      <h2>Flight Data</h2>
      <div className="data-grid">
        <div className="data-item">
          <label>Mode</label>
          <div className="value">{mode}</div>
        </div>
        <div className="data-item">
          <label>Armed</label>
          <div className="value">{armed ? '⚠️ YES' : '✓ NO'}</div>
        </div>
        <div className="data-item">
          <label>Altitude</label>
          <div className="value">{alt.toFixed(1)} m</div>
        </div>
        <div className="data-item">
          <label>Speed</label>
          <div className="value">{groundspeed.toFixed(1)} m/s</div>
        </div>
        <div className="data-item">
          <label>Battery</label>
          <div className="value">{battery}%</div>
        </div>
        <div className="data-item">
          <label>Satellites</label>
          <div className="value">{satellites}</div>
        </div>
      </div>
    </div>
  );
}

export default FlightDataPanel;
