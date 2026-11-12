from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey('users.id', ondelete='RESTRICT'), nullable=False, index=True)
    train_id = Column(String(50), ForeignKey('trains.id', ondelete='RESTRICT'), nullable=False, index=True)
    pnr = Column(String(20), nullable=False, unique=True, index=True)
    journey_date = Column(String(30), nullable=False)
    class_type = Column(String(20), nullable=False)
    total_fare = Column(Numeric(10, 2), nullable=False)
    booking_status = Column(String(30), nullable=False, default='CONFIRMED')
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    passengers = relationship("BookingPassenger", back_populates="booking", cascade="all, delete-orphan", lazy="joined")
    user = relationship("User", lazy="joined")
    train = relationship("Train", lazy="joined")

    def to_dict(self):
        total_fare_val = float(self.total_fare) if self.total_fare is not None else 0.0
        
        passengers_data = [p.to_dict() for p in self.passengers] if self.passengers else []
        selected_seats = [p.seat_number for p in self.passengers if p.seat_number] if self.passengers else []

        train_dict = self.train.to_dict() if self.train else None

        return {
            'id': self.id,
            'user_id': self.user_id,
            'userId': self.user_id,
            'train_id': self.train_id,
            'flightId': self.train_id,
            'pnr': self.pnr,
            'journey_date': self.journey_date,
            'bookingDate': self.created_at.isoformat() if self.created_at else None,
            'class_type': self.class_type,
            'cabinClass': self.class_type,
            'total_fare': total_fare_val,
            'totalPrice': total_fare_val,
            'booking_status': self.booking_status,
            'status': self.booking_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'passengers': passengers_data,
            'selectedSeats': selected_seats,
            'train': train_dict,
            'flight': train_dict
        }

class BookingPassenger(Base):
    __tablename__ = 'booking_passengers'

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String(50), ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    passenger_id = Column(String(50), nullable=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    seat_number = Column(String(20), nullable=True)
    berth_preference = Column(String(30), nullable=True)
    concession_type = Column(String(30), nullable=True, default='REGULAR')

    booking = relationship("Booking", back_populates="passengers")

    def to_dict(self):
        return {
            'id': self.passenger_id or str(self.id),
            'fullName': self.name,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'seat_number': self.seat_number,
            'seatNumber': self.seat_number,
            'berth_preference': self.berth_preference,
            'concessionType': self.concession_type or 'REGULAR'
        }
