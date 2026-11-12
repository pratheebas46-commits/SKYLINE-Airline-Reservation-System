"""
Domestic Railway Reservation System - Local Flask Backend
Academic MCA Major Project
100% Offline execution on localhost. No external APIs or cloud keys.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from flask import Flask, jsonify, request, session
from flask_cors import CORS

from backend import config
from backend.database import init_db, SessionLocal
from backend.seed_data import run_seed
from backend.models.train import Train

from backend.routes.auth_routes import auth_bp
from backend.routes.train_routes import train_bp
from backend.routes.booking_routes import booking_bp
from backend.routes.recommendation_routes import recommendation_bp

def create_app():
    app = Flask(__name__)
    app.secret_key = config.SECRET_KEY
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

    # Enable CORS for localhost frontend communication
    CORS(app, supports_credentials=True, origins=["*"])

    # Ensure database is initialized and seeded
    try:
        init_db()
        db = SessionLocal()
        train_count = db.query(Train).count()
        db.close()
        if train_count == 0:
            print("[INFO] Database empty. Running initial seed...")
            run_seed()
    except Exception as e:
        print(f"[WARN] Database initialization warning: {e}")

    # Register blueprints with root routes
    app.register_blueprint(auth_bp)
    app.register_blueprint(train_bp)
    app.register_blueprint(booking_bp)
    app.register_blueprint(recommendation_bp)

    # Also register with /api prefix for proxy convenience with unique names
    app.register_blueprint(auth_bp, url_prefix='/api', name='api_auth')
    app.register_blueprint(train_bp, url_prefix='/api', name='api_trains')
    app.register_blueprint(booking_bp, url_prefix='/api', name='api_bookings')
    app.register_blueprint(recommendation_bp, url_prefix='/api', name='api_recommendations')

    @app.route('/')
    def root():
        return jsonify({
            'status': 'online',
            'system': 'Domestic Railway Reservation System Backend',
            'version': '1.0.0',
            'mode': '100% Offline Localhost',
            'routes': [
                '/register',
                '/login',
                '/trains',
                '/trains/<id>',
                '/seats/<train_id>',
                '/bookings',
                '/bookings/<id>',
                '/cancel-booking',
                '/payment',
                '/ticket/<pnr>',
                '/recommendations'
            ]
        })

    @app.route('/favicon.ico')
    def favicon():
        return ('', 204)

    @app.route('/health')
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'offline': True
        })

    return app

app = create_app()

if __name__ == '__main__':
    port = config.FLASK_PORT
    host = config.FLASK_HOST
    print(f"==================================================")
    print(f" Domestic Railway Reservation System Flask Backend")
    print(f" Running locally on http://{host}:{port}")
    print(f" 100% Offline Local Architecture")
    print(f"==================================================")
    app.run(host=host, port=port, debug=config.DEBUG)
