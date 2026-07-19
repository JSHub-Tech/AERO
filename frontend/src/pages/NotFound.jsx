import { useNavigate } from 'react-router-dom';
import { Plane, Home, MapPin } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-white px-6">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#004F30]/5 blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#A89411]/5 blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-50 border border-gray-100 shadow-sm flex items-center justify-center mb-6 sm:mb-8">
          <Plane className="text-[#004F30] -rotate-45" size={32} />
        </div>

        <span className="text-[#004F30] text-[10px] font-black tracking-[0.2em] uppercase mb-3">Error 404</span>

        <h1 className="text-6xl sm:text-8xl font-black text-[#1C2B22] tracking-tighter leading-none mb-4 sm:mb-6">
          OFF <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#004F30] to-[#A89411]">COURSE.</span>
        </h1>

        <p className="text-gray-500 text-base sm:text-lg font-medium leading-relaxed mb-8 sm:mb-10 max-w-md">
          This route doesn't exist in our flight plan. The page you're looking for may have moved or was never here.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 sm:gap-3 bg-[#004F30] text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-black tracking-widest text-xs sm:text-sm hover:bg-[#1C2B22] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Home size={18} />
            BACK TO HOME
          </button>
          <button
            onClick={() => navigate('/airports')}
            className="flex items-center gap-2 sm:gap-3 bg-white text-[#1C2B22] border border-gray-200 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-black tracking-widest text-xs sm:text-sm hover:border-[#004F30]/40 hover:text-[#004F30] transition-all duration-300"
          >
            <MapPin size={18} />
            EXPLORE TERMINALS
          </button>
        </div>
      </div>
    </div>
  );
}