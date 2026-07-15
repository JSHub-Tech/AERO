import { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

// --- ULTRA LOW-POLY PROCEDURAL AIRPLANE GEOMETRY (CACHED GLOBALLY) ---
// By defining these at the module level, we create the geometry exactly once in GPU memory.
// This permanently prevents WebGL memory leaks when the component re-renders!
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const bodyGeo = new THREE.CylinderGeometry(0.1, 0.3, 2.5, 6);
bodyGeo.rotateX(Math.PI / 2);
const wingGeo = new THREE.BoxGeometry(2.5, 0.05, 0.6);
const tailGeo = new THREE.BoxGeometry(1.0, 0.05, 0.3);
const finGeo = new THREE.BoxGeometry(0.05, 0.8, 0.5);
const finPositions = finGeo.attributes.position;
for (let i = 0; i < finPositions.count; i++) {
  if (finPositions.getY(i) > 0) finPositions.setZ(i, finPositions.getZ(i) - 0.3);
}

const createLowPolyAirplane = () => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(bodyGeo, planeMaterial);
  group.add(body);
  const wings = new THREE.Mesh(wingGeo, planeMaterial);
  wings.position.set(0, 0, 0.2);
  group.add(wings);
  const tail = new THREE.Mesh(tailGeo, planeMaterial);
  tail.position.set(0, 0, -1.0);
  group.add(tail);
  const fin = new THREE.Mesh(finGeo, planeMaterial);
  fin.position.set(0, 0.4, -1.0);
  group.add(fin);
  return group;
};

// Uses the same polar->cartesian convention as three-globe internally so our
// manually-computed surface normal lines up with where three-globe actually
// places the point.
function outwardNormal(lat, lng) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lng) * (Math.PI / 180);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ).normalize();
}

// Helper to safely extract lat/lng from any route coordinate formats
// (e.g. [lat, lng], {lat, lng}, {Latitude, Longitude})
function getCoordinateValue(point, type) {
  if (!point) return null;
  
  if (Array.isArray(point)) {
    return type === 'lat' ? point[0] : point[1];
  }
  
  if (type === 'lat') {
    return point.lat ?? point.Latitude ?? point.latitude;
  } else {
    return point.lng ?? point.lon ?? point.Longitude ?? point.longitude;
  }
}

const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Bright red

// Builds a true 3D map pin that respects the globe's curvature and rotation
function buildPointerObject(d) {
  const normal = outwardNormal(d.Latitude, d.Longitude);

  const anchor = new THREE.Group();
  anchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

  // Group to hold the pin components
  const pinGroup = new THREE.Group();
  
  // 1. The pointy stem (Cone pointing down)
  const coneGeo = new THREE.ConeGeometry( 1.2, 5, 16 );
  const cone = new THREE.Mesh(coneGeo, pinMaterial);
  cone.rotation.x = Math.PI; // Point tip downwards
  cone.position.y = 2.5; // Shift so tip is exactly at origin (y=0)
  
  // 2. The round top (Sphere sitting on the flat base of the cone)
  const sphereGeo = new THREE.SphereGeometry( 1.8, 16, 16 );
  const sphere = new THREE.Mesh(sphereGeo, pinMaterial);
  sphere.position.y = 5; // Placed on top of the cone
  
  pinGroup.add(cone);
  pinGroup.add(sphere);
  
  // Lift the whole pin slightly off the surface to simulate a hovering drop-pin
  pinGroup.position.y = 1.5;   
  
  anchor.add(pinGroup);

  return anchor;
}

