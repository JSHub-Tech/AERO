export default function Footer() {
  return (
    <footer className="bg-white text-[#1C2B22] py-16 border-t border-gray-200 w-full snap-start relative z-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        <div>
          <h3 className="text-2xl font-bold tracking-widest mb-4 flex items-center gap-3 text-[#1C2B22]">
             <img src="/logo.png" alt="AERO" className="h-6 w-auto opacity-90" />
             AERO
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Pakistan International Airlines operational dashboard. Real-time telemetry, routing, and global tracking.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold tracking-widest mb-4 text-sm text-[#004F30]">PLATFORM</h4>
          <ul className="space-y-3 text-sm text-gray-500 font-medium">
            <li><a href="/" className="hover:text-[#A89411] transition-colors">Dashboard</a></li>
            <li><a href="/live-ops" className="hover:text-[#A89411] transition-colors">Live Map</a></li>
            <li><a href="/airports" className="hover:text-[#A89411] transition-colors">View Airports</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold tracking-widest mb-4 text-sm text-[#004F30]">COMPANY</h4>
          <ul className="space-y-3 text-sm text-gray-500 font-medium">
            <li><a href="/#about" className="hover:text-[#A89411] transition-colors">About AERO</a></li>
            <li><a href="/#contact" className="hover:text-[#A89411] transition-colors">Contact</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold tracking-widest mb-4 text-sm text-[#004F30]">SOCIAL</h4>
          <div className="flex gap-4">
            <a href="#" className="w-12 h-12 rounded-full bg-[#F8F9FA] border border-gray-200 flex items-center justify-center hover:bg-[#004F30] hover:border-[#004F30] hover:text-white transition-all hover:scale-110 shadow-sm text-gray-500 font-bold text-lg">
               𝕏
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-[#F8F9FA] border border-gray-200 flex items-center justify-center hover:bg-[#004F30] hover:border-[#004F30] hover:text-white transition-all hover:scale-110 shadow-sm text-gray-500 font-bold">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-[#F8F9FA] border border-gray-200 flex items-center justify-center hover:bg-[#004F30] hover:border-[#004F30] hover:text-white transition-all hover:scale-110 shadow-sm text-gray-500 font-bold">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          </div>
        </div>
        
      </div>
      
      <div className="text-center text-xs mt-16 pt-8 border-t border-gray-100 text-gray-400 font-bold tracking-[0.15em] uppercase">
        &copy; {new Date().getFullYear()} AERO BY PAKISTAN INTERNATIONAL AIRLINES. ALL SYSTEMS NOMINAL.
      </div>
    </footer>
  );
}
