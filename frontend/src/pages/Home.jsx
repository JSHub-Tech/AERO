import { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { getAirports, getRoutes, getFlightSchedule, getAirportDetails } from '../services/api';
import Footer from '../components/Footer';
import FleetTeaser from '../components/home/FleetTeaser';
import LiveOpsTeaser from '../components/home/LiveOpsTeaser';
import NetworkTeaser from '../components/home/NetworkTeaser';
import About from './About';
import Contact from './Contact';

// GlobeViewer pulls in three, @react-three/fiber, @react-three/drei, and
// react-globe.gl — a heavy bundle that isn't needed for first paint.
// Lazy-loading it keeps Home's text/hero content eager (fast first paint)
// while the 3D globe streams in behind a lightweight placeholder below.
const GlobeViewer = lazy(() => import('../components/GlobeViewer'));

// Lightweight placeholder shown while the 3D globe bundle loads
const GlobePlaceholder = () => (
  <div className="w-full h-full bg-[#F8F9FA] flex items-center justify-center text-gray-400 font-bold tracking-widest text-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-[#004F30] rounded-full animate-spin"></div>
      <span>LOADING GLOBE...</span>
    </div>
  </div>
);

export default function Home() {
  const [selectedAirportCode, setSelectedAirportCode] = useState(null);
  
  const [airports, setAirports] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [flights, setFlights] = useState([]);
  const [airportDetailsMap, setAirportDetailsMap] = useState({});
  
  const [heroInView, setHeroInView] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // If at least 10% of the hero section is visible, keep it mounted
      setHeroInView(entries[0].isIntersecting);
    }, { threshold: 0.1 });

    if (heroRef.current) observer.observe(heroRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [airportData, routeData, flightData, detailsData] = await Promise.all([
          getAirports(),
          getRoutes(),
          getFlightSchedule(),
          getAirportDetails()
        ]);
        
        const validAirports = airportData.map(row => ({
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
          const src = aMap[flight.src];
          const dst = aMap[flight.dst];
          if (src && dst) return { ...flight, startLat: src.Latitude, startLng: src.Longitude, endLat: dst.Latitude, endLng: dst.Longitude };
          return null;
        }).filter(Boolean);
        setFlights(mappedFlights);

        const dMap = {};
        detailsData.forEach(d => { dMap[d.Airport_Code] = d; });
        setAirportDetailsMap(dMap);
      } catch (error) {
        console.error("Failed to load Home data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Lock global scroll when in Single Airport View OR to enforce snap scrolling container
  useEffect(() => {
    // ALWAYS lock the global body scroll so our custom snap-scroll container can take over
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }, []);

  const airportFlights = selectedAirportCode ? flights.filter(f => f.departure_airport === selectedAirportCode || f.arrival_airport === selectedAirportCode) : [];
  const selectedDetails = selectedAirportCode ? airportDetailsMap[selectedAirportCode] : null;

  return (
    <div className="w-full h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth relative hide-scrollbar">
      
      {/* 1. HERO SECTION (The 3D Globe & UI Panels) */}
      <section id="hero" ref={heroRef} className="snap-start shrink-0 flex flex-col md:flex-row h-screen pt-[80px] w-full items-center justify-center relative overflow-hidden bg-[#F8F9FA]">
        
        {/* Soft light gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-[#F8F9FA] to-[#F0F4F2] -z-10"></div>
        
        <div className={`text-left z-20 w-full md:w-[45%] h-full flex flex-col pt-10 md:pt-24 px-4 md:px-12 absolute left-0 pointer-events-none transition-all duration-700 ${selectedAirportCode ? 'md:bg-white/80 backdrop-blur-xl border-r border-gray-200 shadow-2xl justify-center pt-0' : ''}`}>
          
          {!selectedAirportCode && (
            <div className="md:hidden absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent pointer-events-none"></div>
          )}
          
          {selectedAirportCode && selectedDetails ? (
            
            <div className="pointer-events-auto h-full overflow-y-auto py-28 hide-scrollbar">
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
            
            <div className={`w-full h-full flex flex-col justify-center pointer-events-auto pl-4 md:pl-8 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
              heroInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-24'
            }`}>
              <h1 className="text-[clamp(2rem,9vw,4rem)] md:text-[clamp(1.875rem,calc(6.5vw_-_12px),5.5rem)] font-black tracking-tighter text-white sm:text-[#1C2B22] leading-[1.05] mb-4 sm:mb-6 md:mb-8 break-words drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)] sm:drop-shadow-none">
                THE FUTURE OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7FE0B0] to-[#F0D97A] sm:from-[#004F30] sm:to-[#A89411]">FLIGHT TELEMETRY.</span>
              </h1>
              
              <p className="text-white sm:text-gray-500 text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-relaxed mb-6 sm:mb-10 max-w-lg drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] sm:drop-shadow-none">
                Experience unprecedented visibility into global airspace. AERO provides real-time, high-fidelity tracking for Pakistan International Airlines.
              </p>
            </div>
          
          )}
          
        </div>

        <div className={`z-10 absolute inset-0 w-full h-full pointer-events-auto transition-all duration-1000 ${selectedAirportCode ? 'md:left-[45%] md:w-[55%]' : 'md:left-[40%] md:w-[60%]'}`}>
          {heroInView ? (
            <Suspense fallback={<GlobePlaceholder />}>
              <GlobeViewer 
                airports={airports}
                routes={routes}
                flights={flights}
                selectedAirportCode={selectedAirportCode}
                onAirportClick={setSelectedAirportCode}
                disableInteractions={true}
              />
            </Suspense>
          ) : (
             <div className="w-full h-full bg-[#F8F9FA] flex items-center justify-center text-gray-400 font-bold tracking-widest text-sm">
               [ GLOBE SUSPENDED FOR MEMORY OPTIMIZATION ]
             </div>
          )}
        </div>
      </section>

      {!selectedAirportCode && (
        <>
          <section className="snap-start shrink-0 w-full min-h-screen">
            <FleetTeaser />
          </section>
          <section className="snap-start shrink-0 w-full min-h-screen">
            <LiveOpsTeaser />
          </section>
          <section className="snap-start shrink-0 w-full min-h-screen">
            <NetworkTeaser />
          </section>
          <section className="snap-start shrink-0 w-full min-h-screen">
            <About isSection={true} />
          </section>
          <section className="snap-start shrink-0 w-full min-h-screen">
            <Contact isSection={true} />
          </section>
          <section className="snap-start shrink-0 w-full">
            <Footer />
          </section>
        </>
      )}

    </div>
  );
}