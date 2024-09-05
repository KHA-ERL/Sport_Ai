const socketIo = require('socket.io');
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

async function connectToDatabase() {
  await client.connect();
  db = client.db('sports_betting_db');
  console.log('Connected to MongoDB');
}

function setupRealTimeProcessing(server) {
  const io = socketIo(server);

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('subscribeToMatch', (matchId) => {
      socket.join(`match_${matchId}`);
    });

    socket.on('unsubscribeFromMatch', (matchId) => {
      socket.leave(`match_${matchId}`);
    });

    socket.on('newMatchData', async (data) => {
      try {
        const result = await db.collection('matches').updateOne(
          { _id: new ObjectId(data.matchId) },
          { $set: data.updateData },
          { upsert: true }
        );

        io.to(`match_${data.matchId}`).emit('matchUpdate', data.updateData);

        if (result.upsertedId) {
          const pythonProcess = spawn('python', ['realtime_predictor.py', data.matchId]);

          pythonProcess.stdout.on('data', (output) => {
            console.log(`Prediction output: ${output}`);
            const prediction = JSON.parse(output);
            io.to(`match_${data.matchId}`).emit('predictionUpdate', { matchId: data.matchId, prediction });
          });

          pythonProcess.stderr.on('data', (error) => {
            console.error(`Prediction error: ${error}`);
          });
        }
      } catch (error) {
        console.error('Error processing real-time data:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}

// Schedule model retraining
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled model retraining');
  const pythonProcess = spawn('python', ['model_trainer.py']);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Model retraining output: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Model retraining error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Model retraining exited with code ${code}`);
  });
});

module.exports = { setupRealTimeProcessing, connectToDatabase };