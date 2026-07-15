import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // Controls the floating widget

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, clearMessages, isOpen, setIsOpen, toggleChat }}>
      {children}
    </ChatContext.Provider>
  );
};
