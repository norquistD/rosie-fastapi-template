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

manager = ConnectionManager()

@app.websocket("/ws/quiz")
async def quiz_endpoint(websocket: WebSocket):
    print("New connection to /ws/quiz")
    await manager.connect(websocket, endpoint="quiz")
    try:
        while True:
            data = await websocket.receive_json()
            print(f"Received on /ws/quiz: {data}")

            response = requests.post(data['endpoint'], auth=(data['auth']['username'], data['auth']['password']), headers=data['headers'], json=data['payload'])
                  
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

# Run this server with: `uvicorn server:app --reload`