
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useToolHistory } from '@/contexts/ToolHistoryContext';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Eigentuemer {
  id: string;
  name: string;
  quoteBruch: {
    zaehler: number;
    nenner: number;
  };
  quoteProzent: number;
  quoteFormatiert: string;
}

const initialEigentuemer: Eigentuemer[] = [
  { 
    id: '1', 
    name: 'Eigentümer 1', 
    quoteBruch: { zaehler: 1, nenner: 2 },
    quoteProzent: 50,
    quoteFormatiert: '1/2'
  },
  { 
    id: '2', 
    name: 'Eigentümer 2', 
    quoteBruch: { zaehler: 1, nenner: 2 },
    quoteProzent: 50,
    quoteFormatiert: '1/2'
  }
];

const formatiereBruch = (zaehler: number, nenner: number): string => {
  if (zaehler === nenner) return '1';
  if (zaehler === 0) return '0';
  
  // Find greatest common divisor to simplify fraction
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const teiler = gcd(zaehler, nenner);
  
  const vereinfachtZaehler = zaehler / teiler;
  const vereinfachtNenner = nenner / teiler;
  
  return `${vereinfachtZaehler}/${vereinfachtNenner}`;
};

const Miteigentumsanteile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToolToHistory, getToolHistory } = useToolHistory();
  
  const [eigentuemer, setEigentuemer] = useState<Eigentuemer[]>(initialEigentuemer);
  const [objektName, setObjektName] = useState('Eigentumsobjekt');
  const [gesamtProzent, setGesamtProzent] = useState(100);
  
  // Load saved data if available
  useEffect(() => {
    const savedData = getToolHistory('miteigentumsanteile');
    if (savedData) {
      setEigentuemer(savedData.eigentuemer || initialEigentuemer);
      setObjektName(savedData.objektName || 'Eigentumsobjekt');
    }
    
    // Save this tool usage in history
    addToolToHistory({
      toolId: 'miteigentumsanteile',
      toolName: 'Miteigentumsanteile',
      data: {
        eigentuemer,
        objektName
      }
    });
  }, []);
  
  // Calculate total percentage whenever eigentuemer changes
  useEffect(() => {
    const sum = eigentuemer.reduce((acc, e) => acc + e.quoteProzent, 0);
    setGesamtProzent(sum);
  }, [eigentuemer]);

  const addEigentuemer = () => {
    const newId = (Math.max(0, ...eigentuemer.map(e => parseInt(e.id))) + 1).toString();
    
    // Calculate new equal distribution
    const anzahl = eigentuemer.length + 1;
    const quoteProzent = 100 / anzahl;
    const nenner = anzahl;
    const zaehler = 1;
    
    const newEigentuemer = {
      id: newId,
      name: `Eigentümer ${anzahl}`,
      quoteBruch: { zaehler, nenner },
      quoteProzent,
      quoteFormatiert: formatiereBruch(zaehler, nenner)
    };
    
    // Update all eigentuemer with new equal shares
    const updatedEigentuemer = [
      ...eigentuemer.map(e => ({
        ...e,
        quoteBruch: { zaehler, nenner },
        quoteProzent,
        quoteFormatiert: formatiereBruch(zaehler, nenner)
      })),
      newEigentuemer
    ];
    
    setEigentuemer(updatedEigentuemer);
  };

  const updateEigentuemer = (id: string, field: keyof Eigentuemer, value: any) => {
    setEigentuemer(eigentuemer.map(e => {
      if (e.id !== id) return e;
      
      if (field === 'quoteProzent') {
        const prozent = parseFloat(value);
        if (isNaN(prozent)) return e;
        
        // Calculate fraction from percentage (approximation)
        const nenner = 1000;
        const zaehler = Math.round((prozent / 100) * nenner);
        
        return {
          ...e,
          quoteProzent: prozent,
          quoteBruch: { zaehler, nenner },
          quoteFormatiert: formatiereBruch(zaehler, nenner)
        };
      }
      
      return { ...e, [field]: value };
    }));
  };

  const updateBruch = (id: string, part: 'zaehler' | 'nenner', value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue <= 0) return;
    
    setEigentuemer(eigentuemer.map(e => {
      if (e.id !== id) return e;
      
      const newQuoteBruch = { 
        ...e.quoteBruch, 
        [part]: numValue 
      };
      
      // Calculate percentage from fraction
      const prozent = (newQuoteBruch.zaehler / newQuoteBruch.nenner) * 100;
      
      return {
        ...e,
        quoteBruch: newQuoteBruch,
        quoteProzent: prozent,
        quoteFormatiert: formatiereBruch(newQuoteBruch.zaehler, newQuoteBruch.nenner)
      };
    }));
  };

  const removeEigentuemer = (id: string) => {
    if (eigentuemer.length <= 1) return;
    
    const updatedEigentuemer = eigentuemer.filter(e => e.id !== id);
    
    // Re-calculate percentages to add up to 100%
    const anzahl = updatedEigentuemer.length;
    const quoteProzent = 100 / anzahl;
    const nenner = anzahl;
    const zaehler = 1;
    
    const redistributedEigentuemer = updatedEigentuemer.map(e => ({
      ...e,
      quoteBruch: { zaehler, nenner },
      quoteProzent,
      quoteFormatiert: formatiereBruch(zaehler, nenner)
    }));
    
    setEigentuemer(redistributedEigentuemer);
  };

  const gleicheAnteile = () => {
    const anzahl = eigentuemer.length;
    const quoteProzent = 100 / anzahl;
    const nenner = anzahl;
    const zaehler = 1;
    
    const updatedEigentuemer = eigentuemer.map(e => ({
      ...e,
      quoteBruch: { zaehler, nenner },
      quoteProzent,
      quoteFormatiert: formatiereBruch(zaehler, nenner)
    }));
    
    setEigentuemer(updatedEigentuemer);
  };

  const speichern = () => {
    addToolToHistory({
      toolId: 'miteigentumsanteile',
      toolName: 'Miteigentumsanteile',
      data: {
        eigentuemer,
        objektName
      }
    });
    
    toast({
      title: "Gespeichert",
      description: "Ihre Eingaben wurden gespeichert."
    });
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
          Miteigentumsanteile
        </h1>
        
        <Card className="mb-6 win11-card">
          <CardHeader>
            <CardTitle>Objekt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="objektName">Bezeichnung des Objekts</Label>
                <Input 
                  id="objektName"
                  value={objektName}
                  onChange={(e) => setObjektName(e.target.value)}
                  placeholder="Name des Objekts eingeben"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6 win11-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Eigentümer und Anteile</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={gleicheAnteile}>
                Gleiche Anteile
              </Button>
              <Button variant="outline" onClick={addEigentuemer}>
                Eigentümer hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="rounded-lg p-4 bg-secondary">
                <h3 className="font-medium mb-2">Gesamtanteil: {gesamtProzent.toFixed(2)}%</h3>
                <Progress value={gesamtProzent} max={100} className="h-2" />
                {gesamtProzent !== 100 && (
                  <p className="text-sm text-destructive mt-2">
                    {gesamtProzent < 100 ? 'Summe ist unter 100%' : 'Summe ist über 100%'}
                  </p>
                )}
              </div>
              
              {eigentuemer.map((e, index) => (
                <div key={e.id} className="flex flex-col gap-4 p-4 border rounded-lg bg-background/50">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Eigentümer {index + 1}</h3>
                    {eigentuemer.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeEigentuemer(e.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`name-${e.id}`}>Name</Label>
                      <Input 
                        id={`name-${e.id}`}
                        value={e.name}
                        onChange={(event) => updateEigentuemer(e.id, 'name', event.target.value)}
                        placeholder="Name eingeben"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`bruch-${e.id}`}>Quote als Bruch</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          id={`zaehler-${e.id}`}
                          value={e.quoteBruch.zaehler}
                          onChange={(event) => updateBruch(e.id, 'zaehler', event.target.value)}
                          className="w-20"
                          type="number"
                          min="1"
                          step="1"
                        />
                        <span className="text-lg">/</span>
                        <Input 
                          id={`nenner-${e.id}`}
                          value={e.quoteBruch.nenner}
                          onChange={(event) => updateBruch(e.id, 'nenner', event.target.value)}
                          className="w-20" 
                          type="number"
                          min="1"
                          step="1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`prozent-${e.id}`}>Quote in Prozent</Label>
                      <div className="relative">
                        <Input 
                          id={`prozent-${e.id}`}
                          value={e.quoteProzent}
                          onChange={(event) => updateEigentuemer(e.id, 'quoteProzent', event.target.value)}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <Progress 
                      value={e.quoteProzent} 
                      max={100}
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={speichern}>
              <Save className="mr-2 h-4 w-4" />
              Speichern
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default Miteigentumsanteile;
