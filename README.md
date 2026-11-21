# TraceON
### AI-Powered Financial Fraud Intelligence & Investigation Platform

TraceON is an AI-powered financial fraud detection and investigation
platform designed to identify suspicious transactions, assess financial
risk, explain model predictions, and support fraud investigations.

## Key Features

- AI-based transaction fraud risk scoring
- Transaction monitoring and risk classification
- Explainable AI using SHAP
- Fraud network intelligence
- Suspicious activity detection
- Investigation and case management
- Fraud simulation sandbox
- Automated investigation reports

## Technology Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Recharts
- Framer Motion
- React Router

### Backend
- Python
- FastAPI
- Pandas
- NumPy

### Machine Learning
- XGBoost
- Scikit-learn
- SHAP
- Imbalanced-learn

### Intelligence and Analytics
- NetworkX
- DBSCAN
- Geo-spatial analysis

## Dataset

TraceON currently uses the PaySim synthetic mobile money
transaction dataset.

Dataset source:
https://www.kaggle.com/datasets/ealaxi/paysim1

The dataset contains approximately 6.3 million transactions.

The dataset is synthetic and does not represent real banking
transactions or actual customer identities.

Geographical, device, and IP-related intelligence may use
simulated metadata and will be identified as such.

## Project Structure

- frontend/ - React frontend
- backend/ - FastAPI backend and ML modules
- data/ - Dataset storage
- docs/ - Project documentation

## Setup Instructions

### Backend

Navigate to the backend directory:

    cd backend

Create and activate a virtual environment:

    python -m venv .venv

Install dependencies:

    pip install -r requirements.txt

Download the PaySim dataset and place the CSV inside:

    data/raw/

Run the preprocessing, analytics, and model training scripts
as required by the project setup.

Start the backend:

    uvicorn app.main:app --reload

Backend API:
http://127.0.0.1:8000

API documentation:
http://127.0.0.1:8000/docs

### Frontend

Open another terminal:

    cd frontend

Install dependencies:

    npm install

Start the frontend:

    npm run dev

Frontend:
http://localhost:5173

## Project Status

Currently implemented:
- PaySim data preprocessing
- Dataset analytics
- XGBoost fraud classification
- Transaction risk scoring
- SHAP-based prediction explanations
- Transaction monitoring dashboard
- Transaction explanation API

Additional fraud intelligence and investigation modules
are under development.

## Disclaimer

TraceON is an academic hackathon project using a synthetic
dataset. Its predictions are experimental and should not
be treated as financial advice or production banking decisions.