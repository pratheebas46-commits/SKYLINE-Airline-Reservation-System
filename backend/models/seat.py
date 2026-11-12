from sqlalchemy import Column, String, Numeric, ForeignKey
from backend.database import Base

class Seat(Base):
    __tablename__ = 'seats'

    id = Column(String(50), primary_key=True)
    train_id = Column(String(50), ForeignKey('trains.id', ondelete='CASCADE'), nullable=False, index=True)
    class_type = Column(String(20), nullable=False)
    seat_number = Column(String(20), nullable=False)
    seat_status = Column(String(20), nullable=False, default='available')
    fare = Column(Numeric(10, 2), nullable=False)

    def to_dict(self):
        # Extract row and column if in format like "12A"
        row_num = 1
        col_letter = 'A'
        digits = ''.join(ch for ch in self.seat_number if ch.isdigit())
        letters = ''.join(ch for ch in self.seat_number if ch.isalpha())
        if digits:
            try:
                row_num = int(digits)
            except ValueError:
                pass
        if letters:
            col_letter = letters[-1]

        fare_float = float(self.fare) if self.fare is not None else 0.0

        return {
            'id': self.id,
            'train_id': self.train_id,
            'flightId': self.train_id,
            'class_type': self.class_type,
            'cabinClass': self.class_type,
            'seat_number': self.seat_number,
            'seatNumber': self.seat_number,
            'seat_status': self.seat_status,
            'isBooked': self.seat_status == 'booked',
            'fare': fare_float,
            'row': row_num,
            'col': col_letter,
            'isPremium': row_num <= 2,
            'extraPrice': 300 if row_num <= 2 else 0
        }
