// Test script for comment analysis API
const testCommentAnalysis = async () => {
  try {
    const testComment = "I think carbon tax is a great idea for reducing emissions, but we need to make sure it doesn't hurt low-income families. Maybe we could have rebates?"
    
    const response = await fetch('http://localhost:3000/api/analyze-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: testComment,
        debateTitle: 'Climate Change Policy Discussion'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    console.log('✅ Comment Analysis Test Results:')
    console.log('Comment:', testComment)
    console.log('\n📊 Analysis Results:')
    console.log('Sentiment:', result.analysis.sentiment)
    console.log('Quality Scores:', result.analysis.analysis)
    console.log('Overall Scores:', result.analysis.scores)
    console.log('Classification:', result.analysis.classification)
    console.log('Key Points:', result.analysis.insights.key_points)
    console.log('Strengths:', result.analysis.insights.strengths)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCommentAnalysis()