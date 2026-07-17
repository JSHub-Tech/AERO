import { Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-white border-t border-gray-200 pt-12 sm:pt-16 pb-8 relative z-20 overflow-hidden">
      
      {/* Giant background text for depth — hidden on small phones where it only ever clips/overlaps content */}
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] md:text-[15rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#004F30]/10 to-[#A89411]/10 whitespace-nowrap pointer-events-none select-none max-w-full overflow-hidden">
        AERO SYS
      </div>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 md:px-16 lg:px-24 relative z-10">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 md:gap-12 border-b border-gray-200 pb-10 md:pb-16">
          
          {/* Brand Col */}
          <div className="sm:col-span-2">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-widest flex items-center gap-3 text-[#1C2B22] mb-4 sm:mb-6">
              <img src="/logo.png" alt="AERO" className="h-9 sm:h-10 w-auto opacity-90" /> AERO
            </h2>
            <p className="text-gray-500 font-medium max-w-sm leading-relaxed text-sm sm:text-base">
              The next generation of operational logistics and global flight telemetry. Precision engineered for the future of aviation.
            </p>
          </div>
          
          {/* Links Col 1 */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h4 className="text-[#1C2B22] font-black tracking-widest text-xs uppercase mb-1 sm:mb-2">Platforms</h4>
            <button onClick={() => navigate('/live-ops')} className="text-gray-500 hover:text-[#004F30] text-left font-medium transition-colors text-sm sm:text-base">Command Center</button>
            <button onClick={() => navigate('/airports')} className="text-gray-500 hover:text-[#004F30] text-left font-medium transition-colors text-sm sm:text-base">Global Terminals</button>
            <button onClick={() => navigate('/fleet')} className="text-gray-500 hover:text-[#004F30] text-left font-medium transition-colors text-sm sm:text-base">3D Showroom</button>
          </div>

          {/* Links Col 2 */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h4 className="text-[#1C2B22] font-black tracking-widest text-xs uppercase mb-1 sm:mb-2">Company</h4>
            <button onClick={() => navigate('/about')} className="text-gray-500 hover:text-[#004F30] text-left font-medium transition-colors text-sm sm:text-base">About Us</button>
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-[#004F30] text-left font-medium transition-colors text-sm sm:text-base">Careers</button>
            <button onClick={() => navigate('/contact')} className="text-gray-500 hover:text-[#004F30] text-left font-medium transition-colors text-sm sm:text-base">Contact</button>
          </div>

        </div>

        <div className="pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-gray-500 font-medium text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} AERO / Pakistan International Airlines. All rights reserved.
          </p>
          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="flex items-center gap-4">
              <span className="text-gray-500 hover:text-[#004F30] cursor-pointer font-bold tracking-widest text-xs">PRIVACY</span>
              <span className="text-gray-500 hover:text-[#004F30] cursor-pointer font-bold tracking-widest text-xs">TERMS</span>
              <span className="text-gray-500 hover:text-[#004F30] cursor-pointer font-bold tracking-widest text-xs">STATUS</span>
            </div>
            <span className="text-gray-400 text-[10px] tracking-widest uppercase font-bold">
              Made by Saad, Umer and Jamal
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}