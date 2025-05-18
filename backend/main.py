from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base
from routes import erbfolge, miteigentum, history
from export import exporter
from feedback import email
from auth import users

app = FastAPI(title="Notary Tools API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Auth
app.include_router(users.router)

# Tool-Routen
app.include_router(erbfolge.router, prefix="/tools/erbfolge", tags=["tools"])
app.include_router(miteigentum.router, prefix="/tools/miteigentum", tags=["tools"])
app.include_router(history.router, prefix="/history", tags=["history"])

# Export
app.include_router(exporter.router, prefix="/export", tags=["export"])

# Feedback
app.include_router(email.router, prefix="/feedback", tags=["feedback"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)