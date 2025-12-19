import { NextRequest, NextResponse } from 'next/server'

// Mock database for testing when actual DB is not available
const mockUsers = [
  {
    userid: 'EMP001',
    name: 'John Doe',
    emailid: 'john@company.com',
    password: 'password@123',
    userrole: 'employee'
  },
  {
    userid: 'HOD001', 
    name: 'Mike Johnson',
    emailid: 'hod@company.com',
    password: 'hod123',
    userrole: 'hod'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required' 
        },
        { status: 400 }
      )
    }

    // Find user in mock data
    const user = mockUsers.find(u => 
      u.emailid.toLowerCase() === email.toLowerCase() && 
      u.password === password
    )
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      )
    }

    // Return user data
    return NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      data: {
        id: user.userid,
        email: user.emailid,
        name: user.name,
        role: user.userrole
      }
    })

  } catch (error) {
    console.error('Login API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}