
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.db import get_db
from ..models.erbfolge import Erbfolge
from ..auth.users import get_current_user, User

router = APIRouter()

@router.post("/calculate")
async def calculate_erbfolge(
    erblasser: str,
    vermoegenswert: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Basic inheritance calculation logic
    def berechne_erbanteil(beziehung: str) -> float:
        anteile = {
            "ehepartner": 50,  # Ehepartner erbt 50%
            "kind": 25,        # Kinder erben zu gleichen Teilen
            "elternteil": 25,  # Eltern erben zu gleichen Teilen
            "geschwister": 25, # Geschwister erben zu gleichen Teilen
            "neffe": 12.5,     # Neffen/Nichten erben zu gleichen Teilen
            "großelternteil": 25  # Großeltern erben zu gleichen Teilen
        }
        return anteile.get(beziehung, 0)

    ergebnis = f"Erblasser {erblasser} hinterlässt {vermoegenswert}€ - Erbanteil: {berechne_erbanteil('ehepartner')}%"
    
    calculation = Erbfolge(
        user_id=current_user.id,
        erblasser=erblasser,
        vermoegenswert=vermoegenswert,
        ergebnis=ergebnis
    )
    
    db.add(calculation)
    db.commit()
    db.refresh(calculation)
    return calculation

@router.get("/history", response_model=List[dict])
async def get_erbfolge_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    calculations = db.query(Erbfolge).filter(Erbfolge.user_id == current_user.id).all()
    return calculations
