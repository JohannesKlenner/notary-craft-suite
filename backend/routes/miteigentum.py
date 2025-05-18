
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
    def format_bruch(anteil: float) -> str:
        nenner = 100
        zaehler = int(anteil * nenner)
        
        def gcd(a: int, b: int) -> int:
            while b:
                a, b = b, a % b
            return a
            
        teiler = gcd(zaehler, nenner)
        return f"{zaehler//teiler}/{nenner//teiler}"

    ergebnis = f"Objekt {objekt} - Anteil: {anteil}% ({format_bruch(anteil/100)})"
    
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
