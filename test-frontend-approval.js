// Test the exact request that the frontend makes
async function testFrontendApprovalRequest() {
  try {
    console.log('Testing frontend approval request format...')
    
    const requestBody = {
      status: 2,
      approvedBy: "Test HOD Name",
      approvedOn: new Date().toISOString()
    }
    
    console.log('Request body that will be sent:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch('http://localhost:3000/api/requisitions/5', {
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('Response status:', response.status)
    const result = await response.json()
    console.log('Response data:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Run test if node environment
if (typeof window === 'undefined') {
  testFrontendApprovalRequest()
} else {
  console.log('Run this in Node.js environment')
}

// For browser testing
window.testApproval = testFrontendApprovalRequest