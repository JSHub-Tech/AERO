import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Maximize2, Send, Bot } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { sendChatMessage } from '../services/api';
import ReactMarkdown from 'react-markdown';

export default function ChatWidget() {
  const { messages, addMessage, isOpen, toggleChat, isTyping, setIsTyping } = useChat();
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userText = input;
    setInput('');
    
    // Add User message
    addMessage({ text: userText, sender: 'user' });
    
    try {
      setIsTyping(true);
      // Call the live Gemini RAG API
      const response = await sendChatMessage(userText);
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

  const handleMaximize = () => {
    toggleChat(); // Close the floating widget
    navigate('/chat'); // Go to dedicated page
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end">
      
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] max-w-[350px] md:w-[400px] h-[70vh] max-h-[500px] bg-white/95 backdrop-blur-3xl border border-gray-200 rounded-[2rem] shadow-[0_20px_60px_rgba(0,79,48,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
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
                    : 'bg-white border border-gray-200 text-[#1C2B22] shadow-sm rounded-tl-sm prose prose-sm max-w-none prose-p:my-1 prose-p:leading-relaxed prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:text-[#1C2B22] prose-pre:bg-gray-100 prose-pre:text-gray-800'
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
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] p-3 rounded-2xl bg-white border border-gray-200 text-[#1C2B22] shadow-sm rounded-tl-sm flex items-center gap-2 h-11">
                  <div className="w-1.5 h-1.5 bg-[#004F30] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#004F30] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#004F30] rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder={isTyping ? "AERO AI is typing..." : "Ask AERO AI..."}
              className="flex-1 bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#004F30] transition-colors disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
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