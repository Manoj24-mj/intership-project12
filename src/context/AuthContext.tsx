import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (form: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    location: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  quickLoginAs: (roleOrName: 'priya' | 'rahul' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.auth.me();
      setUser(res.user);
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setUser(res.user);
  };

  const register = async (form: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    location: string;
  }) => {
    const res = await api.auth.register(form);
    setUser(res.user);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const quickLoginAs = async (key: 'priya' | 'rahul' | 'admin') => {
    let email = 'priya@artloop.in';
    let password = 'artloop123';

    if (key === 'rahul') {
      email = 'rahul@artloop.in';
      password = 'artloop123';
    } else if (key === 'admin') {
      email = 'admin@artloop.in';
      password = 'admin123';
    }

    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
