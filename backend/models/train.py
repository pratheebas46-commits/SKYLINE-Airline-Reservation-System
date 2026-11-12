from sqlalchemy import Column, String, Integer, Numeric
from backend.database import Base

class Train(Base):
    __tablename__ = 'trains'

    id = Column(String(50), primary_key=True)
    train_number = Column(String(20), nullable=False, unique=True, index=True)
    train_name = Column(String(100), nullable=False)
    source = Column(String(20), nullable=False, index=True)
    destination = Column(String(20), nullable=False, index=True)
    departure_time = Column(String(20), nullable=False)
    arrival_time = Column(String(20), nullable=False)
    journey_duration = Column(String(50), nullable=False)
    train_type = Column(String(50), nullable=False)
    status = Column(String(30), nullable=False, default='On Time')
    fare = Column(Numeric(10, 2), nullable=False, default=1500.00)
    available_seats = Column(Integer, nullable=False, default=120)

    def to_dict(self):
        fare_float = float(self.fare) if self.fare is not None else 1500.0
        return {
            'id': self.id,
            'train_number': self.train_number,
            'train_name': self.train_name,
            'source': self.source,
            'destination': self.destination,
            'departure_time': self.departure_time,
            'arrival_time': self.arrival_time,
            'journey_duration': self.journey_duration,
            'train_type': self.train_type,
            'status': self.status,
            'fare': fare_float,
            'available_seats': self.available_seats,
            
            # Compatible with existing frontend keys
            'flightNumber': self.train_number,
            'airline': self.train_name,
            'originCode': self.source,
            'destinationCode': self.destination,
            'departureTime': self.departure_time,
            'arrivalTime': self.arrival_time,
            'duration': self.journey_duration,
            'basePrice': fare_float,
            'availableSeats': self.available_seats,
            'stops': 0,
            'gate': 'Plat-1',
            'terminal': 'Main',
            'businessMultiplier': 1.6,
            'firstMultiplier': 2.4
        }
