# TraceON
### AI-Powered Financial Fraud Intelligence and Investigation Platform

TraceON is an AI-powered financial fraud intelligence platform designed to identify suspicious financial transactions, detect unusual account activity, visualize potentially risky relationships, and support structured fraud investigations.

Instead of relying on a single fraud prediction, TraceON combines **Machine Learning, Explainable AI, Contextual Anomaly Detection, and Account Relationship Analysis** to provide a comprehensive view of potential financial fraud.

---

## Key Features

TraceON consists of six integrated modules:

### 1. Overview Dashboard
Provides a consolidated view of transaction activity and fraud-related statistics through interactive charts, key metrics, and visual summaries.

### 2. Transaction Analysis
Uses an **XGBoost classification model** to assess transaction-level fraud risk.

- Displays transaction details and risk scores.
- Identifies potentially fraudulent transactions.
- Uses SHAP-based explanations to highlight features influencing model predictions.

### 3. Fraud Intelligence
Provides a visual representation of account relationships and transaction activity.

- Explores connections between accounts.
- Helps analysts inspect potentially suspicious account relationships.
- Provides account-level transaction history for further investigation.

### 4. Early Warning System
Detects unusual transaction patterns using contextual, rule-based anomaly detection.

The system identifies signals such as:

- **Geo-velocity:** Unusual geographic movement within a short time interval.
- **New Device:** Transactions originating from an unfamiliar device.
- **IP Change:** Transactions associated with a changed IP address.

The module generates risk-based alerts with supporting details to help analysts prioritize suspicious activity.

### 5. Live Transaction Evaluation
Allows users to submit a new transaction for real-time evaluation.

The system combines the XGBoost model's fraud-risk score with contextual anomaly signals to produce one of three decisions:

- **APPROVED:** No configured detection threshold or rule has been triggered.
- **REVIEW:** The transaction has signals that require further examination.
- **FLAGGED:** The transaction has crossed a high-risk detection threshold.

The result includes the combined risk score, model output, and detected alerts.

### 6. Investigation Center
Supports the investigation workflow by allowing analysts to manage suspicious activity.

- Create investigation cases from alerts.
- Assign cases to analysts.
- Add investigation notes.
- Track case status through Open, Under Review, Resolved, and Escalated.

---

## How TraceON Works

TraceON combines two complementary detection approaches:

**1. Machine Learning-Based Detection**

An XGBoost model evaluates transaction characteristics and estimates the likelihood of fraud. SHAP is used to explain the contribution of individual features to model predictions.

**2. Contextual Anomaly Detection**

A rule-based engine examines contextual transaction information, including location, device, IP address, and previous account activity, to identify unusual patterns.

The outputs are combined during live transaction evaluation to generate a risk assessment and recommended decision.

---

## Dataset and Data Processing

TraceON uses the **PaySim synthetic mobile money transaction dataset** as its primary transaction dataset.

The dataset contains transaction information such as:

- Transaction type and amount.
- Origin and destination account balances.
- Transaction time steps.
- Fraud labels.

### Contextual Metadata

The original PaySim dataset does not provide all the contextual information required for TraceON's location, device, and IP-based detection.

Therefore, additional metadata is generated for the prototype, including:

- Account city and geographic coordinates.
- IP addresses.
- Device identifiers.

This metadata is simulated and used to demonstrate contextual anomaly detection.

### Early Warning Scenarios

TraceON generates controlled synthetic scenarios to demonstrate its Early Warning System.

The scenario dataset contains:

| Scenario | Count |
|---|---:|
| Baseline transactions | 200 |
| Geo-velocity anomalies | 67 |
| New-device anomalies | 67 |
| IP-change anomalies | 66 |
| **Total demonstration alerts** | **200** |

These controlled scenarios demonstrate the detection rules and should not be interpreted as 200 confirmed cases of financial fraud.

---

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| UI and Visualization | Recharts, React Flow, D3 Force, Lucide |
| Backend | Python, FastAPI |
| Data Processing | Pandas, NumPy, PyArrow |
| Machine Learning | XGBoost, Scikit-learn |
| Explainable AI | SHAP |
| Graph Analysis | NetworkX |
| Data Storage | CSV, Parquet, JSON |

---

## Project Architecture

```text
                         TRACEON
                            |
                +-----------+-----------+
                |                       |
          React Frontend          FastAPI Backend
                |                       |
        +-------+-------+       +-------+--------+
        |       |       |       |       |        |
     Overview  Fraud  Live     XGBoost Early  Investigation
     Dashboard Intel  Eval     Model   Warning  Manager
        |       |       |       |       |        |
        +-------+-------+-------+-------+--------+
                            |
                    Combined Risk Assessment
                            |
                 Fraud Intelligence & Analysis
```

---

## Project Structure

```text
TraceON/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── data/
│   │   ├── investigation/
│   │   └── ml/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── data/
│   ├── raw/
│   └── processed/
│
├── .gitignore
└── README.md
```

---

## Installation and Setup

### Prerequisites

- Python 3.10 or later
- Node.js and npm
- Git

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
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Prepare the Dataset and Model

The raw dataset and generated data/model artifacts are excluded from Git because of their size.

Download the PaySim dataset and place its CSV file in the expected raw-data directory:

```text
data/raw/
```

From the `backend` directory, run the data preparation and model pipeline:

```bash
python -c "from app.data.preprocessing import process_dataset; process_dataset()"
python -m app.ml.prepare_data
python -m app.ml.train
python -m app.ml.generate_context
python -m app.ml.generate_anomaly_scenarios
python app/ml/fix_geo_scenarios.py
python -m app.ml.early_warning_engine
```

These steps prepare transaction data, train the model, generate contextual metadata, and create demonstration anomaly alerts.

The generated model and data artifacts must be available before starting the backend.

### 4. Start the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

### 5. Frontend Setup

Open a new terminal and navigate to the frontend:

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

Open the local URL displayed by Vite in your browser.

---

## Important Notes and Limitations

- PaySim is a synthetic transaction dataset, not a live banking transaction feed.
- Location, IP, and device metadata are simulated for demonstration purposes.
- Early Warning alerts are generated from controlled scenarios and rule-based checks; they are not confirmed fraud labels.
- XGBoost predictions and contextual anomaly alerts are separate detection signals.
- An **APPROVED** decision means that the implemented checks did not trigger the configured review or flag conditions. It does not guarantee that a transaction is legitimate.
- Investigation records and generated runtime data are local to each installation unless explicitly shared.
- TraceON is a hackathon prototype and is not intended to replace production banking fraud detection or compliance systems.

---

## Future Enhancements

- Integration with live transaction streams.
- More advanced graph-based fraud ring detection.
- Adaptive anomaly detection using evolving transaction patterns.
- Integration with verified device and geolocation intelligence.
- Collaborative investigation workflows and centralized case management.

---

## Team

**Project:** TraceON — AI-Powered Financial Fraud Intelligence and Investigation Platform

**Developed for:** Hackathon

**Repository:** [https://github.com/jaswika1997/TraceON](https://github.com/jaswika1997/TraceON)

---

*TraceON aims to move beyond isolated fraud predictions by connecting transaction risk, contextual anomalies, account relationships, and investigation workflows in one platform.*

**Repository:** https://github.com/jaswika1997/TraceON

---

*TraceON aims to move beyond isolated fraud predictions by connecting transaction risk, contextual anomalies, account relationships, and investigation workflows in one platform.*
