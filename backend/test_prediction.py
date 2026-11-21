
from app.ml.predict import predict_fraud

sample_transaction = {
    "step": 100,
    "type_code": 4,
    "amount": 250000.0,
    "oldbalanceOrg": 300000.0,
    "newbalanceOrig": 50000.0,
    "oldbalanceDest": 100000.0,
    "newbalanceDest": 350000.0,
    "orig_balance_diff": 250000.0,
    "dest_balance_diff": 250000.0,
    "orig_balance_zero": 0,
    "large_transaction": 1,
    "hour": 4,
    "day": 4
}

print(predict_fraud(sample_transaction))
