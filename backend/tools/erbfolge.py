from typing import Dict, List

def berechne_erbfolge(erblasser: str, vermoegenswert: float, erben: List[Dict]) -> Dict:
    """
    Berechnet die gesetzliche Erbfolge nach deutschem Recht für einfache Fälle.
    Erwartet eine Liste von Erben mit Beziehungstypen.
    Gibt für jeden Erben die Erbquote (in Prozent) zurück.
    """
    # Zähle die Beziehungen
    beziehungen = {}
    for erbe in erben:
        rel = erbe.get('beziehung')
        beziehungen[rel] = beziehungen.get(rel, 0) + 1

    ergebnisse = {}
    if beziehungen.get('ehepartner') and beziehungen.get('kind'):
        # Ehepartner + Kinder
        ehepartner_quote = 0.5
        kinder_anzahl = beziehungen['kind']
        kinder_quote = (1 - ehepartner_quote) / kinder_anzahl if kinder_anzahl else 0
        for erbe in erben:
            if erbe['beziehung'] == 'ehepartner':
                ergebnisse[erbe['id']] = ehepartner_quote * 100
            elif erbe['beziehung'] == 'kind':
                ergebnisse[erbe['id']] = kinder_quote * 100
            else:
                ergebnisse[erbe['id']] = 0
    elif beziehungen.get('ehepartner') and not beziehungen.get('kind'):
        # Ehepartner + andere Verwandte
        ehepartner_quote = 0.75
        other_relatives = sum(v for k, v in beziehungen.items() if k != 'ehepartner')
        other_quote = (1 - ehepartner_quote) / other_relatives if other_relatives else 0
        for erbe in erben:
            if erbe['beziehung'] == 'ehepartner':
                ergebnisse[erbe['id']] = ehepartner_quote * 100
            else:
                ergebnisse[erbe['id']] = other_quote * 100
    elif beziehungen.get('kind') and not beziehungen.get('ehepartner'):
        # Nur Kinder
        kinder_anzahl = beziehungen['kind']
        kinder_quote = 1 / kinder_anzahl if kinder_anzahl else 0
        for erbe in erben:
            if erbe['beziehung'] == 'kind':
                ergebnisse[erbe['id']] = kinder_quote * 100
            else:
                ergebnisse[erbe['id']] = 0
    else:
        # Gleichverteilung (Fallback)
        quote = 1 / len(erben) if erben else 0
        for erbe in erben:
            ergebnisse[erbe['id']] = quote * 100

    return {
        "erblasser": erblasser,
        "vermoegenswert": vermoegenswert,
        "ergebnisse": ergebnisse
    }
