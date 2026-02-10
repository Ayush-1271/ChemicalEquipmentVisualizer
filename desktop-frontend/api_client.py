import requests
import json
import os

class APIClient:
    BASE_URL = "http://127.0.0.1:8000/api"
    TOKEN_FILE = "auth_token.txt"

    def __init__(self):
        self.token = self.load_token()

    def load_token(self):
        if os.path.exists(self.TOKEN_FILE):
            with open(self.TOKEN_FILE, "r") as f:
                return f.read().strip()
        return None

    def save_token(self, token):
        self.token = token
        with open(self.TOKEN_FILE, "w") as f:
            f.write(token)

    def logout(self):
        self.token = None
        if os.path.exists(self.TOKEN_FILE):
            os.remove(self.TOKEN_FILE)

    def get_headers(self):
        headers = {}
        if self.token:
            headers["Authorization"] = f"Token {self.token}"
        return headers

    def _handle_response(self, response):
        print(f"[API] {response.request.method} {response.url} - Status: {response.status_code}")
        try:
            if response.status_code in [200, 201]:
                return True, response.json(), None
            elif response.status_code == 401:
                return False, None, "Session expired. Please login again."
            else:
                try:
                    data = response.json()
                    error_msg = data.get('error') or data.get('detail') or str(data)
                    return False, None, error_msg
                except:
                    return False, None, response.text
        except Exception as e:
            return False, None, str(e)

    def login(self, username, password):
        try:
            url = f"{self.BASE_URL}/login/"
            response = requests.post(url, json={"username": username, "password": password})
            if response.status_code == 200:
                token = response.json().get("token")
                self.save_token(token)
                return True, token
            else:
                return False, "Login failed"
        except Exception as e:
            return False, str(e)

    def upload_dataset(self, file_path):
        try:
            url = f"{self.BASE_URL}/upload/"
            files = {'file': open(file_path, 'rb')}
            response = requests.post(url, files=files, headers=self.get_headers())
            return self._handle_response(response)
        except Exception as e:
            return False, None, str(e)

    def get_history(self):
        try:
            url = f"{self.BASE_URL}/history/"
            response = requests.get(url, headers=self.get_headers())
            print(f"[DEBUG] GET /history/ Response: {response.text[:200]}...") # Log raw response
            
            success, data, error = self._handle_response(response)
            if success:
                # Handle DRF Pagination
                if isinstance(data, dict) and 'results' in data:
                    return True, data['results'], None
                elif isinstance(data, list):
                    return True, data, None
                else:
                    return False, None, f"Unexpected history format: {type(data)}"
            return success, data, error
        except Exception as e:
            return False, None, str(e)

    def get_dataset_details(self, dataset_id):
        # Maps to GET /api/dataset/<id>/ which now includes summary in response
        try:
            url = f"{self.BASE_URL}/dataset/{dataset_id}/"
            response = requests.get(url, headers=self.get_headers())
            print(f"[DEBUG] GET /dataset/{dataset_id}/ Response: {response.text[:200]}...") # Log raw response
            return self._handle_response(response)
        except Exception as e:
            return False, None, str(e)

    def get_dataset_report(self, dataset_id, save_path):
        try:
            url = f"{self.BASE_URL}/dataset/{dataset_id}/report/"
            response = requests.get(url, headers=self.get_headers(), stream=True)
            if response.status_code == 200:
                with open(save_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                return True, "Download successful", None
            else:
                return False, None, f"Failed to download. Status: {response.status_code}"
        except Exception as e:
            return False, None, str(e)
