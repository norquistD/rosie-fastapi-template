from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI

from routes import example
from core.database.psql import *
from core.openai.translator import *
from core.settings import *

# Create an instance of the APIRouter class
api_router = APIRouter()

# This is both a GET and a POST because the Rosie OOD performs a POST request by
# default to supply the API token in the body, not in the query parameters, including
# GET requests allows for this to be flexible for if the user refreshes the page.
@api_router.api_route("/", methods=["GET", "POST"], include_in_schema=False)
async def root() -> JSONResponse:
    return JSONResponse(
        status_code=200, content={"message": f"Welcome to the Rosie FastAPI Template {get_settings().APP_VERSION}"}
    )

@api_router.api_route("/translate", methods=["GET", "POST"], include_in_schema=False)
async def root(request: Request) -> JSONResponse:
    # For GET requests, the text and language are retrieved as query parameters
    text = request.query_params.get('text', None)
    language = request.query_params.get('language', None)

    # If it's a POST request, check if the text and language are in the body
    if request.method == "POST":
        body = await request.json()
        text = body.get('text', text)
        language = body.get('language', language)

    # Ensure both text and language are provided
    if not text or not language:
        raise HTTPException(status_code=400, detail="Both 'text' and 'language' parameters are required")

    # Connect to the database
    conn = await open_connection('direct-supply', 'norquistd', 'IcedPhoenix#3374', '/tmp', 5432)

    if not conn:
        raise HTTPException(status_code=500, detail="Failed to connect to the database")

    try:
        api_key = (await conn.fetch("SELECT key from ds.api_key where description = 'Direct Supply OpenAI Key'"))[0]['key']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve API key: {e}")

    # Perform translation (ensure the translate_to_language and AsyncOpenAI are properly defined)
    try:
        translation = await translate_to_language(text, language, AsyncOpenAI(api_key=api_key))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")

    return JSONResponse(
        status_code=200, content={"translated_text": translation}
    )


# Include the example router from routes/example.py
api_router.include_router(example.router)
