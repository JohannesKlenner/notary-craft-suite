from fastapi import APIRouter

router = APIRouter(prefix="/export", tags=["export"])

@router.post("/{format}")
def export_file(format: str):
    # Dummy-Exportfunktion
    return {"status": "Export (Dummy)", "format": format}
