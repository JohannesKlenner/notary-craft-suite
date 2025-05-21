import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  switchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user data
const demoUsers = [
  {
    id: "admin-id",
    username: "admin",
    password: "admin123",
    role: "admin" as UserRole,
    firstName: "Admin",
    lastName: "User"
  },
  {
    id: "notar-id",
    username: "notar",
    password: "notar123",
    role: "user" as UserRole,
    firstName: "Notary",
    lastName: "User"
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Prüfe beim Laden, ob ein Token existiert und hole ggf. Userdaten
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');
    
    if (token && savedUser) {
      try {
        // First try to load from Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            // If we have a Supabase session, use that
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
            setIsLoggedIn(true);
          } else {
            // Otherwise, try to load from localStorage
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
            setIsLoggedIn(true);
          }
        }).catch(() => {
          // If Supabase fails, fall back to localStorage
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsLoggedIn(true);
        });
      } catch (e) {
        // If parsing fails, clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // First try with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@example.com`, // Using username as email for demo
        password: password
      });
      
      if (!error && data.user) {
        // Supabase login successful
        const userRole = username === 'admin' ? 'admin' : 'user';
        const user: User = {
          id: data.user.id,
          username: username,
          password: password, // In real app, don't store this
          role: userRole as UserRole,
          firstName: username === 'admin' ? 'Admin' : 'Notary',
          lastName: 'User'
        };
        
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        toast({ title: 'Erfolgreich angemeldet', description: `Willkommen zurück, ${user.firstName}!` });
        return true;
      }
      
      // If Supabase fails, try with demo users (fallback)
      const user = demoUsers.find(user => user.username === username && user.password === password);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('currentUser', JSON.stringify(user));
        toast({ title: 'Erfolgreich angemeldet (Demo)', description: `Willkommen zurück, ${user.firstName}!` });
        return true;
      }
      
      toast({ title: 'Anmeldung fehlgeschlagen', description: 'Benutzername oder Passwort ist falsch', variant: 'destructive' });
      return false;
    } catch (e) {
      // Fallback to demo mode
      const user = demoUsers.find(user => user.username === username && user.password === password);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('currentUser', JSON.stringify(user));
        toast({ title: 'Erfolgreich angemeldet (Demo)', description: `Willkommen zurück, ${user.firstName}!` });
        return true;
      }
      
      toast({ title: 'Fehler', description: 'Server nicht erreichbar, Demo-Login fehlgeschlagen', variant: 'destructive' });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    supabase.auth.signOut().catch(() => {}); // Ignore errors if Supabase is not available
    toast({ title: 'Abgemeldet', description: 'Sie wurden erfolgreich abgemeldet' });
  };
  
  const switchUser = () => {
    logout();
    toast({ title: 'Benutzerwechsel', description: 'Bitte melden Sie sich neu an' });
    // Navigate to login happens in the Navbar component
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, login, logout, switchUser }}>
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
