import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface ToolHistory {
  toolId: string;
  toolName: string;
  lastAccessed: number;
  data: Record<string, any>;
}

interface ToolHistoryContextType {
  history: ToolHistory[];
  addToolToHistory: (tool: Omit<ToolHistory, 'lastAccessed'>) => void;
  getToolHistory: (toolId: string) => Record<string, any> | null;
}

const ToolHistoryContext = createContext<ToolHistoryContextType | undefined>(undefined);

export const ToolHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<ToolHistory[]>(() => {
    const storedHistory = localStorage.getItem('toolHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  });

  // Lade History aus Backend, wenn User wechselt
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && currentUser) {
      fetch('http://localhost:8000/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          // Backend liefert JSON-Strings in data-Feld, parsen
          const parsed = data.map((entry: any) => ({
            ...entry,
            data: typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data
          }));
          setHistory(parsed);
        });
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('toolHistory', JSON.stringify(history));
  }, [history]);

  const addToolToHistory = (tool: Omit<ToolHistory, 'lastAccessed'>) => {
    setHistory(prev => {
      const existingIndex = prev.findIndex(item => item.toolId === tool.toolId);
      const newEntry = {
        ...tool,
        lastAccessed: Date.now()
      };
      let updatedHistory;
      if (existingIndex !== -1) {
        updatedHistory = [...prev];
        updatedHistory[existingIndex] = { ...updatedHistory[existingIndex], ...newEntry };
      } else {
        updatedHistory = [...prev, newEntry];
      }
      // Speichere im Backend
      const token = localStorage.getItem('token');
      if (token && currentUser) {
        fetch('http://localhost:8000/history', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            toolId: newEntry.toolId,
            toolName: newEntry.toolName,
            data: JSON.stringify(newEntry.data),
            lastAccessed: newEntry.lastAccessed
          })
        });
      }
      return updatedHistory;
    });
  };

  const getToolHistory = (toolId: string): Record<string, any> | null => {
    const toolEntry = history.find(item => item.toolId === toolId);
    return toolEntry?.data || null;
  };

  return (
    <ToolHistoryContext.Provider value={{ history, addToolToHistory, getToolHistory }}>
      {children}
    </ToolHistoryContext.Provider>
  );
};

export const useToolHistory = () => {
  const context = useContext(ToolHistoryContext);
  if (context === undefined) {
    throw new Error('useToolHistory must be used within a ToolHistoryProvider');
  }
  return context;
};
