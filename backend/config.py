"""
Backend Configuration for Railway Reservation System
Supports both MySQL and embedded local fallback for 100% offline local running.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SECRET_KEY = os.environ.get('SECRET_KEY', 'skyline_railway_secret_key_mca_project_2026')

# Local MySQL Database Settings
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'root')
MYSQL_DB = os.environ.get('MYSQL_DB', 'railway_reservation_db')

# SQLite Local File Fallback for zero-dependency local execution
SQLITE_DB_PATH = os.path.join(BASE_DIR, 'railway_local.db')
SQLITE_URI = f"sqlite:///{SQLITE_DB_PATH}"

# Primary MySQL URI
MYSQL_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

# Port settings
FLASK_PORT = int(os.environ.get('FLASK_PORT', 5000))
FLASK_HOST = os.environ.get('FLASK_HOST', '0.0.0.0')
DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
