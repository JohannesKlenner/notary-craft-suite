import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useToast } from '@/components/ui/use-toast';
import { Download } from 'lucide-react';

const ErbpachtzinsRechner = () => {
  const { toast } = useToast();
  const [aktuellerZins, setAktuellerZins] = useState('');
  const [alterIndex, setAlterIndex] = useState('');
  const [neuerIndex, setNeuerIndex] = useState('');
  const [neuerZins, setNeuerZins] = useState<number|null>(null);

  const berechnen = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/tools/erbpachtzins/calculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aktueller_zins: parseFloat(aktuellerZins),
          alter_index: parseFloat(alterIndex),
          neuer_index: parseFloat(neuerIndex)
        })
      });
      if (!res.ok) throw new Error('Berechnung fehlgeschlagen');
      const data = await res.json();
      setNeuerZins(data.neuer_zins);
      toast({ title: 'Berechnung erfolgreich', description: `Neuer Zins: ${data.neuer_zins} €` });
    } catch (e) {
      toast({ title: 'Fehler', description: String(e), variant: 'destructive' });
    }
  };

  const exportieren = async (format: 'pdf' | 'csv') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/export/${format}-erbpachtzins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aktueller_zins: parseFloat(aktuellerZins),
          alter_index: parseFloat(alterIndex),
          neuer_index: parseFloat(neuerIndex),
          neuer_zins: neuerZins
        })
      });
      if (!res.ok) throw new Error('Export fehlgeschlagen');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ErbpachtzinsRechner.${format}`;
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
      <div className="container max-w-2xl mx-auto py-6 px-4 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Erbpachtzins-Rechner</h1>
        <Card className="mb-6 win11-card">
          <CardHeader>
            <CardTitle>Eingabe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="zins">Aktueller Erbpachtzins (€)</Label>
                <Input id="zins" type="number" value={aktuellerZins} onChange={e => setAktuellerZins(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="alterIndex">Alter Indexwert</Label>
                <Input id="alterIndex" type="number" value={alterIndex} onChange={e => setAlterIndex(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="neuerIndex">Neuer Indexwert</Label>
                <Input id="neuerIndex" type="number" value={neuerIndex} onChange={e => setNeuerIndex(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            <Button onClick={berechnen}>Berechnen</Button>
            <Button variant="secondary" onClick={() => exportieren('pdf')}>
              <Download className="mr-2 h-4 w-4" /> PDF Export
            </Button>
            <Button variant="secondary" onClick={() => exportieren('csv')}>
              <Download className="mr-2 h-4 w-4" /> CSV Export
            </Button>
          </CardFooter>
        </Card>
        {neuerZins !== null && (
          <Card className="mb-6 win11-card">
            <CardHeader>
              <CardTitle>Ergebnis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">Neuer Erbpachtzins: <span className="font-bold">{neuerZins} €</span></p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
};

export default ErbpachtzinsRechner;
