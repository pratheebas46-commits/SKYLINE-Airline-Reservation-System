from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from backend.database import Base

class Payment(Base):
    __tablename__ = 'payments'

    id = Column(String(50), primary_key=True)
    booking_id = Column(String(50), ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(30), nullable=False, default='SUCCESS')
    transaction_reference = Column(String(100), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        amount_val = float(self.amount) if self.amount is not None else 0.0
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'bookingId': self.booking_id,
            'amount': amount_val,
            'payment_method': self.payment_method,
            'method': self.payment_method,
            'payment_status': self.payment_status,
            'status': self.payment_status,
            'transaction_reference': self.transaction_reference,
            'transactionRef': self.transaction_reference,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'paidAt': self.payment_date.isoformat() if self.payment_date else None
        }
