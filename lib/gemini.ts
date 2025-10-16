import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface GeminiAnalysis {
    sentiment: 'positive' | 'negative' | 'neutral'
    relevancyScore: number
    keywords: string[]
    contextMatch: boolean
    confidence: number
}

export interface DebateContext {
    title: string
    description: string
    tags: string[]
}

export class GeminiService {
    private model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    })

    async analyzeMessage(
        messageText: string,
        debateContext: DebateContext,
        existingVotes?: { agree: number; disagree: number; neutral: number }
    ): Promise<GeminiAnalysis> {
        try {
            const prompt = this.buildAnalysisPrompt(messageText, debateContext, existingVotes)

            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            return this.parseGeminiResponse(text, messageText, debateContext)
        } catch (error) {
            console.error('Gemini API Error:', error)
            return this.getFallbackAnalysis(messageText, debateContext)
        }
    }

    private buildAnalysisPrompt(
        messageText: string,
        debateContext: DebateContext,
        existingVotes?: { agree: number; disagree: number; neutral: number }
    ): string {
        const voteContext = existingVotes
            ? `Community votes: ${existingVotes.agree} agree, ${existingVotes.disagree} disagree, ${existingVotes.neutral} neutral.`
            : ''

        return `
Analyze this debate message for sentiment, relevancy, and quality:

DEBATE CONTEXT:
Title: "${debateContext.title}"
Description: "${debateContext.description}"
Tags: ${debateContext.tags.join(', ')}

MESSAGE TO ANALYZE:
"${messageText}"

${voteContext}

Please provide analysis in this exact JSON format:
{
  "sentiment": "positive|negative|neutral",
  "relevancyScore": number (10-100),
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "contextMatch": boolean,
  "confidence": number (0-100),
  "reasoning": "brief explanation"
}

SCORING CRITERIA:
- Relevancy (40%): How well does the message relate to the debate topic and tags?
- Quality (30%): Is the message constructive, well-reasoned, and adds value?
- Sentiment (20%): Positive (supportive, solution-oriented), Negative (critical, opposing), Neutral (balanced, questioning)
- Engagement (10%): Does it encourage meaningful discussion?

Score 80-100: Excellent contribution, highly relevant, well-reasoned
Score 60-79: Good contribution, mostly relevant, clear points
Score 40-59: Fair contribution, somewhat relevant, basic points
Score 10-39: Poor contribution, off-topic or low quality
    `.trim()
    }

    private parseGeminiResponse(
        responseText: string,
        originalMessage: string,
        debateContext: DebateContext
    ): GeminiAnalysis {
        try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                return {
                    sentiment: parsed.sentiment || 'neutral',
                    relevancyScore: Math.min(100, Math.max(10, parsed.relevancyScore || 50)),
                    keywords: (parsed.keywords || []).slice(0, 5),
                    contextMatch: parsed.contextMatch || false,
                    confidence: Math.min(100, Math.max(0, parsed.confidence || 50))
                }
            }
        } catch (error) {
            console.error('Failed to parse Gemini response:', error)
        }

        // Fallback to local analysis if parsing fails
        return this.getFallbackAnalysis(originalMessage, debateContext)
    }

    private getFallbackAnalysis(messageText: string, debateContext: DebateContext): GeminiAnalysis {
        // Local fallback analysis
        const keywords = this.extractKeywords(messageText)
        const contextRelevance = this.calculateContextRelevance(messageText, debateContext)
        const sentiment = this.analyzeSentiment(messageText)

        const relevancyScore = Math.min(100, Math.max(10,
            (contextRelevance * 0.4) +
            (sentiment.score * 0.3) +
            (keywords.length * 5) +
            (messageText.length > 50 ? 20 : 10)
        ))

        return {
            sentiment: sentiment.type,
            relevancyScore: Math.round(relevancyScore),
            keywords: keywords,
            contextMatch: contextRelevance > 70,
            confidence: 60 // Lower confidence for fallback
        }
    }

    private extractKeywords(text: string): string[] {
        const commonWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 'with', 'for', 'be', 'have', 'this', 'that', 'will', 'you', 'they', 'of', 'it', 'in', 'or', 'an', 'but', 'not', 'can', 'we', 'should', 'would', 'could']
        const words = text.toLowerCase().match(/\b\w+\b/g) || []

        return words
            .filter(word => word.length > 3 && !commonWords.includes(word))
            .reduce((acc: string[], word) => {
                if (!acc.includes(word)) acc.push(word)
                return acc
            }, [])
            .slice(0, 5)
    }

    private calculateContextRelevance(messageText: string, debateContext: DebateContext): number {
        const messageWords = messageText.toLowerCase().split(/\W+/)
        const topicWords = [
            ...debateContext.title.toLowerCase().split(/\W+/),
            ...debateContext.description.toLowerCase().split(/\W+/),
            ...debateContext.tags.join(' ').toLowerCase().split(/\W+/)
        ].filter(word => word.length > 3)

        let matches = 0
        messageWords.forEach(word => {
            if (word.length > 3 && topicWords.some(topicWord =>
                topicWord.includes(word) || word.includes(topicWord)
            )) {
                matches++
            }
        })

        return Math.min(100, (matches / Math.max(1, messageWords.length)) * 100)
    }

    private analyzeSentiment(text: string): { type: 'positive' | 'negative' | 'neutral', score: number } {
        const positiveWords = ['good', 'great', 'excellent', 'support', 'agree', 'positive', 'beneficial', 'effective', 'important', 'necessary', 'solution', 'improve', 'better', 'success', 'valuable']
        const negativeWords = ['bad', 'terrible', 'disagree', 'oppose', 'negative', 'harmful', 'ineffective', 'unnecessary', 'wrong', 'problematic', 'fail', 'worse', 'dangerous', 'useless', 'stupid']

        const words = text.toLowerCase().split(/\W+/)
        let score = 50 // neutral baseline

        words.forEach(word => {
            if (positiveWords.some(pos => word.includes(pos) || pos.includes(word))) score += 8
            if (negativeWords.some(neg => word.includes(neg) || neg.includes(word))) score -= 8
        })

        const finalScore = Math.min(100, Math.max(0, score))

        return {
            type: finalScore > 60 ? 'positive' : finalScore < 40 ? 'negative' : 'neutral',
            score: finalScore
        }
    }

    async batchAnalyzeMessages(
        messages: Array<{ text: string; votes?: { agree: number; disagree: number; neutral: number } }>,
        debateContext: DebateContext
    ): Promise<GeminiAnalysis[]> {
        const analyses = await Promise.all(
            messages.map(msg => this.analyzeMessage(msg.text, debateContext, msg.votes))
        )
        return analyses
    }

    async extractDebateKeywords(debateContext: DebateContext, recentMessages: string[]): Promise<string[]> {
        try {
            const prompt = `
Extract the most relevant keywords from this debate context and recent messages:

DEBATE: "${debateContext.title}"
DESCRIPTION: "${debateContext.description}"
TAGS: ${debateContext.tags.join(', ')}

RECENT MESSAGES:
${recentMessages.slice(0, 10).map((msg, i) => `${i + 1}. "${msg}"`).join('\n')}

Return only the top 8 most relevant keywords as a JSON array:
["keyword1", "keyword2", "keyword3", ...]

Focus on:
- Key concepts from the debate topic
- Important terms from participant messages
- Policy-relevant terminology
- Technical or domain-specific words
      `.trim()

            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            const jsonMatch = text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                const keywords = JSON.parse(jsonMatch[0])
                return keywords.slice(0, 8)
            }
        } catch (error) {
            console.error('Keyword extraction error:', error)
        }

        // Fallback to local extraction
        return this.extractKeywords([debateContext.title, debateContext.description, ...recentMessages].join(' '))
    }

    // New method for Reddit comment analysis with VOX-compatible format
    async analyzeRedditComment(
        commentText: string,
        postContext?: { title: string; subreddit: string; keyword: string }
    ): Promise<{
        sentiment: {
            overall: 'positive' | 'negative' | 'neutral'
            confidence: number
            positive_score: number
            negative_score: number
            neutral_score: number
        }
        analysis: {
            clarity: number
            relevance: number
            constructiveness: number
            evidence_quality: number
            respectfulness: number
        }
        scores: {
            overall_score: number
            contribution_quality: number
            debate_value: number
        }
        insights: {
            key_points: string[]
            strengths: string[]
            areas_for_improvement: string[]
            debate_impact: string
        }
        classification: {
            type: 'argument' | 'question' | 'agreement' | 'disagreement' | 'fact' | 'opinion' | 'solution' | 'concern'
            stance: 'supporting' | 'opposing' | 'neutral' | 'mixed'
            tone: 'professional' | 'passionate' | 'analytical' | 'emotional' | 'diplomatic'
        }
    }> {
        try {
            const contextInfo = postContext
                ? `Post Title: "${postContext.title}"\nSubreddit: r/${postContext.subreddit}\nKeyword: "${postContext.keyword}"`
                : 'General Reddit comment analysis'

            const prompt = `Analyze this Reddit comment in the context of "${postContext?.title || 'general discussion'}". Provide comprehensive analysis in JSON format.

COMMENT: "${commentText}"
${postContext ? `CONTEXT: ${postContext.title} (r/${postContext.subreddit})` : ''}

Expected JSON format:
{
  "sentiment": {
    "overall": "positive|negative|neutral",
    "confidence": 85,
    "positive_score": 20,
    "negative_score": 10,
    "neutral_score": 70
  },
  "analysis": {
    "clarity": 80,
    "relevance": 85,
    "constructiveness": 75,
    "evidence_quality": 70,
    "respectfulness": 90
  },
  "scores": {
    "overall_score": 80,
    "contribution_quality": 75,
    "debate_value": 85
  },
  "insights": {
    "key_points": ["Point 1", "Point 2"],
    "strengths": ["Strength 1"],
    "areas_for_improvement": ["Area 1"],
    "debate_impact": "Brief impact description"
  },
  "classification": {
    "type": "argument|question|agreement|disagreement|fact|opinion|solution|concern",
    "stance": "supporting|opposing|neutral|mixed",
    "tone": "professional|passionate|analytical|emotional|diplomatic"
  }
}

Return only valid JSON.`.trim()

            // Add timeout to prevent hanging (reduced to 8 seconds)
            const analysisPromise = this.model.generateContent(prompt)
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Reddit comment analysis timeout after 8 seconds')), 8000)
            })

            const result = await Promise.race([analysisPromise, timeoutPromise])
            const response = await result.response
            const text = response.text()

            return this.parseRedditAnalysisResponse(text, commentText, postContext)
        } catch (error: any) {
            // Handle specific Gemini API errors
            if (error?.status === 404 || error?.message?.includes('not found')) {
                console.warn('Gemini model not found, using fallback analysis')
            } else if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('Too Many Requests')) {
                console.warn('Gemini API quota exceeded, using fallback analysis')
            } else {
                console.error('Reddit comment analysis error:', error?.message || error)
            }
            return this.getRedditFallbackAnalysis(commentText, postContext)
        }
    }

    private parseRedditAnalysisResponse(
        responseText: string,
        originalComment: string,
        postContext?: { title: string; subreddit: string; keyword: string }
    ) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])

                // Validate and normalize the response to match VOX format
                return {
                    sentiment: {
                        overall: parsed.sentiment?.overall || 'neutral',
                        confidence: Math.min(100, Math.max(0, parsed.sentiment?.confidence || 50)),
                        positive_score: Math.min(100, Math.max(0, parsed.sentiment?.positive_score || 33)),
                        negative_score: Math.min(100, Math.max(0, parsed.sentiment?.negative_score || 33)),
                        neutral_score: Math.min(100, Math.max(0, parsed.sentiment?.neutral_score || 34))
                    },
                    analysis: {
                        clarity: Math.min(100, Math.max(0, parsed.analysis?.clarity || 50)),
                        relevance: Math.min(100, Math.max(0, parsed.analysis?.relevance || 50)),
                        constructiveness: Math.min(100, Math.max(0, parsed.analysis?.constructiveness || 50)),
                        evidence_quality: Math.min(100, Math.max(0, parsed.analysis?.evidence_quality || 50)),
                        respectfulness: Math.min(100, Math.max(0, parsed.analysis?.respectfulness || 50))
                    },
                    scores: {
                        overall_score: Math.min(100, Math.max(0, parsed.scores?.overall_score || 50)),
                        contribution_quality: Math.min(100, Math.max(0, parsed.scores?.contribution_quality || 50)),
                        debate_value: Math.min(100, Math.max(0, parsed.scores?.debate_value || 50))
                    },
                    insights: {
                        key_points: (parsed.insights?.key_points || []).slice(0, 3),
                        strengths: (parsed.insights?.strengths || []).slice(0, 2),
                        areas_for_improvement: (parsed.insights?.areas_for_improvement || []).slice(0, 2),
                        debate_impact: parsed.insights?.debate_impact || 'Analysis completed'
                    },
                    classification: {
                        type: parsed.classification?.type || 'opinion',
                        stance: parsed.classification?.stance || 'neutral',
                        tone: parsed.classification?.tone || 'analytical'
                    }
                }
            }
        } catch (error) {
            console.error('Failed to parse Reddit analysis response:', error)
        }

        // Fallback to local analysis if parsing fails
        return this.getRedditFallbackAnalysis(originalComment, postContext)
    }

    private getRedditFallbackAnalysis(
        commentText: string,
        postContext?: { title: string; subreddit: string; keyword: string }
    ) {
        // Use existing local analysis methods
        const keywords = this.extractKeywords(commentText)
        const sentiment = this.analyzeSentiment(commentText)

        // Calculate relevancy based on context if available
        let relevancyScore = 50
        if (postContext) {
            const contextWords = [postContext.title, postContext.keyword].join(' ')
            relevancyScore = this.calculateContextRelevance(commentText, {
                title: postContext.title,
                description: postContext.keyword,
                tags: [postContext.subreddit]
            })
        }

        return {
            sentiment: {
                overall: sentiment.type,
                confidence: 60, // Lower confidence for fallback
                positive_score: sentiment.type === 'positive' ? 70 : 20,
                negative_score: sentiment.type === 'negative' ? 70 : 20,
                neutral_score: sentiment.type === 'neutral' ? 70 : 20
            },
            analysis: {
                clarity: Math.min(100, commentText.length > 50 ? 60 : 40),
                relevance: relevancyScore,
                constructiveness: Math.min(100, commentText.split('.').length > 1 ? 60 : 40),
                evidence_quality: Math.min(100, keywords.length * 15),
                respectfulness: 70 // Default respectfulness score
            },
            scores: {
                overall_score: Math.min(100, (commentText.length / 10) + (keywords.length * 10)),
                contribution_quality: Math.min(100, keywords.length * 20),
                debate_value: relevancyScore
            },
            insights: {
                key_points: keywords.slice(0, 2),
                strengths: commentText.length > 100 ? ['Detailed response'] : [],
                areas_for_improvement: keywords.length === 0 ? ['Could be more specific'] : [],
                debate_impact: 'Local analysis - AI unavailable'
            },
            classification: {
                type: commentText.includes('?') ? 'question' : 'opinion',
                stance: sentiment.type === 'positive' ? 'supporting' : sentiment.type === 'negative' ? 'opposing' : 'neutral',
                tone: commentText.includes('!') || commentText.includes('?') ? 'emotional' : 'analytical'
            }
        }
    }
}

export const geminiService = new GeminiService()