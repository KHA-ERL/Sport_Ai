import joblib
from pymongo import MongoClient
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['sports_betting_db']

# Load the trained model
model = joblib.load('betting_model.joblib')

def make_prediction(match_data):
    # Preprocess the match data (similar to what we do in model_trainer.py)
    # This is a simplified version and should be adapted based on your actual model input
    features = [
        match_data['sport'],
        match_data['team1'],
        match_data['team2'],
        match_data.get('team1_rank', 0),
        match_data.get('team2_rank', 0)
    ]
    
    # Make prediction
    prediction = model.predict([features])[0]
    confidence = model.predict_proba([features]).max()
    
    return prediction, confidence

def update_prediction(match_id, prediction, confidence):
    db.predictions.update_one(
        {'match_id': match_id},
        {'$set': {
            'predicted_outcome': prediction,
            'confidence': confidence
        }},
        upsert=True
    )
    logging.info(f"Updated prediction for match {match_id}")

def process_new_match(match_id):
    match = db.matches.find_one({'_id': match_id})
    if match:
        prediction, confidence = make_prediction(match)
        update_prediction(match_id, prediction, confidence)
    else:
        logging.error(f"Match {match_id} not found")

if __name__ == "__main__":
    # This can be called by your Node.js server when new match data is received
    import sys
    if len(sys.argv) > 1:
        process_new_match(sys.argv[1])