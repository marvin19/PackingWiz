from transformers import AutoModelForCausalLM, AutoTokenizer


model_path = "mistral_model"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_path)

print("Loading model...")
model = AutoModelForCausalLM.from_pretrained(model_path)

print("Model loaded successfully")