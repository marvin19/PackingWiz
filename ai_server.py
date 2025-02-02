from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = FastAPI()

# ✅ Add CORS Middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow requests from frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# ✅ Define Pydantic model for request validation
class PackingListRequest(BaseModel):
    trip_name: str
    destination: str
    days_gone: int
    tags: List[str]
    items: List[str]  # Can be empty
    weather: Optional[List[Dict[str, Any]]] = None

# ✅ Load the AI model
model_path = "mistral_model"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path, torch_dtype=torch.float16, device_map="auto")

def analyze_weather(weather_data: List[Dict[str, Any]]) -> str:
    """Generate weather-based packing recommendations."""
    cold_threshold = 10  # Below 10°C → Needs warm layers
    warm_threshold = 25  # Above 25°C → Summer clothing
    rain_keywords = ["rain", "shower", "drizzle", "thunderstorm"]
    snow_keywords = ["snow", "blizzard"]

    clothing_suggestions = set()
    
    for day in weather_data:
        temp = day.get("temp", 20)  # Default to 20°C if missing
        conditions = day.get("conditions", "").lower()

        if temp < cold_threshold:
            clothing_suggestions.update(["Warm jacket", "Sweater", "Thermal layers", "Gloves", "Scarf", "Beanie"])
        elif temp > warm_threshold:
            clothing_suggestions.update(["Lightweight clothing", "Sunscreen", "Hat", "Sunglasses"])
        
        if any(word in conditions for word in rain_keywords):
            clothing_suggestions.update(["Rain jacket", "Umbrella", "Waterproof shoes"])
        
        if any(word in conditions for word in snow_keywords):
            clothing_suggestions.update(["Snow boots", "Thermal gloves", "Heavy coat"])

    return ", ".join(clothing_suggestions) if clothing_suggestions else "No specific weather-related items needed."

@app.post("/generate_packing_list")
async def generate_packing_list(request_data: PackingListRequest):

    print("🔹 Received Request:", request_data.dict())  # Debugging

    prompt = f"""You are an expert travel assistant.
Generate a structured packing list for a trip.

### Trip Details:
- Destination: {request_data.destination}
- Trip Name: {request_data.trip_name}
- Duration: {request_data.days_gone} days
- Tags: {', '.join(request_data.tags)}
"""

    # ✅ Include weather summary
    if request_data.weather:
        prompt += "\n### Weather Forecast:\n"
        for day in request_data.weather:
            prompt += f"- {day.get('date', 'Unknown Date')}: {day.get('temp', 'N/A')}°C, {day.get('conditions', 'No conditions available')}\n"

        # ✅ Generate weather-based recommendations
        weather_suggestions = analyze_weather(request_data.weather)
        prompt += f"\n### Weather Considerations:\n{weather_suggestions}\n"

    # ✅ **Handle Two Cases**: New list vs Enhancing an existing one
    if not request_data.items:
        # 🆕 **New Packing List** → Suggest everything
        prompt += "\n### Packing List Suggestions:\nInclude all necessary items based on the trip details."
    else:
        # 🛠 **Enhancing an Existing List** → Suggest **missing** items
        existing_items = set(request_data.items)
        prompt += "\n### Packing List Suggestions:\nSuggest additional items **not already in this list**:\n"
        prompt += f"- Current list: {', '.join(existing_items)}\n"

    # ✅ Tokenize & generate response
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    
    # ✅ Move to correct device
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    inputs = inputs.to(device)
    model.to(device)

    # ✅ Generate AI response
    outputs = model.generate(**inputs, max_new_tokens=200)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return {"packing_list": response}
