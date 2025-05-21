import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, ArrowLeft, Save } from 'lucide-react';

export type Beziehung = 'ehepartner' | 'kind' | 'elternteil' | 'geschwister' | 'neffe' | 'großelternteil' | 'urgroßelternteil' | 'enkel';

export interface Person {
  id: string;
  beziehung: Beziehung;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  sterbedatum?: string;
  parentId?: string;
  generation?: number;
  stammId?: string;
}

type InterviewStep =
  | 'erblasser'
  | 'ehepartner'
  | 'gueterstand'
  | 'kinder'
  | 'kindDetails'
  | 'kindKinder'
  | 'enkelDetails'
  | 'eltern'
  | 'elternDetails'
  | 'elternGeschwister'
  | 'großeltern'
  | 'großelternKinder'
  | 'entfernteVerwandte'
  | 'abschluss';

interface InterviewKontext {
  aktuelleGeneration: number;
  aktuellerStamm: string | null;
  aktuellesKind: Person | null;
  aktuellerElternteil: Person | null;
  aktuellerGroßelternteil: Person | null;
  fertigeStaemme: string[];
}

interface ErbfolgeInterviewProps {
  onComplete: (erblasserName: string, personen: Person[]) => void;
  initialData?: {
    erblasserName: string;
    personen: Person[];
  };
}

