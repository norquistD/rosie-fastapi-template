from openai import AsyncOpenAI
import json
from core.settings import get_settings

async def translate_to_language(text: str, language: str, asyncClient: AsyncOpenAI):
    messages = [
        {
            "role": "system",
            "content": "You are a language translator. Please translate from english to another language."
        },
        {
            "role": "user",
            "content": f"""Translate this into {language}:
            '{text}'
            ---
            Return only the translated text.
            """
        }
    ]
    
    completion = await asyncClient.chat.completions.create(
        model=get_settings().MODEL,
        messages=messages
    )

    response = completion.choices[0].message.content

    translation_definition = {
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
                        "description": f"Original sentence English."
                    }
                },
                "required": ["translated_language"]
            }
        }
    }

    messages_tools = [
        {
            "role": "user",
            "content": f"""Find the translation:
            '{response}'
            """
        }
    ]
    res = await asyncClient.chat.completions.create(
        model=get_settings().MODEL,
        tools=[translation_definition],
        tool_choice={"type": "function", "function": {"name": "translation_definition"}},
        messages=messages_tools
    )
    
    translation = json.loads(res.choices[0].message.tool_calls[0].function.arguments)

    return translation['translated_language']