import React, { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authSignup, authResetPassword, authUpdateEmail } from '../services/api';

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

  const resetPassword = async (email, newPassword) => {
    try {
      await authResetPassword(email, newPassword);
      // Intentionally not logging in here — send them to the login form to
      // confirm the new password actually works, rather than trusting it silently.
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Password reset failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aero_user');
  };

  const updateEmail = async (newEmail, currentPassword) => {
    try {
      const userData = await authUpdateEmail(newEmail, currentPassword);
      setUser(userData);
      localStorage.setItem('aero_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.error('Email update failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Email update failed' };
    }
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, signup, resetPassword, updateEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};