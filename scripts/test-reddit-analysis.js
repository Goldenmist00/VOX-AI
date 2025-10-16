// Test script for Reddit comment analysis API
const testRedditCommentAnalysis = async () => {
  try {
    const testComment = "This is actually a really good point about climate change. I've been working in renewable energy for 5 years and can confirm that carbon pricing mechanisms like this have shown real results in other countries. The key is making sure the revenue gets recycled back to consumers."
    
    const response = await fetch('http://localhost:3000/api/analyze-reddit-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: testComment,
        keyword: 'climate change',
        subreddit: 'environment',
        postTitle: 'New Carbon Tax Proposal Discussion'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    console.log('✅ Reddit Comment Analysis Test Results:')
    console.log('Comment:', testComment.substring(0, 100) + '...')
    console.log('\n📊 Analysis Results:')
    console.log('Sentiment:', result.analysis.sentiment)
    console.log('Quality Scores:', result.analysis.quality)
    console.log('Relevancy:', result.analysis.relevancy)
    console.log('Engagement:', result.analysis.engagement)
    console.log('Insights:', result.analysis.insights)
    console.log('Contributor:', result.analysis.contributor)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testRedditCommentAnalysis()