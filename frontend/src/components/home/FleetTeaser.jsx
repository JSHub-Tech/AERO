import { ArrowRight, Wind } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnimateOnScroll } from '../animation'; 

export default function FleetTeaser() {
  const navigate = useNavigate();
  const [containerRef, isInView] = useAnimateOnScroll();

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-transparent relative flex items-center justify-center py-20 sm:py-24">

      <div className="relative z-10 max-w-[1600px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 flex flex-col md:flex-row items-center justify-between">
        
        {/* Text Content - Slides from Left */}
        <div className={`w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left transition-all duration-1000 transform ${
          isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'
        }`}>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Wind className="text-[#A89411]" size={22} />
            <span className="text-[#A89411] font-black tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm uppercase">Next Generation</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#1C2B22] tracking-tighter leading-[1.1] mb-4 sm:mb-6">
            THE PINNACLE OF <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004F30] to-[#A89411]">AEROSPACE.</span>
          </h2>
          
          <p className="text-gray-500 text-base sm:text-lg md:text-xl font-medium max-w-lg leading-relaxed mb-7 sm:mb-10">
            Experience unparalleled comfort and state-of-the-art engineering. Our modern fleet is designed to make every journey extraordinary.
          </p>

          <button 
            onClick={() => navigate('/fleet')}
            className="group flex items-center gap-3 sm:gap-4 bg-[#004F30] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-black tracking-widest text-xs sm:text-sm hover:bg-[#1C2B22] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            ENTER 3D SHOWROOM
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Stats Content - Slides from Right */}
        <div className={`w-full md:w-[40%] mt-10 md:mt-0 flex flex-col gap-3 sm:gap-4 transition-all duration-1000 delay-200 transform ${
          isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
        }`}>
          <div className="bg-[#004F30] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,79,48,0.15)] hover:-translate-y-1 transition-transform border border-[#0A6B41]">
            <h4 className="text-[#A89411] font-bold tracking-widest text-[10px] uppercase mb-1">Fuel Efficiency</h4>
            <p className="text-xl sm:text-2xl font-black text-white">25% <span className="text-sm font-medium text-white/80">Carbon Reduction</span></p>
          </div>
          <div className="bg-[#004F30] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,79,48,0.15)] hover:-translate-y-1 transition-transform border border-[#0A6B41]">
            <h4 className="text-[#A89411] font-bold tracking-widest text-[10px] uppercase mb-1">Fleet Size</h4>
            <p className="text-xl sm:text-2xl font-black text-white">142 <span className="text-sm font-medium text-white/80">Active Aircraft</span></p>
          </div>
          <div className="bg-[#004F30] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,79,48,0.15)] hover:-translate-y-1 transition-transform border border-[#0A6B41]">
            <h4 className="text-[#A89411] font-bold tracking-widest text-[10px] uppercase mb-1">Cruising Speed</h4>
            <p className="text-xl sm:text-2xl font-black text-white">0.85 <span className="text-sm font-medium text-white/80">Mach</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}