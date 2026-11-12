from flask import Blueprint, request, jsonify
from backend.services.train_service import get_all_trains, get_train_by_id, search_trains, get_seats_for_train

train_bp = Blueprint('trains', __name__)

@train_bp.route('/trains', methods=['GET'])
def list_trains():
    source = request.args.get('source') or request.args.get('origin')
    destination = request.args.get('destination') or request.args.get('dest')
    journey_date = request.args.get('date') or request.args.get('journey_date')
    class_type = request.args.get('class')

    if source or destination:
        results = search_trains(source, destination, journey_date, class_type)
    else:
        results = get_all_trains()
        
    return jsonify({
        'success': True,
        'count': len(results),
        'trains': results,
        'flights': results  # Alias for existing frontend compatibility
    })

@train_bp.route('/trains/<id>', methods=['GET'])
def train_detail(id):
    train = get_train_by_id(id)
    if not train:
        return jsonify({'success': False, 'message': 'Train not found.'}), 404
    return jsonify({'success': True, 'train': train, 'flight': train})

@train_bp.route('/seats/<train_id>', methods=['GET'])
def get_seats(train_id):
    class_type = request.args.get('class')
    seats = get_seats_for_train(train_id, class_type)
    return jsonify({
        'success': True,
        'train_id': train_id,
        'count': len(seats),
        'seats': seats
    })
