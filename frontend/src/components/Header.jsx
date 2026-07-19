import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Lock, Unlock, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { user, logout } = useAuth();

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
      ? 'bg-[#A89411] text-[#1C2B22] shadow-md'
      : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;
  };

  const getMobileLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `text-base font-bold tracking-widest transition-all px-5 py-4 rounded-2xl w-full text-center ${
      isActive
      ? 'bg-[#004F30] text-white shadow-md'
      : 'text-gray-600 hover:text-[#004F30] hover:bg-[#004F30]/10'
    }`;
  };

  const aeroAiClass = `text-sm font-bold tracking-widest transition-all px-4 py-2 rounded-full flex items-center gap-2 ${
    location.pathname === '/chat'
    ? 'bg-[#A89411] text-[#1C2B22] shadow-md border-none'
    : 'bg-white text-[#004F30] hover:bg-[#A89411] hover:text-[#1C2B22] shadow-sm'
  }`;

  return (
    <>
      {/* Floating Glassmorphic Pill - Dark Green Mode */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-11/12 max-w-[1400px] z-50 bg-[#004F30] backdrop-blur-md border border-[#0A6B41] rounded-full shadow-[0_10px_30px_rgba(0,79,48,0.2)] px-3 sm:px-4 py-2 transition-all duration-500">
        <div className="flex justify-between items-center pl-2 sm:pl-4 pr-1 sm:pr-2">
          
          <Link to="/" className="flex items-center gap-3 shrink-0 mr-4 group">
            <img src="/logo.png" alt="AERO" className="h-6 sm:h-7 md:h-8 w-auto opacity-90 group-hover:scale-105 transition-transform brightness-0 invert" />
            <span className="font-bold text-lg sm:text-xl md:text-2xl tracking-[0.15em] text-white">
              AERO
            </span>
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

            {/* Auth Icon */}
            {user ? (
              <div className="flex items-center gap-1 ml-1 group">
                <div title="Authenticated" className="p-2 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center cursor-default">
                  <Unlock size={16} />
                </div>
                <button onClick={logout} title="Sign Out" className="p-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white transition-all border border-red-500/30 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/login" title="Sign In" className="ml-1 p-2 rounded-full bg-white text-[#004F30] hover:bg-[#A89411] hover:text-[#1C2B22] transition-all flex items-center justify-center group shadow-sm">
                <Lock size={16} className="group-hover:scale-110 transition-transform" />
              </Link>
            )}
          </nav>

          {/* Mobile/tablet controls */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              type="button"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsMenuOpen((v) => !v)}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div 
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-[400px] bg-[#004F30] border-l border-[#0A6B41] shadow-2xl z-50 transform transition-transform duration-500 ease-out flex flex-col xl:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex justify-end">
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
          {NAV_LINKS.map(link => (
            <Link 
              key={link.to} 
              to={link.to} 
              className={getMobileLinkClass(link.to)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-white/20">
            <Link to="/chat" className="flex items-center justify-center gap-3 text-base font-bold tracking-widest bg-white/10 text-white w-full py-4 rounded-2xl hover:bg-white/20 transition-colors">
              <span className="w-2 h-2 rounded-full bg-[#A89411] animate-pulse"></span>
              AERO AI
            </Link>
          </div>
        </div>

        <div className="p-6 mt-auto border-t border-white/20">
          {user ? (
            <div className="flex flex-col gap-3">
              <button onClick={logout} className="w-full py-4 text-white hover:text-white font-bold tracking-widest bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
                LOGOUT
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center justify-center gap-2 w-full py-4 bg-[#A89411] text-white font-bold tracking-widest rounded-2xl hover:bg-[#8A790E] transition-colors">
              <Lock size={18} /> STAFF LOGIN
            </Link>
          )}
        </div>
      </div>
    </>
  );
}