import { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

// Uses the same polar->cartesian convention as three-globe internally
function outwardNormal(lat, lng) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lng) * (Math.PI / 180);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ).normalize();
}

// 1. Load your vibrant red pin texture
const pointerTexture = new THREE.TextureLoader().load('/pointer__.png');

// 2. Dynamic, soft radial red glow texture
const glowTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
  gradient.addColorStop(0.2, 'rgba(239, 68, 68, 0.5)');
  gradient.addColorStop(0.6, 'rgba(239, 68, 68, 0.15)');
  gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
})();

const pinMaterial = new THREE.SpriteMaterial({
  map: pointerTexture,
  transparent: true,
  depthWrite: false,
});

const glowMaterial = new THREE.SpriteMaterial({
  map: glowTexture,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false,
});

// Builds a completely stationary, face-on glowing pointer
function buildPointerObject(d) {
  const normal = outwardNormal(d.Latitude, d.Longitude);

  const anchor = new THREE.Group();
  // Align anchor orientation with the globe's surface normal
  anchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

  // 3. Pin Sprite: Always faces the camera, keeping the original color 100% visible
  const pin = new THREE.Sprite(pinMaterial);
  pin.scale.set(8, 11, 1);
  
  // Set the pivot point to the bottom-center (the sharp tip of the pin)
  pin.center.set(0.5, 0); 
  
  // Hover height above the airport surface (completely stationary)
  pin.position.y = 2.0; 
  anchor.add(pin);

  // 4. Glow Sprite: Creates a soft red aura behind the pin
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(16, 16, 1);
  glow.position.y = 7.5; // Centered relative to the pin body
  anchor.add(glow);

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
        globeEl.current.pointOfView({ lat: 28, lng: 65, altitude: 2.9 }, 2000);
      }
    }
  }, [selectedAirportCode, airports]);

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
        
        pointsData={visibleAirports}
        pointLat="Latitude"
        pointLng="Longitude"
        pointColor={() => '#A89411'} 
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

        ringsData={ringsData}
        ringLat="Latitude"
        ringLng="Longitude"
        ringAltitude={0.012}
        ringColor={() => t => `rgba(250, 204, 21, ${1 - t})`}
        ringMaxRadius={4.5}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1100}

        objectsData={objectsData}
        objectLat="Latitude"
        objectLng="Longitude"
        objectAltitude={0}
        objectFacesSurface={false}
        objectThreeObject={buildPointerObject}

        pathsData={visibleRoutes}
        pathPoints={d => d}
        pathPointAlt={0.01}
        pathColor={() => 'rgba(0, 79, 48, 0.6)'}
        pathStroke={selectedAirportCode ? 1.5 : 0.5}
        pathDashLength={0.1}
        pathDashGap={0.05}
        pathDashAnimateTime={2000}
      />
    </div>
  );
}