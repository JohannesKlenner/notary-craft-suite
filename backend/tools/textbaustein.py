from typing import List, Dict
import uuid

def generiere_textbaustein(textbausteine: List[Dict], platzhalter: Dict) -> str:
    """
    Fügt Platzhalter in die ausgewählten Textbausteine ein und gibt den zusammengesetzten Text zurück.
    """
    result = []
    for block in textbausteine:
        text = block['text']
        for key, value in platzhalter.items():
            text = text.replace(f'{{{{{key}}}}}', str(value))
        result.append(text)
    return '\n\n'.join(result)

# Beispiel-Textbausteine (könnten aus DB kommen)
BEISPIEL_BAUSTEINE = [
    {"id": str(uuid.uuid4()), "kategorie": "Erbschein", "titel": "Eröffnungsformel", "text": "Hiermit wird beurkundet, dass ..."},
    {"id": str(uuid.uuid4()), "kategorie": "Erbschein", "titel": "Schlusssatz", "text": "Dies wird amtlich bestätigt am {{{datum}}}."}
]

def lade_textbausteine(kategorie: str = None) -> List[Dict]:
    if kategorie:
        return [b for b in BEISPIEL_BAUSTEINE if b["kategorie"] == kategorie]
    return BEISPIEL_BAUSTEINE
