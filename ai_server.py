import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = FastAPI()

# ✅ Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Define request schema
class PackingListRequest(BaseModel):
    trip_name: str
    destination: str
    days_gone: int
    tags: List[str]
    items: List[str]  
    weather: Optional[List[Dict[str, Any]]] = None

# ✅ Load AI Model
model_path = "mistral_model"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path, torch_dtype=torch.float16, device_map="auto")

@app.post("/generate_packing_list")
async def generate_packing_list(request_data: PackingListRequest):
    print("\n🔹 Received Request:", request_data.dict())  # Debugging Request

    # ✅ Extract `days_gone` safely
    days_gone = int(request_data.days_gone) if isinstance(request_data.days_gone, int) else 1

    # ✅ Compute suggested quantities for specific items
    socks_qty = days_gone  # 1 pair per day
    underwear_qty = days_gone  # 1 per day
    tshirts_qty = max(2, days_gone // 2)  # At least 2, otherwise every 2 days
    shorts_qty = max(1, days_gone // 3)  # At least 1, otherwise every 3 days

    # ✅ Construct AI Prompt
    prompt = f"""You are an expert travel assistant.
Generate a structured packing list for a trip.

### Trip Details:
- Destination: {request_data.destination}
- Trip Name: {request_data.trip_name}
- Duration: {days_gone} days
- Tags: {', '.join(request_data.tags)}

"""

    # ✅ Include Weather Forecast if Available
    if request_data.weather:
        prompt += "\n### Weather Forecast:\n"
        for day in request_data.weather:
            prompt += f"- {day.get('date', 'Unknown Date')}: {day.get('temp', 'N/A')}°C, {day.get('conditions', 'No conditions available')}\n"

    # ✅ Explicit Instructions for AI
    prompt += f"""
    ### Packing List Suggestions:
    Provide a structured packing list formatted like this:
    - **Essentials**:
      - Passport - Essentials (Qty: 1)
      - ID - Essentials (Qty: 1)
    - **Clothing**:
      - Running shoes - Clothing (Qty: 1)
      - Jacket - Clothing (Qty: 1)
      - Socks - Clothing (Qty: {socks_qty})
      - Underwear - Clothing (Qty: {underwear_qty})
      - T-shirts - Clothing (Qty: {tshirts_qty})
      - Shorts - Clothing (Qty: {shorts_qty})
    - **Toiletries**:
      - Toothbrush - Toiletries (Qty: 1)
      - Toothpaste - Toiletries (Qty: 1)
      - Shampoo - Toiletries (Qty: 1)
      - Conditioner - Toiletries (Qty: 1)
      - Deodorant - Toiletries (Qty: 1)
    """

    print("\n🔍 Generated Prompt:\n", prompt)  # Debug Prompt Before AI Call

    # ✅ Tokenize Input
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True)

    # ✅ Move to Correct Device
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    inputs = inputs.to(device)
    model.to(device)

    # ✅ Generate AI Response
    outputs = model.generate(**inputs, max_new_tokens=300)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("\n🔍 Raw AI Response:\n", response)  # Debug AI Output

    # ✅ Extract Packing List Using Improved Regex
    match = re.search(r"### Packing List Suggestions:\n([\s\S]+)", response)
    if match:
        packing_list_text = match.group(1).strip()
        print("\n🔍 Extracted Packing List Text:\n", packing_list_text)  # Debug Extracted List
    else:
        print("❌ No packing list found in response!")
        return "<ul><li>No packing list generated.</li></ul>"

    # ✅ Convert Extracted Text to HTML List
    formatted_list_html = "<ul>"
    current_category = None

    for line in packing_list_text.split("\n"):
        line = line.strip()

        # ✅ Detect category headers
        if line.startswith("- **") and line.endswith("**:"):
            current_category = line[4:-3].strip()  # Extract category name

        # ✅ Process list items
        elif line.startswith("- ") and current_category:
            item = line[2:].strip()

            # ✅ Extract quantity (if available)
            match = re.search(r"\(Qty: (\d+)\)", item)
            quantity = match.group(1) if match else "1"  # Default to 1

            # ✅ Remove redundant category and quantity info from item
            clean_item = re.sub(rf"\s*-\s*{re.escape(current_category)}(\s*\(Qty: \d+\))?$", "", item)
            clean_item = re.sub(r"\(Qty: \d+\)", "", clean_item).strip()  # Ensure only one quantity remains

            # ✅ Append formatted item
            formatted_list_html += f"<li>{clean_item} - {current_category} (Qty: {quantity})</li>"

    formatted_list_html += "</ul>"

    print("\n✅ Final Formatted Packing List HTML:\n", formatted_list_html)  # Debug Final Output

    return formatted_list_html  # ✅ Return as formatted HTML


    print("\n✅ Final Formatted Packing List HTML:\n", formatted_list_html)  # Debug Final Output

    return formatted_list_html  # ✅ Return as formatted HTML
