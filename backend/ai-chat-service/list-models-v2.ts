import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey!);
        const testModels = [
            "gemini-2.5-flash",
            "gemini-3.1-pro-preview",
            "gemini-flash-latest"
        ];
        
        console.log("🚀 Testing Gemini API with specific model names from your available list...");
        for (const name of testModels) {
            try {
                const m = genAI.getGenerativeModel({ model: name });
                const result = await m.generateContent("hi");
                console.log(`✅ Model '${name}' is AVAILABLE. Response: ${result.response.text().substring(0, 10)}...`);
            } catch (e: any) {
                console.log(`❌ Model '${name}' is NOT available. Error: ${e.message}`);
            }
        }
    } catch (error: any) {
        console.error('❌ Error listing models:', error.message);
    }
}

listModels();
