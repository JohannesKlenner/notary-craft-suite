from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database.db import Base

class GNotKG(Base):
    __tablename__ = "gnotkg"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    geschaeftswert = Column(Float)
    vorgangsart = Column(String)
    gebuehr = Column(Float)
    user = relationship("User", back_populates="gnotkg_berechnungen")
