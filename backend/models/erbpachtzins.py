from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database.db import Base

class Erbpachtzins(Base):
    __tablename__ = "erbpachtzins"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    aktueller_zins = Column(Float)
    alter_index = Column(Float)
    neuer_index = Column(Float)
    neuer_zins = Column(Float)
    user = relationship("User", back_populates="erbpachtzins_berechnungen")
