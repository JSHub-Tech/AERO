import { useLocation } from 'react-router-dom';
import Header from './Header';
import ChatWidget from './ChatWidget';
export default function Layout({ children }) {
  const location = useLocation();
  const hideWidgetPaths = ['/fleet', '/airports', '/chat'];
  const shouldShowWidget = !hideWidgetPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1C2B22] selection:bg-[#004F30]/20">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {shouldShowWidget && <ChatWidget />}
    </div>
  );
}
