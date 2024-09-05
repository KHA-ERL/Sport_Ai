from pymongo import MongoClient
from bson import ObjectId
import datetime

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['sports_betting_db']

# Collections
matches = db['matches']
predictions = db['predictions']
sports_categories = db['sports_categories']

# Match schema
def create_match(sport, teams, start_time, status, score=None):
    match = {
        "sport": sport,
        "teams": teams,
        "start_time": start_time,
        "status": status,
        "score": score,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    return matches.insert_one(match).inserted_id

def get_match(match_id):
    return matches.find_one({"_id": ObjectId(match_id)})

def update_match(match_id, update_data):
    update_data["updated_at"] = datetime.datetime.utcnow()
    return matches.update_one({"_id": ObjectId(match_id)}, {"$set": update_data})

def delete_match(match_id):
    return matches.delete_one({"_id": ObjectId(match_id)})

# Prediction schema
def create_prediction(match_id, predicted_outcome, confidence, model_version):
    prediction = {
        "match_id": ObjectId(match_id),
        "predicted_outcome": predicted_outcome,
        "confidence": confidence,
        "model_version": model_version,
        "created_at": datetime.datetime.utcnow()
    }
    return predictions.insert_one(prediction).inserted_id

def get_prediction(prediction_id):
    return predictions.find_one({"_id": ObjectId(prediction_id)})

def get_predictions_for_match(match_id):
    return list(predictions.find({"match_id": ObjectId(match_id)}))

# Sports category schema
def create_sport_category(name, description):
    category = {
        "name": name,
        "description": description,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    return sports_categories.insert_one(category).inserted_id

def get_sport_category(category_id):
    return sports_categories.find_one({"_id": ObjectId(category_id)})

def update_sport_category(category_id, update_data):
    update_data["updated_at"] = datetime.datetime.utcnow()
    return sports_categories.update_one({"_id": ObjectId(category_id)}, {"$set": update_data})

def delete_sport_category(category_id):
    return sports_categories.delete_one({"_id": ObjectId(category_id)})

# Usage example
if __name__ == "__main__":
    # Create a match
    match_id = create_match(
        sport="Football",
        teams=["Team A", "Team B"],
        start_time=datetime.datetime.utcnow(),
        status="Scheduled"
    )
    print(f"Created match with ID: {match_id}")

    # Create a prediction for the match
    prediction_id = create_prediction(
        match_id=match_id,
        predicted_outcome="Team A Win",
        confidence=0.75,
        model_version="1.0.0"
    )
    print(f"Created prediction with ID: {prediction_id}")

    # Create a sport category
    category_id = create_sport_category(
        name="Football",
        description="Association football, more commonly known as football or soccer"
    )
    print(f"Created sport category with ID: {category_id}")

    # Retrieve and print the created data
    print("Match:", get_match(match_id))
    print("Prediction:", get_prediction(prediction_id))
    print("Sport Category:", get_sport_category(category_id))