from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
import json
import requests

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle translation requests
            if message.get("type") == "translate":
                base_url = 'https://dh-ood.hpc.msoe.edu/node/dh-node9.hpc.msoe.edu/1649/'
                extension_url = 'discovery-world/'
                full_url = base_url + extension_url
                headers = {
                    'APIToken': 'Bearer password'
                }

                response = requests.get(full_url, auth=('norquistd', 'aKBRVBpGmQx'), headers=headers)

                print("Status Code:", response.status_code)
                print("Content-Type:", response.headers.get('Content-Type'))
                print("Json:", response.json())
                await manager.send_message(json.dumps(response.json()), websocket)

            # Handle quiz requests
            elif message.get("type") == "quiz":
                quiz_response = {
                    "type": "quiz",
                    "question": "What is the capital of France?",
                    "options": ["Paris", "London", "Rome", "Berlin"],
                    "answer": "Paris",
                }
                await manager.send_message(json.dumps(quiz_response), websocket)

            else:
                await manager.send_message(json.dumps({"error": "Unsupported message type"}), websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Run this server with: `uvicorn server:app --reload`
