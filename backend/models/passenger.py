from sqlalchemy import Column, String, Integer, ForeignKey
from backend.database import Base

class Passenger(Base):
    __tablename__ = 'passengers'

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    id_number = Column(String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'fullName': self.name,
            'age': self.age,
            'gender': self.gender,
            'id_number': self.id_number,
            'passportNumber': self.id_number
        }
