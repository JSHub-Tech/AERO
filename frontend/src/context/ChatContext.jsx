import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false); // Controls the floating widget
  const [isTyping, setIsTyping] = useState(false); // AI typing state

  useEffect(() => {
    sessionStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
    sessionStorage.removeItem('chat_history');
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, clearMessages, isOpen, setIsOpen, toggleChat, isTyping, setIsTyping }}>
      {children}
    </ChatContext.Provider>
  );
};
