import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { sendChatMessage } from '../services/api';
import { Send, Bot, User, Trash2 } from 'lucide-react';
import Footer from '../components/Footer';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const { messages, addMessage, clearMessages, isTyping, setIsTyping } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userText = input;
    const userMessage = { text: userText, sender: 'user' };
    const newMessages = [...messages, userMessage];
    
    setInput('');
    addMessage(userMessage);
    
    try {
      setIsTyping(true);
      const response = await sendChatMessage(newMessages);
      addMessage({ text: response.answer, sender: 'ai' });
    } catch (error) {
      addMessage({ 
        text: "I am AERO AI. My connection to the live backend seems to be down at the moment.", 
        sender: 'ai' 
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full min-h-screen pt-[84px] sm:pt-[90px] md:pt-[100px] flex flex-col bg-transparent relative">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
         <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle,_rgba(0,79,48,0.05)_0%,_transparent_70%)] rounded-full blur-3xl"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[60%] bg-[radial-gradient(circle,_rgba(168,148,17,0.05)_0%,_transparent_70%)] rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-8 md:pb-12 flex flex-col relative z-10" style={{ height: 'calc(100vh - 64px)' }}>
        
        {/* Chat Interface Container */}
        <div className="flex-1 bg-[#004F30] border border-[#0A6B41] rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden relative">
           
           {/* Internal Header Bar */}
           <div className="p-4 sm:p-6 md:px-10 md:py-6 border-b border-[#0A6B41] flex items-center justify-between bg-[#1C2B22]/50 z-20 gap-3">
              <div>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tighter">
                  AERO AI
                </h1>
                <p className="text-[#A89411] font-bold tracking-widest text-[9px] sm:text-[10px] uppercase">Intelligent Operations Assistant</p>
              </div>
              
              {messages.length > 0 && (
                <button 
                  onClick={clearMessages}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-[#1C2B22]/50 border border-[#0A6B41] text-red-400 hover:bg-red-500/10 hover:border-red-500/30 rounded-xl text-[10px] sm:text-xs font-bold tracking-widest transition-colors shadow-sm shrink-0"
                >
                  <Trash2 size={14} /> <span className="hidden xs:inline">CLEAR MEMORY</span><span className="xs:hidden">CLEAR</span>
                </button>
              )}
           </div>

           {/* Scrollable Messages Area */}
           <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8 hide-scrollbar relative z-10 bg-transparent">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6 border border-white/20 shadow-sm">
                    <Bot size={48} className="text-[#A89411]" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tighter mb-2">SYSTEM ONLINE</h3>
                  <p className="text-white/60 font-medium max-w-md mx-auto">
                    AERO AI is ready. You can ask about flight statuses, network delays, terminal information, or booking assistance.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                    
                    {/* Avatar */}
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ${msg.sender === 'user' ? 'bg-[#A89411] text-[#1C2B22]' : 'bg-white/10 text-white border border-white/20'}`}>
                      {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>

                    {/* Bubble */}
                    <div className={`p-5 rounded-3xl text-sm md:text-base font-medium leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                      ? 'bg-[#A89411] text-[#1C2B22] rounded-tr-sm'
                      : 'bg-white/10 border border-white/20 text-white rounded-tl-sm prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-[#A89411] prose-pre:bg-[#1C2B22] prose-pre:border prose-pre:border-white/20 prose-pre:text-white/80'
                    }`}>
                      {msg.sender === 'user' ? (
                        msg.text
                      ) : (
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      )}
                    </div>

                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex gap-4 max-w-[85%] md:max-w-[75%] self-start animate-fade-in">
                  <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm bg-white/10 text-white border border-white/20">
                    <Bot size={20} />
                  </div>
                  <div className="p-5 rounded-3xl bg-white/10 border border-white/20 text-white rounded-tl-sm flex items-center gap-2 h-[60px] shadow-sm">
                    <div className="w-2 h-2 bg-[#A89411] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#A89411] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#A89411] rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           {/* Input Box */}
           <div className="p-6 md:p-8 bg-[#004F30] border-t border-[#0A6B41] z-20 rounded-b-[2.5rem]">
             <form onSubmit={handleSend} className="relative flex items-center">
               <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 disabled={isTyping}
                 placeholder={isTyping ? "AERO AI is transmitting..." : "Type your transmission here..."}
                 className="w-full bg-white/10 border border-white/20 rounded-2xl pl-6 pr-16 py-5 text-white placeholder-white/40 font-medium focus:outline-none focus:border-[#A89411] transition-colors text-base disabled:opacity-50"
               />
               <button 
                 type="submit"
                 disabled={!input.trim() || isTyping}
                 className="absolute right-3 w-12 h-12 bg-[#A89411] border border-[#A89411] text-[#1C2B22] rounded-xl hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:bg-[#D4C345]"
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