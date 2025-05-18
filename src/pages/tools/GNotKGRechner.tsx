import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useToast } from '@/components/ui/use-toast';

const GNotKGRechner = () => {
  const { toast } = useToast();
  const [geschaeftswert, setGeschaeftswert] = useState('');
  const [vorgangsart, setVorgangsart] = useState('Beurkundung');
  const [gebuehr, setGebuehr] = useState<number|null>(null);

  const berechnen = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/tools/gnotkg/calculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          geschaeftswert: parseFloat(geschaeftswert),
          vorgangsart
        })
      });
      if (!res.ok) throw new Error('Berechnung fehlgeschlagen');
      const data = await res.json();
      setGebuehr(data.gebuehr);
      toast({ title: 'Berechnung erfolgreich', description: `Gebühr: ${data.gebuehr} €` });
    } catch (e) {
      toast({ title: 'Fehler', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <AuthGuard>
      <div className="container max-w-2xl mx-auto py-6 px-4 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 text-foreground">GNotKG-Rechner</h1>
        <Card className="mb-6 win11-card">
          <CardHeader>
            <CardTitle>Eingabe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="geschaeftswert">Geschäftswert (€)</Label>
                <Input id="geschaeftswert" type="number" value={geschaeftswert} onChange={e => setGeschaeftswert(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="vorgangsart">Vorgangsart</Label>
                <select id="vorgangsart" value={vorgangsart} onChange={e => setVorgangsart(e.target.value)}>
                  <option value="Beurkundung">Beurkundung</option>
                  <option value="Beglaubigung">Beglaubigung</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={berechnen}>Berechnen</Button>
          </CardFooter>
        </Card>
        {gebuehr !== null && (
          <Card className="mb-6 win11-card">
            <CardHeader>
              <CardTitle>Ergebnis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">Gebühr: <span className="font-bold">{gebuehr} €</span></p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
};

export default GNotKGRechner;
