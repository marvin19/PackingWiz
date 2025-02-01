from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from transformers import AutoModelForCausalLM, AutoTokenizer
from fastapi.middleware.cors import CORSMiddleware
import torch

app = FastAPI()

# ✅ Add CORS Middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow all origins, change to specific frontend URL if needed
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (POST, GET, etc.)
    allow_headers=["*"],  # Allow all headers
)

# ✅ Define Pydantic model for request validation
class PackingListRequest(BaseModel):
    trip_name: str
    tags: List[str]
    items: List[str]

# ✅ Load model
model_path = "mistral_model"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path, torch_dtype=torch.float16, device_map="auto")

@app.post("/generate_packing_list")
async def generate_packing_list(request_data: dict):

    # Debugging - Print tags to check for emojis
    print("Received tags:", request_data["tags"])  # Print tags in the server logs

    prompt = f"Generate a packing list for {request_data['trip_name']} with tags: {', '.join(request_data['tags'])}. Include: {', '.join(request_data['items'])}."

    inputs = tokenizer(prompt, return_tensors="pt")
    
    # Move inputs to the same device as the model
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    inputs = inputs.to(device)
    model.to(device)  # Ensure model is also on MPS

    outputs = model.generate(**inputs, max_length=200)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return {"packing_list": response}

