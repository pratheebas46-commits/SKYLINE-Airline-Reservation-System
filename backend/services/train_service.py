import uuid
from backend.database import SessionLocal
from backend.models.train import Train
from backend.models.seat import Seat

def get_all_trains():
    db = SessionLocal()
    try:
        trains = db.query(Train).all()
        return [t.to_dict() for t in trains]
    finally:
        db.close()

def get_train_by_id(train_id):
    db = SessionLocal()
    try:
        train = db.query(Train).filter((Train.id == train_id) | (Train.train_number == train_id)).first()
        return train.to_dict() if train else None
    finally:
        db.close()

def search_trains(source, destination, journey_date=None, class_type=None):
    db = SessionLocal()
    try:
        query = db.query(Train)
        if source:
            query = query.filter(Train.source.ilike(f"%{source.strip()}%"))
        if destination:
            query = query.filter(Train.destination.ilike(f"%{destination.strip()}%"))
        
        trains = query.all()
        result = [t.to_dict() for t in trains]

        # If date provided, include departureDate in response
        if journey_date:
            for item in result:
                item['departureDate'] = journey_date

        return result
    finally:
        db.close()

def get_seats_for_train(train_id, class_type=None):
    db = SessionLocal()
    try:
        # Match by train_id or train_number
        train = db.query(Train).filter((Train.id == train_id) | (Train.train_number == train_id)).first()
        if not train:
            return []

        actual_id = train.id
        query = db.query(Seat).filter(Seat.train_id == actual_id)
        if class_type:
            query = query.filter(Seat.class_type.ilike(f"%{class_type.strip()}%"))
        
        seats = query.all()
        if not seats:
            # Auto-generate standard coach seats for demo if not already populated
            seats = auto_generate_train_seats(db, actual_id, float(train.fare))
            db.commit()
            
        return [s.to_dict() for s in seats]
    finally:
        db.close()

def auto_generate_train_seats(db, train_id, base_fare):
    generated = []
    classes = [
        ('Economy', 1.0, 15), # 15 rows of Economy (rows 1-15)
        ('Business', 1.6, 5),  # 5 rows of Business (rows 16-20)
        ('First', 2.4, 3)      # 3 rows of First (rows 21-23)
    ]
    
    current_row = 1
    for cls_name, multiplier, num_rows in classes:
        cls_fare = round(base_fare * multiplier, 2)
        for _ in range(num_rows):
            for col in ['A', 'B', 'C', 'D', 'E', 'F']:
                seat_num = f"{current_row}{col}"
                # A few booked seats for realistic realism
                is_booked = (current_row in [3, 7, 12, 18] and col in ['B', 'E'])
                status = 'booked' if is_booked else 'available'
                s = Seat(
                    id=f"SEAT-{train_id}-{seat_num}",
                    train_id=train_id,
                    class_type=cls_name,
                    seat_number=seat_num,
                    seat_status=status,
                    fare=cls_fare
                )
                db.add(s)
                generated.append(s)
            current_row += 1
            
    db.flush()
    return generated
