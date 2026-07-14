export default function BookingDemo() {
  return (
    <div id="tickets" className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8F9FA] pt-20">
      <div className="max-w-4xl w-full mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-[#1C2B22] tracking-wider">Flight Routing <span className="text-[#004F30]">Engine</span></h2>
          <p className="mt-4 text-gray-500 font-medium text-lg">Powered by Neo4j Graph Database. Find the most optimal paths across the PIA network.</p>
        </div>
        <div className="bg-white p-10 rounded-3xl shadow-[0_10px_40px_rgba(0,79,48,0.08)] border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-3 tracking-widest">ORIGIN</label>
              <select className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-5 text-[#1C2B22] font-semibold focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all appearance-none text-lg shadow-sm">
                <option>DXB - Dubai</option>
                <option>LHR - London</option>
                <option>ISB - Islamabad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-3 tracking-widest">DESTINATION</label>
              <select className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-5 text-[#1C2B22] font-semibold focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all appearance-none text-lg shadow-sm">
                <option>ISB - Islamabad</option>
                <option>LHE - Lahore</option>
                <option>KHI - Karachi</option>
              </select>
            </div>
          </div>
          <button className="w-full mt-10 py-5 bg-[#004F30] hover:bg-[#1C2B22] text-white text-lg font-bold tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl">
            CALCULATE OPTIMAL ROUTE
          </button>
        </div>
      </div>
    </div>
  );
}
