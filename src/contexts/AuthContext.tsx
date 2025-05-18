import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

// Define User types
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Prüfe beim Laden, ob ein Token existiert und hole ggf. Userdaten
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:8000/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          if (user) {
            setCurrentUser(user);
            setIsLoggedIn(true);
          } else {
            setCurrentUser(null);
            setIsLoggedIn(false);
            localStorage.removeItem('token');
          }
        });
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
      });
      if (!res.ok) {
        toast({ title: 'Anmeldung fehlgeschlagen', description: 'Benutzername oder Passwort ist falsch', variant: 'destructive' });
        return false;
      }
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      // Hole Userdaten
      const userRes = await fetch('http://localhost:8000/users/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      if (!userRes.ok) {
        toast({ title: 'Anmeldung fehlgeschlagen', description: 'Benutzer nicht gefunden', variant: 'destructive' });
        return false;
      }
      const user = await userRes.json();
      setCurrentUser(user);
      setIsLoggedIn(true);
      toast({ title: 'Erfolgreich angemeldet', description: `Willkommen zurück, ${user.firstName || user.username}!` });
      return true;
    } catch (e) {
      toast({ title: 'Fehler', description: 'Server nicht erreichbar', variant: 'destructive' });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    toast({ title: 'Abgemeldet', description: 'Sie wurden erfolgreich abgemeldet' });
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
