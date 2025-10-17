const fetch = require('node-fetch');

async function testProfileAPI() {
  try {
    console.log('Testing profile API...');
    
    const response = await fetch('http://localhost:3000/api/user/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add a test cookie if needed
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing profile API:', error);
  }
}

testProfileAPI();