import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `text-sm font-bold tracking-widest transition-all px-4 py-2 rounded-full ${
      isActive 
      ? 'bg-[#004F30]/10 text-[#004F30]' 
      : 'text-gray-500 hover:text-[#1C2B22] hover:bg-gray-100/50'
    }`;
  };

  return (
    // Floating Glassmorphic Pill - Light Mode
    <header className="fixed top-3 left-1/2 -translate-x-1/2 w-11/12 max-w-[1400px] z-50 bg-white/75 backdrop-blur-md border border-white/50 rounded-full shadow-[0_10px_30px_rgba(0,79,48,0.08)] px-4 py-2 transition-all duration-500">
      <div className="flex justify-between items-center pl-4 pr-2">
        
        <Link to="/" className="flex items-center gap-3 group shrink-0 mr-4">
          <img src="/logo.png" alt="AERO" className="h-8 w-auto transform group-hover:scale-105 transition-transform" />
          <span className="text-2xl font-bold tracking-[0.2em] text-[#1C2B22]">AERO</span>
        </Link>
        
        <nav className="hidden xl:flex gap-1 items-center flex-wrap justify-end">
          <Link to="/" className={getLinkClass('/')}>HOME</Link>
          <Link to="/live-ops" className={getLinkClass('/live-ops')}>LIVE MAP</Link>
          <Link to="/airports" className={getLinkClass('/airports')}>VIEW AIRPORTS</Link>
          <Link to="/fleet" className={getLinkClass('/fleet')}>FLEET</Link>
          
          <div className="h-5 w-px bg-gray-300 mx-2"></div>
          
          <Link to="/booking" className={getLinkClass('/booking')}>BOOK FLIGHT</Link>
          <Link to="/about" className={getLinkClass('/about')}>ABOUT</Link>
          <Link to="/contact" className={getLinkClass('/contact')}>CONTACT</Link>
          
          <div className="h-5 w-px bg-gray-300 mx-2"></div>
          
          <Link to="/chat" className={`text-sm font-bold tracking-widest transition-all px-4 py-2 rounded-full flex items-center gap-2 ${
            location.pathname === '/chat' 
            ? 'bg-gradient-to-r from-[#004F30] to-[#A89411] text-white shadow-md border-none' 
            : 'bg-white border border-gray-200 text-[#1C2B22] hover:border-[#A89411]/50 hover:shadow-sm'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${location.pathname === '/chat' ? 'bg-white' : 'bg-[#004F30]'}`}></span>
            AERO AI
          </Link>
        </nav>
        
      </div>
    </header>
  );
}
