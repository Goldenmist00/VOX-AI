
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// List available models
export async function listAvailableModels(): Promise<string[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return [];
    }
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models?key=' + process.env.GEMINI_API_KEY);
    const data = await response.json();
    
    if (data.models) {
      return data.models
        .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model: any) => model.name.replace('models/', ''));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to list models:', error);
    return [];
  }
}

// Test function to verify API connection
export async function testGeminiConnection(): Promise<boolean> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return false;
    }
    
    // Test with gemini-2.5-flash model
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent("Test connection");
      if (result.response !== null) {
        console.log(`Successfully connected using model: gemini-2.5-flash`);
        return true;
      }
    } catch (error) {
      console.log(`Model gemini-2.5-flash not available:`, error instanceof Error ? error.message : String(error));
    }
    
    return false;
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
}

export interface AnalysisResult {
  topic: {
    title: string;
    description: string;
    category: string;
    date: string;
    duration: string;
  };
  mainPoints: Array<{
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance: number;
    mentions: number;
    contributors: string[];
  }>;
  contributors: Array<{
    name: string;
    tag: string;
    score: number;
    role: string;
    contributions: number;
    clarity: number;
    engagement: number;
    avatar: string;
  }>;
  summary: string;
  solution: string;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    overall: string;
  };
  insights: string[];
}

export async function analyzeDocument(content: string): Promise<AnalysisResult> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    // Use gemini-2.5-flash model (v1 API compatible)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Analyze the following document content and provide a comprehensive analysis in JSON format. The document appears to be a discussion, debate, or meeting transcript.

    Document Content:
    ${content}

    Please provide analysis in the following JSON structure:
    {
      "topic": {
        "title": "Main topic/title of the discussion",
        "description": "Brief description of what the discussion is about",
        "category": "Category (e.g., Urban Planning, Technology, Environment, etc.)",
        "date": "Estimated date (YYYY-MM-DD format)",
        "duration": "Estimated duration (e.g., 1h 30m)"
      },
      "mainPoints": [
        {
          "text": "Key point or argument made",
          "sentiment": "positive|negative|neutral",
          "relevance": 85,
          "mentions": 12,
          "contributors": ["Speaker 1", "Speaker 2"]
        }
      ],
      "contributors": [
        {
          "name": "Contributor name",
          "tag": "Role or tag (e.g., Expert, Advocate, etc.)",
          "score": 92,
          "role": "Specific role or expertise",
          "contributions": 8,
          "clarity": 88,
          "engagement": 85,
          "avatar": "Initials for avatar"
        }
      ],
      "summary": "Comprehensive summary of the discussion",
      "solution": "Detailed proposed solutions with clear implementation steps, stakeholder involvement, and expected outcomes. Structure the solution with specific recommendations, timelines, and success metrics.",
      "sentiment": {
        "positive": 45,
        "neutral": 32,
        "negative": 23,
        "overall": "Balanced|Positive|Negative"
      },
      "insights": [
        "Key insight 1",
        "Key insight 2",
        "Key insight 3"
      ]
    }

    Focus on:
    1. Identifying the main topic and key arguments
    2. Analyzing sentiment for each major point
    3. Identifying key contributors and their roles
    4. Providing actionable insights and recommendations with specific implementation steps
    5. Calculating overall sentiment distribution
    6. For the solution, provide structured recommendations with clear timelines, stakeholder roles, and success metrics

    Return only valid JSON without any additional text or formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response to ensure it's valid JSON
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const analysis = JSON.parse(cleanedText);
      return analysis as AnalysisResult;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse analysis results');
    }
  } catch (error) {
    console.error('Error analyzing document:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error('Gemini model not available. Please check your API key and model name.');
      } else if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Gemini API key. Please check your environment variables.');
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
    }
    
    throw new Error('Failed to analyze document. Please check your API configuration.');
  }
}

export async function generateActionPlan(topic: string, summary: string): Promise<Array<{
  step: number;
  title: string;
  description: string;
  timeline: string;
  resources: string[];
}>> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    // Use gemini-2.5-flash model (v1 API compatible)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Based on the following topic and discussion summary, create a 3-step action plan for NGOs or policymakers.

    Topic: ${topic}
    Summary: ${summary}

    Please provide a 3-step action plan in JSON format:
    [
      {
        "step": 1,
        "title": "Action step title",
        "description": "Detailed description of what needs to be done",
        "timeline": "Estimated timeline (e.g., 2-4 weeks)",
        "resources": ["Resource 1", "Resource 2", "Resource 3"]
      }
    ]

    Focus on:
    1. Practical, actionable steps
    2. Realistic timelines
    3. Specific resources needed
    4. Community engagement
    5. Policy or advocacy components

    Return only valid JSON array without any additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const actionPlan = JSON.parse(cleanedText);
      return actionPlan;
    } catch (parseError) {
      console.error('Failed to parse action plan response:', parseError);
      throw new Error('Failed to generate action plan');
    }
  } catch (error) {
    console.error('Error generating action plan:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error('Gemini model not available. Please check your API key and model name.');
      } else if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Gemini API key. Please check your environment variables.');
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
    }
    
    throw new Error('Failed to generate action plan. Please check your API configuration.');
  }
}
