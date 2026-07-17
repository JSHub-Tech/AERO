import { Database, Network, Zap, Cuboid } from 'lucide-react';
import Footer from '../components/Footer';

export default function About({ isSection = false }) {
  return (
    <div id="about" className={`w-full flex flex-col bg-white relative overflow-hidden ${isSection ? 'min-h-screen md:h-screen justify-center py-16 md:py-0' : 'min-h-screen'}`}>
      
      {/* Premium Apple-style Abstract Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#004F30]/5 blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#A89411]/5 blur-[120px]"></div>
      </div>

      <div className={`w-full flex flex-col items-center justify-center relative ${isSection ? 'py-0' : 'py-24 pt-[150px] min-h-[80vh]'}`}>
        
        <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 relative z-10 flex flex-col lg:flex-row items-center gap-10 sm:gap-14 lg:gap-20">
          
          {/* Left Side: Typography */}
          <div className="w-full lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full mb-6 sm:mb-8 inline-flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#004F30] animate-pulse"></span>
              <span className="text-[#004F30] text-[10px] font-black tracking-[0.2em] uppercase">Enterprise Infrastructure</span>
            </div>

            <h2 className="text-5xl sm:text-6xl md:text-8xl font-black text-[#1C2B22] tracking-tighter leading-[0.95] mb-6 sm:mb-8">
              BUILT <br/><span className="text-transparent bg-clip-text bg-gradient-to-br from-[#004F30] to-[#A89411]">FOR SCALE.</span>
            </h2>
            
            <p className="text-gray-500 text-base sm:text-lg md:text-xl font-medium leading-relaxed mb-8 sm:mb-12 max-w-lg">
              AERO is a full-stack, distributed operations platform engineered for modern aviation. Our multi-database microservice architecture guarantees frictionless, real-time tracking of the entire global fleet.
            </p>
            
            <div className="flex flex-wrap gap-4 sm:gap-5 justify-center lg:justify-start">
              <div className="flex flex-col items-center lg:items-start px-6 sm:px-8 py-5 sm:py-6 rounded-3xl border border-gray-200 bg-white/60 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-[#004F30]/30 transition-all">
                <span className="text-4xl sm:text-5xl font-black text-[#1C2B22] tracking-normal mb-1.5">99.9%</span>
                <span className="text-xs text-gray-400 font-bold tracking-[0.15em] uppercase">Global Uptime</span>
              </div>
              <div className="flex flex-col items-center lg:items-start px-6 sm:px-8 py-5 sm:py-6 rounded-3xl border border-gray-200 bg-white/60 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-[#004F30]/30 transition-all">
                <span className="text-4xl sm:text-5xl font-black text-[#1C2B22] tracking-normal mb-1.5">&lt;50<span className="text-xl sm:text-2xl text-gray-400 ml-0.5">ms</span></span>
                <span className="text-xs text-gray-400 font-bold tracking-[0.15em] uppercase">Data Latency</span>
              </div>
            </div>
          </div>

          {/* Right Side: Tech Stack Grid */}
          <div className="w-full lg:w-[55%] grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative">
            
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 group">
              <Database className="text-[#336791] mb-5 sm:mb-8 group-hover:scale-110 transition-transform" size={36} />
              <h3 className="text-[#1C2B22] font-black text-xl sm:text-2xl mb-2 sm:mb-3 tracking-wide">PostgreSQL</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Primary source of truth for millions of robust transactional flight logs and passenger manifests with strict ACID compliance.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 group md:translate-y-12">
              <Network className="text-[#018bff] mb-5 sm:mb-8 group-hover:scale-110 transition-transform" size={36} />
              <h3 className="text-[#1C2B22] font-black text-xl sm:text-2xl mb-2 sm:mb-3 tracking-wide">Neo4j Graph</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Powering the routing engine. Complex multi-node connections between global hubs are mapped instantly.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 group">
              <Zap className="text-[#dc382d] mb-5 sm:mb-8 group-hover:scale-110 transition-transform" size={36} />
              <h3 className="text-[#1C2B22] font-black text-xl sm:text-2xl mb-2 sm:mb-3 tracking-wide">Redis Cache</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Distributed in-memory caching ensures that live aircraft telemetry reaches the frontend in under 50 milliseconds.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 group md:translate-y-12">
              <Cuboid className="text-[#A89411] mb-5 sm:mb-8 group-hover:scale-110 transition-transform" size={36} />
              <h3 className="text-[#1C2B22] font-black text-xl sm:text-2xl mb-2 sm:mb-3 tracking-wide">Three.js</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Hardware-accelerated WebGL renders the massive cinematic 3D globe and interactive fleet showroom directly in the browser.
              </p>
            </div>

          </div>

        </div>

      </div>

      {!isSection && <Footer />}
    </div>
  );
}