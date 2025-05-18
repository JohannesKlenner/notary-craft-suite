from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.models.erbpachtzins import Erbpachtzins
from backend.auth.users import get_current_user, User
from backend.tools.erbpachtzins import berechne_erbpachtzins

router = APIRouter()

@router.post("/calculate")
async def calculate_erbpachtzins(
    aktueller_zins: float,
    alter_index: float,
    neuer_index: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        ergebnis = berechne_erbpachtzins(aktueller_zins, alter_index, neuer_index)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    eintrag = Erbpachtzins(
        user_id=current_user.id,
        aktueller_zins=aktueller_zins,
        alter_index=alter_index,
        neuer_index=neuer_index,
        neuer_zins=ergebnis["neuer_zins"]
    )
    db.add(eintrag)
    db.commit()
    db.refresh(eintrag)
    return ergebnis

@router.get("/history")
async def get_erbpachtzins_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Erbpachtzins).filter(Erbpachtzins.user_id == current_user.id).all()
