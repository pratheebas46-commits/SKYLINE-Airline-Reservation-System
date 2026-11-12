from flask import Blueprint, request, jsonify, session
from backend.services.booking_service import (
    create_booking,
    get_booking_by_pnr,
    get_user_bookings,
    cancel_booking
)

booking_bp = Blueprint('bookings', __name__)

@booking_bp.route('/bookings', methods=['POST'])
def new_booking():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    user_id = data.get('user_id') or data.get('userId') or session.get('user_id') or 'USR-001'
    train_id = data.get('train_id') or data.get('trainId') or data.get('flightId')
    journey_date = data.get('journey_date') or data.get('journeyDate') or data.get('departureDate')
    class_type = data.get('class_type') or data.get('classType') or data.get('cabinClass') or 'Economy'
    passengers = data.get('passengers') or []
    selected_seats = data.get('selectedSeats') or data.get('seats') or []
    total_fare = data.get('total_fare') or data.get('totalPrice') or 0.0
    payment_method = data.get('payment_method') or data.get('paymentMethod') or 'UPI'

    if not train_id:
        return jsonify({'success': False, 'message': 'Train ID is required.'}), 400

    if not passengers:
        return jsonify({'success': False, 'message': 'At least one passenger is required.'}), 400

    result, status_code = create_booking(
        user_id=user_id,
        train_id=train_id,
        journey_date=journey_date,
        class_type=class_type,
        passengers_list=passengers,
        selected_seats=selected_seats,
        total_fare=total_fare,
        payment_method=payment_method
    )
    return jsonify(result), status_code

@booking_bp.route('/bookings', methods=['GET'])
def list_bookings():
    user_id = request.args.get('user_id') or request.args.get('userId') or session.get('user_id')
    bookings = get_user_bookings(user_id)
    return jsonify({
        'success': True,
        'count': len(bookings),
        'bookings': bookings
    })

@booking_bp.route('/bookings/<id>', methods=['GET'])
def get_booking(id):
    # Search by PNR first or ID
    booking = get_booking_by_pnr(id)
    if not booking:
        bookings = get_user_bookings()
        booking = next((b for b in bookings if b['id'] == id), None)

    if not booking:
        return jsonify({'success': False, 'message': 'Booking not found.'}), 404

    return jsonify({'success': True, 'booking': booking})

@booking_bp.route('/ticket/<pnr>', methods=['GET'])
def get_ticket(pnr):
    booking = get_booking_by_pnr(pnr)
    if not booking:
        return jsonify({'success': False, 'message': f'No ticket found for PNR {pnr}.'}), 404
    return jsonify({'success': True, 'ticket': booking, 'booking': booking})

@booking_bp.route('/cancel-booking', methods=['POST'])
def cancel():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    pnr = data.get('pnr') or data.get('bookingId')
    reason = data.get('reason', 'Passenger cancellation')

    if not pnr:
        return jsonify({'success': False, 'message': 'PNR is required for cancellation.'}), 400

    result, status_code = cancel_booking(pnr, reason)
    return jsonify(result), status_code

@booking_bp.route('/payment', methods=['POST'])
def process_payment():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    amount = data.get('amount', 0.0)
    method = data.get('method') or data.get('payment_method') or 'UPI'

    # Local simulated payment confirmation
    return jsonify({
        'success': True,
        'status': 'SUCCESS',
        'transactionReference': f"SIM-PAY-{method.upper()}-882194",
        'amount': amount,
        'message': 'Local simulated payment processed successfully.'
    })

@booking_bp.route('/travellers', methods=['GET'])
def list_travellers():
    from backend.services.booking_service import get_saved_travellers
    user_id = request.args.get('user_id') or request.args.get('userId') or session.get('user_id')
    if not user_id:
        return jsonify({'success': True, 'travellers': []})
    travellers = get_saved_travellers(user_id)
    return jsonify({'success': True, 'travellers': travellers})

@booking_bp.route('/travellers', methods=['POST'])
def add_traveller():
    from backend.services.booking_service import save_traveller
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    user_id = data.get('user_id') or data.get('userId') or session.get('user_id')
    result, status_code = save_traveller(user_id, data)
    return jsonify(result), status_code

@booking_bp.route('/travellers/<id>', methods=['DELETE'])
def remove_traveller(id):
    from backend.services.booking_service import delete_saved_traveller
    user_id = request.args.get('user_id') or request.args.get('userId') or session.get('user_id')
    result, status_code = delete_saved_traveller(user_id, id)
    return jsonify(result), status_code


