from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.db import get_db
from fastapi.security import OAuth2PasswordBearer
from backend.auth.users import get_current_user

router = APIRouter()

def get_history_table(db: Session):
    db.execute("""
    CREATE TABLE IF NOT EXISTS tool_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        tool_id TEXT,
        tool_name TEXT,
        data TEXT,
        last_accessed INTEGER
    )
    """)
    db.commit()

@router.get("/history")
def get_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_history_table(db)
    result = db.execute(
        "SELECT tool_id, tool_name, data, last_accessed FROM tool_history WHERE user_id = ? ORDER BY last_accessed DESC",
        (current_user.id,)
    )
    rows = result.fetchall()
    return [
        {
            "toolId": row[0],
            "toolName": row[1],
            "data": row[2],
            "lastAccessed": row[3]
        } for row in rows
    ]

@router.post("/history")
def save_history(entry: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_history_table(db)
    # Upsert: falls vorhanden, update, sonst insert
    tool_id = entry.get("toolId")
    tool_name = entry.get("toolName")
    data = entry.get("data")
    last_accessed = entry.get("lastAccessed")
    exists = db.execute(
        "SELECT id FROM tool_history WHERE user_id = ? AND tool_id = ?",
        (current_user.id, tool_id)
    ).fetchone()
    if exists:
        db.execute(
            "UPDATE tool_history SET tool_name = ?, data = ?, last_accessed = ? WHERE user_id = ? AND tool_id = ?",
            (tool_name, data, last_accessed, current_user.id, tool_id)
        )
    else:
        db.execute(
            "INSERT INTO tool_history (user_id, tool_id, tool_name, data, last_accessed) VALUES (?, ?, ?, ?, ?)",
            (current_user.id, tool_id, tool_name, data, last_accessed)
        )
    db.commit()
    return {"status": "ok"}
