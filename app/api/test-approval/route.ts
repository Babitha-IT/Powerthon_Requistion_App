import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST APPROVAL ENDPOINT ===')
    console.log('Testing with hardcoded values...')
    
    const testBody = {
      status: 2,
      approvedBy: "HOD Test",
      approvedOn: new Date().toISOString()
    }
    
    console.log('Test body:', JSON.stringify(testBody, null, 2))
    console.log('Body keys:', Object.keys(testBody))
    console.log('Status value:', testBody.status, '(type:', typeof testBody.status, ')')
    console.log('ApprovedBy value:', testBody.approvedBy, '(type:', typeof testBody.approvedBy, ')')
    console.log('Status === 2 check:', testBody.status === 2)
    console.log('ApprovedBy check:', !!testBody.approvedBy)
    console.log('Combined approval check:', testBody.status === 2 && !!testBody.approvedBy)
    
    // Now test the actual approval endpoint on requisition 3
    console.log('Testing actual approval API on requisition 3...')
    const response = await fetch('http://localhost:3000/api/requisitions/3', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBody)
    })
    
    const result = await response.json()
    console.log('Approval API result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({
      success: true,
      message: 'Test completed',
      testData: testBody,
      approvalResult: result,
      checks: {
        statusIs2: testBody.status === 2,
        hasApprovedBy: !!testBody.approvedBy,
        isApprovalRequest: testBody.status === 2 && !!testBody.approvedBy
      }
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requisitionId, approvedBy } = body
    
    console.log('=== MANUAL APPROVAL TEST ===')
    console.log('Requisition ID:', requisitionId)
    console.log('Approved By:', approvedBy)
    
    // Call the main approval API
    const approvalResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/requisitions/${requisitionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 2,
        approvedBy: approvedBy,
        approvedOn: new Date().toISOString()
      })
    })
    
    const result = await approvalResponse.json()
    console.log('Approval test result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Manual approval test completed',
      data: result
    })
  } catch (error) {
    console.error('Manual approval test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}