import { Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LiveOpsTeaser() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-[#F8F9FA] relative flex items-center justify-center overflow-hidden">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,79,48,0.15)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] w-full mx-auto px-8 md:px-16 lg:px-24 flex flex-col md:flex-row-reverse items-center justify-between">
        
        {/* Text Content */}
        <div className="w-full md:w-[45%] flex flex-col items-start md:pl-12">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-[#004F30]" size={24} />
            <span className="text-[#004F30] font-black tracking-[0.3em] text-sm uppercase">Global Telemetry</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-[#1C2B22] tracking-tighter leading-[1.1] mb-6">
            PRECISION IN <br/><span className="text-[#A89411]">THE SKIES.</span>
          </h2>
          
          <p className="text-gray-600 text-lg md:text-xl font-medium max-w-lg leading-relaxed mb-10">
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

        {/* Abstract UI Elements representing the dashboard */}
        <div className="w-full md:w-[50%] mt-16 md:mt-0 relative h-[500px]">
          {/* Main Dashboard Panel Mockup */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-3xl border border-white rounded-[40px] shadow-[0_20px_60px_rgba(0,79,48,0.08)] p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
              <h3 className="font-black text-[#1C2B22] tracking-widest text-sm flex items-center gap-2">
                <ShieldCheck className="text-[#004F30]" size={18} />
                SYSTEM NOMINAL
              </h3>
              <span className="w-3 h-3 rounded-full bg-[#004F30] animate-pulse"></span>
            </div>
            
            <div className="space-y-4 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-full bg-gray-50 rounded-2xl flex items-center px-6 justify-between group hover:bg-[#004F30]/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-400 text-xs">PK</div>
                    <div>
                      <div className="h-2 w-24 bg-gray-200 rounded-full mb-2 group-hover:bg-[#004F30]/30 transition-colors"></div>
                      <div className="h-2 w-16 bg-gray-100 rounded-full group-hover:bg-[#A89411]/30 transition-colors"></div>
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Floating Accents */}
          <div className="absolute -right-8 top-12 bg-white p-6 rounded-3xl shadow-xl border border-gray-50 flex flex-col items-center gap-2 animate-bounce" style={{ animationDuration: '4s' }}>
             <span className="text-3xl font-black text-[#004F30]">1,204</span>
             <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Active Flights</span>
          </div>
        </div>

      </div>
    </div>
  );
}
