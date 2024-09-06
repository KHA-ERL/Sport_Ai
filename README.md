# AI-Powered Sports Betting Predictions

This project is an AI-powered sports categorization and betting predictions web application. It uses machine learning algorithms to analyze past and current match data, providing accurate betting predictions for live and future matches.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Usage](#usage)
6. [API Endpoints](#api-endpoints)
7. [Testing](#testing)
8. [Deployment](#deployment)

## Prerequisites

- Node.js (v14 or later)
- Python (v3.7 or later)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sports-betting-predictions.git
   cd sports-betting-predictions
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Install React frontend dependencies:
   ```
   npm install
   ```

## Configuration

1. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/sports_betting_db
   JWT_SECRET=your_jwt_secret_key
   ```

2. Configure the database:
   - Make sure MongoDB is running on your system
   - The application will automatically create the necessary collections

## Running the Application

1. Start the Node.js server:
   ```
   npm start
   ```

2. Start the React frontend:
   ```
   npm run start
   ```

3. The server will be running at `http://localhost:3000` and the frontend will be available at `http://localhost:3000`

## Usage

1. Register a new user account at `/register`
2. Log in to obtain an authentication token at `/login`
3. Browse matches and predictions at `/matches`
4. View your profile and betting history at `/profile`
5. Admins can access the dashboard at `/admin`

## API Endpoints

- POST `/api/register`: Register a new user
- POST `/api/login`: Log in and receive an authentication token
- GET `/api/matches`: Fetch all matches
- GET `/api/matches/:id`: Fetch a specific match
- GET `/api/predictions/:matchId`: Fetch predictions for a specific match
- GET `/api/sports-categories`: Fetch all sports categories
- GET `/api/profile`: Fetch user profile
- GET `/api/betting-history`: Fetch user's betting history
- POST `/api/place-bet`: Place a new bet
- POST `/api/sports-categories`: (Admin) Add a new sports category
- POST `/api/matches`: (Admin) Add a new match

All endpoints except `/api/register` and `/api/login` require authentication.

## Testing

Run the test suite with:

```
npm test
```

## Deployment

### GitHub Deployment

1. Create a new repository on GitHub.

2. Initialize git in your local project folder (if not already done):
   ```
   git init
   ```

3. Add all files to git:
   ```
   git add .
   ```

4. Commit the changes:
   ```
   git commit -m "Initial commit"
   ```

5. Add the GitHub repository as a remote:
   ```
   git remote add origin https://github.com/yourusername/sports-betting-predictions.git
   ```

6. Push
