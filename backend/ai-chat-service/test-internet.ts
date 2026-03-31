async function testFetch() {
    try {
        console.log('Testing fetch to google.com...');
        const response = await fetch('https://www.google.com');
        console.log('✅ Response:', response.status, response.statusText);
        
        console.log('Testing fetch to generativelanguage.googleapis.com...');
        const apiResponse = await fetch('https://generativelanguage.googleapis.com');
        console.log('✅ API Response:', apiResponse.status, apiResponse.statusText);
    } catch (error: any) {
        console.error('❌ Fetch failed:', error.message);
        if (error.stack) console.log(error.stack);
    }
}

testFetch();
