import { useState, useEffect } from 'react';
import { Plane, RefreshCw, X } from 'lucide-react';
import { AviationMap } from '../components/AviationMap';
import GlobeViewer from '../components/GlobeViewer';
import Papa from 'papaparse';
import Footer from '../components/Footer';

const GlassCard = ({ title, children, isLoading, onRefresh, onClick }) => (
  <div onClick={onClick} className="bg-white/70 backdrop-blur-3xl rounded-3xl border border-white shadow-[0_20px_50px_rgba(0,79,48,0.05)] p-5 flex flex-col h-full overflow-hidden relative group transition-all hover:bg-white/80 cursor-pointer hover:scale-[1.02]">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-[13px] font-black text-[#A89411] tracking-widest uppercase flex items-center gap-2">
        {title}
        {isLoading && !onRefresh && <RefreshCw size={14} className="animate-spin text-[#004F30]" />}
      </h2>
      {onRefresh && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRefresh(); }} 
          className="p-1.5 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-[#004F30] transition-colors shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      )}
    </div>
    <div className="flex-1 overflow-y-auto hide-scrollbar pointer-events-none">
      {children}
    </div>
    <div className="absolute bottom-2 right-4 text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
      CLICK TO EXPAND
    </div>
  </div>
);

const ExpandedTableModal = ({ category, flights, airports, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!category) return null;

  const getCity = (code) => {
    if (!airports) return code;
    const a = airports.find(x => x.Airport_Code === code);
    return a ? `${code} (${a.City})` : code;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-[#1C2B22]/40 backdrop-blur-md transition-all" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-3xl rounded-3xl p-8 max-w-5xl w-full h-[80vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#004F30]/10 flex items-center justify-center text-[#004F30]">
            <Plane size={24} className="rotate-45" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#1C2B22] uppercase tracking-tighter">{category} Flights</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Detailed Operational Log</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-2xl bg-white shadow-inner p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase font-bold tracking-widest text-gray-400 border-b-2 border-gray-100 sticky top-0 bg-white z-10">
              <tr>
                <th className="pb-3 pl-4">Flight No</th>
                <th className="pb-3">Origin</th>
                <th className="pb-3">Destination</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {flights.length === 0 ? (
                 <tr><td colSpan="5" className="py-12 text-center text-sm font-bold text-gray-400">NO DATA AVAILABLE</td></tr>
              ) : (
                 flights.map((f, i) => (
                   <tr key={i} className="hover:bg-gray-50 transition-colors">
                     <td className="py-4 pl-4 font-black text-[#004F30]">{f.flightNum}</td>
                     <td className="py-4 font-bold text-[#1C2B22] text-xs">{getCity(f.source)}</td>
                     <td className="py-4 font-bold text-[#1C2B22] text-xs">{getCity(f.dest)}</td>
                     <td className="py-4 font-black text-[#A89411] text-xs">{f.delayTime ? 'DELAYED' : (f.targetTime ? 'SCHEDULED' : 'ACTIVE')}</td>
                     <td className="py-4 text-right pr-4 font-bold text-gray-500 text-xs">{f.delayTime || (f.targetTime ? new Date(f.targetTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A')}</td>
                   </tr>
                 ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function LiveOperations() {
  const [now, setNow] = useState(Date.now());

  const [activeFlights, setActiveFlights] = useState([]);
  const [onBoardingFlights, setOnBoardingFlights] = useState([]);
  const [delayedFlights, setDelayedFlights] = useState([]);
  
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingBoarding, setLoadingBoarding] = useState(true);
  const [loadingDelayed, setLoadingDelayed] = useState(true);
  
  // Track which category modal is open
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Background globe state
  const [airports, setAirports] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCsv = (url) => {
      return fetch(url).then(res => res.text()).then(csv => new Promise((resolve) => {
        Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: (results) => resolve(results.data) });
      }));
    };

    Promise.all([fetchCsv('/airport.csv'), fetchCsv('/routes.csv')]).then(([airportData, routeData]) => {
      const validAirports = airportData.filter(row => row.Latitude && row.Longitude).map(row => ({
        ...row, Latitude: Number(row.Latitude), Longitude: Number(row.Longitude)
      }));
      setAirports(validAirports);

      const aMap = {};
      validAirports.forEach(a => { aMap[a.Airport_Code] = a; });
      const mappedRoutes = routeData.map(route => {
        const src = aMap[route.Source_Airport_Code];
        const dst = aMap[route.Destination_Airport_Code];
        if (src && dst) return { ...route, points: [ [src.Latitude, src.Longitude, 0.01], [dst.Latitude, dst.Longitude, 0.01] ] };
        return null;
      }).filter(Boolean);
      setRoutes(mappedRoutes);
    });
  }, []);

  const formatTimeRem = (targetTimeIso, zeroText) => {
    if (!targetTimeIso) return "LIVE";
    const target = new Date(targetTimeIso).getTime();
    const remSeconds = (target - now) / 1000;
    if (remSeconds > 0) {
      const hours = Math.floor(remSeconds / 3600);
      const mins = Math.floor((remSeconds % 3600) / 60);
      const secs = Math.floor(remSeconds % 60);
      if (hours > 0) return `${hours}h ${mins}m`;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    }
    return zeroText;
  };

  const fetchDashboardData = async () => {
    try {
      setLoadingActive(true);
      fetch('http://localhost:8000/dashboard/active-flights')
        .then(res => res.json())
        .then(data => { 
          if (data.flights && data.flights.length > 0) {
            setActiveFlights(data.flights); 
          } else {
            setActiveFlights([]);
          }
          setLoadingActive(false); 
        })
        .catch(() => {
          setActiveFlights([]);
          setLoadingActive(false);
        });

      setLoadingBoarding(true);
      fetch('http://localhost:8000/dashboard/onboarding-flights')
        .then(res => res.json())
        .then(data => { 
          if (data.flights && data.flights.length > 0) {
            setOnBoardingFlights(data.flights); 
          } else {
             setOnBoardingFlights([]);
          }
          setLoadingBoarding(false); 
        })
        .catch(() => {
           setOnBoardingFlights([]);
           setLoadingBoarding(false);
        });

      setLoadingDelayed(true);
      fetch('http://localhost:8000/dashboard/delayed-flights')
        .then(res => res.json())
        .then(data => { 
          if (data.flights && data.flights.length > 0) {
            setDelayedFlights(data.flights); 
          } else {
             setDelayedFlights([]);
          }
          setLoadingDelayed(false); 
        })
        .catch(() => {
           setDelayedFlights([]);
           setLoadingDelayed(false);
        });
        
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const renderActiveFlights = () => (
    <table className="w-full text-left text-sm">
      <thead className="text-[10px] uppercase font-bold tracking-widest text-gray-400 border-b border-gray-100">
        <tr>
          <th className="pb-3">Route</th>
          <th className="pb-3">Flight</th>
          <th className="pb-3 text-right">Arrival</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100/50">
        {activeFlights.length === 0 && !loadingActive ? (
           <tr><td colSpan="3" className="py-6 text-center text-xs font-bold text-gray-400">NO ACTIVE FLIGHTS</td></tr>
        ) : (
           activeFlights.map((f, i) => (
             <tr key={i} className="group transition-colors">
               <td className="py-3 font-bold text-[#1C2B22] text-xs">
                 {f.source} <span className="text-[#004F30]">→</span> {f.dest}
               </td>
               <td className="py-3 font-black text-[#004F30]">{f.flightNum}</td>
               <td className="py-3 text-right font-bold text-[#A89411] text-xs">{formatTimeRem(f.targetTime, "LANDING")}</td>
             </tr>
           ))
        )}
      </tbody>
    </table>
  );

  const renderOnBoarding = () => (
    <table className="w-full text-left text-sm">
      <thead className="text-[10px] uppercase font-bold tracking-widest text-gray-400 border-b border-gray-100">
        <tr>
          <th className="pb-3">Route</th>
          <th className="pb-3">Flight</th>
          <th className="pb-3 text-right">Departure</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100/50">
        {onBoardingFlights.length === 0 && !loadingBoarding ? (
           <tr><td colSpan="3" className="py-6 text-center text-xs font-bold text-gray-400">NO FLIGHTS BOARDING</td></tr>
        ) : (
           onBoardingFlights.map((f, i) => (
             <tr key={i} className="group transition-colors">
               <td className="py-3 font-bold text-[#1C2B22] text-xs">
                 {f.source} <span className="text-gray-400">→</span> {f.dest}
               </td>
               <td className="py-3 font-black text-[#1C2B22]">{f.flightNum}</td>
               <td className="py-3 text-right font-bold text-[#004F30] text-xs">{formatTimeRem(f.targetTime, "DEPARTING")}</td>
             </tr>
           ))
        )}
      </tbody>
    </table>
  );

  const renderDelayedFlights = () => (
    <table className="w-full text-left text-sm">
      <thead className="text-[10px] uppercase font-bold tracking-widest text-gray-400 border-b border-gray-100">
        <tr>
          <th className="pb-3">Route</th>
          <th className="pb-3">Flight</th>
          <th className="pb-3 text-right">Delay</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100/50">
        {delayedFlights.length === 0 && !loadingDelayed ? (
           <tr><td colSpan="3" className="py-6 text-center text-xs font-bold text-gray-400">ALL OPERATIONS NOMINAL</td></tr>
        ) : (
           delayedFlights.map((f, i) => (
             <tr key={i} className="group transition-colors">
               <td className="py-3 font-bold text-[#1C2B22] text-xs">
                 {f.source} <span className="text-red-400">→</span> {f.dest}
               </td>
               <td className="py-3 font-black text-red-600">{f.flightNum}</td>
               <td className="py-3 text-right font-black text-red-500 text-xs">{f.delayTime}</td>
             </tr>
           ))
        )}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col pt-[100px] overflow-x-hidden">
      
      {/* LIGHTWEIGHT BACKGROUND (Removed heavy 3D globe to fix lag) */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,79,48,0.08)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(168,148,17,0.05)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex flex-col flex-grow px-6 pb-12">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#1C2B22] tracking-tighter flex items-center gap-3 drop-shadow-sm">
              <Plane className="rotate-45 text-[#004F30]" size={28} />
              LIVE OPERATIONS
            </h1>
            <p className="text-gray-500 font-bold text-sm tracking-widest mt-1 uppercase">Global Flight Telemetry & Network Status</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-white/70 backdrop-blur-xl border border-white rounded-full shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#004F30] animate-pulse"></span>
                <span className="text-[10px] font-black tracking-widest text-[#004F30]">SYSTEM NOMINAL</span>
             </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0">
          
          {/* Left Column (Tables) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            <div className="flex-1 min-h-[250px]">
              <GlassCard title="Active In-Air" isLoading={loadingActive} onRefresh={fetchDashboardData} onClick={() => setExpandedCategory('Active')}>
                {renderActiveFlights()}
              </GlassCard>
            </div>
            <div className="flex-1 min-h-[250px]">
              <GlassCard title="Boarding" isLoading={loadingBoarding} onClick={() => setExpandedCategory('Boarding')}>
                {renderOnBoarding()}
              </GlassCard>
            </div>
            <div className="flex-1 min-h-[250px]">
              <GlassCard title="Delayed Warnings" isLoading={loadingDelayed} onClick={() => setExpandedCategory('Delayed')}>
                {renderDelayedFlights()}
              </GlassCard>
            </div>
          </div>

          {/* Right Column (Aviation Map) */}
          <div className="lg:col-span-8 xl:col-span-9 h-[60vh] lg:h-auto min-h-[600px]">
             <AviationMap />
          </div>
          
        </div>
      </div>
      
      {/* Flight Detail Modal */}
      <ExpandedTableModal 
        category={expandedCategory} 
        flights={expandedCategory === 'Active' ? activeFlights : (expandedCategory === 'Boarding' ? onBoardingFlights : delayedFlights)}
        airports={airports}
        onClose={() => setExpandedCategory(null)} 
      />

      <Footer />
    </div>
  );
}
