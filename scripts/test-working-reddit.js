// Test with a working comment
const testWorking = async () => {
  try {
    console.log('Testing with working comment...')
    
    const response = await fetch('http://localhost:3000/api/analyze-reddit-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: "I think this is a great idea for climate action.",
        keyword: 'climate change'
      })
    })

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('Error response:', errorText.substring(0, 500))
      return
    }

    const result = await response.json()
    console.log('✅ Success!')
    console.log('Sentiment:', result.analysis.sentiment.classification)
    console.log('Quality:', result.analysis.quality.overall_quality)
    console.log('Stance:', result.analysis.insights.stance)
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testWorking()