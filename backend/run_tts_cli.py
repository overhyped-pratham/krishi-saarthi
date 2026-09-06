import sys
import json
import argparse
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.ai.tts_speech_service import generate_audio_advisory

def main():
    parser = argparse.ArgumentParser(description="Agricultural TTS CLI")
    parser.add_argument("--text", type=str, required=True, help="Text to vocalize")
    parser.add_argument("--lang", type=str, default="hi", help="Language code")
    parser.add_argument("--engine", type=str, default="auto", help="Engine choice")
    
    args = parser.parse_args()
    res = generate_audio_advisory(text=args.text, language=args.lang, engine_choice=args.engine)
    
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(res))

if __name__ == "__main__":
    main()
