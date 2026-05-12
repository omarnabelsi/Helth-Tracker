import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)

def ask_groq(system_prompt: str, conversation_history: list[dict], user_message: str) -> str:
    """
    Send a message to Groq (Llama 3 70B by default).
    """
    try:
        print("[groq] Trying Llama 3.3 70B...")
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        messages.append({"role": "user", "content": user_message})

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
        )
        
        print("[groq] Success with Llama 3.3 70B")
        return completion.choices[0].message.content

    except Exception as e:
        print(f"[groq] Error: {str(e)}")
        raise

def ask_groq_vision(prompt: str, image_base64: str) -> str:
    """
    Send an image + prompt to Groq (Llama 3.2 Vision).
    """
    try:
        print("[groq-vision] Trying Llama 3.2 11B Vision...")
        
        # Groq expects a specific data URL format for images
        if "data:image" in image_base64:
            image_url = image_base64
        else:
            image_url = f"data:image/jpeg;base64,{image_base64}"

        completion = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                }
            ],
            temperature=0,
            max_tokens=1024,
        )
        
        print("[groq-vision] Success with Llama 3.2 11B Vision")
        return completion.choices[0].message.content

    except Exception as e:
        print(f"[groq-vision] Error: {str(e)}")
        raise
