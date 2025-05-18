from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.models.gnotkg import GNotKG
from backend.auth.users import get_current_user, User
from backend.tools.gnotkg import berechne_gnotkg

router = APIRouter()

@router.post("/calculate")
async def calculate_gnotkg(
    geschaeftswert: float,
    vorgangsart: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ergebnis = berechne_gnotkg(geschaeftswert, vorgangsart)
    eintrag = GNotKG(
        user_id=current_user.id,
        geschaeftswert=geschaeftswert,
        vorgangsart=vorgangsart,
        gebuehr=ergebnis["gebuehr"]
    )
    db.add(eintrag)
    db.commit()
    db.refresh(eintrag)
    return ergebnis

@router.get("/history")
async def get_gnotkg_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(GNotKG).filter(GNotKG.user_id == current_user.id).all()
