import os
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")

api_key = os.getenv("GROQ_API_KEY")
response = requests.get(
    "https://api.groq.com/openai/v1/models",
    headers={"Authorization": f"Bearer {api_key}"}
)

if response.status_code == 200:
    models = response.json().get("data", [])
    for m in models:
        print(m.get("id"))
else:
    print("Error:", response.text)
