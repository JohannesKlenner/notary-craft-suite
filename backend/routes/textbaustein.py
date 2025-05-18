from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.models.textbaustein import Textbaustein
from backend.tools.textbaustein import generiere_textbaustein, lade_textbausteine
from backend.auth.users import get_current_user, User
import uuid

router = APIRouter()

@router.get("/list")
def list_textbausteine(kategorie: str = None, db: Session = Depends(get_db)):
    if kategorie:
        return db.query(Textbaustein).filter(Textbaustein.kategorie == kategorie).all()
    return db.query(Textbaustein).all()

@router.post("/add")
def add_textbaustein(
    kategorie: str = Body(...),
    titel: str = Body(...),
    text: str = Body(...),
    db: Session = Depends(get_db)
):
    baustein = Textbaustein(id=str(uuid.uuid4()), kategorie=kategorie, titel=titel, text=text)
    db.add(baustein)
    db.commit()
    db.refresh(baustein)
    return baustein

@router.post("/generate")
def generate_text(
    baustein_ids: list = Body(...),
    platzhalter: dict = Body(...),
    db: Session = Depends(get_db)
):
    blocks = db.query(Textbaustein).filter(Textbaustein.id.in_(baustein_ids)).all()
    blocks_dict = [ {"text": b.text} for b in blocks ]
    return {"text": generiere_textbaustein(blocks_dict, platzhalter)}
