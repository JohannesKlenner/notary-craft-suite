from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database.db import get_db
from backend.models.miteigentum import Miteigentum
from backend.auth.users import get_current_user, User
from backend.tools.miteigentum import berechne_miteigentum

router = APIRouter()

@router.post("/calculate")
async def calculate_miteigentum(
    objekt: str,
    anteil: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Dummy-Logik aus tools.miteigentum nutzen
    ergebnis = berechne_miteigentum(objekt, anteil)
    calculation = Miteigentum(
        user_id=current_user.id,
        objekt=objekt,
        anteil=anteil,
        ergebnis=ergebnis["ergebnis"]
    )
    db.add(calculation)
    db.commit()
    db.refresh(calculation)
    return calculation

@router.get("/history", response_model=List[dict])
async def get_miteigentum_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    calculations = db.query(Miteigentum).filter(Miteigentum.user_id == current_user.id).all()
    return calculations
