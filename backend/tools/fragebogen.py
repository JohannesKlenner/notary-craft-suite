from typing import List, Dict
import uuid

def speichere_fragebogen(fragebogen: Dict, db) -> str:
    # Speichert den Fragebogen als JSON in der Datenbank, gibt die ID zurück
    eintrag = db.Fragebogen(
        id=str(uuid.uuid4()),
        name=fragebogen.get('name'),
        struktur=fragebogen.get('struktur')
    )
    db.add(eintrag)
    db.commit()
    return eintrag.id

def lade_fragebogen(fragebogen_id: str, db) -> Dict:
    return db.query(db.Fragebogen).filter_by(id=fragebogen_id).first()
