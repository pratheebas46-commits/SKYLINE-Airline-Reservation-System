# SKYLINE: Domestic Airline Reservation System

SKYLINE is a full-stack domestic airline reservation system with Ethereum blockchain integration. Users can search flights, pick seats on an interactive seat map, enter passenger details, pay (simulated) and receive an instant ticket, either through the manual booking flow or with a chatbot-assisted flow. An offline machine learning model recommends flights, and an optional Ethereum ledger records each booking on a local Ganache blockchain.

Academic major project, MCA (2024–2026).

## Features

- **Frontend:** React 19, TypeScript and Tailwind CSS with flight search, class selection, an interactive seat map, a passenger form, simulated payments, instant ticket generation, web check-in and a user dashboard.
- **Chatbot-assisted booking:** an alternative to the manual booking flow.
- **Backend:** Python 3, Flask, SQLAlchemy and MySQL Connector.
- **Database:** local MySQL with an automatic embedded SQLite fallback, so it runs with no extra setup.
- **Offline AI/ML:** a scikit-learn Decision Tree and Random Forest recommendation engine that gives explainable flight recommendations based on fare, journey duration, stops and departure time slot.
- **Blockchain:** an optional Ethereum smart contract (Truffle, Ganache, MetaMask) that records bookings.
- **Offline and local:** no cloud dependencies, no paid third-party APIs and no internet access required.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Python 3, Flask, SQLAlchemy |
| Database | MySQL, with an automatic SQLite fallback |
| Machine learning | scikit-learn (Random Forest, Decision Tree) |
| Blockchain | Ethereum, Solidity smart contract, Truffle, Ganache, MetaMask |

## Project structure

```
project/
├── backend/
│   ├── app.py                       Flask entry point (http://localhost:5000)
│   ├── config.py                    MySQL and application configuration
│   ├── database.py                  SQLAlchemy engine with MySQL and SQLite fallback
│   ├── seed_data.py                 Database population and flight schedule importer
│   ├── schema.sql                   Complete MySQL relational schema
│   ├── models/
│   │   ├── user.py                  Users
│   │   ├── flight.py                Flights
│   │   ├── seat.py                  Seats
│   │   ├── passenger.py             Passengers
│   │   ├── booking.py               Bookings and booking passengers
│   │   ├── payment.py               Payments
│   │   └── cancellation.py          Cancellations and refunds
│   ├── routes/
│   │   ├── auth_routes.py           /login, /register, /logout, /me
│   │   ├── flight_routes.py         /flights, /flights/<id>, /seats/<flight_id>
│   │   ├── booking_routes.py        /bookings, /ticket/<pnr>, /cancel-booking, /payment
│   │   └── recommendation_routes.py /recommendations, /recommendations/meta
│   ├── services/
│   │   ├── auth_service.py          Password hashing, validation, sessions
│   │   ├── flight_service.py        Flight queries and seat inventory
│   │   └── booking_service.py       Atomic booking, PNR generation, payments, refunds
│   └── requirements.txt             Python dependencies
├── ml/
│   ├── dataset.csv                  Flight journey dataset
│   ├── train_data.csv               Primary training records
│   ├── train_model.py               Offline training pipeline
│   ├── recommendation.py            Offline recommendation service
│   ├── model.pkl                    Trained Random Forest model
│   └── model_meta.json             Model metrics and hyperparameters
├── contracts/                       Ethereum smart contract (SkylineBookingLedger)
├── migrations/                      Truffle deployment scripts
├── src/                             React + TypeScript frontend
│   ├── components/                  Flight search, seat selection, ticket, dashboard
│   ├── services/                    db.ts, api.ts, aiRecommendation.ts
│   └── types/                       TypeScript domain models
├── screenshots/                     Project screenshots
└── README.md
```

## Database schema (MySQL / SQLite)

1. **`users`**: `id` (PK), `name`, `email` (unique), `phone`, `password` (hashed), `role` (`customer`, `staff`, `admin`), `created_at`
2. **`flights`**: `id` (PK), `flight_number` (unique), `airline_name`, `source`, `destination`, `departure_time`, `arrival_time`, `journey_duration`, `status`, `fare`, `available_seats`
3. **`seats`**: `id` (PK), `flight_id` (FK), `class_type` (`Economy`, `Business`, `First`), `seat_number` (for example `12A`), `seat_status` (`available`, `booked`), `fare`
4. **`passengers`**: `id` (PK), `user_id` (FK), `name`, `age`, `gender`, `id_number`
5. **`bookings`**: `id` (PK), `user_id` (FK), `flight_id` (FK), `pnr` (unique), `journey_date`, `class_type`, `total_fare`, `booking_status` (`CONFIRMED`, `CANCELLED`), `created_at`
6. **`booking_passengers`**: `id` (PK), `booking_id` (FK), `passenger_id`, `name`, `age`, `gender`, `seat_number`
7. **`payments`**: `id` (PK), `booking_id` (FK), `amount`, `payment_method` (`UPI`, `Card`, `NetBanking`, `Wallet`), `payment_status` (`SUCCESS`, `REFUNDED`), `transaction_reference`, `payment_date`
8. **`cancellations`**: `id` (PK), `booking_id` (FK), `cancellation_date`, `reason`, `refund_amount`, `cancellation_status` (`PROCESSED`)

