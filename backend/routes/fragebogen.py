
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.models.fragebogen import Fragebogen
from backend.auth.users import get_current_user, User
import uuid
import json

router = APIRouter()

@router.post("/save")
def save_fragebogen(
    name: str = Body(...),
    struktur: dict = Body(...),
    db: Session = Depends(get_db)
):
    fragebogen = Fragebogen(id=str(uuid.uuid4()), name=name, struktur=json.dumps(struktur))
    db.add(fragebogen)
    db.commit()
    db.refresh(fragebogen)
    return {"id": fragebogen.id}

@router.get("/load/{fragebogen_id}")
def load_fragebogen(fragebogen_id: str, db: Session = Depends(get_db)):
    fragebogen = db.query(Fragebogen).filter(Fragebogen.id == fragebogen_id).first()
    if not fragebogen:
        raise HTTPException(status_code=404, detail="Fragebogen nicht gefunden")
    return {"id": fragebogen.id, "name": fragebogen.name, "struktur": json.loads(str(fragebogen.struktur))}

@router.get("/list")
def list_frageboegen(db: Session = Depends(get_db)):
    return [
        {"id": f.id, "name": f.name} for f in db.query(Fragebogen).all()
    ]
