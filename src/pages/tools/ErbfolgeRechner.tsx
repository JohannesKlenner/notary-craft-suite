
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
import { ArrowLeft, Plus, Save, Download, Users, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FamilyTree } from '@/components/tools/erbfolge/FamilyTree';
import { PersonDialog } from '@/components/tools/erbfolge/PersonDialog';
import { GedcomImporter } from '@/components/tools/erbfolge/GedcomImporter';

type Beziehung = 'ehepartner' | 'kind' | 'elternteil' | 'geschwister' | 'neffe' | 'großelternteil';

interface Person {
  id: string;
  beziehung: Beziehung;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  sterbedatum?: string;
  parentId?: string;  // Für Baumdarstellung
}

interface TreeData {
  name: string;
  attributes?: { [key: string]: string };
  children?: TreeData[];
}

const ErbfolgeRechner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToolToHistory, getToolHistory } = useToolHistory();
  
  const [erblasserName, setErblasserName] = useState('');
  const [personen, setPersonen] = useState<Person[]>([]);
  const [ergebnisse, setErgebnisse] = useState<Record<string, number>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState("eingabe");
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [demoModeActive, setDemoModeActive] = useState(false);

  // Load saved data if available
  useEffect(() => {
    const savedData = getToolHistory('erbfolge-rechner');
    if (savedData) {
      setErblasserName(savedData.erblasserName || '');
      setPersonen(savedData.personen || []);
    }
    
    // Save this tool usage in history
    addToolToHistory({
      toolId: 'erbfolge-rechner',
      toolName: 'Erbfolge-Rechner',
      data: {
        erblasserName,
        personen
      }
    });
    
    // Check if backend is available
    checkBackendAvailability();
  }, []);

  // Check if backend is available
  const checkBackendAvailability = async () => {
    try {
      const res = await fetch('http://localhost:8000/tools/erbfolge/health-check', { timeout: 2000 });
      if (!res.ok) {
        activateDemoMode();
      }
    } catch (e) {
      // If backend is not available, activate demo mode
      activateDemoMode();
    }
  };

  // Activate demo mode
  const activateDemoMode = () => {
    setDemoModeActive(true);
    toast({
      title: 'Backend nicht verbunden',
      description: 'Demo-Modus ist aktiv. Alle Funktionen sind verfügbar.',
    });
  };

  const addPerson = () => {
    setCurrentPerson({
      id: String(Date.now()),
      beziehung: 'kind',
      vorname: '',
      nachname: '',
      geburtsdatum: '',
      sterbedatum: ''
    });
    setIsDialogOpen(true);
  };

  const editPerson = (person: Person) => {
    setCurrentPerson(person);
    setIsDialogOpen(true);
  };

  const savePerson = (person: Person) => {
    if (personen.find(p => p.id === person.id)) {
      setPersonen(personen.map(p => p.id === person.id ? person : p));
    } else {
      setPersonen([...personen, person]);
    }
    setIsDialogOpen(false);
    setCurrentPerson(null);
  };

  const removePerson = (id: string) => {
    setPersonen(personen.filter(p => p.id !== id));
  };

  const berechnen = async () => {
    try {
      if (demoModeActive) {
        // Demo mode calculation (local)
        const ergebnisse = calculateInheritanceDemo(personen);
        setErgebnisse(ergebnisse);
        updateTreeData(personen, ergebnisse);
        setActiveTab("ergebnisse");
        toast({
          title: 'Berechnung abgeschlossen',
          description: 'Die gesetzlichen Erbanteile wurden im Demo-Modus berechnet.'
        });
        return;
      }

      // Real backend calculation
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/tools/erbfolge/calculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          erblasser: erblasserName,
          vermoegenswert: 0,
          erben: personen
        })
      });
      if (!res.ok) throw new Error('Berechnung fehlgeschlagen');
      const data = await res.json();
      setErgebnisse(data.ergebnisse || {});
      updateTreeData(personen, data.ergebnisse);
      setActiveTab("ergebnisse");
      
      // Save to history
      addToolToHistory({
        toolId: 'erbfolge-rechner',
        toolName: 'Erbfolge-Rechner',
        data: {
          erblasserName,
          personen
        }
      });
      
      toast({
        title: 'Berechnung abgeschlossen',
        description: 'Die gesetzlichen Erbanteile wurden berechnet.'
      });
    } catch (e) {
      // If backend call fails, try demo mode as fallback
      if (!demoModeActive) {
        activateDemoMode();
        berechnen(); // Retry with demo mode
      } else {
        toast({ 
          title: 'Berechnung fehlgeschlagen', 
          description: String(e), 
          variant: 'destructive' 
        });
      }
    }
  };

  // Demo mode calculation logic
  const calculateInheritanceDemo = (personen: Person[]): Record<string, number> => {
    const result: Record<string, number> = {};
    const heute = new Date();
    const ehepartner = personen.filter(p => p.beziehung === 'ehepartner' && isAlive(p, heute));
    const kinder = personen.filter(p => p.beziehung === 'kind' && isAlive(p, heute));
    
    if (ehepartner.length > 0 && kinder.length > 0) {
      // Ehepartner und Kinder
      const ehepartnerQuote = 50; // 50%
      const kinderQuote = 50 / kinder.length; // Rest gleichmäßig auf Kinder verteilen
      
      ehepartner.forEach(p => {
        result[p.id] = ehepartnerQuote / ehepartner.length;
      });
      
      kinder.forEach(p => {
        result[p.id] = kinderQuote;
      });
    } else if (ehepartner.length > 0 && kinder.length === 0) {
      // Nur Ehepartner
      ehepartner.forEach(p => {
        result[p.id] = 100 / ehepartner.length;
      });
    } else if (kinder.length > 0 && ehepartner.length === 0) {
      // Nur Kinder
      const kinderQuote = 100 / kinder.length;
      kinder.forEach(p => {
        result[p.id] = kinderQuote;
      });
    } else {
      // Sonstige Verwandte (stark vereinfacht)
      const lebendeVerwandte = personen.filter(p => isAlive(p, heute));
      if (lebendeVerwandte.length > 0) {
        const quote = 100 / lebendeVerwandte.length;
        lebendeVerwandte.forEach(p => {
          result[p.id] = quote;
        });
      }
    }
    
    return result;
  };
  
  // Helper to check if a person is alive at given date
  const isAlive = (person: Person, date: Date): boolean => {
    if (!person.sterbedatum) return true;
    const sterbedatum = new Date(person.sterbedatum);
    return sterbedatum > date;
  };

  const updateTreeData = (personen: Person[], ergebnisse: Record<string, number>) => {
    // Einfache Baumstruktur-Generierung für die Visualisierung
    const root: TreeData = {
      name: erblasserName || "Erblasser",
      attributes: {
        role: "erblasser"
      },
      children: []
    };
    
    // Ehepartner direkt unter dem Erblasser
    const ehepartner = personen.filter(p => p.beziehung === 'ehepartner');
    const kinder = personen.filter(p => p.beziehung === 'kind');
    
    // Füge Ehepartner hinzu
    ehepartner.forEach(p => {
      root.children = root.children || [];
      root.children.push({
        name: `${p.vorname} ${p.nachname}`,
        attributes: {
          beziehung: p.beziehung,
          geburt: p.geburtsdatum,
          tod: p.sterbedatum,
          erbanteil: ergebnisse[p.id] ? `${ergebnisse[p.id].toFixed(2)}%` : '0%'
        }
      });
    });
    
    // Füge Kinder hinzu
    kinder.forEach(p => {
      root.children = root.children || [];
      root.children.push({
        name: `${p.vorname} ${p.nachname}`,
        attributes: {
          beziehung: p.beziehung,
          geburt: p.geburtsdatum,
          tod: p.sterbedatum,
          erbanteil: ergebnisse[p.id] ? `${ergebnisse[p.id].toFixed(2)}%` : '0%'
        }
      });
    });
    
    // Andere Verwandte
    const andere = personen.filter(p => p.beziehung !== 'ehepartner' && p.beziehung !== 'kind');
    andere.forEach(p => {
      root.children = root.children || [];
      root.children.push({
        name: `${p.vorname} ${p.nachname}`,
        attributes: {
          beziehung: p.beziehung,
          geburt: p.geburtsdatum,
          tod: p.sterbedatum,
          erbanteil: ergebnisse[p.id] ? `${ergebnisse[p.id].toFixed(2)}%` : '0%'
        }
      });
    });
    
    setTreeData(root);
  };

  const speichern = () => {
    addToolToHistory({
      toolId: 'erbfolge-rechner',
      toolName: 'Erbfolge-Rechner',
      data: {
        erblasserName,
        personen
      }
    });
    
    toast({
      title: "Gespeichert",
      description: "Ihre Eingaben wurden gespeichert."
    });
  };

  // Export function
  const exportieren = async (format: 'pdf' | 'csv' | 'gedcom') => {
    try {
      if (demoModeActive && format === 'gedcom') {
        // Local GEDCOM export for demo mode
        const gedcom = generateGedcom(personen, erblasserName);
        downloadFile(gedcom, 'erbfolge-export.ged', 'text/plain');
        toast({ 
          title: 'Export erfolgreich', 
          description: `GEDCOM-Datei exportiert.` 
        });
        return;
      }
      
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/export/${format}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          erblasserName,
          personen,
          ergebnisse
        })
      });
      if (!res.ok) throw new Error('Export fehlgeschlagen');
      const blob = await res.blob();
      
      // Create download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ErbfolgeRechner.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({ 
        title: 'Export erfolgreich', 
        description: `Datei als ${format.toUpperCase()} exportiert.` 
      });
    } catch (e) {
      if (format === 'gedcom' && !demoModeActive) {
        // Fallback to local GEDCOM export
        const gedcom = generateGedcom(personen, erblasserName);
        downloadFile(gedcom, 'erbfolge-export.ged', 'text/plain');
        toast({ 
          title: 'Export erfolgreich', 
          description: `GEDCOM-Datei lokal exportiert.` 
        });
      } else {
        toast({ 
          title: 'Export fehlgeschlagen', 
          description: String(e), 
          variant: 'destructive' 
        });
      }
    }
  };

  // Helper to generate GEDCOM format
  const generateGedcom = (personen: Person[], erblasserName: string): string => {
    let gedcom = "0 HEAD\n1 SOUR Notary Tools\n1 GEDC\n2 VERS 5.5.5\n1 CHAR UTF-8\n";
    gedcom += "0 @I0@ INDI\n1 NAME " + erblasserName + "\n";
    
    personen.forEach((person, index) => {
      const id = index + 1;
      gedcom += `0 @I${id}@ INDI\n`;
      gedcom += `1 NAME ${person.vorname} /${person.nachname}/\n`;
      if (person.geburtsdatum) gedcom += `1 BIRT\n2 DATE ${person.geburtsdatum}\n`;
      if (person.sterbedatum) gedcom += `1 DEAT\n2 DATE ${person.sterbedatum}\n`;
      
      // Add relationship to erblasser
      if (person.beziehung === 'ehepartner') {
        gedcom += `1 FAMS @F1@\n`;
      } else if (person.beziehung === 'kind') {
        gedcom += `1 FAMC @F1@\n`;
      }
    });
    
    // Add family
    gedcom += "0 @F1@ FAM\n";
    gedcom += "1 HUSB @I0@\n"; // Erblasser
    
    // Add spouse if exists
    const ehepartner = personen.findIndex(p => p.beziehung === 'ehepartner');
    if (ehepartner !== -1) gedcom += `1 WIFE @I${ehepartner + 1}@\n`;
    
    // Add children
    personen.forEach((person, index) => {
      if (person.beziehung === 'kind') {
        gedcom += `1 CHIL @I${index + 1}@\n`;
      }
    });
    
    gedcom += "0 TRLR";
    return gedcom;
  };

  // Helper to download a file
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Import GEDCOM function
  const handleGedcomImport = (data: { personen: Person[], erblasserName: string }) => {
    setPersonen(data.personen);
    setErblasserName(data.erblasserName);
    toast({
      title: 'GEDCOM importiert',
      description: `${data.personen.length} Personen wurden aus der GEDCOM-Datei importiert.`
    });
  };

  return (
    <AuthGuard>
      <div className="container max-w-7xl mx-auto py-6 px-4 animate-fade-in">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="p-0" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Dashboard
          </Button>
        </div>
        
        {demoModeActive && (
          <div className="mb-6 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md text-amber-800 dark:text-amber-200">
            <p className="text-sm font-medium">Backend nicht verbunden – Demo-Modus aktiv</p>
            <p className="text-xs">Alle Funktionen sind verfügbar, Berechnungen erfolgen lokal.</p>
          </div>
        )}
        
        <h1 className="text-3xl font-bold mb-4 text-foreground">
          Erbfolge-Rechner
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex">
            <TabsTrigger value="eingabe">Eingabe</TabsTrigger>
            <TabsTrigger value="ergebnisse">Ergebnisse</TabsTrigger>
          </TabsList>

          {/* Eingabe Tab */}
          <TabsContent value="eingabe" className="space-y-6">
            <Card>
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
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Verwandte und Erben</CardTitle>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => {}}>
                        <Upload className="mr-2 h-4 w-4" />
                        GEDCOM Import
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>GEDCOM-Datei importieren</DialogTitle>
                      <DialogDescription>
                        Wählen Sie eine GEDCOM-Datei zum Import aus.
                      </DialogDescription>
                      <GedcomImporter onImport={handleGedcomImport} />
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" onClick={addPerson}>
                    <Plus className="mr-2 h-4 w-4" />
                    Person hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {personen.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Keine Personen vorhanden. Fügen Sie Verwandte oder Erben hinzu.</p>
                    </div>
                  ) : (
                    personen.map((person, index) => (
                      <div 
                        key={person.id} 
                        className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-accent/30 cursor-pointer transition-colors"
                        onClick={() => editPerson(person)}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{person.vorname} {person.nachname}</h3>
                          <div className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {person.beziehung}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row text-sm gap-2 text-muted-foreground">
                          <div>Geburtsdatum: {person.geburtsdatum || "Unbekannt"}</div>
                          {person.sterbedatum && (
                            <div>Todesdatum: {person.sterbedatum}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={speichern}>
                  <Save className="mr-2 h-4 w-4" />
                  Speichern
                </Button>
                <Button onClick={berechnen}>Berechnen</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Ergebnisse Tab */}
          <TabsContent value="ergebnisse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Berechnete Erbanteile</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(ergebnisse).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Noch keine Berechnung durchgeführt.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Erbanteile nach gesetzlicher Erbfolge</h3>
                    <div className="divide-y">
                      {Object.entries(ergebnisse).map(([personId, anteil]) => {
                        const person = personen.find(p => p.id === personId);
                        if (!person) return null;
                        
                        return (
                          <div key={personId} className="py-3 flex justify-between items-center">
                            <span>
                              {person.vorname} {person.nachname} 
                              <span className="ml-2 text-sm text-muted-foreground">({person.beziehung})</span>
                            </span>
                            <span className="font-medium">{anteil.toFixed(2)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex flex-row justify-between items-center">
                  <CardTitle>Stammbaum-Visualisierung</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" 
                      size="icon"
                      onClick={() => setZoomLevel(Math.min(zoomLevel + 0.1, 2))}
                      title="Vergrößern"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" 
                      size="icon"
                      onClick={() => setZoomLevel(Math.max(zoomLevel - 0.1, 0.5))}
                      title="Verkleinern"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-h-[400px]">
                {treeData ? (
                  <div className="w-full h-[500px] overflow-auto">
                    <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: '50% 0' }} className="transition-transform">
                      <FamilyTree data={treeData} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <p>Keine Daten für Visualisierung verfügbar.</p>
                    <p className="text-sm mt-2">Führen Sie zuerst eine Berechnung durch.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => exportieren('pdf')}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF Export
                </Button>
                <Button variant="secondary" onClick={() => exportieren('csv')}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV Export
                </Button>
                <Button variant="secondary" onClick={() => exportieren('gedcom')}>
                  <Download className="mr-2 h-4 w-4" />
                  GEDCOM Export
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Person Dialog */}
      <PersonDialog 
        isOpen={isDialogOpen}
        person={currentPerson}
        onClose={() => {
          setIsDialogOpen(false);
          setCurrentPerson(null);
        }}
        onSave={savePerson}
        onDelete={currentPerson ? removePerson : undefined}
      />
    </AuthGuard>
  );
};

export default ErbfolgeRechner;