## How to run locally

### 1. Prerequisites

- Python 3.10 or later
- Node.js 18 or later and npm
- Optional: MySQL Server 8.0 on `localhost:3306`. If MySQL is not running, SQLite is used automatically with no setup.

### 2. Start the backend

```bash
# Install Python packages
pip install -r backend/requirements.txt

# Optional: seed the database with users, flights and sample bookings
python3 backend/seed_data.py

# Start the Flask server on http://localhost:5000
python3 backend/app.py
```

### 3. Start the frontend

In a second terminal:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Requests to `/api/*` are forwarded to `http://localhost:5000` through the Vite proxy.

## REST API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/register` or `/api/register` | Register a new user with a hashed password |
| `POST` | `/login` or `/api/login` | Authenticate a user and create a session |
| `GET` | `/me` or `/api/me` | Get the logged-in user's profile |
| `GET` | `/flights` or `/api/flights` | List flights or filter by `source`, `destination` and `date` |
| `GET` | `/flights/<id>` or `/api/flights/<id>` | Get flight details by ID or flight number |
| `GET` | `/seats/<flight_id>` or `/api/seats/<flight_id>` | View seat inventory and booked or available status |
| `POST` | `/bookings` or `/api/bookings` | Book a ticket, assign seats and generate a PNR |
| `GET` | `/bookings` or `/api/bookings` | Get the user's booking history |
| `GET` | `/ticket/<pnr>` or `/api/ticket/<pnr>` | Get ticket details by PNR |
| `POST` | `/cancel-booking` or `/api/cancel-booking` | Cancel a booking, release seats and calculate the refund |
| `POST` | `/payment` or `/api/payment` | Simulate a local payment confirmation |
| `GET` | `/recommendations` or `/api/recommendations` | Get offline ML flight recommendations with reasons |
| `GET` | `/health` or `/api/health` | Health check and offline status |

## Chatbot-assisted booking

Besides the manual booking form, users can book through a chatbot. [Add one or two lines describing what your chatbot can do, for example searching flights, collecting passenger details and confirming a booking.]

## Offline AI/ML recommendation system

- **Model:** scikit-learn `RandomForestClassifier` and a heuristic Decision Tree.
- **Dataset:** `ml/dataset.csv`, covering departure hours, stops, journey durations and fare classes.
- **Training:** run `python3 ml/train_model.py` to retrain and save the model to `ml/model.pkl`.
- **Explainable output:** each recommended flight shows why it was suggested, for example "Recommended because of lower fare", "Recommended because of shorter journey time" or "Recommended because it matches your preferred travel time".

## Security

- Passwords are hashed with Werkzeug `generate_password_hash`.
- SQLAlchemy ORM parameterised queries protect against SQL injection.
- Atomic seat reservation prevents double booking, and seats are released when a booking is cancelled.
- The whole system runs locally on `localhost`.

## Ethereum blockchain integration (local Ganache)

After a booking is created, the confirmation page offers a **Record Booking on Ganache** option. Connect MetaMask to the local Ganache network and approve the contract transaction. The page shows a transaction hash only after the receipt confirms success. The contract stores the booking reference, flight ID, seat number, wallet address and timestamp. It does not store passenger personal information.

### Deploy

1. Start Ganache with the RPC endpoint `http://127.0.0.1:7545` and note the chain ID shown by your workspace. The default configuration expects chain ID `5777` or `1337`.
2. In the project root, run `npm install`.
3. Compile the contract: `npm run blockchain:compile`
4. Deploy it: `npm run blockchain:deploy`
5. Copy the `SkylineBookingLedger` contract address printed by Truffle into `.env.local`:
   ```
   VITE_SKYLINE_CONTRACT_ADDRESS=0x...
   VITE_GANACHE_CHAIN_ID=5777
   ```
   Set `VITE_GANACHE_CHAIN_ID` to your actual chain ID.
6. Add the same Ganache RPC URL and chain ID to MetaMask. Import a Ganache test account for local development only, and never use real-wallet private keys or real funds.
7. Restart Vite with `npm run dev` after changing `.env.local`.

**Important:** Ganache is a local test chain. Blockchain records remain only while the Ganache workspace is preserved. If you reset Ganache or create a new workspace, deploy the contract again and update the address. The frontend keeps a convenience copy of the transaction hash in local browser storage, but the authoritative record is the on-chain contract and the Ganache transaction receipt.
