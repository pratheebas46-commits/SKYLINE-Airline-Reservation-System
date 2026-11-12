from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from backend.database import Base

class Cancellation(Base):
    __tablename__ = 'cancellations'

    id = Column(String(50), primary_key=True)
    booking_id = Column(String(50), ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    cancellation_date = Column(DateTime, default=datetime.utcnow)
    reason = Column(String(255), nullable=False)
    refund_amount = Column(Numeric(10, 2), nullable=False)
    cancellation_status = Column(String(30), nullable=False, default='PROCESSED')

    def to_dict(self):
        refund_val = float(self.refund_amount) if self.refund_amount is not None else 0.0
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'bookingId': self.booking_id,
            'cancellation_date': self.cancellation_date.isoformat() if self.cancellation_date else None,
            'cancelledAt': self.cancellation_date.isoformat() if self.cancellation_date else None,
            'reason': self.reason,
            'refund_amount': refund_val,
            'refundAmount': refund_val,
            'cancellation_status': self.cancellation_status,
            'status': self.cancellation_status
        }
