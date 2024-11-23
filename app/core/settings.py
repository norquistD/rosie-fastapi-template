import os
from functools import lru_cache

from pydantic_settings import BaseSettings

# Get the absolute path of the .env file
abs_path_env = os.path.abspath("../../.env")


# The Settings class which will retrieve the environment variables
class Settings(BaseSettings):
    API_TOKEN: str
    SALT: str

    # Feel free to modify these for your platform
    APP_NAME: str = "Discovery World Hackathon API"
    APP_VERSION: str = "0.1.0"
    APP_DESC: str = (
        """\n\n
    This is a FastApi that uses a template for building APIs on ROSIE, the MSOE supercomputer.\n
    This Api for was created during a hackathon with Discovery World to increase inclusivity and accessibility.\n
    It features are used to foster better translation, accessibility, and engagement:\n
        - Translation into any language\n
            - Text to Speech Translation\n
            - Speech to Speech Translation\n
            - Speech to Text Translation\n
        - Formating Text to fit Environment\n
            - Converts text to sound like a specified speaker\n
        - Quiz Generation\n
            - True or False Quizzes\n
            - Multiple Choice Quizzes\n
        - Chatting (In Developement)\n
            - Answering Questions about Discovery World or that Experience's Topic\n

    Discovery World Hackathon API Developed by: Dylan Norquist and Zander Ede - 2024
    FastApi Template Developed by: Adam Haile - 2024"""
    )

    # OpenAI Models being used
    COMPLETIONS_MODEL: str = "gpt-4o-mini"
    AUDIO_MODEL:str = "whisper-1"
    TTS_MODEL: str = "tts-1"
    TTS_MODEL_VOICE: str = "fable" # This can and should be changed per a machine, possible as a parameter in the future
    
    # Api Keys
    OPENAI_API_KEY: str = ""
    
    # Environment Setup
    ENVIRONMENT: str = "Rosie"
    DEVICE: str = "cuda"
    BASE_URL: str = ""

    class Config:
        env_file = ".env"


# Cache the settings to avoid reading the .env file multiple times
@lru_cache()
def get_settings() -> Settings:
    return Settings()
