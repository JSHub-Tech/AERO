import { ArrowRight, Wind } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FleetTeaser() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-[#111] relative flex items-center justify-center overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1542296332-2e4473faf563?q=80&w=2070&auto=format&fit=crop" 
          alt="AERO Fleet" 
          className="w-full h-full object-cover opacity-40 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-[#111]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/80 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] w-full mx-auto px-8 md:px-16 lg:px-24 flex flex-col md:flex-row items-center justify-between">
        
        {/* Text Content */}
        <div className="w-full md:w-1/2 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <Wind className="text-[#A89411]" size={24} />
            <span className="text-[#A89411] font-black tracking-[0.3em] text-sm uppercase">Next Generation</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-6 drop-shadow-2xl">
            THE PINNACLE OF <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">AEROSPACE.</span>
          </h2>
          
          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-lg leading-relaxed mb-10">
            Experience unparalleled comfort and state-of-the-art engineering. Our modern fleet is designed to make every journey extraordinary.
          </p>

          <button 
            onClick={() => navigate('/fleet')}
            className="group flex items-center gap-4 bg-white text-[#111] px-8 py-4 rounded-full font-black tracking-widest text-sm hover:bg-[#A89411] hover:text-white transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(168,148,17,0.3)] hover:scale-105"
          >
            ENTER 3D SHOWROOM
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Stats / Tech Specs Overlay */}
        <div className="w-full md:w-[40%] mt-16 md:mt-0 flex flex-col gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
            <h4 className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mb-1">Fuel Efficiency</h4>
            <p className="text-2xl font-black text-white">25% <span className="text-sm font-medium text-gray-400">Carbon Reduction</span></p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
            <h4 className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mb-1">Fleet Size</h4>
            <p className="text-2xl font-black text-white">142 <span className="text-sm font-medium text-gray-400">Active Aircraft</span></p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
            <h4 className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mb-1">Cruising Speed</h4>
            <p className="text-2xl font-black text-white">0.85 <span className="text-sm font-medium text-gray-400">Mach</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}
