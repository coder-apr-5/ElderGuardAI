import os
import base64
import uuid
import time
import logging
import json
from typing import Dict, Optional, List
from openai import OpenAI
from elevenlabs import ElevenLabs
import aiofiles

logger = logging.getLogger(__name__)

class MultilingualAssistant:
    def __init__(self):
        # Initialize clients with API keys from environment
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key and not openai_key.startswith('sk-your-'):
            self.whisper_client = OpenAI(api_key=openai_key)
        else:
            self.whisper_client = None
            logger.warning("OpenAI API key missing or placeholder. Multilingual features will be disabled.")
        
        # Initialize ElevenLabs only if key is present
        eleven_key = os.getenv('ELEVENLABS_API_KEY')
        self.elevenlabs_client = ElevenLabs(api_key=eleven_key) if eleven_key else None
        
        self.supported_languages = self._load_supported_languages()
        self.voice_mappings = self._load_voice_mappings()
    
    async def process_voice_message(
        self,
        audio_base64: str,
        user_id: str,
        preferred_language: Optional[str] = None
    ) -> Dict:
        """
        Complete voice conversation pipeline:
        Speech -> Text -> LLM (in lang) -> Speech
        """
        start_time = time.time()
        
        # Step 1: Speech-to-Text
        transcription = await self.transcribe_audio(audio_base64, preferred_language)
        
        if transcription['confidence'] < 0.7:
            logger.warning(f"Low confidence transcription: {transcription['confidence']}")
        
        # Step 2: Get user context (Mock for now, would fetch from DB)
        user_context = {
            'user_id': user_id,
            'name': 'Friend',
            'culture': 'Western',
            'family_language': 'en',
            'voice_preference': 'default'
        }
        
        # Step 3: Generate AI response in same language
        ai_response = await self.generate_response(
            text=transcription['text'],
            language=transcription['language'],
            user_context=user_context
        )
        
        # Step 4: Text-to-Speech
        audio_response = await self.synthesize_speech(
            text=ai_response,
            language=transcription['language'],
            voice_preference=user_context.get('voice_preference')
        )
        
        # Step 5: Translate for family (if needed)
        translation = None
        if user_context.get('family_language') != transcription['language']:
            translation = await self.translate_text(
                text=ai_response,
                from_lang=transcription['language'],
                to_lang=user_context['family_language']
            )
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        return {
            'transcribed_text': transcription['text'],
            'detected_language': transcription['language'],
            'ai_response_text': ai_response,
            'ai_response_audio': audio_response,
            'translation': translation,
            'confidence': transcription['confidence'],
            'duration_ms': duration_ms
        }
    
    async def transcribe_audio(
        self,
        audio_base64: str,
        preferred_language: Optional[str] = None
    ) -> Dict:
        """
        Transcribe audio using Whisper API
        """
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_base64)
            
            # Save to temporary file (Whisper requires file input)
            temp_filename = f"audio_{uuid.uuid4()}.wav"
            
            # Use async file write or standard write
            with open(temp_filename, 'wb') as f:
                f.write(audio_bytes)
            
            # Call Whisper API
            with open(temp_filename, 'rb') as audio_file:
                # Note: OpenAI client is synchronous, for async use AsyncOpenAI or run in executor
                # For this implementation, we assume standardized synchronous usage or wrap it
                result = self.whisper_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=preferred_language,  # Optional hint
                    response_format="verbose_json"
                )
            
            # Cleanup
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            
            # Parse result (handling different response formats if needed)
            language = getattr(result, 'language', 'en')
            text = getattr(result, 'text', '')
            duration = getattr(result, 'duration', 0.0)
            
            # Calculate confidence from segments if available
            confidence = 1.0
            if hasattr(result, 'segments') and result.segments:
                 # Logic to average confidence or take first segment
                 pass 

            return {
                'text': text,
                'language': language,
                'confidence': confidence,
                'duration': duration
            }
            
        except Exception as e:
            logger.error(f"Transcription error: {str(e)}")
            # Cleanup on error
            if 'temp_filename' in locals() and os.path.exists(temp_filename):
                os.remove(temp_filename)
            raise
    
    async def generate_response(
        self,
        text: str,
        language: str,
        user_context: Dict
    ) -> str:
        """
        Generate AI response in user's language using GPT-4
        """
        # Language-specific system prompts
        system_prompts = {
            'en': "You are a caring AI companion for elderly people. Respond in simple, clear English.",
            'es': "Eres un compañero de IA cariñoso para personas mayores. Responde en español simple y claro.",
            'hi': "आप बुजुर्ग लोगों के लिए एक देखभाल करने वाले AI साथी हैं। सरल, स्पष्ट हिंदी में जवाब दें।",
            'zh': "你是一个关心老年人的人工智能伴侣。用简单明了的中文回答。",
            # Add more languages as needed
        }
        
        lang_code = language[:2] if language else 'en'
        system_prompt = system_prompts.get(lang_code, system_prompts['en'])
        
        # Add cultural context
        system_prompt += f"\n\nUser's cultural background: {user_context.get('culture', 'Western')}"
        system_prompt += f"\nUser's name: {user_context.get('name')}"
        system_prompt += "\n\nAlways respond in the SAME language as the user's message."
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
        
        # Call GPT-4
        response = self.whisper_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=150,
            temperature=0.8
        )
        
        return response.choices[0].message.content
    
    async def synthesize_speech(
        self,
        text: str,
        language: str,
        voice_preference: Optional[str] = None
    ) -> str:
        """
        Convert text to speech using ElevenLabs
        """
        if not self.elevenlabs_client:
            logger.warning("ElevenLabs client not initialized. Skipping TTS.")
            return ""

        # Select voice based on language and preference
        lang_code = language[:2] if language else 'en'
        
        # Mapping to specific ElevenLabs voice IDs (Placeholder IDs)
        voice_id = self.voice_mappings.get(lang_code, {}).get(
            voice_preference or 'default',
            self.voice_mappings.get('en', {}).get('default', '21m00Tcm4TlvDq8ikWAM') # Fallback to Rachel
        )
        
        try:
            # Generate audio
            audio_generator = self.elevenlabs_client.generate(
                text=text,
                voice=voice_id,
                model="eleven_multilingual_v2"
            )
            
            # Output is a generator of bytes, combine them
            audio_bytes = b"".join(audio_generator)
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            return audio_base64
            
        except Exception as e:
            logger.error(f"TTS error: {str(e)}")
            return ""
    
    async def translate_text(
        self,
        text: str,
        from_lang: str,
        to_lang: str
    ) -> str:
        """
        Translate text for family members using GPT-4
        """
        prompt = f"""Translate the following text from {from_lang} to {to_lang}.
Preserve the emotional tone and context. This is a conversation with an elderly person.

Original text:
{text}

Translated text:"""
        
        try:
            response = self.whisper_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text
    
    def _load_supported_languages(self) -> List[str]:
        return [
            'en', 'es', 'zh', 'hi', 'pt', 'fr', 'de', 'ja', 'ko', 'it',
            'ar', 'ru', 'bn', 'vi', 'th', 'tr', 'pl', 'nl'
        ]

    def _load_voice_mappings(self) -> Dict:
        """
        Map languages to ElevenLabs voice IDs (Example IDs)
        """
        return {
            'en': {'default': '21m00Tcm4TlvDq8ikWAM'}, # Rachel
            'es': {'default': 'ErXwobaYiN019PkySvjV'}, # Antoni
            'hi': {'default': '21m00Tcm4TlvDq8ikWAM'}, # Fallback (ElevenLabs multilingual handles accents)
        }

# Global instance
multilingual_assistant = MultilingualAssistant()
