import { useState } from 'react';
import { Mail, MapPin, Phone, ArrowRight, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

export default function Contact({ isSection = false }) {
  const navigate = useNavigate();

  // Form Field States
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });

  // Alert Modal State
  const [alert, setAlert] = useState({
    show: false,
    type: '', // 'success' | 'error'
    title: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if any fields are empty
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setAlert({
        show: true,
        type: 'error',
        title: 'INCOMPLETE TRANSMISSION',
        message: 'Please fill out all required fields before sending your transmission.'
      });
      return;
    }

    // Success simulation (No actual message submission)
    setAlert({
      show: true,
      type: 'success',
      title: 'TRANSMISSION DISPATCHED',
      message: 'Your message has been logged successfully. Our global support team will contact you shortly.'
    });

    // Reset Form
    setFormData({ fullName: '', email: '', message: '' });
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, show: false }));
  };

  return (
    <div id="contact" className={`w-full flex flex-col relative overflow-hidden ${isSection ? 'snap-start min-h-screen justify-center py-16 sm:py-20 lg:py-24 bg-transparent' : 'bg-transparent min-h-screen pt-[80px]'}`}>
      
      {/* Abstract Grid Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(168,148,17,0.05)_0%,_transparent_70%)] rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(0,79,48,0.05)_0%,_transparent_70%)] rounded-full blur-3xl"></div>
      </div>

      {/* Main Contact Content (Takes up screen height) */}
      <div className={`flex-1 w-full flex items-center justify-center relative z-10 ${isSection ? '' : 'min-h-[80vh] py-16 sm:py-24'}`}>
        <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 flex flex-col lg:flex-row items-center gap-10 sm:gap-16">
          
          {/* Left: Contact Info & Typography */}
          <div className="w-full lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <Mail className="text-[#004F30]" size={22} />
              <span className="text-[#004F30] font-black tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm uppercase">Global Support</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#1C2B22] tracking-tighter leading-[1.1] mb-5 sm:mb-8">
              WE ARE HERE TO <br/><span className="text-[#A89411]">HELP.</span>
            </h2>
            
            <p className="text-gray-500 text-base sm:text-lg font-medium leading-relaxed mb-7 sm:mb-10 max-w-lg">
              Whether you are an airline partner integrating with our telemetry API, or a passenger needing booking assistance, our global support team is available 24/7.
            </p>

            <div className="flex flex-col gap-5 sm:gap-8 w-full max-w-xs mx-auto lg:max-w-none lg:mx-0">
              <div className="flex items-center gap-4 sm:gap-6 group cursor-pointer">
                <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-full bg-[#A89411] shadow-md flex items-center justify-center text-[#1C2B22] group-hover:bg-[#004F30] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <MapPin size={20} />
                </div>
                <div className="text-left">
                  <h4 className="text-[#1C2B22] font-black tracking-widest text-xs sm:text-sm uppercase mb-1">Headquarters</h4>
                  <p className="text-gray-500 font-medium text-sm sm:text-base">Jinnah International, Karachi</p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 group cursor-pointer">
                <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-full bg-[#A89411] shadow-md flex items-center justify-center text-[#1C2B22] group-hover:bg-[#004F30] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Phone size={20} />
                </div>
                <div className="text-left">
                  <h4 className="text-[#1C2B22] font-black tracking-widest text-xs sm:text-sm uppercase mb-1">Global Hotline</h4>
                  <p className="text-gray-500 font-medium text-sm sm:text-base">+92 (21) 111-786-786</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Premium Contact Form */}
          <div className="w-full lg:w-[55%]">
            <form onSubmit={handleSubmit} className="bg-[#004F30] border border-[#0A6B41] p-6 sm:p-10 md:p-14 rounded-[24px] sm:rounded-[40px] shadow-[0_20px_60px_rgba(0,79,48,0.15)] space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-white/70 uppercase ml-2">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-white border border-transparent rounded-2xl p-4 sm:p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#A89411] focus:ring-2 focus:ring-[#A89411]/20 transition-all placeholder-gray-400 shadow-inner" 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-white/70 uppercase ml-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-transparent rounded-2xl p-4 sm:p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#A89411] focus:ring-2 focus:ring-[#A89411]/20 transition-all placeholder-gray-400 shadow-inner" 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-white/70 uppercase ml-2">Message</label>
                <textarea 
                  rows="3" 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-white border border-transparent rounded-2xl p-4 sm:p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#A89411] focus:ring-2 focus:ring-[#A89411]/20 transition-all resize-none placeholder-gray-400 shadow-inner" 
                  placeholder="How can we assist you today?"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="group flex items-center justify-center w-full gap-3 sm:gap-4 bg-[#A89411] text-[#1C2B22] px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-black tracking-widest text-xs sm:text-sm hover:bg-[#D4C345] transition-all duration-300 shadow-xl shadow-[#A89411]/20 hover:-translate-y-0.5 hover:shadow-2xl mt-2 sm:mt-4 cursor-pointer"
              >
                SEND TRANSMISSION
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Themed Alert Modal */}
      {alert.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2B22]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full border border-gray-100 shadow-2xl relative flex flex-col items-center text-center">
            
            <button 
              onClick={closeAlert} 
              className="absolute top-5 right-5 text-gray-400 hover:text-[#1C2B22] transition-colors"
            >
              <X size={20} />
            </button>

            {alert.type === 'error' ? (
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-[#004F30]/10 rounded-full flex items-center justify-center mb-4 border border-[#004F30]/20">
                <CheckCircle2 className="w-8 h-8 text-[#004F30]" />
              </div>
            )}

            <h3 className="text-xl font-black text-[#1C2B22] tracking-tight mb-2">
              {alert.title}
            </h3>
            
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
              {alert.message}
            </p>

            <button 
              onClick={closeAlert}
              className={`w-full py-4 rounded-xl font-black tracking-widest text-xs uppercase transition-all shadow-md ${
                alert.type === 'error'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-[#004F30] text-white hover:bg-[#1C2B22]'
              }`}
            >
              Acknowledge
            </button>

          </div>
        </div>
      )}

      {/* Massive Dark Cinematic Footer */}
      {!isSection && <Footer />}
    </div>
  );
}