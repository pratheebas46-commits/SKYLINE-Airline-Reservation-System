# Offline AI/ML Train Recommendation Module
**MCA Major Project Documentation**

An offline, machine learning-driven train recommendation module that operates completely on the local computer with zero internet connectivity and zero external API dependencies.

---

## 1. Directory Structure

```text
ml/
├── train_data.csv        # Local CSV dataset of train routes, schedules, fares, and labels
├── train_model.py        # Model training script (Decision Tree / Random Forest)
├── model_definition.py   # Decision Tree model architecture and feature evaluation logic
├── model.pkl             # Locally saved / serialized trained model
├── model_meta.json       # Evaluation metrics, accuracy, and feature metadata
├── recommendation.py     # Inference script that loads model.pkl and produces recommendations
├── requirements.txt      # Python dependencies (pandas, numpy, scikit-learn, joblib)
└── README.md             # Guide and Viva Q&A
```

---

## 2. How to Run Locally

### Step 1: Install Dependencies (Optional if already installed)
```bash
cd ml
pip install -r requirements.txt
```

### Step 2: Train the Model Locally
```bash
python train_model.py
```
This reads `train_data.csv`, evaluates feature importance, computes accuracy (~94.8%), and serializes the trained model to `model.pkl`.

### Step 3: Test Recommendations via Command Line
```bash
python recommendation.py --source DEL --dest BOM --pref morning
```

---

## 3. Features Used in the ML Model

1. **Departure Hour (`departure_hour`)**: Analyzes travel timing preferences (morning vs. evening peak slots).
2. **Journey Duration (`duration_hours`)**: Identifies fastest express / superfast / Rajdhani services.
3. **Ticket Fare (`fare`)**: Detects budget-friendly options compared to route averages.
4. **Number of Halts (`num_stops`)**: Punctuality index based on intermediate station halts.
5. **Fare Efficiency (`price_per_hour`)**: Engineered feature representing value-for-money.
6. **User Preference Code (`user_preference`)**: Matches user filter (budget, fastest, time slot).

---

## 4. Viva-Friendly Q&A

### Q1: What is the AI/ML feature in this project?
**Answer:** It is an offline train recommendation system that assists passengers in choosing the most suitable train based on fare, journey duration, departure convenience, and route punctuality.

### Q2: What algorithm is used?
**Answer:** Decision Tree / Random Forest Classifier (Supervised Machine Learning).

### Q3: What data is used for training?
**Answer:** A local tabular dataset (`train_data.csv`) capturing realistic domestic train routes (Rajdhani, Shatabdi, Vande Bharat, Garib Rath, Superfast) with fare structures, timings, stops, and passenger selection labels.

### Q4: Why is Machine Learning used instead of hard-coded rules?
**Answer:** Real-world passengers evaluate multiple conflicting trade-offs simultaneously (e.g., higher speed vs. higher price vs. departure time). The ML model evaluates these multi-dimensional features holistically to rank and score the best options.

### Q5: Does this require any cloud APIs or internet?
**Answer:** No. Both training (`train_model.py`) and prediction (`recommendation.py`) execute 100% locally on the offline machine using Python and standard local files (`model.pkl`).
