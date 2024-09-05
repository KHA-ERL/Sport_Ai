import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib
from pymongo import MongoClient
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['sports_betting_db']

def fetch_data():
    logging.info("Fetching data from MongoDB")
    matches = list(db.matches.find())
    predictions = list(db.predictions.find())
    
    data = []
    for match in matches:
        match_predictions = [p for p in predictions if p['match_id'] == match['_id']]
        if match_predictions and 'result' in match:
            data.append({
                'sport': match['sport'],
                'team1': match['teams'][0],
                'team2': match['teams'][1],
                'team1_rank': match.get('team1_rank'),
                'team2_rank': match.get('team2_rank'),
                'predicted_outcome': match_predictions[0]['predicted_outcome'],
                'actual_outcome': match['result']
            })
    
    return pd.DataFrame(data)

def engineer_features(df):
    logging.info("Engineering features")
    df['team1_win_rate'] = df.groupby('team1')['actual_outcome'].transform(lambda x: (x == 'team1_win').mean())
    df['team2_win_rate'] = df.groupby('team2')['actual_outcome'].transform(lambda x: (x == 'team2_win').mean())
    df['rank_difference'] = df['team1_rank'] - df['team2_rank']
    df['is_home_team1'] = (df['team1'] == df['home_team']).astype(int)
    return df

def preprocess_data(df):
    logging.info("Preprocessing data")
    le = LabelEncoder()
    categorical_columns = ['sport', 'team1', 'team2', 'home_team']
    for col in categorical_columns:
        df[col] = le.fit_transform(df[col])
    
    df['actual_outcome'] = le.fit_transform(df['actual_outcome'])
    return df

def create_model():
    return Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler()),
        ('classifier', GradientBoostingClassifier(random_state=42))
    ])

def train_model(X, y):
    logging.info("Training model")
    model = create_model()
    param_grid = {
        'classifier__n_estimators': [100, 200],
        'classifier__learning_rate': [0.01, 0.1],
        'classifier__max_depth': [3, 5]
    }
    grid_search = GridSearchCV(model, param_grid, cv=5, n_jobs=-1)
    grid_search.fit(X, y)
    logging.info(f"Best parameters: {grid_search.best_params_}")
    return grid_search.best_estimator_

def evaluate_model(model, X, y):
    logging.info("Evaluating model")
    predictions = model.predict(X)
    accuracy = accuracy_score(y, predictions)
    report = classification_report(y, predictions)
    conf_matrix = confusion_matrix(y, predictions)
    
    cv_scores = cross_val_score(model, X, y, cv=5)
    
    logging.info(f"Model Accuracy: {accuracy}")
    logging.info(f"Classification Report:\n{report}")
    logging.info(f"Confusion Matrix:\n{conf_matrix}")
    logging.info(f"Cross-validation Scores: {cv_scores}")
    logging.info(f"Mean CV Score: {np.mean(cv_scores)}")

def main():
    df = fetch_data()
    df = engineer_features(df)
    df_processed = preprocess_data(df)
    
    X = df_processed.drop('actual_outcome', axis=1)
    y = df_processed['actual_outcome']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = train_model(X_train, y_train)
    evaluate_model(model, X_test, y_test)
    
    joblib.dump(model, 'betting_model.joblib')
    logging.info("Model saved as betting_model.joblib")

if __name__ == "__main__":
    main()