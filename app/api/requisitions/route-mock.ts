import { NextRequest, NextResponse } from 'next/server'

// Mock requisitions data for testing
const mockRequisitions = [
  {
    id: '1',
    fullName: 'John Doe',
    employeeId: 'EMP001', 
    emailAddress: 'john@company.com',
    department: 'Engineering',
    purposeOfRequest: 'Laptop for development work',
    status: 1,
    approvedBy: null,
    approvedOn: null,
    createdAt: '2024-12-15T10:30:00.000Z',
    updatedAt: '2024-12-15T10:30:00.000Z'
  },
  {
    id: '2',
    fullName: 'John Doe',
    employeeId: 'EMP001',
    emailAddress: 'john@company.com', 
    department: 'Engineering',
    purposeOfRequest: 'Software license for project',
    status: 2,
    approvedBy: 'Mike Johnson',
    approvedOn: '2024-12-16T14:20:00.000Z',
    createdAt: '2024-12-14T09:15:00.000Z',
    updatedAt: '2024-12-16T14:20:00.000Z'
  },
  {
    id: '3',
    fullName: 'Mike Johnson',
    employeeId: 'HOD001',
    emailAddress: 'hod@company.com',
    department: 'Management', 
    purposeOfRequest: 'Office supplies for department',
    status: 1,
    approvedBy: null,
    approvedOn: null,
    createdAt: '2024-12-13T16:45:00.000Z',
    updatedAt: '2024-12-13T16:45:00.000Z'
  },
  {
    id: '4',
    fullName: 'Jane Smith',
    employeeId: 'EMP002',
    emailAddress: 'jane@company.com',
    department: 'Marketing',
    purposeOfRequest: 'Marketing materials for campaign', 
    status: 1,
    approvedBy: null,
    approvedOn: null,
    createdAt: '2024-12-12T11:30:00.000Z',
    updatedAt: '2024-12-12T11:30:00.000Z'
  }
]

// GET - Fetch all requisitions
export async function GET() {
  try {
    return NextResponse.json({ 
      success: true, 
      data: mockRequisitions 
    })
  } catch (error) {
    console.error('Error fetching requisitions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch requisitions'
      }, 
      { status: 500 }
    )
  }
}

// POST - Create a new requisition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, employeeId, emailAddress, department, purposeOfRequest } = body

    if (!fullName || !employeeId || !emailAddress || !department || !purposeOfRequest) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        }, 
        { status: 400 }
      )
    }

    const newRequisition = {
      id: String(mockRequisitions.length + 1),
      fullName,
      employeeId,
      emailAddress,
      department,
      purposeOfRequest,
      status: 1,
      approvedBy: null,
      approvedOn: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockRequisitions.push(newRequisition)
    
    return NextResponse.json({ 
      success: true, 
      data: newRequisition 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating requisition:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create requisition'
      }, 
      { status: 500 }
    )
  }
}