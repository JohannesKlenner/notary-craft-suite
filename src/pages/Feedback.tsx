import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';

const Feedback = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      if (file) formData.append('file', file);
      const res = await fetch('http://localhost:8000/feedback/send', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });
      if (!res.ok) throw new Error('Feedback konnte nicht gesendet werden');
      toast({
        title: 'Feedback gesendet',
        description: `Ihr Feedback wurde übermittelt. Vielen Dank!`,
      });
      setIsSubmitting(false);
      navigate('/dashboard');
    } catch (e) {
      toast({
        title: 'Fehler',
        description: String(e),
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="p-0" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
      </div>
      
      <Card className="win11-card">
        <CardHeader>
          <CardTitle className="text-2xl">Feedback geben</CardTitle>
          <CardDescription>
            Teilen Sie uns Ihre Erfahrungen oder Verbesserungsvorschläge mit
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Betreff</Label>
              <Input
                id="subject"
                placeholder="Betreff eingeben"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Nachricht</Label>
              <Textarea
                id="message"
                placeholder="Ihre Nachricht..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="screenshot">Screenshot hinzufügen (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('screenshot')?.click()}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : 'Datei auswählen'}
                </Button>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Entfernen
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unterstützte Dateitypen: JPG, PNG, GIF (max. 5MB)
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Wird gesendet...' : 'Feedback senden'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Feedback;
