const axios = require('axios');

async function getOrCreateToken() {
  const unique = Date.now();
  const email = `cicl.test.${unique}@example.com`;
  const username = `testuser_${unique}`;
  const password = 'Password123!';

  // Try register
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      username,
      email,
      password,
      firstName: 'Test',
      lastName: 'User'
    }, { headers: { 'Content-Type': 'application/json' } });
    console.log('Registered test user:', res.data.user);
    return res.data.token;
  } catch (error) {
    console.warn('Registration failed, attempting login...', error.response?.data || error.message);
    // Attempt login with same credentials
    try {
      const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      }, { headers: { 'Content-Type': 'application/json' } });
      console.log('Login successful for test user');
      return loginRes.data.token;
    } catch (loginError) {
      console.error('Login failed as well:', loginError.response?.data || loginError.message);
      throw loginError;
    }
  }
}

async function testDuplicateCaseCreation() {
  try {
    const token = await getOrCreateToken();

    const minimalCaseData = {
      firstName: 'Duplicate',
      lastName: 'User',
      sex: 'Male',
      birthdate: '2000-01-01',
      address: 'Test Address',
      sourceOfReferral: 'Test Source',
      caseType: 'Blessed Rosalie Rendu',
      status: 'active'
    };

    console.log('Creating first case with name:', `${minimalCaseData.firstName} ${minimalCaseData.lastName}`);
    const res1 = await axios.post('http://localhost:5000/api/cases', minimalCaseData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    });
    console.log('First creation success (201 expected):', res1.status, res1.data?.id);

    console.log('Creating second case with the SAME name to verify duplicates are allowed...');
    const res2 = await axios.post('http://localhost:5000/api/cases', minimalCaseData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    });
    console.log('Second creation success (201 expected):', res2.status, res2.data?.id);

    console.log('Duplicate case creation verified: both requests succeeded with status 201.');
  } catch (error) {
    console.error('Duplicate creation test failed. Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.response?.data?.message || error.message);
    console.error('Full Error Data:', error.response?.data);
    console.error('Request Data:', error.config?.data);
  }
}

// Run the test
testDuplicateCaseCreation();