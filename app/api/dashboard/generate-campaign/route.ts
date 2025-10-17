import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Debate from '@/models/Debate'
import Message from '@/models/Message'
import { jwtVerify } from 'jose'
import { GoogleGenerativeAI } from '@google/generative-ai'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    // Verify authentication
    const token = req.cookies.get('vox-ai-auth')?.value || req.cookies.get('vox-ai-auth-debug')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userRole = (payload as any).role

    // Verify user is NGO
    if (userRole !== 'ngo') {
      return NextResponse.json(
        { error: 'Only NGOs can generate campaign plans' },
        { status: 403 }
      )
    }

    const { issueId, issueTitle, issueDescription, sentiment, consensusScore, keyPoints } = await req.json()

    if (!issueId || !issueTitle) {
      return NextResponse.json(
        { error: 'Issue ID and title are required' },
        { status: 400 }
      )
    }

    // Fetch debate and messages for context
    const debate = await Debate.findById(issueId)
    if (!debate) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    const messages = await Message.find({ debateId: issueId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    // Extract key insights from messages
    const insights = messages
      .filter(msg => msg.analysis?.insights?.key_points)
      .flatMap(msg => msg.analysis.insights.key_points)
      .slice(0, 10)

    // Generate campaign plan using Gemini AI
    let campaignPlan
    try {
      if (process.env.GEMINI_API_KEY) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const prompt = `
        You are an expert NGO campaign strategist. Generate a comprehensive, actionable campaign plan based on the following public issue analysis.

        Issue: ${issueTitle}
        Description: ${issueDescription || debate.description}
        
        Public Sentiment:
        - Positive: ${sentiment?.positive || 0}%
        - Neutral: ${sentiment?.neutral || 0}%
        - Negative: ${sentiment?.negative || 0}%
        
        Consensus Score: ${consensusScore || 50}/100
        
        Key Public Concerns:
        ${(keyPoints || insights || ['No specific points available']).join('\n')}

        Generate a strategic 3-step campaign plan in the following JSON format:
        {
          "title": "Campaign name",
          "objective": "Clear campaign objective",
          "targetAudience": "Primary audience",
          "expectedImpact": "Expected outcomes",
          "steps": [
            {
              "step": 1,
              "title": "Phase 1 title",
              "description": "Detailed description of activities, tactics, and goals for this phase",
              "timeline": "Duration estimate (e.g., '2-4 weeks')",
              "resources": "Required resources, team, and budget considerations",
              "successMetrics": "How to measure success of this phase",
              "keyActivities": ["Activity 1", "Activity 2", "Activity 3"]
            },
            {
              "step": 2,
              "title": "Phase 2 title",
              "description": "Detailed description",
              "timeline": "Duration estimate",
              "resources": "Required resources",
              "successMetrics": "Success metrics",
              "keyActivities": ["Activity 1", "Activity 2", "Activity 3"]
            },
            {
              "step": 3,
              "title": "Phase 3 title",
              "description": "Detailed description",
              "timeline": "Duration estimate",
              "resources": "Required resources",
              "successMetrics": "Success metrics",
              "keyActivities": ["Activity 1", "Activity 2", "Activity 3"]
            }
          ],
          "risks": ["Risk 1", "Risk 2"],
          "mitigation": ["Mitigation strategy 1", "Mitigation strategy 2"]
        }

        Make the plan specific, actionable, and tailored to the sentiment and consensus data. Return only valid JSON.
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        // Parse the JSON response
        try {
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
          if (jsonMatch && jsonMatch[1]) {
            campaignPlan = JSON.parse(jsonMatch[1])
          } else {
            // Try to parse directly if no code block
            const cleanText = text.replace(/```json|```/g, '').trim()
            campaignPlan = JSON.parse(cleanText)
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError)
          throw new Error('Failed to parse campaign plan')
        }
      } else {
        // Fallback plan if Gemini is not available
        campaignPlan = {
          title: `${issueTitle} Campaign`,
          objective: `Address public concerns about ${issueTitle}`,
          targetAudience: 'General public and stakeholders',
          expectedImpact: 'Increased awareness and policy engagement',
          steps: [
            {
              step: 1,
              title: 'Community Awareness & Mobilization',
              description: 'Launch public awareness campaign through social media, community events, and educational workshops to build grassroots support.',
              timeline: '2-4 weeks',
              resources: 'Social media team, community organizers, educational materials, event venues',
              successMetrics: 'Reach 10,000+ people, 500+ event attendees, 20% engagement rate',
              keyActivities: ['Social media campaign', 'Community workshops', 'Educational materials distribution']
            },
            {
              step: 2,
              title: 'Stakeholder Engagement & Coalition Building',
              description: 'Engage with local businesses, community leaders, and government officials to build a broad coalition for change.',
              timeline: '4-6 weeks',
              resources: 'Policy team, meeting venues, presentation materials, coalition coordination',
              successMetrics: '15+ partner organizations, 3+ official endorsements, media coverage',
              keyActivities: ['Stakeholder roundtables', 'Coalition meetings', 'Media outreach']
            },
            {
              step: 3,
              title: 'Policy Advocacy & Implementation Monitoring',
              description: 'Present unified recommendations to decision-makers, maintain public pressure, and monitor implementation of changes.',
              timeline: '8-12 weeks',
              resources: 'Legal support, policy analysts, media team, monitoring systems',
              successMetrics: 'Policy proposal presented, public hearing achieved, implementation timeline set',
              keyActivities: ['Policy brief presentation', 'Public testimony', 'Implementation monitoring']
            }
          ],
          risks: ['Public interest may wane', 'Opposition from vested interests'],
          mitigation: ['Regular updates and wins', 'Proactive stakeholder engagement']
        }
      }
    } catch (error) {
      console.error('Error generating campaign plan:', error)
      return NextResponse.json(
        { error: 'Failed to generate campaign plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaignPlan
    })

  } catch (error) {
    console.error('Error in campaign generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate campaign plan' },
      { status: 500 }
    )
  }
}

