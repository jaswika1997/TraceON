
# TraceON Dataset

## Primary Dataset: PaySim

Source: https://www.kaggle.com/datasets/ealaxi/paysim1

PaySim is a synthetic financial transaction dataset used for
fraud detection research.

### Setup

1. Download the dataset from Kaggle.
2. Extract the ZIP file.
3. Place the CSV inside `data/raw/`.

Expected filename:

`PS_20174392719_1491204439457_log.csv`

### Important

The raw CSV is not tracked in Git because of its size.
Each developer must download the dataset separately.

### Intended use

- Fraud detection
- Transaction risk scoring
- Account relationship analysis
- Fraud pattern clustering

Location data is not provided by PaySim.
Any geographic demonstration data will be separately
generated and clearly identified as simulated.