import { NextRequest, NextResponse } from 'next/server';
import { testGeminiConnection, listAvailableModels } from '@/lib/gemini-api';

export async function GET(request: NextRequest) {
  try {
    // Test connection
    const connectionTest = await testGeminiConnection();
    
    // List available models
    const availableModels = await listAvailableModels();
    
    return NextResponse.json({
      success: true,
      connectionTest,
      availableModels,
      apiKeySet: !!process.env.GEMINI_API_KEY,
      modelFromEnv: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });
  } catch (error) {
    console.error('Gemini test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeySet: !!process.env.GEMINI_API_KEY,
        modelFromEnv: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      },
      { status: 500 }
    );
  }
}
