from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from os import environ
from dotenv import load_dotenv

load_dotenv()  # Lataa .env-tiedosto

PREDICTION_KEY = environ.get("PREDICTION_KEY")
ENDPOINT = environ.get("ENDPOINT")
PROJECT_ID = environ.get("PROJECT_ID")
PUBLISHED_NAME = environ.get("PUBLISHED_NAME")

app = Flask(__name__)

# Salli React-dev (localhost:5173)
CORS(app, resources={r"/classify": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

@app.get("/health")
def health():
    ok = all([PREDICTION_KEY, ENDPOINT, PROJECT_ID, PUBLISHED_NAME])
    return jsonify({"ok": ok})

@app.post("/classify")
def classify():
    if not all([PREDICTION_KEY, ENDPOINT, PROJECT_ID, PUBLISHED_NAME]):
        return jsonify({"error": "Missing configuration"}), 500

    if "file" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_data = request.files["file"].read()
    if not image_data:
        return jsonify({"error": "Empty file"}), 400

    url = f"{ENDPOINT}/customvision/v3.0/Prediction/{PROJECT_ID}/classify/iterations/{PUBLISHED_NAME}/image"
    headers = {
        "Prediction-Key": PREDICTION_KEY,
        "Content-Type": "application/octet-stream"
    }

    res = requests.post(url, headers=headers, data=image_data, timeout=30)
    if res.status_code != 200:
        return jsonify({"error": "Luokittelu epäonnistui, yritä uudelleen.", "status": res.status_code}), res.status_code

    return jsonify(res.json())

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)