# TraceON
### AI-Powered Financial Fraud Intelligence & Investigation Platform

TraceON is an AI-powered financial fraud detection and investigation platform designed to identify suspicious transactions, assess financial risk, explain model predictions, detect unusual account activity, and support analysts through structured fraud investigations.

It combines machine learning, explainable AI, transaction monitoring, geospatial anomaly detection, and account network intelligence into a unified investigation platform.

## Key Features

### 1. AI-Based Fraud Detection
- XGBoost-based transaction fraud classification.
- Transaction-level fraud probability and risk scoring.
- Risk classification: Low, Medium, High, and Critical.
- Automated recommendations: Approve, Review, or Block.
- SHAP-based explanations of model predictions.

### 2. Transaction Monitoring
- Browse and filter processed transactions.
- View transaction details and risk classifications.
- Access model explanations for individual transactions.
- Monitor transaction-level fraud indicators.

### 3. Fraud Intelligence
- Account relationship and transaction network visualization.
- Identification of suspicious account connections.
- Network-based fraud investigation.
- Account activity and relationship analysis.

### 4. Early Warning System
Detects suspicious changes in transaction context through:
- Geo-velocity detection.
- New device detection.
- IP address change detection.
- Severity-based alert generation.
- Alert filtering and investigation initiation.

### 5. Live Transaction Evaluation
- Submit a new transaction for evaluation.
- Combine XGBoost fraud prediction with Early Warning rules.
- Generate a combined risk score.
- Return an APPROVED, REVIEW, or FLAGGED decision.
- Display triggered alerts and their explanations.

### 6. Investigation Center
- Create investigation cases from generated alerts.
- Track investigation status.
- Assign cases to analysts.
- Add investigation notes.
- View case details and associated suspicious activity.
- Prevent duplicate cases for the same alert.

## Technology Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Recharts
- Framer Motion
- React Router
- React Flow

### Backend
- Python
- FastAPI
- Pandas
- NumPy
- PyArrow

### Machine Learning
- XGBoost
- Scikit-learn
- SHAP
- Imbalanced-learn

### Intelligence and Analytics
- NetworkX
- Geospatial analysis
- Haversine distance calculation

## Dataset

TraceON currently uses the **PaySim synthetic mobile money transaction dataset**.

Dataset source: [PaySim on Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1)

The processed dataset contains approximately 6.3 million transactions.

The dataset is synthetic and does not represent real banking transactions or actual customer identities.

### Simulated Contextual Metadata

PaySim does not contain actual geographic location, IP address, or device information.

To support contextual anomaly detection, TraceON generates consistent simulated metadata, including:
- Account locations and geographic coordinates.
- IP addresses.
- Device identifiers.

Controlled anomaly scenarios are also generated to test geo-velocity, new-device, and IP-change detection.

Simulated metadata and test scenarios are identified as simulated and must not be interpreted as real-world customer information or confirmed fraud.

## Project Structure

```text
TraceON/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── data/
│   │   ├── intelligence/
│   │   ├── investigation/
│   │   ├── ml/
│   │   └── main.py
│   │
│   ├── models/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── data/
│   ├── raw/
│   └── processed/
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.10 or later.
- Node.js and npm.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/jaswika1997/TraceON.git
cd TraceON
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Download the PaySim dataset and place the CSV inside the project's `data/raw/` directory.

Run the required preprocessing, feature preparation, and model training scripts according to the project pipeline.

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

http://localhost:5173

## Project Status

### Implemented
- PaySim data preprocessing and analytics.
- XGBoost fraud classification.
- Transaction-level risk scoring.
- SHAP-based prediction explanations.
- Transaction monitoring dashboard.
- Fraud intelligence and account network visualization.
- Simulated contextual metadata generation.
- Geo-velocity, new-device, and IP-change detection.
- Early Warning alert generation and filtering.
- Combined live transaction evaluation.
- Investigation case creation and management.
- Analyst assignment, status updates, and investigation notes.

## Disclaimer

TraceON is an academic hackathon project developed using a synthetic transaction dataset and simulated contextual metadata.

Its predictions and anomaly detection results are experimental and should not be treated as financial advice, confirmed fraud determinations, or production banking decisions.