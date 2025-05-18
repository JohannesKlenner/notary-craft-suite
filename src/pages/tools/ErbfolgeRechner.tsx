import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useToolHistory } from '@/contexts/ToolHistoryContext';
import { ArrowLeft, Save, Download } from 'lucide-react';

type Beziehung = 'ehepartner' | 'kind' | 'elternteil' | 'geschwister' | 'neffe' | 'großelternteil';

interface Erbe {
  id: string;
  beziehung: Beziehung;
  name: string;
}

const initialErben: Erbe[] = [
  { id: '1', beziehung: 'ehepartner', name: 'Ehepartner' }
];

const ErbfolgeRechner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToolToHistory, getToolHistory } = useToolHistory();
  
  const [erblasserName, setErblasserName] = useState('');
  const [erben, setErben] = useState<Erbe[]>(initialErben);
  const [ergebnisse, setErgebnisse] = useState<Record<string, number>>({});

  // Load saved data if available
  useEffect(() => {
    const savedData = getToolHistory('erbfolge-rechner');
    if (savedData) {
      setErblasserName(savedData.erblasserName || '');
      setErben(savedData.erben || initialErben);
    }
    
    // Save this tool usage in history
    addToolToHistory({
      toolId: 'erbfolge-rechner',
      toolName: 'Erbfolge-Rechner',
      data: {
        erblasserName,
        erben
      }
    });
  }, []);

  const addErbe = () => {
    const newId = (Math.max(0, ...erben.map(e => parseInt(e.id))) + 1).toString();
    setErben([...erben, { id: newId, beziehung: 'kind', name: '' }]);
  };

  const updateErbe = (id: string, field: 'name' | 'beziehung', value: string) => {
    setErben(erben.map(erbe => 
      erbe.id === id ? { ...erbe, [field]: value } : erbe
    ));
  };

  const removeErbe = (id: string) => {
    setErben(erben.filter(erbe => erbe.id !== id));
  };

  const berechnen = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/tools/erbfolge/calculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          erblasser: erblasserName,
          vermoegenswert: 0, // Optional: Vermögenswert, kann später ergänzt werden
          erben
        })
      });
      if (!res.ok) throw new Error('Berechnung fehlgeschlagen');
      const data = await res.json();
      setErgebnisse(data.ergebnisse || {});
      // Save to history
      addToolToHistory({
        toolId: 'erbfolge-rechner',
        toolName: 'Erbfolge-Rechner',
        data: {
          erblasserName,
          erben
        }
      });
      toast({
        title: 'Berechnung abgeschlossen',
        description: 'Die gesetzlichen Erbanteile wurden berechnet.'
      });
    } catch (e) {
      toast({ title: 'Berechnung fehlgeschlagen', description: String(e), variant: 'destructive' });
    }
  };

  const speichern = () => {
    addToolToHistory({
      toolId: 'erbfolge-rechner',
      toolName: 'Erbfolge-Rechner',
      data: {
        erblasserName,
        erben
      }
    });
    
    toast({
      title: "Gespeichert",
      description: "Ihre Eingaben wurden gespeichert."
    });
  };

  // Exportfunktion für PDF und CSV
  const exportieren = async (format: 'pdf' | 'csv') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/export/${format}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          erblasserName,
          erben,
          ergebnisse
        })
      });
      if (!res.ok) throw new Error('Export fehlgeschlagen');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ErbfolgeRechner.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Export erfolgreich', description: `Datei als ${format.toUpperCase()} exportiert.` });
    } catch (e) {
      toast({ title: 'Export fehlgeschlagen', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <AuthGuard>
      <div className="container max-w-4xl mx-auto py-6 px-4 animate-fade-in">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="p-0" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Dashboard
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          Erbfolge-Rechner
        </h1>
        
        <Card className="mb-6 win11-card">
          <CardHeader>
            <CardTitle>Erblasser</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="erblasserName">Name des Erblassers</Label>
                <Input 
                  id="erblasserName"
                  value={erblasserName}
                  onChange={(e) => setErblasserName(e.target.value)}
                  placeholder="Name eingeben"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6 win11-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Erben</CardTitle>
            <Button variant="outline" onClick={addErbe}>
              Erben hinzufügen
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {erben.map((erbe, index) => (
                <div key={erbe.id} className="flex flex-col gap-4 p-4 border rounded-lg bg-background/50">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Erbe {index + 1}</h3>
                    {erben.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeErbe(erbe.id)}
                      >
                        Entfernen
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`name-${erbe.id}`}>Name</Label>
                      <Input 
                        id={`name-${erbe.id}`}
                        value={erbe.name}
                        onChange={(e) => updateErbe(erbe.id, 'name', e.target.value)}
                        placeholder="Name eingeben"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`beziehung-${erbe.id}`}>Beziehung zum Erblasser</Label>
                      <Select 
                        value={erbe.beziehung}
                        onValueChange={(value) => updateErbe(erbe.id, 'beziehung', value)}
                      >
                        <SelectTrigger id={`beziehung-${erbe.id}`}>
                          <SelectValue placeholder="Beziehung auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ehepartner">Ehepartner/in</SelectItem>
                          <SelectItem value="kind">Kind</SelectItem>
                          <SelectItem value="elternteil">Elternteil</SelectItem>
                          <SelectItem value="geschwister">Geschwister</SelectItem>
                          <SelectItem value="neffe">Neffe/Nichte</SelectItem>
                          <SelectItem value="großelternteil">Großelternteil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {Object.keys(ergebnisse).includes(erbe.id) && (
                    <div className="mt-2 p-3 bg-primary/10 rounded-lg">
                      <p className="font-medium">Erbanteil: {ergebnisse[erbe.id].toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={speichern}>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </Button>
              <Button variant="secondary" onClick={() => exportieren('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                PDF Export
              </Button>
              <Button variant="secondary" onClick={() => exportieren('csv')}>
                <Download className="mr-2 h-4 w-4" />
                CSV Export
              </Button>
            </div>
            <Button onClick={berechnen}>Berechnen</Button>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default ErbfolgeRechner;
