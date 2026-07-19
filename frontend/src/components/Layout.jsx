import { useLocation } from 'react-router-dom';
import Header from './Header';
import ChatWidget from './ChatWidget';
export default function Layout({ children }) {
  const location = useLocation();
  const hideWidgetPaths = ['/fleet', '/airports', '/chat'];
  const shouldShowWidget = !hideWidgetPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col text-[#1C2B22] selection:bg-[#004F30]/20 relative">
      {/* GLOBAL FIXED BACKGROUND */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#ffffff] via-[#F8F9FA] to-[#E8ECEF]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.15] pointer-events-none mix-blend-multiply"></div>
      </div>
      
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {shouldShowWidget && <ChatWidget />}
    </div>
  );
}
