from datetime import datetime
from sqlalchemy import Column, String, DateTime
from backend.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='customer')
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'fullName': self.name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
