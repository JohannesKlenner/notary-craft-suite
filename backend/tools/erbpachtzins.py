from typing import Dict

def berechne_erbpachtzins(aktueller_zins: float, alter_index: float, neuer_index: float) -> Dict:
    """
    Berechnet den neuen Erbpachtzins anhand des Verbraucherpreisindex.
    Formel: neuer_zins = aktueller_zins * (neuer_index / alter_index)
    """
    if alter_index == 0:
        raise ValueError("Alter Index darf nicht 0 sein.")
    neuer_zins = aktueller_zins * (neuer_index / alter_index)
    return {
        "aktueller_zins": aktueller_zins,
        "alter_index": alter_index,
        "neuer_index": neuer_index,
        "neuer_zins": round(neuer_zins, 2)
    }
