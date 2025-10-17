const fetch = require('node-fetch');

async function testAuth() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔐 Testing Authentication System...\n');
  
  // Test data
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User',
    role: 'citizen'
  };
  
  try {
    // Test 1: Signup
    console.log('1️⃣ Testing Signup...');
    const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const signupData = await signupResponse.json();
    console.log('Signup Status:', signupResponse.status);
    console.log('Signup Response:', signupData);
    
    if (signupResponse.status === 201) {
      console.log('✅ Signup successful!\n');
    } else if (signupResponse.status === 400 && signupData.error.includes('already exists')) {
      console.log('ℹ️ User already exists, proceeding to login test...\n');
    } else {
      console.log('❌ Signup failed!\n');
      return;
    }
    
    // Test 2: Login
    console.log('2️⃣ Testing Login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', loginData);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful!');
      console.log('🍪 Cookies set:', loginResponse.headers.get('set-cookie') ? 'Yes' : 'No');
    } else {
      console.log('❌ Login failed!');
    }
    
    // Test 3: Wrong password
    console.log('\n3️⃣ Testing Wrong Password...');
    const wrongPasswordResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: 'wrongpassword'
      })
    });
    
    const wrongPasswordData = await wrongPasswordResponse.json();
    console.log('Wrong Password Status:', wrongPasswordResponse.status);
    console.log('Wrong Password Response:', wrongPasswordData);
    
    if (wrongPasswordResponse.status === 401) {
      console.log('✅ Wrong password correctly rejected!');
    } else {
      console.log('❌ Wrong password test failed!');
    }
    
    console.log('\n🎉 Authentication tests completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAuth();