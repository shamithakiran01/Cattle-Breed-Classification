import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, getProfile } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile(token);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async (currentToken) => {
    try {
      const profile = await getProfile(currentToken);
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const data = await loginUser(username, password);
    setToken(data.access_token);
  };

  const register = async (username, email, password) => {
    await registerUser(username, email, password);
    // Auto login after register
    await login(username, password);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
