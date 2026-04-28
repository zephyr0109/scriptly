import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def check_gemini_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in .env")
        return

    genai.configure(api_key=api_key)
    
    print(f"🔍 Checking available models for your API Key...")
    try:
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
                print(f"✅ Available: {m.name}")
        
        target_models = ['gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash']
        found_any = False
        print("\nChecking for recommended models:")
        for target in target_models:
            if any(target in m for m in available_models):
                print(f"🚀 SUCCESS: Your key can access {target}!")
                found_any = True
        
        if not found_any:
            print("\n⚠️ WARNING: None of the recommended 2026 models were found in your allowed models list.")
            
    except Exception as e:
        print(f"❌ API Call Failed: {e}")

if __name__ == "__main__":
    check_gemini_models()
