# Gemini AI Integration Setup

## Overview
VOX AI uses Google's Gemini AI for advanced sentiment analysis, keyword extraction, and relevancy scoring (10-100) of debate messages.

## Features
- **Sentiment Analysis**: Positive/Negative/Neutral classification
- **Relevancy Scoring**: 10-100 score based on context, quality, and engagement
- **Keyword Extraction**: Automatic identification of key terms and concepts
- **Context Matching**: Measures how well messages relate to debate topics
- **Real-time Analysis**: Instant feedback on message quality and relevance

## Setup Instructions

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the generated key

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Gemini API key to `.env.local`:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 3. Optional Configuration
You can customize the Gemini model settings in `.env.local`:

```env
# Model Selection (default: gemini-1.5-flash)
GEMINI_MODEL=gemini-1.5-flash

# Response Length (default: 1000)
GEMINI_MAX_TOKENS=1000

# Creativity Level (0.0-1.0, default: 0.7)
GEMINI_TEMPERATURE=0.7
```

## How It Works

### Message Analysis
When users post messages, Gemini analyzes:
1. **Context Relevance (40%)**: How well the message relates to the debate topic
2. **Quality Assessment (30%)**: Constructiveness and reasoning quality
3. **Sentiment Analysis (20%)**: Emotional tone and stance
4. **Engagement Potential (10%)**: Likelihood to generate meaningful discussion

### Scoring System
- **80-100**: Excellent contribution (Emerald)
- **60-79**: Good contribution (Blue)
- **40-59**: Fair contribution (Yellow)
- **10-39**: Poor contribution (Red)

### Real-time Features
- **Live Keyword Updates**: New keywords extracted from messages
- **Dynamic Re-scoring**: Scores adjust based on community votes
- **Context Matching**: Visual indicators for highly relevant messages
- **Batch Analysis**: Efficient processing of multiple messages

## API Usage

### Basic Message Analysis
```typescript
import { geminiService } from '@/lib/gemini'

const analysis = await geminiService.analyzeMessage(
  "Your message text here",
  {
    title: "Debate Title",
    description: "Debate description",
    tags: ["tag1", "tag2"]
  }
)

console.log(analysis.relevancyScore) // 10-100
console.log(analysis.sentiment) // 'positive' | 'negative' | 'neutral'
console.log(analysis.keywords) // ['keyword1', 'keyword2', ...]
```

### Batch Analysis
```typescript
const messages = [
  { text: "Message 1", votes: { agree: 5, disagree: 1, neutral: 2 } },
  { text: "Message 2", votes: { agree: 3, disagree: 4, neutral: 1 } }
]

const analyses = await geminiService.batchAnalyzeMessages(messages, debateContext)
```

### Keyword Extraction
```typescript
const keywords = await geminiService.extractDebateKeywords(
  debateContext,
  recentMessages
)
```

## Error Handling
The system includes robust fallback mechanisms:
- **API Failures**: Falls back to local analysis algorithms
- **Rate Limiting**: Implements exponential backoff
- **Invalid Responses**: Graceful degradation with default scores
- **Network Issues**: Cached analysis for offline scenarios

## Security
- API keys are stored in environment variables
- Keys are never exposed to client-side code
- All API calls are server-side only
- Rate limiting prevents abuse

## Monitoring
- Real-time confidence scores for analysis quality
- Fallback indicators when API is unavailable
- Performance metrics for response times
- Usage tracking for API quota management

## Troubleshooting

### Common Issues
1. **"Invalid API Key"**: Check your `.env.local` file and ensure the key is correct
2. **"Rate Limit Exceeded"**: Wait a few minutes or upgrade your Gemini plan
3. **"Network Error"**: Check internet connection and Gemini service status
4. **Low Confidence Scores**: API may be struggling with content - fallback analysis is used

### Debug Mode
Set `NODE_ENV=development` to see detailed logs of Gemini API interactions.

## Cost Optimization
- Uses `gemini-1.5-flash` model for cost efficiency
- Implements intelligent caching for repeated analyses
- Batches requests when possible
- Falls back to local analysis to reduce API calls

## Future Enhancements
- Multi-language sentiment analysis
- Advanced topic modeling
- Debate outcome prediction
- Participant behavior analysis
- Custom model fine-tuning