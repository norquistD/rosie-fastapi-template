from openai import AsyncOpenAI

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
            """
        }
    ]
    res = await asyncClient.chat.completions.create(
        model=get_settings().MODEL,
        messages=messages
    )
    return res.choices[0].message.tool_calls[0].function.arguments