import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Chat from './pages/Chat';

// Lazy loaded heavy 3D pages
const Airports = lazy(() => import('./pages/Airports'));
const LiveOperations = lazy(() => import('./pages/LiveOperations'));
const Fleet = lazy(() => import('./pages/Fleet'));
const Booking = lazy(() => import('./pages/Booking'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Sleek loading screen for Suspense fallback
const PageLoader = () => (
  <div className="w-full h-[calc(100vh-80px)] mt-[80px] flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#004F30] rounded-full animate-spin mb-4"></div>
    <span className="text-gray-500 font-bold tracking-widest text-xs uppercase animate-pulse">Initializing Systems...</span>
  </div>
);


function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/airports" element={<Airports />} />
                <Route path="/live-ops" element={<LiveOperations />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/fleet" element={<Fleet />} />
                <Route path="/command-center" element={<AdminDashboard />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/chat" element={<Chat />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
