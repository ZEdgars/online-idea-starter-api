// generate-card.js

// 1. Import the Google GenAI SDK
const { GoogleGenAI } = require('@google/genai');

// The single, precise prompt that guides Gemini (Update this from your Step 1.2)
const PROMPT = "Generate a single, unique, creative constraint or unexpected idea starter for a design thinking workshop. The output must be concise, highly specific, and actionable. Maximum length is 7 words. Must be a standalone phrase. Ensure the context is professional yet surprising (e.g., 'Involve a quantum computer' or 'Be inspired by the chaos of a toddler's room').";

// The 'exports.handler' function is what Netlify runs when the public URL is accessed.
exports.handler = async (event, context) => {
  // 2. Initialize the AI Client
  // It securely reads the GEMINI_API_KEY environment variable set on Netlify.
  if (!process.env.GEMINI_API_KEY) {
      return {
          statusCode: 500,
          body: JSON.stringify({ error: "API Key not configured." }),
      };
  }
  
  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY}); 

  try {
    // 3. Call the Gemini API 
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: [
          {role: "user", parts: [{text: PROMPT}]}
        ],
        config: {
            temperature: 0.9, // High creativity
            maxOutputTokens: 50 // Ensures brevity
        }
    });

    // 🛑 FIX: Check if the text property exists before calling .trim()
    if (!response.text) {
        // Log the full response object to Netlify logs for debugging the empty result
        console.error("Gemini API Error: Response text was null or undefined. Full Response:", JSON.stringify(response));
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Gemini response was empty or blocked (e.g., safety filtering)." }),
        };
    }

    const generatedText = response.text.trim();

    // 4. Return the result securely to the frontend
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // This header is essential for allowing your Wix/Webflow page to talk to this Netlify function.
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "GET"
      },
      body: JSON.stringify({ cardText: generatedText }),
    };

  } catch (error) {
    // Log the full error object to Netlify's Function Logs
    console.error("Gemini API Error:", error.message || error); 
    
    // Check for a specific API error message to return to the user (optional)
    let userErrorMessage = "Failed to generate card content due to a server error.";

    if (error.message && error.message.includes("API key not valid")) {
        userErrorMessage = "Authentication failed: API Key may be invalid or restricted.";
    } else if (error.message && error.message.includes("403")) {
        userErrorMessage = "Permission denied: API Key may lack necessary permissions.";
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: userErrorMessage }),
    };
  }
}; // End of exports.handler