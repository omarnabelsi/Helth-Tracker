"""
Clarifai food recognition service.
Sends a food photo to the Clarifai food-item-recognition model
and returns identified food names with confidence scores.
"""
import os
from grpc import insecure_channel, secure_channel, ssl_channel_credentials
from clarifai_grpc.grpc.api import resources_pb2, service_pb2, service_pb2_grpc
from clarifai_grpc.grpc.api.status import status_code_pb2

PAT = os.getenv("CLARIFAI_PAT", "")
USER_ID = os.getenv("CLARIFAI_USER_ID", "clarifai")
APP_ID = os.getenv("CLARIFAI_APP_ID", "main")
MODEL_ID = os.getenv("CLARIFAI_MODEL_ID", "food-item-recognition")
MODEL_VERSION_ID = os.getenv("CLARIFAI_MODEL_VERSION_ID", "")

# Rough calorie lookup for common foods (per typical serving)
CALORIE_DB = {
    "pizza": {"cal": 285, "p": 12, "c": 36, "f": 10},
    "burger": {"cal": 354, "p": 20, "c": 29, "f": 17},
    "salad": {"cal": 150, "p": 5, "c": 12, "f": 9},
    "rice": {"cal": 206, "p": 4, "c": 45, "f": 0.4},
    "chicken": {"cal": 239, "p": 27, "c": 0, "f": 14},
    "pasta": {"cal": 220, "p": 8, "c": 43, "f": 1.3},
    "bread": {"cal": 265, "p": 9, "c": 49, "f": 3.2},
    "egg": {"cal": 155, "p": 13, "c": 1.1, "f": 11},
    "fish": {"cal": 206, "p": 22, "c": 0, "f": 12},
    "fruit": {"cal": 60, "p": 0.8, "c": 15, "f": 0.3},
    "steak": {"cal": 271, "p": 26, "c": 0, "f": 18},
    "soup": {"cal": 100, "p": 5, "c": 12, "f": 3},
    "sandwich": {"cal": 350, "p": 15, "c": 35, "f": 16},
    "sushi": {"cal": 200, "p": 9, "c": 28, "f": 5},
    "falafel": {"cal": 330, "p": 13, "c": 32, "f": 18},
    "hummus": {"cal": 166, "p": 8, "c": 14, "f": 10},
    "shawarma": {"cal": 420, "p": 28, "c": 38, "f": 16},
}


def recognize_food(image_bytes: bytes) -> dict:
    """
    Send image bytes to Clarifai food-item-recognition model.
    Returns {"food_name": str, "calories": float, "protein_g", "carbs_g", "fat_g"}.
    """
    channel = secure_channel("api.clarifai.com", ssl_channel_credentials())
    stub = service_pb2_grpc.V2Stub(channel)
    metadata = (("authorization", f"Key {PAT}"),)

    request = service_pb2.PostModelOutputsRequest(
        user_app_id=resources_pb2.UserAppIDSet(user_id=USER_ID, app_id=APP_ID),
        model_id=MODEL_ID,
        version_id=MODEL_VERSION_ID if MODEL_VERSION_ID else None,
        inputs=[
            resources_pb2.Input(
                data=resources_pb2.Data(image=resources_pb2.Image(base64=image_bytes))
            )
        ],
    )

    response = stub.PostModelOutputs(request, metadata=metadata)

    if response.status.code != status_code_pb2.SUCCESS:
        raise RuntimeError(f"Clarifai API error: {response.status.description}")

    # Take the top concept
    concepts = response.outputs[0].data.concepts
    if not concepts:
        return {"food_name": "Unknown food", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0}

    top = concepts[0]
    food_name = top.name.lower()

    # Look up macros (fallback to generic values)
    macros = None
    for key, val in CALORIE_DB.items():
        if key in food_name:
            macros = val
            break
    if macros is None:
        macros = {"cal": 200, "p": 10, "c": 25, "f": 8}

    return {
        "food_name": top.name.capitalize(),
        "calories": macros["cal"],
        "protein_g": macros["p"],
        "carbs_g": macros["c"],
        "fat_g": macros["f"],
    }
