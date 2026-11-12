#!/usr/bin/env python3
"""
Forwarder script to run database initialization from inside the backend directory.
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from init_mysql_db import main

if __name__ == "__main__":
    main()
