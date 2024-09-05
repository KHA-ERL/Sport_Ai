const socket = io();

let authToken = localStorage.getItem('authToken');

function createMatchCard(match) {
    return `
        <div class="bg-white rounded-lg shadow-md p-4">
            <h2 class="text-xl font-semibold">${match.teams.join(' vs ')}</h2>
            <p class="text-gray-600">${match.sport}</p>
            <p class="text-gray-600">${new Date(match.start_time).toLocaleString()}</p>
            <p class="text-gray-600">Status: ${match.status}</p>
            <p class="text-gray-600">Score: ${match.score || 'N/A'}</p>
            <div class="mt-2">
                <h3 class="font-semibold">Prediction:</h3>
                <p id="prediction-${match._id}">Loading...</p>
            </div>
        </div>
    `;
}

function updatePrediction(matchId, prediction) {
    const predictionElement = document.getElementById(`prediction-${matchId}`);
    if (predictionElement) {
        predictionElement.textContent = `${prediction.predicted_outcome} (Confidence: ${prediction.confidence.toFixed(2)})`;
    }
}

function fetchData() {
    fetch('/api/matches', {
        headers: {
            'Authorization': authToken
        }
    })
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            return response.json();
        })
        .then(matches => {
            const matchesContainer = document.getElementById('matches');
            matchesContainer.innerHTML = '';
            matches.forEach(match => {
                matchesContainer.innerHTML += createMatchCard(match);
                fetch(`/api/predictions/${match._id}`, {
                    headers: {
                        'Authorization': authToken
                    }
                })
                    .then(response => response.json())
                    .then(predictions => {
                        if (predictions.length > 0) {
                            updatePrediction(match._id, predictions[0]);
                        }
                    });
            });
        })
        .catch(error => {
            if (error.message === 'Unauthorized') {
                showLoginForm();
            } else {
                console.error('Error fetching data:', error);
            }
        });
}

function showLoginForm() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Login</h2>
        <form id="loginForm" class="space-y-4">
            <div>
                <label for="email" class="block">Email:</label>
                <input type="email" id="email" name="email" required class="w-full px-3 py-2 border rounded">
            </div>
            <div>
                <label for="password" class="block">Password:</label>
                <input type="password" id="password" name="password" required class="w-full px-3 py-2 border rounded">
            </div>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Login</button>
        </form>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                authToken = data.token;
                localStorage.setItem('authToken', authToken);
                fetchData();
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    });
}

socket.on('predictionUpdate', (prediction) => {
    updatePrediction(prediction.match_id, prediction);
});

// Initial data fetch
fetchData();