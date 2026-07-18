import { useState, useEffect, useMemo } from 'react';
import { Plane, RefreshCw, X, Maximize2, Layers, Activity, Clock, ShieldAlert, ArrowRight, Info } from 'lucide-react';
import { AviationMap } from '../components/AviationMap';
import { getAirports, getRoutes, getActiveFlights, getOnboardingFlights, getDelayedFlights } from '../services/api';

const GlassCard = ({ title, children, isLoading, onRefresh, onClick }) => (
  <div className="bg-white/80 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-5 flex flex-col w-[350px] h-full overflow-hidden relative transition-all hover:bg-white/90">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-[13px] font-black text-[#004F30] tracking-widest uppercase flex items-center gap-2">
        {title}
        {isLoading && !onRefresh && <RefreshCw size={14} className="animate-spin text-[#A89411]" />}
      </h2>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button 
            onClick={(e) => { e.stopPropagation(); onRefresh(); }} 
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-[#004F30] transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        )}
        {onClick && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }} 
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-[#004F30] transition-colors shadow-sm"
            title="Expand Table"
          >
            <Maximize2 size={14} />
          </button>
        )}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      {children}
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

  const getActiveStatus = (targetTimeIso) => {
    if (!targetTimeIso) return 'IN-TRANSIT';
    const target = new Date(targetTimeIso).getTime();
    const remSeconds = (target - Date.now()) / 1000;
    if (remSeconds <= 600 && remSeconds > 0) return 'LANDING';
    return 'IN-TRANSIT';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-[#1C2B22]/40 backdrop-blur-md transition-all" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-3xl rounded-3xl p-8 max-w-5xl w-full h-[80vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#004F30]/10 flex items-center justify-center text-[#004F30]">
            <Layers size={24} />
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
                     <td className="py-4 font-black text-[#A89411] text-xs">
                       {category === 'Boarding' ? 'BOARDING' : 
                        (category === 'Active' ? getActiveStatus(f.targetTime) : 
                        (f.delayTime ? 'DELAYED' : (f.targetTime ? 'SCHEDULED' : 'ACTIVE')))}
                     </td>
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
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  const [showPanels, setShowPanels] = useState(false);
  const [sidePanelFlight, setSidePanelFlight] = useState(null);

  const [airports, setAirports] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchApData = async () => {
      try {
        const apData = await getAirports();
        setAirports(apData);
      } catch(e) {}
    };
    fetchApData();
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

  const fetchActiveData = async () => {
    try {
      setLoadingActive(true);
      const activeData = await getActiveFlights();
      setActiveFlights(activeData.flights || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    fetchActiveData();
    const interval = setInterval(fetchActiveData, 15000);

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${WS_URL}/ws/operations`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.data && payload.data.boarding) {
          const formattedBoarding = payload.data.boarding.map(b => ({
            flightNum: b.flight, source: b.route.split('-')[0], dest: b.route.split('-')[1], targetTime: b.time
          }));
          setOnBoardingFlights(formattedBoarding);
        }
        if (payload.data && payload.data.delayed) {
          const formattedDelayed = payload.data.delayed.map(d => ({
            flightNum: d.flight, source: d.route.split('-')[0], dest: d.route.split('-')[1], delayTime: d.reason
          }));
          setDelayedFlights(formattedDelayed);
        }
      } catch (error) {}
    };
    return () => { clearInterval(interval); ws.close(); };
  }, []);

  const renderActiveFlights = () => (
    <table className="w-full text-left text-sm">
      <tbody className="divide-y divide-gray-100">
        {activeFlights.length === 0 && !loadingActive ? (
           <tr><td colSpan="3" className="py-6 text-center text-xs font-bold text-gray-400">NO ACTIVE FLIGHTS</td></tr>
        ) : (
           activeFlights.map((f, i) => (
             <tr key={i} className="group transition-colors cursor-pointer hover:bg-gray-50">
               <td className="py-3 font-bold text-[#1C2B22] text-xs">
                 {f.source} <span className="text-[#004F30] font-black mx-1">→</span> {f.dest}
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
      <tbody className="divide-y divide-gray-100">
        {onBoardingFlights.length === 0 && !loadingBoarding ? (
           <tr><td colSpan="4" className="py-6 text-center text-xs font-bold text-gray-400">NO FLIGHTS BOARDING</td></tr>
        ) : (
           onBoardingFlights.map((f, i) => (
             <tr key={i} className="group transition-colors">
               <td className="py-3 font-bold text-[#1C2B22] text-xs">
                 {f.source} <span className="text-gray-400 font-black mx-1">→</span> {f.dest}
               </td>
               <td className="py-3 font-black text-[#1C2B22]">{f.flightNum}</td>
               <td className="py-3 font-bold text-[#004F30] text-xs pr-2">BOARDING</td>
               <td className="py-3 text-right font-bold text-gray-500 text-[10px]">{f.targetTime ? new Date(f.targetTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</td>
             </tr>
           ))
        )}
      </tbody>
    </table>
  );

  const renderDelayedFlights = () => (
    <table className="w-full text-left text-sm">
      <tbody className="divide-y divide-gray-100">
        {delayedFlights.length === 0 && !loadingDelayed ? (
           <tr><td colSpan="3" className="py-6 text-center text-xs font-bold text-gray-400">ALL OPERATIONS NOMINAL</td></tr>
        ) : (
           delayedFlights.map((f, i) => (
             <tr key={i} className="group transition-colors">
               <td className="py-3 font-bold text-[#1C2B22] text-xs">
                 {f.source} <span className="text-red-400 font-black mx-1">→</span> {f.dest}
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
    <div className="w-screen h-screen overflow-hidden bg-black relative flex flex-col">
      
      {/* Fullscreen Map Background */}
      <div className="absolute inset-0 z-0">
        <AviationMap 
          selectedFlightId={sidePanelFlight?.id} 
          onSelectFlight={setSidePanelFlight} 
        />
      </div>

      {/* Top Left Header Overlay */}
      <div className="absolute top-[100px] left-8 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white shadow-xl inline-block">
          <h1 className="text-3xl font-black text-[#1C2B22] tracking-tighter flex items-center gap-3">
            <Plane className="rotate-45 text-[#004F30]" size={28} />
            LIVE OPERATIONS
          </h1>
          <p className="text-[#004F30] font-black text-[10px] tracking-widest mt-1 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A89411] animate-pulse"></span>
            Global Telemetry Active
          </p>
        </div>
      </div>

      {/* Floating Operations Toggle Button (FAB) */}
      <div className="absolute bottom-8 left-8 z-30">
        <button 
          onClick={() => setShowPanels(!showPanels)}
          className={`flex items-center justify-center w-14 h-14 rounded-full transition-all shadow-2xl border hover:scale-110 ${
            showPanels 
              ? 'bg-[#1C2B22] text-white border-transparent' 
              : 'bg-white/90 backdrop-blur-xl text-[#004F30] hover:bg-white border-white'
          }`}
          title={showPanels ? 'Hide Control Panels' : 'Show Control Panels'}
        >
          {showPanels ? <X size={24} /> : <Activity size={24} />}
        </button>
      </div>

      {/* Floating Glassmorphism Panels (L-Shape Layout) */}
      <div className={`absolute bottom-28 left-8 z-20 grid grid-cols-2 gap-6 transition-all duration-500 ease-in-out ${
        showPanels ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-12 opacity-0 pointer-events-none'
      }`}>
        {/* Top Left */}
        <div className="h-[280px]">
          <GlassCard title="Active In-Air" isLoading={loadingActive} onRefresh={fetchActiveData} onClick={() => setExpandedCategory('Active')}>
            {renderActiveFlights()}
          </GlassCard>
        </div>
        
        {/* Top Right (Empty space in L-shape) */}
        <div></div>

        {/* Bottom Left */}
        <div className="h-[280px]">
          <GlassCard title="Boarding" isLoading={loadingBoarding} onClick={() => setExpandedCategory('Boarding')}>
            {renderOnBoarding()}
          </GlassCard>
        </div>
        
        {/* Bottom Right */}
        <div className="h-[280px]">
          <GlassCard title="Delayed" isLoading={loadingDelayed} onClick={() => setExpandedCategory('Delayed')}>
            {renderDelayedFlights()}
          </GlassCard>
        </div>
      </div>

      {/* Right Side Drawer ("Flying Div") */}
      <div className={`absolute top-[80px] right-0 h-[calc(100vh-80px)] w-[450px] bg-white/95 backdrop-blur-3xl shadow-[-20px_0_60px_rgba(0,0,0,0.15)] border-l border-white/50 z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
        sidePanelFlight ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {sidePanelFlight && (
          <>
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black tracking-widest text-[#A89411] uppercase mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A89411] animate-pulse"></span>
                  Active Telemetry Link
                </p>
                <h2 className="text-4xl font-black text-[#1C2B22] tracking-tighter">{sidePanelFlight.flightNumber}</h2>
              </div>
              <button 
                onClick={() => setSidePanelFlight(null)} 
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#1C2B22] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto">
              {/* Route */}
              <div className="bg-[#F8F9FA] rounded-2xl p-6 flex items-center justify-between mb-8 border border-gray-100">
                <div className="text-center">
                  <span className="block text-3xl font-black text-[#004F30]">{sidePanelFlight.source}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{airports.find(a=>a.Airport_Code===sidePanelFlight.source)?.City || 'Origin'}</span>
                </div>
                <div className="flex flex-col items-center flex-1 px-4 text-[#A89411]">
                  <Plane size={24} className="mb-2" />
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#A89411]/30 to-transparent relative">
                    <div className="absolute top-0 left-0 h-full bg-[#A89411] transition-all duration-1000" style={{width: `${sidePanelFlight.progress * 100}%`}}></div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-black text-[#1C2B22]">{sidePanelFlight.destination}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{airports.find(a=>a.Airport_Code===sidePanelFlight.destination)?.City || 'Dest'}</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black text-[#004F30] uppercase">{sidePanelFlight.status}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Heading</p>
                  <p className="text-lg font-black text-[#1C2B22] uppercase">{Math.round(sidePanelFlight.heading)}°</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Progress</p>
                  <p className="text-lg font-black text-[#1C2B22] uppercase">{Math.round(sidePanelFlight.progress * 100)}%</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Network</p>
                  <p className="text-lg font-black text-green-600 uppercase">Linked</p>
                </div>
              </div>

              {/* Manifest Placeholder */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-[#1C2B22] mb-1 tracking-tight">Manifest & Telemetry</h4>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed">
                      Detailed passenger manifests and deeper telemetry analytics are currently being configured by the backend database team. They will appear here once the API updates are live.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ExpandedTableModal 
        category={expandedCategory} 
        flights={expandedCategory === 'Active' ? activeFlights : (expandedCategory === 'Boarding' ? onBoardingFlights : delayedFlights)}
        airports={airports}
        onClose={() => setExpandedCategory(null)} 
      />
    </div>
  );
}
