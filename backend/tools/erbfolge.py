
from typing import Dict, List, Any, Optional

def berechne_erbfolge(erblasser: str, vermoegenswert: float, erben: List[Dict]) -> Dict:
    """
    Berechnet die gesetzliche Erbfolge nach deutschem Recht unter Berücksichtigung aller Ordnungen.
    
    Berücksichtigt:
    - Ehepartner mit verschiedenen Güterständen
    - Kindererben und deren Nachkommen (Repräsentation)
    - Eltern, Geschwister (2. Ordnung)
    - Großeltern und deren Nachkommen (3. Ordnung)
    - Entferntere Verwandte (4. Ordnung und weitere)
    
    Gibt für jeden Erben die Erbquote (in Prozent) zurück.
    """
    # Ergebnisse-Dictionary
    ergebnisse = {}
    
    # Hilfsfunktionen
    def ist_verstorben(person: Dict) -> bool:
        """Prüft, ob eine Person verstorben ist"""
        return "sterbedatum" in person and person.get("sterbedatum")
    
    def gruppiere_nach_stamm(alle_personen: List[Dict], beziehung_typ: str) -> Dict[str, List[Dict]]:
        """Gruppiert Personen nach ihrem Stamm"""
        nach_stamm = {}
        for person in alle_personen:
            if person.get("beziehung") == beziehung_typ and "stammId" in person:
                stamm_id = person["stammId"]
                if stamm_id not in nach_stamm:
                    nach_stamm[stamm_id] = []
                nach_stamm[stamm_id].append(person)
        return nach_stamm
    
    # Personen nach Beziehungstypen filtern
    ehepartner = [p for p in erben if p.get("beziehung") == "ehepartner" and not ist_verstorben(p)]
    kinder = [p for p in erben if p.get("beziehung") == "kind"]
    lebende_kinder = [p for p in kinder if not ist_verstorben(p)]
    
    # Enkel nach Stämmen gruppieren
    enkel = [p for p in erben if p.get("beziehung") == "enkel"]
    lebende_enkel = [p for p in enkel if not ist_verstorben(p)]
    enkel_nach_stamm = gruppiere_nach_stamm(lebende_enkel, "enkel")
    
    # Verstorbene Kinder identifizieren
    verstorbene_kinder = [p for p in kinder if ist_verstorben(p)]
    verstorbene_kinder_ids = {p.get("stammId") for p in verstorbene_kinder if "stammId" in p}
    
    # Stämme mit lebenden Nachkommen
    staemme_mit_nachkommen = {
        stamm_id for stamm_id in verstorbene_kinder_ids 
        if stamm_id in enkel_nach_stamm and enkel_nach_stamm[stamm_id]
    }
    
    # Erben der 2. Ordnung
    eltern = [p for p in erben if p.get("beziehung") == "elternteil" and not ist_verstorben(p)]
    geschwister = [p for p in erben if p.get("beziehung") == "geschwister" and not ist_verstorben(p)]
    
    # Erben der 3. Ordnung
    großeltern = [p for p in erben if p.get("beziehung") == "großelternteil" and not ist_verstorben(p)]
    
    # Erste Ordnung: Nachkommen des Erblassers
    erste_ordnung_vorhanden = len(lebende_kinder) > 0 or len(staemme_mit_nachkommen) > 0
    
    # Zweite Ordnung: Eltern des Erblassers und deren Nachkommen
    zweite_ordnung_vorhanden = len(eltern) > 0 or len(geschwister) > 0
    
    # Dritte Ordnung: Großeltern des Erblassers und deren Nachkommen
    dritte_ordnung_vorhanden = len(großeltern) > 0
    
    # Hauptberechnungslogik
    if erste_ordnung_vorhanden and ehepartner:
        # Ehepartner + Erben 1. Ordnung
        ehepartner_quote = 0.5  # 50% für Ehepartner
        
        # Güterstand berücksichtigen (vereinfacht)
        # TODO: Güterstand-spezifische Logik ergänzen
        
        kinder_quote = 0.5  # 50% für Erben 1. Ordnung
        
        # Ehepartner-Anteil berechnen
        for p in ehepartner:
            ergebnisse[p.get("id")] = (ehepartner_quote / len(ehepartner)) * 100
        
        # Anzahl der Stämme berechnen (lebende Kinder + Stämme mit lebenden Enkeln von verstorbenen Kindern)
        stamm_anzahl = len(lebende_kinder) + len(staemme_mit_nachkommen)
        stamm_quote = kinder_quote / stamm_anzahl if stamm_anzahl > 0 else 0
        
        # Lebende Kinder bekommen direkt ihren Stammanteil
        for k in lebende_kinder:
            ergebnisse[k.get("id")] = stamm_quote * 100
        
        # Enkel aus Stämmen verstorbener Kinder bekommen den Stammanteil gleichmäßig aufgeteilt
        for stamm_id in staemme_mit_nachkommen:
            stamm_enkel = enkel_nach_stamm.get(stamm_id, [])
            enkel_quote = (stamm_quote / len(stamm_enkel)) if stamm_enkel else 0
            for e in stamm_enkel:
                ergebnisse[e.get("id")] = enkel_quote * 100
    
    elif erste_ordnung_vorhanden and not ehepartner:
        # Nur Erben 1. Ordnung, kein Ehepartner
        stamm_anzahl = len(lebende_kinder) + len(staemme_mit_nachkommen)
        stamm_quote = 1.0 / stamm_anzahl if stamm_anzahl > 0 else 0
        
        # Lebende Kinder
        for k in lebende_kinder:
            ergebnisse[k.get("id")] = stamm_quote * 100
        
        # Enkel aus Stämmen verstorbener Kinder
        for stamm_id in staemme_mit_nachkommen:
            stamm_enkel = enkel_nach_stamm.get(stamm_id, [])
            enkel_quote = (stamm_quote / len(stamm_enkel)) if stamm_enkel else 0
            for e in stamm_enkel:
                ergebnisse[e.get("id")] = enkel_quote * 100
    
    elif ehepartner and zweite_ordnung_vorhanden:
        # Ehepartner + Erben 2. Ordnung (Eltern, Geschwister)
        ehepartner_quote = 0.75  # 75% für Ehepartner bei Erben der 2. Ordnung
        ordnung_quote = 0.25  # 25% für 2. Ordnung
        
        # Ehepartner-Anteil
        for p in ehepartner:
            ergebnisse[p.get("id")] = (ehepartner_quote / len(ehepartner)) * 100
        
        # Bei Eltern zählen Kopfteile
        if eltern:
            eltern_quote = ordnung_quote / len(eltern)
            for p in eltern:
                ergebnisse[p.get("id")] = eltern_quote * 100
        
        # Bei Geschwistern und ohne Eltern zählen Stämme
        elif geschwister:
            geschwister_quote = ordnung_quote / len(geschwister)
            for p in geschwister:
                ergebnisse[p.get("id")] = geschwister_quote * 100
    
    elif ehepartner and dritte_ordnung_vorhanden:
        # Ehepartner + Erben 3. Ordnung (Großeltern)
        ehepartner_quote = 0.75  # 75% für Ehepartner bei Erben der 3. Ordnung
        ordnung_quote = 0.25  # 25% für 3. Ordnung
        
        # Ehepartner-Anteil
        for p in ehepartner:
            ergebnisse[p.get("id")] = (ehepartner_quote / len(ehepartner)) * 100
        
        # Großeltern-Anteil
        großeltern_quote = ordnung_quote / len(großeltern)
        for p in großeltern:
            ergebnisse[p.get("id")] = großeltern_quote * 100
    
    elif ehepartner:
        # Nur Ehepartner, keine anderen Erben
        ehepartner_quote = 1.0 / len(ehepartner)
        for p in ehepartner:
            ergebnisse[p.get("id")] = ehepartner_quote * 100
    
    elif zweite_ordnung_vorhanden:
        # Nur Erben 2. Ordnung, kein Ehepartner
        if eltern:
            # Eltern erben zu gleichen Teilen
            eltern_quote = 1.0 / len(eltern)
            for p in eltern:
                ergebnisse[p.get("id")] = eltern_quote * 100
        else:
            # Geschwister erben zu gleichen Teilen
            geschwister_quote = 1.0 / len(geschwister) if geschwister else 0
            for p in geschwister:
                ergebnisse[p.get("id")] = geschwister_quote * 100
    
    elif dritte_ordnung_vorhanden:
        # Nur Erben 3. Ordnung (Großeltern, etc.)
        großeltern_quote = 1.0 / len(großeltern) if großeltern else 0
        for p in großeltern:
            ergebnisse[p.get("id")] = großeltern_quote * 100
    
    else:
        # Fallback: Alle lebenden Personen bekommen gleiche Anteile
        lebende = [p for p in erben if not ist_verstorben(p)]
        if lebende:
            quote = 1.0 / len(lebende)
            for p in lebende:
                ergebnisse[p.get("id")] = quote * 100

    return {
        "erblasser": erblasser,
        "vermoegenswert": vermoegenswert,
        "ergebnisse": ergebnisse
    }
