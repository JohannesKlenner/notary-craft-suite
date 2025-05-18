
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
    # Implement inheritance calculation logic here
    ergebnis = f"Erblasser {erblasser} mit Vermögenswert {vermoegenswert}€"
    
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
