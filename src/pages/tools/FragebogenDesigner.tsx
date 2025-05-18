import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useToast } from '@/components/ui/use-toast';

const leereFrage = () => ({
  frage: '',
  typ: 'text',
  validierung: '',
  antworten: []
});

const FragebogenDesigner = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [fragen, setFragen] = useState([leereFrage()]);
  const [savedId, setSavedId] = useState<string|null>(null);

  const addFrage = () => setFragen([...fragen, leereFrage()]);
  const updateFrage = (idx: number, field: string, value: any) => {
    setFragen(fragen.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };
  const removeFrage = (idx: number) => setFragen(fragen.filter((_, i) => i !== idx));

  const speichern = async () => {
    try {
      const res = await fetch('http://localhost:8000/tools/fragebogen/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, struktur: { fragen } })
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      const data = await res.json();
      setSavedId(data.id);
      toast({ title: 'Gespeichert', description: 'Fragebogen gespeichert.' });
    } catch (e) {
      toast({ title: 'Fehler', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <AuthGuard>
      <div className="container max-w-3xl mx-auto py-6 px-4 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Fragebogen-Designer</h1>
        <Card className="mb-6 win11-card">
          <CardHeader>
            <CardTitle>Fragebogen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="name">Name des Fragebogens</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Mandantenaufnahme" />
            </div>
          </CardContent>
        </Card>
        <Card className="mb-6 win11-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fragen</CardTitle>
            <Button variant="outline" onClick={addFrage}>Frage hinzufügen</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fragen.map((frage, idx) => (
                <div key={idx} className="p-4 border rounded-lg bg-background/50 flex flex-col gap-2">
                  <Input value={frage.frage} onChange={e => updateFrage(idx, 'frage', e.target.value)} placeholder="Fragetext" />
                  <select value={frage.typ} onChange={e => updateFrage(idx, 'typ', e.target.value)}>
                    <option value="text">Text</option>
                    <option value="zahl">Zahl</option>
                    <option value="auswahl">Auswahl</option>
                  </select>
                  {frage.typ === 'auswahl' && (
                    <Input value={frage.antworten.join(',')} onChange={e => updateFrage(idx, 'antworten', e.target.value.split(','))} placeholder="Antwortoptionen, Komma getrennt" />
                  )}
                  <Input value={frage.validierung} onChange={e => updateFrage(idx, 'validierung', e.target.value)} placeholder="Validierungsregel (optional)" />
                  <Button variant="ghost" onClick={() => removeFrage(idx)}>Entfernen</Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={speichern}>Fragebogen speichern</Button>
          </CardFooter>
        </Card>
        {savedId && (
          <Card className="mb-6 win11-card">
            <CardHeader>
              <CardTitle>Gespeichert</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Fragebogen-ID: <span className="font-mono">{savedId}</span></p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
};

export default FragebogenDesigner;
