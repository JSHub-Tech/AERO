import Header from './Header';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  const isAirportsPage = location.pathname === '/airports';

  return (
    // Base Background: Cloud White (#F8F9FA) with Charcoal Green text (#1C2B22)
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1C2B22] selection:bg-[#004F30]/20">
      <Header />
      <main className={`flex-grow ${isAirportsPage ? '' : 'pt-20'}`}>
        {children}
      </main>
      {!isAirportsPage && <Footer />}
    </div>
  );
}
