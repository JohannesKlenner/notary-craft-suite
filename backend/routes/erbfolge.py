from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from backend.database.db import get_db
from backend.models.erbfolge import Erbfolge
from backend.auth.users import get_current_user, User
from backend.tools.erbfolge import berechne_erbfolge

router = APIRouter()

@router.post("/calculate")
async def calculate_erbfolge(
    erblasser: str = Body(...),
    vermoegenswert: float = Body(...),
    erben: list = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Neue Logik: strukturierte Erbenliste
    ergebnis = berechne_erbfolge(erblasser, vermoegenswert, erben)
    # Speicherung
    calculation = Erbfolge(
        user_id=current_user.id,
        erblasser=erblasser,
        vermoegenswert=vermoegenswert,
        ergebnis=str(ergebnis["ergebnisse"])
    )
    db.add(calculation)
    db.commit()
    db.refresh(calculation)
    return ergebnis

@router.get("/history", response_model=List[dict])
async def get_erbfolge_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    calculations = db.query(Erbfolge).filter(Erbfolge.user_id == current_user.id).all()
    return calculations
