import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { to: '/', label: 'HOME' },
  { to: '/live-ops', label: 'LIVE MAP' },
  { to: '/airports', label: 'VIEW AIRPORTS' },
  { to: '/fleet', label: 'FLEET' },
  { to: '/booking', label: 'BOOK FLIGHT' },
  { to: '/about', label: 'ABOUT' },
  { to: '/contact', label: 'CONTACT' },
];

export default function Header() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `text-sm font-bold tracking-widest transition-all px-4 py-2 rounded-full ${
      isActive
      ? 'bg-[#004F30]/10 text-[#004F30]'
      : 'text-gray-500 hover:text-[#1C2B22] hover:bg-gray-100/50'
    }`;
  };

  const getMobileLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `text-base font-bold tracking-widest transition-all px-5 py-4 rounded-2xl w-full text-center ${
      isActive
      ? 'bg-[#004F30]/10 text-[#004F30]'
      : 'text-gray-600 hover:text-[#1C2B22] hover:bg-gray-100/50'
    }`;
  };

  const aeroAiClass = `text-sm font-bold tracking-widest transition-all px-4 py-2 rounded-full flex items-center gap-2 ${
    location.pathname === '/chat'
    ? 'bg-gradient-to-r from-[#004F30] to-[#A89411] text-white shadow-md border-none'
    : 'bg-white border border-gray-200 text-[#1C2B22] hover:border-[#A89411]/50 hover:shadow-sm'
  }`;

  return (
    <>
      {/* Floating Glassmorphic Pill - Light Mode */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-11/12 max-w-[1400px] z-50 bg-white/75 backdrop-blur-md border border-white/50 rounded-full shadow-[0_10px_30px_rgba(0,79,48,0.08)] px-3 sm:px-4 py-2 transition-all duration-500">
        <div className="flex justify-between items-center pl-2 sm:pl-4 pr-1 sm:pr-2">

          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 mr-2 sm:mr-4" onClick={() => setIsMenuOpen(false)}>
            <img src="/logo.png" alt="AERO" className="h-7 sm:h-8 w-auto transform group-hover:scale-105 transition-transform" />
            <span className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#1C2B22]">AERO</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex gap-1 items-center flex-wrap justify-end">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={getLinkClass(to)}>{label}</Link>
            ))}

            <div className="h-5 w-px bg-gray-300 mx-2"></div>

            <Link to="/chat" className={aeroAiClass}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${location.pathname === '/chat' ? 'bg-white' : 'bg-[#004F30]'}`}></span>
              AERO AI
            </Link>
          </nav>

          {/* Mobile/tablet controls: AERO AI shortcut + hamburger */}
          <div className="flex xl:hidden items-center gap-2">
            <Link to="/chat" className={`${aeroAiClass} !px-3 !py-2 !text-xs`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${location.pathname === '/chat' ? 'bg-white' : 'bg-[#004F30]'}`}></span>
              <span className="hidden sm:inline">AERO AI</span>
            </Link>
            <button
              type="button"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((v) => !v)}
              className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full flex items-center justify-center bg-gray-100/70 text-[#1C2B22] hover:bg-gray-200/70 transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className={`xl:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile drawer panel */}
      <nav
        className={`xl:hidden fixed top-[4.75rem] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-11/12 max-w-[520px] z-40 bg-white/95 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-[0_20px_60px_rgba(0,79,48,0.15)] p-3 flex flex-col gap-1 max-h-[calc(100vh-6rem)] overflow-y-auto transition-all duration-300 origin-top ${
          isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {NAV_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} className={getMobileLinkClass(to)}>{label}</Link>
        ))}
      </nav>
    </>
  );
}