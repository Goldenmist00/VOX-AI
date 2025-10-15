import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument, generateActionPlan } from '@/lib/gemini-api';

export async function POST(request: NextRequest) {
  try {
    const { content, actionPlanTopic, actionPlanSummary } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    // Analyze the document
    const analysis = await analyzeDocument(content);

    // Generate action plan if requested
    let actionPlan = null;
    if (actionPlanTopic && actionPlanSummary) {
      actionPlan = await generateActionPlan(actionPlanTopic, actionPlanSummary);
    }

    return NextResponse.json({
      success: true,
      analysis,
      actionPlan
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    );
  }
}
