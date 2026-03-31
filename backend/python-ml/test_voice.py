import asyncio
import base64
from app.services.multilingual_service import multilingual_assistant

async def main():
    dummy_wav = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
    b64 = base64.b64encode(dummy_wav).decode('utf-8')
    try:
        res = await multilingual_assistant.process_voice_message(b64, 'test_user')
        print('SUCCESS:', res.keys())
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
