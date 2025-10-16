# Reddit RSS Integration for VOX AI (Pushshift Removed)

## Overview

This document describes the Reddit RSS-only integration system for VOX AI. After removing Pushshift API integration due to IP restrictions for Indian users, the system now relies exclusively on RSS feeds to fetch Reddit posts and comments, process them with Gemini AI for sentiment analysis, and store the results in MongoDB for real-time debate insights.

## 🚀 Features

- **RSS Feed Fetching**: Retrieves Reddit posts from multiple subreddits using public RSS feeds
- **Comment Scraping**: Extracts top comments from Reddit posts using web scraping
- **AI Analysis**: Processes content with Gemini AI for sentiment, relevancy, quality, and engagement scoring
- **Real-time Storage**: Stores processed data in MongoDB with comprehensive indexing
- **Frontend Integration**: React components for data fetching, viewing, and trending analysis
- **Cron Scheduling**: Automated background fetching of trending keywords
- **Error Handling**: Robust error handling with retry mechanisms and rate limiting

## 📁 File Structure

```
├── lib/
│   ├── reddit-rss-service.ts          # Core RSS fetching and processing service
│   ├── reddit-rss-integration.ts      # High-level integration service
│   └── cron-service.ts               # Updated with RSS scheduling
├── models/
│   ├── RedditPost.ts                 # MongoDB model for Reddit posts
│   └── RedditComment.ts              # MongoDB model for Reddit comments
├── app/api/
│   └── reddit-rss/route.ts           # API endpoints for RSS integration
├── components/
│   ├── RedditDataFetcher.tsx         # Component for fetching Reddit data
│   ├── RedditDataViewer.tsx          # Component for viewing Reddit data
│   └── TrendingKeywords.tsx          # Component for trending keywords
├── scripts/
│   ├── test-reddit-rss.js            # Basic RSS functionality tests
│   └── test-full-integration.js      # Comprehensive integration tests
└── app/forums/page.tsx               # Updated forums page with RSS integration
```

## 🛠 Installation & Setup

### 1. Install Dependencies

```bash
npm install xml2js cheerio @types/xml2js @radix-ui/react-tabs @radix-ui/react-select
```

### 2. Environment Variables

Ensure these variables are set in your `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

### 3. Database Setup

The system will automatically create the required MongoDB collections and indexes when first run.

## 🔧 API Endpoints

### POST /api/reddit-rss

Fetch and process Reddit data for a keyword.

**Request Body:**
```json
{
  "keyword": "climate change",
  "subreddits": ["science", "environment"],
  "maxPosts": 20,
  "includeComments": true,
  "maxCommentsPerPost": 10,
  "forceRefresh": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "keyword": "climate change",
    "totalPosts": 15,
    "totalComments": 45,
    "totalStored": 60,
    "processingTime": 12500,
    "statistics": {
      "sentiment": {
        "positive": 25,
        "negative": 15,
        "neutral": 20
      },
      "topSubreddits": [
        {"name": "science", "count": 30},
        {"name": "environment", "count": 30}
      ]
    }
  }
}
```

### GET /api/reddit-rss

Retrieve stored Reddit data or get trending keywords.

**Query Parameters:**
- `action`: "data", "statistics", or "trending"
- `keyword`: Search keyword (required for "data" and "statistics")
- `type`: "posts", "comments", or "both" (default: "both")
- `limit`: Number of items to return (default: 50)
- `sortBy`: "weightedScore", "createdAt", or "redditScore"
- `sortOrder`: "asc" or "desc"
- `sentiment`: Filter by sentiment ("positive", "negative", "neutral")
- `subreddit`: Filter by subreddit
- `page`: Page number for pagination

**Examples:**

```bash
# Get trending keywords
GET /api/reddit-rss?action=trending&limit=10

# Get data for a keyword
GET /api/reddit-rss?action=data&keyword=climate%20change&limit=20&sortBy=weightedScore

# Get statistics for a keyword
GET /api/reddit-rss?action=statistics&keyword=artificial%20intelligence
```

## 🧩 Components Usage

### RedditDataFetcher

```tsx
import RedditDataFetcher from '@/components/RedditDataFetcher'

function MyPage() {
  const handleDataFetched = (result) => {
    console.log('Fetched:', result.data.totalStored, 'items')
  }

  return (
    <RedditDataFetcher onDataFetched={handleDataFetched} />
  )
}
```

### RedditDataViewer

```tsx
import RedditDataViewer from '@/components/RedditDataViewer'

function MyPage() {
  return (
    <RedditDataViewer keyword="climate change" />
  )
}
```

### TrendingKeywords

```tsx
import TrendingKeywords from '@/components/TrendingKeywords'

