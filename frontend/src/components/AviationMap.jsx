import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Network } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Papa from 'papaparse';

// Fix for default marker icons (though we mainly use custom ones)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const popupOverrides = `
  .custom-light-popup .leaflet-popup-content-wrapper,
  .custom-light-popup .leaflet-popup-tip {
    background-color: #ffffff !important;
    color: #1C2B22 !important;
    box-shadow: 0 20px 50px -12px rgba(0, 79, 48, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid rgba(0,79,48,0.1);
  }
  .custom-light-popup .leaflet-popup-content {
    margin: 0 !important;
    padding: 0 !important;
    width: 220px !important;
  }
  
  .custom-airport-blip {
    background: transparent;
  }
  .custom-plane-icon {
    background: transparent;
  }
`;

const getCurvedPath = (startLat, startLng, endLat, endLng) => {
  const points = [];
  const numPoints = 50;

  const latDiff = endLat - startLat;
  const lngDiff = endLng - startLng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  
  const midLat = ((startLat + endLat) / 2) + (distance * 0.2); 
  const midLng = (startLng + endLng) / 2;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const invT = 1 - t;
    
    const lat = (invT * invT * startLat) + (2 * invT * t * midLat) + (t * t * endLat);
    const lng = (invT * invT * startLng) + (2 * invT * t * midLng) + (t * t * endLng);
    
    points.push([lat, lng]);
  }
  return points;
};

// Define airport icon outside of component so it doesn't get recreated on every 100ms render tick
const airportIcon = L.divIcon({
  className: 'custom-airport-blip',
  html: `<div class="w-3.5 h-3.5 bg-[#004F30] rounded-full border-[2px] border-white shadow-[0_2px_8px_rgba(0,79,48,0.5)] cursor-pointer hover:scale-125 transition-transform duration-300 pointer-events-auto"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -7],
});

export const AviationMap = () => {
  const navigate = useNavigate();
  const mapCenter = [29.0, 60.0];
  const defaultZoom = 4;

  const [airports, setAirports] = useState([]);
  const [showRoutes, setShowRoutes] = useState(false);
  const [routesData, setRoutesData] = useState([]);
  const [liveFlights, setLiveFlights] = useState([]);

  useEffect(() => {
    fetch('/airport.csv')
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: (h) => h.trim(),
          complete: (results) => setAirports(results.data),
        });
      })
      .catch((error) => console.error('Error fetching airport data:', error));
  }, []);

  useEffect(() => {
    fetch('/routes.csv')
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          complete: (results) => setRoutesData(results.data),
        });
      })
      .catch((error) => console.error('Error fetching routes data:', error));
  }, []);

  const airportCoords = useMemo(() => {
    const coords = {};
    airports.forEach((a) => {
      if (a.Airport_Code && a.Latitude && a.Longitude) {
        coords[a.Airport_Code] = [a.Latitude, a.Longitude];
      }
    });
    return coords;
  }, [airports]);

  useEffect(() => {
    // DUMMY FLIGHTS SIMULATION
    if (Object.keys(airportCoords).length === 0) return;

    // Pick a few routes that exist in the loaded data for the dummy flights, or hardcode them based on known large hubs.
    // We will simulate 4 flights
    const initialDummyFlights = [
      { id: 'PK701', flightNumber: 'PK701', source: 'KHI', dest: 'LHR', progress: 0.1 },
      { id: 'EK202', flightNumber: 'EK202', source: 'DXB', dest: 'JFK', progress: 0.5 },
      { id: 'QR303', flightNumber: 'QR303', source: 'DOH', dest: 'CDG', progress: 0.8 },
      { id: 'EY404', flightNumber: 'EY404', source: 'AUH', dest: 'FRA', progress: 0.3 },
    ];

    const interval = setInterval(() => {
      setLiveFlights((prev) => {
        // Use prev if populated, else initial
        const currentFlights = prev.length > 0 ? prev : initialDummyFlights;

        return currentFlights.map((df) => {
          let newProgress = (df.progress || 0) + 0.0003; // SLOWED DOWN significantly
          if (newProgress > 1) newProgress = 0; // Restart loop
          
          const start = airportCoords[df.source || df.departure];
          const end = airportCoords[df.destination || df.dest];
          
          // If coords not found, just return the data without lat/lng
          if (!start || !end) {
            return { ...df, progress: newProgress };
          }
          
          // Simple linear interpolation for lat/lng movement
          const lat = start[0] + (end[0] - start[0]) * newProgress;
          const lng = start[1] + (end[1] - start[1]) * newProgress;
          
          const dy = end[0] - start[0];
          const dx = end[1] - start[1];
          const heading = (Math.atan2(dx, dy) * 180) / Math.PI;

          return {
            id: df.id,
            flightNumber: df.flightNumber,
            source: df.source || df.departure,
            destination: df.destination || df.dest,
            lat,
            lng,
            heading,
            progress: newProgress,
            startCoords: start,
            endCoords: end
          };
        });
      });
    }, 100); // 100ms for smooth animation

    return () => clearInterval(interval);
  }, [airportCoords]);

