# Domestic Railway Reservation System with using Ethereum Blockchain Integration 

A comprehensive, production-grade Domestic Railway Reservation System featuring:
- **Frontend**: React 19 + TypeScript + Tailwind CSS (IRCTC-style booking flow: train search, class selection, interactive coach seat map, passenger form, local simulated payments, instant ticket generation, web check-in, dashboard).
- **Backend**: Python 3 + Flask + SQLAlchemy + MySQL Connector.
- **Database**: Local MySQL (`railway_reservation_db`) with automatic embedded SQLite fallback (`backend/railway_local.db`) for zero-dependency local execution.
- **Offline AI/ML**: Heuristic & Scikit-learn Decision Tree / Random Forest recommendation engine for personalized, explainable train recommendations based on fare, journey duration, stops, and departure time slots.
- **100% Offline & Localhost**: No cloud dependencies, no third-party paid APIs, and no internet access required.

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── app.py                      # Flask backend entry point (runs on http://localhost:5000)
│   ├── config.py                   # MySQL and application configuration
│   ├── database.py                 # SQLAlchemy engine with MySQL & SQLite fallback
│   ├── seed_data.py                # Database population and train schedule importer
│   ├── schema.sql                  # Complete MySQL relational database schema
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                 # Users table model
│   │   ├── train.py                # Trains table model
│   │   ├── seat.py                 # Seats table model
│   │   ├── passenger.py            # Passengers table model
│   │   ├── booking.py              # Bookings & BookingPassengers models
│   │   ├── payment.py              # Payments table model
│   │   └── cancellation.py         # Cancellations & Refund table model
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py          # /login, /register, /logout, /me
│   │   ├── train_routes.py         # /trains, /trains/<id>, /seats/<train_id>
│   │   ├── booking_routes.py       # /bookings, /ticket/<pnr>, /cancel-booking, /payment
│   │   └── recommendation_routes.py# /recommendations, /recommendations/meta
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py         # Password hashing, validation, session management
│   │   ├── train_service.py        # Train querying and seat inventory management
│   │   └── booking_service.py      # Atomicity, PNR generation, payment simulation, refunds
│   └── requirements.txt            # Python dependencies
├── ml/
│   ├── dataset.csv                 # 104+ train journey dataset
│   ├── train_data.csv              # Primary training records
│   ├── train_model.py              # Scikit-learn offline training pipeline
│   ├── recommendation.py           # Offline recommendation CLI & Python service
│   ├── model.pkl                   # Trained RandomForestClassifier model
│   └── model_meta.json             # Model metrics and hyperparameter metadata
├── src/                            # Existing React Frontend (UI visually unchanged)
│   ├── components/                 # Train search, coach seat selection, ticket, dashboard
│   ├── services/                   # db.ts, api.ts (backend sync client), aiRecommendation.ts
│   └── types/                      # TypeScript domain models
└── README.md
```

---

## 🗄️ Relational Database Schema (MySQL / SQLite)

The local database structure strictly implements all project requirements:

1. **`users`**:
   - `id` (VARCHAR 50, PK)
   - `name` (VARCHAR 100)
   - `email` (VARCHAR 100, UNIQUE)
   - `phone` (VARCHAR 20)
   - `password` (VARCHAR 255, Werkzeug SHA-256 hashed)
   - `role` (VARCHAR 20: `customer`, `staff`, `admin`)
   - `created_at` (TIMESTAMP)

2. **`trains`**:
   - `id` (VARCHAR 50, PK)
   - `train_number` (VARCHAR 20, UNIQUE)
   - `train_name` (VARCHAR 100)
   - `source` (VARCHAR 20)
   - `destination` (VARCHAR 20)
   - `departure_time` (VARCHAR 20)
   - `arrival_time` (VARCHAR 20)
   - `journey_duration` (VARCHAR 50)
   - `train_type` (VARCHAR 50, e.g. Rajdhani, Shatabdi, Vande Bharat)
   - `status` (VARCHAR 30)
   - `fare` (DECIMAL 10,2)
   - `available_seats` (INT)

3. **`seats`**:
   - `id` (VARCHAR 50, PK)
   - `train_id` (FK -> trains.id)
   - `class_type` (VARCHAR 20: `Economy`, `Business`, `First`)
   - `seat_number` (VARCHAR 20, e.g. `12A`, `14B`)
   - `seat_status` (VARCHAR 20: `available`, `booked`)
   - `fare` (DECIMAL 10,2)

4. **`passengers`**:
   - `id` (VARCHAR 50, PK)
   - `user_id` (FK -> users.id)
   - `name` (VARCHAR 100)
   - `age` (INT)
   - `gender` (VARCHAR 20)
   - `id_number` (VARCHAR 50)

5. **`bookings`**:
   - `id` (VARCHAR 50, PK)
   - `user_id` (FK -> users.id)
   - `train_id` (FK -> trains.id)
   - `pnr` (VARCHAR 20, UNIQUE 10-digit PNR)
   - `journey_date` (VARCHAR 30)
   - `class_type` (VARCHAR 20)
   - `total_fare` (DECIMAL 10,2)
   - `booking_status` (VARCHAR 30: `CONFIRMED`, `CANCELLED`)
   - `created_at` (TIMESTAMP)

6. **`booking_passengers`**:
   - `id` (INT, AUTO_INCREMENT PK)
   - `booking_id` (FK -> bookings.id)
   - `passenger_id` (VARCHAR 50)
   - `name` (VARCHAR 100)
   - `age` (INT)
   - `gender` (VARCHAR 20)
   - `seat_number` (VARCHAR 20)
   - `berth_preference` (VARCHAR 30)
   - `concession_type` (VARCHAR 30)

7. **`payments`**:
   - `id` (VARCHAR 50, PK)
   - `booking_id` (FK -> bookings.id)
   - `amount` (DECIMAL 10,2)
   - `payment_method` (VARCHAR 50: `UPI`, `Card`, `NetBanking`, `Wallet`)
   - `payment_status` (VARCHAR 30: `SUCCESS`, `REFUNDED`)
   - `transaction_reference` (VARCHAR 100)
   - `payment_date` (TIMESTAMP)

8. **`cancellations`**:
   - `id` (VARCHAR 50, PK)
   - `booking_id` (FK -> bookings.id)
   - `cancellation_date` (TIMESTAMP)
   - `reason` (VARCHAR 255)
   - `refund_amount` (DECIMAL 10,2)
   - `cancellation_status` (VARCHAR 30: `PROCESSED`)

---

## 🚀 How to Run Locally

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) MySQL Server 8.0+ running on `localhost:3306` (if MySQL is not active, SQLite automatically runs with zero setup)

### 2. Set Up and Start Python Backend
```bash
# Install Python backend packages
pip install -r backend/requirements.txt

