
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';

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

interface GedcomImporterProps {
  onImport: (data: { personen: Person[], erblasserName: string }) => void;
}

export const GedcomImporter: React.FC<GedcomImporterProps> = ({ onImport }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedData = parseGedcom(content);
        onImport(parsedData);
      } catch (error) {
        toast({
          title: 'Import fehlgeschlagen',
          description: 'Die GEDCOM-Datei konnte nicht verarbeitet werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: 'Import fehlgeschlagen',
        description: 'Die Datei konnte nicht gelesen werden.',
        variant: 'destructive'
      });
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  // Basic GEDCOM parser
  const parseGedcom = (gedcomContent: string): { personen: Person[], erblasserName: string } => {
    const lines = gedcomContent.split(/\r?\n/);
    const individuals: Record<string, any> = {};
    const families: Record<string, any> = {};
    let currentEntity: any = null;
    let currentType = '';
    let currentId = '';
    let erblasserName = 'Erblasser';
    
    // First pass - collect information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Parse line: level record_id optional_tag optional_value
      const parts = line.match(/(\d+)\s+(@\w+@)?\s*(\w+)?\s*(.*)?/);
      if (!parts) continue;
      
      const [_, level, recordId, tag, value] = parts;
      const numLevel = parseInt(level);
      
      if (numLevel === 0) {
        // New entity
        if (tag === 'INDI') {
          // Individual record
          currentType = 'INDI';
          currentId = recordId?.replace(/@/g, '') || '';
          individuals[currentId] = { id: currentId };
          currentEntity = individuals[currentId];
        } else if (tag === 'FAM') {
          // Family record
          currentType = 'FAM';
          currentId = recordId?.replace(/@/g, '') || '';
          families[currentId] = { id: currentId, children: [] };
          currentEntity = families[currentId];
        } else {
          // Skip other entity types
          currentType = '';
          currentEntity = null;
        }
      } else if (currentEntity) {
        // Data for current entity
        if (currentType === 'INDI') {
          switch (tag) {
            case 'NAME':
              const nameParts = value.split(/\s+\/|\s+/);
              currentEntity.vorname = nameParts[0] || '';
              currentEntity.nachname = nameParts[1]?.replace(/\//g, '') || '';
              break;
            case 'BIRT':
              currentEntity.birth = {};
              break;
            case 'DEAT':
              currentEntity.death = {};
              break;
            case 'DATE':
              if (i > 0) {
                const prevTag = lines[i-1].match(/\d+\s+(\w+)/)?.[1];
                if (prevTag === 'BIRT') {
                  currentEntity.birth.date = formatDate(value);
                } else if (prevTag === 'DEAT') {
                  currentEntity.death.date = formatDate(value);
                }
              }
              break;
            case 'FAMC':
              // Child of family
              currentEntity.childOf = value.replace(/@/g, '');
              break;
            case 'FAMS':
              // Spouse in family
              currentEntity.spouseIn = value.replace(/@/g, '');
              break;
          }
        } else if (currentType === 'FAM') {
          switch (tag) {
            case 'HUSB':
              currentEntity.husband = value.replace(/@/g, '');
              break;
            case 'WIFE':
              currentEntity.wife = value.replace(/@/g, '');
              break;
            case 'CHIL':
              currentEntity.children = currentEntity.children || [];
              currentEntity.children.push(value.replace(/@/g, ''));
              break;
          }
        }
      }
    }
    
    // Get first individual as erblasser if none specified
    if (Object.keys(individuals).length > 0) {
      const firstPerson = individuals[Object.keys(individuals)[0]];
      erblasserName = `${firstPerson.vorname || ''} ${firstPerson.nachname || ''}`.trim() || 'Erblasser';
    }
    
    // Convert to our app format
    const personen: Person[] = [];
    
    // Assign relationships based on families
    for (const famId in families) {
      const family = families[famId];
      
      // If has husband and wife, they are spouses
      if (family.husband && family.wife) {
        const husband = individuals[family.husband];
        const wife = individuals[family.wife];
        
        if (wife) {
          personen.push({
            id: Date.now() + '-' + wife.id,
            beziehung: 'ehepartner',
            vorname: wife.vorname || '',
            nachname: wife.nachname || '',
            geburtsdatum: wife.birth?.date || '',
            sterbedatum: wife.death?.date || '',
          });
        }
      }
      
      // Children
      if (family.children) {
        for (const childId of family.children) {
          const child = individuals[childId];
          if (child) {
            personen.push({
              id: Date.now() + '-' + child.id,
              beziehung: 'kind',
              vorname: child.vorname || '',
              nachname: child.nachname || '',
              geburtsdatum: child.birth?.date || '',
              sterbedatum: child.death?.date || '',
            });
          }
        }
      }
    }
    
    // Add other individuals as generic relatives
    for (const indiId in individuals) {
      const indi = individuals[indiId];
      
      // Skip if already added
      if (personen.find(p => p.id.endsWith('-' + indiId))) continue;
      
      // Add as other relative
      personen.push({
        id: Date.now() + '-' + indi.id,
        beziehung: 'geschwister', // Default to geschwister for unknown relationship
        vorname: indi.vorname || '',
        nachname: indi.nachname || '',
        geburtsdatum: indi.birth?.date || '',
        sterbedatum: indi.death?.date || '',
      });
    }
    
    return { personen, erblasserName };
  };
  
  // Helper to format dates from GEDCOM
  const formatDate = (dateStr: string): string => {
    // Try to convert to YYYY-MM-DD
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // If any error, return original string
    }
    return dateStr;
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-dashed rounded-md p-6 text-center">
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Wählen Sie eine GEDCOM-Datei (*.ged) zum Importieren
        </p>
        <Input 
          type="file" 
          accept=".ged,.gedcom" 
          className="mt-4" 
          onChange={handleFileUpload}
          disabled={isLoading}
        />
      </div>
      
      <p className="text-xs text-muted-foreground">
        GEDCOM ist ein Standardformat für Genealogie-Daten. Sie können GEDCOM-Dateien aus Programmen wie Family Tree Maker,
        MyHeritage, Ancestry.com oder anderen Stammbaum-Tools exportieren.
      </p>
    </div>
  );
};