// Cache plane icons by rounded heading to prevent constant marker re-creation and popup closing
const planeIconCache = {};
const getPlaneIcon = (heading) => {
  const roundedHeading = Math.round(heading / 10) * 10;
  if (!planeIconCache[roundedHeading]) {
    planeIconCache[roundedHeading] = L.divIcon({
      className: 'custom-plane-icon',
      html: `<div style="transform: rotate(${roundedHeading - 45}deg); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); cursor: pointer; pointer-events: auto; border-radius: 50%; background: transparent;">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#A89411" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.5l-1.8 1.8c-.3.3-.2.8.2 1l5.7 3.6-2.4 2.4-3.1-.9c-.3-.1-.7 0-.9.2L.6 15.6c-.3.3-.2.8.2 1l4.2 1.8 1.8 4.2c.2.4.7.5 1 .2l1.3-1.3c.2-.2.3-.6.2-.9l-.9-3.1 2.4-2.4 3.6 5.7c.2.4.7.5 1 .2l1.8-1.8c.3-.2.6-.6.5-1.1z"/></svg>
             </div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -20],
    });
  }
  return planeIconCache[roundedHeading];
};

  return (
    <div className="w-full h-full relative z-0 rounded-3xl overflow-hidden border border-white shadow-[0_20px_50px_rgba(0,79,48,0.05)]">
      <style>{popupOverrides}</style>
      
      {/* Network Routes Toggle Button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-lg transition-all border text-sm tracking-widest ${
            showRoutes 
              ? 'bg-[#004F30] border-[#004F30] text-white shadow-[#004F30]/20' 
              : 'bg-white/90 backdrop-blur-md border-gray-200 text-[#1C2B22] hover:bg-white'
          }`}
        >
          <Network className="w-4 h-4" />
          {showRoutes ? 'NETWORK: ON' : 'NETWORK: OFF'}
        </button>
      </div>

      <MapContainer 
        center={mapCenter} 
        zoom={defaultZoom} 
        minZoom={3}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        className="bg-[#EAEFF3]" 
        zoomControl={false}
      >
        {/* Carto Light Tiles for Premium Clean Aesthetic */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          noWrap={true}
        />

        {/* Render Network Routes if active */}
        {showRoutes && routesData.map((route, idx) => {
          const start = airportCoords[route.Source_Airport_Code];
          const end = airportCoords[route.Destination_Airport_Code];
          if (!start || !end) return null;
          
          const curvedPositions = getCurvedPath(start[0], start[1], end[0], end[1]);
          
          return (
            <Polyline
              key={`route-${idx}`}
              positions={curvedPositions}
              pathOptions={{ color: '#004F30', weight: 1.5, opacity: 0.15, dashArray: '5, 10' }}
            />
          );
        })}

        {/* Render Live Flights */}
        {liveFlights.map(flight => {
          if (!flight.lat || !flight.lng) return null;
          const currentPos = [flight.lat, flight.lng];
          
          return (
            <React.Fragment key={flight.id}>
              {/* Path already covered (solid line) */}
              {flight.startCoords && (
                <Polyline 
                  positions={[flight.startCoords, currentPos]} 
                  pathOptions={{ color: '#A89411', weight: 2, opacity: 0.8 }} 
                />
              )}
              
              {/* Path remaining (dashed line) */}
              {flight.endCoords && (
                <Polyline 
                  positions={[currentPos, flight.endCoords]} 
                  pathOptions={{ color: '#A89411', weight: 2, opacity: 0.3, dashArray: '4, 6' }} 
                />
              )}

              <Marker 
                position={currentPos}
                icon={getPlaneIcon(flight.heading)}
              >
              <Popup className="custom-light-popup">
                <div className="flex flex-col w-full h-full overflow-hidden rounded-[14px]">
                  <div className="p-4 pb-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between w-full">
                      <h4 className="text-[#004F30] font-black text-lg tracking-wide">{flight.flightNumber}</h4>
                      <div className="flex items-center text-[10px] uppercase font-extrabold tracking-widest text-[#A89411] bg-[#A89411]/10 px-2.5 py-1 rounded-full border border-[#A89411]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A89411] animate-pulse mr-2 shadow-[0_0_5px_rgba(168,148,17,0.8)]"></span>
                        LIVE
                      </div>
                    </div>
                    <p className="text-sm font-bold tracking-widest text-gray-500 mt-2">
                      {flight.source} <span className="text-[#004F30] mx-1">✈️</span> {flight.destination}
                    </p>
                  </div>
                  <div className="h-1.5 bg-gray-100 w-full mt-auto">
                    <div 
                      className="h-full bg-[#A89411] shadow-[0_0_8px_rgba(168,148,17,0.5)] transition-all duration-1000 ease-linear" 
                      style={{ width: `${flight.progress * 100}%` }}
                    ></div>
                  </div>
                </div>
              </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {airports.map((airport, idx) => {
          if (!airport.Latitude || !airport.Longitude) return null;
          
          return (
            <Marker 
              key={airport.Airport_Code || idx} 
              position={[airport.Latitude, airport.Longitude]}
              icon={airportIcon}
            >
              <Popup className="custom-light-popup">
                <div 
                  className="w-full cursor-pointer group rounded-[14px] overflow-hidden"
                  // Teleport directly to the cinematic Airports page using the query param
                  onClick={() => navigate(`/airports?code=${airport.Airport_Code}`)}
                >
                  <div className="h-28 w-full relative">
                    <img 
                      src={`/airport_pics/${airport.Airport_Code}_1.jpg`}
                      onError={(e) => e.target.src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&h=200&fit=crop'}
                      alt="Airport" 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 text-white font-black text-2xl tracking-wider drop-shadow-md">{airport.Airport_Code}</span>
                  </div>
                  <div className="p-3 bg-white">
                    <h3 className="font-bold text-[#1C2B22] text-[13px] leading-tight mb-2 truncate">{airport['Airport Name']}</h3>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{airport.Country}</span>
                      <span className="text-[#004F30] font-black text-[10px] uppercase tracking-widest group-hover:text-[#A89411] transition-colors flex items-center">HUD &rarr;</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
