import React, { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authSignup } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if we have a saved session
  useEffect(() => {
    const savedUser = localStorage.getItem('aero_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const userData = await authLogin(email, password);
      setUser(userData);
      localStorage.setItem('aero_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const signup = async (email, password) => {
    try {
      // Create the account first...
      const userData = await authSignup(email, password);
      // ...then log the person straight in so signup feels like one step, not two.
      setUser(userData);
      localStorage.setItem('aero_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Signup failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aero_user');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};