import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Bot, User, Trash2 } from 'lucide-react';
import Footer from '../components/Footer';

export default function Chat() {
  const { messages, addMessage, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    addMessage({ text: input, sender: 'user' });
    setInput('');
    
    setTimeout(() => {
      addMessage({ 
        text: "I am AERO AI. I am currently operating in offline simulation mode while my backend telemetry API is being configured.", 
        sender: 'ai' 
      });
    }, 800);
  };

  return (
    <div className="w-full min-h-screen pt-[100px] flex flex-col bg-[#F8F9FA] relative">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
         <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(0,79,48,0.05)_0%,_transparent_70%)] rounded-full blur-3xl"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[60%] bg-[radial-gradient(circle,_rgba(168,148,17,0.05)_0%,_transparent_70%)] rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-12 flex flex-col relative z-10" style={{ height: 'calc(100vh - 80px)' }}>
        
        {/* Chat Interface Container */}
        <div className="flex-1 bg-white/80 backdrop-blur-3xl border border-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,79,48,0.08)] flex flex-col overflow-hidden relative">
           
           {/* Internal Header Bar */}
           <div className="p-6 md:px-10 md:py-6 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md z-20">
              <div>
                <h1 className="text-3xl font-black text-[#1C2B22] tracking-tighter">
                  AERO <span className="text-[#004F30]">AI</span>
                </h1>
                <p className="text-gray-500 font-bold tracking-widest text-[10px] uppercase">Intelligent Operations Assistant</p>
              </div>
              
              {messages.length > 0 && (
                <button 
                  onClick={clearMessages}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-sm"
                >
                  <Trash2 size={14} /> CLEAR MEMORY
                </button>
              )}
           </div>

           {/* Scrollable Messages Area */}
           <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8 hide-scrollbar relative z-10">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full bg-[#004F30]/10 flex items-center justify-center mb-6">
                    <Bot size={48} className="text-[#004F30]" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1C2B22] tracking-tighter mb-2">SYSTEM ONLINE</h3>
                  <p className="text-gray-500 font-medium max-w-md mx-auto">
                    AERO AI is ready. You can ask about flight statuses, network delays, terminal information, or booking assistance.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                    
                    {/* Avatar */}
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ${msg.sender === 'user' ? 'bg-[#1C2B22] text-white' : 'bg-[#004F30] text-white'}`}>
                      {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>

                    {/* Bubble */}
                    <div className={`p-5 rounded-3xl text-sm md:text-base font-medium leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                      ? 'bg-[#1C2B22] text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 text-[#1C2B22] rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>

                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
           </div>

           {/* Input Box */}
           <div className="p-6 md:p-8 bg-white border-t border-gray-100/50 z-20">
             <form onSubmit={handleSend} className="relative flex items-center">
               <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Type your transmission here..."
                 className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-6 pr-16 py-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/10 transition-all text-base placeholder-gray-400 shadow-inner"
               />
               <button 
                 type="submit"
                 disabled={!input.trim()}
                 className="absolute right-3 w-12 h-12 bg-[#004F30] text-white rounded-xl hover:bg-[#1C2B22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
               >
                 <Send size={20} className="ml-1" />
               </button>
             </form>
           </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
