"""
Database Connection and Session Management
Dual Engine: Connects to local MySQL database, with transparent SQLite fallback
for zero-friction local execution.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from backend import config

Base = declarative_base()

active_engine = None
active_db_type = 'sqlite'

def create_app_engine():
    global active_engine, active_db_type
    
    # Try MySQL first
    try:
        mysql_engine = create_engine(
            config.MYSQL_URI,
            pool_recycle=3600,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 2}
        )
        with mysql_engine.connect() as conn:
            pass
        active_engine = mysql_engine
        active_db_type = 'mysql'
        print(f"[DATABASE] Connected successfully to MySQL: {config.MYSQL_DB} on {config.MYSQL_HOST}")
        return active_engine
    except Exception as e:
        print(f"[DATABASE] MySQL not available locally ({e}). Using embedded SQLite database.")
        sqlite_engine = create_engine(
            config.SQLITE_URI,
            connect_args={"check_same_thread": False}
        )
        active_engine = sqlite_engine
        active_db_type = 'sqlite'
        return active_engine

engine = create_app_engine()
session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = scoped_session(session_factory)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend import models  # Register models with Base
    Base.metadata.create_all(bind=engine)
    print(f"[DATABASE] All tables verified/created successfully using {active_db_type.upper()}.")
