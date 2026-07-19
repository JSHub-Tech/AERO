import { useEffect, useState } from 'react';
import { Activity, ArrowRight, ShieldCheck, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveFlights } from '../../services/api';
import { useAnimateOnScroll } from '../animation';

export default function LiveOpsTeaser() {
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [containerRef, isInView] = useAnimateOnScroll();

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
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const previewFlights = flights.slice(0, 4);

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-transparent relative flex items-center justify-center py-16 sm:py-20">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,79,48,0.05)_0%,_transparent_50%)]"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] w-full mx-auto px-6 md:px-16 lg:px-24 flex flex-col md:flex-row-reverse items-center justify-between gap-12 md:gap-0">
        
        {/* Text Content - Slides from Right */}
        <div className={`w-full md:w-[45%] flex flex-col items-center md:items-start text-center md:text-left md:pl-12 transition-all duration-1000 transform ${
          isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-[#004F30]" size={24} />
            <span className="text-[#004F30] font-black tracking-[0.3em] text-xs sm:text-sm uppercase">Global Telemetry</span>
          </div>
          
          <h2 className="text-[clamp(2rem,9vw,3.5rem)] md:text-[clamp(2rem,calc(7.5vw_-_16px),6.5rem)] font-black text-[#1C2B22] tracking-tighter leading-[1.1] mb-6 break-words">
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

        {/* Dashboard Panel - Slides from Bottom Up */}
        <div className={`w-full md:w-[50%] mt-4 md:mt-0 relative h-[440px] sm:h-[480px] md:h-[500px] max-w-md md:max-w-none mx-auto transition-all duration-1000 delay-200 transform ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}>
          <div className="absolute inset-0 bg-[#004F30] border border-[#0A6B41] rounded-[32px] md:rounded-[40px] shadow-[0_20px_60px_rgba(0,79,48,0.15)] p-5 sm:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-white/20 pb-4">
              <h3 className="font-black text-white tracking-widest text-xs sm:text-sm flex items-center gap-2">
                <ShieldCheck className="text-[#A89411]" size={18} />
                SYSTEM NOMINAL
              </h3>
              <span className="w-3 h-3 rounded-full bg-[#A89411] animate-pulse shrink-0"></span>
            </div>
            
            <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 sm:h-16 w-full bg-[#A89411]/40 rounded-2xl flex items-center px-4 sm:px-6 justify-between animate-pulse">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A89411]/50 shrink-0"></div>
                      <div>
                        <div className="h-2 w-20 sm:w-24 bg-[#A89411]/50 rounded-full mb-2"></div>
                        <div className="h-2 w-14 sm:w-16 bg-[#A89411]/40 rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-4 w-10 sm:w-12 bg-[#A89411]/50 rounded-full"></div>
                  </div>
                ))
              ) : previewFlights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-6">
                  <div className="w-12 h-12 rounded-full bg-[#A89411]/20 flex items-center justify-center">
                    <Plane className="text-[#A89411] rotate-45" size={20} />
                  </div>
                  <p className="text-sm font-bold text-[#A89411]">No active flights right now</p>
                </div>
              ) : (
                previewFlights.map((f, i) => (
                  <div key={f.flightNum || i} className="h-14 sm:h-16 w-full bg-[#A89411] rounded-2xl flex items-center px-4 sm:px-6 justify-between group hover:bg-[#D4C345] transition-colors shadow-md border border-[#D4C345]/50 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#004F30] flex items-center justify-center font-black text-white text-[10px] sm:text-xs shrink-0 shadow-inner">
                        {(f.flightNum || 'PK').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-[#1C2B22] truncate">
                          {f.source || '—'} <span className="text-[#1C2B22]/40 mx-1">→</span> {f.dest || '—'}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-[#1C2B22]/70 truncate">{f.flightNum || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-xs font-black text-white bg-[#004F30] px-2.5 py-1 rounded-full shrink-0 ml-2 shadow-inner">
                      LIVE
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="absolute right-2 -top-4 sm:-right-8 sm:top-12 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-50 flex flex-col items-center gap-1 sm:gap-2 animate-bounce" style={{ animationDuration: '4s' }}>
             <span className="text-2xl sm:text-3xl font-black text-[#004F30]">{loading ? '—' : flights.length}</span>
             <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">Active Flights</span>
          </div>
        </div>

      </div>
    </div>
  );
}