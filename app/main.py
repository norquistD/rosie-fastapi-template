from fastapi import FastAPI, HTTPException, Request, status, Form
from fastapi.responses import Response, HTMLResponse, RedirectResponse, JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from api.api import api_router
from core.logger import logger
from core.settings import get_settings
from core.middleware.token_validator import TokenValidationMiddleware, validate_token

# Initialize the FastAPI app with Token Validation Middleware
app = FastAPI(
    title=get_settings().APP_NAME,
    version=get_settings().APP_VERSION,
    description=get_settings().APP_DESC,
    root_path=get_settings().BASE_URL,
    redirect_slashes=True,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "https://dh-ood.hpc.msoe.edu", f"https://dh-ood.hpc.msoe.edu{get_settings().BASE_URL}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Token Validation Middleware
app.add_middleware(TokenValidationMiddleware)

# Include the API router for all the endpoints
app.include_router(api_router)

# Default ping endpoint to check if app is running
@app.get("/ping/", tags=["admin"])
async def health_check():
    return Response(status_code=status.HTTP_200_OK)

# Middleware to log requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

# Handle OPTIONS (preflight) requests explicitly
@app.options("/{full_path:path}")
async def handle_preflight(full_path: str):
    """
    Handle preflight requests for any path.
    """
    logger.info(f"Handling preflight request for path: {full_path}")
    response = PlainTextResponse("OK")
    response.headers["Access-Control-Allow-Origin"] = "http://127.0.0.1:5500"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"  # Cache preflight for 24 hours
    return response

# Custom login page for the API
@app.get("/login/", tags=["admin"], include_in_schema=False)
async def login_page():
    html_content = f"""
    <html>
        <head>
            <title>Password Input Form</title>
        </head>
        <body>
            <h2>Enter Your Password</h2>
            <form action="{get_settings().BASE_URL}/submit-token" method="post">
                <label for="token">Password:</label>
                <input type="password" id="token" name="token" required>
                <button type="submit">Submit</button>
            </form>
        </body>
    </html>
    """
    return HTMLResponse(html_content)

# Custom endpoint to submit the password
@app.post("/submit-token/", tags=["admin"], include_in_schema=False)
async def submit_token(token: str = Form(...)):
    result = validate_token(token)
    if result:
        response = RedirectResponse(
            url=get_settings().BASE_URL + "/docs", status_code=302
        )
        response.set_cookie(
            key="apitoken",
            value=token,
            max_age=86400,
            secure=True,
            path=get_settings().BASE_URL + "/",
        )
        return response

    return JSONResponse(status_code=401, content={"detail": "Invalid token"})

# Event handler to log the app URL on startup
@app.on_event("startup")
async def startup_event():
    logger.info(
        f"Running {get_settings().APP_NAME} on: https://dh-ood.hpc.msoe.edu{get_settings().BASE_URL}"
    )
