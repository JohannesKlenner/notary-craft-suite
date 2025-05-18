from typing import Dict

def berechne_gnotkg(geschaeftswert: float, vorgangsart: str) -> Dict:
    # Beispielhafte Gebührentabelle (vereinfachte Werte!)
    gebuehrentabelle = [
        (5000, 15),
        (25000, 35),
        (50000, 70),
        (100000, 120),
        (500000, 300),
        (1000000, 500),
        (float('inf'), 1000)
    ]
    gebuehr = 0
    for grenze, betrag in gebuehrentabelle:
        if geschaeftswert <= grenze:
            gebuehr = betrag
            break
    # Vorgangsart kann Zuschläge/Abschläge auslösen
    if vorgangsart == 'Beurkundung':
        gebuehr *= 2
    elif vorgangsart == 'Beglaubigung':
        gebuehr *= 0.5
    return {
        "geschaeftswert": geschaeftswert,
        "vorgangsart": vorgangsart,
        "gebuehr": round(gebuehr, 2)
    }
