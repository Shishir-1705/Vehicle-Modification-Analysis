"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  role: string;
  total_scans: number;
  reports_generated: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (fullName: string, email: string, password: string) => Promise<boolean>;

  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Single authenticated user profile fetch
  const fetchCurrentUser = async (authToken?: string): Promise<UserProfile | null> => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await api.get<UserProfile>('/auth/me', { headers });
      const fetchedUser = res.data;
      setUser(fetchedUser);
      localStorage.setItem('modai_user', JSON.stringify(fetchedUser));
      return fetchedUser;
    } catch (err: any) {
      console.error("fetchCurrentUser failed:", err?.response?.data || err.message);
      logout();
      return null;
    }
  };

  // Startup Token Validation & Hydration
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('modai_token');
      const savedUser = localStorage.getItem('modai_user');

      if (savedToken && savedToken !== 'demo_token') {
        setToken(savedToken);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            await fetchCurrentUser(savedToken);
          }
        } else {
          await fetchCurrentUser(savedToken);
        }
      } else {
        localStorage.removeItem('modai_token');
        localStorage.removeItem('modai_user');
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Single Login Implementation
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      
      // POST /auth/login
      const res = await api.post<{ access_token: string; token_type: string }>('/auth/login', {
        email: cleanEmail,
        password,
      });

      const accessToken = res.data.access_token;
      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem('modai_token', accessToken);

        // GET /auth/me
        const fetchedUser = await fetchCurrentUser(accessToken);
        return !!fetchedUser;
      }
      return false;
    } catch (err: any) {
      console.error("Login attempt failed:", err?.response?.data || err.message);
      return false;
    }
  };

  // Single Signup Implementation
  const signup = async (fullName: string, email: string, password: string): Promise<boolean> => {

    try {
      const cleanEmail = email.trim().toLowerCase();
      await api.post('/auth/register', {
        full_name: fullName.trim(),
        email: cleanEmail,
        password,
      });
      return true;
    } catch (err: any) {
      console.error("Signup failed:", err?.response?.data || err.message);
      return false;
    }
  };

  // Single Logout Implementation
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('modai_token');
    localStorage.removeItem('modai_user');
  };

  // Single RefreshUser Implementation
  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
