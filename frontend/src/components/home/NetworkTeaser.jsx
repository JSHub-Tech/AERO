import { ArrowRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function NetworkTeaser() {
  const navigate = useNavigate();
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setZoomedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full min-h-screen md:h-screen bg-white relative flex flex-col items-center justify-center overflow-hidden py-16 sm:py-20 md:py-24">
      
      {/* ZOOMED IMAGE LIGHTBOX */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer" 
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Enlarged view" 
            className="max-w-[80%] max-h-[80%] object-cover rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-[6px] border-white/50 transform scale-100 transition-transform duration-300" 
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-xl font-bold text-white transition-colors backdrop-blur-md"
          >
            ✕
          </button>
        </div>
      )}

      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 z-10 flex flex-col items-center text-center mb-10 sm:mb-16">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <MapPin className="text-[#A89411]" size={22} />
          <span className="text-[#A89411] font-black tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm uppercase">Global Network</span>
        </div>
        
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#1C2B22] tracking-tighter leading-[1.1] mb-4 sm:mb-6">
          CONNECTING THE <br/><span className="text-gray-300">WORLD.</span>
        </h2>
        
        <p className="text-gray-500 text-base sm:text-lg md:text-xl font-medium max-w-2xl leading-relaxed mb-7 sm:mb-10">
          From the bustling hubs of the Middle East to the historic terminals of Europe, explore our vast network of interconnected global destinations.
        </p>

        <button 
          onClick={() => navigate('/airports')}
          className="group flex items-center gap-3 sm:gap-4 bg-[#F8F9FA] text-[#1C2B22] border-2 border-gray-200 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-black tracking-widest text-xs sm:text-sm hover:border-[#1C2B22] transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg"
        >
          VIEW AIRPORTS
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Stunning Photo Grid Mockup */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
        
        {/* Card 1 */}
        <div onClick={() => setZoomedImage('/airport_pics/LHR_1.jpg')} className="block h-56 sm:h-64 md:h-[350px] rounded-3xl md:rounded-[30px] overflow-hidden relative group cursor-pointer shadow-lg">
          <img src="/airport_pics/LHR_1.jpg" alt="London Heathrow" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-5 sm:bottom-8 left-5 sm:left-8">
            <h3 className="text-white text-2xl sm:text-3xl font-black tracking-wider">LHR</h3>
            <p className="text-gray-300 font-bold tracking-widest text-xs sm:text-sm mt-1">LONDON, UK</p>
          </div>
        </div>

        {/* Card 2 */}
        <div onClick={() => setZoomedImage('/airport_pics/DXB_1.jpg')} className="block h-56 sm:h-64 md:h-[350px] rounded-3xl md:rounded-[30px] overflow-hidden relative group cursor-pointer shadow-lg md:-translate-y-8">
          <img src="/airport_pics/DXB_1.jpg" alt="Dubai" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-5 sm:bottom-8 left-5 sm:left-8">
            <h3 className="text-white text-2xl sm:text-3xl font-black tracking-wider">DXB</h3>
            <p className="text-gray-300 font-bold tracking-widest text-xs sm:text-sm mt-1">DUBAI, UAE</p>
          </div>
        </div>

        {/* Card 3 */}
        <div onClick={() => setZoomedImage('/airport_pics/IST_1.jpg')} className="block h-56 sm:h-64 md:h-[350px] rounded-3xl md:rounded-[30px] overflow-hidden relative group cursor-pointer shadow-lg">
          <img src="/airport_pics/IST_1.jpg" alt="Istanbul" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-5 sm:bottom-8 left-5 sm:left-8">
            <h3 className="text-white text-2xl sm:text-3xl font-black tracking-wider">IST</h3>
            <p className="text-gray-300 font-bold tracking-widest text-xs sm:text-sm mt-1">ISTANBUL, TURKEY</p>
          </div>
        </div>

      </div>

    </div>
  );
}