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

    // Verify user is policymaker
    if (userRole !== 'policymaker') {
      return NextResponse.json(
        { error: 'Only policymakers can generate policy briefs' },
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

    // Extract key insights and concerns from messages
    const insights = messages
      .filter(msg => msg.analysis?.insights?.key_points)
      .flatMap(msg => msg.analysis.insights.key_points)
      .slice(0, 10)

    // Count supporting vs opposing stances
    const stances = messages.reduce((acc: any, msg) => {
      const stance = msg.analysis?.classification?.stance || 'neutral'
      acc[stance] = (acc[stance] || 0) + 1
      return acc
    }, {})

    // Generate policy brief using Gemini AI
    let policyBrief
    try {
      if (process.env.GEMINI_API_KEY) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const prompt = `
        You are an expert policy analyst. Generate a comprehensive policy brief based on the following public discourse analysis.

        Issue: ${issueTitle}
        Description: ${issueDescription || debate.description}
        
        Public Sentiment Analysis:
        - Positive: ${sentiment?.positive || 0}%
        - Neutral: ${sentiment?.neutral || 0}%
        - Negative: ${sentiment?.negative || 0}%
        
        Public Consensus Score: ${consensusScore || 50}/100
        Total Participants: ${messages.length}
        
        Key Public Concerns:
        ${(keyPoints || insights || ['No specific points available']).join('\n')}

        Stance Distribution:
        - Supporting: ${stances.supporting || 0}
        - Opposing: ${stances.opposing || 0}
        - Neutral: ${stances.neutral || 0}
        - Mixed: ${stances.mixed || 0}

        Generate a comprehensive policy brief in the following JSON format:
        {
          "title": "Policy brief title",
          "executiveSummary": "2-3 sentence summary of the issue and key recommendation",
          "consensus": "Clear statement about public consensus level and direction",
          "sentiment": "Analysis of public sentiment with specific percentages and interpretation",
          "urgency": "low|medium|high|critical",
          "publicDemands": [
            "Specific demand 1 with context",
            "Specific demand 2 with context",
            "Specific demand 3 with context",
            "Specific demand 4 with context"
          ],
          "policyRecommendations": [
            "Actionable policy recommendation 1",
            "Actionable policy recommendation 2",
            "Actionable policy recommendation 3",
            "Actionable policy recommendation 4"
          ],
          "stakeholders": {
            "primary": ["Primary stakeholder 1", "Primary stakeholder 2"],
            "secondary": ["Secondary stakeholder 1", "Secondary stakeholder 2"]
          },
          "implementationPriority": {
            "immediate": ["Immediate action 1", "Immediate action 2"],
            "shortTerm": ["Short-term action 1 (1-6 months)", "Short-term action 2"],
            "longTerm": ["Long-term action 1 (6-12 months)", "Long-term action 2"]
          },
          "expectedOutcomes": [
            "Expected positive outcome 1",
            "Expected positive outcome 2"
          ],
          "risks": [
            "Potential risk or challenge 1",
            "Potential risk or challenge 2"
          ],
          "costBenefitSummary": "Brief cost-benefit analysis",
          "legislativeActions": [
            "Required legislative action 1",
            "Required legislative action 2"
          ]
        }

        Base all recommendations on the public sentiment data and consensus score. Make it specific and actionable. Return only valid JSON.
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        // Parse the JSON response
        try {
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
          if (jsonMatch && jsonMatch[1]) {
            policyBrief = JSON.parse(jsonMatch[1])
          } else {
            // Try to parse directly if no code block
            const cleanText = text.replace(/```json|```/g, '').trim()
            policyBrief = JSON.parse(cleanText)
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError)
          throw new Error('Failed to parse policy brief')
        }
      } else {
        // Fallback brief if Gemini is not available
        policyBrief = {
          title: `Policy Brief: ${issueTitle}`,
          executiveSummary: `Public discourse shows ${consensusScore}% consensus on addressing ${issueTitle}. Immediate policy action recommended.`,
          consensus: `${consensusScore}% public consensus for action`,
          sentiment: `Strong ${sentiment?.positive > 50 ? 'positive' : sentiment?.negative > 50 ? 'negative' : 'neutral'} sentiment (${sentiment?.positive}% positive) with ${sentiment?.negative > 25 ? 'notable' : 'minimal'} opposition`,
          urgency: consensusScore > 70 ? 'high' : consensusScore > 50 ? 'medium' : 'low',
          publicDemands: keyPoints || insights || [
            'Immediate action to address core issues',
            'Transparent communication and updates',
            'Community involvement in solutions',
            'Accountability and monitoring systems'
          ],
          policyRecommendations: [
            'Fast-track policy development process',
            'Establish stakeholder consultation framework',
            'Create implementation oversight committee',
            'Allocate necessary resources and funding'
          ],
          stakeholders: {
            primary: ['General public', 'Local communities', 'Affected parties'],
            secondary: ['NGOs', 'Industry representatives', 'Academic experts']
          },
          implementationPriority: {
            immediate: ['Initiate stakeholder consultations', 'Draft preliminary policy framework'],
            shortTerm: ['Complete policy draft', 'Public comment period', 'Revise based on feedback'],
            longTerm: ['Legislative approval', 'Implementation rollout', 'Monitoring and evaluation']
          },
          expectedOutcomes: [
            'Improved public satisfaction and trust',
            'Effective resolution of identified issues',
            'Strengthened community engagement'
          ],
          risks: [
            'Implementation challenges due to resource constraints',
            'Potential opposition from affected interests',
            'Timeline pressures affecting quality'
          ],
          costBenefitSummary: 'Investment in addressing this issue will yield long-term benefits in public trust, social cohesion, and issue resolution that outweigh implementation costs.',
          legislativeActions: [
            'Draft enabling legislation or regulation',
            'Secure budgetary allocation',
            'Establish monitoring and evaluation framework'
          ]
        }
      }
    } catch (error) {
      console.error('Error generating policy brief:', error)
      return NextResponse.json(
        { error: 'Failed to generate policy brief' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      policyBrief
    })

  } catch (error) {
    console.error('Error in policy brief generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate policy brief' },
      { status: 500 }
    )
  }
}