export const ErbfolgeInterview: React.FC<ErbfolgeInterviewProps> = ({ 
  onComplete,
  initialData
}) => {
  const { toast } = useToast();
  
  const [erblasserName, setErblasserName] = useState(initialData?.erblasserName || '');
  const [personen, setPersonen] = useState<Person[]>(initialData?.personen || []);
  const [currentStep, setCurrentStep] = useState<InterviewStep>('erblasser');
  
  // Formularfelder
  const [formVorname, setFormVorname] = useState('');
  const [formNachname, setFormNachname] = useState('');
  const [formGeburtsdatum, setFormGeburtsdatum] = useState('');
  const [formSterbedatum, setFormSterbedatum] = useState('');
  const [formGueterstand, setFormGueterstand] = useState<'zugewinngemeinschaft' | 'guetergemeinschaft' | 'guetertrennung'>('zugewinngemeinschaft');
  const [formAntwort, setFormAntwort] = useState<'ja' | 'nein'>('nein');
  
  // Interview-Kontext
  const [kontext, setKontext] = useState<InterviewKontext>({
    aktuelleGeneration: 1,
    aktuellerStamm: null,
    aktuellesKind: null,
    aktuellerElternteil: null,
    aktuellerGroßelternteil: null,
    fertigeStaemme: []
  });
  
  // Historie für Zurück-Button
  const [historie, setHistorie] = useState<{step: InterviewStep, kontext: InterviewKontext}[]>([]);
  
  // Hilfsvariablen
  const hatEhepartner = personen.some(p => p.beziehung === 'ehepartner');
  const hatLebendeKinder = personen.some(p => p.beziehung === 'kind' && !istVerstorben(p));
  const hatLebendeEnkel = personen.some(p => p.beziehung === 'enkel' && !istVerstorben(p));
  const hatLebendeEltern = personen.some(p => p.beziehung === 'elternteil' && !istVerstorben(p));
  const hatLebendeGroßeltern = personen.some(p => p.beziehung === 'großelternteil' && !istVerstorben(p));
  
  // Hilfsfunktion zur Bestimmung, ob eine Person verstorben ist
  const istVerstorben = (person: Person): boolean => {
    return !!person.sterbedatum && new Date(person.sterbedatum) <= new Date();
  };
  
  // Speichern der aktuellen Schritt-Information für den Zurück-Button
  useEffect(() => {
    if (currentStep !== 'erblasser') {
      setHistorie(prev => [...prev, { step: currentStep, kontext: {...kontext} }]);
    }
  }, [currentStep]);
  
  // Formulare zurücksetzen
  const resetForm = () => {
    setFormVorname('');
    setFormNachname('');
    setFormGeburtsdatum('');
    setFormSterbedatum('');
    setFormAntwort('nein');
  };
  
  // Person speichern
  const speicherePerson = (beziehung: Beziehung, parentId?: string, generation?: number, stammId?: string) => {
    const neuePerson: Person = {
      id: String(Date.now()),
      beziehung,
      vorname: formVorname,
      nachname: formNachname,
      geburtsdatum: formGeburtsdatum,
      sterbedatum: formSterbedatum || undefined,
      parentId,
      generation,
      stammId
    };
    
    setPersonen(prev => [...prev, neuePerson]);
    resetForm();
    
    return neuePerson;
  };
  
  // Nächster Schritt
  const weiter = (nextStep: InterviewStep, kontextUpdate?: Partial<InterviewKontext>) => {
    setCurrentStep(nextStep);
    if (kontextUpdate) {
      setKontext(prev => ({ ...prev, ...kontextUpdate }));
    }
  };
  
  // Zurück-Button
  const zurueck = () => {
    if (historie.length > 0) {
      const letzterSchritt = historie[historie.length - 1];
      setCurrentStep(letzterSchritt.step);
      setKontext(letzterSchritt.kontext);
      setHistorie(prev => prev.slice(0, -1));
    } else {
      setCurrentStep('erblasser');
    }
  };
  
  // Interview abschließen
  const abschließen = () => {
    onComplete(erblasserName, personen);
    toast({
      title: "Interview abgeschlossen",
      description: `Alle erforderlichen Daten wurden erfasst. Die Erbfolge kann nun berechnet werden.`
    });
  };
  
  // Ermitteln des nächsten Schritts für Kinder-Rekursion
  const naechsterSchrittNachKind = () => {
    // Wenn das aktuelle Kind verstorben ist, fragen wir nach Kindern dieses Kindes
    if (kontext.aktuellesKind && istVerstorben(kontext.aktuellesKind)) {
      return 'kindKinder';
    }
    
    // Suchen nach weiteren Kindern im aktuellen Stamm
    const weiterKinderImStamm = personen.filter(
      p => p.beziehung === 'kind' && 
      p.stammId === kontext.aktuellerStamm && 
      p.id !== kontext.aktuellesKind?.id
    );
    
    if (weiterKinderImStamm.length > 0) {
      // Es gibt weitere Kinder in diesem Stamm
      setKontext(prev => ({
        ...prev,
        aktuellesKind: weiterKinderImStamm[0]
      }));
      return 'kindDetails';
    }
    
    // Alle Kinder in diesem Stamm wurden bearbeitet
    if (kontext.aktuellerStamm) {
      setKontext(prev => ({
        ...prev,
        fertigeStaemme: [...prev.fertigeStaemme, kontext.aktuellerStamm],
        aktuellerStamm: null,
        aktuellesKind: null
      }));
    }
    
    // Prüfen auf lebende Nachkommen in der 1. Ordnung
    const lebendeNachkommenErsteOrdnung = personen.some(
      p => (p.beziehung === 'kind' || p.beziehung === 'enkel') && !istVerstorben(p)
    );
    
    if (lebendeNachkommenErsteOrdnung) {
      // Es gibt mindestens einen lebenden Nachkommen der 1. Ordnung
      return 'abschluss';
    }
    
    // Keine lebenden Nachkommen der 1. Ordnung, weiter mit 2. Ordnung (Eltern)
    return 'eltern';
  };
  
  // Rendere den aktuellen Schritt
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'erblasser':
        return (
          <>
            <CardHeader>
              <CardTitle>Daten des Erblassers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="erblasserName">Name des Erblassers</Label>
                    <Input
                      id="erblasserName"
                      value={erblasserName}
                      onChange={(e) => setErblasserName(e.target.value)}
                      placeholder="Name des Erblassers eingeben"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div></div> {/* Platzhalter für die Ausrichtung */}
              <Button 
                onClick={() => weiter('ehepartner')}
                disabled={!erblasserName.trim()}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'ehepartner':
        return (
          <>
            <CardHeader>
              <CardTitle>Ehepartner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hatEhepartner">War der Erblasser verheiratet?</Label>
                  <Select 
                    value={formAntwort} 
                    onValueChange={(value) => setFormAntwort(value as 'ja' | 'nein')}
                  >
                    <SelectTrigger id="hatEhepartner">
                      <SelectValue placeholder="Bitte auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">Ja</SelectItem>
                      <SelectItem value="nein">Nein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button 
                onClick={() => {
                  if (formAntwort === 'ja') {
                    resetForm();
                    weiter('gueterstand');
                  } else {
                    weiter('kinder');
                  }
                }}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'gueterstand':
        return (
          <>
            <CardHeader>
              <CardTitle>Ehepartner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vorname">Vorname</Label>
                    <Input
                      id="vorname"
                      value={formVorname}
                      onChange={(e) => setFormVorname(e.target.value)}
                      placeholder="Vorname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nachname">Nachname</Label>
                    <Input
                      id="nachname"
                      value={formNachname}
                      onChange={(e) => setFormNachname(e.target.value)}
                      placeholder="Nachname"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                    <Input
                      id="geburtsdatum"
                      type="date"
                      value={formGeburtsdatum}
                      onChange={(e) => setFormGeburtsdatum(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sterbedatum">Sterbedatum (falls verstorben)</Label>
                    <Input
                      id="sterbedatum"
                      type="date"
                      value={formSterbedatum}
                      onChange={(e) => setFormSterbedatum(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="gueterstand">Güterstand</Label>
                  <Select 
                    value={formGueterstand} 
                    onValueChange={(value) => setFormGueterstand(value as any)}
                  >
                    <SelectTrigger id="gueterstand">
                      <SelectValue placeholder="Bitte auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zugewinngemeinschaft">Zugewinngemeinschaft</SelectItem>
                      <SelectItem value="guetergemeinschaft">Gütergemeinschaft</SelectItem>
                      <SelectItem value="guetertrennung">Gütertrennung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button 
                onClick={() => {
                  speicherePerson('ehepartner');
                  weiter('kinder');
                }}
                disabled={!formVorname.trim() || !formNachname.trim() || !formGeburtsdatum}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'kinder':
        return (
          <>
            <CardHeader>
              <CardTitle>Kinder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hatKinder">Hatte der Erblasser Kinder?</Label>
                  <Select 
                    value={formAntwort} 
                    onValueChange={(value) => setFormAntwort(value as 'ja' | 'nein')}
                  >
                    <SelectTrigger id="hatKinder">
                      <SelectValue placeholder="Bitte auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">Ja</SelectItem>
                      <SelectItem value="nein">Nein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button 
                onClick={() => {
                  if (formAntwort === 'ja') {
                    // Neuer Stamm für dieses Kind
                    const stammId = `stamm-${Date.now()}`;
                    weiter('kindDetails', { 
                      aktuellerStamm: stammId,
                      aktuellesKind: null 
                    });
                  } else {
                    // Keine Kinder, weiter mit Eltern (2. Ordnung)
                    weiter('eltern');
                  }
                }}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'kindDetails':
        return (
          <>
            <CardHeader>
              <CardTitle>
                {kontext.aktuellesKind ? 'Weiteres Kind' : 'Erstes Kind'} des Erblassers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vorname">Vorname</Label>
                    <Input
                      id="vorname"
                      value={formVorname}
                      onChange={(e) => setFormVorname(e.target.value)}
                      placeholder="Vorname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nachname">Nachname</Label>
                    <Input
                      id="nachname"
                      value={formNachname}
                      onChange={(e) => setFormNachname(e.target.value)}
                      placeholder="Nachname"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                    <Input
                      id="geburtsdatum"
                      type="date"
                      value={formGeburtsdatum}
                      onChange={(e) => setFormGeburtsdatum(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sterbedatum">Sterbedatum (falls verstorben)</Label>
                    <Input
                      id="sterbedatum"
                      type="date"
                      value={formSterbedatum}
                      onChange={(e) => setFormSterbedatum(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button 
                onClick={() => {
                  const neuesKind = speicherePerson(
                    'kind', 
                    undefined, 
                    1, 
                    kontext.aktuellerStamm || undefined
                  );
                  
                  setKontext(prev => ({
                    ...prev,
                    aktuellesKind: neuesKind
                  }));
                  
                  if (formSterbedatum && new Date(formSterbedatum) <= new Date()) {
                    // Kind ist verstorben, frage nach seinen Kindern
                    weiter('kindKinder');
                  } else {
                    // Lebendiges Kind gefunden, frage nach weiteren Kindern
                    weiter('kinder', { 
                      aktuellesKind: neuesKind 
                    });
                  }
                }}
                disabled={!formVorname.trim() || !formNachname.trim() || !formGeburtsdatum}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'kindKinder':
        return (
          <>
            <CardHeader>
              <CardTitle>Nachkommen des verstorbenen Kindes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hatKindKinder">
                    Hatte {kontext.aktuellesKind?.vorname} {kontext.aktuellesKind?.nachname} selbst Kinder?
                  </Label>
                  <Select 
                    value={formAntwort} 
                    onValueChange={(value) => setFormAntwort(value as 'ja' | 'nein')}
                  >
                    <SelectTrigger id="hatKindKinder">
                      <SelectValue placeholder="Bitte auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">Ja</SelectItem>
                      <SelectItem value="nein">Nein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button 
                onClick={() => {
                  if (formAntwort === 'ja') {
                    // Fragelogik für die Details des Enkelkindes
                    resetForm();
                    weiter('enkelDetails', { 
                      aktuelleGeneration: 2
                    });
                  } else {
                    // Keine weiteren Nachkommen in diesem Zweig
                    const nextStep = naechsterSchrittNachKind();
                    weiter(nextStep);
                  }
                }}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'enkelDetails':
        return (
          <>
            <CardHeader>
              <CardTitle>Enkel des Erblassers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vorname">Vorname</Label>
                    <Input
                      id="vorname"
                      value={formVorname}
                      onChange={(e) => setFormVorname(e.target.value)}
                      placeholder="Vorname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nachname">Nachname</Label>
                    <Input
                      id="nachname"
                      value={formNachname}
                      onChange={(e) => setFormNachname(e.target.value)}
                      placeholder="Nachname"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                    <Input
                      id="geburtsdatum"
                      type="date"
                      value={formGeburtsdatum}
                      onChange={(e) => setFormGeburtsdatum(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sterbedatum">Sterbedatum (falls verstorben)</Label>
                    <Input
                      id="sterbedatum"
                      type="date"
                      value={formSterbedatum}
                      onChange={(e) => setFormSterbedatum(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button 
                onClick={() => {
                  speicherePerson(
                    'enkel', 
                    kontext.aktuellesKind?.id, 
                    kontext.aktuelleGeneration,
                    kontext.aktuellerStamm || undefined
                  );
                  
                  // Nach weiteren Enkelkindern fragen
                  weiter('kindKinder');
                }}
                disabled={!formVorname.trim() || !formNachname.trim() || !formGeburtsdatum}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'eltern':
        return (
          <>
            <CardHeader>
              <CardTitle>Eltern des Erblassers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hatEltern">Lebt mindestens ein Elternteil des Erblassers?</Label>
                  <Select 
                    value={formAntwort} 
                    onValueChange={(value) => setFormAntwort(value as 'ja' | 'nein')}
                  >
                    <SelectTrigger id="hatEltern">
                      <SelectValue placeholder="Bitte auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">Ja</SelectItem>
                      <SelectItem value="nein">Nein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button 
                onClick={() => {
                  if (formAntwort === 'ja') {
                    // Mindestens ein Elternteil lebt, erfasse die Daten
                    resetForm();
                    weiter('elternDetails');
                  } else {
                    // Kein Elternteil lebt, weiter zu Großeltern
                    weiter('großeltern');
                  }
                }}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'elternDetails':
        return (
          <>
            <CardHeader>
              <CardTitle>Daten des Elternteils</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vorname">Vorname</Label>
                    <Input
                      id="vorname"
                      value={formVorname}
                      onChange={(e) => setFormVorname(e.target.value)}
                      placeholder="Vorname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nachname">Nachname</Label>
                    <Input
                      id="nachname"
                      value={formNachname}
                      onChange={(e) => setFormNachname(e.target.value)}
                      placeholder="Nachname"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                    <Input
                      id="geburtsdatum"
                      type="date"
                      value={formGeburtsdatum}
                      onChange={(e) => setFormGeburtsdatum(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sterbedatum">Sterbedatum (falls verstorben)</Label>
                    <Input
                      id="sterbedatum"
                      type="date"
                      value={formSterbedatum}
                      onChange={(e) => setFormSterbedatum(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button 
                onClick={() => {
                  speicherePerson('elternteil');
                  
                  // Weitere Elternteile abfragen
                  weiter('eltern');
                }}
                disabled={!formVorname.trim() || !formNachname.trim() || !formGeburtsdatum}
              >
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
        
      case 'abschluss':
        return (
          <>
            <CardHeader>
              <CardTitle>Interview abschließen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Alle erforderlichen Daten wurden erfasst. Sie können nun die gesetzliche Erbfolge berechnen lassen.</p>
                
                <div className="bg-secondary/20 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Zusammenfassung:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Erblasser: {erblasserName}</li>
                    {hatEhepartner && <li>Ehepartner erfasst</li>}
                    {personen.filter(p => p.beziehung === 'kind').length > 0 && 
                      <li>{personen.filter(p => p.beziehung === 'kind').length} Kinder erfasst</li>
                    }
                    {personen.filter(p => p.beziehung === 'enkel').length > 0 && 
                      <li>{personen.filter(p => p.beziehung === 'enkel').length} Enkelkinder erfasst</li>
                    }
                    {personen.filter(p => p.beziehung === 'elternteil').length > 0 && 
                      <li>{personen.filter(p => p.beziehung === 'elternteil').length} Elternteile erfasst</li>
                    }
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button onClick={abschließen}>
                <Save className="mr-2 h-4 w-4" /> Abschließen
              </Button>
            </CardFooter>
          </>
        );
        
      default:
        return (
          <div className="text-center py-8">
            <p>Der gewählte Schritt ist nicht verfügbar.</p>
          </div>
        );
    }
  };
  
  return (
    <Card className="w-full">
      {renderCurrentStep()}
    </Card>
  );
};
