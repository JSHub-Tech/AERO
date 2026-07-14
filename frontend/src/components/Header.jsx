import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  return (
    // Floating Glassmorphic Pill - Light Mode
    <header className="fixed top-3 left-1/2 -translate-x-1/2 w-11/12 max-w-7xl z-50 bg-white/75 backdrop-blur-md border border-white/50 rounded-full shadow-[0_10px_30px_rgba(0,79,48,0.08)] px-8 py-4 transition-all duration-500">
      <div className="flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="AERO" className="h-8 w-auto transform group-hover:scale-105 transition-transform" />
          <span className="text-2xl font-bold tracking-[0.2em] text-[#1C2B22]">AERO</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 items-center">
          <Link to="/" className={`text-sm font-bold tracking-widest transition-colors ${location.pathname === '/' ? 'text-[#004F30]' : 'text-gray-500 hover:text-[#1C2B22]'}`}>
            DASHBOARD
          </Link>
          <Link to="/live-ops" className={`text-sm font-bold tracking-widest transition-colors ${location.pathname === '/live-ops' ? 'text-[#004F30]' : 'text-gray-500 hover:text-[#1C2B22]'}`}>
            LIVE MAP
          </Link>
          <Link to="/airports" className={`text-sm font-bold tracking-widest transition-colors ${location.pathname === '/airports' ? 'text-[#004F30]' : 'text-gray-500 hover:text-[#1C2B22]'}`}>
            VIEW AIRPORTS
          </Link>
          
          <div className="h-4 w-px bg-gray-300 mx-2"></div>
          
          <Link to="/booking" className={`text-sm font-bold tracking-widest transition-colors ${location.pathname === '/booking' ? 'text-[#004F30]' : 'text-gray-500 hover:text-[#004F30]'}`}>BOOK FLIGHT</Link>
          <a href="/#about" className="text-sm font-bold tracking-widest text-gray-500 hover:text-[#004F30] transition-colors">ABOUT</a>
          <a href="/#contact" className="text-sm font-bold tracking-widest text-gray-500 hover:text-[#004F30] transition-colors">CONTACT</a>
        </nav>
        
      </div>
    </header>
  );
}
