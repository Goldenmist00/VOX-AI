// Test script to measure comment analysis speed
const testAnalysisSpeed = async () => {
  const testComments = [
    "I think this is a great idea and we should implement it immediately.",
    "This won't work because of budget constraints and technical limitations.",
    "What about considering alternative approaches that might be more cost-effective?",
    "The data shows positive results but we need more research.",
    "I disagree with this approach completely."
  ]

  console.log('🚀 Testing Comment Analysis Speed...\n')

  for (let i = 0; i < testComments.length; i++) {
    const comment = testComments[i]
    const startTime = Date.now()
    
    try {
      const response = await fetch('http://localhost:3000/api/analyze-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: comment,
          debateTitle: 'Speed Test Debate'
        })
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Test ${i + 1}: ${duration}ms`)
        console.log(`   Comment: "${comment.substring(0, 50)}..."`)
        console.log(`   Sentiment: ${result.analysis.sentiment.overall} (${result.analysis.sentiment.confidence}% confidence)`)
        console.log(`   Overall Score: ${result.analysis.scores.overall_score}/100`)
        console.log('')
      } else {
        console.log(`❌ Test ${i + 1}: Failed (${duration}ms)`)
      }
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      console.log(`❌ Test ${i + 1}: Error after ${duration}ms - ${error.message}`)
    }
  }

  console.log('🏁 Speed test completed!')
}

testAnalysisSpeed()