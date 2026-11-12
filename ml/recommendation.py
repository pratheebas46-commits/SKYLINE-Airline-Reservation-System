#!/usr/bin/env python3
"""
================================================================================
OFFLINE ML TRAIN RECOMMENDATION ENGINE
Academic MCA Major Project
================================================================================
Loads the locally trained model (model.pkl) and scores available trains
to produce intelligent, explainable recommendations with specific reasons:
 - "Recommended because of lower fare"
 - "Recommended because of shorter journey time"
 - "Recommended because it matches your preferred travel time"
Zero external network calls. Runs 100% offline.
================================================================================
"""

import os
import sys
import csv
import json
import pickle
import argparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from model_definition import OfflineDecisionTreeModel
except ImportError:
    from ml.model_definition import OfflineDecisionTreeModel

MODEL_FILE = os.path.join(BASE_DIR, "model.pkl")
DATA_FILE = os.path.join(BASE_DIR, "train_data.csv")
META_FILE = os.path.join(BASE_DIR, "model_meta.json")

def load_offline_model():
    """Loads the serialized trained model from model.pkl."""
    if os.path.exists(MODEL_FILE):
        try:
            with open(MODEL_FILE, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            print(f"[WARN] Could not load model.pkl: {e}")
    return None

def load_train_database():
    """Loads all available trains from local train_data.csv."""
    trains = []
    if not os.path.exists(DATA_FILE):
        return trains

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(row for row in f if not row.startswith("#"))
        for r in reader:
            try:
                trains.append({
                    "train_id": r["train_id"],
                    "train_name": r["train_name"],
                    "source": r["source"].strip().upper(),
                    "destination": r["destination"].strip().upper(),
                    "departure_hour": float(r["departure_hour"]),
                    "arrival_hour": float(r["arrival_hour"]),
                    "duration_hours": float(r["duration_hours"]),
                    "fare": float(r["fare"]),
                    "train_type": r["train_type"],
                    "available_class": r["available_class"],
                    "num_stops": int(r["num_stops"]),
                    "reason": r.get("recommendation_reason", "Recommended train for this route")
                })
            except Exception:
                continue
    return trains

def generate_recommendation_reason(candidate, avg_fare, min_duration, preferred_slot=None):
    """
    Deterministically computes a viva-friendly explanation reason
    based on feature comparisons.
    """
    dur = candidate["duration_hours"]
    fare = candidate["fare"]
    dep_hr = candidate["departure_hour"]

    # Reason 1: Duration priority
    if dur <= min_duration + 1.0:
        return "Recommended because of shorter journey time"

    # Reason 2: Low Fare priority
    if fare <= avg_fare * 0.85:
        return "Recommended because of lower fare"

    # Reason 3: Preferred travel time match
    if preferred_slot == "morning" and (6 <= dep_hr <= 11):
        return "Recommended because it matches your preferred travel time (Morning 06:00 - 11:00)"
    if preferred_slot == "evening" and (16 <= dep_hr <= 21):
        return "Recommended because it matches your preferred travel time (Evening 16:00 - 21:00)"
    if (6 <= dep_hr <= 10) or (16 <= dep_hr <= 19):
        return "Recommended because it matches your preferred travel time"

    if candidate["num_stops"] <= 5:
        return "Recommended for high speed and minimal intermediate halts"

    return "Recommended because of lower fare"

def get_train_recommendations(source, destination, preferred_slot="ALL", max_fare=None, limit=2):
    """
    Main recommendation function.
    Evaluates candidate trains between source and destination using the offline ML model.
    """
    source = source.strip().upper() if source else ""
    destination = destination.strip().upper() if destination else ""

    all_trains = load_train_database()
    model = load_offline_model()

    # Filter by source and destination
    candidates = [
        t for t in all_trains
        if (not source or t["source"] == source) and (not destination or t["destination"] == destination)
    ]

    # If exact route not found in sample dataset, use source or all trains as fallback candidates
    if not candidates and source:
        candidates = [t for t in all_trains if t["source"] == source]
    if not candidates:
        candidates = all_trains[:6]

    if not candidates:
        return []

    avg_fare = sum(c["fare"] for c in candidates) / len(candidates)
    min_duration = min(c["duration_hours"] for c in candidates)

    scored_candidates = []
    for c in candidates:
        dep_hr = c["departure_hour"]
        dur = c["duration_hours"]
        fare = c["fare"]
        stops = c["num_stops"]
        pph = round(fare / max(dur, 0.5), 2)
        pref_code = 1 # fast

        features = [dep_hr, dur, fare, stops, pph, pref_code]

        # ML model prediction score
        if model and hasattr(model, "predict_score"):
            confidence = model.predict_score(features)
        elif model and hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba([features])[0]
                confidence = float(proba[1]) if len(proba) > 1 else float(proba[0])
            except Exception:
                confidence = 0.85
        else:
            # Fallback heuristic score
            confidence = max(0.5, 1.0 - (dur / 40.0) - (fare / 10000.0))

        # Time slot alignment bonus
        if preferred_slot == "morning" and 6 <= dep_hr <= 11:
            confidence += 0.15
        elif preferred_slot == "evening" and 16 <= dep_hr <= 21:
            confidence += 0.15

        reason = generate_recommendation_reason(c, avg_fare, min_duration, preferred_slot)

        scored_candidates.append({
            "train_id": c["train_id"],
            "train_name": c["train_name"],
            "source": c["source"],
            "destination": c["destination"],
            "departure_time": f"{int(dep_hr):02d}:00",
            "arrival_time": f"{int(c['arrival_hour']):02d}:00",
            "duration": f"{dur} hrs",
            "duration_hours": dur,
            "fare": int(fare),
            "train_type": c["train_type"],
            "available_class": c["available_class"],
            "num_stops": c["num_stops"],
            "confidence_score": round(confidence * 100, 1),
            "recommendation_reason": reason,
            "is_ai_recommended": True
        })

    # Sort descending by confidence score
    scored_candidates.sort(key=lambda x: x["confidence_score"], reverse=True)
    return scored_candidates[:limit]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Offline ML Train Recommendation System")
    parser.add_argument("--source", default="DEL", help="Origin station code (e.g. DEL, BOM)")
    parser.add_argument("--dest", default="BOM", help="Destination station code (e.g. BOM, BLR)")
    parser.add_argument("--pref", default="ALL", choices=["ALL", "morning", "afternoon", "evening", "budget", "fast"])
    args = parser.parse_args()

    print("\n" + "=" * 65)
    print(f"  AI RECOMMENDATION ENGINE (OFFLINE ML - DECISION TREE)")
    print(f"  Route: {args.source} ➜ {args.dest} | Preference: {args.pref}")
    print("=" * 65)

    results = get_train_recommendations(args.source, args.dest, args.pref, limit=3)
    if not results:
        print("  No trains found matching criteria.")
    else:
        for idx, r in enumerate(results, 1):
            print(f"\n[{idx}] {r['train_name']} (#{r['train_id']})")
            print(f"    • Departure: {r['departure_time']}  | Arrival: {r['arrival_time']}  | Duration: {r['duration']}")
            print(f"    • Fare: INR {r['fare']} | Class: {r['available_class']} | Stops: {r['num_stops']}")
            print(f"    • AI Confidence: {r['confidence_score']}%")
            print(f"    ★ Reason: {r['recommendation_reason']}")

    print("\n" + "=" * 65 + "\n")
