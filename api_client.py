import requests
from requests.exceptions import RequestException
import time
from config import API_CONFIG

class BaseAPIClient:
    def __init__(self, provider):
        self.base_url = API_CONFIG[provider]['base_url']
        self.api_key = API_CONFIG[provider]['api_key']
        self.session = requests.Session()
        self.session.headers.update({'Authorization': f'Bearer {self.api_key}'})

    def _make_request(self, endpoint, method='GET', params=None, data=None):
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(method, url, params=params, json=data)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            print(f"Error making request to {url}: {str(e)}")
            return None

    def get_live_matches(self):
        return self._make_request('live_matches')

    def get_historical_data(self, start_date, end_date):
        params = {'start_date': start_date, 'end_date': end_date}
        return self._make_request('historical_data', params=params)

class SportsRadarClient(BaseAPIClient):
    def __init__(self):
        super().__init__('sportsradar')

    # Add SportsRadar-specific methods here

class OneXBetClient(BaseAPIClient):
    def __init__(self):
        super().__init__('1xbet')

    # Add 1xbet-specific methods here

# Implement similar classes for other providers (SportyBet, SofaScore, FlashScore, Bet365)

class DataFetcher:
    def __init__(self):
        self.clients = {
            'sportsradar': SportsRadarClient(),
            '1xbet': OneXBetClient(),
            # Initialize other clients here
        }

    def fetch_all_live_matches(self):
        all_matches = {}
        for provider, client in self.clients.items():
            matches = client.get_live_matches()
            if matches:
                all_matches[provider] = matches
        return all_matches

    def fetch_all_historical_data(self, start_date, end_date):
        all_data = {}
        for provider, client in self.clients.items():
            data = client.get_historical_data(start_date, end_date)
            if data:
                all_data[provider] = data
        return all_data

# Usage example
if __name__ == "__main__":
    fetcher = DataFetcher()
    live_matches = fetcher.fetch_all_live_matches()
    historical_data = fetcher.fetch_all_historical_data('2023-01-01', '2023-12-31')
    print(live_matches)
    print(historical_data)