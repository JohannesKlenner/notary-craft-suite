from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from ..database.db import Base

class Textbaustein(Base):
    __tablename__ = "textbaustein"
    id = Column(String, primary_key=True, index=True)
    kategorie = Column(String)
    titel = Column(String)
    text = Column(Text)
