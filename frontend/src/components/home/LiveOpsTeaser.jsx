import { useEffect, useState } from 'react';
import { Activity, ArrowRight, ShieldCheck, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveFlights } from '../../services/api';

export default function LiveOpsTeaser() {
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchFlights = async () => {
      try {
        const data = await getActiveFlights();
        if (!cancelled) setFlights(data?.flights || []);
      } catch (error) {
        console.error('Failed to fetch active flights for teaser:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const previewFlights = flights.slice(0, 4);

  return (
    <div className="w-full min-h-screen md:h-screen bg-[#F8F9FA] relative flex items-center justify-center overflow-hidden py-16 md:py-0">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,79,48,0.15)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] w-full mx-auto px-6 md:px-16 lg:px-24 flex flex-col md:flex-row-reverse items-center justify-between gap-12 md:gap-0">
        
        {/* Text Content */}
        <div className="w-full md:w-[45%] flex flex-col items-center md:items-start text-center md:text-left md:pl-12">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-[#004F30]" size={24} />
            <span className="text-[#004F30] font-black tracking-[0.3em] text-xs sm:text-sm uppercase">Global Telemetry</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#1C2B22] tracking-tighter leading-[1.1] mb-6">
            PRECISION IN <br/><span className="text-[#A89411]">THE SKIES.</span>
          </h2>
          
          <p className="text-gray-600 text-base sm:text-lg md:text-xl font-medium max-w-lg leading-relaxed mb-10">
            Monitor our entire global network in real-time. Our state-of-the-art Command Center tracks every flight, delay, and boarding operation across the world.
          </p>

          <button 
            onClick={() => navigate('/live-ops')}
            className="group flex items-center gap-4 bg-[#004F30] text-white px-8 py-4 rounded-full font-black tracking-widest text-sm hover:bg-[#1C2B22] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            VIEW FLIGHTS
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Live Dashboard Panel (real data) */}
        <div className="w-full md:w-[50%] mt-4 md:mt-0 relative h-[440px] sm:h-[480px] md:h-[500px] max-w-md md:max-w-none mx-auto">
          {/* Main Dashboard Panel */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-3xl border border-white rounded-[32px] md:rounded-[40px] shadow-[0_20px_60px_rgba(0,79,48,0.08)] p-5 sm:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-gray-100 pb-4">
              <h3 className="font-black text-[#1C2B22] tracking-widest text-xs sm:text-sm flex items-center gap-2">
                <ShieldCheck className="text-[#004F30]" size={18} />
                SYSTEM NOMINAL
              </h3>
              <span className="w-3 h-3 rounded-full bg-[#004F30] animate-pulse shrink-0"></span>
            </div>
            
            <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              {loading ? (
                // Loading skeleton (only while the real request is in flight)
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 sm:h-16 w-full bg-gray-50 rounded-2xl flex items-center px-4 sm:px-6 justify-between animate-pulse">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 shrink-0"></div>
                      <div>
                        <div className="h-2 w-20 sm:w-24 bg-gray-200 rounded-full mb-2"></div>
                        <div className="h-2 w-14 sm:w-16 bg-gray-100 rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-4 w-10 sm:w-12 bg-gray-200 rounded-full"></div>
                  </div>
                ))
              ) : previewFlights.length === 0 ? (
                // Real empty state, never a blank/dead-looking panel
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-6">
                  <div className="w-12 h-12 rounded-full bg-[#004F30]/10 flex items-center justify-center">
                    <Plane className="text-[#004F30] rotate-45" size={20} />
                  </div>
                  <p className="text-sm font-bold text-gray-500">No active flights right now</p>
                  <p className="text-xs text-gray-400">Check back shortly, or view the full board.</p>
                </div>
              ) : (
                previewFlights.map((f, i) => (
                  <div key={f.flightNum || i} className="h-14 sm:h-16 w-full bg-gray-50 rounded-2xl flex items-center px-4 sm:px-6 justify-between group hover:bg-[#004F30]/5 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-[#004F30] text-[10px] sm:text-xs shrink-0">
                        {(f.flightNum || 'PK').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-[#1C2B22] truncate">
                          {f.source || '—'} <span className="text-[#004F30]">→</span> {f.dest || '—'}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-[#A89411] truncate">{f.flightNum || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-xs font-black text-[#004F30] bg-white px-2.5 py-1 rounded-full shadow-sm shrink-0 ml-2">
                      LIVE
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Floating Accent (real active-flight count) */}
          <div className="absolute right-2 -top-4 sm:-right-8 sm:top-12 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-50 flex flex-col items-center gap-1 sm:gap-2 animate-bounce" style={{ animationDuration: '4s' }}>
             <span className="text-2xl sm:text-3xl font-black text-[#004F30]">{loading ? '—' : flights.length}</span>
             <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">Active Flights</span>
          </div>
        </div>

      </div>
    </div>
  );
}