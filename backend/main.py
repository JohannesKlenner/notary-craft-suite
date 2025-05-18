from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base
from routes import erbfolge, miteigentum

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

# Include routers
app.include_router(erbfolge.router, prefix="/api/erbfolge", tags=["erbfolge"])
app.include_router(miteigentum.router, prefix="/api/miteigentum", tags=["miteigentum"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)