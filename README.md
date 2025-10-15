# VOX AI - Debate Analysis Platform

A comprehensive AI-powered platform for analyzing discussions, debates, and policy documents to extract insights, sentiment analysis, and actionable recommendations.

## Features

- **Document Upload & Analysis**: Upload text documents, meeting transcripts, or debate records
- **AI-Powered Insights**: Comprehensive analysis using Google's Gemini AI
- **Sentiment Analysis**: Track positive, negative, and neutral sentiment across discussion points
- **Contributor Analysis**: Identify key contributors and their influence scores
- **Action Plan Generation**: AI-generated action plans for NGOs and policymakers
- **Real-time Processing**: Fast analysis with loading states and error handling

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini
3. Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: 
- Make sure your API key has access to the Gemini model
- The application uses `gemini-2.5-flash` as the default model (v1 API compatible)
- You can test your API connection at `/api/test-gemini` endpoint

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Upload and Analyze Documents

1. Navigate to the Upload page
2. Upload a text document (`.txt` files recommended)
3. Click "Analyze Document" to process with AI
4. View comprehensive analysis results including:
   - Discussion topic and key points
   - Sentiment analysis
   - Contributor leaderboard
   - AI-generated summary and recommendations

### Sample Document

Use the provided `sample-document.txt` file to test the analysis functionality. It contains a realistic city council meeting transcript about urban development policies.

## API Endpoints

### POST `/api/analyze`

Analyzes uploaded document content using Gemini AI.

**Request Body:**
```json
{
  "content": "Document text content",
  "actionPlanTopic": "Optional topic for action plan generation",
  "actionPlanSummary": "Optional summary for action plan generation"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "topic": { "title": "...", "description": "...", "category": "...", "date": "...", "duration": "..." },
    "mainPoints": [...],
    "contributors": [...],
    "summary": "...",
    "solution": "...",
    "sentiment": { "positive": 45, "neutral": 32, "negative": 23, "overall": "Balanced" },
    "insights": [...]
  },
  "actionPlan": [...]
}
```

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: Google Gemini AI
- **Deployment**: Vercel (recommended)

## Project Structure

```
├── app/
│   ├── analysis/          # Analysis results page
│   ├── api/analyze/       # API endpoint for document analysis
│   ├── dashboard/         # NGO/Policymaker dashboard
│   ├── forums/           # Discussion forums
│   ├── upload/           # Document upload page
│   └── page.tsx          # Home page
├── components/           # Reusable UI components
├── lib/
│   └── gemini-api.ts     # Gemini AI integration
└── public/              # Static assets
```

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

#### "Gemini model not available" Error
If you encounter a 404 error for the Gemini model:

1. **Check your API key**: Ensure your `GEMINI_API_KEY` is correctly set in `.env.local`
2. **Verify model access**: Make sure your API key has access to the specified model
3. **Check API quotas**: Ensure you haven't exceeded your API usage limits
4. **Test connection**: Visit `/api/test-gemini` to see available models and test your connection
5. **Try alternative models**: The application uses `gemini-2.5-flash` by default, which is compatible with the v1 API

#### API Key Issues
- Make sure the `.env.local` file is in the root directory
- Restart the development server after adding the API key
- Check that the API key doesn't have extra spaces or quotes

#### File Upload Issues
- Currently supports `.txt` files
- Ensure the file is not too large (recommended < 1MB for optimal performance)
- Check that the file contains readable text content

## Support

For issues or questions, please create an issue in the repository or contact the development team.
