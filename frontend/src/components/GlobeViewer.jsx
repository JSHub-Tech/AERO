import { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

export default function GlobeViewer({ airports, routes, flights, selectedAirportCode, onAirportClick, disableInteractions }) {
  const globeEl = useRef();

  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = !selectedAirportCode; 
      controls.autoRotateSpeed = 0.3;
      
      // Relax limits so home page can zoom out nicely
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
        // Backed out the earth slightly more so it perfectly fits widescreen displays without vertical clipping
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
