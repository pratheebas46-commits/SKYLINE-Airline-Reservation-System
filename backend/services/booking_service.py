import uuid
import random
import datetime
from decimal import Decimal
from backend.database import SessionLocal
from backend.models.booking import Booking, BookingPassenger
from backend.models.train import Train
from backend.models.seat import Seat
from backend.models.passenger import Passenger
from backend.models.payment import Payment
from backend.models.cancellation import Cancellation

def generate_unique_pnr(db):
    """Generates a unique 10-digit railway style PNR."""
    while True:
        first_digit = str(random.randint(2, 8))
        remaining = ''.join(str(random.randint(0, 9)) for _ in range(9))
        pnr = first_digit + remaining
        existing = db.query(Booking).filter(Booking.pnr == pnr).first()
        if not existing:
            return pnr

def create_booking(user_id, train_id, journey_date, class_type, passengers_list, selected_seats, total_fare, payment_method='UPI'):
    db = SessionLocal()
    try:
        # Verify train
        train = db.query(Train).filter((Train.id == train_id) | (Train.train_number == train_id)).first()
        if not train:
            return {'success': False, 'message': f'Train {train_id} not found.'}, 404
        
        actual_train_id = train.id
        
        # Check and prevent duplicate seat booking
        if selected_seats:
            for seat_num in selected_seats:
                seat = db.query(Seat).filter(
                    Seat.train_id == actual_train_id,
                    Seat.seat_number == seat_num,
                    Seat.seat_status == 'booked'
                ).first()
                if seat:
                    return {'success': False, 'message': f'Seat {seat_num} is already booked. Please select another seat.'}, 400

        # Ensure user exists for foreign key constraint
        from backend.models.user import User
        user_record = db.query(User).filter(User.id == user_id).first()
        if not user_record:
            first_user = db.query(User).first()
            if first_user:
                actual_user_id = first_user.id
            else:
                guest_user = User(
                    id='USR-GUEST',
                    name='Guest Passenger',
                    email='guest@railway.local',
                    phone='9876543210',
                    password='guest',
                    role='customer'
                )
                db.add(guest_user)
                db.flush()
                actual_user_id = guest_user.id
        else:
            actual_user_id = user_record.id

        # Generate PNR and IDs
        pnr = generate_unique_pnr(db)
        booking_id = f"BKG-{uuid.uuid4().hex[:8].upper()}"

        new_booking = Booking(
            id=booking_id,
            user_id=actual_user_id,
            train_id=actual_train_id,
            pnr=pnr,
            journey_date=journey_date or datetime.date.today().strftime('%Y-%m-%d'),
            class_type=class_type or 'Economy',
            total_fare=Decimal(str(total_fare)),
            booking_status='CONFIRMED',
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_booking)

        # Store passengers and booking_passengers
        for idx, p in enumerate(passengers_list):
            p_name = p.get('fullName') or p.get('name') or f"Passenger {idx+1}"
            p_age = int(p.get('age') or 28)
            p_gender = p.get('gender') or 'Male'
            p_id_num = p.get('idNumber') or p.get('passportNumber') or f"ID-{random.randint(10000, 99999)}"
            p_seat = selected_seats[idx] if idx < len(selected_seats) else f"{idx+1}A"
            p_berth = p.get('berthPreference') or p.get('berth_preference') or 'Window'
            p_concession = p.get('concessionType') or 'REGULAR'

            passenger_id = p.get('id') or f"PSG-{uuid.uuid4().hex[:6].upper()}"
            # Only save to saved travellers if explicitly requested
            if p.get('save_passenger') and user_id:
                clean_name = p_name.strip()
                existing_psg = db.query(Passenger).filter(
                    Passenger.user_id == user_id,
                    Passenger.name.ilike(clean_name)
                ).first()
                if not existing_psg:
                    db.add(Passenger(
                        id=passenger_id,
                        user_id=user_id,
                        name=clean_name,
                        age=p_age,
                        gender=p_gender,
                        id_number=p_id_num
                    ))

            bp = BookingPassenger(
                booking_id=booking_id,
                passenger_id=passenger_id,
                name=p_name,
                age=p_age,
                gender=p_gender,
                seat_number=p_seat,
                berth_preference=p_berth,
                concession_type=p_concession
            )
            db.add(bp)

            # Update seat status in database to prevent double booking
            seat_record = db.query(Seat).filter(
                Seat.train_id == actual_train_id,
                Seat.seat_number == p_seat
            ).first()
            if seat_record:
                seat_record.seat_status = 'booked'
            else:
                # Add seat as booked
                db.add(Seat(
                    id=f"SEAT-{actual_train_id}-{p_seat}",
                    train_id=actual_train_id,
                    class_type=class_type or 'Economy',
                    seat_number=p_seat,
                    seat_status='booked',
                    fare=Decimal(str(total_fare)) / len(passengers_list)
                ))

        # Record Simulated Local Payment
        payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        tx_ref = f"TXN-RAIL-{random.randint(10000000, 99999999)}"
        new_payment = Payment(
            id=payment_id,
            booking_id=booking_id,
            amount=Decimal(str(total_fare)),
            payment_method=payment_method or 'UPI',
            payment_status='SUCCESS',
            transaction_reference=tx_ref,
            payment_date=datetime.datetime.utcnow()
        )
        db.add(new_payment)

        # Update available seats count on train
        if train.available_seats > len(passengers_list):
            train.available_seats -= len(passengers_list)

        db.commit()
        db.refresh(new_booking)

        return {
            'success': True,
            'pnr': pnr,
            'bookingId': booking_id,
            'booking': new_booking.to_dict(),
            'transactionRef': tx_ref
        }, 201

    except Exception as e:
        db.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close()

