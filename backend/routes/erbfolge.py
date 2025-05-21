
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database.db import get_db
from backend.models.erbfolge import Erbfolge
from backend.auth.users import get_current_user, User
from backend.tools.erbfolge import berechne_erbfolge

router = APIRouter()

@router.get("/health-check")
async def health_check():
    """Simple endpoint to check if the backend is running"""
    return {"status": "healthy", "message": "Erbfolge-API is operational"}

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

@router.post("/parse-gedcom")
async def parse_gedcom(
    file_content: str = Body(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Parse GEDCOM file and return structured data"""
    from backend.tools.gedcom import parse_gedcom_content
    try:
        result = parse_gedcom_content(file_content)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"GEDCOM parsing failed: {str(e)}")
