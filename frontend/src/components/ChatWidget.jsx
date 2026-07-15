import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Maximize2, Send, Bot } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function ChatWidget() {
  const { messages, addMessage, isOpen, toggleChat } = useChat();
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add User message
    addMessage({ text: input, sender: 'user' });
    setInput('');
    
    // Simulate AI thinking and responding
    setTimeout(() => {
      addMessage({ 
        text: "I am AERO AI. I am currently operating in offline simulation mode while my backend telemetry API is being configured.", 
        sender: 'ai' 
      });
    }, 800);
  };

  const handleMaximize = () => {
    toggleChat(); // Close the floating widget
    navigate('/chat'); // Go to dedicated page
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white/95 backdrop-blur-3xl border border-gray-200 rounded-[2rem] shadow-[0_20px_60px_rgba(0,79,48,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#004F30] text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-black tracking-widest text-sm">AERO AI</h3>
                <p className="text-[10px] text-green-200 font-bold tracking-widest uppercase">System Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleMaximize} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Maximize to full screen">
                <Maximize2 size={16} />
              </button>
              <button onClick={toggleChat} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Chat History */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-[#F8F9FA]/50 hide-scrollbar">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <Bot size={48} className="text-[#004F30] mb-4 opacity-50" />
                <p className="text-[#1C2B22] font-bold tracking-widest text-sm uppercase">How can I assist your operations?</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium leading-relaxed ${
                    msg.sender === 'user' 
                    ? 'bg-[#004F30] text-white rounded-tr-sm' 
                    : 'bg-white border border-gray-200 text-[#1C2B22] shadow-sm rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AERO AI..."
              className="flex-1 bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#004F30] transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="bg-[#1C2B22] text-white p-3 rounded-xl hover:bg-[#004F30] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="w-16 h-16 bg-[#E8EFEA] text-[#004F30] rounded-full shadow-[0_10px_30px_rgba(0,79,48,0.15)] hover:scale-105 hover:bg-gradient-to-r hover:from-[#004F30] hover:to-[#A89411] hover:text-white transition-all duration-300 flex items-center justify-center group"
        >
          <Bot size={30} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#E8EFEA] group-hover:border-transparent transition-colors"></span>
        </button>
      )}

    </div>
  );
}
