const fetch = require('node-fetch')

async function testApproval() {
  try {
    console.log('Testing approval API...')
    
    const response = await fetch('http://localhost:3000/api/requisitions/5', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 2,
        approvedBy: 'Test HOD',
        approvedOn: new Date().toISOString()
      })
    })
    
    const result = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testApproval()