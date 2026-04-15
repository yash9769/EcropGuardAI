import requests
print(requests.post('http://localhost:8000/chat', json={'query': 'What is NPK?'}).json())
