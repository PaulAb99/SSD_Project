import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Function to check available models
export async function checkAvailableModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${import.meta.env.VITE_GEMINI_API_KEY}`
    );
    const data = await response.json();
    console.log('📋 Available Gemini Models:', data.models?.map(m => m.name) || []);
    return data.models;
  } catch (error) {
    console.error('Error checking models:', error);
    return [];
  }
}

export function getLanguageName(code) {
  const names = {
    'en': 'English',
    'ro': 'Romanian',
    'hu': 'Hungarian',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish'
  };
  return names[code] || 'English';
}

export async function translateLocationContent(location, targetLanguage) {
  // Try multiple model names in order of preference (based on available models)
  const modelNames = [
    "gemini-2.5-flash",           // Latest stable flash model
    "gemini-flash-latest",        // Alias for latest flash
    "gemini-2.0-flash",           // Stable 2.0 flash
    "gemini-pro-latest",          // Alias for latest pro
    "gemini-2.5-pro"              // Latest pro (slower but more accurate)
  ];
  
  let lastError = null;
  
  for (const modelName of modelNames) {
    try {
      console.log(`🔄 Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
  
      const prompt = `
    Translate this heritage site information to ${targetLanguage}, maintaining cultural context and historical accuracy:
    
    Title: ${location.title}
    Description: ${location.description}
    Historical Period: ${location.historicalPeriod || location.historical_period || ''}
    Category: ${location.category || ''}
    Images: ${JSON.stringify(location.images || [])}
    
    Requirements:
    - Preserve the storytelling tone and engagement level
    - Keep proper nouns (place names, people) in original language with translation in parentheses if needed
    - Maintain historical accuracy
    - For images: preserve the URL exactly as-is, only translate the caption text
    - Return ONLY valid JSON without any markdown formatting or code blocks
    
    Return exactly this JSON structure:
    {
      "title": "translated title here",
      "description": "translated description here",
      "historicalPeriod": "translated period here",
      "category": "translated category here",
      "images": [{"url": "keep original url unchanged", "caption": "translated caption here"}]
    }
      `;

      console.log(`🌐 Starting translation to: ${targetLanguage} with ${modelName}`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
    
      console.log('📝 Raw Gemini response:', text);
    
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = text.trim();
    
      // Remove ```json and ``` markers
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
      // Extract JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', cleanedText);
        throw new Error('No valid JSON in translation response');
      }
    
      const parsed = JSON.parse(jsonMatch[0]);
    
      // Validate required fields
      if (!parsed.title || !parsed.description) {
        console.error('Invalid translation structure:', parsed);
        throw new Error('Translation missing required fields');
      }
    
      console.log(`✅ Translation successful with ${modelName}:`, parsed);
      return parsed;
      
    } catch (error) {
      console.warn(`❌ Model ${modelName} failed:`, error.message);
      lastError = error;
      continue; // Try next model
    }
  }
  
  // If all models failed, throw the last error
  console.error('❌ All models failed. Last error:', lastError);
  throw new Error(`Failed to translate with any model: ${lastError?.message}`);
}

// Batch translation helper
export async function translateBatch(locations, targetLanguage) {
  const translations = [];
  
  for (const location of locations) {
    try {
      const translated = await translateLocationContent(location, targetLanguage);
      translations.push({
        id: location.id,
        original: location,
        translated: translated
      });
      
      // Small delay to avoid rate limiting (Gemini free tier has limits)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to translate ${location.title}:`, error);
      translations.push({
        id: location.id,
        original: location,
        translated: null,
        error: error.message
      });
    }
  }
  
  return translations;
}

// New function to translate UI text
export async function translateUIText(texts, targetLanguage) {
  const modelNames = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-pro-latest",
    "gemini-2.5-pro"
  ];
  
  const textsJSON = JSON.stringify(texts, null, 2);
  
  const prompt = `
    Translate these UI text labels to ${targetLanguage}.
    
    Original texts (JSON):
    ${textsJSON}
    
    Requirements:
    - Keep the same JSON structure
    - Translate all text values to ${targetLanguage}
    - Keep any placeholders like {name}, {count}, etc. unchanged
    - Use appropriate formal/informal tone for UI elements
    - Return ONLY valid JSON without markdown
    
    Return the translated JSON with the same structure.
  `;

  let lastError = null;
  
  for (const modelName of modelNames) {
    try {
      console.log(`🔄 Trying UI translation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ UI translation successful with ${modelName}`);
      return parsed;
      
    } catch (error) {
      console.warn(`❌ UI translation with ${modelName} failed:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  console.error('❌ All models failed for UI translation. Last error:', lastError);
  throw new Error(`Failed to translate UI with any model: ${lastError?.message}`);
}
