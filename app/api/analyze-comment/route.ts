import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { comment, debateTopic } = await req.json();

    if (!comment) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Analyze the following comment in the context of a debate about "${debateTopic}". Provide a comprehensive analysis in JSON format.

    Comment: "${comment}"

    Expected JSON format:
    {
      "sentiment": {
        "overall": "positive|negative|neutral",
        "confidence": "number (0-100)",
        "positive_score": "number (0-100)",
        "negative_score": "number (0-100)",
        "neutral_score": "number (0-100)"
      },
      "analysis": {
        "clarity": "number (0-100)",
        "relevance": "number (0-100)",
        "constructiveness": "number (0-100)",
        "evidence_quality": "number (0-100)",
        "respectfulness": "number (0-100)"
      },
      "scores": {
        "overall_score": "number (0-100)",
        "contribution_quality": "number (0-100)",
        "debate_value": "number (0-100)"
      },
      "insights": {
        "key_points": ["string"],
        "strengths": ["string"],
        "areas_for_improvement": ["string"],
        "debate_impact": "string"
      },
      "classification": {
        "type": "argument|question|agreement|disagreement|fact|opinion|solution|concern",
        "stance": "supporting|opposing|neutral|mixed",
        "tone": "professional|passionate|analytical|emotional|diplomatic"
      }
    }

    Focus on:
    1. Analyzing sentiment with high accuracy
    2. Evaluating the quality and constructiveness of the comment
    3. Assessing relevance to the debate topic
    4. Providing actionable insights for improvement
    5. Classifying the type and stance of the comment

    Return only valid JSON without any additional text or formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let analysis;
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        analysis = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse analysis results');
    }

    return NextResponse.json({ 
      success: true, 
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Comment analysis error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json({ error: 'Gemini model not available. Please check your API configuration.' }, { status: 500 });
      } else if (error.message.includes('API key')) {
        return NextResponse.json({ error: 'Invalid or missing Gemini API key.' }, { status: 500 });
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json({ error: 'API quota exceeded. Please try again later.' }, { status: 429 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to analyze comment. Please try again.' }, { status: 500 });
  }
}
