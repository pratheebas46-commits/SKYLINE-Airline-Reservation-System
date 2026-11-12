from backend.routes.auth_routes import auth_bp
from backend.routes.train_routes import train_bp
from backend.routes.booking_routes import booking_bp
from backend.routes.recommendation_routes import recommendation_bp

__all__ = [
    'auth_bp',
    'train_bp',
    'booking_bp',
    'recommendation_bp'
]
