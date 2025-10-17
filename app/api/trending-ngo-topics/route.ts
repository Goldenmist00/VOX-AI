import { NextRequest, NextResponse } from 'next/server'
import RedditRSSService from '@/lib/reddit-rss-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const redditService = new RedditRSSService()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get trending topics for NGOs
    const trendingTopics = await getTrendingNGOTopics(limit)

    return NextResponse.json({
      success: true,
      trending_topics: trendingTopics,
      timestamp: new Date().toISOString(),
      total_topics: trendingTopics.length
    })
  } catch (error) {
    console.error('Error fetching trending NGO topics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch trending NGO topics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function getTrendingNGOTopics(limit: number) {
  // Define current trending topics for NGOs based on global issues
  const trendingTopics = [
    {
      topic: 'Climate Action',
      keywords: ['climate change', 'sustainability', 'renewable energy'],
      urgency: 'high',
      description: 'Global climate initiatives and environmental sustainability efforts',
      subreddits: ['environment', 'climatechange', 'sustainability'],
      trending_score: 95
    },
    {
      topic: 'Social Equity',
      keywords: ['inequality', 'social justice', 'human rights'],
      urgency: 'high', 
      description: 'Addressing social inequalities and promoting justice',
      subreddits: ['socialjustice', 'humanrights', 'activism'],
      trending_score: 90
    },
    {
      topic: 'Mental Health Crisis',
      keywords: ['mental health', 'depression', 'anxiety', 'suicide prevention'],
      urgency: 'critical',
      description: 'Growing mental health challenges and support initiatives',
      subreddits: ['mentalhealth', 'depression', 'anxiety'],
      trending_score: 88
    },
    {
      topic: 'Digital Divide',
      keywords: ['digital access', 'internet inequality', 'tech education'],
      urgency: 'medium',
      description: 'Bridging technology gaps in underserved communities',
      subreddits: ['technology', 'education', 'digital'],
      trending_score: 85
    },
    {
      topic: 'Food Security',
      keywords: ['hunger', 'food insecurity', 'nutrition', 'food banks'],
      urgency: 'high',
      description: 'Addressing global hunger and food access issues',
      subreddits: ['food', 'nutrition', 'poverty'],
      trending_score: 82
    },
    {
      topic: 'Refugee Crisis',
      keywords: ['refugees', 'displacement', 'immigration', 'asylum'],
      urgency: 'critical',
      description: 'Supporting displaced populations and refugee assistance',
      subreddits: ['refugees', 'immigration', 'humanrights'],
      trending_score: 80
    },
    {
      topic: 'Youth Empowerment',
      keywords: ['youth development', 'education', 'mentorship', 'leadership'],
      urgency: 'medium',
      description: 'Empowering young people through education and opportunities',
      subreddits: ['education', 'youth', 'mentorship'],
      trending_score: 78
    },
    {
      topic: 'Elderly Care',
      keywords: ['aging', 'elderly care', 'senior citizens', 'healthcare'],
      urgency: 'high',
      description: 'Supporting aging populations and elderly care needs',
      subreddits: ['aging', 'healthcare', 'seniors'],
      trending_score: 75
    },
    {
      topic: 'Homelessness',
      keywords: ['homelessness', 'housing crisis', 'affordable housing'],
      urgency: 'critical',
      description: 'Addressing homelessness and housing insecurity',
      subreddits: ['homeless', 'housing', 'poverty'],
      trending_score: 73
    },
    {
      topic: 'Education Inequality',
      keywords: ['education gap', 'literacy', 'school funding', 'educational access'],
      urgency: 'high',
      description: 'Bridging educational gaps and improving access to quality education',
      subreddits: ['education', 'teachers', 'literacy'],
      trending_score: 70
    },
    {
      topic: 'Community Resilience',
      keywords: ['disaster preparedness', 'community building', 'local development'],
      urgency: 'medium',
      description: 'Building stronger, more resilient communities',
      subreddits: ['community', 'disasters', 'localpolitics'],
      trending_score: 68
    },
    {
      topic: 'Sustainable Development',
      keywords: ['sustainable development', 'SDGs', 'global goals'],
      urgency: 'medium',
      description: 'Working towards UN Sustainable Development Goals',
      subreddits: ['development', 'sustainability', 'globalhealth'],
      trending_score: 65
    }
  ]

  // Sort by trending score and return limited results
  return trendingTopics
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, limit)
    .map(topic => ({
      ...topic,
      last_updated: new Date().toISOString(),
      action_items: generateActionItems(topic.topic),
      impact_potential: calculateImpactPotential(topic.trending_score)
    }))
}

function generateActionItems(topic: string): string[] {
  const actionMap: Record<string, string[]> = {
    'Climate Action': [
      'Launch community recycling programs',
      'Advocate for renewable energy policies',
      'Organize climate awareness campaigns'
    ],
    'Social Equity': [
      'Develop inclusive community programs',
      'Advocate for policy reforms',
      'Create awareness campaigns on social justice'
    ],
    'Mental Health Crisis': [
      'Establish support groups and counseling services',
      'Launch mental health awareness campaigns',
      'Partner with healthcare providers'
    ],
    'Digital Divide': [
      'Provide technology training programs',
      'Distribute devices to underserved communities',
      'Advocate for broadband access policies'
    ],
    'Food Security': [
      'Establish community food banks',
      'Create nutrition education programs',
      'Partner with local farmers and suppliers'
    ]
  }

  return actionMap[topic] || [
    'Conduct community needs assessment',
    'Develop targeted intervention programs',
    'Build partnerships with relevant stakeholders'
  ]
}

function calculateImpactPotential(score: number): string {
  if (score >= 90) return 'Very High'
  if (score >= 80) return 'High'
  if (score >= 70) return 'Medium'
  return 'Moderate'
}