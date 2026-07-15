import { Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

export default function Contact({ isSection = false }) {
  const navigate = useNavigate();

  return (
    <div id="contact" className={`w-full flex flex-col bg-[#F8F9FA] relative overflow-hidden ${isSection ? 'h-screen justify-center' : 'min-h-screen pt-[80px]'}`}>
      
      {/* Abstract Grid Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(168,148,17,0.05)_0%,_transparent_70%)] rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(0,79,48,0.05)_0%,_transparent_70%)] rounded-full blur-3xl"></div>
      </div>

      {/* Main Contact Content (Takes up screen height) */}
      <div className={`flex-1 w-full flex items-center justify-center relative z-10 ${isSection ? '' : 'min-h-[80vh] py-24'}`}>
        <div className="max-w-[1600px] w-full mx-auto px-8 md:px-16 lg:px-24 flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left: Contact Info & Typography */}
          <div className="w-full lg:w-[45%] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="text-[#004F30]" size={24} />
              <span className="text-[#004F30] font-black tracking-[0.3em] text-sm uppercase">Global Support</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-[#1C2B22] tracking-tighter leading-[1.1] mb-8">
              WE ARE HERE TO <br/><span className="text-[#A89411]">HELP.</span>
            </h2>
            
            <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10 max-w-lg">
              Whether you are an airline partner integrating with our telemetry API, or a passenger needing booking assistance, our global support team is available 24/7.
            </p>

            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-[#004F30] group-hover:bg-[#004F30] group-hover:text-white transition-colors">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-[#1C2B22] font-black tracking-widest text-sm uppercase mb-1">Headquarters</h4>
                  <p className="text-gray-500 font-medium">Jinnah International, Karachi</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-[#004F30] group-hover:bg-[#004F30] group-hover:text-white transition-colors">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="text-[#1C2B22] font-black tracking-widest text-sm uppercase mb-1">Global Hotline</h4>
                  <p className="text-gray-500 font-medium">+92 (21) 111-786-786</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Premium Contact Form */}
          <div className="w-full lg:w-[55%]">
            <form className="bg-white/70 backdrop-blur-3xl p-10 md:p-14 rounded-[40px] shadow-[0_20px_60px_rgba(0,79,48,0.06)] border border-white space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase ml-2">Full Name</label>
                  <input type="text" className="w-full bg-[#F8F9FA] border border-gray-100 rounded-2xl p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all placeholder-gray-300" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase ml-2">Email Address</label>
                  <input type="email" className="w-full bg-[#F8F9FA] border border-gray-100 rounded-2xl p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all placeholder-gray-300" placeholder="john@example.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase ml-2">Message</label>
                <textarea rows="4" className="w-full bg-[#F8F9FA] border border-gray-100 rounded-2xl p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all resize-none placeholder-gray-300" placeholder="How can we assist you today?"></textarea>
              </div>
              
              <button type="button" className="group flex items-center justify-center w-full gap-4 bg-[#004F30] text-white px-8 py-5 rounded-2xl font-black tracking-widest text-sm hover:bg-[#1C2B22] transition-all duration-300 shadow-lg hover:shadow-xl mt-4">
                SEND TRANSMISSION
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Massive Dark Cinematic Footer */}
      {!isSection && <Footer />}
    </div>
  );
}
