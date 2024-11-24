from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
import requests
import json

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.endpoint_map: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, endpoint: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.endpoint_map[websocket] = endpoint

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if websocket in self.endpoint_map:
            del self.endpoint_map[websocket]

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, endpoint: str = None):
        for connection in self.active_connections:
            # Only send to connections belonging to the specified endpoint
            if endpoint is None or self.endpoint_map.get(connection) == endpoint:
                await connection.send_text(message)

password = 'password'
auth = ('norquistd', 'aKBRVBpGmQx')
manager = ConnectionManager()

@app.websocket("/ws/quiz")
async def quiz_endpoint(websocket: WebSocket):
    print("New connection to /ws/quiz")
    await manager.connect(websocket, endpoint="quiz")
    try:
        while True:
            data = await websocket.receive_json()
            print(f"Received on /ws/quiz: {data}")

            headers = {
                'APIToken': f"Bearer {password}"
            }

            arguements = {
                'experience': data['experience'],
                'quiz_type': data['quiz_type']
            }

            response = requests.post(data['url'], auth=auth, headers=headers, json=arguements)

            print("Status Code:", response.status_code)
            print("Content-Type:", response.headers.get('Content-Type'))
            print("Content-Type:", response.json())
                  
            await websocket.send_text(json.dumps(response.json()))
    except WebSocketDisconnect:
        print("Disconnected from /ws/quiz")
        manager.disconnect(websocket)


@app.websocket("/ws/translate")
async def translate_endpoint(websocket: WebSocket):
    print("New connection to /ws/translate")
    await manager.connect(websocket, endpoint="translate")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received on /ws/translate: {data}")
            await manager.broadcast(f"Translate Echo: {data}", endpoint="translate")
    except WebSocketDisconnect:
        print("Disconnected from /ws/translate")
        manager.disconnect(websocket)


# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await manager.connect(websocket)
#     try:
#         while True:
#             data = await websocket.receive_text()
#             message = json.loads(data)

#             # Handle translation requests
#             if message.get("type") == "translate":
#                 base_url = 'https://dh-ood.hpc.msoe.edu/node/dh-node9.hpc.msoe.edu/1649/'
#                 extension_url = 'discovery-world/'
#                 full_url = base_url + extension_url
#                 headers = {
#                     'APIToken': 'Bearer password'
#                 }

#                 response = requests.get(full_url, auth=('norquistd', 'aKBRVBpGmQx'), headers=headers)

#                 print("Status Code:", response.status_code)
#                 print("Content-Type:", response.headers.get('Content-Type'))
#                 print("Json:", response.json())
#                 await manager.send_message(json.dumps(response.json()), websocket)

#             # Handle quiz requests
#             elif message.get("type") == "quiz":
#                 quiz_response = {
#                     "type": "quiz",
#                     "question": "What is the capital of France?",
#                     "options": ["Paris", "London", "Rome", "Berlin"],
#                     "answer": "Paris",
#                 }
#                 await manager.send_message(json.dumps(quiz_response), websocket)

#             else:
#                 await manager.send_message(json.dumps({"error": "Unsupported message type"}), websocket)
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)

# Run this server with: `uvicorn server:app --reload`