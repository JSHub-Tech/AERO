export default function BookingDemo() {
  return (
    // Changed to h-[calc(100vh-80px)] to fit perfectly under the header without creating a second scrollbar
    <div id="tickets" className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-[#0a0a0a] border-t border-[#004F30]/30 pt-20">
      <div className="max-w-4xl w-full mx-auto px-4">
        
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white tracking-wider">Flight Routing <span className="text-[#AB9214]">Engine</span></h2>
          <p className="mt-4 text-gray-400 font-light text-lg">Powered by Neo4j Graph Database. Find the most optimal paths across the PIA network.</p>
        </div>
        
        {/* Glassmorphic booking card */}
        <div className="bg-[#101010] p-10 rounded-2xl border border-[#004F30]/40 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3 tracking-wide">ORIGIN</label>
              <select className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 text-white focus:outline-none focus:border-[#AB9214] transition-colors appearance-none text-lg">
                <option>DXB - Dubai</option>
                <option>LHR - London</option>
                <option>ISB - Islamabad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3 tracking-wide">DESTINATION</label>
              <select className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 text-white focus:outline-none focus:border-[#AB9214] transition-colors appearance-none text-lg">
                <option>ISB - Islamabad</option>
                <option>LHE - Lahore</option>
                <option>KHI - Karachi</option>
              </select>
            </div>
          </div>
          
          <button className="w-full mt-10 py-5 bg-[#004F30] hover:bg-[#004F30]/80 text-white text-lg font-bold tracking-widest rounded-xl transition-all border border-[#004F30] hover:border-[#AB9214] shadow-[0_0_10px_rgba(0,79,48,0.3)] hover:shadow-[0_0_15px_rgba(171,146,20,0.4)]">
            CALCULATE OPTIMAL ROUTE
          </button>
        </div>

      </div>
    </div>
  );
}
