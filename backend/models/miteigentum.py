
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database.db import Base

class Miteigentum(Base):
    __tablename__ = "miteigentum"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    objekt = Column(String)
    anteil = Column(Float)
    ergebnis = Column(String)
    
    user = relationship("User", back_populates="miteigentum_berechnungen")
