async function createIndexes() {
  await db.collection('matches').createIndex({ sport: 1, start_time: -1 });
  await db.collection('predictions').createIndex({ match_id: 1 });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
}

// Call this function after connecting to the database
createIndexes().catch(console.error);