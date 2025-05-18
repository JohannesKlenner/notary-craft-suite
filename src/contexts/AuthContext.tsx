
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

// Initial users for demonstration
const initialUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // Would be hashed in production
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  },
  {
    id: '2',
    username: 'notar',
    password: 'notar123', // Would be hashed in production
    role: 'user',
    firstName: 'Max',
    lastName: 'Mustermann'
  }
];

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  switchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with values from localStorage if they exist
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : initialUsers;
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('isLoggedIn', isLoggedIn ? 'true' : 'false');
  }, [currentUser, isLoggedIn]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      toast({
        title: "Erfolgreich angemeldet",
        description: `Willkommen zurück, ${user.firstName} ${user.lastName}!`,
      });
      return true;
    }
    
    toast({
      title: "Anmeldung fehlgeschlagen",
      description: "Benutzername oder Passwort ist falsch",
      variant: "destructive"
    });
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    toast({
      title: "Abgemeldet",
      description: "Sie wurden erfolgreich abgemeldet",
    });
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = {
      ...user,
      id: Date.now().toString(), // Simple ID generation
    };
    setUsers([...users, newUser as User]);
  };

  const switchUser = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      isLoggedIn,
      login,
      logout,
      addUser,
      switchUser
    }}>
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
