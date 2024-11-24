from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from typing import List
import httpx
import json
import base64

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
        async with httpx.AsyncClient() as client:
            while True:
                data = await websocket.receive_json()
                print(f"Received on /ws/quiz: {data}")

                response = await client.post(
                    data['endpoint'],
                    auth=(data['auth']['username'], data['auth']['password']),
                    headers=data['headers'],
                    json=data['payload']
                )
                
                response_json = response.json()
                await websocket.send_text(json.dumps(response_json))
    except WebSocketDisconnect:
        print("Disconnected from /ws/quiz")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in /ws/quiz: {e}")
        manager.disconnect(websocket)

@app.websocket("/ws/translate")
async def translate_endpoint(websocket: WebSocket):
    print("New connection to /ws/translate")
    await manager.connect(websocket, endpoint="translate")
    try:
        async with httpx.AsyncClient() as client:
            while True:
                data = await websocket.receive_json()
                print(f"Received on /ws/translate: {data}")

                # Extract necessary fields from the incoming data
                request_id = data.get('payload', {}).get('id')
                text = data.get('payload', {}).get('text')
                language = data.get('payload', {}).get('language')
                endpoint = data.get('endpoint')
                headers = data.get('headers')
                auth = data.get('auth')

                # Perform the translation request asynchronously
                try:
                    response = await client.post(
                        endpoint,
                        auth=(auth['username'], auth['password']),
                        headers=headers,
                        json={'text': text, 'language': language},
                        timeout=10.0  # Optional: Set a timeout
                    )
                    response.raise_for_status()  # Raise an exception for HTTP errors

                    response_json = response.json()
                    translated_text = response_json.get('translated_text')

                    if translated_text:
                        response_data = {
                            'id': request_id,
                            'translatedText': translated_text
                        }
                    else:
                        response_data = {
                            'id': request_id,
                            'error': 'Translated text not found in response.'
                        }
                except httpx.HTTPStatusError as e:
                    response_data = {
                        'id': request_id,
                        'error': f'Translation API error: {str(e)}'
                    }
                except httpx.RequestError as e:
                    response_data = {
                        'id': request_id,
                        'error': f'An error occurred while requesting translation: {str(e)}'
                    }
                except json.JSONDecodeError:
                    response_data = {
                        'id': request_id,
                        'error': 'Invalid JSON response from translation API.'
                    }

                await websocket.send_text(json.dumps(response_data))
    except WebSocketDisconnect:
        print("Disconnected from /ws/translate")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Unexpected error in /ws/translate: {e}")
        await websocket.close()

@app.websocket("/ws/audio-to-text")
async def audio_to_text_endpoint(websocket: WebSocket):
    print("New connection to /ws/audio-to-text")
    await manager.connect(websocket, endpoint="audio-to-text")
    try:
        async with httpx.AsyncClient() as client:
            while True:
                data = await websocket.receive_json()
                print(f"Received on /ws/audio-to-text: {data}")

                # Extract necessary fields from the received data
                endpoint = data.get('endpoint')
                headers = data.get('headers', {})
                auth = data.get('auth', {})
                payload = data.get('payload', {})
                formData = payload.get('formData', {})
                language_toggle = payload.get('languageToggle', {})
                file_info = formData.get('file', {})

                # Extract file details
                filename = file_info.get('name')
                content_type = file_info.get('type', 'application/octet-stream')
                file_base64 = file_info.get('data')

                # Validate required fields
                if not all([endpoint, filename, file_base64]):
                    error_msg = "Missing required fields: 'endpoint', 'filename', or 'file'."
                    print(error_msg)
                    await websocket.send_text(json.dumps({"error": error_msg}))
                    continue

                try:
                    # Decode the Base64-encoded file
                    file_bytes = base64.b64decode(file_base64)
                except base64.binascii.Error as e:
                    error_msg = f"Invalid Base64 encoding: {e}"
                    print(error_msg)
                    await websocket.send_text(json.dumps({"error": error_msg}))
                    continue

                # Prepare the files dictionary for the POST request
                files = {
                    'file': (filename, file_bytes, content_type)
                }

                try:
                    # Make the POST request to the /audio-to-text endpoint
                    response = await client.post(
                        endpoint,
                        headers=headers,
                        auth=(auth.get('username'), auth.get('password')) if auth else None,
                        files=files
                    )
                    
                    # Check for successful response
                    if response.status_code == 200:
                        response_json = response.json()
                        transcription_text = response_json.get('transcription')
                        response_data = {
                            'transcription': transcription_text,
                            'languageToggle': language_toggle 
                        }
                        await websocket.send_text(json.dumps(response_data))
                    else:
                        error_response = {
                            "error": f"Audio-to-Text API returned status {response.status_code}",
                            "details": response.text
                        }
                        await websocket.send_text(json.dumps(error_response))
                except httpx.RequestError as e:
                    error_msg = f"HTTP request failed: {e}"
                    print(error_msg)
                    await websocket.send_text(json.dumps({"error": error_msg}))

    except WebSocketDisconnect:
        print("Disconnected from /ws/audio-to-text")
        manager.disconnect(websocket, endpoint="audio-to-text")
    except Exception as e:
        print(f"Error in /ws/audio-to-text: {e}")
        manager.disconnect(websocket, endpoint="audio-to-text")

@app.websocket("/ws/continue-chat")
async def quiz_endpoint(websocket: WebSocket):
    print("New connection to /ws/continue-chat")
    await manager.connect(websocket, endpoint="continue-chat")
    try:
        async with httpx.AsyncClient() as client:
            while True:
                data = await websocket.receive_json()
                print(f"Received on /ws/continue-chat: {data}")

                payload = data.get('payload', {})

                response = await client.post(
                    data['endpoint'],
                    auth=(data['auth']['username'], data['auth']['password']),
                    headers=data['headers'],
                    json=payload['history']
                )
                
                response_json = response.json()
                print(response_json)
                await websocket.send_text(json.dumps(response_json))
    except WebSocketDisconnect:
        print("Disconnected from /ws/continue-chat")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in /ws/continue-chat: {e}")
        manager.disconnect(websocket)

@app.websocket("/ws/text-to-audio")
async def text_to_audio_endpoint(websocket: WebSocket):
    print("New connection to /ws/text-to-audio")
    await manager.connect(websocket, endpoint="text-to-audio")
    try:
        async with httpx.AsyncClient() as client:
            while True:
                # Receive JSON data from client
                data = await websocket.receive_json()
                print(f"Received on /ws/text-to-audio: {data}")

                payload = data.get('payload', {})
                endpoint = data.get('endpoint')
                auth = data.get('auth', {})
                headers = data.get('headers', {})

                if not endpoint:
                    await websocket.send_text(json.dumps({"error": "No endpoint specified"}))
                    continue

                # Make POST request to the specified endpoint
                response = await client.post(
                    endpoint,
                    auth=(auth.get('username', ''), auth.get('password', '')),
                    headers=headers,
                    json=payload
                )

                if response.status_code != 200:
                    error_detail = response.text
                    await websocket.send_text(json.dumps({"error": f"HTTP {response.status_code}: {error_detail}"}))
                    continue

                # Read binary content (audio bytes)
                audio_content = response.content
                print(f"Sending audio content of length: {len(audio_content)} bytes")

                # Send audio bytes back to the client
                await websocket.send_bytes(audio_content)

    except WebSocketDisconnect:
        print("Disconnected from /ws/text-to-audio")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in /ws/text-to-audio: {e}")
        manager.disconnect(websocket)


# Run this server with: `uvicorn client_server:app --reload`
