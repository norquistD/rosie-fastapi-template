from fastapi import APIRouter
from fastapi.responses import JSONResponse

from routes import example
from core.database.psql import *

# Create an instance of the APIRouter class
api_router = APIRouter()

# This is both a GET and a POST because the Rosie OOD performs a POST request by
# default to supply the API token in the body, not in the query parameters, including
# GET requests allows for this to be flexible for if the user refreshes the page.
@api_router.api_route("/", methods=["GET", "POST"], include_in_schema=False)
async def root() -> JSONResponse:
    return JSONResponse(
        status_code=200, content={"message": f"Welcome to the Rosie FastAPI Template"}
    )

@api_router.api_route("/ez-life", methods=["GET", "POST"], include_in_schema=False)
async def root() -> JSONResponse:
    conn = await open_connection('direct-supply', 'norquistd', 'IcedPhoenix#3374', '/tmp', 5432)

    if not conn:
        print("Failed to connect to the database.")
    try:
        api_key = (await conn.fetch("SELECT key from ds.api_key where description = 'Direct Supply OpenAI Key'"))[0]['key']
    except Exception as e:
        print(f"{e}")

    return JSONResponse(
        status_code=200, content={"message": f"{api_key}"}
    )


# Include the example router from routes/example.py
api_router.include_router(example.router)
