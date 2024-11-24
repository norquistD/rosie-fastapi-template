from io import BytesIO
from typing import List
from fastapi import APIRouter, Body, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from openai import AsyncOpenAI
from core.openai.openai import *
from core.settings import *
from pydantic import BaseModel
import pandas as pd

class Message(BaseModel):
    role: str
    content: str

# Create an instance of the APIRouter class
api_router = APIRouter(prefix='/discovery-world', tags=['discovery-world'])

# This is both a GET and a POST because the Rosie OOD performs a POST request by
# default to supply the API token in the body, not in the query parameters, including
# GET requests allows for this to be flexible for if the user refreshes the page.
@api_router.api_route("/", methods=["GET", "POST"], include_in_schema=False)
async def root() -> JSONResponse:
    return JSONResponse(
        status_code=200, content={"message": f"Welcome to the Rosie FastAPI Template {get_settings().APP_VERSION} '{get_settings().BASE_URL}'"}
    )

@api_router.api_route("/translate", methods=["GET", "POST"])
async def translate(text: str = Body(..., embed=True), language: str = Body(..., embed=True)) -> JSONResponse:
    # Ensure both text and language are provided
    if not text or not language:
        raise HTTPException(status_code=400, detail="Both 'text' and 'language' parameters are required")
    
    try:
        translation = await translate_to_language(text, language.lower(), AsyncOpenAI(api_key=get_settings().OPENAI_API_KEY))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")

    return JSONResponse(
        status_code=200, content={"translated_text": translation}
    )

@api_router.api_route("/sound-like", methods=["GET", "POST"])
async def sound_like(text: str = Body(..., embed=True), speaker: str = Body(..., embed=True)) -> JSONResponse:
    # Ensure both text and language are provided
    if not text or not speaker:
        raise HTTPException(status_code=400, detail="Both 'text' and 'speaker' parameters are required")

    try:
        converted_sentence = await sound_like_speaker(text, speaker.lower(), AsyncOpenAI(api_key=get_settings().OPENAI_API_KEY))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {e}")

    return JSONResponse(
        status_code=200, content={"converted_sentence": converted_sentence}
    )

# Audio-to-Text endpoint
@api_router.api_route("/audio-to-text", methods=["GET", "POST"])
async def audio_to_text(file: UploadFile = File(...)):
    contents = await file.read()

    # Set up OpenAI API key
    asyncClient = AsyncOpenAI(api_key=get_settings().OPENAI_API_KEY)

    # Send audio to OpenAI for transcription
    transcript = await asyncClient.audio.transcriptions.create(model=get_settings().AUDIO_MODEL, file=(file.filename, contents, file.content_type))

    return JSONResponse(
        status_code=200,
        content={"filename": file.filename, "transcription": transcript.text}
    )

# Text-to-Audio endpoint
@api_router.api_route("/text-to-audio", methods=["GET", "POST"])
async def text_to_audio(text: str = Body(..., embed=True)):
    # Set up OpenAI API key
    asyncClient = AsyncOpenAI(api_key=get_settings().OPENAI_API_KEY)

    try:
        # Create speech with OpenAI's model
        response = await asyncClient.audio.speech.create(
            model=get_settings().TTS_MODEL,
            voice=get_settings().TTS_MODEL_VOICE,
            input=text,
        )

        # Generate the audio file in memory
        audio_content = response.read()

        # Return the generated audio as a response
        return StreamingResponse(
            BytesIO(audio_content),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=output.mp3"}
        )
    
    except Exception as e:
        # Handle errors from the OpenAI API or other issues
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

# Chat continuation endpoint
@api_router.api_route("/continue-chat", methods=["GET", "POST"])
async def continue_chat(history: List[Message] = Body(...)):
    # Set up OpenAI API key
    asyncClient = AsyncOpenAI(api_key=get_settings().OPENAI_API_KEY)

    try:
        # Use OpenAI's ChatCompletion API to generate the next message
        response = await asyncClient.chat.completions.create(
            model=get_settings().COMPLETIONS_MODEL,  # or any other model you prefer
            messages=[message.model_dump() for message in history],
            temperature=0,       # Minimize randomness
            top_p=1,             # Include all high-probability tokens
            frequency_penalty=0, # Avoid penalizing repetitions
            presence_penalty=0   # No penalty for sticking to the same topics
        )
        # Extract the assistant's reply
        assistant_reply = response.choices[0].message.content

        # Return the assistant's reply
        return JSONResponse(content={"reply": assistant_reply})

    except Exception as e:
        # Handle errors from the OpenAI API or other issues
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# Chat continuation endpoint
@api_router.api_route("/generate-quiz", methods=["GET", "POST"])
async def generate_quiz(experience: str = Body(..., embed=True), quiz_type: str = Body(..., embed=True)):
    experiences = pd.read_json('app/api/exhibits.json')

    experience = experiences[experiences['ExperienceName'] == experience]

    experience_dict = experience.to_dict(orient='records')

    quiz = await create_quiz(experience_dict[0], quiz_type, AsyncOpenAI(api_key=get_settings().OPENAI_API_KEY))
    quiz['quiz_type'] = quiz_type

    return JSONResponse(status_code=200, content=quiz)

# Chat continuation endpoint
@api_router.get("/get-experiences")
async def get_experiences():
    # Load the JSON file
    experiences = pd.read_json('app/api/exhibits.json')

    # Convert to a dictionary
    experiences_dict = experiences.to_dict(orient="records")

    # Serialize while handling NaN values
    response_content = JSONResponse(status_code=200, content=[
        {k: (v if pd.notna(v) else None) for k, v in item.items()}
        for item in experiences_dict
    ])

    return response_content

