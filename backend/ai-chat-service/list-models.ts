import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey!);
        // @ts-ignore
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Listing models is not directly available in this SDK version as a simple method in some cases, but we can test names.");
        
        const testModels = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];
        
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
