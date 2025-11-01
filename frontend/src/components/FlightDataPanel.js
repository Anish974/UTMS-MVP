import React from 'react';

function FlightDataPanel({ telemetry }) {
  const mode = telemetry.mode || 'N/A';
  const armed = telemetry.armed || false;
  const alt = parseFloat(telemetry.alt) || 0;
  const groundspeed = parseFloat(telemetry.groundspeed) || 0;
  const battery = parseFloat(telemetry.battery_remaining) || 0;
  const satellites = parseInt(telemetry.satellites) || 0;
  const gps_fix = parseInt(telemetry.gps_fix) || 0;

  // Debug logging
  React.useEffect(() => {
    console.log('Flight Data Updated:', {
      mode,
      armed,
      alt,
      groundspeed,
      battery,
      satellites,
      gps_fix
    });
  }, [telemetry]);

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
          <div className="value" style={{ color: satellites < 10 ? '#ff6666' : '#66ff66' }}>
            {satellites}
          </div>
        </div>
        <div className="data-item">
          <label>GPS Fix</label>
          <div className="value" style={{ color: gps_fix >= 3 ? '#66ff66' : '#ff6666' }}>
            {gps_fix >= 3 ? '🟢 Fixed' : '🔴 No Fix'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightDataPanel;
