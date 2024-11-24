from openai import AsyncOpenAI
import json
from core.settings import get_settings

async def translate_to_language(text: str, language: str, asyncClient: AsyncOpenAI):
    # Define the translation function
    translation_tool = {
        "type": "function",
        "function": {
            "name": "translation_definition",
            "description": f"Identifies the translation into {language}",
            "parameters": {
                "type": "object",
                "properties": {
                    "translated_language": {
                        "type": "string",
                        "description": f"The translation into {language}."
                    },
                    "original_language": {
                        "type": "string",
                        "description": "The original sentence in English."
                    }
                },
                "required": ["translated_language"]
            }
        }
    }

    # Combine all instructions into a single message
    messages = [
        {
            "role": "system",
            "content": "You are a language translator and function executor. Please translate text and return details using the defined function."
        },
        {
            "role": "user",
            "content": f"""Translate this into {language}:
            '{text}'
            ---
            Use the function to return the translated text and details.
            """
        }
    ]

    res = await asyncClient.chat.completions.create(
        model=get_settings().COMPLETIONS_MODEL,
        tools=[translation_tool],
        tool_choice="auto",
        messages=messages,
        temperature=0,       # Minimize randomness
        top_p=1,             # Include all high-probability tokens
        frequency_penalty=0, # Avoid penalizing repetitions
        presence_penalty=0   # No penalty for sticking to the same topics
    )
    
    translation = json.loads(res.choices[0].message.tool_calls[0].function.arguments)

    return translation['translated_language']

async def sound_like_speaker(text: str, speaker: str, asyncClient: AsyncOpenAI):
    # Define the translation function
    translation_tool = {
        "type": "function",
        "function": {
            "name": "translation_definition",
            "description": f"Identifies the converted sentence to sound like a {speaker}",
            "parameters": {
                "type": "object",
                "properties": {
                    "converted_sentence": {
                        "type": "string",
                        "description": f"The converted sentence to sound like a {speaker}."
                    },
                    "original_sentence": {
                        "type": "string",
                        "description": "The original sentence."
                    }
                },
                "required": ["converted_sentence"]
            }
        }
    }

    # Combine all instructions into a single message
    messages = [
        {
            "role": "system",
            "content": "You are a sentence converted and function executor. Please convert the text to sounds like a specified speaker and return details using the defined function."
        },
        {
            "role": "user",
            "content": f"""Convert this to sound like a {speaker}:
            '{text}'
            ---
            Use the function to return the converted text and details.
            """
        }
    ]

    res = await asyncClient.chat.completions.create(
        model=get_settings().COMPLETIONS_MODEL,
        tools=[translation_tool],
        tool_choice="auto",
        messages=messages,
        temperature=0,       # Minimize randomness
        frequency_penalty=0, # Avoid penalizing repetitions
        top_p=1,             # Include all high-probability tokens
        presence_penalty=0   # No penalty for sticking to the same topics
    )
    
    conversion = json.loads(res.choices[0].message.tool_calls[0].function.arguments)

    return conversion['converted_sentence']

async def create_quiz(experience: str, quiz_type: str, asyncClient: AsyncOpenAI):
    # Define the quiz function
    quiz_tool = {
        "type": "function",
        "function": {
            "name": "quiz_definition",
            "description": f"Identifies informaiton relating to a quiz which is {quiz_type}",
            "parameters": {
                "type": "object",
                "properties": {
                    "answers": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": f"A possible answer to the question."
                        }
                    },
                    "correct_answer": {
                        "type": "string",
                        "description": "The correct answer to the questions generated"
                    },
                    "question": {
                        "type": "string",
                        "description": "The question being asked"
                    }
                },
                "required": ["answers", "correct_answer", "question"]
            }
        }
    }

    # Combine all instructions into a single message
    messages = [
        {
            "role": "system",
            "content": f"You are a quiz generator. You can either generate a {quiz_type} quiz. You are making quizzes for Discovery World Milwaukee. Try to make your question related to exhibit or Copy/MoreCopy while also taking in account for the intended age."
        },
        {
            "role": "user",
            "content": f"""Here is your context:
            \"Experience Name\": \"{experience['ExperienceName']}\"
            \"Description\": \"{experience['Description']}\"
            \"IntendedAgeRange\": \"{experience['IntendedAgeRange']}\"
            \"Topics\": \"{experience['Topics']}\"
            \"Copy\": \"{experience['Copy']}\"
            \"MoreCopy\": \"{experience['MoreCopy']}\"
            ---
            Use the function to return the quiz and its details.
            """
        }
    ]

    res = await asyncClient.chat.completions.create(
        model=get_settings().COMPLETIONS_MODEL,
        tools=[quiz_tool],
        tool_choice="auto",
        messages=messages,
        temperature=1,       # Minimize randomness
        frequency_penalty=0, # Avoid penalizing repetitions
        top_p=1,             # Include all high-probability tokens
        presence_penalty=0   # No penalty for sticking to the same topics
    )
    
    quiz = json.loads(res.choices[0].message.tool_calls[0].function.arguments)

    return quiz