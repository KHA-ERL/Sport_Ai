const express = require('express');
const http = require('http');
const { setupRealTimeProcessing, connectToDatabase } = require('./realtime_processor');
const { spawn } = require('child_process');
const { MongoClient, ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator');
const { generateToken, verifyToken, hashPassword, comparePassword } = require('./auth');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');
const { AppError, handleError } = require('./errorHandler');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

async function connectToDatabase() {
  await client.connect();
  db = client.db('sports_betting_db');
  console.log('Connected to MongoDB');
}

// Middleware
app.use(express.json());

// User registration
app.post('/api/register', 
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const hashedPassword = await hashPassword(password);
      const result = await db.collection('users').insertOne({ email, password: hashedPassword });
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error registering user' });
    }
  }
);

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Protected routes
app.use(verifyToken);

// Routes
app.get('/api/matches', async (req, res) => {
  try {
    const matches = await db.collection('matches').find().sort({ start_time: -1 }).limit(50).toArray();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching matches' });
  }
});

app.get('/api/matches/:id', async (req, res, next) => {
  try {
    const match = await db.collection('matches').findOne({ _id: new ObjectId(req.params.id) });
    if (!match) {
      throw new AppError('Match not found', 404);
    }
    const predictions = await db.collection('predictions')
      .find({ match_id: new ObjectId(req.params.id) })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
    res.json({ ...match, prediction: predictions[0] });
  } catch (error) {
    next(error);
  }
});

app.get('/api/predictions/:matchId', async (req, res) => {
  try {
    const predictions = await db.collection('predictions')
      .find({ match_id: new ObjectId(req.params.matchId) })
      .toArray();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching predictions' });
  }
});

app.get('/api/sports-categories', async (req, res) => {
  try {
    const categories = await db.collection('sports_categories').find().toArray();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sports categories' });
  }
});

app.post('/api/fetch-data', (req, res) => {
  const pythonProcess = spawn('python', ['data_fetcher.py']);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python script output: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python script error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python script exited with code ${code}`);
    res.json({ message: 'Data fetching process completed' });
  });
});

// Serve static files
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
  handleError(err, res);
});

// Start the server
async function startServer() {
  await connectToDatabase();
  setupRealTimeProcessing(server);
  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
  });
}

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// User profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ email: user.email, joinDate: user._id.getTimestamp() });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// Betting history
app.get('/api/betting-history', verifyToken, async (req, res) => {
  try {
    const bets = await db.collection('bets')
      .find({ userId: new ObjectId(req.userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching betting history' });
  }
});

// Place a bet
app.post('/api/place-bet', verifyToken, async (req, res) => {
  try {
    const { matchId, amount, predictedOutcome } = req.body;
    const bet = {
      userId: new ObjectId(req.userId),
      matchId: new ObjectId(matchId),
      amount,
      predictedOutcome,
      createdAt: new Date()
    };
    await db.collection('bets').insertOne(bet);
    res.status(201).json({ message: 'Bet placed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error placing bet' });
  }
});

// Admin routes
app.post('/api/sports-categories', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await db.collection('sports_categories').insertOne({ name, description });
    res.status(201).json({ message: 'Sport category added successfully', id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Error adding sport category' });
  }
});

app.post('/api/matches', verifyToken, async (req, res) => {
  try {
    const { sport, team1, team2, startTime } = req.body;
    const result = await db.collection('matches').insertOne({
      sport,
      teams: [team1, team2],
      start_time: new Date(startTime),
      status: 'Scheduled'
    });
    res.status(201).json({ message: 'Match added successfully', id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Error adding match' });
  }
});

// Update user profile
app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: { name, preferences } }
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

startServer();