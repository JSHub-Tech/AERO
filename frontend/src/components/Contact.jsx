export default function Contact() {
  return (
    // Changed to h-[calc(100vh-80px)] to fit perfectly under the header without creating a second scrollbar
    <div id="contact" className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-[#0a0a0a] border-t border-gray-900">
      <div className="max-w-3xl w-full mx-auto px-4">
        
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white tracking-wider">Contact <span className="text-[#AB9214]">Control Tower</span></h2>
        </div>
        
        <form className="space-y-8 bg-[#101010] p-10 rounded-3xl border border-gray-900 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <input 
              type="text" 
              placeholder="Callsign (Name)" 
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 text-white focus:outline-none focus:border-[#AB9214] transition-colors" 
            />
            <input 
              type="email" 
              placeholder="Comms Link (Email)" 
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 text-white focus:outline-none focus:border-[#AB9214] transition-colors" 
            />
          </div>
          
          <textarea 
            rows="5" 
            placeholder="Transmission Log (Message)" 
            className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 text-white focus:outline-none focus:border-[#AB9214] transition-colors resize-none"
          ></textarea>
          
          <div className="text-center">
            <button 
              type="button" 
              className="px-12 py-5 bg-[#0a0a0a] hover:bg-[#004F30] text-white text-lg font-bold tracking-widest rounded-xl transition-all border border-gray-800 hover:border-[#004F30] w-full md:w-auto shadow-lg"
            >
              TRANSMIT MESSAGE
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