export default function GlobeViewer({ airports, routes, flights, selectedAirportCode, onAirportClick, disableInteractions }) {
  const globeEl = useRef();

  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = !selectedAirportCode; 
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = false; // Disable zooming so the earth size remains fixed
      
      controls.minDistance = 180; 
      controls.maxDistance = 550; 
    }
  }, [selectedAirportCode]);

  useEffect(() => {
    if (globeEl.current) {
      if (selectedAirportCode) {
        const target = airports.find(a => a.Airport_Code === selectedAirportCode);
        if (target) {
          globeEl.current.pointOfView({ lat: target.Latitude, lng: target.Longitude, altitude: 1.6 }, 2000);
        }
      } else {
        // Reduced altitude further to 1.85 to make the Earth appear even larger
        globeEl.current.pointOfView({ lat: 28, lng: 65, altitude: 1.85 }, 2000);
      }
    }
  }, [selectedAirportCode, airports]);

  // --- Ultra-lightweight Dummy Flights ---
  useEffect(() => {
    if (!globeEl.current) return;
    
    // Hide all dummy planes when zoomed in on a specific airport
    if (selectedAirportCode) return;
    
    let animationFrameId;
    const DUMMY_ROUTES = [
      { src: { lat: 24.90, lng: 67.16 }, dst: { lat: 51.47, lng: -0.45 } }, // KHI -> LHR
      { src: { lat: 33.61, lng: 72.80 }, dst: { lat: 25.25, lng: 55.36 } }, // ISB -> DXB
      { src: { lat: 31.52, lng: 74.40 }, dst: { lat: 40.64, lng: -73.77 } }, // LHE -> JFK
      { src: { lat: 24.90, lng: 67.16 }, dst: { lat: 21.53, lng: 39.15 } }, // KHI -> JED
      { src: { lat: 33.61, lng: 72.80 }, dst: { lat: 43.67, lng: -79.62 } }, // ISB -> YYZ
    ];

    let airplanes = [];

    // Instantiate 5 low-poly planes immediately
    for (let i = 0; i < 5; i++) {
      const wrapper = new THREE.Group();
      const planeObj = createLowPolyAirplane();
      
      // Scale it up significantly (Globe radius is ~100 units)
      planeObj.scale.set(0.6, 0.6, 0.6);
      
      // No extra rotation needed, the nose is already facing +Z
      
      wrapper.add(planeObj);
      
      const route = DUMMY_ROUTES[i % DUMMY_ROUTES.length];
      
      // We store a unique time offset for each plane so they don't all fly in sync
      airplanes.push({
        mesh: wrapper,
        route: route,
        timeOffset: Math.random() * 100000 
      });
      
      globeEl.current.scene().add(wrapper);
    }
    
    const animateFlights = () => {
      if (!globeEl.current) return;
      
      const now = Date.now();
      
      airplanes.forEach(flight => {
        // Pure time-based ping-pong animation (0 to 1 and back to 0)
        // 20000ms (20 seconds) for a one-way trip
        const t = ((now + flight.timeOffset) % 40000) / 20000; 
        const progress = t > 1 ? 2 - t : t; 
        
        const currentLat = flight.route.src.lat + (flight.route.dst.lat - flight.route.src.lat) * progress;
        const currentLng = flight.route.src.lng + (flight.route.dst.lng - flight.route.src.lng) * progress;
        const currentAlt = 0.015 + Math.sin(progress * Math.PI) * 0.12;
        
        const { x, y, z } = globeEl.current.getCoords(currentLat, currentLng, currentAlt);
        flight.mesh.position.set(x, y, z);
        
        // Calculate the next tiny step to figure out which way the nose should point
        const nextT = ((now + 16 + flight.timeOffset) % 40000) / 20000;
        const nextProgress = nextT > 1 ? 2 - nextT : nextT;
        
        const nextLat = flight.route.src.lat + (flight.route.dst.lat - flight.route.src.lat) * nextProgress;
        const nextLng = flight.route.src.lng + (flight.route.dst.lng - flight.route.src.lng) * nextProgress;
        const nextAlt = 0.015 + Math.sin(nextProgress * Math.PI) * 0.12;
        const nextPos = globeEl.current.getCoords(nextLat, nextLng, nextAlt);
        
        flight.mesh.lookAt(nextPos.x, nextPos.y, nextPos.z);
      });
      
      animationFrameId = requestAnimationFrame(animateFlights);
    };
    
    animateFlights();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (globeEl.current) {
         const scene = globeEl.current.scene();
         airplanes.forEach(f => scene.remove(f.mesh));
      }
    };
  }, [selectedAirportCode]);

  const visibleAirports = selectedAirportCode ? airports.filter(a => a.Airport_Code === selectedAirportCode) : airports;
  
  const visibleRoutes = selectedAirportCode 
    ? routes.filter(r => r.Source_Airport_Code === selectedAirportCode || r.Destination_Airport_Code === selectedAirportCode)
    : routes;

  const handlePointClick = (point) => {
    if (onAirportClick) {
      onAirportClick(point.Airport_Code);
    }
  };

  const selectedAirport = selectedAirportCode
    ? airports.find(a => a.Airport_Code === selectedAirportCode)
    : null;

  const ringsData = selectedAirport ? [selectedAirport] : [];
  const objectsData = selectedAirport ? [selectedAirport] : [];

  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing flex justify-center items-center relative z-10">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={false}
        
        // --- Airports ---
        pointsData={visibleAirports}
        pointLat="Latitude"
        pointLng="Longitude"
        pointColor={() => '#00F0FF'}
        pointAltitude={0.02} 
        pointRadius={selectedAirportCode ? 0.6 : 0.3} 
        onPointClick={disableInteractions ? null : handlePointClick}
        pointLabel={disableInteractions ? () => '' : d => `
          <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); padding: 10px 14px; border-radius: 8px; color: #1C2B22; border: 1px solid rgba(0, 79, 48, 0.2); box-shadow: 0 4px 20px rgba(0, 79, 48, 0.1); font-family: 'Outfit', sans-serif;">
            <strong style="color: #004F30; font-size: 16px; letter-spacing: 1px;">${d.Airport_Code}</strong><br/>
            <span style="font-size: 13px; color: #64748b; font-weight: 500;">${d.City}, ${d.Country}</span>
            ${!selectedAirportCode ? '<br/><span style="font-size: 11px; color: #A89411; margin-top: 4px; display: block; font-weight: bold;">[ Click to view details ]</span>' : ''}
          </div>
        `}

        // --- Rings ---
        ringsData={ringsData}
        ringLat="Latitude"
        ringLng="Longitude"
        ringAltitude={0.012}
        ringColor={() => t => `rgba(250, 204, 21, ${1 - t})`}
        ringMaxRadius={4.5}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1100}

        // --- Pin Pointer ---
        objectsData={objectsData}
        objectLat="Latitude"
        objectLng="Longitude"
        objectAltitude={0}
        objectFacesSurface={false}
        objectThreeObject={buildPointerObject}

        // --- Beautiful 3D Flight Arcs ---
        arcsData={visibleRoutes}
        
        // Robust coordinate mapping fallbacks for all formats
        arcStartLat={d => {
          const raw = d.Source_Latitude ?? d.startLat ?? (Array.isArray(d) ? d[0] : null);
          const val = getCoordinateValue(raw, 'lat') ?? getCoordinateValue(d, 'lat');
          return val !== null && val !== undefined ? Number(val) : null;
        }}
        arcStartLng={d => {
          const raw = d.Source_Longitude ?? d.startLng ?? (Array.isArray(d) ? d[0] : null);
          const val = getCoordinateValue(raw, 'lng') ?? getCoordinateValue(d, 'lng');
          return val !== null && val !== undefined ? Number(val) : null;
        }}
        arcEndLat={d => {
          const raw = d.Destination_Latitude ?? d.endLat ?? (Array.isArray(d) ? d[1] : null);
          const val = getCoordinateValue(raw, 'lat') ?? getCoordinateValue(d, 'lat');
          return val !== null && val !== undefined ? Number(val) : null;
        }}
        arcEndLng={d => {
          const raw = d.Destination_Longitude ?? d.endLng ?? (Array.isArray(d) ? d[1] : null);
          const val = getCoordinateValue(raw, 'lng') ?? getCoordinateValue(d, 'lng');
          return val !== null && val !== undefined ? Number(val) : null;
        }}
        
        arcAltitudeAutoScale={0.22} // Beautiful Bezier altitude curve
        arcStroke={selectedAirportCode ? 0.35 : 0.18} // Clean, crisp line thicknesses
        
        // Fades from bright emerald green to semi-translucent green
        arcColor={() => ['rgba(16, 185, 129, 0.7)', 'rgba(16, 185, 129, 0.05)']} 
        
        // Flowing flight light pulses
        arcDashLength={0.4}
        arcDashGap={1.2}
        arcDashAnimateTime={2500} // Flow speed
        arcDashInitialGap={() => Math.random()}
      />
    </div>
  );
}