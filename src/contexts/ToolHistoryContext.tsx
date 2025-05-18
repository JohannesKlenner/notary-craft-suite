
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [history, setHistory] = useState<ToolHistory[]>(() => {
    const storedHistory = localStorage.getItem('toolHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  });

  useEffect(() => {
    localStorage.setItem('toolHistory', JSON.stringify(history));
  }, [history]);

  const addToolToHistory = (tool: Omit<ToolHistory, 'lastAccessed'>) => {
    setHistory(prev => {
      // Check if tool already exists in history
      const existingIndex = prev.findIndex(item => item.toolId === tool.toolId);
      
      if (existingIndex !== -1) {
        // Update existing entry
        const updatedHistory = [...prev];
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          ...tool,
          lastAccessed: Date.now()
        };
        return updatedHistory;
      } else {
        // Add new entry
        return [...prev, {
          ...tool,
          lastAccessed: Date.now()
        }];
      }
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
