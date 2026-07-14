import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import GlobeViewer from '../components/GlobeViewer';
import BookingDemo from './BookingDemo';
import About from './About';
import Contact from './Contact';

export default function Home() {
  const [selectedAirportCode, setSelectedAirportCode] = useState(null);
  
  const [airports, setAirports] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [flights, setFlights] = useState([]);
  const [airportDetailsMap, setAirportDetailsMap] = useState({});

  useEffect(() => {
    const fetchCsv = (url) => {
      return fetch(url).then(res => res.text()).then(csv => new Promise((resolve) => {
        Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: (results) => resolve(results.data) });
      }));
    };

    Promise.all([
      fetchCsv('/airport.csv'), fetchCsv('/routes.csv'),
      fetchCsv('/flight_schedule.csv'), fetchCsv('/airport_details.csv')
    ]).then(([airportData, routeData, flightData, detailsData]) => {
      
      const validAirports = airportData.filter(row => row.Latitude && row.Longitude).map(row => ({
        ...row, Latitude: Number(row.Latitude), Longitude: Number(row.Longitude)
      }));
      setAirports(validAirports);

      const aMap = {};
      validAirports.forEach(a => { aMap[a.Airport_Code] = a; });

      const mappedRoutes = routeData.map(route => {
        const src = aMap[route.Source_Airport_Code];
        const dst = aMap[route.Destination_Airport_Code];
        if (src && dst) return [ [src.Latitude, src.Longitude, 0.01], [dst.Latitude, dst.Longitude, 0.01] ];
        return null;
      }).filter(Boolean);
      setRoutes(mappedRoutes);

      const mappedFlights = flightData.map(flight => {
        const src = aMap[flight.departure_airport];
        const dst = aMap[flight.arrival_airport];
        if (src && dst) return { ...flight, startLat: src.Latitude, startLng: src.Longitude, endLat: dst.Latitude, endLng: dst.Longitude };
        return null;
      }).filter(Boolean);
      setFlights(mappedFlights);

      const dMap = {};
      detailsData.forEach(d => { dMap[d.Airport_Code] = d; });
      setAirportDetailsMap(dMap);
    });
  }, []);

  // Lock global scroll when in Single Airport View
  useEffect(() => {
    if (selectedAirportCode) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }, [selectedAirportCode]);

  const airportFlights = selectedAirportCode ? flights.filter(f => f.departure_airport === selectedAirportCode || f.arrival_airport === selectedAirportCode) : [];
  const selectedDetails = selectedAirportCode ? airportDetailsMap[selectedAirportCode] : null;

  return (
    <div className="w-full relative">
      
      {/* 1. HERO SECTION (The 3D Globe & UI Panels) */}
      <section id="hero" className="snap-start flex flex-col md:flex-row h-[calc(100vh-80px)] w-full items-center justify-center relative overflow-hidden bg-[#F8F9FA]">
        
        {/* Soft light gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-[#F8F9FA] to-[#F0F4F2] -z-10"></div>
        
        <div className={`text-left z-20 w-full md:w-[45%] h-full flex flex-col pt-10 md:pt-24 px-4 md:px-12 absolute left-0 pointer-events-none transition-all duration-700 ${selectedAirportCode ? 'md:bg-white/80 backdrop-blur-xl border-r border-gray-200 shadow-2xl justify-center pt-0' : ''}`}>
          
          {selectedAirportCode && selectedDetails ? (
            
            <div className="pointer-events-auto h-full overflow-y-auto py-28 scrollbar-hide">
              <button onClick={() => setSelectedAirportCode(null)} className="mb-6 text-gray-400 hover:text-[#004F30] transition-colors flex items-center gap-2 font-bold tracking-widest text-sm">
                &larr; BACK TO GLOBAL NETWORK
              </button>

              <div className="w-full h-56 bg-white border border-gray-200 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative shadow-md">
                <img src={`/airport_pics/${selectedDetails.Airport_Code}_1.jpg`} alt={selectedDetails.City} className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-multiply" onError={(e) => { e.target.style.display = 'none'; }} />
                <span className="text-white font-bold tracking-widest relative z-10 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">[ {selectedDetails.Airport_Code} TERMINAL ]</span>
              </div>
              
              <h2 className="text-5xl font-bold tracking-wider text-[#1C2B22]">
                {selectedDetails.Airport_Code}
              </h2>
              <p className="text-2xl text-[#004F30] font-medium mt-1 mb-6">{selectedDetails.City}, {selectedDetails.Country}</p>
              
              <div className="mb-6 border-b border-gray-200 pb-6 flex gap-3 flex-wrap">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${selectedDetails.Operational_Status === 'Active' ? 'bg-[#004F30]/10 text-[#004F30] border border-[#004F30]/20' : 'bg-red-100 text-red-700'}`}>
                  {selectedDetails.Operational_Status}
                </span>
                <span className="px-4 py-1.5 bg-gray-100 rounded-full text-sm text-[#1C2B22] border border-gray-200 font-semibold tracking-wide">
                  {selectedDetails.Annual_Passengers} Passengers
                </span>
              </div>
              
              <p className="text-gray-600 leading-relaxed font-medium mb-8 text-lg">
                {selectedDetails.Description_Blog}
              </p>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mt-8 shadow-[0_10px_30px_rgba(0,79,48,0.05)]">
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-[#1C2B22] font-bold tracking-widest text-sm">LIVE FLIGHT SCHEDULE</h3>
                  <span className="text-xs text-[#004F30] font-bold px-3 py-1 bg-[#004F30]/10 rounded-md">REAL-TIME</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {airportFlights.length > 0 ? (
                    <table className="w-full text-left text-sm text-[#1C2B22]">
                      <thead className="bg-[#F8F9FA] sticky top-0 text-gray-500 text-xs tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 font-bold">FLIGHT</th>
                          <th className="px-6 py-3 font-bold">DESTINATION / ORIGIN</th>
                          <th className="px-6 py-3 font-bold">TIME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {airportFlights.map((f, i) => (
                          <tr key={i} className={`border-b border-gray-100 hover:bg-[#F0F4F2] transition-colors font-medium ${i % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F2]'}`}>
                            <td className="px-6 py-4 font-bold text-[#004F30]">{f.flight_number}</td>
                            <td className="px-6 py-4">{f.arrival_airport === selectedAirportCode ? `From ${f.departure_airport}` : `To ${f.arrival_airport}`}</td>
                            <td className="px-6 py-4 text-[#A89411] font-bold">{f.departure_time_of_day}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-gray-500 font-medium">No active flights scheduled for this hub.</div>
                  )}
                </div>
              </div>
            </div>
            
          ) : (
            
            <div className="bg-white/75 backdrop-blur-xl border border-white p-10 rounded-3xl shadow-[0_10px_40px_rgba(0,79,48,0.08)] w-full pointer-events-auto transform transition-all translate-x-0 opacity-100 mt-20 md:mt-0">
              <h1 className="text-5xl md:text-7xl font-bold tracking-widest flex items-center gap-4 text-[#1C2B22]">
                AERO <img src="/logo.png" alt="AERO" className="h-12 md:h-16 object-contain opacity-90" />
              </h1>
              <p className="mt-6 text-gray-600 text-lg md:text-xl font-medium leading-relaxed">
                Welcome to the next generation of Pakistan International Airlines' operational dashboard. Explore live telemetry across the globe.
              </p>
              <a href="#tickets" className="mt-8 inline-block px-10 py-5 bg-[#004F30] hover:bg-[#1C2B22] text-white font-bold tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl">
                EXPLORE ROUTES
              </a>
            </div>
            
          )}
          
        </div>

        <div className={`z-10 absolute inset-0 w-full h-full pointer-events-auto transition-all duration-1000 ${selectedAirportCode ? 'md:left-[45%] md:w-[55%]' : 'md:left-[40%] md:w-[60%]'}`}>
          <GlobeViewer 
            airports={airports}
            routes={routes}
            flights={flights}
            selectedAirportCode={selectedAirportCode}
            onAirportClick={setSelectedAirportCode}
            disableInteractions={true}
          />
        </div>
      </section>

      {!selectedAirportCode && (
        <>
          <section className="snap-start w-full">
            <BookingDemo />
          </section>
          <section className="snap-start w-full">
            <About />
          </section>
          <section className="snap-start w-full">
            <Contact />
          </section>
        </>
      )}

    </div>
  );
}
