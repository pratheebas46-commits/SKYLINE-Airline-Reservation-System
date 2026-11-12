#!/usr/bin/env python3
"""
================================================================================
OFFLINE TRAIN RECOMMENDATION SYSTEM - MODEL TRAINING SCRIPT
Academic MCA Major Project
================================================================================
Algorithm: Decision Tree / Random Forest Classifier (Supervised Learning)
Dataset:   train_data.csv (Local railway journeys, features, and preferences)
Output:    model.pkl (Serialized trained model) and model_meta.json
Offline:   100% Local execution - No external APIs, cloud keys, or internet needed.
================================================================================
"""

import os
import csv
import json
import pickle
import math
import random
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from model_definition import OfflineDecisionTreeModel
except ImportError:
    from ml.model_definition import OfflineDecisionTreeModel

DATA_FILE = os.path.join(BASE_DIR, "train_data.csv")
MODEL_FILE = os.path.join(BASE_DIR, "model.pkl")
META_FILE = os.path.join(BASE_DIR, "model_meta.json")

def load_data(filepath):
    """Loads CSV dataset and extracts numeric/engineered feature matrix."""
    records = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(row for row in f if not row.startswith("#"))
        for r in reader:
            try:
                dep_hr = float(r["departure_hour"])
                arr_hr = float(r["arrival_hour"])
                dur = float(r["duration_hours"])
                fare = float(r["fare"])
                stops = float(r["num_stops"])
                label = int(r["is_recommended"])
                
                # Feature engineering: Fare efficiency (Price per hour)
                price_per_hour = round(fare / max(dur, 0.5), 2)
                
                # Encoded user preference priority:
                # 0: budget, 1: fast, 2: morning, 3: evening, 4: afternoon, 5: premium
                pref_map = {'budget': 0, 'fast': 1, 'morning': 2, 'evening': 3, 'afternoon': 4, 'premium': 5}
                pref_code = pref_map.get(r.get('user_preference', 'fast'), 1)

                records.append({
                    "train_id": r["train_id"],
                    "train_name": r["train_name"],
                    "source": r["source"].strip().upper(),
                    "destination": r["destination"].strip().upper(),
                    "train_type": r["train_type"],
                    "reason": r["recommendation_reason"],
                    "features": [dep_hr, dur, fare, stops, price_per_hour, pref_code],
                    "label": label
                })
            except Exception as e:
                continue
    return records


def train():
    print("=" * 60)
    print("STARTING OFFLINE ML TRAIN RECOMMENDATION SYSTEM TRAINING")
    print("=" * 60)
    print(f"[1/4] Loading local dataset from: {DATA_FILE}")

    records = load_data(DATA_FILE)
    print(f"      Total records loaded: {len(records)}")

    X = [r["features"] for r in records]
    y = [r["label"] for r in records]

    trained_with = "Pure Python Ensemble"
    model = None

    # Attempt Scikit-learn Random Forest if available in the environment
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score

        print("[2/4] Scikit-learn detected! Training RandomForestClassifier...")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
        rf = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42)
        rf.fit(X_train, y_train)
        y_pred = rf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        model = rf
        trained_with = "Scikit-Learn RandomForestClassifier"
        acc_pct = f"{round(acc * 100, 1)}%"
        print(f"      Model Accuracy on Test Split: {acc_pct}")
    except ImportError:
        print("[2/4] Training offline Decision Tree Engine (Zero dependency mode)...")
        model = OfflineDecisionTreeModel()
        model.fit(X, y)
        acc_pct = f"{round(model.accuracy_score * 100, 1)}%"
        print(f"      Model Training & Evaluation Accuracy: {acc_pct}")

    # Step 3: Save serialized model to model.pkl
    print(f"[3/4] Serializing model to: {MODEL_FILE}")
    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)
    print("      Model successfully saved locally (model.pkl)")

    # Step 4: Write metadata summary for easy inspection & admin dashboard
    meta = {
        "status": "READY",
        "algorithm": "Random Forest / Decision Tree Classifier",
        "library": trained_with,
        "num_training_records": len(records),
        "accuracy": acc_pct,
        "features_evaluated": [
            "departure_hour",
            "duration_hours",
            "ticket_fare",
            "number_of_stops",
            "price_per_hour_efficiency",
            "user_preference_code"
        ],
        "recommendation_reasons": [
            "Recommended because of lower fare",
            "Recommended because of shorter journey time",
            "Recommended because it matches your preferred travel time",
            "Recommended for high speed and minimal intermediate halts"
        ],
        "offline_verified": True,
        "external_api_dependencies": None
    }

    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"[4/4] Metadata written to: {META_FILE}")
    print("=" * 60)
    print("MODEL TRAINING COMPLETE! Ready for offline recommendation.")
    print("=" * 60)

if __name__ == "__main__":
    train()
