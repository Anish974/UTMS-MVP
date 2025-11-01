import React, { useState, useEffect } from 'react';
import './App.css';
import ConnectionPanel from './components/ConnectionPanel';
import FlightDataPanel from './components/FlightDataPanel';
import ActionsPanel from './components/ActionsPanel';
import MapView from './components/MapView';
import StatusBar from './components/StatusBar';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [telemetry, setTelemetry] = useState({
    connected: false,
    armed: false,
    mode: 'N/A',
    lat: 0,
    lon: 0,
    alt: 0,
    groundspeed: 0,
    airspeed: 0,
    heading: 0,
    battery_voltage: 0,
    battery_remaining: 0,
    gps_fix: 0,
    satellites: 0,
    roll: 0,
    pitch: 0,
    yaw: 0
  });

  // Connect to WebSocket for real-time telemetry
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:5000');
    
    websocket.onopen = () => {
      console.log('✅ WebSocket connected');
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 Telemetry update:', data);
        setTelemetry(data);
      } catch (error) {
        console.error('❌ WebSocket parse error:', error);
      }
    };
    
    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('❌ WebSocket disconnected');
    };
    
    // Cleanup on unmount
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  return (
    <div className="app">
      <div className="sidebar">
        <img></img>
        <h1>🚁 BERAM UTM</h1>
        <ConnectionPanel apiUrl={API_URL} />
        <FlightDataPanel telemetry={telemetry} />
        <ActionsPanel apiUrl={API_URL} telemetry={telemetry} />
      </div>
      <div className="main-content">
        <StatusBar telemetry={telemetry} />
        <MapView location={{ lat: telemetry.lat, lon: telemetry.lon }} />
      </div>
    </div>
  );
}

export default App;
