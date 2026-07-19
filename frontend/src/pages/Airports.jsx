import { useEffect, useState, useRef, useMemo } from 'react';
import GlobeViewer from '../components/GlobeViewer';
import Footer from '../components/Footer';
import { getAirports, getRoutes, getAirportDetails } from '../services/api';

// Shows the airport photo if it loads; otherwise shows a clean placeholder
// instead of leaving a blank gap in the layout.
function AirportImage({ src, alt, onZoom }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-40 sm:h-48 md:h-56 rounded-3xl border-[4px] border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.1)] bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400">
        <span className="text-2xl">✈️</span>
        <span className="text-[10px] font-bold tracking-widest uppercase">No Image Available</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      // Explicit intrinsic size reserves layout space before the file loads,
      // preventing CLS while the (currently unaudited) source files in
      // public/airport_pics load over the network.
      width={640}
      height={420}
      onClick={() => onZoom(src)}
      onError={() => setHasError(true)}
      className="w-full h-40 sm:h-48 md:h-56 object-cover rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border-[4px] border-white/80 cursor-pointer hover:scale-[1.02] transition-transform duration-300"
    />
  );
}

export default function Airports() {
  const [airports, setAirports] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [airportDetails, setAirportDetails] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isRoutesModalOpen, setIsRoutesModalOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const sectionRefs = useRef([]);

  // Renders any API value safely — never leaves a field visually blank.
  // Treats 0 as a real value (e.g. sea-level elevation), only null/undefined/'' fall back.
  const field = (value, { prefix = '', suffix = '' } = {}) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return `${prefix}${value}${suffix}`;
  };

  // "50,000,000" -> "50M" for compact badges/stats
  const formatCompact = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(String(value).replace(/,/g, ''));
    if (Number.isNaN(num)) return String(value);
    if (num >= 1_000_000) return `${(num % 1_000_000 === 0 ? num / 1_000_000 : (num / 1_000_000).toFixed(1))}M`;
    if (num >= 1_000) return `${(num % 1_000 === 0 ? num / 1_000 : (num / 1_000).toFixed(1))}K`;
    return String(num);
  };

  useEffect(() => {
    // Prevent Layout.jsx from scrolling, allow ONLY this container to scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setZoomedImage(null);
        setIsRoutesModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [airportsData, routesData, detailsData] = await Promise.all([
          getAirports(),
          getRoutes(),
          getAirportDetails()
        ]);
        
        // Convert coords to numbers
        const validAirports = airportsData.map(row => ({
          ...row, 
          Latitude: Number(row.Latitude), 
          Longitude: Number(row.Longitude)
        }));
        setAirports(validAirports);

        const aMap = {};
        validAirports.forEach(a => { aMap[a.Airport_Code] = a; });

        const mappedRoutes = routesData.map(route => {
          const src = aMap[route.Source_Airport_Code];
          const dst = aMap[route.Destination_Airport_Code];
          if (src && dst) return { ...route, points: [ [src.Latitude, src.Longitude, 0.01], [dst.Latitude, dst.Longitude, 0.01] ] };
          return null;
        }).filter(Boolean);
        setRoutes(mappedRoutes);

        const enrichedDetails = detailsData.map(d => {
           const info = aMap[d.Airport_Code];
           return {
             ...d,
             // /airports/details only returns Airport_Code, Operational_Status,
             // Annual_Passengers and Description_Blog — City/Country/name and
             // coordinates live on the /airports endpoint, so merge them in here.
             Airport_Name: info?.['Airport Name'] || info?.Airport_Name || null,
             City: info?.City || null,
             Country: info?.Country || null,
             Latitude: info?.Latitude || 0,
             Longitude: info?.Longitude || 0
           };
        });
        setAirportDetails(enrichedDetails);

        // JUMP LOGIC: Check URL for ?code=XXX and instantly scroll to it
        const urlParams = new URLSearchParams(window.location.search);
        const targetCode = urlParams.get('code');
        if (targetCode) {
          setTimeout(() => {
            const targetIndex = enrichedDetails.findIndex(a => a.Airport_Code === targetCode);
            if (targetIndex !== -1) {
               const targetEl = sectionRefs.current[targetIndex + 1];
               if (targetEl) targetEl.scrollIntoView({ behavior: 'auto' });
            }
          }, 500); // Wait for DOM to render sections
        }
      } catch (error) {
        console.error("Failed to fetch API data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Intersection Observer for detecting active slide native scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveIndex(index);
          }
        });
      },
      { root: scrollContainerRef.current, threshold: 0.6 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [airportDetails]);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  };

  const handleSearch = (e) => {
     const code = e.target.value.toUpperCase();
     setSearchQuery(code);
     if (code.length >= 3) {
        const targetIndex = airportDetails.findIndex(a => a.Airport_Code.includes(code) || (a.City || '').toUpperCase().includes(code));
        if (targetIndex !== -1) {
           const targetEl = sectionRefs.current[targetIndex + 1];
           if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
           setTimeout(() => {
             setIsSearchOpen(false);
             setSearchQuery('');
           }, 800);
        }
     }
  };

  const navigateToAirport = (code) => {
    const targetIndex = airportDetails.findIndex(a => a.Airport_Code === code);
    if (targetIndex !== -1) {
       const targetEl = sectionRefs.current[targetIndex + 1];
       if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
       setIsRoutesModalOpen(false);
    }
  };

  const airportIndex = activeIndex - 1;
  const activeAirport = airportIndex >= 0 ? airportDetails[airportIndex] : null;
  const activeAirportCode = activeAirport ? activeAirport.Airport_Code : null;

  const allConnectedRoutes = activeAirportCode 
    ? routes.filter(r => r.Source_Airport_Code === activeAirportCode || r.Destination_Airport_Code === activeAirportCode)
    : [];

  const getCityName = (code) => {
     const found = airports.find(a => a.Airport_Code === code);
     return found ? found.City : code;
  };

  // IMPORTANT: this must stay memoized. `activeIndex` (and therefore this
  // component) re-renders on every scroll tick via the IntersectionObserver
  // above. Without useMemo, `routes.map(...)` below would create a brand
  // new array *reference* on every single one of those re-renders even
  // though the underlying route data never changed — and GlobeViewer/
  // react-globe.gl rebuilds all flight-arc 3D geometry from scratch
  // whenever its `arcsData` reference changes. That was making every
  // scroll on this page redo expensive WebGL work for no reason.
  const arcPoints = useMemo(() => routes.map(r => r.points), [routes]);

  return (
    <div className="w-full h-screen bg-[#F8F9FA] relative flex flex-col">
      
      {/* ZOOMED IMAGE LIGHTBOX */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer" 
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Enlarged view" 
            className="max-w-[80%] max-h-[80%] object-cover rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-[6px] border-white/50 transform scale-100 transition-transform duration-300" 
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-xl font-bold text-white transition-colors backdrop-blur-md"
          >
            ✕
          </button>
        </div>
      )}

      {/* ROUTES MODAL */}
      {isRoutesModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer"
          onClick={() => setIsRoutesModalOpen(false)}
        >
          <div 
            className="w-11/12 max-w-4xl max-h-[80vh] bg-white/90 backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-white p-8 md:p-12 overflow-y-auto hide-scrollbar cursor-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-[#1C2B22] tracking-tighter">
                ALL CONNECTIONS <span className="text-[#004F30]">({allConnectedRoutes.length})</span>
              </h2>
              <button 
                onClick={() => setIsRoutesModalOpen(false)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {allConnectedRoutes.map((r, idx) => {
                const isSource = r.Source_Airport_Code === activeAirportCode;
                const linkedAir = isSource ? r.Destination_Airport_Code : r.Source_Airport_Code;
                const cityName = getCityName(linkedAir);
                return (
                  <div 
                    key={idx} 
                    onClick={() => navigateToAirport(linkedAir)}
                    className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-[#004F30] hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${isSource ? 'bg-[#004F30]/10 text-[#004F30]' : 'bg-[#A89411]/10 text-[#A89411]'}`}>
                      {isSource ? 'TO' : 'FR'}
                    </div>
                    <div className="ml-4 overflow-hidden">
                      <p className="text-sm text-gray-500 font-bold">{linkedAir}</p>
                      <p className="text-lg font-extrabold text-[#1C2B22] truncate group-hover:text-[#004F30] transition-colors">{cityName}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR (Expandable Icon) */}
      <div className="absolute top-24 sm:top-24 md:top-28 right-3 sm:right-6 md:right-8 left-3 sm:left-auto z-40 flex justify-end">
         <div className={`bg-white/80 backdrop-blur-2xl border border-white shadow-[0_10px_30px_rgba(0,79,48,0.12)] rounded-full flex items-center transition-all duration-500 overflow-hidden ${isSearchOpen ? 'w-full sm:w-80 px-4' : 'w-11 h-11 sm:w-14 sm:h-14 cursor-pointer hover:shadow-[0_15px_40px_rgba(0,79,48,0.2)] hover:scale-105'}`} onClick={!isSearchOpen ? toggleSearch : undefined}>
            
            <div className="h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center shrink-0 cursor-pointer" onClick={isSearchOpen ? toggleSearch : undefined}>
              <span className="text-lg sm:text-xl opacity-70">🔍</span>
            </div>
            
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search Code/City..."
              value={searchQuery}
              onChange={handleSearch}
              onBlur={() => setIsSearchOpen(false)}
              className={`w-full bg-transparent border-none outline-none text-[#1C2B22] font-bold tracking-widest placeholder-gray-400 py-3 text-sm sm:text-base transition-opacity duration-300 ${isSearchOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}
            />
         </div>
      </div>

      {/* BACKGROUND: FIXED GLOBE - ALWAYS CENTERED */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none translate-x-0">
        <GlobeViewer 
          airports={airports}
          routes={arcPoints} 
          flights={[]}
          selectedAirportCode={activeAirportCode}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(248,249,250,0.95)_100%)]"></div>
      </div>
      
      {/* FOREGROUND: NATIVE SNAP SCROLL CONTAINER */}
      <div 
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      >
        
        {/* SLIDE 0: Intro (Empty Earth) */}
        <section 
          data-index={0}
          ref={(el) => sectionRefs.current[0] = el}
          className="h-screen w-full shrink-0 snap-start flex flex-col justify-end items-center px-4 sm:px-8 pb-4 sm:pb-2 pointer-events-none"
        >
           <div className={`transition-opacity duration-1000 delay-500 ${activeIndex === 0 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="animate-bounce flex flex-col items-center">
                <span className="text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] text-[#004F30] mb-2 drop-shadow-sm text-center">SCROLL TO EXPLORE NETWORK</span>
                <span className="text-3xl text-[#A89411] drop-shadow-md">↓</span>
              </div>
           </div>
        </section>

        {/* Airport Slides (COCKPIT HUD SPLIT VIEW) */}
        {airportDetails.map((details, i) => {
           
           const slideIndex = i + 1;
           const isActive = activeIndex === slideIndex;

           return (
             <section 
               key={details.Airport_Code} 
               data-index={slideIndex}
               ref={(el) => sectionRefs.current[slideIndex] = el}
               className="min-h-screen w-full shrink-0 snap-start flex flex-col justify-center px-4 sm:px-6 md:px-16 lg:px-24 pt-28 pb-10 md:py-0"
             >
                <div className={`w-full h-full md:max-h-[85vh] flex flex-col md:flex-row justify-between items-center gap-10 md:gap-0 py-6 md:py-20 transition-opacity duration-1000 delay-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  
                  {/* LEFT WING: Identity & Mission — flies in from the left, flies out to the left */}
                  <div className={`flex flex-col w-full md:w-[40%] xl:w-[35%] items-center md:items-start text-center md:text-left shrink-0 transition-all duration-[1100ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
                    isActive ? 'translate-x-0 rotate-0' : '-translate-x-24 md:-translate-x-40 rotate-[-3deg]'
                  }`}>
                     <h2 className="text-[clamp(3.5rem,20vw,6rem)] md:text-[7rem] font-black tracking-tighter text-[#1C2B22] leading-none drop-shadow-[0_10px_30px_rgba(255,255,255,1)]">
                       {field(details.Airport_Code)}
                     </h2>
                     {details.Airport_Name && (
                       <p className="text-lg sm:text-xl font-bold text-[#1C2B22] mt-3 drop-shadow-[0_5px_15px_rgba(255,255,255,0.8)]">
                         {details.Airport_Name}
                       </p>
                     )}
                     <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#004F30] mt-1 tracking-widest uppercase drop-shadow-[0_5px_15px_rgba(255,255,255,0.8)]">
                       {[details.City, details.Country].filter(Boolean).join(', ') || 'Location unavailable'}
                     </h3>
                     
                     <div className="mt-6 flex gap-3 flex-wrap justify-center md:justify-start">
                        <span className={`px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-md backdrop-blur-md ${
                          details.Operational_Status === 'Active' 
                            ? 'bg-[#004F30]/20 text-[#004F30] border border-[#004F30]/30' 
                            : details.Operational_Status 
                              ? 'bg-red-500/20 text-red-700 border border-red-500/30'
                              : 'bg-gray-200/60 text-gray-500 border border-gray-300/50'
                        }`}>
                          {details.Operational_Status || 'STATUS UNKNOWN'}
                        </span>
                        {formatCompact(details.Annual_Passengers) && (
                          <span className="px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-md backdrop-blur-md bg-white/70 text-[#1C2B22] border border-white">
                            {formatCompact(details.Annual_Passengers)} PASSENGERS/YR
                          </span>
                        )}
                     </div>

                     <p className="mt-8 text-base sm:text-lg font-semibold text-gray-700 leading-relaxed bg-white/60 backdrop-blur-3xl p-6 rounded-3xl border border-white shadow-[0_15px_40px_rgba(0,0,0,0.05)] w-full">
                       {details.Description_Blog || 'No description is available for this airport yet.'}
                     </p>

                     {/* Dynamic Connected Flights Panel - OUTBOUND ONLY */}
                     {isActive && allConnectedRoutes.length > 0 && (
                        <div 
                          className="mt-6 w-full bg-white/60 backdrop-blur-3xl p-6 rounded-3xl border border-white shadow-[0_15px_40px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-white/80 transition-colors group"
                          onClick={() => setIsRoutesModalOpen(true)}
                        >
                           <p className="text-xs text-[#A89411] font-black tracking-widest mb-3 group-hover:text-[#004F30] transition-colors">
                             CONNECTED ROUTES ({allConnectedRoutes.length}) <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                           </p>
                           <div className="flex flex-wrap gap-2 pointer-events-none justify-center md:justify-start">
                             {allConnectedRoutes.slice(0, 8).map((r, idx) => {
                               const isSource = r.Source_Airport_Code === details.Airport_Code;
                               const linkedAir = isSource ? r.Destination_Airport_Code : r.Source_Airport_Code;
                               const cityName = getCityName(linkedAir);
                               return (
                                 <span key={idx} className={`px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold shadow-sm ${isSource ? 'bg-white text-[#1C2B22]' : 'bg-gray-100 text-gray-600'}`}>
                                   {isSource ? 'TO' : 'FR'} {cityName.toUpperCase()}
                                 </span>
                               )
                             })}
                             {allConnectedRoutes.length > 8 && (
                               <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 shadow-sm">+{allConnectedRoutes.length - 8} MORE</span>
                             )}
                           </div>
                        </div>
                     )}
                     {isActive && allConnectedRoutes.length === 0 && (
                        <div className="mt-6 w-full bg-white/50 backdrop-blur-3xl p-5 rounded-3xl border border-white shadow-[0_15px_40px_rgba(0,0,0,0.05)]">
                           <p className="text-xs text-gray-400 font-bold tracking-widest text-center md:text-left">NO CONNECTED ROUTES ON RECORD</p>
                        </div>
                     )}
                  </div>

                  {/* CENTER GAP FOR THE GLOBE */}
                  <div className="hidden md:block flex-grow"></div>

                  {/* RIGHT WING: Telemetry & Media — flies in from the right, flies out to the right */}
                  <div className={`flex flex-col w-full md:w-[35%] xl:w-[30%] max-w-sm mx-auto md:mx-0 items-center md:items-end text-center md:text-right shrink-0 gap-6 sm:gap-8 mt-2 md:mt-0 md:mr-8 lg:mr-16 transition-all duration-[1100ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
                    isActive ? 'translate-x-0 rotate-0' : 'translate-x-24 md:translate-x-40 rotate-[3deg]'
                  }`}>
                     
                     {/* Media Stack (Clickable Lightbox) */}
                     <div className="grid grid-cols-2 sm:flex sm:flex-col gap-3 w-full">
                       <AirportImage
                         src={`/airport_pics/${details.Airport_Code}_1.jpg`}
                         alt={`${details.City || details.Airport_Code} Terminal 1`}
                         onZoom={setZoomedImage}
                       />
                       <AirportImage
                         src={`/airport_pics/${details.Airport_Code}_2.jpg`}
                         alt={`${details.City || details.Airport_Code} Terminal 2`}
                         onZoom={setZoomedImage}
                       />
                     </div>
                     
                     {/* Telemetry Stack */}
                     <div className="w-full bg-white/70 backdrop-blur-3xl p-5 sm:p-6 rounded-3xl border border-white shadow-[0_20px_50px_rgba(0,79,48,0.1)] grid grid-cols-2 gap-x-4 gap-y-5">
                        <div>
                          <p className="text-[10px] text-gray-500 font-black tracking-widest mb-1">ANNUAL PASSENGERS</p>
                          <p className="text-base sm:text-lg text-[#1C2B22] font-extrabold">{field(details.Annual_Passengers)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-black tracking-widest mb-1">STATUS</p>
                          <p className="text-base sm:text-lg text-[#1C2B22] font-extrabold">{field(details.Operational_Status)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-black tracking-widest mb-1">CITY / COUNTRY</p>
                          <p className="text-base sm:text-lg text-[#1C2B22] font-extrabold truncate">{field([details.City, details.Country].filter(Boolean).join(', ') || null)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-black tracking-widest mb-1">LAT / LNG</p>
                          <p className="text-sm sm:text-base text-[#A89411] font-extrabold">{Number(details.Latitude || 0).toFixed(2)}, {Number(details.Longitude || 0).toFixed(2)}</p>
                        </div>
                     </div>

                  </div>
                  
                </div>
             </section>
           )
        })}

        {/* SLIDE X: Footer */}
        <section 
          data-index={airportDetails.length + 1}
          ref={(el) => sectionRefs.current[airportDetails.length + 1] = el}
          className="w-full shrink-0 snap-start"
        >
          <Footer />
        </section>

      </div>
    </div>
  )
}