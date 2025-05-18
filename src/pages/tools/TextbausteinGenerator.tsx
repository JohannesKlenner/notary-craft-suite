import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useToast } from '@/components/ui/use-toast';

interface Textbaustein {
  id: string;
  kategorie: string;
  titel: string;
  text: string;
}

const TextbausteinGenerator = () => {
  const { toast } = useToast();
  const [bausteine, setBausteine] = useState<Textbaustein[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [platzhalter, setPlatzhalter] = useState<{ [key: string]: string }>({ datum: '' });
  const [generierterText, setGenerierterText] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/tools/textbaustein/list')
      .then(res => res.json())
      .then(setBausteine);
  }, []);

  const handleGenerate = async () => {
    try {
      const res = await fetch('http://localhost:8000/tools/textbaustein/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baustein_ids: selectedIds, platzhalter })
      });
      if (!res.ok) throw new Error('Generierung fehlgeschlagen');
      const data = await res.json();
      setGenerierterText(data.text);
      toast({ title: 'Text generiert', description: 'Der Text wurde erfolgreich generiert.' });
    } catch (e) {
      toast({ title: 'Fehler', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <AuthGuard>
      <div className="container max-w-3xl mx-auto py-6 px-4 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Textbaustein-Generator</h1>
        <Card className="mb-6 win11-card">
          <CardHeader>
            <CardTitle>Textbausteine auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bausteine.map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedIds.includes(b.id)} onChange={e => {
                    setSelectedIds(ids => e.target.checked ? [...ids, b.id] : ids.filter(id => id !== b.id));
                  }} />
                  <span className="font-medium">{b.titel}</span>
                  <span className="text-xs text-muted-foreground">({b.kategorie})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="mb-6 win11-card">
          <CardHeader>
            <CardTitle>Platzhalter füllen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="datum">Datum</Label>
              <Input id="datum" value={platzhalter.datum || ''} onChange={e => setPlatzhalter({ ...platzhalter, datum: e.target.value })} placeholder="z.B. 18.05.2025" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerate}>Text generieren</Button>
          </CardFooter>
        </Card>
        {generierterText && (
          <Card className="mb-6 win11-card">
            <CardHeader>
              <CardTitle>Generierter Text</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap bg-background/50 p-4 rounded-lg">{generierterText}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
};

export default TextbausteinGenerator;
