import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in root .env');
    process.exit(1);
}

async function testGeminiJSON() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey!);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: {
                role: 'system',
                parts: [{ text: "You are a helpful assistant." }]
            },
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        console.log('🚀 Testing Gemini API with gemini-2.5-flash...');
        const chat = model.startChat({
            history: [{ role: 'user', parts: [{ text: 'Respond with a simple JSON object' }] }],
        });
        
        const result = await chat.sendMessage('Hello?');
        console.log('✅ Response:', result.response.text());
    } catch (error: any) {
        console.error('❌ Error details:', error);
    }
}

testGeminiJSON();
