// Simple test for Reddit comment analysis API
const testSimple = async () => {
  try {
    console.log('Testing Reddit comment analysis API...')
    
    const response = await fetch('http://localhost:3000/api/analyze-reddit-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: "This is a test comment",
        keyword: 'test'
      })
    })

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('Error response:', errorText)
      return
    }

    const result = await response.json()
    console.log('✅ Success:', result)
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testSimple()