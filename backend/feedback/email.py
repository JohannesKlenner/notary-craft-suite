from fastapi import APIRouter

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("/send")
def send_feedback():
    # Dummy-Feedbackfunktion
    return {"status": "Feedback gesendet (Dummy)"}
