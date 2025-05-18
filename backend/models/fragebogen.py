from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from ..database.db import Base

class Fragebogen(Base):
    __tablename__ = "fragebogen"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    struktur = Column(Text)  # JSON als Text
