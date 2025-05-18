
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Calculator, Users, Clock, History } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useToolHistory } from '@/contexts/ToolHistoryContext';
import { Separator } from '@/components/ui/separator';

// Define tools data structure
interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

const tools: Tool[] = [
  {
    id: 'erbfolge-rechner',
    name: 'Erbfolge-Rechner',
    description: 'Berechnung gesetzlicher Erbanteile',
    path: '/tools/erbfolge-rechner',
    icon: <Users size={24} />
  },
  {
    id: 'miteigentumsanteile',
    name: 'Miteigentumsanteile',
    description: 'Aufteilung nach Eigentumsquoten',
    path: '/tools/miteigentumsanteile',
    icon: <Calculator size={24} />
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { history } = useToolHistory();
  
  // Filter tools based on search term
  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get recent tools (up to 3)
  const recentTools = [...history]
    .sort((a, b) => b.lastAccessed - a.lastAccessed)
    .slice(0, 3)
    .map(historyItem => {
      const tool = tools.find(t => t.id === historyItem.toolId);
      return tool;
    })
    .filter(Boolean) as Tool[];

  const handleToolClick = (tool: Tool) => {
    navigate(tool.path);
  };

  return (
    <AuthGuard>
      <div className="container max-w-7xl mx-auto py-6 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          Dashboard
        </h1>
        
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="search"
            placeholder="Tool suchen..."
            className="pl-10 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Recent Tools */}
        {recentTools.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-primary" />
              <h2 className="text-xl font-semibold">Zuletzt verwendet</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentTools.map(tool => (
                <Card
                  key={tool.id}
                  className="tool-card"
                  onClick={() => handleToolClick(tool)}
                >
                  <CardHeader className="pb-2">
                    <div className="tool-icon mb-2 inline-flex">
                      {tool.icon}
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Separator className="my-8" />
          </div>
        )}

        {/* All Tools */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Alle Tools</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTools.map(tool => (
              <Card
                key={tool.id}
                className="tool-card"
                onClick={() => handleToolClick(tool)}
              >
                <CardHeader className="pb-2">
                  <div className="tool-icon mb-2 inline-flex">
                    {tool.icon}
                  </div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* No results */}
        {searchTerm && filteredTools.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Keine Tools gefunden für "{searchTerm}"</p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