# (Optional) Seed the local database with initial users, 104 trains, and sample bookings:
python3 backend/seed_data.py

# Start the Flask backend server on localhost:5000:
python3 backend/app.py
```

The Flask backend is now active at `http://localhost:5000`.

### 3. Start Frontend Development Server
In another terminal:
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser. All requests to `/api/*` are automatically forwarded to `http://localhost:5000` via the Vite proxy.

---

## 📡 Backend REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` or `/api/register` | Register new user with hashed password |
| `POST` | `/login` or `/api/login` | Authenticate user credentials & create session |
| `GET` | `/me` or `/api/me` | Get currently logged-in user profile |
| `GET` | `/trains` or `/api/trains` | List all trains or filter by `source`, `destination`, `date` |
| `GET` | `/trains/<id>` or `/api/trains/<id>` | Get train details by ID or train number |
| `GET` | `/seats/<train_id>` or `/api/seats/<train_id>` | View seat inventory & booked/available status |
| `POST` | `/bookings` or `/api/bookings` | Book ticket, assign seats, generate 10-digit PNR |
| `GET` | `/bookings` or `/api/bookings` | Retrieve user bookings or all booking history |
| `GET` | `/ticket/<pnr>` or `/api/ticket/<pnr>` | Retrieve ticket details by PNR |
| `POST` | `/cancel-booking` or `/api/cancel-booking` | Cancel booking, release seats, calculate refund |
| `POST` | `/payment` or `/api/payment` | Simulate local payment confirmation |
| `GET` | `/recommendations` or `/api/recommendations`| Offline Scikit-learn AI recommendations with explainable reasons |
| `GET` | `/health` or `/api/health` | Healthcheck and offline status |

---

## 🧠 Offline AI/ML Recommendation System

- **Model Type**: Scikit-Learn `RandomForestClassifier` and heuristic Decision Tree.
- **Dataset**: `ml/dataset.csv` (104 records covering peak departure hours, stops, transit durations, and fare classes).
- **Offline Training**: Run `python3 ml/train_model.py` to retrain model weights into `ml/model.pkl`.
- **Explainable Reasoning**: Each recommended train includes clear explainability badges ("Recommended because of lower fare", "Recommended because of shorter journey time", "Recommended because it matches your preferred travel time").

---

## 🔒 Security & Local Offline Architecture
- Secure password hashing using Werkzeug `generate_password_hash` (PBKDF2/SHA256).
- Protection against SQL injection via SQLAlchemy ORM parameterized queries.
- Double-booking prevention with atomic seat status reservation and release upon cancellation.
- 100% offline local execution — completely self-contained on `localhost`.

## Ethereum blockchain integration (local Ganache)

The booking confirmation page includes an optional blockchain panel. After a booking is created, connect MetaMask to the local Ganache network and choose **Record Booking on Ganache**. MetaMask must approve the contract transaction; the page only displays a transaction hash after the transaction receipt confirms success. The contract stores the booking reference, flight ID, seat number, wallet address and timestamp; it does not store passenger personal information.

### Deploy

1. Start Ganache with an RPC endpoint of `http://127.0.0.1:7545` and note the chain ID shown by your Ganache workspace. The default configuration expects chain ID `5777`.or `1337`
2. In the project root, run `npm install`.
3. Compile the contract with `npm run blockchain:compile`.
4. Deploy with `npm run blockchain:deploy`.
5. Copy the `SkylineBookingLedger` contract address printed by Truffle into `.env.local` as `VITE_SKYLINE_CONTRACT_ADDRESS=0x...`. Set `VITE_GANACHE_CHAIN_ID` to the actual chain ID.
6. Add the same Ganache RPC URL and chain ID to MetaMask. Import a Ganache test account only for local development; never use real-wallet private keys or mainnet funds for testing.
7. Restart Vite (`npm run dev`) after changing `.env.local`.

**Important:** Ganache is a local test chain. Blockchain records remain available only while the Ganache chain data/workspace is preserved. If Ganache is reset or a new workspace is created, deploy the contract again and update the address. The frontend stores a convenience copy of the transaction hash in local browser storage; the authoritative record is the on-chain contract and Ganache transaction receipt.
