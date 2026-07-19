import { Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-[#004F30] pt-8 sm:pt-10 pb-6 relative z-20 overflow-hidden">
      
      {/* Giant background text for depth */}
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] md:text-[15rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-[#A89411]/40 to-[#A89411]/5 whitespace-nowrap pointer-events-none select-none max-w-full overflow-hidden">
        AERO SYS
      </div>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 md:px-16 lg:px-24 relative z-10">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 md:gap-10 border-b border-white/10 pb-8 md:pb-10">
          
          {/* Brand Col */}
          <div className="sm:col-span-2">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-widest flex items-center gap-3 text-white mb-3 sm:mb-4">
              <img src="/logo.png" alt="AERO" className="h-8 sm:h-9 w-auto brightness-0 invert" /> AERO
            </h2>
            <p className="text-white/70 font-medium max-w-sm leading-relaxed text-xs sm:text-sm">
              The next generation of operational logistics and global flight telemetry. Precision engineered for the future of aviation.
            </p>
          </div>
          
          {/* Links Col 1 */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <h4 className="text-white font-black tracking-widest text-xs uppercase mb-1">Platforms</h4>
            <button onClick={() => navigate('/airports')} className="text-white/60 hover:text-white hover:translate-x-1 text-left font-medium transition-all duration-300 text-xs sm:text-sm w-fit tracking-wide">VIEW AIRPORTS</button>
            <button onClick={() => navigate('/fleet')} className="text-white/60 hover:text-white hover:translate-x-1 text-left font-medium transition-all duration-300 text-xs sm:text-sm w-fit tracking-wide">FLEET</button>
            <button onClick={() => navigate('/live-ops')} className="text-white/60 hover:text-white hover:translate-x-1 text-left font-medium transition-all duration-300 text-xs sm:text-sm w-fit tracking-wide">LIVE MAP</button>
            <button onClick={() => navigate('/booking')} className="text-white/60 hover:text-white hover:translate-x-1 text-left font-medium transition-all duration-300 text-xs sm:text-sm w-fit tracking-wide">BOOK FLIGHT</button>
          </div>

          {/* Links Col 2 */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <h4 className="text-white font-black tracking-widest text-xs uppercase mb-1">Company</h4>
            <button onClick={() => navigate('/about')} className="text-white/60 hover:text-white hover:translate-x-1 text-left font-medium transition-all duration-300 text-xs sm:text-sm w-fit tracking-wide">ABOUT</button>
            <button onClick={() => navigate('/contact')} className="text-white/60 hover:text-white hover:translate-x-1 text-left font-medium transition-all duration-300 text-xs sm:text-sm w-fit tracking-wide">CONTACT</button>
          </div>

        </div>

        <div className="h-[2px] w-12 mx-auto sm:mx-0 rounded-full bg-[#A89411] mt-4 mb-2"></div>

        <div className="pt-2 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
          <p className="text-white/50 font-medium text-[10px] sm:text-xs">
            &copy; {new Date().getFullYear()} AERO / Pakistan International Airlines. All rights reserved.
          </p>
          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="flex items-center gap-4">
              <span className="text-white/60 hover:text-[#A89411] cursor-pointer font-bold tracking-widest text-[10px] sm:text-xs transition-colors">PRIVACY</span>
              <span className="text-white/60 hover:text-[#A89411] cursor-pointer font-bold tracking-widest text-[10px] sm:text-xs transition-colors">TERMS</span>
              <span className="text-white/60 hover:text-[#A89411] cursor-pointer font-bold tracking-widest text-[10px] sm:text-xs transition-colors">STATUS</span>
            </div>
            <span className="text-white/40 text-[8px] sm:text-[9px] tracking-widest uppercase font-bold">
              Made by Saad, Umer and Jamal
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}