function MyPage() {
  const handleKeywordSelect = (keyword) => {
    console.log('Selected keyword:', keyword)
  }

  return (
    <TrendingKeywords onKeywordSelect={handleKeywordSelect} />
  )
}
```

## 🔄 Cron Scheduling

The system includes automated background fetching:

```typescript
// Enable auto-fetch for a keyword
const keyword = await Keyword.findOne({ keyword: 'climate change' })
keyword.autoFetch = true
keyword.fetchInterval = 6 // hours
await keyword.save()
```

The cron service will automatically fetch new data for keywords with `autoFetch: true`.

## 🧪 Testing

### Basic RSS Tests

```bash
node scripts/test-reddit-rss.js
```

### Full Integration Tests

```bash
# Start the development server first
npm run dev

# Run comprehensive tests
node scripts/test-full-integration.js
```

### Test Coverage

The test suite covers:
- RSS feed accessibility and parsing
- API endpoint functionality
- Data storage and retrieval
- AI analysis integration
- Performance benchmarks
- Error handling scenarios

## 📊 Data Models

### RedditPost

```typescript
interface IRedditPost {
  redditId: string
  title: string
  link: string
  author: string
  subreddit: string
  content?: string
  permalink: string
  redditScore: number
  keyword: string
  analysis: {
    sentiment: { classification: string, confidence: number }
    relevancy: { score: number, reasoning: string }
    quality: { overall_quality: number }
    engagement: { score: number }
    insights: { key_points: string[], stance: string, tone: string }
  }
  weightedScore: number
  processed: boolean
  isActive: boolean
}
```

### RedditComment

```typescript
interface IRedditComment {
  redditId: string
  postId: string
  author: string
  content: string
  permalink: string
  redditScore: number
  keyword: string
  subreddit: string
  analysis: { /* same as RedditPost */ }
  weightedScore: number
  processed: boolean
  isActive: boolean
}
```

## 🎯 AI Analysis

The system uses Gemini AI to analyze each post and comment for:

1. **Sentiment Analysis**: Positive, negative, or neutral classification with confidence scores
2. **Relevancy Scoring**: How relevant the content is to the search keyword (0-100)
3. **Quality Assessment**: Clarity, coherence, and informativeness scores
4. **Engagement Potential**: Likelihood to generate meaningful discussion
5. **Content Insights**: Key points, stance, tone, and credibility indicators
6. **Contributor Assessment**: Expertise level and contribution type

### Weighted Scoring

The system calculates a weighted score for each item:
- Relevancy: 40%
- Quality: 30%
- Sentiment: 20%
- Engagement: 10%

## 🔒 Security & Rate Limiting

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Built-in delays between RSS requests to avoid IP blocking
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Authentication**: JWT-based authentication for API access
- **Data Sanitization**: HTML content is cleaned and sanitized before storage

## 🚀 Performance Optimization

- **Efficient Indexing**: MongoDB indexes on frequently queried fields
- **Batch Processing**: Comments are processed in batches for better performance
- **Caching**: Recent data checks to avoid unnecessary re-fetching
- **Pagination**: API responses are paginated to handle large datasets
- **Background Processing**: Heavy AI analysis runs asynchronously

## 🐛 Troubleshooting

### Common Issues

1. **RSS Feed Access Denied**
   - Solution: Check User-Agent header and implement request delays

2. **Gemini AI Rate Limits**
   - Solution: Implement exponential backoff and batch processing

3. **MongoDB Connection Issues**
   - Solution: Verify connection string and network access

4. **Comment Scraping Failures**
   - Solution: Reddit's HTML structure may change; update selectors

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=reddit-rss:*
```

## 📈 Monitoring & Analytics

The system provides comprehensive analytics:
- Fetch success/failure rates
- Processing times and performance metrics
- Sentiment distribution across keywords
- Top performing subreddits
- Trending keyword identification
- User engagement patterns

## 🔮 Future Enhancements

1. **Real-time Streaming**: WebSocket integration for live updates
2. **Advanced Filtering**: Machine learning-based content filtering
3. **Multi-language Support**: Analysis in multiple languages
4. **Image Analysis**: OCR and image sentiment analysis
5. **Network Analysis**: User interaction and influence mapping
6. **Predictive Analytics**: Trend prediction and early warning systems

## 📝 License

This Reddit RSS integration is part of the VOX AI project and follows the same licensing terms.

## 🤝 Contributing

When contributing to the Reddit RSS integration:

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure error handling is robust
5. Test with various keywords and subreddits

## 📞 Support

For issues related to the Reddit RSS integration:

1. Check the test results and logs
2. Verify API endpoints are accessible
3. Ensure all dependencies are installed
4. Review MongoDB connection and indexes
5. Check Gemini AI API key and quotas

---

**Note**: This integration uses public Reddit RSS feeds and web scraping. Always respect Reddit's terms of service and implement appropriate rate limiting to avoid being blocked.