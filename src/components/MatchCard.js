import React from 'react';

const MatchCard = ({ match, prediction }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
      <h2 className="text-xl font-semibold">{match.teams.join(' vs ')}</h2>
      <p className="text-gray-600">{match.sport}</p>
      <p className="text-gray-600">{new Date(match.start_time).toLocaleString()}</p>
      <p className="text-gray-600">Status: {match.status}</p>
      <p className="text-gray-600">Score: {match.score || 'N/A'}</p>
      <div className="mt-2">
        <h3 className="font-semibold">Prediction:</h3>
        <p>{prediction ? `${prediction.predicted_outcome} (Confidence: ${prediction.confidence.toFixed(2)})` : 'Loading...'}</p>
      </div>
    </div>
  );
};

export default MatchCard;