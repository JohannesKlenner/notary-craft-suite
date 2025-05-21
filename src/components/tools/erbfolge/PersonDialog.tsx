
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

type Beziehung = 'ehepartner' | 'kind' | 'elternteil' | 'geschwister' | 'neffe' | 'großelternteil';

interface Person {
  id: string;
  beziehung: Beziehung;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  sterbedatum?: string;
  parentId?: string;
}

interface PersonDialogProps {
  isOpen: boolean;
  person: Person | null;
  onClose: () => void;
  onSave: (person: Person) => void;
  onDelete?: (id: string) => void;
}

export const PersonDialog: React.FC<PersonDialogProps> = ({ 
  isOpen, 
  person, 
  onClose, 
  onSave,
  onDelete 
}) => {
  const [editedPerson, setEditedPerson] = useState<Person>({
    id: '',
    beziehung: 'kind',
    vorname: '',
    nachname: '',
    geburtsdatum: '',
    sterbedatum: ''
  });
  
  useEffect(() => {
    if (person) {
      setEditedPerson(person);
    }
  }, [person]);
  
  const handleChange = (field: keyof Person, value: string) => {
    setEditedPerson({
      ...editedPerson,
      [field]: value
    });
  };
  
  const handleSave = () => {
    if (!editedPerson.vorname || !editedPerson.nachname) {
      // Simple validation
      return;
    }
    onSave(editedPerson);
  };
  
  const handleDelete = () => {
    if (onDelete && editedPerson.id) {
      onDelete(editedPerson.id);
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{person?.id ? 'Person bearbeiten' : 'Person hinzufügen'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vorname">Vorname</Label>
              <Input
                id="vorname"
                value={editedPerson.vorname}
                onChange={(e) => handleChange('vorname', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nachname">Nachname</Label>
              <Input
                id="nachname"
                value={editedPerson.nachname}
                onChange={(e) => handleChange('nachname', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="beziehung">Beziehung zum Erblasser</Label>
            <Select 
              value={editedPerson.beziehung} 
              onValueChange={(value) => handleChange('beziehung', value as Beziehung)}
            >
              <SelectTrigger id="beziehung">
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
              <Input
                id="geburtsdatum"
                type="date"
                value={editedPerson.geburtsdatum}
                onChange={(e) => handleChange('geburtsdatum', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sterbedatum">Sterbedatum (falls verstorben)</Label>
              <Input
                id="sterbedatum"
                type="date"
                value={editedPerson.sterbedatum}
                onChange={(e) => handleChange('sterbedatum', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <div>
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={handleSave}>Speichern</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
