import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAPBOX_TOKEN = "pk.eyJ1IjoiYW5pc2gxMTM3YXAiLCJhIjoiY21oZ2M4YTl0MGJlZzJsczdkcTdmbGNpciJ9.s6J8NZo8YRm49iRF4GgNuA";

const styles = {
  Streets: "mapbox/streets-v11",
  Satellite: "mapbox/satellite-v9",
  Hybrid: "mapbox/satellite-streets-v11",
  Terrain: "mapbox/outdoors-v11",
  Light: "mapbox/light-v10",
  Dark: "mapbox/dark-v10",
};

// Helper to pan map smoothly
function Panner({ position }) {
  const map = useMap();
  React.useEffect(() => {
    if (position) map.setView(position, 13);
  }, [position, map]);
  return null;
}

function MapView({ location }) {
  const [currentStyle, setCurrentStyle] = useState("Streets");
  const [search, setSearch] = useState('');
  const [searchLatLng, setSearchLatLng] = useState(null);
  const markerRef = useRef();

  const lat = location?.lat ?? 0;
  const lon = location?.lon ?? 0;
  const defaultCenter = [28.6139, 77.2090];
  const center = searchLatLng ? searchLatLng : ((lat !== 0 && lon !== 0) ? [lat, lon] : defaultCenter);
  const tileUrl = `https://api.mapbox.com/styles/v1/${styles[currentStyle]}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;

  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(search)}.json?access_token=${MAPBOX_TOKEN}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setSearchLatLng([lat, lng]);
      } else {
        alert('No location found');
      }
    } catch {
      alert('Search error');
    }
  }

  return (
    <div style={{ flex: 1, position: 'relative', height: '100%' }}>
      {/* Style dropdown overlay top-right */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(34,34,34,0.92)',
          borderRadius: 8,
          padding: '8px 14px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
          zIndex: 1000,
          color: 'white',
          minWidth: '140px',
        }}
      >
        <label style={{ 
          marginRight: 4, 
          fontWeight: 600, 
          fontSize: '0.98em', 
          letterSpacing: '.01em' 
        }}>
          Map Style:
        </label>
        <select
          value={currentStyle}
          onChange={e => setCurrentStyle(e.target.value)}
          style={{
            background: 'rgba(44,44,44,1)',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            padding: '5px 8px',
            fontSize: '1em',
            cursor: 'pointer',
            outline: 'none',
            fontWeight: 500
          }}
        >
          {Object.keys(styles).map(option =>
            <option key={option} value={option}>{option}</option>
          )}
        </select>
      </div>
      {/* Beautiful search bar overlay left, below map controls */}
     <form
  style={{
    position: 'absolute',
    width:"19rem",
    top: 20,
    left: 62, // Show to the right of zoom buttons
    background: 'rgba(34, 34, 34, 0.83)', // semi-transparent black
    borderRadius: 27,
    padding: '5px 16px 5px 20px',
    boxShadow: '0 2px 14px 0 rgba(0,0,0,0.17)',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    // minWidth: 270,
    // maxWidth: 380,
    border: '2px solid #444'
  }}
  onSubmit={handleSearch}
>
  <input
    type="text"
    value={search}
    onChange={e => setSearch(e.target.value)}
    placeholder="Search..."
    style={{
      border: 'none',
      width:"4rem",
      borderRadius: 18,
      outline: 'none',
      // padding: '8px 10px',
      fontSize: '1.11em',
      backgroundColor: "#15151575",
      fontWeight: '500',
      color: '#fff',
      flex: 1,
      minWidth: 80,
      maxWidth: 2400,
      boxShadow: 'none',
      
      // marginRight: '0px'
    }}
  />
  <button
    type="submit"
    style={{
      background: "none",
      width:"55px",
      border: "none",
      borderRadius: "22px",
      // padding: "0px 0px",
      // marginLeft: "220px",
      cursor: "pointer",
      display: 'flex',
      alignItems: 'center',
      color: '#fff',
    }}
    aria-label="Search"
  >
    <svg width="27" height="27" fill="none" stroke="#fcf5b2" strokeWidth="2.2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.7" y2="16.7" />
    </svg>
  </button>
</form>


      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
          tileSize={512}
          zoomOffset={-1}
        />
        {searchLatLng &&
          <Marker position={searchLatLng} ref={markerRef}>
            <Popup>Search result</Popup>
          </Marker>
        }
        {!searchLatLng && lat !== 0 && lon !== 0 &&
          <Marker position={[lat, lon]}>
            <Popup>
              Drone Position<br />
              {lat.toFixed(6)}, {lon.toFixed(6)}
            </Popup>
          </Marker>
        }
        <Panner position={center} />
      </MapContainer>
    </div>
  );
}

export default MapView;
