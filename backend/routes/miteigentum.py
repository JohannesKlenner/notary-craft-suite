
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.db import get_db
from ..models.miteigentum import Miteigentum
from ..auth.users import get_current_user, User

router = APIRouter()

@router.post("/calculate")
async def calculate_miteigentum(
    objekt: str,
    anteil: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Implement co-ownership calculation logic here
    ergebnis = f"Objekt {objekt} mit Anteil {anteil}%"
    
    calculation = Miteigentum(
        user_id=current_user.id,
        objekt=objekt,
        anteil=anteil,
        ergebnis=ergebnis
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
