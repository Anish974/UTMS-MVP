import React from 'react';

function StatusBar({ telemetry }) {
  return (
    <div style={{
      background: '#2a2a2a',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      color: 'white',
      borderBottom: '2px solid #3a3a3a',
      flexWrap: 'wrap',
      gap: '20px'
    }}>
      <span>Status: {telemetry.connected ? '🟢 Connected' : '🔴 Disconnected'}</span>
      <span>GPS: {telemetry.gps_fix >= 3 ? '🟢 Fixed' : '🔴 No Fix'}</span>
      <span>Position: {(telemetry.lat || 0).toFixed(6)}, {(telemetry.lon || 0).toFixed(6)}</span>
      <span>Satellites: {telemetry.satellites || 0}</span>
    </div>
  );
}

export default StatusBar;