def get_booking_by_pnr(pnr):
    db = SessionLocal()
    try:
        clean_pnr = pnr.strip()
        booking = db.query(Booking).filter(Booking.pnr == clean_pnr).first()
        if not booking:
            return None
        return booking.to_dict()
    finally:
        db.close()

def get_user_bookings(user_id=None):
    db = SessionLocal()
    try:
        query = db.query(Booking)
        if user_id:
            query = query.filter(Booking.user_id == user_id)
        bookings = query.order_by(Booking.created_at.desc()).all()
        return [b.to_dict() for b in bookings]
    finally:
        db.close()

def cancel_booking(pnr, reason='Customer requested cancellation'):
    db = SessionLocal()
    try:
        clean_pnr = pnr.strip()
        booking = db.query(Booking).filter(Booking.pnr == clean_pnr).first()
        if not booking:
            return {'success': False, 'message': f'Booking with PNR {clean_pnr} not found.'}, 404

        if booking.booking_status == 'CANCELLED':
            return {'success': False, 'message': 'This booking has already been cancelled.'}, 400

        # Update booking status
        booking.booking_status = 'CANCELLED'

        # Release seats
        for bp in booking.passengers:
            if bp.seat_number:
                seat = db.query(Seat).filter(
                    Seat.train_id == booking.train_id,
                    Seat.seat_number == bp.seat_number
                ).first()
                if seat:
                    seat.seat_status = 'available'

        # Restore available seats count on train
        train = db.query(Train).filter(Train.id == booking.train_id).first()
        if train:
            train.available_seats += len(booking.passengers)

        # Calculate refund using standard railway refund policy (85% refund, 15% cancellation fee)
        total_fare_val = float(booking.total_fare)
        refund_amount = round(total_fare_val * 0.85, 2)

        # Record cancellation and refund
        cancellation_id = f"CAN-{uuid.uuid4().hex[:8].upper()}"
        cancellation = Cancellation(
            id=cancellation_id,
            booking_id=booking.id,
            reason=reason or 'Customer cancellation',
            refund_amount=Decimal(str(refund_amount)),
            cancellation_status='PROCESSED',
            cancellation_date=datetime.datetime.utcnow()
        )
        db.add(cancellation)

        # Update payment status
        payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
        if payment:
            payment.payment_status = 'REFUNDED'

        db.commit()

        return {
            'success': True,
            'message': f'Booking {clean_pnr} has been successfully cancelled.',
            'refundAmount': refund_amount,
            'cancellation': cancellation.to_dict(),
            'booking': booking.to_dict()
        }, 200

    except Exception as e:
        db.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close()

def get_saved_travellers(user_id):
    if not user_id:
        return []
    db = SessionLocal()
    try:
        passengers = db.query(Passenger).filter(Passenger.user_id == user_id).all()
        return [p.to_dict() for p in passengers]
    finally:
        db.close()

def save_traveller(user_id, data):
    if not user_id:
        return {'success': False, 'message': 'User ID is required.'}, 400
    name = (data.get('fullName') or data.get('name') or '').strip()
    if not name:
        return {'success': False, 'message': 'Traveler full name is required.'}, 400

    db = SessionLocal()
    try:
        # Check duplicate by name for this user
        existing = db.query(Passenger).filter(
            Passenger.user_id == user_id,
            Passenger.name.ilike(name)
        ).first()

        if existing:
            # Update existing to avoid duplicate
            existing.age = int(data.get('age') or existing.age)
            existing.gender = data.get('gender') or existing.gender
            if data.get('passportNumber') or data.get('id_number') or data.get('idNumber'):
                existing.id_number = data.get('passportNumber') or data.get('id_number') or data.get('idNumber')
            db.commit()
            db.refresh(existing)
            return {'success': True, 'traveller': existing.to_dict(), 'message': 'Traveler updated successfully.'}, 200

        new_id = f"PSG-{uuid.uuid4().hex[:6].upper()}"
        new_traveller = Passenger(
            id=new_id,
            user_id=user_id,
            name=name,
            age=int(data.get('age') or 28),
            gender=data.get('gender') or 'Male',
            id_number=data.get('passportNumber') or data.get('id_number') or data.get('idNumber') or ''
        )
        db.add(new_traveller)
        db.commit()
        db.refresh(new_traveller)
        return {'success': True, 'traveller': new_traveller.to_dict(), 'message': 'Traveler saved successfully.'}, 201
    except Exception as e:
        db.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close()

def delete_saved_traveller(user_id, traveller_id):
    db = SessionLocal()
    try:
        traveller = db.query(Passenger).filter(
            Passenger.id == traveller_id,
            Passenger.user_id == user_id
        ).first()
        if not traveller:
            return {'success': False, 'message': 'Traveler not found.'}, 404
        db.delete(traveller)
        db.commit()
        return {'success': True, 'message': 'Traveler removed successfully.'}, 200
    except Exception as e:
        db.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close()

