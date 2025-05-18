
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database.db import Base

class Erbfolge(Base):
    __tablename__ = "erbfolge"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    erblasser = Column(String)
    vermoegenswert = Column(Float)
    ergebnis = Column(String)
    
    user = relationship("User", back_populates="erbfolge_berechnungen")
